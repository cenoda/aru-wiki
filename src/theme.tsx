import { useEffect, useState } from 'react';

/** Site colour theme. Dark unless the reader picked light (kept in localStorage). */
export type Theme = 'dark' | 'light';
const KEY = 'aru-theme';
const EVENT = 'aru-theme';

export const currentTheme = (): Theme => (document.documentElement.dataset.theme === 'light' ? 'light' : 'dark');

export function setTheme(t: Theme) {
  document.documentElement.dataset.theme = t;
  try { localStorage.setItem(KEY, t); } catch { /* private mode: this visit only */ }
  dispatchEvent(new Event(EVENT));
}

/** The current theme; re-renders when it changes here or in another tab. */
export function useTheme(): Theme {
  const [t, setT] = useState(currentTheme);
  useEffect(() => {
    const on = () => setT(currentTheme());
    const onStorage = (e: StorageEvent) => {
      if (e.key !== KEY) return;
      document.documentElement.dataset.theme = e.newValue === 'light' ? 'light' : 'dark';
      on();
    };
    addEventListener(EVENT, on);
    addEventListener('storage', onStorage);
    return () => { removeEventListener(EVENT, on); removeEventListener('storage', onStorage); };
  }, []);
  return t;
}

export function ThemeToggle() {
  const t = useTheme();
  const next: Theme = t === 'dark' ? 'light' : 'dark';
  const label = next === 'light' ? '라이트 모드로 바꾸기' : '다크 모드로 바꾸기';
  return (
    <button type="button" className="band theme-toggle" onClick={() => setTheme(next)} aria-label={label} title={label}>
      {t === 'dark' ? (
        // moon: dark now
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" /></svg>
      ) : (
        // sun: light now
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="12" r="4" fill="currentColor" stroke="none" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      )}
    </button>
  );
}
