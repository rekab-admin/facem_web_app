import type { FacialPoint } from "@/lib/types";
import { distance } from "@/lib/geometry";

/**
 * The oval guide's size relative to the video frame, normalized 0-1 and
 * centered at (0.5, 0.5) — same coordinate space as FacialPoint. Kept here
 * (not just in the component) so evaluateFacePosition() checks against
 * exactly what's drawn on screen.
 */
export const OVAL_WIDTH_FRAC = 0.5;
export const OVAL_HEIGHT_FRAC = 0.68;

/** Fraction of the oval's width a detected face should span when well-positioned. */
const GOOD_FIT_MIN = 0.62;
const GOOD_FIT_MAX = 1.05;

/** Squared normalized-radius threshold for "centered enough" (ellipse containment). */
const CENTERED_THRESHOLD = 0.5;

export type FacePositionStatus = "no-face" | "too-far" | "too-close" | "off-center" | "good";

/**
 * Checks a frame's detected face against the oval guide, purely as
 * positioning feedback — this never blocks capture, it only informs the
 * status message (see docs/COMPUTER_VISION.md's coplanarity limitation:
 * keeping the face at a consistent distance/position improves measurement
 * consistency, it doesn't replace physical calibration).
 */
export function evaluateFacePosition(points: FacialPoint[]): FacePositionStatus {
  const leftTemple = points.find((p) => p.id === "leftTemple");
  const rightTemple = points.find((p) => p.id === "rightTemple");
  const chin = points.find((p) => p.id === "chin");
  if (!leftTemple || !rightTemple || !chin) return "no-face";

  const faceWidth = distance(leftTemple, rightTemple);
  const fitRatio = faceWidth / OVAL_WIDTH_FRAC;
  if (fitRatio < GOOD_FIT_MIN) return "too-far";
  if (fitRatio > GOOD_FIT_MAX) return "too-close";

  const centerX = (leftTemple.x + rightTemple.x) / 2;
  const centerY = (leftTemple.y + rightTemple.y + chin.y) / 3;
  const dx = (centerX - 0.5) / (OVAL_WIDTH_FRAC / 2);
  const dy = (centerY - 0.5) / (OVAL_HEIGHT_FRAC / 2);
  if (dx * dx + dy * dy > CENTERED_THRESHOLD) return "off-center";

  return "good";
}

export const FACE_POSITION_MESSAGES: Record<FacePositionStatus, string> = {
  "no-face": "No face detected. Center your face in frame.",
  "too-far": "Move closer, so your face fills the oval.",
  "too-close": "Move back a little.",
  "off-center": "Center your face within the oval.",
  good: "Positioned — capture when ready.",
};
