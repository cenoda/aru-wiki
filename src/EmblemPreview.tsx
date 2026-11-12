// Dev preview of the region emblems and the event mark: ?view=emblems
import { Emblem, EMBLEM_REGIONS, emblemLabel, EventMark, eventMarkLabel, SeriesBadge, seriesBadgeLabel } from './emblems';
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
      <div className="t-world" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16 }}>
          <div className="emblem-big" style={{ width: 120, height: 120 }}><Emblem region="Inazuma" /></div>
          <div className="emblem-big series-badge-big" style={{ width: 64, height: 64 }}><SeriesBadge /></div>
        </div>
        <b>시리즈 표시 · {seriesBadgeLabel} (지역 문장 위)</b>
        <div style={{ width: 236, height: 56, position: 'relative' }}>
          <div className="card-node unit stack t-world" style={{ position: 'absolute', inset: 0 }}>
            <span className="fig emblem-fig"><Emblem region="Inazuma" /><SeriesBadge /></span>
            <span className="unit-body"><span className="name">시리즈 카드 크기 예시</span><span className="unit-meta"><b>시리즈</b><span>임무 6</span><span>2.0</span></span></span>
          </div>
        </div>
        <div style={{ width: 236, height: 56, position: 'relative' }}>
          <div className="card-node unit stack t-world" style={{ position: 'absolute', inset: 0 }}>
            <span className="fig emblem-fig"><Emblem region="Inazuma" /></span>
            <span className="unit-body"><span className="name">연속 임무 (표시 없음)</span><span className="unit-meta"><b>연속 임무</b><span>임무 2</span><span>2.0</span></span></span>
          </div>
        </div>
      </div>
      <div className="t-event" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div className="emblem-big" style={{ width: 120, height: 120 }}><EventMark /></div>
        <b>이벤트 · {eventMarkLabel}</b>
        <div style={{ width: 236, height: 56, position: 'relative' }}>
          <div className="card-node unit stack t-event" style={{ position: 'absolute', inset: 0 }}>
            <span className="fig emblem-fig"><EventMark /></span>
            <span className="unit-body"><span className="name">이벤트 카드 크기 예시</span><span className="unit-meta"><b>이벤트</b><span>임무 4</span><span>2.4</span></span></span>
          </div>
        </div>
      </div>
    </div>
  );
}
