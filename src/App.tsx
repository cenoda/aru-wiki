import FocusView from './FocusView';
import MapView from './MapView';
import EmblemPreview from './EmblemPreview';

// `?view=map` keeps the full layered graph from the first prototype.
export default function App() {
  const view = new URLSearchParams(location.search).get('view');
  if (view === 'emblems') return <EmblemPreview />;
  return view === 'map' ? <MapView /> : <FocusView />;
}
