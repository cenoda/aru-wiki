// Reader settings shared by the views. Nothing here leaves the browser: the view choice is the
// only thing stored (localStorage), and the 3D/2D decision reads no device specs (design.md §2).
import { versions } from './data';

export type ViewMode = '3d' | '2d';
/** Why the site started in 2D on its own. */
export type AutoReason = 'no-gpu' | 'reduced-motion' | 'slow';

const VIEW_KEY = 'aru.view';

/** The reader's own choice, if they made one on this site. */
export function savedView(): ViewMode | null {
  try {
    const v = localStorage.getItem(VIEW_KEY);
    return v === '3d' || v === '2d' ? v : null;
  } catch { return null; }
}
export function saveView(v: ViewMode) {
  try { localStorage.setItem(VIEW_KEY, v); } catch { /* storage off: the choice lasts this visit */ }
}

let gpuCache: boolean | undefined;
/**
 * Whether the browser gives a hardware-accelerated WebGL context. With hardware acceleration off
 * the browser refuses `failIfMajorPerformanceCaveat` instead of falling back to software rendering.
 * No renderer name or other device detail is read.
 */
export function hasGpu() {
  if (gpuCache !== undefined) return gpuCache;
  const canvas = document.createElement('canvas');
  const opts = { failIfMajorPerformanceCaveat: true };
  const gl = (canvas.getContext('webgl2', opts) ?? canvas.getContext('webgl', opts)) as WebGLRenderingContext | null;
  gl?.getExtension('WEBGL_lose_context')?.loseContext();
  return (gpuCache = !!gl);
}

export const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** What to show without a saved choice: 3D unless the browser says it will not run well. */
export function autoView(): { mode: ViewMode; reason?: AutoReason } {
  if (!hasGpu()) return { mode: '2d', reason: 'no-gpu' };
  if (reducedMotion()) return { mode: '2d', reason: 'reduced-motion' };
  return { mode: '3d' };
}

/** The version the reader has opened up to, kept while they switch views (not stored). */
let versionOrderNow: number | undefined;
export const sharedVersion = {
  get: () => versionOrderNow ?? versions.length - 1,
  set: (order: number) => { versionOrderNow = order; },
};
