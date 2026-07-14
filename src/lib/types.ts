export type FrameSize = "S" | "M" | "L";

export type FaceShape = "Oval" | "Round" | "Square" | "Triangular" | "Heart" | "Diamond" | "Oblong";

export type MeasurementStatus = "processing" | "complete" | "failed";

/** Normalized image coordinates (0-1) so the overlay scales with any rendered image size. */
export interface FacialPoint {
  id: string;
  label: string;
  x: number;
  y: number;
}

export interface MeasurementDimensions {
  pupillaryDistanceMm: number;
  faceWidthMm: number;
  bridgeWidthMm: number;
  templeLengthMm: number;
  faceLengthMm: number;
  foreheadWidthMm: number;
  jawWidthMm: number;
}

export interface Measurement {
  id: string;
  customerName: string;
  createdAt: string;
  imageUrl: string;
  points: FacialPoint[];
  /** mm represented by one unit of normalized (0-1) image distance, as derived from iris-diameter-based scale estimation during live capture. Lets dimensions recompute live when points are dragged. */
  mmPerUnit: number;
  dimensions: MeasurementDimensions;
  recommendedFrameSize: FrameSize;
  /** Face-shape classification derived from facial proportions — see determineFaceShape() in mockData.ts. */
  faceShape: FaceShape;
  status: MeasurementStatus;
}

export interface CreateMeasurementInput {
  customerName: string;
  image: File;
  /** Real detected points + calibration from LiveCameraCapture. Falls back to mock generation when omitted. */
  points?: FacialPoint[];
  mmPerUnit?: number;
}
