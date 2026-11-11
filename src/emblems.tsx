// Region emblems for act cards that show no character (docs/log/2026-11-10-review.md 3.4).
// Drawn for this project as plain filled silhouettes of a landmark type each region is known
// for (windmill, stone pillars, gate, great tree, scales, volcano, moon over sea, domed hall).
// They are generic shapes, not copies of the game's region emblems or of any game model.
// Project code (MPL-2.0) like the rest of src/.

const SHAPES: Record<string, { label: string; d: string }> = {
  Mondstadt: { label: '풍차', d:
    // tower, then four sails (a spar with a cloth on one side) turning around the hub
    'M10.4 10.2h3.2l1.6 11.8H8.8zM13.03 8.59L17.41 12.97L16.77 13.61L12.39 9.23zM13.52 10.36L16.77 13.61L15.39 14.99L12.71 11.17zM11.61 9.23L7.23 13.61L6.59 12.97L10.97 8.59zM9.84 9.72L6.59 12.97L5.21 11.59L9.03 8.91zM10.97 7.81L6.59 3.43L7.23 2.79L11.61 7.17zM10.48 6.04L7.23 2.79L8.61 1.41L11.29 5.23zM12.39 7.17L16.77 2.79L17.41 3.43L13.03 7.81zM14.16 6.68L17.41 3.43L18.79 4.81L14.97 7.49zM12 6.6a1.6 1.6 0 1 1 0 3.2 1.6 1.6 0 0 1 0-3.2z' },
  Liyue: { label: '돌기둥 봉우리', d:
    // three stone pillars rising from a cloud bank
    'M4.5 19V9.5c0-1.4.9-2.5 2-2.5s2 1.1 2 2.5V19z' +
    'M9.8 19V4.8C9.8 3.3 10.8 2 12 2s2.2 1.3 2.2 2.8V19z' +
    'M15.6 19v-6.5c0-1.2.8-2.2 1.9-2.2s1.9 1 1.9 2.2V19z' +
    'M2 20.2c1.5-1.4 3.2-1.4 4.6 0 1.5-1.4 3.3-1.4 4.8 0 1.5-1.4 3.3-1.4 4.8 0 1.5-1.4 3.3-1.4 4.8 0V22H2z' },
  Inazuma: { label: '신사 문', d:
    // curved top beam, tie beam, two posts
    'M2 4.2c3.2 1 6.6 1.4 10 1.4s6.8-.4 10-1.4l-.6 2.6c-3 .8-6.2 1.2-9.4 1.2S5.6 7.6 2.6 6.8z' +
    'M4.5 9.5h15v1.8h-15z M6.2 7.6h2.2V22H6.2z M15.6 7.6h2.2V22h-2.2z M11 7.9h2v1.6h-2z' },
  Sumeru: { label: '큰 나무', d:
    // wide canopy, trunk, roots
    'M12 2.5c3 0 5.2 1.6 5.8 3.6 2.3.4 4 2.1 4 4.2 0 2.4-2.1 4.2-4.8 4.2H7c-2.7 0-4.8-1.8-4.8-4.2 0-2.1 1.7-3.8 4-4.2.6-2 2.8-3.6 5.8-3.6z' +
    'M10.8 14.5h2.4v4.2c0 1 .8 1.8 2.6 2.4l1.2.4H7l1.2-.4c1.8-.6 2.6-1.4 2.6-2.4z' },
  Fontaine: { label: '저울', d:
    // stand, beam and two pans
    'M11.1 4.5h1.8V20h-1.8z M7 20.2h10V22H7z M3 6h18v1.6H3z' +
    'M12 2a1.6 1.6 0 1 1 0 3.2A1.6 1.6 0 0 1 12 2z' +
    'M5 7.6 2 14h1.4L5 10.4 6.6 14H8zM19 7.6 16 14h1.4l1.6-3.6 1.6 3.6H22z' +
    'M1.6 14.6h6.8c0 1.7-1.5 3-3.4 3s-3.4-1.3-3.4-3zM15.6 14.6h6.8c0 1.7-1.5 3-3.4 3s-3.4-1.3-3.4-3z' },
  Natlan: { label: '화산', d:
    // flat-topped cone with a crater dip, smoke rising from it
    'M2 22 8.6 10.8H10.4L12 12.4 13.6 10.8H15.4L22 22zM10.100000000000001 7.4a1.7 1.7 0 1 0 3.4 0a1.7 1.7 0 1 0 -3.4 0zM12.200000000000001 4.9a2.1 2.1 0 1 0 4.2 0a2.1 2.1 0 1 0 -4.2 0zM15.900000000000002 3a1.7 1.7 0 1 0 3.4 0a1.7 1.7 0 1 0 -3.4 0z' },
  'Nod-Krai': { label: '바다 위 달', d:
    // crescent over two waves
    'M14.5 2.2a7 7 0 1 0 5.8 11 5.6 5.6 0 0 1-5.8-11z' +
    'M2 17.2c1.7-1.3 3.3-1.3 5 0s3.3 1.3 5 0 3.3-1.3 5 0 3.3 1.3 5 0v1.9c-1.7 1.3-3.3 1.3-5 0s-3.3-1.3-5 0-3.3 1.3-5 0-3.3-1.3-5 0z' +
    'M2 20.6c1.7-1.3 3.3-1.3 5 0s3.3 1.3 5 0 3.3-1.3 5 0 3.3 1.3 5 0V22H2z' },
  Snezhnaya: { label: '둥근 지붕 궁전', d:
    // onion dome over a hall, two side towers
    'M12 2c.4 1.2 3.5 3 3.5 5.6 0 1.4-1 2.4-2.2 2.4h-2.6c-1.2 0-2.2-1-2.2-2.4C8.5 5 11.6 3.2 12 2z' +
    'M9 10.8h6V22H9z M3.5 13h4v9h-4z M16.5 13h4v9h-4z M5.5 10.4l1.6 2.1H3.9zM18.5 10.4l1.6 2.1h-3.2z' },
  Other: { label: '나침반', d:
    'M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20zm0 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16z' +
    'M12 5.5 14 12h-4zM12 18.5 10 12h4z' },
};

export const EMBLEM_REGIONS = Object.keys(SHAPES);
export const emblemLabel = (region?: string) => (SHAPES[region ?? ''] ?? SHAPES.Other).label;

export function Emblem({ region }: { region?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="emblem">
      <path d={(SHAPES[region ?? ''] ?? SHAPES.Other).d} />
    </svg>
  );
}
