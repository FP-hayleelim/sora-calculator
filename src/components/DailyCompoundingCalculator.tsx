import React, { useState, useMemo } from 'react';
import {
  DailyCompoundingParams,
  SoraRateRecord,
  DailyCompoundingResult,
} from '../types/sora';
import {
  calculateCompoundedSoraInArrears,
  formatSGD,
  formatPercent,
  formatSoraRate,
} from '../utils/soraMath';
import {
  CalendarRange,
  Download,
  Info,
  Clock,
  Sparkles,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface DailyCompoundingCalculatorProps {
  dataset: SoraRateRecord[];
}

export const DailyCompoundingCalculator: React.FC<DailyCompoundingCalculatorProps> = ({
  dataset,
}) => {
  const [principal, setPrincipal] = useState<number>(5000000); // S$ 5,000,000 institutional / corporate default
  const [startDate, setStartDate] = useState<string>('2026-08-03');
  const [endDate, setEndDate] = useState<string>('2026-09-30');
  const [dayCountConvention, setDayCountConvention] = useState<'ACT/365' | 'ACT/360'>('ACT/365');
  const [lookbackDays, setLookbackDays] = useState<number>(5); // 5 business days MAS recommendation
  const [spreadBps, setSpreadBps] = useState<number>(65); // 65 bps (+0.65%)

  // Preset ranges
  const applyPresetRange = (type: 'last30' | 'last60' | 'q3') => {
    if (type === 'last30') {
      setStartDate('2026-09-01');
      setEndDate('2026-09-30');
    } else if (type === 'last60') {
      setStartDate('2026-08-01');
      setEndDate('2026-09-30');
    } else if (type === 'q3') {
      setStartDate('2026-07-20');
      setEndDate('2026-09-30');
    }
  };

  const params: DailyCompoundingParams = {
    principal,
    startDate,
    endDate,
    dayCountConvention,
    lookbackDays,
    spreadBps,
  };

  const result: DailyCompoundingResult = useMemo(() => {
    return calculateCompoundedSoraInArrears(params, dataset);
  }, [params, dataset]);

  // Export CSV
  const handleExportCsv = () => {
    const rows = [
      ['Singapore SORA Daily Compounding in Arrears Report'],
      [`Principal: ${formatSGD(principal)}`],
      [`Calculation Period: ${startDate} to ${endDate}`],
      [`Day Count Basis: ${dayCountConvention}`],
      [`Lookback / Observation Shift: ${lookbackDays} Business Days`],
      [`Spread: ${spreadBps} bps (${(spreadBps / 100).toFixed(2)}%)`],
      [`Annualized Compounded SORA: ${formatPercent(result.compoundedRateAnnualized, 4)}`],
      [`Effective All-in Rate: ${formatPercent(result.effectiveAllInRate, 4)}`],
      [`Total Accrued Interest: ${formatSGD(result.totalAccruedInterest, true)}`],
      [],
      ['Date', 'Fixing Date (Lookback)', 'Overnight SORA (%)', 'Weight (n_i Days)', 'Daily Comp Factor', 'Accrued Interest (SGD)'],
      ...result.rows.map((r) => [
        r.date,
        r.fixingDate,
        r.rate.toFixed(4),
        r.weightDays,
        r.cumulativeFactor.toFixed(8),
        r.cumulativeInterest.toFixed(2),
      ]),
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SORA_Daily_Compounding_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Title & Info */}
      <div className="border-b border-slate-200 pb-3">
        <h2 className="text-xl font-bold tracking-tight text-slate-900">
          Daily Compounded in Arrears Interest Calculator
        </h2>
        <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
          <span>MAS / ISDA Singapore Standard</span>
          <span aria-hidden="true">·</span>
          <span>Observation Shift / Lookback Support</span>
          <span aria-hidden="true">·</span>
          <span>Weekend & Public Holiday Day-Count Weighting</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Inputs (5 cols) */}
        <div className="lg:col-span-5 space-y-5 bg-white p-5 rounded-lg border border-slate-200 shadow-xs">
          {/* Principal */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="comp-principal" className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                Principal Amount (SGD)
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
                id="comp-principal"
                type="number"
                min="1000"
                step="50000"
                value={principal || ''}
                onChange={(e) => setPrincipal(Math.max(0, Number(e.target.value)))}
                className="w-full pl-9 pr-3 py-2 text-sm font-mono border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-500 text-slate-900"
                placeholder="5000000"
              />
            </div>
            <div className="flex gap-1.5 pt-1">
              {[1000000, 3000000, 5000000, 10000000].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setPrincipal(val)}
                  className={`text-xs px-2.5 py-1 rounded transition-colors font-mono tabular-nums ${
                    principal === val
                      ? 'bg-slate-900 text-white font-medium'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                  }`}
                >
                  S$ {val / 1000000}M
                </button>
              ))}
            </div>
          </div>

          {/* Date Range Selection */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                Interest Calculation Period
              </label>
              <div className="flex items-center gap-1 text-[11px]">
                <button
                  type="button"
                  onClick={() => applyPresetRange('last30')}
                  className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 hover:bg-slate-200"
                >
                  30 Days
                </button>
                <button
                  type="button"
                  onClick={() => applyPresetRange('last60')}
                  className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 hover:bg-slate-200"
                >
                  60 Days
                </button>
                <button
                  type="button"
                  onClick={() => applyPresetRange('q3')}
                  className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 hover:bg-slate-200"
                >
                  Q3
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="start-date" className="text-[11px] text-slate-500 block mb-1">
                  Start Date (Inclusive)
                </label>
                <input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full py-1.5 px-2.5 text-xs font-mono border border-slate-300 rounded focus:ring-1 focus:ring-emerald-500 text-slate-900"
                />
              </div>
              <div>
                <label htmlFor="end-date" className="text-[11px] text-slate-500 block mb-1">
                  End Date (Exclusive/Due)
                </label>
                <input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full py-1.5 px-2.5 text-xs font-mono border border-slate-300 rounded focus:ring-1 focus:ring-emerald-500 text-slate-900"
                />
              </div>
            </div>
            <div className="text-[11px] text-slate-500 font-mono">
              Total Duration: {result.calendarDays} calendar days ({result.businessDays} MAS fixing days)
            </div>
          </div>

          {/* Lookback / Observation Shift */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                Lookback / Observation Shift
              </label>
              <span className="text-xs font-mono font-medium text-slate-800">
                {lookbackDays} Business Days
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: '0 Days (No shift)', val: 0 },
                { label: '2 Days (Swift)', val: 2 },
                { label: '5 Days (MAS Standard)', val: 5 },
              ].map((opt) => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => setLookbackDays(opt.val)}
                  className={`p-2 rounded text-left border transition-all ${
                    lookbackDays === opt.val
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-200 bg-slate-50 text-slate-800 hover:bg-slate-100'
                  }`}
                >
                  <div className="text-[11px] font-medium leading-none">{opt.label}</div>
                </button>
              ))}
            </div>
            <div className="text-[11px] text-slate-400">
              In retail and corporate SGD syndicated facilities, MAS recommends a 5-business-day lookback to allow payment settlement preparation before interest payment dates.
            </div>
          </div>

          {/* Day count basis & Margin */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 block mb-1.5">
                Day Count Convention
              </label>
              <div className="flex p-0.5 bg-slate-100 rounded border border-slate-200">
                <button
                  type="button"
                  onClick={() => setDayCountConvention('ACT/365')}
                  className={`flex-1 py-1 text-xs font-medium rounded transition-colors ${
                    dayCountConvention === 'ACT/365'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  ACT/365 (SGD Std)
                </button>
                <button
                  type="button"
                  onClick={() => setDayCountConvention('ACT/360')}
                  className={`flex-1 py-1 text-xs font-medium rounded transition-colors ${
                    dayCountConvention === 'ACT/360'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  ACT/360
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="spread-bps" className="text-xs font-semibold uppercase tracking-wider text-slate-700 block mb-1.5">
                Spread / Margin (bps)
              </label>
              <div className="relative">
                <input
                  id="spread-bps"
                  type="number"
                  step="5"
                  value={spreadBps}
                  onChange={(e) => setSpreadBps(Math.max(0, Number(e.target.value)))}
                  className="w-full py-1 px-2.5 text-xs font-mono border border-slate-300 rounded focus:ring-1 focus:ring-emerald-500 text-slate-900"
                  placeholder="65"
                />
                <span className="absolute right-2.5 top-1 text-[11px] text-slate-400 font-mono">
                  +{(spreadBps / 100).toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Output: Accrued Interest Summary & Day-by-Day Table (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Highlight card */}
          <div className="bg-slate-900 text-white p-6 rounded-lg shadow-sm border border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block mb-1">
                  Total Accrued Interest Due (SGD)
                </span>
                <div className="text-3xl sm:text-4xl font-extrabold font-mono tabular-nums text-white tracking-tight">
                  {formatSGD(result.totalAccruedInterest, true)}
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  For {result.calendarDays} calendar days on {formatSGD(principal)} principal
                </div>
              </div>

              {/* Annualized Rate Card */}
              <div className="bg-slate-800/90 border border-slate-700 p-3 rounded text-right space-y-1">
                <div className="text-xs text-slate-400 flex items-center justify-between gap-3">
                  <span>Annualized Compounded SORA:</span>
                  <span className="font-mono text-white font-medium">
                    {formatPercent(result.compoundedRateAnnualized, 4)}
                  </span>
                </div>
                <div className="text-xs text-slate-400 flex items-center justify-between gap-3">
                  <span>Contractual Margin:</span>
                  <span className="font-mono text-emerald-400 font-medium">
                    +{formatPercent(spreadBps / 100, 2)}
                  </span>
                </div>
                <div className="border-t border-slate-700 pt-1 text-xs font-semibold text-white flex items-center justify-between gap-3">
                  <span>Effective All-In Rate:</span>
                  <span className="font-mono text-emerald-300">
                    {formatPercent(result.effectiveAllInRate, 4)} p.a.
                  </span>
                </div>
              </div>
            </div>

            {/* Formula Reference Indicator */}
            <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-300 font-mono">
              <div className="flex items-center gap-1.5 text-slate-400">
                <Info className="w-3.5 h-3.5 text-emerald-400" />
                <span>ISDA / MAS Formula: [ ∏ (1 + r_i · n_i / {dayCountConvention === 'ACT/360' ? 360 : 365}) - 1 ] · {dayCountConvention === 'ACT/360' ? 360 : 365} / d</span>
              </div>
              <button
                onClick={handleExportCsv}
                className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Audit Log</span>
              </button>
            </div>
          </div>

          {/* Daily Table Log */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <CalendarRange className="w-4 h-4 text-slate-700" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Daily Compounding Schedule Audit Log
                </h3>
              </div>
              <span className="text-xs text-slate-500 font-mono">
                {result.rows.length} Business Fixings
              </span>
            </div>

            <div className="max-h-96 overflow-y-auto overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-700 font-semibold sticky top-0 border-b border-slate-200 z-10">
                  <tr>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Fixing Date (Lookback)</th>
                    <th className="py-2.5 px-3 text-right">MAS SORA (%)</th>
                    <th className="py-2.5 px-3 text-center">Weight (n_i)</th>
                    <th className="py-2.5 px-3 text-right">Period Interest</th>
                    <th className="py-2.5 px-3 text-right">Cumulative Interest</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono tabular-nums">
                  {result.rows.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 font-sans">
                        No MAS rate records found for selected date interval.
                      </td>
                    </tr>
                  ) : (
                    result.rows.map((row) => (
                      <tr key={row.date} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-1.5 px-3 font-sans font-medium text-slate-900">
                          {row.date}
                        </td>
                        <td className="py-1.5 px-3 text-slate-500">
                          {row.fixingDate}
                        </td>
                        <td className="py-1.5 px-3 text-right font-semibold text-slate-800">
                          {formatSoraRate(row.rate)}
                        </td>
                        <td className="py-1.5 px-3 text-center text-slate-600">
                          <span className={row.weightDays > 1 ? 'font-bold text-amber-700' : ''}>
                            {row.weightDays}d
                          </span>
                        </td>
                        <td className="py-1.5 px-3 text-right text-slate-700">
                          {formatSGD(row.periodInterest, true)}
                        </td>
                        <td className="py-1.5 px-3 text-right text-emerald-700 font-medium">
                          {formatSGD(row.cumulativeInterest, true)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
