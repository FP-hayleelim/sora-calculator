import React from 'react';
import { SoraRateRecord, BenchmarkType } from '../types/sora';
import { formatSoraRate, formatPercent } from '../utils/soraMath';
import { Clock, CheckCircle2, ChevronRight, Activity } from 'lucide-react';

interface MasRateTickerProps {
  latestRecord: SoraRateRecord;
  selectedBenchmark: BenchmarkType;
  onSelectBenchmark: (benchmark: BenchmarkType) => void;
  onOpenFeedModal: () => void;
}

export const MasRateTicker: React.FC<MasRateTickerProps> = ({
  latestRecord,
  selectedBenchmark,
  onSelectBenchmark,
  onOpenFeedModal,
}) => {
  return (
    <div className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* MAS Metadata status banner */}
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span className="flex items-center gap-1.5 font-medium text-slate-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              MAS Official Benchmark
            </span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span className="font-mono text-slate-500">Fixing: {latestRecord.date}</span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span className="text-slate-500 flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
              09:00 SGT Publication
            </span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <button
              onClick={onOpenFeedModal}
              className="text-emerald-700 hover:text-emerald-800 font-medium underline underline-offset-2 flex items-center gap-0.5"
            >
              Feed Live
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          {/* Rate Tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:flex lg:items-center gap-2">
            {/* 3M Compounded SORA (Primary SGD loan benchmark) */}
            <button
              onClick={() => onSelectBenchmark('3m_comp')}
              className={`text-left px-3 py-1.5 rounded border transition-all ${
                selectedBenchmark === '3m_comp'
                  ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-900'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className={`text-[11px] font-medium uppercase tracking-wider ${
                  selectedBenchmark === '3m_comp' ? 'text-emerald-400' : 'text-slate-500'
                }`}>
                  3M Comp SORA
                </span>
                {selectedBenchmark === '3m_comp' && (
                  <span className="text-[9px] bg-emerald-400/20 text-emerald-300 px-1 rounded">Active</span>
                )}
              </div>
              <div className="text-sm font-semibold font-mono tabular-nums mt-0.5">
                {formatSoraRate(latestRecord.comp3m)}
              </div>
            </button>

            {/* 1M Compounded SORA */}
            <button
              onClick={() => onSelectBenchmark('1m_comp')}
              className={`text-left px-3 py-1.5 rounded border transition-all ${
                selectedBenchmark === '1m_comp'
                  ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-900'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className={`text-[11px] font-medium uppercase tracking-wider ${
                  selectedBenchmark === '1m_comp' ? 'text-emerald-400' : 'text-slate-500'
                }`}>
                  1M Comp SORA
                </span>
                {selectedBenchmark === '1m_comp' && (
                  <span className="text-[9px] bg-emerald-400/20 text-emerald-300 px-1 rounded">Active</span>
                )}
              </div>
              <div className="text-sm font-semibold font-mono tabular-nums mt-0.5">
                {formatSoraRate(latestRecord.comp1m)}
              </div>
            </button>

            {/* 6M Compounded SORA */}
            <button
              onClick={() => onSelectBenchmark('6m_comp')}
              className={`text-left px-3 py-1.5 rounded border transition-all ${
                selectedBenchmark === '6m_comp'
                  ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-900'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className={`text-[11px] font-medium uppercase tracking-wider ${
                  selectedBenchmark === '6m_comp' ? 'text-emerald-400' : 'text-slate-500'
                }`}>
                  6M Comp SORA
                </span>
                {selectedBenchmark === '6m_comp' && (
                  <span className="text-[9px] bg-emerald-400/20 text-emerald-300 px-1 rounded">Active</span>
                )}
              </div>
              <div className="text-sm font-semibold font-mono tabular-nums mt-0.5">
                {formatSoraRate(latestRecord.comp6m)}
              </div>
            </button>

            {/* Daily Overnight SORA */}
            <button
              onClick={() => onSelectBenchmark('overnight')}
              className={`text-left px-3 py-1.5 rounded border transition-all ${
                selectedBenchmark === 'overnight'
                  ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-900'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className={`text-[11px] font-medium uppercase tracking-wider ${
                  selectedBenchmark === 'overnight' ? 'text-emerald-400' : 'text-slate-500'
                }`}>
                  Overnight Spot
                </span>
                {selectedBenchmark === 'overnight' && (
                  <span className="text-[9px] bg-emerald-400/20 text-emerald-300 px-1 rounded">Active</span>
                )}
              </div>
              <div className="text-sm font-semibold font-mono tabular-nums mt-0.5">
                {formatSoraRate(latestRecord.rate)}
              </div>
            </button>

            {/* Volume indicator */}
            <div className="hidden xl:flex flex-col justify-center px-3 py-1.5 bg-slate-50 border border-slate-200 rounded">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                Volume Transacted
              </span>
              <span className="text-xs font-semibold font-mono text-slate-800 tabular-nums">
                S$ {(latestRecord.volumeSgdM / 1000).toFixed(2)} Billion
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
