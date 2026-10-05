import React, { useState } from 'react';
import {
  BenchmarkType,
  MasApiConfig,
  SoraRateRecord,
} from './types/sora';
import { RAW_MAS_SORA_DATA, getLatestSoraRecord } from './data/masSoraRates';
import { Header } from './components/Header';
import { MasRateTicker } from './components/MasRateTicker';
import { LoanMortgageCalculator } from './components/LoanMortgageCalculator';
import { DailyCompoundingCalculator } from './components/DailyCompoundingCalculator';
import { RateExplorer } from './components/RateExplorer';
import { StressTestTdsr } from './components/StressTestTdsr';
import { MasApiModal } from './components/MasApiModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<'loan' | 'compounding' | 'rates' | 'stress'>('loan');
  const [dataset, setDataset] = useState<SoraRateRecord[]>(RAW_MAS_SORA_DATA);
  const [selectedBenchmark, setSelectedBenchmark] = useState<BenchmarkType>('3m_comp');
  const [isApiModalOpen, setIsApiModalOpen] = useState(false);

  const [masConfig, setMasConfig] = useState<MasApiConfig>({
    mode: 'cached',
    proxyUrl: 'http://localhost:3000/api/mas/sora',
    customApiKey: '',
    lastUpdated: '2026-10-02 09:00 SGT',
    status: 'connected',
    totalRecords: RAW_MAS_SORA_DATA.length,
  });

  const latestRecord = dataset[0] || RAW_MAS_SORA_DATA[0];

  const handleManualRateOverride = (overrides: Partial<SoraRateRecord>) => {
    const updated: SoraRateRecord = {
      ...latestRecord,
      ...overrides,
      date: '2026-10-02 (Custom)',
    };
    setDataset([updated, ...dataset.slice(1)]);
  };

  const handleSelectRateFromTable = (record: SoraRateRecord) => {
    setSelectedBenchmark('custom');
    setActiveTab('loan');
  };

  const handleExportCurrentView = () => {
    // Generate CSV for current view
    const rows = [
      ['Singapore SORA Summary Report'],
      [`Export Date: ${new Date().toISOString()}`],
      [`Active View: ${activeTab}`],
      [`Latest Overnight SORA: ${latestRecord.rate.toFixed(4)}%`],
      [`3-Month Compounded SORA: ${latestRecord.comp3m.toFixed(4)}%`],
      [`1-Month Compounded SORA: ${latestRecord.comp1m.toFixed(4)}%`],
      [`6-Month Compounded SORA: ${latestRecord.comp6m.toFixed(4)}%`],
      [`SORA Index: ${latestRecord.soraIndex.toFixed(8)}`],
      [`Day Count Basis: Actual / 365 (Fixed)`],
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SORA_${activeTab}_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* 1. Header (Top Bar Contract: 3 zones) */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenApiModal={() => setIsApiModalOpen(true)}
        onExportCurrentView={handleExportCurrentView}
      />

      {/* 2. Official MAS SORA Benchmark Ticker Ribbon */}
      <MasRateTicker
        latestRecord={latestRecord}
        selectedBenchmark={selectedBenchmark}
        onSelectBenchmark={(bm) => {
          setSelectedBenchmark(bm);
          if (activeTab !== 'loan') setActiveTab('loan');
        }}
        onOpenFeedModal={() => setIsApiModalOpen(true)}
      />

      {/* 3. Main Calculator & Interactive Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'loan' && (
          <LoanMortgageCalculator
            latestRecord={latestRecord}
            selectedBenchmark={selectedBenchmark}
            onBenchmarkChange={setSelectedBenchmark}
            onNavigateToStress={() => setActiveTab('stress')}
          />
        )}

        {activeTab === 'compounding' && (
          <DailyCompoundingCalculator dataset={dataset} />
        )}

        {activeTab === 'rates' && (
          <RateExplorer
            dataset={dataset}
            onSelectRate={handleSelectRateFromTable}
          />
        )}

        {activeTab === 'stress' && (
          <StressTestTdsr latestRecord={latestRecord} />
        )}
      </main>

      {/* 4. Institutional Disclaimers & Methodology Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12 py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-6 border-b border-slate-100">
            <div>
              <h4 className="font-semibold text-slate-800 mb-1">
                Monetary Authority of Singapore (MAS)
              </h4>
              <p className="leading-relaxed text-[11px] text-slate-500">
                SORA is the volume-weighted average rate of unsecured overnight interbank SGD cash transactions brokered in Singapore. Published daily at 9:00 AM SGT on every Singapore business day.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-slate-800 mb-1">
                Day Count & Compounding Standard
              </h4>
              <p className="leading-relaxed text-[11px] text-slate-500">
                Calculations follow ABS-SFEMC guidelines and SC-STS conventions. Day count basis is <strong>Actual / 365 (Fixed)</strong>. Friday overnight fixings compound for 3 calendar days (weekend carry).
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-slate-800 mb-1">
                Regulatory Framework
              </h4>
              <p className="leading-relaxed text-[11px] text-slate-500">
                Subject to MAS Notice 645 Total Debt Servicing Ratio (TDSR limit 55%) and 4.00% p.a. medium-term interest rate floor assessment for residential properties.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 text-[11px] text-slate-400">
            <div className="flex items-center gap-2">
              <span>Singapore Overnight Rate Average (SORA) Calculator</span>
              <span aria-hidden="true">·</span>
              <span>Frontend Prototype Engine</span>
            </div>
            <div>
              Ready for backend integration via MAS Datastore API Gateway
            </div>
          </div>
        </div>
      </footer>

      {/* 5. MAS API Bridge & Backend Modal */}
      <MasApiModal
        isOpen={isApiModalOpen}
        onClose={() => setIsApiModalOpen(false)}
        config={masConfig}
        onUpdateConfig={setMasConfig}
        onManualRateOverride={handleManualRateOverride}
        latestRecord={latestRecord}
      />
    </div>
  );
}
