import { distance } from "@/lib/geometry";
import type { FacialPoint } from "@/lib/types";

/**
 * MediaPipe's 478-point face landmark indices, restricted to the points we
 * actually use. Full derivation and a worked example live in
 * docs/COMPUTER_VISION.md — read that before touching these numbers.
 *
 * The short version: MediaPipe names landmarks from the SUBJECT's own
 * anatomical left/right (like "left_shoulder" in pose landmarks). Our
 * FacialPoint ids ("leftPupil" etc.) mean "appears on the left side of the
 * image as displayed to a viewer" — matching the existing mock layout in
 * mockData.ts and how the (unmirrored) captured photo is shown on the
 * detail page. A camera faces the subject like a photographer, so the
 * subject's anatomical right ends up on the image's left side, and vice
 * versa. That's why every entry below maps to the *opposite*-sounding
 * MediaPipe landmark.
 *
 * foreheadLeft/jawLeft and foreheadRight/jawRight are chosen from
 * MediaPipe's official FACEMESH_FACE_OVAL loop, on the same two "chains" as
 * leftTemple(234)/rightTemple(454) respectively, so the left/right
 * assignment stays consistent with the rest of this table. Like
 * leftTemple/rightTemple and noseBridgeLeft/noseBridgeRight, these are
 * community-referenced (not officially individually named) points — verify
 * against a live face and swap the pair if a test shows one on the wrong
 * side.
 */
const LANDMARK_INDEX = {
  leftPupil: 473, // MediaPipe right iris center
  rightPupil: 468, // MediaPipe left iris center
  noseBridgeLeft: 133, // MediaPipe right eye inner corner
  noseBridgeRight: 362, // MediaPipe left eye inner corner
  foreheadLeft: 54, // face-oval loop, same chain as leftTemple
  foreheadRight: 284, // face-oval loop, same chain as rightTemple
  leftTemple: 234, // MediaPipe right cheek (face oval extreme)
  rightTemple: 454, // MediaPipe left cheek (face oval extreme)
  jawLeft: 172, // face-oval loop, same chain as leftTemple
  jawRight: 397, // face-oval loop, same chain as rightTemple
  faceTop: 10, // forehead/hairline boundary, midline, no left/right ambiguity
  chin: 152, // midline, no left/right ambiguity
} as const;

const POINT_LABELS: Record<keyof typeof LANDMARK_INDEX, string> = {
  leftPupil: "Left Pupil",
  rightPupil: "Right Pupil",
  noseBridgeLeft: "Nose Bridge (L)",
  noseBridgeRight: "Nose Bridge (R)",
  foreheadLeft: "Forehead (L)",
  foreheadRight: "Forehead (R)",
  leftTemple: "Left Temple",
  rightTemple: "Right Temple",
  jawLeft: "Jaw (L)",
  jawRight: "Jaw (R)",
  faceTop: "Forehead Top",
  chin: "Chin",
};

/**
 * The 4 boundary points MediaPipe's iris refinement draws around each pupil
 * center, keyed by the same pupil id above (see FACEMESH_RIGHT_IRIS/
 * FACEMESH_LEFT_IRIS in MediaPipe's own constants: center 468 ↔ ring
 * 469-472, center 473 ↔ ring 474-477 — a fixed topological pairing,
 * independent of the left/right-mirroring discussion above).
 */
const IRIS_RING_INDEX: Record<"leftPupil" | "rightPupil", readonly number[]> = {
  leftPupil: [474, 475, 476, 477],
  rightPupil: [469, 470, 471, 472],
};

/**
 * Average adult horizontal visible iris diameter (HVID), ~11.7mm ± 0.5mm
 * across the population. Anatomically consistent enough that AR eyewear
 * try-on apps use it as a built-in scale reference instead of requiring a
 * physical object of known size in frame.
 */
export const IRIS_DIAMETER_MM = 11.7;

export interface RawLandmark {
  x: number;
  y: number;
}

/**
 * Extracts our 12 named FacialPoints from MediaPipe's full 478-point result.
 * Coordinates pass through unchanged (both are normalized 0-1 in the same,
 * unmirrored image space — see docs/COMPUTER_VISION.md for why we don't
 * mirror the camera preview).
 */
export function mapLandmarksToFacialPoints(landmarks: RawLandmark[]): FacialPoint[] {
  return (Object.keys(LANDMARK_INDEX) as Array<keyof typeof LANDMARK_INDEX>).map((id) => {
    const landmark = landmarks[LANDMARK_INDEX[id]];
    return {
      id,
      label: POINT_LABELS[id],
      x: landmark.x,
      y: landmark.y,
    };
  });
}

/**
 * Derives mmPerUnit (mm represented by one unit of normalized image
 * distance) automatically from iris size, replacing the need for a
 * physical calibration object. For each eye, the average center-to-ring
 * distance gives an iris radius; doubling and averaging across both eyes
 * gives a normalized iris diameter, which IRIS_DIAMETER_MM converts to a
 * real-world scale.
 */
export function estimateMmPerUnitFromIris(landmarks: RawLandmark[]): number {
  const diameters = (Object.keys(IRIS_RING_INDEX) as Array<keyof typeof IRIS_RING_INDEX>).map((id) => {
    const center = landmarks[LANDMARK_INDEX[id]];
    const ring = IRIS_RING_INDEX[id].map((index) => landmarks[index]);
    const averageRadius = ring.reduce((sum, point) => sum + distance(center, point), 0) / ring.length;
    return averageRadius * 2;
  });
  const averageDiameter = (diameters[0] + diameters[1]) / 2;
  return IRIS_DIAMETER_MM / averageDiameter;
}
