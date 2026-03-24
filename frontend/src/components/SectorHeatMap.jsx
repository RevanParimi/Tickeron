import { useTheme, makeSIG } from '../theme';

function dominantSignal(items) {
  const counts = {};
  items.forEach(i => { if (i.signal) counts[i.signal] = (counts[i.signal] || 0) + 1; });
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
}

function avgConfidence(items) {
  const w = items.filter(i => i.confidence != null);
  if (!w.length) return 0;
  return w.reduce((s, i) => s + i.confidence, 0) / w.length;
}

function signalScore(sig) {
  return { BUY: 5, ACCUMULATE: 4, HOLD: 3, WATCH: 2, AVOID: 1 }[sig] || 3;
}

export default function SectorHeatMap({ watchlist }) {
  const { C } = useTheme();
  const SIG = makeSIG(C);
  const sectorMap = {};
  watchlist.forEach(item => {
    const s = item.sector || 'Unknown';
    if (!sectorMap[s]) sectorMap[s] = [];
    sectorMap[s].push(item);
  });

  const entries = Object.entries(sectorMap)
    .map(([sector, items]) => ({
      sector,
      items,
      sig: dominantSignal(items),
      conf: avgConfidence(items),
      score: signalScore(dominantSignal(items)),
    }))
    .sort((a, b) => b.score - a.score || b.items.length - a.items.length);

  if (!entries.length) return null;

  return (
    <div>
      <div style={{ fontSize: 9, color: C.dim, letterSpacing: '0.1em', marginBottom: 16 }}>SECTOR HEAT MAP</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
        {entries.map(({ sector, items, sig, conf }) => {
          const color = SIG[sig] || C.dim;
          const intensity = Math.round(conf * 100);
          return (
            <div key={sector} style={{
              background: `linear-gradient(160deg, ${color}18 0%, ${color}06 100%)`,
              border: `1px solid ${color}35`,
              borderTop: `2px solid ${color}`,
              borderRadius: 14, padding: '16px 18px',
              boxShadow: `0 4px 20px ${color}0A`,
              position: 'relative', overflow: 'hidden',
              cursor: 'default',
            }}>
              {/* Confidence fill bar at bottom */}
              <div style={{
                position: 'absolute', bottom: 0, left: 0,
                width: `${intensity}%`, height: 3,
                background: `linear-gradient(90deg, ${color}50, ${color})`,
                transition: 'width 0.8s ease',
              }} />

              <div style={{ fontSize: 11, fontWeight: 700, color: C.text, marginBottom: 10 }}>{sector}</div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 26, fontWeight: 900, color, lineHeight: 1 }}>{items.length}</div>
                  <div style={{ fontSize: 9, color: C.dim, marginTop: 2, letterSpacing: '0.06em' }}>SYMBOLS</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  {sig ? (
                    <div style={{
                      fontSize: 9, fontWeight: 800, color,
                      border: `1px solid ${color}40`, borderRadius: 5,
                      padding: '3px 9px', letterSpacing: '0.07em',
                      background: `${color}12`, marginBottom: 4,
                    }}>{sig}</div>
                  ) : (
                    <div style={{ fontSize: 9, color: C.dim, marginBottom: 4 }}>PENDING</div>
                  )}
                  <div style={{ fontSize: 9, color: C.dim }}>{intensity}% conf</div>
                </div>
              </div>

              {/* Symbol tags */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {items.slice(0, 3).map(i => (
                  <span key={i.symbol} style={{
                    fontSize: 9, color: C.dim,
                    background: `${C.muted}80`, borderRadius: 4, padding: '2px 7px',
                  }}>{i.symbol}</span>
                ))}
                {items.length > 3 && (
                  <span style={{ fontSize: 9, color: C.dim, padding: '2px 4px' }}>+{items.length - 3}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
