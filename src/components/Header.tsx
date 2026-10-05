import React from 'react';
import { Database, Download, SlidersHorizontal } from 'lucide-react';

interface HeaderProps {
  activeTab: 'loan' | 'compounding' | 'rates' | 'stress';
  setActiveTab: (tab: 'loan' | 'compounding' | 'rates' | 'stress') => void;
  onOpenApiModal: () => void;
  onExportCurrentView: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenApiModal,
  onExportCurrentView,
}) => {
  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Zone 1: Single text element wordmark */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-mono font-bold text-slate-950 text-sm shadow-sm">
              S$
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight text-white leading-none">
                SORA Singapore
              </span>
              <span className="text-[10px] text-slate-400 font-mono tracking-wider uppercase mt-1">
                MAS Overnight Rate Engine
              </span>
            </div>
          </div>

          {/* Zone 2: Navigation Links (interactive tabs styled cleanly) */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-800/80 p-1 rounded-lg border border-slate-700/60">
            <button
              onClick={() => setActiveTab('loan')}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                activeTab === 'loan'
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              Loan & Mortgage
            </button>
            <button
              onClick={() => setActiveTab('compounding')}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                activeTab === 'compounding'
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              Daily Compounding (ISDA)
            </button>
            <button
              onClick={() => setActiveTab('rates')}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                activeTab === 'rates'
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              Rate Explorer & History
            </button>
            <button
              onClick={() => setActiveTab('stress')}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                activeTab === 'stress'
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              MAS Stress & TDSR
            </button>
          </nav>

          {/* Zone 3: Primary actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenApiModal}
              title="Configure MAS Data Feed & Backend Integration"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md transition-colors whitespace-nowrap"
            >
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span>MAS Feed Hook</span>
            </button>
            <button
              onClick={onExportCurrentView}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-900 bg-emerald-400 hover:bg-emerald-300 font-semibold rounded-md transition-colors whitespace-nowrap shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Mobile Sub-Navigation Bar */}
        <div className="flex md:hidden overflow-x-auto py-2 gap-1 border-t border-slate-800/80">
          <button
            onClick={() => setActiveTab('loan')}
            className={`px-3 py-1 text-xs font-medium rounded-md whitespace-nowrap ${
              activeTab === 'loan' ? 'bg-slate-700 text-white' : 'text-slate-400'
            }`}
          >
            Loan & Mortgage
          </button>
          <button
            onClick={() => setActiveTab('compounding')}
            className={`px-3 py-1 text-xs font-medium rounded-md whitespace-nowrap ${
              activeTab === 'compounding' ? 'bg-slate-700 text-white' : 'text-slate-400'
            }`}
          >
            Compounding
          </button>
          <button
            onClick={() => setActiveTab('rates')}
            className={`px-3 py-1 text-xs font-medium rounded-md whitespace-nowrap ${
              activeTab === 'rates' ? 'bg-slate-700 text-white' : 'text-slate-400'
            }`}
          >
            Rate Explorer
          </button>
          <button
            onClick={() => setActiveTab('stress')}
            className={`px-3 py-1 text-xs font-medium rounded-md whitespace-nowrap ${
              activeTab === 'stress' ? 'bg-slate-700 text-white' : 'text-slate-400'
            }`}
          >
            Stress & TDSR
          </button>
        </div>
      </div>
    </header>
  );
};
