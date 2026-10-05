import React, { useState, useMemo } from 'react';
import { SoraRateRecord } from '../types/sora';
import { formatSoraRate, formatSGD, formatPercent } from '../utils/soraMath';
import {
  TrendingUp,
  BarChart2,
  Calendar,
  Download,
  Search,
  Filter,
  Info,
} from 'lucide-react';

interface RateExplorerProps {
  dataset: SoraRateRecord[];
  onSelectRate: (record: SoraRateRecord) => void;
}

export const RateExplorer: React.FC<RateExplorerProps> = ({ dataset, onSelectRate }) => {
  const [activeSeries, setActiveSeries] = useState<'all' | 'overnight' | '3m' | '1m' | '6m'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Chronological order for chart (oldest to newest)
  const chronological = useMemo(() => {
    return [...dataset].sort((a, b) => a.date.localeCompare(b.date));
  }, [dataset]);

  // Filtered dataset for table
  const filteredTableData = useMemo(() => {
    if (!searchTerm.trim()) return dataset;
    return dataset.filter(
      (r) =>
        r.date.includes(searchTerm) ||
        r.rate.toString().includes(searchTerm) ||
        r.comp3m.toString().includes(searchTerm)
    );
  }, [dataset, searchTerm]);

  // Min and max for SVG chart scaling
  const { minRate, maxRate } = useMemo(() => {
    let min = 999;
    let max = -999;
    chronological.forEach((r) => {
      [r.rate, r.comp1m, r.comp3m, r.comp6m].forEach((val) => {
        if (val < min) min = val;
        if (val > max) max = val;
      });
    });
    // Add margin
    return {
      minRate: Math.max(0, min - 0.05),
      maxRate: max + 0.05,
    };
  }, [chronological]);

  // SVG Chart Dimensions
  const width = 800;
  const height = 260;
  const padding = { top: 20, right: 30, bottom: 40, left: 50 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  // Coordinate mapping
  const getX = (index: number) => {
    if (chronological.length <= 1) return padding.left;
    return padding.left + (index / (chronological.length - 1)) * chartW;
  };

  const getY = (val: number) => {
    const range = maxRate - minRate || 1;
    return padding.top + chartH - ((val - minRate) / range) * chartH;
  };

  // Build SVG path strings
  const buildPath = (key: 'rate' | 'comp1m' | 'comp3m' | 'comp6m') => {
    if (chronological.length === 0) return '';
    return chronological.reduce((acc, curr, idx) => {
      const x = getX(idx);
      const y = getY(curr[key]);
      return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
    }, '');
  };

  const pathOvernight = buildPath('rate');
  const path1m = buildPath('comp1m');
  const path3m = buildPath('comp3m');
  const path6m = buildPath('comp6m');

  const hoveredRecord = hoveredIndex !== null ? chronological[hoveredIndex] : chronological[chronological.length - 1];

  // CSV Export
  const handleExportCsv = () => {
    const rows = [
      ['Date', 'Overnight SORA (%)', '1M Comp SORA (%)', '3M Comp SORA (%)', '6M Comp SORA (%)', 'SORA Index', 'Volume (S$M)', '10th Pct', '90th Pct'],
      ...dataset.map((r) => [
        r.date,
        r.rate.toFixed(4),
        r.comp1m.toFixed(4),
        r.comp3m.toFixed(4),
        r.comp6m.toFixed(4),
        r.soraIndex.toFixed(8),
        r.volumeSgdM,
        r.percentile10 || '',
        r.percentile90 || '',
      ]),
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `MAS_SORA_Historical_Fixings.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Kicker */}
      <div className="border-b border-slate-200 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            MAS SORA Benchmark Curve & History
          </h2>
          <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
            <span>Official Monetary Authority of Singapore Dataset</span>
            <span aria-hidden="true">·</span>
            <span>Overnight vs Compounded Yield Term Structure</span>
            <span aria-hidden="true">·</span>
            <span>Volume & Percentile Corridor</span>
          </div>
        </div>

        <button
          onClick={handleExportCsv}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-800 bg-white hover:bg-slate-50 border border-slate-300 px-3 py-1.5 rounded transition-colors self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Download Historical Series</span>
        </button>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500">
            3M - 1M Term Spread
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-slate-900 mt-1">
            {hoveredRecord ? `${((hoveredRecord.comp3m - hoveredRecord.comp1m) * 100).toFixed(1)} bps` : '—'}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            Slope between 1-Month and 3-Month
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500">
            SORA Index Value
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-emerald-700 mt-1">
            {hoveredRecord ? hoveredRecord.soraIndex.toFixed(6) : '—'}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            Base 1.00000000 on 3 Jan 2020
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500">
            Interbank Volume Transacted
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-slate-900 mt-1">
            {hoveredRecord ? `S$ ${(hoveredRecord.volumeSgdM / 1000).toFixed(2)}B` : '—'}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            Unsecured SGD overnight cash
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500">
            10th - 90th Pct Corridor
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-slate-900 mt-1">
            {hoveredRecord && hoveredRecord.percentile10 && hoveredRecord.percentile90
              ? `${formatPercent(hoveredRecord.percentile10)} – ${formatPercent(hoveredRecord.percentile90)}`
              : '—'}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            Interbank dispersion range
          </div>
        </div>
      </div>

      {/* Interactive Chart Container */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">
              MAS SORA Yield Term Trajectory
            </h3>
            <span className="text-xs text-slate-500 font-mono">
              ({chronological[0]?.date} to {chronological[chronological.length - 1]?.date})
            </span>
          </div>

          {/* Series toggle controls */}
          <div className="flex p-0.5 bg-slate-100 rounded border border-slate-200 text-xs">
            <button
              onClick={() => setActiveSeries('all')}
              className={`px-2.5 py-1 rounded transition-colors font-medium ${
                activeSeries === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Curves
            </button>
            <button
              onClick={() => setActiveSeries('3m')}
              className={`px-2.5 py-1 rounded transition-colors font-medium ${
                activeSeries === '3m' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              3M SORA
            </button>
            <button
              onClick={() => setActiveSeries('1m')}
              className={`px-2.5 py-1 rounded transition-colors font-medium ${
                activeSeries === '1m' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              1M SORA
            </button>
            <button
              onClick={() => setActiveSeries('overnight')}
              className={`px-2.5 py-1 rounded transition-colors font-medium ${
                activeSeries === 'overnight' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Overnight
            </button>
          </div>
        </div>

        {/* Responsive SVG Chart */}
        <div className="w-full overflow-x-auto">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-64 select-none"
            onMouseLeave={() => setHoveredIndex(null)}
          >
            {/* Grid horizontal lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
              const val = minRate + frac * (maxRate - minRate);
              const y = getY(val);
              return (
                <g key={frac}>
                  <line
                    x1={padding.left}
                    y1={y}
                    x2={width - padding.right}
                    y2={y}
                    stroke="#E2E8F0"
                    strokeDasharray="3 3"
                    strokeWidth="1"
                  />
                  <text
                    x={padding.left - 8}
                    y={y + 3}
                    textAnchor="end"
                    className="text-[10px] font-mono fill-slate-400"
                  >
                    {val.toFixed(2)}%
                  </text>
                </g>
              );
            })}

            {/* Curves */}
            {(activeSeries === 'all' || activeSeries === '6m') && (
              <path
                d={path6m}
                fill="none"
                stroke="#6366F1"
                strokeWidth="1.75"
                opacity={activeSeries === '6m' ? 1 : 0.6}
              />
            )}

            {(activeSeries === 'all' || activeSeries === '3m') && (
              <path
                d={path3m}
                fill="none"
                stroke="#0F172A"
                strokeWidth="2.5"
              />
            )}

            {(activeSeries === 'all' || activeSeries === '1m') && (
              <path
                d={path1m}
                fill="none"
                stroke="#0284C7"
                strokeWidth="1.75"
                opacity={activeSeries === '1m' ? 1 : 0.7}
              />
            )}

            {(activeSeries === 'all' || activeSeries === 'overnight') && (
              <path
                d={pathOvernight}
                fill="none"
                stroke="#10B981"
                strokeWidth="1.75"
                strokeDasharray={activeSeries === 'overnight' ? 'none' : '4 2'}
              />
            )}

            {/* Hover trigger areas */}
            {chronological.map((rec, idx) => {
              const x = getX(idx);
              const isHovered = hoveredIndex === idx;
              return (
                <g key={rec.date} onMouseEnter={() => setHoveredIndex(idx)}>
                  <rect
                    x={x - 8}
                    y={padding.top}
                    width={16}
                    height={chartH}
                    fill="transparent"
                    className="cursor-pointer"
                  />
                  {isHovered && (
                    <line
                      x1={x}
                      y1={padding.top}
                      x2={x}
                      y2={padding.top + chartH}
                      stroke="#0F172A"
                      strokeWidth="1"
                      strokeDasharray="2 2"
                    />
                  )}
                </g>
              );
            })}

            {/* Hover point circle on 3M SORA */}
            {hoveredIndex !== null && (
              <circle
                cx={getX(hoveredIndex)}
                cy={getY(chronological[hoveredIndex].comp3m)}
                r="4.5"
                fill="#0F172A"
                stroke="#FFFFFF"
                strokeWidth="2"
              />
            )}
          </svg>
        </div>

        {/* Legend & Hover Data Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-slate-900 inline-block"></span>
              <span className="font-medium text-slate-700">3M Comp SORA (Benchmark)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-sky-600 inline-block"></span>
              <span className="text-slate-600">1M Comp SORA</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-indigo-500 inline-block"></span>
              <span className="text-slate-600">6M Comp SORA</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-emerald-500 border-b border-dashed border-emerald-500 inline-block"></span>
              <span className="text-slate-600">Daily Overnight SORA</span>
            </div>
          </div>

          {hoveredRecord && (
            <div className="font-mono text-xs bg-slate-50 px-3 py-1.5 rounded border border-slate-200 flex items-center gap-3">
              <span className="font-semibold text-slate-900">{hoveredRecord.date}</span>
              <span className="text-slate-400">|</span>
              <span>3M: <strong className="text-slate-900">{formatSoraRate(hoveredRecord.comp3m)}</strong></span>
              <span>1M: {formatSoraRate(hoveredRecord.comp1m)}</span>
              <span>Spot: {formatSoraRate(hoveredRecord.rate)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Historical Fixings Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-700" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              MAS Historical SORA Fixings Database
            </h3>
            <span className="text-xs text-slate-500 font-mono">
              ({filteredTableData.length} records)
            </span>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
            <input
              type="text"
              placeholder="Search date (e.g. 2026-09)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-emerald-500 text-slate-900 w-56 font-mono"
            />
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-100 text-slate-700 font-semibold sticky top-0 border-b border-slate-200 z-10">
              <tr>
                <th className="py-2.5 px-3">Fixing Date</th>
                <th className="py-2.5 px-3 text-right">Overnight SORA</th>
                <th className="py-2.5 px-3 text-right">1M Comp SORA</th>
                <th className="py-2.5 px-3 text-right">3M Comp SORA</th>
                <th className="py-2.5 px-3 text-right">6M Comp SORA</th>
                <th className="py-2.5 px-3 text-right">SORA Index</th>
                <th className="py-2.5 px-3 text-right">Volume (S$M)</th>
                <th className="py-2.5 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono tabular-nums">
              {filteredTableData.map((row) => (
                <tr key={row.date} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2 px-3 font-sans font-medium text-slate-900">
                    {row.date}
                  </td>
                  <td className="py-2 px-3 text-right font-medium text-slate-800">
                    {formatSoraRate(row.rate)}
                  </td>
                  <td className="py-2 px-3 text-right text-slate-700">
                    {formatSoraRate(row.comp1m)}
                  </td>
                  <td className="py-2 px-3 text-right font-bold text-slate-900">
                    {formatSoraRate(row.comp3m)}
                  </td>
                  <td className="py-2 px-3 text-right text-slate-700">
                    {formatSoraRate(row.comp6m)}
                  </td>
                  <td className="py-2 px-3 text-right text-emerald-800">
                    {row.soraIndex.toFixed(6)}
                  </td>
                  <td className="py-2 px-3 text-right text-slate-500">
                    {formatSGD(row.volumeSgdM * 1000000).replace('.00', '')}
                  </td>
                  <td className="py-2 px-3 text-center">
                    <button
                      onClick={() => onSelectRate(row)}
                      className="text-[11px] text-emerald-700 hover:text-emerald-900 underline font-medium font-sans"
                    >
                      Use Fix
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
