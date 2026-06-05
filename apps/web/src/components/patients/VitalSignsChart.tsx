'use client';

import { useState } from 'react';

export interface VitalSignPoint {
  value: number;
  date: Date;
}

interface Range { min: number; max: number }

interface Props {
  dataPoints: VitalSignPoint[];
  unit: string;
  normalRange?: Range;
  alertRange?: Range;
}

// ── Layout ──────────────────────────────────────────────────────────────────
const W   = 620;
const H   = 210;
const PAD = { t: 20, r: 24, b: 44, l: 56 };
const iW  = W - PAD.l - PAD.r;
const iH  = H - PAD.t - PAD.b;

// ── Colours ──────────────────────────────────────────────────────────────────
const C_GREEN  = '#16A34A';
const C_ORANGE = '#EA580C';
const C_RED    = '#DC2626';
const C_BLUE   = '#3949AB';

function zoneColor(v: number, nr?: Range, ar?: Range): string {
  if (!nr) return C_BLUE;
  if (v >= nr.min && v <= nr.max) return C_GREEN;
  if (!ar) return C_ORANGE;
  return (v < ar.min || v > ar.max) ? C_RED : C_ORANGE;
}

// ── Date helpers ──────────────────────────────────────────────────────────────
const fmtShort = (d: Date) =>
  new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit' }).format(d);
const fmtLong = (d: Date) =>
  new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  }).format(d);

// ── Smooth Catmull-Rom → cubic bezier path ────────────────────────────────────
function smoothPath(pts: { x: number; y: number }[], t = 0.35): string {
  if (pts.length < 2) return `M${pts[0]?.x ?? 0} ${pts[0]?.y ?? 0}`;
  let d = `M ${pts[0]!.x} ${pts[0]!.y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)]!;
    const p1 = pts[i]!;
    const p2 = pts[i + 1]!;
    const p3 = pts[Math.min(pts.length - 1, i + 2)]!;
    const cp1x = p1.x + (p2.x - p0.x) * t;
    const cp1y = p1.y + (p2.y - p0.y) * t;
    const cp2x = p2.x - (p3.x - p1.x) * t;
    const cp2y = p2.y - (p3.y - p1.y) * t;
    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x} ${p2.y}`;
  }
  return d;
}

// ── Stats card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, unit, color }: { label: string; value: string; unit: string; color: string }) {
  return (
    <div className="flex flex-col items-center px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-100 min-w-[80px]">
      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">{label}</span>
      <span className="text-lg font-bold leading-none" style={{ color }}>{value}</span>
      <span className="text-[10px] text-slate-400 mt-0.5">{unit}</span>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
interface TooltipState {
  xPct: number;
  yPct: number;
  value: number;
  color: string;
  date: Date;
  index: number;
}

export function VitalSignsChart({ dataPoints, unit, normalRange, alertRange }: Props) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  if (dataPoints.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-300">
        <svg className="w-12 h-12 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13l4-4 4 4 4-8 4 4" />
        </svg>
        <p className="text-sm text-slate-400">Aucune mesure sur cette période</p>
      </div>
    );
  }

  const values  = dataPoints.map((p) => p.value);
  const minVal  = Math.min(...values);
  const maxVal  = Math.max(...values);
  const avgVal  = values.reduce((a, b) => a + b, 0) / values.length;
  const lastVal = values[values.length - 1]!;

  // Y scale — include range boundaries in the domain so bands are always visible
  const domainLow  = Math.min(minVal, normalRange?.min ?? minVal, alertRange?.min ?? minVal);
  const domainHigh = Math.max(maxVal, normalRange?.max ?? maxVal, alertRange?.max ?? maxVal);
  const spread     = domainHigh - domainLow;
  const yPad       = Math.max(spread * 0.15, 3);
  const yMin       = Math.max(0, domainLow - yPad);
  const yMax       = domainHigh + yPad;

  const toX = (i: number) =>
    dataPoints.length === 1 ? PAD.l + iW / 2 : PAD.l + (i / (dataPoints.length - 1)) * iW;
  const toY = (v: number) => PAD.t + iH - ((v - yMin) / (yMax - yMin)) * iH;

  const pts = dataPoints.map((pt, i) => ({ x: toX(i), y: toY(pt.value), pt }));
  const linePath = smoothPath(pts.map((p) => ({ x: p.x, y: p.y })));

  // Filled area under curve
  const areaPath = `${linePath} L ${pts[pts.length - 1]!.x} ${PAD.t + iH} L ${pts[0]!.x} ${PAD.t + iH} Z`;

  // Y-axis grid (4 sections)
  const gridVals = Array.from({ length: 5 }, (_, i) => yMin + (i / 4) * (yMax - yMin));

  // X-axis label sampling — max 8 labels
  const labelStep = Math.max(1, Math.ceil(dataPoints.length / 8));

  // Normal zone clamped to chart area
  const nBandTop    = normalRange ? Math.max(PAD.t,        toY(Math.min(normalRange.max, yMax))) : null;
  const nBandBottom = normalRange ? Math.min(PAD.t + iH,   toY(Math.max(normalRange.min, yMin))) : null;

  // Alert dashed lines
  const alertTopY    = alertRange ? toY(Math.min(alertRange.max, yMax)) : null;
  const alertBottomY = alertRange ? toY(Math.max(alertRange.min, yMin)) : null;

  const fmt1 = (v: number) => (v % 1 === 0 ? v.toFixed(0) : v.toFixed(1));

  return (
    <div className="space-y-4">
      {/* Stats summary */}
      <div className="flex items-center gap-2 flex-wrap">
        <StatCard label="Dernière" value={fmt1(lastVal)} unit={unit} color={zoneColor(lastVal, normalRange, alertRange)} />
        <StatCard label="Min"      value={fmt1(minVal)}  unit={unit} color={zoneColor(minVal,  normalRange, alertRange)} />
        <StatCard label="Moyenne"  value={fmt1(avgVal)}  unit={unit} color={zoneColor(avgVal,  normalRange, alertRange)} />
        <StatCard label="Max"      value={fmt1(maxVal)}  unit={unit} color={zoneColor(maxVal,  normalRange, alertRange)} />

        {normalRange && (
          <div className="ml-auto flex items-center gap-4 text-xs text-slate-400 flex-wrap">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-green-500/20 border border-green-500/40 inline-block" />
              Zone normale {fmt1(normalRange.min)}–{fmt1(normalRange.max)} {unit}
            </span>
            {alertRange && (
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-5 border-t border-dashed border-red-400" />
                Seuils d&apos;alerte
              </span>
            )}
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="relative overflow-x-auto rounded-xl border border-slate-100">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          width="100%"
          style={{ minWidth: Math.max(W, dataPoints.length * 36), display: 'block' }}
          className="overflow-visible"
        >
          <defs>
            {/* Gradient fill under curve */}
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={C_BLUE} stopOpacity="0.18" />
              <stop offset="100%" stopColor={C_BLUE} stopOpacity="0" />
            </linearGradient>
            {/* Clip to chart area */}
            <clipPath id="chartClip">
              <rect x={PAD.l} y={PAD.t} width={iW} height={iH} />
            </clipPath>
          </defs>

          {/* Chart background */}
          <rect x={PAD.l} y={PAD.t} width={iW} height={iH} fill="white" />

          {/* Normal zone band */}
          {nBandTop !== null && nBandBottom !== null && (
            <rect
              x={PAD.l} y={nBandTop}
              width={iW} height={nBandBottom - nBandTop}
              fill="#22C55E" fillOpacity={0.1}
              clipPath="url(#chartClip)"
            />
          )}

          {/* Alert dashed lines */}
          {alertTopY !== null && alertTopY >= PAD.t && alertTopY <= PAD.t + iH && (
            <line
              x1={PAD.l} y1={alertTopY} x2={PAD.l + iW} y2={alertTopY}
              stroke={C_RED} strokeWidth={1} strokeDasharray="4 3" strokeOpacity={0.5}
            />
          )}
          {alertBottomY !== null && alertBottomY >= PAD.t && alertBottomY <= PAD.t + iH && (
            <line
              x1={PAD.l} y1={alertBottomY} x2={PAD.l + iW} y2={alertBottomY}
              stroke={C_RED} strokeWidth={1} strokeDasharray="4 3" strokeOpacity={0.5}
            />
          )}

          {/* Grid lines + Y labels */}
          {gridVals.map((v, i) => {
            const y = toY(v);
            return (
              <g key={i}>
                <line x1={PAD.l} y1={y} x2={PAD.l + iW} y2={y} stroke="#F1F5F9" strokeWidth={1} />
                <text x={PAD.l - 8} y={y + 4} textAnchor="end" fontSize={10} fill="#94A3B8" fontFamily="system-ui">
                  {fmt1(v)}
                </text>
              </g>
            );
          })}

          {/* Normal range boundary labels on right axis */}
          {normalRange && nBandTop !== null && (
            <text x={PAD.l + iW + 6} y={nBandTop + 4} fontSize={9} fill={C_GREEN} fontFamily="system-ui">
              {fmt1(normalRange.max)}
            </text>
          )}
          {normalRange && nBandBottom !== null && (
            <text x={PAD.l + iW + 6} y={nBandBottom + 4} fontSize={9} fill={C_GREEN} fontFamily="system-ui">
              {fmt1(normalRange.min)}
            </text>
          )}

          {/* Area fill */}
          <path d={areaPath} fill="url(#areaGrad)" clipPath="url(#chartClip)" />

          {/* Line */}
          <path
            d={linePath}
            fill="none"
            stroke={C_BLUE}
            strokeWidth={2.5}
            strokeLinejoin="round"
            strokeLinecap="round"
            clipPath="url(#chartClip)"
          />

          {/* Dots */}
          {pts.map((p, i) => {
            const color = zoneColor(p.pt.value, normalRange, alertRange);
            const xPct  = (p.x / W) * 100;
            const yPct  = (p.y / H) * 100;
            const isHovered = tooltip?.index === i;
            return (
              <g key={i}>
                {isHovered && (
                  <circle cx={p.x} cy={p.y} r={10} fill={color} fillOpacity={0.15} />
                )}
                <circle
                  cx={p.x} cy={p.y} r={isHovered ? 6 : 5}
                  fill={color} stroke="white" strokeWidth={2}
                  style={{ cursor: 'pointer', transition: 'r 0.1s' }}
                  onMouseEnter={() => setTooltip({ xPct, yPct, value: p.pt.value, color, date: p.pt.date, index: i })}
                  onMouseLeave={() => setTooltip(null)}
                />
                {/* X-axis label */}
                {(i % labelStep === 0 || i === dataPoints.length - 1) && (
                  <text
                    x={p.x} y={PAD.t + iH + 16}
                    textAnchor="middle" fontSize={9} fill="#94A3B8" fontFamily="system-ui"
                  >
                    {fmtShort(p.pt.date)}
                  </text>
                )}
              </g>
            );
          })}

          {/* Vertical indicator line on hover */}
          {tooltip && (
            <line
              x1={pts[tooltip.index]!.x} y1={PAD.t}
              x2={pts[tooltip.index]!.x} y2={PAD.t + iH}
              stroke={tooltip.color} strokeWidth={1} strokeDasharray="3 3" strokeOpacity={0.4}
              style={{ pointerEvents: 'none' }}
            />
          )}
        </svg>

        {/* Tooltip div — positioned via percentage over the SVG */}
        {tooltip && (
          <div
            className="absolute pointer-events-none z-10"
            style={{
              left:      `${tooltip.xPct}%`,
              top:       `${tooltip.yPct}%`,
              transform: 'translate(-50%, -130%)',
            }}
          >
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 px-3 py-2.5 min-w-[110px] text-center">
              <p className="text-base font-bold leading-none" style={{ color: tooltip.color }}>
                {fmt1(tooltip.value)} <span className="text-xs font-normal text-slate-400">{unit}</span>
              </p>
              <p className="text-[11px] text-slate-400 mt-1">{fmtLong(tooltip.date)}</p>
            </div>
            {/* Arrow */}
            <div className="flex justify-center">
              <div
                className="w-2.5 h-2.5 bg-white border-r border-b border-slate-200 rotate-45"
                style={{ marginTop: '-5px' }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
