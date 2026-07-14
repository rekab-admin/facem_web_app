export interface Point2D {
  x: number;
  y: number;
}

/** Euclidean distance between two normalized (0-1) image coordinates. */
export function distance(a: Point2D, b: Point2D): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
