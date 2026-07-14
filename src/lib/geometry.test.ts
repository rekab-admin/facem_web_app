import { describe, expect, it } from "vitest";

import { distance } from "./geometry";

describe("distance", () => {
  it("returns 0 for identical points", () => {
    expect(distance({ x: 0.5, y: 0.5 }, { x: 0.5, y: 0.5 })).toBe(0);
  });

  it("computes Euclidean distance", () => {
    expect(distance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBeCloseTo(5, 10);
  });
});
