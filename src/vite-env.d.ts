/// <reference types="vite/client" />

declare module 'd3-force-3d' {
  // only the positional forces WikiGraph3D uses
  interface PositionForce { strength(s: number): PositionForce }
  export function forceX(x?: number): PositionForce;
  export function forceY(y?: number): PositionForce;
  export function forceZ(z?: number): PositionForce;
}
