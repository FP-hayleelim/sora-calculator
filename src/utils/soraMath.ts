import {
  AmortizationPeriod,
  BenchmarkType,
  DailyCompoundingParams,
  DailyCompoundingResult,
  DailyCompoundingRow,
  LoanParams,
  LoanSummary,
  SoraRateRecord,
  StressScenario,
} from '../types/sora';
import { getBusinessDayWeight } from '../data/masSoraRates';

/**
 * Format SGD currency with standard Singapore notation
 */
export function formatSGD(amount: number, showCents = false): string {
  if (isNaN(amount) || !isFinite(amount)) return 'S$ 0';
  return new Intl.NumberFormat('en-SG', {
    style: 'currency',
    currency: 'SGD',
    minimumFractionDigits: showCents ? 2 : 0,
    maximumFractionDigits: showCents ? 2 : 0,
  }).format(amount);
}

/**
 * Format percentage with 2-4 decimal places
 */
export function formatPercent(rate: number, decimals = 2): string {
  if (isNaN(rate) || !isFinite(rate)) return '0.00%';
  return `${rate.toFixed(decimals)}%`;
}

/**
 * Format 4 decimal places as per MAS SORA market convention
 */
export function formatSoraRate(rate: number): string {
  if (isNaN(rate) || !isFinite(rate)) return '0.0000%';
  return `${rate.toFixed(4)}%`;
}

/**
 * Resolve benchmark rate value from selection and latest MAS record
 */
export function resolveBenchmarkRate(type: BenchmarkType, record: SoraRateRecord, customRate: number): number {
  switch (type) {
    case '1m_comp':
      return record.comp1m;
    case '3m_comp':
      return record.comp3m;
    case '6m_comp':
      return record.comp6m;
    case 'overnight':
      return record.rate;
    case 'custom':
      return customRate;
    default:
      return record.comp3m;
  }
}

/**
 * Calculate standard mortgage / term loan amortization
 */
export function calculateLoanSummary(params: LoanParams, latestRecord: SoraRateRecord): LoanSummary {
  const benchmarkRate = resolveBenchmarkRate(params.benchmarkType, latestRecord, params.customBenchmarkRate);
  const effectiveRate = benchmarkRate + params.bankSpread;
  const principal = Math.max(0, params.principal);
  const totalMonths = Math.max(1, Math.round(params.tenorYears * 12));
  
  const monthlyRate = effectiveRate / 100 / 12;

  let monthlyPayment = 0;
  if (params.repaymentType === 'interest_only') {
    monthlyPayment = principal * monthlyRate;
  } else {
    if (monthlyRate === 0) {
      monthlyPayment = principal / totalMonths;
    } else {
      // M = P * r * (1+r)^n / ((1+r)^n - 1)
      const factor = Math.pow(1 + monthlyRate, totalMonths);
      monthlyPayment = (principal * monthlyRate * factor) / (factor - 1);
    }
  }

  // Adjust for frequency
  if (params.paymentFrequency === 'biweekly') {
    monthlyPayment = (monthlyPayment * 12) / 26;
  } else if (params.paymentFrequency === 'annually') {
    monthlyPayment = monthlyPayment * 12;
  }

  const periodsCount = params.paymentFrequency === 'biweekly' 
    ? params.tenorYears * 26 
    : params.paymentFrequency === 'annually'
      ? params.tenorYears
      : totalMonths;

  const periodicRate = params.paymentFrequency === 'biweekly'
    ? (effectiveRate / 100 / 26)
    : params.paymentFrequency === 'annually'
      ? (effectiveRate / 100)
      : monthlyRate;

  let balance = principal;
  let cumulativeInterest = 0;
  const schedule: AmortizationPeriod[] = [];

  const [startYear, startMonth] = (params.startDate || '2026-10').split('-').map(Number);
  const startD = new Date(Date.UTC(startYear, startMonth - 1, 1));

  for (let i = 1; i <= periodsCount; i++) {
    const interestPayment = balance * periodicRate;
    let principalPayment = monthlyPayment - interestPayment;

    if (params.repaymentType === 'interest_only') {
      principalPayment = (i === periodsCount) ? balance : 0;
    }

    if (principalPayment > balance || i === periodsCount) {
      principalPayment = balance;
    }

    balance = Math.max(0, balance - principalPayment);
    cumulativeInterest += interestPayment;

    const currentPeriodDate = new Date(startD);
    if (params.paymentFrequency === 'biweekly') {
      currentPeriodDate.setUTCDate(startD.getUTCDate() + (i - 1) * 14);
    } else if (params.paymentFrequency === 'annually') {
      currentPeriodDate.setUTCFullYear(startD.getUTCFullYear() + (i - 1));
    } else {
      currentPeriodDate.setUTCMonth(startD.getUTCMonth() + (i - 1));
    }

    const dateStr = currentPeriodDate.toISOString().slice(0, 7);

    schedule.push({
      period: i,
      dateStr,
      payment: principalPayment + interestPayment,
      principalPaid: principalPayment,
      interestPaid: interestPayment,
      remainingBalance: balance,
      cumulativeInterest,
    });

    if (balance <= 0 && params.repaymentType !== 'interest_only') {
      break;
    }
  }

  const totalInterest = cumulativeInterest;
  const totalPayment = principal + totalInterest;

  return {
    monthlyPayment,
    effectiveRate,
    benchmarkRate,
    bankSpread: params.bankSpread,
    totalInterest,
    totalPayment,
    schedule,
  };
}

/**
 * Calculate Daily Compounded in Arrears interest over a date range
 * Uses standard MAS / ISDA Compounded SORA formula with Actual/365 (or Actual/360)
 */
export function calculateCompoundedSoraInArrears(
  params: DailyCompoundingParams,
  dataset: SoraRateRecord[]
): DailyCompoundingResult {
  const basis = params.dayCountConvention === 'ACT/360' ? 360 : 365;
  const rateMap = new Map<string, number>();
  
  // Sort dataset ascending
  const sorted = [...dataset].sort((a, b) => a.date.localeCompare(b.date));
  sorted.forEach(r => rateMap.set(r.date, r.rate));

  const start = new Date(params.startDate);
  const end = new Date(params.endDate);

  // If start > end, swap or return empty
  if (start >= end) {
    return {
      compoundedRateAnnualized: 0,
      effectiveAllInRate: 0,
      totalAccruedInterest: 0,
      calendarDays: 0,
      businessDays: 0,
      rows: [],
    };
  }

  // Filter business days within range
  const businessDates = sorted
    .map(r => r.date)
    .filter(d => d >= params.startDate && d <= params.endDate);

  // If observation shift / lookback is applied:
  // Shift fixing index backwards by lookbackDays
  const rows: DailyCompoundingRow[] = [];
  let cumulativeCompoundedFactor = 1.0;
  let totalCalendarDays = 0;
  let businessDaysCount = 0;

  for (let idx = 0; idx < businessDates.length; idx++) {
    const curDate = businessDates[idx];
    
    // Lookback index
    let fixingDate = curDate;
    if (params.lookbackDays > 0) {
      const fixingIdx = Math.max(0, idx - params.lookbackDays);
      fixingDate = businessDates[fixingIdx];
    }

    const rateVal = rateMap.get(fixingDate) || sorted[0].rate;
    const weightDays = getBusinessDayWeight(curDate);
    totalCalendarDays += weightDays;
    businessDaysCount++;

    // Daily compounding factor = 1 + (r_i * n_i / basis)
    const factor = 1 + (rateVal / 100 * weightDays / basis);
    cumulativeCompoundedFactor *= factor;

    // Accrued interest on principal
    const spreadDecimal = (params.spreadBps / 10000);
    const dayInterest = params.principal * (
      ((cumulativeCompoundedFactor - 1) * (basis / totalCalendarDays)) / 100 * (weightDays / basis) 
      + spreadDecimal * (weightDays / basis)
    );
    
    const cumulativeInterest = params.principal * (cumulativeCompoundedFactor - 1) 
      + (params.principal * spreadDecimal * (totalCalendarDays / basis));

    rows.push({
      date: curDate,
      fixingDate,
      rate: rateVal,
      weightDays,
      factor,
      cumulativeFactor: cumulativeCompoundedFactor,
      periodInterest: dayInterest,
      cumulativeInterest,
    });
  }

  const calendarDays = Math.max(1, totalCalendarDays);
  // Annualized compounded rate = [ (Product - 1) * (basis / d) ] * 100%
  const compoundedRateAnnualized = (cumulativeCompoundedFactor - 1) * (basis / calendarDays) * 100;
  const spreadPercent = params.spreadBps / 100;
  const effectiveAllInRate = compoundedRateAnnualized + spreadPercent;

  const totalAccruedInterest = params.principal * (cumulativeCompoundedFactor - 1) 
    + (params.principal * (params.spreadBps / 10000) * (calendarDays / basis));

  return {
    compoundedRateAnnualized,
    effectiveAllInRate,
    totalAccruedInterest,
    calendarDays,
    businessDays: businessDaysCount,
    rows,
  };
}

/**
 * Calculate Stress Scenarios including MAS Regulatory Stress Floor (4.00% p.a.)
 */
export function calculateStressScenarios(
  principal: number,
  tenorYears: number,
  baseRate: number
): StressScenario[] {
  const deltas = [-1.0, -0.5, 0, 0.5, 1.0, 1.5, 2.0];
  
  // Base monthly payment
  const baseMonthly = calculateMonthlyPayment(principal, tenorYears, baseRate);

  const scenarios: StressScenario[] = deltas.map(delta => {
    const rate = Math.max(0.1, baseRate + delta);
    const monthlyPayment = calculateMonthlyPayment(principal, tenorYears, rate);
    const monthlyDiff = monthlyPayment - baseMonthly;
    const annualInterestDiff = monthlyDiff * 12;

    const label = delta === 0 
      ? 'Current Rate (Baseline)' 
      : delta > 0 
        ? `+${Math.round(delta * 100)} bps` 
        : `${Math.round(delta * 100)} bps`;

    return {
      label,
      deltaBps: Math.round(delta * 100),
      allInRate: rate,
      monthlyPayment,
      monthlyDiff,
      annualInterestDiff,
      isMasStressFloor: false,
    };
  });

  // Add MAS Medium-Term Stress Rate Floor (MAS requires min 4.00% p.a. for residential loans)
  const masStressRate = 4.00;
  if (!scenarios.some(s => Math.abs(s.allInRate - masStressRate) < 0.05)) {
    const masMonthly = calculateMonthlyPayment(principal, tenorYears, masStressRate);
    scenarios.push({
      label: 'MAS Regulatory Stress Test (Floor: 4.00%)',
      deltaBps: Math.round((masStressRate - baseRate) * 100),
      allInRate: masStressRate,
      monthlyPayment: masMonthly,
      monthlyDiff: masMonthly - baseMonthly,
      annualInterestDiff: (masMonthly - baseMonthly) * 12,
      isMasStressFloor: true,
    });
  }

  return scenarios.sort((a, b) => a.allInRate - b.allInRate);
}

function calculateMonthlyPayment(principal: number, tenorYears: number, annualRate: number): number {
  if (principal <= 0 || tenorYears <= 0) return 0;
  const n = tenorYears * 12;
  const r = annualRate / 100 / 12;
  if (r === 0) return principal / n;
  const factor = Math.pow(1 + r, n);
  return (principal * r * factor) / (factor - 1);
}

/**
 * MAS TDSR Calculator: Minimum gross monthly income required to satisfy 55% Total Debt Servicing Ratio limit
 */
export function calculateRequiredIncomeTDSR(monthlyCommitment: number, existingOtherDebts = 0): number {
  const totalMonthlyDebt = monthlyCommitment + existingOtherDebts;
  // TDSR <= 55%  => Income >= totalMonthlyDebt / 0.55
  return totalMonthlyDebt / 0.55;
}

/**
 * MAS MSR Calculator: Minimum gross monthly income required to satisfy 30% Mortgage Servicing Ratio limit (for HDB / EC)
 */
export function calculateRequiredIncomeMSR(monthlyPropertyPayment: number): number {
  // MSR <= 30% => Income >= monthlyPropertyPayment / 0.30
  return monthlyPropertyPayment / 0.30;
}
