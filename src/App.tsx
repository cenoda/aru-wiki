import FocusView from './FocusView';
import MapView from './MapView';

// `?view=map` keeps the full layered graph from the first prototype.
export default function App() {
  return new URLSearchParams(location.search).get('view') === 'map' ? <MapView /> : <FocusView />;
}
