import { type ComponentType, useCallback, useEffect, useState } from 'react';
import { loadData } from './data';
import type { Graph3DProps } from './Graph3DView';
import { type AutoReason, autoView, hasGpu, savedView, saveView, type ViewMode } from './settings';

type Page = ViewMode | 'map';
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- views differ in props; each use below narrows
type AnyView = ComponentType<any>;

// Importing a view runs its top-level code, which reads the data, so the data comes first.
// Each view is its own chunk: 3D readers never download the 2D layout engine and the reverse.
const importers = {
  '3d': () => import('./Graph3DView'),
  '2d': () => import('./FocusView'),
  map: () => import('./MapView'),
} satisfies Record<Page, () => Promise<{ default: AnyView }>>;

/**
 * `?view=3d|2d|map` forces a page for this visit. Otherwise the reader's saved choice,
 * otherwise 3D unless the browser says it will not run well (settings.ts).
 */
function startPage(): { page: Page; reason?: AutoReason } {
  const forced = new URLSearchParams(location.search).get('view');
  if (forced === '3d' || forced === '2d' || forced === 'map') return { page: forced };
  const saved = savedView();
  if (saved) return { page: saved };
  const auto = autoView();
  return { page: auto.mode, reason: auto.reason };
}

const NOTICE: Record<AutoReason, string> = {
  'no-gpu': '브라우저의 하드웨어 가속이 꺼져 있어 2D로 시작했습니다.',
  'reduced-motion': '브라우저나 기기의 애니메이션 줄이기 설정이 켜져 있어 2D로 시작했습니다.',
  slow: '3D 화면이 느리게 그려져 2D로 바꿨습니다.',
};

export default function App() {
  const [start] = useState(startPage);
  const [page, setPage] = useState<Page>(start.page);
  const [reason, setReason] = useState<AutoReason | undefined>(start.reason);
  const [views, setViews] = useState<Partial<Record<Page, AnyView>>>({});
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (views[page]) return;
    let live = true;
    setFailed(false);
    loadData()
      .then(() => importers[page]())
      .then((m) => live && setViews((v) => ({ ...v, [page]: m.default })), () => live && setFailed(true));
    return () => { live = false; };
  }, [page, views, attempt]);

  /** The reader's own choice: saved in this browser only. */
  const choose = useCallback((mode: ViewMode) => { saveView(mode); setReason(undefined); setPage(mode); }, []);
  /** Measured slowness switches to 2D for this visit only; the reader can switch back. */
  const onSlow = useCallback(() => {
    if (savedView() || new URLSearchParams(location.search).get('view')) return;
    setReason('slow');
    setPage('2d');
  }, []);
  const onOpen2D = useCallback((actId: string) => {
    window.history.pushState(null, '', `?act=${encodeURIComponent(actId)}`);
    setReason(undefined);
    setPage('2d');
  }, []);

  const View = views[page];
  if (!View) {
    return (
      <div className="app-loading" role="status">
        {failed
          ? <>데이터를 불러오지 못했습니다. <button type="button" onClick={() => setAttempt((n) => n + 1)}>다시 시도</button></>
          : '불러오는 중…'}
      </div>
    );
  }
  if (page === 'map') return <View />;

  const toggle = (floating: boolean) => (
    <div className={`view-toggle${floating ? ' floating' : ''}`} role="group" aria-label="보기 방식">
      <button type="button" aria-pressed={page === '3d'} onClick={() => choose('3d')}>3D</button>
      <button type="button" aria-pressed={page === '2d'} onClick={() => choose('2d')}>2D</button>
    </div>
  );

  if (page === '3d') {
    const Graph3D = View as ComponentType<Graph3DProps>;
    const act = new URLSearchParams(location.search).get('act');
    // 3D without hardware acceleration only happens when the reader picked it: draw the light scene.
    return <Graph3D low={!hasGpu()} onSlow={onSlow} onOpen2D={onOpen2D} initialAct={act} toggle={toggle(false)} />;
  }
  return (
    <>
      <View />
      {toggle(true)}
      {reason && (
        <div className="view-notice" role="status">
          <span>{NOTICE[reason]}</span>
          <button type="button" onClick={() => choose('3d')}>{reason === 'slow' ? '3D로 다시 보기' : '3D로 보기'}</button>
          <button type="button" className="dismiss" aria-label="닫기" onClick={() => setReason(undefined)}>×</button>
        </div>
      )}
    </>
  );
}
