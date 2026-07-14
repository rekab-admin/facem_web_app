"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { useElementSize } from "@/hooks/useElementSize";
import { computeDimensions } from "@/lib/mockData";
import type { FacialPoint, MeasurementDimensions } from "@/lib/types";
import { drawFacialPointsOnCanvas, prepareCanvas } from "@/lib/vision/drawOverlay";
import { evaluateFacePosition, FACE_POSITION_MESSAGES, OVAL_HEIGHT_FRAC, OVAL_WIDTH_FRAC } from "@/lib/vision/facePosition";
import { getFaceLandmarker } from "@/lib/vision/faceLandmarker";
import { estimateMmPerUnitFromIris, mapLandmarksToFacialPoints } from "@/lib/vision/landmarkMapping";

type Step = "loading" | "camera-error" | "positioning";

const DIMENSION_ROWS: Array<{ key: keyof MeasurementDimensions; label: string }> = [
  { key: "pupillaryDistanceMm", label: "Pupillary distance" },
  { key: "faceWidthMm", label: "Face width" },
  { key: "bridgeWidthMm", label: "Bridge width" },
  { key: "templeLengthMm", label: "Temple length" },
];

interface LiveCameraCaptureProps {
  onCapture: (result: { file: File; points: FacialPoint[]; mmPerUnit: number }) => void;
  disabled?: boolean;
}

export function LiveCameraCapture({ onCapture, disabled }: LiveCameraCaptureProps) {
  const { ref: containerRef, size } = useElementSize<HTMLDivElement>();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastDetectedPointsRef = useRef<FacialPoint[] | null>(null);
  const mmPerUnitRef = useRef<number | null>(null);

  const [step, setStep] = useState<Step>("loading");
  const [hasFace, setHasFace] = useState(false);
  const [facePosition, setFacePosition] = useState<ReturnType<typeof evaluateFacePosition>>("no-face");
  const [liveDimensions, setLiveDimensions] = useState<MeasurementDimensions | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function setup() {
      try {
        const [stream] = await Promise.all([
          navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } }),
          getFaceLandmarker(),
        ]);
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setStep("positioning");
      } catch {
        if (!cancelled) setStep("camera-error");
      }
    }

    setup();

    return () => {
      cancelled = true;
      // Only the camera stream is torn down here — the FaceLandmarker itself
      // is an intentional app-lifetime singleton (see faceLandmarker.ts) so
      // the next visit to this page doesn't re-pay the model load cost.
      streamRef.current?.getTracks().forEach((track) => track.stop());
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Live detection loop — face, pupils, and scale (via iris diameter) are
  // all derived automatically from the same per-frame landmark result, no
  // separate calibration step required.
  useEffect(() => {
    if (step !== "positioning") return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    let active = true;

    async function loop() {
      if (!active || !video || !canvas) return;
      const landmarker = await getFaceLandmarker();
      const result = landmarker.detectForVideo(video, performance.now());
      const rawLandmarks = result.faceLandmarks[0];

      if (rawLandmarks) {
        const points = mapLandmarksToFacialPoints(rawLandmarks);
        const mmPerUnit = estimateMmPerUnitFromIris(rawLandmarks);
        lastDetectedPointsRef.current = points;
        mmPerUnitRef.current = mmPerUnit;
        setHasFace(true);
        setFacePosition(evaluateFacePosition(points));
        setLiveDimensions(computeDimensions(points, mmPerUnit));
        if (size.width > 0) {
          const ctx = prepareCanvas(canvas, size.width, size.height);
          // Only the pupils are drawn on the live view to keep it uncluttered —
          // the other landmarks are still detected and feed the HUD/capture,
          // just not rendered as dots here. See docs/COMPUTER_VISION.md.
          const visiblePoints = points.filter((p) => p.id === "leftPupil" || p.id === "rightPupil");
          if (ctx) drawFacialPointsOnCanvas(ctx, visiblePoints, size.width, size.height);
        }
      } else {
        setHasFace(false);
        setFacePosition("no-face");
        setLiveDimensions(null);
      }

      rafRef.current = requestAnimationFrame(loop);
    }

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      active = false;
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [step, size]);

  function handleCapture() {
    const video = videoRef.current;
    const points = lastDetectedPointsRef.current;
    const mmPerUnit = mmPerUnitRef.current;
    if (!video || !points || mmPerUnit === null) return;

    const frameCanvas = document.createElement("canvas");
    frameCanvas.width = video.videoWidth;
    frameCanvas.height = video.videoHeight;
    const ctx = frameCanvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);

    frameCanvas.toBlob((blob) => {
      if (!blob) return;
      onCapture({ file: new File([blob], "capture.jpg", { type: "image/jpeg" }), points, mmPerUnit });
    }, "image/jpeg");
  }

  const showFaceOval = step === "positioning";
  const ovalBorderColor = facePosition === "good" ? "border-green-500/90" : "border-yellow-500/90";

  return (
    <div className="space-y-3">
      <div ref={containerRef} className="relative w-full overflow-hidden rounded-lg border bg-muted">
        <video ref={videoRef} className="block w-full" muted playsInline />
        <canvas ref={canvasRef} className="absolute inset-0" />
        {showFaceOval && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div
              className={`rounded-[50%] border-2 border-dashed transition-colors duration-200 ${ovalBorderColor}`}
              style={{ width: `${OVAL_WIDTH_FRAC * 100}%`, height: `${OVAL_HEIGHT_FRAC * 100}%` }}
            />
          </div>
        )}
        {step === "positioning" && (
          <div className="pointer-events-none absolute bottom-2 right-2 space-y-0.5 rounded-md border bg-background/80 px-3 py-2 text-xs backdrop-blur">
            {DIMENSION_ROWS.map((row) => (
              <div key={row.key} className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">{row.label}</span>
                <span className="font-medium tabular-nums">{liveDimensions ? `${liveDimensions[row.key].toFixed(1)} mm` : "—"}</span>
              </div>
            ))}
          </div>
        )}
        {step === "loading" && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 text-sm text-muted-foreground">
            Starting camera and loading the face detection model…
          </div>
        )}
        {step === "camera-error" && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/90 p-4 text-center text-sm text-destructive">
            Camera access is required to capture a measurement. Please allow camera access and reload the page.
          </div>
        )}
      </div>

      {step === "positioning" && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">{FACE_POSITION_MESSAGES[facePosition]}</p>
          <Button type="button" size="sm" onClick={handleCapture} disabled={disabled || !hasFace}>
            Capture
          </Button>
        </div>
      )}
    </div>
  );
}
