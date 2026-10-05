import React, { useState, useMemo } from 'react';
import {
  LoanParams,
  BenchmarkType,
  SoraRateRecord,
  AmortizationPeriod,
} from '../types/sora';
import {
  calculateLoanSummary,
  formatSGD,
  formatPercent,
  formatSoraRate,
  resolveBenchmarkRate,
} from '../utils/soraMath';
import {
  Calculator,
  Calendar,
  Layers,
  Percent,
  ChevronDown,
  ChevronUp,
  Download,
  Info,
  ArrowRight,
} from 'lucide-react';

interface LoanMortgageCalculatorProps {
  latestRecord: SoraRateRecord;
  selectedBenchmark: BenchmarkType;
  onBenchmarkChange: (type: BenchmarkType) => void;
  onNavigateToStress: () => void;
}

export const LoanMortgageCalculator: React.FC<LoanMortgageCalculatorProps> = ({
  latestRecord,
  selectedBenchmark,
  onBenchmarkChange,
  onNavigateToStress,
}) => {
  const [principal, setPrincipal] = useState<number>(1000000); // 1,000,000 SGD default
  const [tenorYears, setTenorYears] = useState<number>(25);
  const [bankSpread, setBankSpread] = useState<number>(0.75); // 0.75% typical Singapore bank spread
  const [customBenchmarkRate, setCustomBenchmarkRate] = useState<number>(3.15);
  const [repaymentType, setRepaymentType] = useState<'amortizing' | 'interest_only'>('amortizing');
  const [paymentFrequency, setPaymentFrequency] = useState<'monthly' | 'biweekly' | 'annually'>('monthly');
  const [startDate, setStartDate] = useState<string>('2026-11');
  const [viewScheduleMode, setViewScheduleMode] = useState<'annual' | 'monthly'>('annual');
  const [isScheduleOpen, setIsScheduleOpen] = useState<boolean>(true);

  // Quick preset principals
  const quickPrincipals = [
    { label: 'S$ 500K', value: 500000 },
    { label: 'S$ 800K', value: 800000 },
    { label: 'S$ 1.0M', value: 1000000 },
    { label: 'S$ 1.5M', value: 1500000 },
    { label: 'S$ 2.0M', value: 2000000 },
  ];

  // Quick spreads
  const quickSpreads = [
    { label: '+0.60%', value: 0.60 },
    { label: '+0.70%', value: 0.70 },
    { label: '+0.75%', value: 0.75 },
    { label: '+0.85%', value: 0.85 },
    { label: '+1.00%', value: 1.00 },
  ];

  const params: LoanParams = {
    principal,
    tenorYears,
    benchmarkType: selectedBenchmark,
    customBenchmarkRate,
    bankSpread,
    repaymentType,
    paymentFrequency,
    startDate,
  };

  const summary = useMemo(() => {
    return calculateLoanSummary(params, latestRecord);
  }, [params, latestRecord]);

  // Aggregate annual schedule for clearer executive view
  const annualSchedule = useMemo(() => {
    const yearsMap = new Map<number, {
      yearNum: number;
      yearLabel: string;
      totalPayment: number;
      principalPaid: number;
      interestPaid: number;
      endingBalance: number;
      cumulativeInterest: number;
    }>();

    const [startYear] = (startDate || '2026-10').split('-').map(Number);

    summary.schedule.forEach((p, idx) => {
      const yearIdx = Math.floor(idx / 12) + 1;
      const actualCalYear = startYear + Math.floor(idx / 12);
      
      const existing = yearsMap.get(yearIdx) || {
        yearNum: yearIdx,
        yearLabel: `Year ${yearIdx} (${actualCalYear})`,
        totalPayment: 0,
        principalPaid: 0,
        interestPaid: 0,
        endingBalance: p.remainingBalance,
        cumulativeInterest: p.cumulativeInterest,
      };

      existing.totalPayment += p.payment;
      existing.principalPaid += p.principalPaid;
      existing.interestPaid += p.interestPaid;
      existing.endingBalance = p.remainingBalance;
      existing.cumulativeInterest = p.cumulativeInterest;

      yearsMap.set(yearIdx, existing);
    });

    return Array.from(yearsMap.values());
  }, [summary.schedule, startDate]);

  // CSV Export
  const handleExportCsv = () => {
    const rows = [
      ['Singapore SORA Loan Schedule Report'],
      [`Principal: ${formatSGD(principal)}`],
      [`Benchmark: ${selectedBenchmark} (${formatPercent(summary.benchmarkRate, 4)})`],
      [`Bank Spread: ${formatPercent(bankSpread, 2)}`],
      [`All-in Effective Rate: ${formatPercent(summary.effectiveRate, 4)}`],
      [`Tenor: ${tenorYears} Years`],
      [`Monthly Payment: ${formatSGD(summary.monthlyPayment, true)}`],
      [`Total Interest: ${formatSGD(summary.totalInterest, true)}`],
      [],
      ['Period', 'Date', 'Payment (SGD)', 'Principal Paid', 'Interest Paid', 'Remaining Balance', 'Cumulative Interest'],
      ...summary.schedule.map((row) => [
        row.period,
        row.dateStr,
        row.payment.toFixed(2),
        row.principalPaid.toFixed(2),
        row.interestPaid.toFixed(2),
        row.remainingBalance.toFixed(2),
        row.cumulativeInterest.toFixed(2),
      ]),
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SORA_Loan_Schedule_${principal}_SGD.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const principalRatio = summary.totalPayment > 0 ? (principal / summary.totalPayment) * 100 : 0;
  const interestRatio = 100 - principalRatio;

  return (
    <div className="space-y-6">
      {/* Top contextual kicker */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Singapore SORA Loan & Mortgage Calculator
          </h2>
          <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
            <span>MAS Official Compounded Index</span>
            <span aria-hidden="true">·</span>
            <span>ACT/365 Singapore Market Basis</span>
            <span aria-hidden="true">·</span>
            <span>Monthly Compounding Schedule</span>
          </div>
        </div>

        <button
          onClick={onNavigateToStress}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded transition-colors self-start sm:self-auto"
        >
          <span>MAS TDSR Stress Test</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Inputs (5 cols) */}
        <div className="lg:col-span-5 space-y-5 bg-white p-5 rounded-lg border border-slate-200 shadow-xs">
          {/* Principal Amount Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="principal-input" className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                Loan Principal (SGD)
              </label>
              <span className="text-xs font-mono text-slate-500">
                {formatSGD(principal)}
              </span>
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-mono text-sm">
                S$
              </div>
              <input
                id="principal-input"
                type="number"
                min="10000"
                step="10000"
                value={principal || ''}
                onChange={(e) => setPrincipal(Math.max(0, Number(e.target.value)))}
                className="w-full pl-9 pr-3 py-2 text-sm font-mono border border-slate-300 rounded-md focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900"
                placeholder="1000000"
              />
            </div>

            {/* Quick chips */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {quickPrincipals.map((chip) => (
                <button
                  key={chip.value}
                  type="button"
                  onClick={() => setPrincipal(chip.value)}
                  className={`text-xs px-2.5 py-1 rounded transition-colors font-mono tabular-nums ${
                    principal === chip.value
                      ? 'bg-slate-900 text-white font-medium'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tenor Years */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label htmlFor="tenor-input" className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                Loan Tenor
              </label>
              <span className="text-xs font-mono font-medium text-slate-800">
                {tenorYears} Years ({tenorYears * 12} Months)
              </span>
            </div>

            <div className="flex items-center gap-3">
              <input
                id="tenor-slider"
                type="range"
                min="1"
                max="35"
                value={tenorYears}
                onChange={(e) => setTenorYears(Number(e.target.value))}
                className="flex-1 accent-slate-900 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
              />
              <div className="w-20">
                <input
                  id="tenor-input"
                  type="number"
                  min="1"
                  max="35"
                  value={tenorYears}
                  onChange={(e) => setTenorYears(Math.min(35, Math.max(1, Number(e.target.value))))}
                  className="w-full text-center py-1 px-2 text-xs font-mono border border-slate-300 rounded focus:ring-1 focus:ring-emerald-500 text-slate-900"
                />
              </div>
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>1 Year</span>
              <span>15 Years</span>
              <span>25 Years (MAS HDB Max)</span>
              <span>30 Years (Private Max)</span>
              <span>35 Y</span>
            </div>
          </div>

          {/* SORA Benchmark Selection */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                SORA Benchmark Type
              </label>
              <span className="text-xs font-mono text-emerald-700 font-semibold">
                {formatSoraRate(summary.benchmarkRate)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onBenchmarkChange('3m_comp')}
                className={`p-2 rounded text-left border transition-all ${
                  selectedBenchmark === '3m_comp'
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-200 bg-slate-50 text-slate-800 hover:bg-slate-100'
                }`}
              >
                <div className="text-[11px] font-medium leading-none">3M Compounded SORA</div>
                <div className="text-[10px] opacity-75 mt-1 font-mono">
                  {formatSoraRate(latestRecord.comp3m)} · Bank Standard
                </div>
              </button>

              <button
                type="button"
                onClick={() => onBenchmarkChange('1m_comp')}
                className={`p-2 rounded text-left border transition-all ${
                  selectedBenchmark === '1m_comp'
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-200 bg-slate-50 text-slate-800 hover:bg-slate-100'
                }`}
              >
                <div className="text-[11px] font-medium leading-none">1M Compounded SORA</div>
                <div className="text-[10px] opacity-75 mt-1 font-mono">
                  {formatSoraRate(latestRecord.comp1m)}
                </div>
              </button>

              <button
                type="button"
                onClick={() => onBenchmarkChange('6m_comp')}
                className={`p-2 rounded text-left border transition-all ${
                  selectedBenchmark === '6m_comp'
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-200 bg-slate-50 text-slate-800 hover:bg-slate-100'
                }`}
              >
                <div className="text-[11px] font-medium leading-none">6M Compounded SORA</div>
                <div className="text-[10px] opacity-75 mt-1 font-mono">
                  {formatSoraRate(latestRecord.comp6m)}
                </div>
              </button>

              <button
                type="button"
                onClick={() => onBenchmarkChange('custom')}
                className={`p-2 rounded text-left border transition-all ${
                  selectedBenchmark === 'custom'
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-200 bg-slate-50 text-slate-800 hover:bg-slate-100'
                }`}
              >
                <div className="text-[11px] font-medium leading-none">Custom Fixing Rate</div>
                <div className="text-[10px] opacity-75 mt-1 font-mono">
                  Manual Input (%)
                </div>
              </button>
            </div>

            {selectedBenchmark === 'custom' && (
              <div className="pt-2">
                <label className="text-[11px] text-slate-600 block mb-1">
                  Custom Benchmark SORA Rate (% p.a.)
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={customBenchmarkRate}
                  onChange={(e) => setCustomBenchmarkRate(Number(e.target.value))}
                  className="w-full py-1.5 px-3 text-sm font-mono border border-slate-300 rounded focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            )}
          </div>

          {/* Bank Spread / Margin */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label htmlFor="spread-input" className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                Bank Spread / Margin (% p.a.)
              </label>
              <span className="text-xs font-mono font-medium text-slate-800">
                +{formatPercent(bankSpread, 2)}
              </span>
            </div>

            <div className="relative">
              <input
                id="spread-input"
                type="number"
                step="0.05"
                min="0"
                max="5"
                value={bankSpread}
                onChange={(e) => setBankSpread(Math.max(0, Number(e.target.value)))}
                className="w-full py-2 px-3 text-sm font-mono border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-500 text-slate-900"
                placeholder="0.75"
              />
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {quickSpreads.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setBankSpread(s.value)}
                  className={`text-xs px-2.5 py-1 rounded transition-colors font-mono tabular-nums ${
                    bankSpread === s.value
                      ? 'bg-slate-900 text-white font-medium'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Repayment Structure & Frequency */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 block mb-1.5">
                Repayment Type
              </label>
              <div className="flex p-0.5 bg-slate-100 rounded-md border border-slate-200">
                <button
                  type="button"
                  onClick={() => setRepaymentType('amortizing')}
                  className={`flex-1 py-1 text-xs font-medium rounded transition-colors ${
                    repaymentType === 'amortizing'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Principal + Int
                </button>
                <button
                  type="button"
                  onClick={() => setRepaymentType('interest_only')}
                  className={`flex-1 py-1 text-xs font-medium rounded transition-colors ${
                    repaymentType === 'interest_only'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Interest Only
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 block mb-1.5">
                First Payment Date
              </label>
              <input
                type="month"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full py-1 px-2.5 text-xs font-mono border border-slate-300 rounded focus:ring-1 focus:ring-emerald-500 text-slate-900"
              />
            </div>
          </div>
        </div>

        {/* Right Column: High-Impact Financial Results & Schedule (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Main Key Figures Card */}
          <div className="bg-slate-900 text-white p-6 rounded-lg shadow-sm border border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block mb-1">
                  Monthly Installment (SGD)
                </span>
                <div className="text-3xl sm:text-4xl font-extrabold font-mono tabular-nums text-white tracking-tight">
                  {formatSGD(summary.monthlyPayment, true)}
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  Effective All-In Rate: <span className="font-semibold text-emerald-400 font-mono">{formatPercent(summary.effectiveRate, 4)} p.a.</span>
                </div>
              </div>

              {/* Rate Breakdown Pill */}
              <div className="bg-slate-800/90 border border-slate-700 p-3 rounded text-right space-y-1">
                <div className="text-xs text-slate-400 flex items-center justify-between gap-3">
                  <span>SORA Benchmark:</span>
                  <span className="font-mono text-white font-medium">{formatPercent(summary.benchmarkRate, 4)}</span>
                </div>
                <div className="text-xs text-slate-400 flex items-center justify-between gap-3">
                  <span>Bank Margin:</span>
                  <span className="font-mono text-emerald-400 font-medium">+{formatPercent(summary.bankSpread, 2)}</span>
                </div>
                <div className="border-t border-slate-700 pt-1 text-xs font-semibold text-white flex items-center justify-between gap-3">
                  <span>All-in APR:</span>
                  <span className="font-mono text-emerald-300">{formatPercent(summary.effectiveRate, 4)}</span>
                </div>
              </div>
            </div>

            {/* Total Interest & Repayment Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-5">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-slate-400 font-mono">
                  Total Interest Paid
                </div>
                <div className="text-lg font-bold font-mono text-amber-300 tabular-nums mt-0.5">
                  {formatSGD(summary.totalInterest)}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  {(summary.totalInterest / principal * 100).toFixed(1)}% of loan principal
                </div>
              </div>

              <div>
                <div className="text-[11px] uppercase tracking-wider text-slate-400 font-mono">
                  Total Cost of Loan
                </div>
                <div className="text-lg font-bold font-mono text-white tabular-nums mt-0.5">
                  {formatSGD(summary.totalPayment)}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Principal + all interest
                </div>
              </div>

              <div className="col-span-2 sm:col-span-1">
                <div className="text-[11px] uppercase tracking-wider text-slate-400 font-mono">
                  Annual Interest (Yr 1)
                </div>
                <div className="text-lg font-bold font-mono text-slate-200 tabular-nums mt-0.5">
                  {formatSGD(principal * (summary.effectiveRate / 100))}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  ~{formatSGD((principal * (summary.effectiveRate / 100)) / 12)} / month interest
                </div>
              </div>
            </div>

            {/* Visual Progress Bar: Principal vs Interest split */}
            <div className="pt-5 mt-2 border-t border-slate-800">
              <div className="flex justify-between text-xs font-mono text-slate-300 mb-1.5">
                <span>Principal: {principalRatio.toFixed(1)}%</span>
                <span>Interest: {interestRatio.toFixed(1)}%</span>
              </div>
              <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden flex">
                <div
                  style={{ width: `${principalRatio}%` }}
                  className="bg-emerald-500 h-full transition-all duration-300"
                  title="Principal"
                />
                <div
                  style={{ width: `${interestRatio}%` }}
                  className="bg-amber-400 h-full transition-all duration-300"
                  title="Interest"
                />
              </div>
            </div>
          </div>

          {/* Amortization Schedule Accordion / Table */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-700" />
                <h3 className="text-sm font-bold text-slate-900">
                  Amortization Schedule
                </h3>
                <span className="text-xs text-slate-500">
                  ({viewScheduleMode === 'annual' ? `${annualSchedule.length} Years` : `${summary.schedule.length} Months`})
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Segmented control for annual / monthly */}
                <div className="flex p-0.5 bg-slate-200/80 rounded border border-slate-300/80 text-xs">
                  <button
                    type="button"
                    onClick={() => setViewScheduleMode('annual')}
                    className={`px-2.5 py-1 rounded transition-colors font-medium ${
                      viewScheduleMode === 'annual'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Annual Summary
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewScheduleMode('monthly')}
                    className={`px-2.5 py-1 rounded transition-colors font-medium ${
                      viewScheduleMode === 'monthly'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Monthly Detail
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded transition-colors"
                  title="Export Amortization Table to CSV"
                >
                  <Download className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setIsScheduleOpen(!isScheduleOpen)}
                  className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded transition-colors"
                >
                  {isScheduleOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {isScheduleOpen && (
              <div className="max-h-96 overflow-y-auto overflow-x-auto">
                {viewScheduleMode === 'annual' ? (
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 text-slate-700 font-semibold sticky top-0 border-b border-slate-200 z-10">
                      <tr>
                        <th className="py-2.5 px-3">Timeline</th>
                        <th className="py-2.5 px-3 text-right">Annual Payment</th>
                        <th className="py-2.5 px-3 text-right">Principal</th>
                        <th className="py-2.5 px-3 text-right">Interest</th>
                        <th className="py-2.5 px-3 text-right">Ending Balance</th>
                        <th className="py-2.5 px-3 text-right">Total Interest to Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono tabular-nums">
                      {annualSchedule.map((row) => (
                        <tr key={row.yearNum} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-2 px-3 font-sans font-medium text-slate-900">
                            {row.yearLabel}
                          </td>
                          <td className="py-2 px-3 text-right text-slate-800">
                            {formatSGD(row.totalPayment)}
                          </td>
                          <td className="py-2 px-3 text-right text-emerald-700 font-medium">
                            {formatSGD(row.principalPaid)}
                          </td>
                          <td className="py-2 px-3 text-right text-amber-700">
                            {formatSGD(row.interestPaid)}
                          </td>
                          <td className="py-2 px-3 text-right font-semibold text-slate-900">
                            {formatSGD(row.endingBalance)}
                          </td>
                          <td className="py-2 px-3 text-right text-slate-500">
                            {formatSGD(row.cumulativeInterest)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 text-slate-700 font-semibold sticky top-0 border-b border-slate-200 z-10">
                      <tr>
                        <th className="py-2.5 px-3">Month</th>
                        <th className="py-2.5 px-3">Period</th>
                        <th className="py-2.5 px-3 text-right">Monthly Installment</th>
                        <th className="py-2.5 px-3 text-right">Principal</th>
                        <th className="py-2.5 px-3 text-right">Interest</th>
                        <th className="py-2.5 px-3 text-right">Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono tabular-nums">
                      {summary.schedule.map((row) => (
                        <tr key={row.period} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-1.5 px-3 font-sans font-medium text-slate-900">
                            {row.dateStr}
                          </td>
                          <td className="py-1.5 px-3 text-slate-500">
                            #{row.period}
                          </td>
                          <td className="py-1.5 px-3 text-right text-slate-800">
                            {formatSGD(row.payment, true)}
                          </td>
                          <td className="py-1.5 px-3 text-right text-emerald-700 font-medium">
                            {formatSGD(row.principalPaid, true)}
                          </td>
                          <td className="py-1.5 px-3 text-right text-amber-700">
                            {formatSGD(row.interestPaid, true)}
                          </td>
                          <td className="py-1.5 px-3 text-right font-semibold text-slate-900">
                            {formatSGD(row.remainingBalance, true)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
