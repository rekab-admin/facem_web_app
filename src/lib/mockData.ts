import type { FacialPoint, FrameSize, Measurement, MeasurementDimensions } from "./types";

/**
 * Canonical frontal-face landmark layout (normalized 0-1 image coordinates).
 * A real detector would return these; here we jitter this base layout to
 * simulate slightly different results per photo.
 */
const BASE_POINTS: FacialPoint[] = [
  { id: "leftPupil", label: "Left Pupil", x: 0.38, y: 0.42 },
  { id: "rightPupil", label: "Right Pupil", x: 0.62, y: 0.42 },
  { id: "noseBridgeLeft", label: "Nose Bridge (L)", x: 0.47, y: 0.48 },
  { id: "noseBridgeRight", label: "Nose Bridge (R)", x: 0.53, y: 0.48 },
  { id: "leftTemple", label: "Left Temple", x: 0.22, y: 0.4 },
  { id: "rightTemple", label: "Right Temple", x: 0.78, y: 0.4 },
  { id: "chin", label: "Chin", x: 0.5, y: 0.85 },
];

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function jitter(value: number, amount: number): number {
  return clamp01(value + (Math.random() - 0.5) * amount);
}

export function generatePoints(): FacialPoint[] {
  return BASE_POINTS.map((point) => ({
    ...point,
    x: jitter(point.x, 0.02),
    y: jitter(point.y, 0.02),
  }));
}

/** Simulates a per-photo calibration scale (mm represented by one unit of normalized distance). */
export function randomMmPerUnit(): number {
  return 220 + Math.random() * 55;
}

function distance(a: FacialPoint, b: FacialPoint): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

export function computeDimensions(points: FacialPoint[], mmPerUnit: number): MeasurementDimensions {
  const byId = Object.fromEntries(points.map((point) => [point.id, point]));
  const pupillaryDistanceMm = distance(byId.leftPupil, byId.rightPupil) * mmPerUnit;
  const faceWidthMm = distance(byId.leftTemple, byId.rightTemple) * mmPerUnit;
  const bridgeWidthMm = distance(byId.noseBridgeLeft, byId.noseBridgeRight) * mmPerUnit;
  const templeLengthMm = distance(byId.rightTemple, byId.chin) * mmPerUnit * 0.85;

  return {
    pupillaryDistanceMm: round1(pupillaryDistanceMm),
    faceWidthMm: round1(faceWidthMm),
    bridgeWidthMm: round1(bridgeWidthMm),
    templeLengthMm: round1(templeLengthMm),
  };
}

export function recommendFrameSize(faceWidthMm: number): FrameSize {
  if (faceWidthMm < 130) return "S";
  if (faceWidthMm < 145) return "M";
  return "L";
}

function hashCode(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

/** Neutral silhouette placeholder used for seed/demo entries that have no real uploaded photo. */
export function placeholderAvatarDataUrl(seed: string): string {
  const hue = Math.abs(hashCode(seed)) % 360;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="400" height="400" fill="hsl(${hue},35%,90%)"/><circle cx="200" cy="165" r="92" fill="hsl(${hue},30%,72%)"/><ellipse cx="200" cy="340" rx="145" ry="125" fill="hsl(${hue},30%,72%)"/></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const SEED_NAMES = ["Thabo Nkosi", "Aisha Patel", "Johan van der Merwe"];

export function createSeedMeasurements(): Measurement[] {
  return SEED_NAMES.map((customerName, index) => {
    const points = generatePoints();
    const mmPerUnit = randomMmPerUnit();
    const dimensions = computeDimensions(points, mmPerUnit);

    return {
      id: crypto.randomUUID(),
      customerName,
      createdAt: new Date(Date.now() - (index + 1) * 86_400_000).toISOString(),
      imageUrl: placeholderAvatarDataUrl(customerName),
      points,
      mmPerUnit,
      dimensions,
      recommendedFrameSize: recommendFrameSize(dimensions.faceWidthMm),
      status: "complete",
    };
  });
}
