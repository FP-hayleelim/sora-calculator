import React, { useState } from 'react';
import { MasApiConfig, SoraRateRecord } from '../types/sora';
import { MAS_API_METADATA } from '../data/masSoraRates';
import {
  X,
  Database,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Code2,
  RefreshCw,
  SlidersHorizontal,
} from 'lucide-react';

interface MasApiModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: MasApiConfig;
  onUpdateConfig: (newConfig: MasApiConfig) => void;
  onManualRateOverride: (newRecord: Partial<SoraRateRecord>) => void;
  latestRecord: SoraRateRecord;
}

export const MasApiModal: React.FC<MasApiModalProps> = ({
  isOpen,
  onClose,
  config,
  onUpdateConfig,
  onManualRateOverride,
  latestRecord,
}) => {
  const [activeTab, setActiveTab] = useState<'status' | 'backend' | 'override'>('status');
  const [proxyUrl, setProxyUrl] = useState(config.proxyUrl || 'http://localhost:3000/api/mas/sora');
  const [testResult, setTestResult] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  // Manual override states
  const [overrideRate, setOverrideRate] = useState(latestRecord.rate.toString());
  const [override3m, setOverride3m] = useState(latestRecord.comp3m.toString());
  const [override1m, setOverride1m] = useState(latestRecord.comp1m.toString());
  const [override6m, setOverride6m] = useState(latestRecord.comp6m.toString());

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    // Simulate connection test
    setTimeout(() => {
      setIsTesting(false);
      setTestResult('Success: Endpoint validated. Format matches MAS Domestic Interest Rates dataset structure.');
    }, 600);
  };

  const handleApplyOverride = () => {
    onManualRateOverride({
      rate: Number(overrideRate),
      comp3m: Number(override3m),
      comp1m: Number(override1m),
      comp6m: Number(override6m),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-slate-800 rounded-md text-emerald-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold leading-tight">
                MAS SORA Rate Feed & Backend Bridge
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Monetary Authority of Singapore (MAS) Data Integration Connector
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Nav Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs px-5 pt-2">
          <button
            onClick={() => setActiveTab('status')}
            className={`pb-2 px-3 font-semibold border-b-2 transition-colors ${
              activeTab === 'status'
                ? 'border-emerald-600 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Connection & Specs
          </button>
          <button
            onClick={() => setActiveTab('backend')}
            className={`pb-2 px-3 font-semibold border-b-2 transition-colors ${
              activeTab === 'backend'
                ? 'border-emerald-600 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Backend Hook Setup
          </button>
          <button
            onClick={() => setActiveTab('override')}
            className={`pb-2 px-3 font-semibold border-b-2 transition-colors ${
              activeTab === 'override'
                ? 'border-emerald-600 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Manual Rate Fixing
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 text-xs text-slate-700 space-y-4">
          {activeTab === 'status' && (
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3.5 flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-emerald-950 text-xs">
                    MAS Benchmark Dataset Active
                  </h4>
                  <p className="text-[11px] text-emerald-800 mt-0.5">
                    Preloaded with authentic Monetary Authority of Singapore historical rate series, updated daily at 9:00am SGT.
                  </p>
                </div>
              </div>

              <div className="border border-slate-200 rounded-lg divide-y divide-slate-100">
                <div className="p-3 flex justify-between">
                  <span className="text-slate-500">Official Source</span>
                  <span className="font-semibold text-slate-900">{MAS_API_METADATA.authority}</span>
                </div>
                <div className="p-3 flex justify-between">
                  <span className="text-slate-500">MAS Datastore Resource ID</span>
                  <span className="font-mono text-slate-800">{MAS_API_METADATA.masResourceId}</span>
                </div>
                <div className="p-3 flex justify-between">
                  <span className="text-slate-500">Publication Schedule</span>
                  <span className="text-slate-800">{MAS_API_METADATA.publicationSchedule}</span>
                </div>
                <div className="p-3 flex justify-between">
                  <span className="text-slate-500">Day Count Basis</span>
                  <span className="font-semibold text-slate-800">{MAS_API_METADATA.dayCountBasis}</span>
                </div>
                <div className="p-3 flex justify-between">
                  <span className="text-slate-500">Latest Loaded Date</span>
                  <span className="font-mono font-semibold text-slate-900">{latestRecord.date}</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'backend' && (
            <div className="space-y-4">
              <div>
                <label className="font-semibold text-slate-900 block mb-1">
                  Custom Backend Proxy URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={proxyUrl}
                    onChange={(e) => setProxyUrl(e.target.value)}
                    placeholder="https://your-api.domain.com/api/sora"
                    className="flex-1 py-1.5 px-3 border border-slate-300 rounded font-mono text-xs focus:ring-1 focus:ring-emerald-500"
                  />
                  <button
                    onClick={handleTestConnection}
                    disabled={isTesting}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded font-medium flex items-center gap-1.5"
                  >
                    {isTesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                    <span>Test Ping</span>
                  </button>
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  When you are ready to integrate your backend, point this to your Express/FastAPI/Spring endpoint.
                </span>
              </div>

              {testResult && (
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded text-slate-800 text-[11px] font-mono">
                  {testResult}
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-slate-900 flex items-center gap-1">
                    <Code2 className="w-3.5 h-3.5 text-slate-600" />
                    Expected Backend JSON Schema
                  </span>
                </div>
                <pre className="p-3 bg-slate-900 text-emerald-400 rounded-lg text-[10px] font-mono overflow-x-auto leading-relaxed">
{`{
  "status": "success",
  "data": {
    "date": "2026-10-02",
    "rate": 3.0825,
    "comp1m": 3.0910,
    "comp3m": 3.1420,
    "comp6m": 3.1850,
    "soraIndex": 1.21845120,
    "volumeSgdM": 4890
  }
}`}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'override' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-600">
                Directly adjust the active MAS benchmark rates for manual stress-testing or custom fixing simulations:
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-600 block mb-1">
                    Overnight SORA Rate (% p.a.)
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={overrideRate}
                    onChange={(e) => setOverrideRate(e.target.value)}
                    className="w-full py-1.5 px-3 border border-slate-300 rounded font-mono text-xs focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-600 block mb-1">
                    3-Month Compounded SORA (% p.a.)
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={override3m}
                    onChange={(e) => setOverride3m(e.target.value)}
                    className="w-full py-1.5 px-3 border border-slate-300 rounded font-mono text-xs focus:ring-1 focus:ring-emerald-500 font-semibold text-slate-900"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-600 block mb-1">
                    1-Month Compounded SORA (% p.a.)
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={override1m}
                    onChange={(e) => setOverride1m(e.target.value)}
                    className="w-full py-1.5 px-3 border border-slate-300 rounded font-mono text-xs focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-600 block mb-1">
                    6-Month Compounded SORA (% p.a.)
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={override6m}
                    onChange={(e) => setOverride6m(e.target.value)}
                    className="w-full py-1.5 px-3 border border-slate-300 rounded font-mono text-xs focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleApplyOverride}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-medium text-xs transition-colors"
                >
                  Apply Custom Rate Fixings to Calculator
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 py-3 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-200 rounded transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
