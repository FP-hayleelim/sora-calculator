import React, { useState, useMemo } from 'react';
import { SoraRateRecord } from '../types/sora';
import {
  calculateStressScenarios,
  calculateRequiredIncomeTDSR,
  calculateRequiredIncomeMSR,
  formatSGD,
  formatPercent,
} from '../utils/soraMath';
import {
  ShieldAlert,
  AlertTriangle,
  Scale,
  DollarSign,
  TrendingUp,
  Info,
  CheckCircle,
} from 'lucide-react';

interface StressTestTdsrProps {
  latestRecord: SoraRateRecord;
}

export const StressTestTdsr: React.FC<StressTestTdsrProps> = ({ latestRecord }) => {
  const [loanPrincipal, setLoanPrincipal] = useState<number>(1000000);
  const [tenorYears, setTenorYears] = useState<number>(25);
  const [baseAllInRate, setBaseAllInRate] = useState<number>(3.892); // e.g. 3.142% 3M SORA + 0.75% bank spread
  const [monthlyOtherDebts, setMonthlyOtherDebts] = useState<number>(1200); // car loan, credit card installment
  const [currentGrossIncome, setCurrentGrossIncome] = useState<number>(14000); // monthly gross income

  const scenarios = useMemo(() => {
    return calculateStressScenarios(loanPrincipal, tenorYears, baseAllInRate);
  }, [loanPrincipal, tenorYears, baseAllInRate]);

  // Current baseline monthly payment
  const baselineScenario = scenarios.find((s) => s.deltaBps === 0) || scenarios[0];
  const masRegulatoryScenario = scenarios.find((s) => s.isMasStressFloor);

  // Income calculations
  const baselineMonthlyDebt = (baselineScenario?.monthlyPayment || 0) + monthlyOtherDebts;
  const currentTdsrActual = currentGrossIncome > 0 ? (baselineMonthlyDebt / currentGrossIncome) * 100 : 0;
  
  // Under MAS 4.00% stress test rate
  const stressedMonthlyPayment = masRegulatoryScenario?.monthlyPayment || (baselineScenario?.monthlyPayment || 0);
  const stressedTotalMonthlyDebt = stressedMonthlyPayment + monthlyOtherDebts;
  const stressedTdsrActual = currentGrossIncome > 0 ? (stressedTotalMonthlyDebt / currentGrossIncome) * 100 : 0;

  const minIncomeBaselineTdsr = calculateRequiredIncomeTDSR(baselineScenario?.monthlyPayment || 0, monthlyOtherDebts);
  const minIncomeStressedTdsr = calculateRequiredIncomeTDSR(stressedMonthlyPayment, monthlyOtherDebts);
  const minIncomeMsr = calculateRequiredIncomeMSR(baselineScenario?.monthlyPayment || 0);

  const passesBaselineTdsr = currentTdsrActual <= 55;
  const passesStressedTdsr = stressedTdsrActual <= 55;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 pb-3">
        <h2 className="text-xl font-bold tracking-tight text-slate-900">
          MAS Regulatory Stress Test & TDSR Income Eligibility
        </h2>
        <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
          <span>MAS Notice 645 & Notice 1115 Compliance</span>
          <span aria-hidden="true">·</span>
          <span>4.00% p.a. Medium-Term Floor Assessment</span>
          <span aria-hidden="true">·</span>
          <span>55% Total Debt Servicing Ratio Ceiling</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Inputs (5 cols) */}
        <div className="lg:col-span-5 space-y-5 bg-white p-5 rounded-lg border border-slate-200 shadow-xs">
          <div className="space-y-1.5">
            <label htmlFor="stress-principal" className="text-xs font-semibold uppercase tracking-wider text-slate-700 block">
              Mortgage Principal (SGD)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-mono text-sm">
                S$
              </span>
              <input
                id="stress-principal"
                type="number"
                step="50000"
                value={loanPrincipal}
                onChange={(e) => setLoanPrincipal(Math.max(0, Number(e.target.value)))}
                className="w-full pl-9 pr-3 py-2 text-sm font-mono border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-500 text-slate-900"
              />
            </div>
            <div className="flex gap-1.5 pt-1">
              {[800000, 1000000, 1500000, 2000000].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setLoanPrincipal(v)}
                  className={`text-xs px-2 py-0.5 rounded transition-colors font-mono tabular-nums ${
                    loanPrincipal === v
                      ? 'bg-slate-900 text-white font-medium'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  S$ {v / 1000000}M
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
            <div>
              <label htmlFor="stress-tenor" className="text-xs font-semibold uppercase tracking-wider text-slate-700 block mb-1">
                Tenor (Years)
              </label>
              <input
                id="stress-tenor"
                type="number"
                min="1"
                max="35"
                value={tenorYears}
                onChange={(e) => setTenorYears(Math.max(1, Math.min(35, Number(e.target.value))))}
                className="w-full py-1.5 px-3 text-sm font-mono border border-slate-300 rounded focus:ring-1 focus:ring-emerald-500 text-slate-900"
              />
            </div>
            <div>
              <label htmlFor="stress-rate" className="text-xs font-semibold uppercase tracking-wider text-slate-700 block mb-1">
                Base All-In Rate (%)
              </label>
              <input
                id="stress-rate"
                type="number"
                step="0.05"
                value={baseAllInRate}
                onChange={(e) => setBaseAllInRate(Number(e.target.value))}
                className="w-full py-1.5 px-3 text-sm font-mono border border-slate-300 rounded focus:ring-1 focus:ring-emerald-500 text-slate-900"
              />
            </div>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label htmlFor="stress-other-debts" className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                Other Monthly Commitments (SGD)
              </label>
              <span className="text-xs font-mono text-slate-500">
                {formatSGD(monthlyOtherDebts)}
              </span>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-mono text-sm">
                S$
              </span>
              <input
                id="stress-other-debts"
                type="number"
                step="100"
                value={monthlyOtherDebts}
                onChange={(e) => setMonthlyOtherDebts(Math.max(0, Number(e.target.value)))}
                className="w-full pl-9 pr-3 py-2 text-sm font-mono border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-500 text-slate-900"
                placeholder="1200"
              />
            </div>
            <span className="text-[11px] text-slate-400 block">
              Auto loans, student loans, minimum credit card payments, other bank facilities
            </span>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label htmlFor="stress-income" className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                Borrower Gross Monthly Income (SGD)
              </label>
              <span className="text-xs font-mono font-medium text-slate-800">
                {formatSGD(currentGrossIncome)}
              </span>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-mono text-sm">
                S$
              </span>
              <input
                id="stress-income"
                type="number"
                step="500"
                value={currentGrossIncome}
                onChange={(e) => setCurrentGrossIncome(Math.max(0, Number(e.target.value)))}
                className="w-full pl-9 pr-3 py-2 text-sm font-mono border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-500 text-slate-900"
                placeholder="14000"
              />
            </div>
          </div>
        </div>

        {/* Right Output: TDSR Verdict & Sensitivity Table (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* TDSR Assessment Status Card */}
          <div className="bg-slate-900 text-white p-5 rounded-lg border border-slate-800 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block mb-1">
                  MAS TDSR Assessment Ratio
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold font-mono tabular-nums text-white">
                    {stressedTdsrActual.toFixed(1)}%
                  </span>
                  <span className="text-xs text-slate-400">
                    / 55.0% MAS Maximum Ceiling
                  </span>
                </div>
              </div>

              <div className={`px-3 py-2 rounded border text-xs font-medium flex items-center gap-2 ${
                passesStressedTdsr
                  ? 'bg-emerald-950/80 border-emerald-700/80 text-emerald-300'
                  : 'bg-rose-950/80 border-rose-700/80 text-rose-300'
              }`}>
                {passesStressedTdsr ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span>Complies with MAS TDSR</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    <span>Breaches 55% TDSR Ceiling</span>
                  </>
                )}
              </div>
            </div>

            {/* Income comparison */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 text-xs">
              <div className="bg-slate-800/80 p-3 rounded border border-slate-700/60">
                <span className="text-slate-400 text-[11px] block">Current Stressed Repayment</span>
                <span className="text-base font-bold font-mono text-white tabular-nums mt-0.5 block">
                  {formatSGD(stressedMonthlyPayment, true)}
                </span>
                <span className="text-[10px] text-slate-400">At MAS 4.00% floor</span>
              </div>

              <div className="bg-slate-800/80 p-3 rounded border border-slate-700/60">
                <span className="text-slate-400 text-[11px] block">Min Gross Income (TDSR)</span>
                <span className="text-base font-bold font-mono text-emerald-300 tabular-nums mt-0.5 block">
                  {formatSGD(minIncomeStressedTdsr)}
                </span>
                <span className="text-[10px] text-slate-400">To pass 55% stress test</span>
              </div>

              <div className="bg-slate-800/80 p-3 rounded border border-slate-700/60">
                <span className="text-slate-400 text-[11px] block">Min Income (MSR 30%)</span>
                <span className="text-base font-bold font-mono text-amber-300 tabular-nums mt-0.5 block">
                  {formatSGD(minIncomeMsr)}
                </span>
                <span className="text-[10px] text-slate-400">For HDB / EC buyers</span>
              </div>
            </div>
          </div>

          {/* SORA Rate Sensitivity Matrix */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-3.5 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-slate-700" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Rate Shock & Interest Sensitivity Matrix
                </h3>
              </div>
              <span className="text-xs text-slate-500 font-mono">
                {scenarios.length} Shift Scenarios
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-3">Scenario</th>
                    <th className="py-2 px-3 text-right">All-In Rate</th>
                    <th className="py-2 px-3 text-right">Monthly Installment</th>
                    <th className="py-2 px-3 text-right">Monthly Delta</th>
                    <th className="py-2 px-3 text-right">Annual Impact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono tabular-nums">
                  {scenarios.map((s, idx) => {
                    const isBase = s.deltaBps === 0;
                    return (
                      <tr
                        key={idx}
                        className={`transition-colors ${
                          s.isMasStressFloor
                            ? 'bg-amber-50/70 hover:bg-amber-50 font-semibold text-amber-950'
                            : isBase
                              ? 'bg-emerald-50/50 hover:bg-emerald-50 font-medium'
                              : 'hover:bg-slate-50/80'
                        }`}
                      >
                        <td className="py-2 px-3 font-sans flex items-center gap-1.5">
                          {s.isMasStressFloor && (
                            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                          )}
                          {isBase && (
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                          )}
                          <span>{s.label}</span>
                        </td>
                        <td className="py-2 px-3 text-right font-semibold">
                          {formatPercent(s.allInRate, 2)}
                        </td>
                        <td className="py-2 px-3 text-right">
                          {formatSGD(s.monthlyPayment, true)}
                        </td>
                        <td className="py-2 px-3 text-right">
                          {s.monthlyDiff > 0 ? (
                            <span className="text-rose-600 font-medium">+{formatSGD(s.monthlyDiff, true)}</span>
                          ) : s.monthlyDiff < 0 ? (
                            <span className="text-emerald-700 font-medium">-{formatSGD(Math.abs(s.monthlyDiff), true)}</span>
                          ) : (
                            <span className="text-slate-400">Baseline</span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-right">
                          {s.annualInterestDiff > 0 ? (
                            <span className="text-rose-600">+{formatSGD(s.annualInterestDiff)}</span>
                          ) : s.annualInterestDiff < 0 ? (
                            <span className="text-emerald-700">-{formatSGD(Math.abs(s.annualInterestDiff))}</span>
                          ) : (
                            <span className="text-slate-400">S$ 0</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
