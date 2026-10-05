export interface SoraRateRecord {
  date: string; // YYYY-MM-DD
  rate: number; // Overnight SORA in % (e.g. 3.1250)
  volumeSgdM: number; // S$ Millions transacted (e.g. 4250)
  percentile10?: number;
  percentile25?: number;
  percentile75?: number;
  percentile90?: number;
  soraIndex: number; // MAS SORA Index
  comp1m: number; // 1-Month Compounded SORA %
  comp3m: number; // 3-Month Compounded SORA %
  comp6m: number; // 6-Month Compounded SORA %
}

export type BenchmarkType = '3m_comp' | '1m_comp' | '6m_comp' | 'overnight' | 'custom';

export interface LoanParams {
  principal: number; // in SGD
  tenorYears: number; // 1 - 35
  benchmarkType: BenchmarkType;
  customBenchmarkRate: number; // in %
  bankSpread: number; // in % (e.g. 0.70%)
  repaymentType: 'amortizing' | 'interest_only';
  paymentFrequency: 'monthly' | 'biweekly' | 'annually';
  startDate: string; // YYYY-MM
}

export interface AmortizationPeriod {
  period: number;
  dateStr: string;
  payment: number;
  principalPaid: number;
  interestPaid: number;
  remainingBalance: number;
  cumulativeInterest: number;
}

export interface LoanSummary {
  monthlyPayment: number;
  effectiveRate: number;
  benchmarkRate: number;
  bankSpread: number;
  totalInterest: number;
  totalPayment: number;
  schedule: AmortizationPeriod[];
}

export interface DailyCompoundingParams {
  principal: number;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  dayCountConvention: 'ACT/365' | 'ACT/360';
  lookbackDays: number; // 0, 2, 5 business days
  spreadBps: number; // basis points (e.g. 50 bps = 0.5%)
}

export interface DailyCompoundingRow {
  date: string;
  fixingDate: string;
  rate: number;
  weightDays: number;
  factor: number;
  cumulativeFactor: number;
  periodInterest: number;
  cumulativeInterest: number;
}

export interface DailyCompoundingResult {
  compoundedRateAnnualized: number;
  effectiveAllInRate: number;
  totalAccruedInterest: number;
  calendarDays: number;
  businessDays: number;
  rows: DailyCompoundingRow[];
}

export interface StressScenario {
  label: string;
  deltaBps: number;
  allInRate: number;
  monthlyPayment: number;
  monthlyDiff: number;
  annualInterestDiff: number;
  isMasStressFloor?: boolean;
}

export interface MasApiConfig {
  mode: 'cached' | 'backend_proxy';
  proxyUrl: string;
  customApiKey: string;
  lastUpdated: string;
  status: 'connected' | 'offline' | 'error';
  totalRecords: number;
}
