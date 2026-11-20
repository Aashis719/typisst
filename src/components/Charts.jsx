import { useState } from 'react';

/**
 * Clean responsive SVG Line/Area chart for WPM over time or Historical Progress.
 */
export function WpmTimelineChart({ data = [], height = 190 }) {
  const [hoverIdx, setHoverIdx] = useState(null);

  if (!data || data.length === 0) {
    return (
      <div
        className="w-full flex items-center justify-center text-xs text-[var(--tf-text-muted)] border border-[var(--tf-border)]/50 rounded-xl"
        style={{ height }}
      >
        Complete a longer test to view per-second WPM progression.
      </div>
    );
  }

  const normalized =
    data.length === 1
      ? [
          { second: 0, wpm: data[0].wpm, raw: data[0].raw ?? data[0].wpm },
          data[0],
        ]
      : data;

  const width = 680;
  const padL = 40;
  const padR = 16;
  const padT = 18;
  const padB = 28;
  const innerW = width - padL - padR;
  const innerH = height - padT - padB;

  const maxVal = Math.max(
    40,
    ...normalized.map((d) => Math.max(d.wpm || 0, d.raw || 0))
  );
  const yMax = Math.ceil(maxVal / 20) * 20;

  const getX = (i) =>
    padL + (normalized.length === 1 ? innerW / 2 : (i / (normalized.length - 1)) * innerW);
  const getY = (val) => padT + innerH - (Math.max(0, val) / yMax) * innerH;

  const wpmPoints = normalized.map((d, i) => `${getX(i)},${getY(d.wpm)}`).join(' ');
  const rawPoints = normalized.map((d, i) => `${getX(i)},${getY(d.raw ?? d.wpm)}`).join(' ');

  const areaPoints = `${getX(0)},${padT + innerH} ${wpmPoints} ${getX(
    normalized.length - 1
  )},${padT + innerH}`;

  const yTicks = [0, Math.round(yMax / 2), yMax];

  const activePoint = hoverIdx !== null ? normalized[hoverIdx] : null;

  return (
    <div className="relative w-full select-none">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto overflow-visible"
        role="img"
        aria-label="WPM over time chart"
      >
        {/* Horizontal grid lines */}
        {yTicks.map((tick) => {
          const y = getY(tick);
          return (
            <g key={tick}>
              <line
                x1={padL}
                y1={y}
                x2={width - padR}
                y2={y}
                stroke="var(--tf-border)"
                strokeWidth="1"
                strokeDasharray={tick === 0 ? undefined : '3 3'}
              />
              <text
                x={padL - 8}
                y={y + 4}
                textAnchor="end"
                fontSize="10"
                fill="var(--tf-text-muted)"
                className="font-typing tabular-nums"
              >
                {tick}
              </text>
            </g>
          );
        })}

        {/* Area fill */}
        <polygon points={areaPoints} fill="var(--tf-accent)" fillOpacity="0.09" />

        {/* Raw WPM dashed line */}
        <polyline
          fill="none"
          stroke="var(--tf-text-dim)"
          strokeWidth="1.5"
          strokeDasharray="4 4"
          points={rawPoints}
        />

        {/* Net WPM line */}
        <polyline
          fill="none"
          stroke="var(--tf-accent)"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
          points={wpmPoints}
        />

        {/* X Axis labels */}
        {normalized.map((d, i) => {
          const step = Math.max(1, Math.floor(normalized.length / 6));
          if (i !== 0 && i !== normalized.length - 1 && i % step !== 0) return null;
          return (
            <text
              key={`${d.second}-${i}`}
              x={getX(i)}
              y={height - 6}
              textAnchor="middle"
              fontSize="10"
              fill="var(--tf-text-muted)"
              className="font-typing tabular-nums"
            >
              {d.second}s
            </text>
          );
        })}

        {/* Hover targets & active dot */}
        {normalized.map((d, i) => (
          <g key={`pt-${i}`}>
            {hoverIdx === i && (
              <>
                <line
                  x1={getX(i)}
                  y1={padT}
                  x2={getX(i)}
                  y2={padT + innerH}
                  stroke="var(--tf-border)"
                  strokeWidth="1"
                />
                <circle
                  cx={getX(i)}
                  cy={getY(d.wpm)}
                  r="4.5"
                  fill="var(--tf-accent)"
                  stroke="var(--tf-bg)"
                  strokeWidth="2"
                />
              </>
            )}
            <rect
              x={getX(i) - innerW / Math.max(2, normalized.length * 2)}
              y={padT}
              width={innerW / Math.max(1, normalized.length)}
              height={innerH}
              fill="transparent"
              onMouseEnter={() => setHoverIdx(i)}
              onMouseLeave={() => setHoverIdx(null)}
            />
          </g>
        ))}
      </svg>

      {/* Legend + Tooltip */}
      <div className="mt-2 flex items-center justify-between text-xs text-[var(--tf-text-muted)]">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-[var(--tf-accent)] inline-block" />
            <span>WPM</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 border-t border-dashed border-[var(--tf-text-dim)] inline-block" />
            <span>Raw WPM</span>
          </span>
        </div>
        {activePoint && (
          <div className="font-typing tabular-nums text-[var(--tf-text)]">
            {activePoint.second}s · {activePoint.wpm} wpm · {activePoint.raw ?? activePoint.wpm} raw
          </div>
        )}
      </div>
    </div>
  );
}

export function TrendLineChart({
  points = [],
  valueKey = 'wpm',
  unit = 'wpm',
  color = 'var(--tf-accent)',
  height = 200,
}) {
  const [hoverIdx, setHoverIdx] = useState(null);

  if (!points || points.length === 0) {
    return (
      <div
        className="w-full flex items-center justify-center text-xs text-[var(--tf-text-muted)] border border-[var(--tf-border)]/50 rounded-xl"
        style={{ height }}
      >
        No test data recorded for this period yet.
      </div>
    );
  }

  const displayPoints =
    points.length === 1 ? [points[0], { ...points[0], label: points[0].label }] : points;

  const width = 620;
  const padL = 40;
  const padR = 16;
  const padT = 18;
  const padB = 26;
  const innerW = width - padL - padR;
  const innerH = height - padT - padB;

  const values = displayPoints.map((p) => p[valueKey] || 0);
  const rawMax = Math.max(...values);
  const rawMin = Math.min(...values);
  const yMin = valueKey === 'accuracy' ? Math.max(0, Math.floor((rawMin - 10) / 10) * 10) : 0;
  const yMax =
    valueKey === 'accuracy'
      ? 100
      : Math.max(40, Math.ceil((rawMax + 10) / 20) * 20);
  const yRange = Math.max(1, yMax - yMin);

  const getX = (i) => padL + (i / Math.max(1, displayPoints.length - 1)) * innerW;
  const getY = (v) => padT + innerH - ((v - yMin) / yRange) * innerH;

  const lineStr = displayPoints.map((p, i) => `${getX(i)},${getY(p[valueKey])}`).join(' ');
  const yTicks = [yMin, Math.round(yMin + yRange / 2), yMax];
  const hovered = hoverIdx !== null ? displayPoints[hoverIdx] : null;

  return (
    <div className="w-full select-none">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
        {yTicks.map((tick) => {
          const y = getY(tick);
          return (
            <g key={tick}>
              <line
                x1={padL}
                y1={y}
                x2={width - padR}
                y2={y}
                stroke="var(--tf-border)"
                strokeWidth="1"
                strokeDasharray={tick === yMin ? undefined : '3 3'}
              />
              <text
                x={padL - 8}
                y={y + 4}
                textAnchor="end"
                fontSize="10"
                fill="var(--tf-text-muted)"
                className="font-typing tabular-nums"
              >
                {tick}
              </text>
            </g>
          );
        })}

        <polyline
          fill="none"
          stroke={color}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={lineStr}
        />

        {displayPoints.map((p, i) => (
          <g key={i}>
            <circle
              cx={getX(i)}
              cy={getY(p[valueKey])}
              r={hoverIdx === i ? 4.5 : 2.5}
              fill={color}
            />
            <circle
              cx={getX(i)}
              cy={getY(p[valueKey])}
              r={12}
              fill="transparent"
              className="cursor-pointer"
              onMouseEnter={() => setHoverIdx(i)}
              onMouseLeave={() => setHoverIdx(null)}
            />
          </g>
        ))}
      </svg>

      <div className="mt-1 h-4 flex items-center justify-end text-xs font-typing tabular-nums text-[var(--tf-text-muted)]">
        {hovered ? (
          <span className="text-[var(--tf-text)]">
            {hovered.label} · {hovered[valueKey]} {unit}
          </span>
        ) : (
          <span>Hover points to inspect values</span>
        )}
      </div>
    </div>
  );
}
