export type FrameSize = "S" | "M" | "L";

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
}

export interface Measurement {
  id: string;
  customerName: string;
  createdAt: string;
  imageUrl: string;
  points: FacialPoint[];
  /** mm represented by one unit of normalized (0-1) image distance, as if derived from a calibration reference in the photo. Lets dimensions recompute live when points are dragged. */
  mmPerUnit: number;
  dimensions: MeasurementDimensions;
  recommendedFrameSize: FrameSize;
  status: MeasurementStatus;
}

export interface CreateMeasurementInput {
  customerName: string;
  image: File;
}
