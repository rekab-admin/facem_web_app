"use client";

import { useEffect, useRef } from "react";

import { useElementSize } from "@/hooks/useElementSize";
import { distance } from "@/lib/geometry";
import { drawFacialPointsOnCanvas, prepareCanvas } from "@/lib/vision/drawOverlay";
import type { FacialPoint } from "@/lib/types";

interface FaceCanvasOverlayProps {
  imageUrl: string;
  points: FacialPoint[];
  editable?: boolean;
  onPointsChange?: (points: FacialPoint[]) => void;
  onDragEnd?: (points: FacialPoint[]) => void;
}

const HIT_RADIUS_NORMALIZED = 0.035;

export function FaceCanvasOverlay({ imageUrl, points, editable = false, onPointsChange, onDragEnd }: FaceCanvasOverlayProps) {
  const { ref: containerRef, size } = useElementSize<HTMLDivElement>();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const draggingIdRef = useRef<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || size.width === 0) return;

    const ctx = prepareCanvas(canvas, size.width, size.height);
    if (!ctx) return;
    drawFacialPointsOnCanvas(ctx, points, size.width, size.height);
  }, [points, size]);

  function toNormalized(clientX: number, clientY: number) {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return null;
    return {
      x: Math.min(1, Math.max(0, (clientX - rect.left) / rect.width)),
      y: Math.min(1, Math.max(0, (clientY - rect.top) / rect.height)),
    };
  }

  function handlePointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!editable) return;
    const pos = toNormalized(e.clientX, e.clientY);
    if (!pos) return;

    let closestId: string | null = null;
    let closestDist = HIT_RADIUS_NORMALIZED;
    for (const point of points) {
      const d = distance(point, pos);
      if (d < closestDist) {
        closestDist = d;
        closestId = point.id;
      }
    }

    if (closestId) {
      draggingIdRef.current = closestId;
      e.currentTarget.setPointerCapture(e.pointerId);
    }
  }

  function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    const draggingId = draggingIdRef.current;
    if (!draggingId) return;
    const pos = toNormalized(e.clientX, e.clientY);
    if (!pos) return;
    onPointsChange?.(points.map((p) => (p.id === draggingId ? { ...p, x: pos.x, y: pos.y } : p)));
  }

  function handlePointerUp() {
    if (draggingIdRef.current) {
      draggingIdRef.current = null;
      onDragEnd?.(points);
    }
  }

  return (
    <div ref={containerRef} className="relative w-full overflow-hidden rounded-lg border bg-muted">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={imageUrl} alt="Measurement subject" className="block w-full select-none" draggable={false} />
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        style={{ touchAction: "none", cursor: editable ? "grab" : "default" }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      />
    </div>
  );
}
