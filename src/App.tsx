import { type ComponentType, useEffect, useState } from 'react';
import { loadData } from './data';
import { startVersion } from './split';

// The views read the graph data while their modules load, so import them only after loadData().
// The site opens on the lore theme in 3D (with its article pages, `/wiki/<name>`; old `?page=`, see route.ts). `?view=quests` is the
// quest map; old quest links (`?act=`, `?unit=` without a view) still open it. `?view=wiki3d` is the
// 3D view's old address. `?view=map` keeps the layered graph of the first prototype and
// `?view=emblems` previews the region emblems.
const loadView = async (): Promise<ComponentType> => {
  const q = new URLSearchParams(location.search);
  const view = q.get('view') ?? (q.has('act') || q.has('unit') ? 'quests' : 'wiki3d');
  // first: importing a view runs its top-level code, which reads the data. Only the version the
  // address asks for (`?v=`, else the latest) and those before it are downloaded (src/split.ts).
  await loadData(startVersion());
  if (view === 'quests') return (await import('./FocusView')).default;
  if (view === 'map') return (await import('./MapView')).default;
  if (view === 'emblems') return (await import('./EmblemPreview')).default; // region emblem preview
  return (await import('./WikiGraph3D')).default;
};

export default function App() {
  const [View, setView] = useState<ComponentType | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let live = true;
    setFailed(false);
    loadView().then((v) => live && setView(() => v), () => live && setFailed(true));
    return () => { live = false; };
  }, [attempt]);

  if (View) return <View />;
  return (
    <div className="app-loading" role="status">
      {failed
        ? <>데이터를 불러오지 못했습니다. <button type="button" onClick={() => setAttempt((n) => n + 1)}>다시 시도</button></>
        : '불러오는 중…'}
    </div>
  );
}
