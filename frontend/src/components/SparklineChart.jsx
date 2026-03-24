import { useState, useEffect } from 'react';
import api from '../api';

export default function SparklineChart({ symbol, width = 110, height = 38 }) {
  const [points, setPoints] = useState([]);

  useEffect(() => {
    api.get(`/signal/${symbol}/prices?period=1mo`)
      .then(({ data }) => {
        if (data.data?.length) setPoints(data.data.map(d => d.close));
      })
      .catch(() => {});
  }, [symbol]);

  if (points.length < 2) {
    return <div style={{ width, height, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.3, fontSize: 11 }}>—</div>;
  }

  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const px = 2, py = 4;
  const w = width - px * 2;
  const h = height - py * 2;

  const coords = points.map((p, i) => ({
    x: px + (i / (points.length - 1)) * w,
    y: py + h - ((p - min) / range) * h,
  }));

  const linePath = coords.map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L${coords[coords.length - 1].x.toFixed(1)},${py + h} L${coords[0].x.toFixed(1)},${py + h} Z`;

  const isUp = points[points.length - 1] >= points[0];
  const color = isUp ? '#22C55E' : '#EF4444';
  const change = ((points[points.length - 1] - points[0]) / points[0] * 100).toFixed(1);
  const gradId = `sg-${symbol.replace(/[^a-z0-9]/gi, '')}`;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <svg width={width} height={height} style={{ overflow: 'visible', flexShrink: 0 }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill={`url(#${gradId})`} />
        <path d={linePath} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        {/* End dot */}
        <circle cx={coords[coords.length - 1].x} cy={coords[coords.length - 1].y} r="2.5" fill={color} />
      </svg>
      <span style={{ fontSize: 10, color, fontWeight: 700, whiteSpace: 'nowrap' }}>
        {isUp ? '+' : ''}{change}%
      </span>
    </div>
  );
}
