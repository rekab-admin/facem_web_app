import { describe, expect, it } from "vitest";

import { estimateMmPerUnitFromIris, IRIS_DIAMETER_MM, mapLandmarksToFacialPoints, type RawLandmark } from "./landmarkMapping";

const LANDMARK_COUNT = 478;

const INDEX_TO_ID: Record<number, string> = {
  473: "leftPupil",
  468: "rightPupil",
  133: "noseBridgeLeft",
  362: "noseBridgeRight",
  54: "foreheadLeft",
  284: "foreheadRight",
  234: "leftTemple",
  454: "rightTemple",
  172: "jawLeft",
  397: "jawRight",
  10: "faceTop",
  152: "chin",
};

function buildFixtureLandmarks(): RawLandmark[] {
  return Array.from({ length: LANDMARK_COUNT }, (_, index) => ({
    x: index / LANDMARK_COUNT,
    y: 1 - index / LANDMARK_COUNT,
  }));
}

describe("mapLandmarksToFacialPoints", () => {
  it("extracts each named point from its documented MediaPipe index", () => {
    const landmarks = buildFixtureLandmarks();
    const points = mapLandmarksToFacialPoints(landmarks);
    const byId = Object.fromEntries(points.map((p) => [p.id, p]));

    for (const [indexStr, id] of Object.entries(INDEX_TO_ID)) {
      const index = Number(indexStr);
      expect(byId[id]).toBeDefined();
      expect(byId[id].x).toBeCloseTo(landmarks[index].x, 10);
      expect(byId[id].y).toBeCloseTo(landmarks[index].y, 10);
    }
  });

  it("returns exactly the 12 named points", () => {
    const points = mapLandmarksToFacialPoints(buildFixtureLandmarks());
    expect(points).toHaveLength(12);
    expect(new Set(points.map((p) => p.id))).toEqual(new Set(Object.values(INDEX_TO_ID)));
  });
});

describe("estimateMmPerUnitFromIris", () => {
  function buildIrisFixture(radius: number): RawLandmark[] {
    const landmarks: RawLandmark[] = Array.from({ length: LANDMARK_COUNT }, () => ({ x: 0, y: 0 }));

    landmarks[468] = { x: 0, y: 0 };
    landmarks[469] = { x: radius, y: 0 };
    landmarks[470] = { x: 0, y: radius };
    landmarks[471] = { x: -radius, y: 0 };
    landmarks[472] = { x: 0, y: -radius };

    landmarks[473] = { x: 1, y: 1 };
    landmarks[474] = { x: 1 + radius, y: 1 };
    landmarks[475] = { x: 1, y: 1 + radius };
    landmarks[476] = { x: 1 - radius, y: 1 };
    landmarks[477] = { x: 1, y: 1 - radius };

    return landmarks;
  }

  it("derives mmPerUnit from the average iris diameter across both eyes", () => {
    const landmarks = buildIrisFixture(0.05);
    const mmPerUnit = estimateMmPerUnitFromIris(landmarks);
    expect(mmPerUnit).toBeCloseTo(IRIS_DIAMETER_MM / 0.1, 10);
  });

  it("produces a larger mmPerUnit when the iris appears smaller (further away)", () => {
    const near = estimateMmPerUnitFromIris(buildIrisFixture(0.08));
    const far = estimateMmPerUnitFromIris(buildIrisFixture(0.04));
    expect(far).toBeGreaterThan(near);
  });
});
