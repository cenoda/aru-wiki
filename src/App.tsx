import { type ComponentType, useEffect, useState } from 'react';
import { loadData } from './data';

// The views read the graph data while their modules load, so import them only after loadData().
// `?view=map` keeps the full layered graph from the first prototype.
const loadView = async (): Promise<ComponentType> => {
  const map = new URLSearchParams(location.search).get('view') === 'map';
  await loadData(); // first: importing a view runs its top-level code, which reads the data
  return (await (map ? import('./MapView') : import('./FocusView'))).default;
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
