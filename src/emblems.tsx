// Region emblems for act cards that show no character (docs/log/2026-11-10-review.md 3.4).
// Drawn for this project from plain shapes (feather, peaks, bolt, leaf, drop, flame, moon,
// snowflake, star); they are not copies of the game's region or element emblems.
// Project code (MPL-2.0); the drawings fall under the project licence like the rest of src/.

const PATHS: Record<string, string> = {
  // a feather on the wind
  Mondstadt: 'M17.5 3.5c-6 1-10 5.5-11 12.5l-1.5 4.5M17.5 3.5c.5 5-2 9.5-8.5 11.5M17.5 3.5L9.5 12M3 9.5c2-1 4-1 6 0M15 18c2 .2 4-.3 6-1.5',
  // three peaks over a line of cloud
  Liyue: 'M2.5 18.5l5.5-9 3.5 5 3-4.5 7 8.5M5 21h14M8 9.5l1.6-2.6',
  // a bolt between two arcs
  Inazuma: 'M13.5 2.5L7 13h5l-1.5 8.5L17 11h-5l1.5-8.5M4.5 6.5a9 9 0 0 0 0 11M19.5 6.5a9 9 0 0 1 0 11',
  // a leaf with its veins
  Sumeru: 'M4 20C4 10 10 4 20 4c0 10-6 16-16 16zM4 20L14 10M9 15h4M12 12V8.5',
  // a drop above a ripple
  Fontaine: 'M12 3c3.5 4.5 5.5 7.5 5.5 10a5.5 5.5 0 0 1-11 0C6.5 10.5 8.5 7.5 12 3zM3 21c2-1.3 4-1.3 6 0s4 1.3 6 0 4-1.3 6 0',
  // a flame
  Natlan: 'M12 21.5a6.5 6.5 0 0 1-6.5-6.5c0-3.5 2.5-5.5 3.5-8.5 1.5 2 2 3.5 2 5 1.5-1.5 2.5-4.5 2-8.5 3.5 2.5 5.5 7 5.5 12a6.5 6.5 0 0 1-6.5 6.5zM12 21.5c-1.7 0-3-1.3-3-3 0-1.8 1.5-2.7 3-4.5 1.5 1.8 3 2.7 3 4.5 0 1.7-1.3 3-3 3z',
  // a crescent and a small star
  'Nod-Krai': 'M15 3.5a8.5 8.5 0 1 0 5.5 14.5A7 7 0 0 1 15 3.5zM19 4.5v3M17.5 6h3',
  // a six-armed snowflake
  Snezhnaya: 'M12 2.5v19M3.8 7.2l16.4 9.6M3.8 16.8l16.4-9.6M9.5 4.5L12 7l2.5-2.5M9.5 19.5L12 17l2.5 2.5M4.5 10.5L7.7 9.3 7 6M19.5 13.5l-3.2 1.2.7 3.3M4.5 13.5l3.2 1.2-.7 3.3M19.5 10.5l-3.2-1.2.7-3.3',
  // a four-pointed star
  Other: 'M12 2.5l2.2 7.3 7.3 2.2-7.3 2.2L12 21.5l-2.2-7.3L2.5 12l7.3-2.2z',
};

export function Emblem({ region }: { region?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="emblem">
      <path d={PATHS[region ?? ''] ?? PATHS.Other} />
    </svg>
  );
}
