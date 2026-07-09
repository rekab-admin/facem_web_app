import { describe, expect, it } from "vitest";

import { computeDimensions, recommendFrameSize } from "./mockData";
import type { FacialPoint } from "./types";

const POINTS: FacialPoint[] = [
  { id: "leftPupil", label: "Left Pupil", x: 0.4, y: 0.4 },
  { id: "rightPupil", label: "Right Pupil", x: 0.6, y: 0.4 },
  { id: "noseBridgeLeft", label: "Nose Bridge (L)", x: 0.48, y: 0.45 },
  { id: "noseBridgeRight", label: "Nose Bridge (R)", x: 0.52, y: 0.45 },
  { id: "leftTemple", label: "Left Temple", x: 0.2, y: 0.4 },
  { id: "rightTemple", label: "Right Temple", x: 0.8, y: 0.4 },
  { id: "chin", label: "Chin", x: 0.5, y: 0.8 },
];

describe("computeDimensions", () => {
  it("derives mm dimensions from normalized point distances and the scale factor", () => {
    const dimensions = computeDimensions(POINTS, 100);

    expect(dimensions.pupillaryDistanceMm).toBeCloseTo(20, 5);
    expect(dimensions.faceWidthMm).toBeCloseTo(60, 5);
    expect(dimensions.bridgeWidthMm).toBeCloseTo(4, 5);
  });

  it("scales linearly with mmPerUnit", () => {
    const at100 = computeDimensions(POINTS, 100);
    const at200 = computeDimensions(POINTS, 200);

    expect(at200.pupillaryDistanceMm).toBeCloseTo(at100.pupillaryDistanceMm * 2, 5);
  });
});

describe("recommendFrameSize", () => {
  it("recommends S below 130mm", () => {
    expect(recommendFrameSize(129.9)).toBe("S");
  });

  it("recommends M between 130 and 145mm", () => {
    expect(recommendFrameSize(130)).toBe("M");
    expect(recommendFrameSize(144.9)).toBe("M");
  });

  it("recommends L at 145mm and above", () => {
    expect(recommendFrameSize(145)).toBe("L");
  });
});
