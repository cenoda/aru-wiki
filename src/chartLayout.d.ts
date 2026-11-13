// Types for chartLayout.js (plain JavaScript so the data build can run it in Node).
type End = string | { id: string };
export const LAYOUT_TICKS: number;
export function timeSpan(pageCount: number, portrait: boolean): number;
export function heightOf(order: number, lastOrder: number, span: number): number;
export function layoutChart(
  chart: { nodes: { id: string; hub: boolean; revealed: number }[]; links: { source: End; target: End; shared: number }[] },
  lastOrder: number,
  portrait: boolean,
): number[];
