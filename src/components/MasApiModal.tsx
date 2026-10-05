import React, { useState } from 'react';
import { MasApiConfig, SoraRateRecord } from '../types/sora';
import {
  X,
  Database,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Code2,
  RefreshCw,
  SlidersHorizontal,
  Key,
  Activity,
} from 'lucide-react';

interface MasApiModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: MasApiConfig;
  onUpdateConfig: (newConfig: MasApiConfig) => void;
  onManualRateOverride: (newRecord: Partial<SoraRateRecord>) => void;
  latestRecord: SoraRateRecord;
}

const OFFICIAL_MAS_ENDPOINT =
  'https://eservices.mas.gov.sg/apimg-gw/server/monthly_statistical_bulletin_non610mssql/domestic_interest_rates_daily/views/domestic_interest_rates_daily';

export const MasApiModal: React.FC<MasApiModalProps> = ({
  isOpen,
  onClose,
  config,
  onUpdateConfig,
  onManualRateOverride,
  latestRecord,
}) => {
  const [activeTab, setActiveTab] = useState<'status' | 'serverless' | 'override'>('serverless');
  const [testKeyId, setTestKeyId] = useState('');
  const [testResult, setTestResult] = useState<{ status: 'success' | 'error'; message: string; details?: any } | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  // Manual override states
  const [overrideRate, setOverrideRate] = useState(latestRecord.rate.toString());
  const [override3m, setOverride3m] = useState(latestRecord.comp3m.toString());
  const [override1m, setOverride1m] = useState(latestRecord.comp1m.toString());
  const [override6m, setOverride6m] = useState(latestRecord.comp6m.toString());

  if (!isOpen) return null;

  const handleTestHealth = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const data = await res.json();
        setTestResult({
          status: 'success',
          message: `Health check passed (status: ${data.status}). MAS Key Configured: ${data.environment.masKeyConfigured ? 'Yes' : 'No (Pending manual key)'}`,
          details: data,
        });
      } else {
        setTestResult({
          status: 'error',
          message: `Server returned HTTP ${res.status}: ${res.statusText}`,
        });
      }
    } catch (err: any) {
      setTestResult({
        status: 'error',
        message: `Health check request failed: ${err.message}. Ensure your server / serverless function is running.`,
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleTestSoraFetch = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      const headers: Record<string, string> = {};
      if (testKeyId.trim()) {
        headers['KeyId'] = testKeyId.trim();
      }

      const res = await fetch('/api/sora?limit=5', { headers });
      const data = await res.json();

      if (res.ok && data.status === 'success') {
        setTestResult({
          status: 'success',
          message: `Successfully connected to MAS SORA API. Fetched ${data.count} records. Latest date: ${data.latestDate || 'N/A'}.`,
          details: data,
        });
        if (data.data && data.data.length > 0) {
          const first = data.data[0];
          onManualRateOverride({
            rate: first.rate,
            comp1m: first.comp1m,
            comp3m: first.comp3m,
            comp6m: first.comp6m,
            soraIndex: first.soraIndex,
          });
        }
      } else {
        setTestResult({
          status: 'error',
          message: data.message || `API error (HTTP ${res.status})`,
          details: data,
        });
      }
    } catch (err: any) {
      setTestResult({
        status: 'error',
        message: `Fetch failed: ${err.message}`,
      });
    } finally {
      setIsTesting(false);
    }
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
                MAS SORA Serverless API Gateway
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Monetary Authority of Singapore (MAS) Gateway Integration
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
            onClick={() => setActiveTab('serverless')}
            className={`pb-2 px-3 font-semibold border-b-2 transition-colors ${
              activeTab === 'serverless'
                ? 'border-emerald-600 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Serverless Endpoints (/api)
          </button>
          <button
            onClick={() => setActiveTab('status')}
            className={`pb-2 px-3 font-semibold border-b-2 transition-colors ${
              activeTab === 'status'
                ? 'border-emerald-600 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Endpoint Specifications
          </button>
          <button
            onClick={() => setActiveTab('override')}
            className={`pb-2 px-3 font-semibold border-b-2 transition-colors ${
              activeTab === 'override'
                ? 'border-emerald-600 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Manual Rate Override
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 text-xs text-slate-700 space-y-4 max-h-[75vh] overflow-y-auto">
          {activeTab === 'serverless' && (
            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-2">
                <div className="flex items-center gap-2 text-slate-900 font-semibold">
                  <Code2 className="w-4 h-4 text-emerald-600" />
                  <span>Configured Serverless Routes in Project Root:</span>
                </div>
                <div className="font-mono text-[11px] space-y-1 text-slate-700">
                  <div className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded border border-slate-200">
                    <span>GET /api/health.ts</span>
                    <span className="text-emerald-700 font-medium">Service Health & Environment Check</span>
                  </div>
                  <div className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded border border-slate-200">
                    <span>GET /api/sora.ts</span>
                    <span className="text-emerald-700 font-medium">Pulls Daily SORA + 1M/3M/6M MAS Data</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 border border-slate-200 rounded-lg p-3.5">
                <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                  <Key className="w-3.5 h-3.5 text-amber-600" />
                  <span>Authentication Header: KeyId</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  No API keys are hardcoded. Set your key in <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-800">MAS_KEY_ID</code> inside <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-800">.env</code> or supply it dynamically via the <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-800">KeyId</code> request header.
                </p>

                <div className="pt-1">
                  <label className="text-[11px] text-slate-600 block mb-1">
                    Optional: Enter KeyId to test connection now
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      placeholder="Enter your MAS KeyId to test..."
                      value={testKeyId}
                      onChange={(e) => setTestKeyId(e.target.value)}
                      className="flex-1 py-1.5 px-3 border border-slate-300 rounded font-mono text-xs focus:ring-1 focus:ring-emerald-500"
                    />
                    <button
                      onClick={handleTestSoraFetch}
                      disabled={isTesting}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-medium flex items-center gap-1.5"
                    >
                      {isTesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                      <span>Test /api/sora</span>
                    </button>
                    <button
                      onClick={handleTestHealth}
                      disabled={isTesting}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded font-medium flex items-center gap-1.5"
                    >
                      <Activity className="w-3.5 h-3.5" />
                      <span>Check /api/health</span>
                    </button>
                  </div>
                </div>
              </div>

              {testResult && (
                <div
                  className={`p-3 rounded-lg border text-[11px] font-mono leading-relaxed ${
                    testResult.status === 'success'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-amber-50 border-amber-200 text-amber-950'
                  }`}
                >
                  <div className="font-semibold mb-1 flex items-center gap-1.5">
                    {testResult.status === 'success' ? (
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                    )}
                    <span>{testResult.status === 'success' ? 'Connection Successful' : 'Notice / Error'}</span>
                  </div>
                  <div>{testResult.message}</div>
                  {testResult.details && (
                    <pre className="mt-2 p-2 bg-white/70 rounded text-[10px] overflow-x-auto max-h-40">
                      {JSON.stringify(testResult.details, null, 2)}
                    </pre>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'status' && (
            <div className="space-y-4">
              <div className="border border-slate-200 rounded-lg divide-y divide-slate-100">
                <div className="p-3">
                  <span className="text-slate-500 block text-[11px] mb-0.5">Target MAS API Endpoint</span>
                  <a
                    href={OFFICIAL_MAS_ENDPOINT}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-emerald-700 hover:underline break-all text-[11px]"
                  >
                    {OFFICIAL_MAS_ENDPOINT}
                  </a>
                </div>
                <div className="p-3 flex justify-between">
                  <span className="text-slate-500">Required Header</span>
                  <span className="font-mono font-semibold text-slate-800">KeyId: &lt;MAS_KEY_ID&gt;</span>
                </div>
                <div className="p-3 flex justify-between">
                  <span className="text-slate-500">Benchmark Data</span>
                  <span className="font-semibold text-slate-800">Daily SORA, 1M, 3M, 6M Compounded Averages, SORA Index</span>
                </div>
                <div className="p-3 flex justify-between">
                  <span className="text-slate-500">Day Count Basis</span>
                  <span className="font-semibold text-slate-800">Actual / 365 (Fixed)</span>
                </div>
                <div className="p-3 flex justify-between">
                  <span className="text-slate-500">Publication Schedule</span>
                  <span className="text-slate-800">Singapore Business Days at 09:00 SGT</span>
                </div>
              </div>

              <div>
                <span className="font-semibold text-slate-900 block mb-1">
                  Node / Curl Invocation Sample
                </span>
                <pre className="p-3 bg-slate-900 text-emerald-400 rounded-lg text-[10px] font-mono overflow-x-auto leading-relaxed">
{`curl -X GET "https://eservices.mas.gov.sg/apimg-gw/server/monthly_statistical_bulletin_non610mssql/domestic_interest_rates_daily/views/domestic_interest_rates_daily?limit=5" \\
  -H "KeyId: YOUR_MAS_KEY_ID"`}
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

