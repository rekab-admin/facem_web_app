import { describe, expect, it } from "vitest";

import { evaluateFacePosition } from "./facePosition";
import type { FacialPoint } from "@/lib/types";

function pointsFor(leftTemple: { x: number; y: number }, rightTemple: { x: number; y: number }, chin: { x: number; y: number }): FacialPoint[] {
  return [
    { id: "leftTemple", label: "Left Temple", ...leftTemple },
    { id: "rightTemple", label: "Right Temple", ...rightTemple },
    { id: "chin", label: "Chin", ...chin },
  ];
}

describe("evaluateFacePosition", () => {
  it("reports no-face when a required point is missing", () => {
    expect(evaluateFacePosition([{ id: "leftTemple", label: "Left Temple", x: 0.3, y: 0.5 }])).toBe("no-face");
  });

  it("reports good when the face is centered and sized to fill the oval", () => {
    const points = pointsFor({ x: 0.28, y: 0.45 }, { x: 0.72, y: 0.45 }, { x: 0.5, y: 0.75 });
    expect(evaluateFacePosition(points)).toBe("good");
  });

  it("reports too-far when the detected face is much smaller than the oval", () => {
    const points = pointsFor({ x: 0.45, y: 0.48 }, { x: 0.55, y: 0.48 }, { x: 0.5, y: 0.58 });
    expect(evaluateFacePosition(points)).toBe("too-far");
  });

  it("reports too-close when the detected face is much larger than the oval", () => {
    const points = pointsFor({ x: 0.05, y: 0.4 }, { x: 0.95, y: 0.4 }, { x: 0.5, y: 0.9 });
    expect(evaluateFacePosition(points)).toBe("too-close");
  });

  it("reports off-center when well-sized but shifted away from the oval's center", () => {
    const points = pointsFor({ x: 0.02, y: 0.45 }, { x: 0.46, y: 0.45 }, { x: 0.24, y: 0.75 });
    expect(evaluateFacePosition(points)).toBe("off-center");
  });
});
