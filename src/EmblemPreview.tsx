// Dev preview of the region emblems: ?view=emblems
import { Emblem, EMBLEM_REGIONS, emblemLabel } from './emblems';
import { REGION_KO } from './data';
import './site.css';
import './focus.css';

export default function EmblemPreview() {
  return (
    <div className="site" style={{ padding: 32, display: 'grid', gridTemplateColumns: 'repeat(3, 300px)', gap: 24 }}>
      {EMBLEM_REGIONS.map((r) => (
        <div key={r} className="t-archon" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="emblem-big" style={{ width: 120, height: 120 }}><Emblem region={r} /></div>
          <b>{REGION_KO[r] ?? r} · {emblemLabel(r)}</b>
          <div style={{ width: 236, height: 40, position: 'relative' }}>
            <div className="card-node act t-archon" style={{ position: 'absolute', inset: 0 }}>
              <span className="fig emblem-fig"><Emblem region={r} /></span><span className="name">카드 크기 예시</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
