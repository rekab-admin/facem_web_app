import { describe, expect, it } from "vitest";

import { computeDimensions, determineFaceShape, recommendFrameSize } from "./mockData";
import type { FacialPoint, MeasurementDimensions } from "./types";

const POINTS: FacialPoint[] = [
  { id: "leftPupil", label: "Left Pupil", x: 0.4, y: 0.4 },
  { id: "rightPupil", label: "Right Pupil", x: 0.6, y: 0.4 },
  { id: "noseBridgeLeft", label: "Nose Bridge (L)", x: 0.48, y: 0.45 },
  { id: "noseBridgeRight", label: "Nose Bridge (R)", x: 0.52, y: 0.45 },
  { id: "foreheadLeft", label: "Forehead (L)", x: 0.25, y: 0.2 },
  { id: "foreheadRight", label: "Forehead (R)", x: 0.75, y: 0.2 },
  { id: "leftTemple", label: "Left Temple", x: 0.2, y: 0.4 },
  { id: "rightTemple", label: "Right Temple", x: 0.8, y: 0.4 },
  { id: "jawLeft", label: "Jaw (L)", x: 0.22, y: 0.65 },
  { id: "jawRight", label: "Jaw (R)", x: 0.78, y: 0.65 },
  { id: "faceTop", label: "Forehead Top", x: 0.5, y: 0.1 },
  { id: "chin", label: "Chin", x: 0.5, y: 0.8 },
];

describe("computeDimensions", () => {
  it("derives mm dimensions from normalized point distances and the scale factor", () => {
    const dimensions = computeDimensions(POINTS, 100);

    expect(dimensions.pupillaryDistanceMm).toBeCloseTo(20, 5);
    expect(dimensions.faceWidthMm).toBeCloseTo(60, 5);
    expect(dimensions.bridgeWidthMm).toBeCloseTo(4, 5);
    expect(dimensions.faceLengthMm).toBeCloseTo(70, 5);
    expect(dimensions.foreheadWidthMm).toBeCloseTo(50, 5);
    expect(dimensions.jawWidthMm).toBeCloseTo(56, 5);
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

describe("determineFaceShape", () => {
  function dims(overrides: Partial<MeasurementDimensions>): MeasurementDimensions {
    return {
      pupillaryDistanceMm: 60,
      faceWidthMm: 120,
      bridgeWidthMm: 15,
      templeLengthMm: 100,
      faceLengthMm: 140,
      foreheadWidthMm: 110,
      jawWidthMm: 110,
      ...overrides,
    };
  }

  it("classifies a notably longer-than-wide face as Oblong", () => {
    expect(determineFaceShape(dims({ faceWidthMm: 120, faceLengthMm: 200, foreheadWidthMm: 115, jawWidthMm: 110 }))).toBe("Oblong");
  });

  it("classifies a jaw-widest, forehead-narrowest face as Triangular", () => {
    expect(determineFaceShape(dims({ faceWidthMm: 120, faceLengthMm: 140, foreheadWidthMm: 100, jawWidthMm: 130 }))).toBe("Triangular");
  });

  it("classifies a forehead-widest, jaw-narrowest face as Heart", () => {
    expect(determineFaceShape(dims({ faceWidthMm: 120, faceLengthMm: 140, foreheadWidthMm: 135, jawWidthMm: 95 }))).toBe("Heart");
  });

  it("classifies a cheekbone-widest face with narrow forehead and jaw as Diamond", () => {
    expect(determineFaceShape(dims({ faceWidthMm: 120, faceLengthMm: 140, foreheadWidthMm: 100, jawWidthMm: 100 }))).toBe("Diamond");
  });

  it("classifies an elongated, balanced-width face as Oval", () => {
    expect(determineFaceShape(dims({ faceWidthMm: 130, faceLengthMm: 170, foreheadWidthMm: 125, jawWidthMm: 122 }))).toBe("Oval");
  });

  it("classifies a short face with a wide jaw as Square", () => {
    expect(determineFaceShape(dims({ faceWidthMm: 130, faceLengthMm: 140, foreheadWidthMm: 124, jawWidthMm: 125 }))).toBe("Square");
  });

  it("classifies a short face with a softly tapered jaw as Round", () => {
    expect(determineFaceShape(dims({ faceWidthMm: 130, faceLengthMm: 145, foreheadWidthMm: 120, jawWidthMm: 110 }))).toBe("Round");
  });
});
