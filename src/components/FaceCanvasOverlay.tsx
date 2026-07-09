"use client";

import { useEffect, useRef, useState } from "react";

import type { FacialPoint } from "@/lib/types";

interface FaceCanvasOverlayProps {
  imageUrl: string;
  points: FacialPoint[];
  editable?: boolean;
  onPointsChange?: (points: FacialPoint[]) => void;
  onDragEnd?: (points: FacialPoint[]) => void;
}

const LINES: Array<[string, string]> = [
  ["leftPupil", "rightPupil"],
  ["noseBridgeLeft", "noseBridgeRight"],
  ["leftTemple", "rightTemple"],
  ["rightTemple", "chin"],
];

const HIT_RADIUS_NORMALIZED = 0.035;

export function FaceCanvasOverlay({ imageUrl, points, editable = false, onPointsChange, onDragEnd }: FaceCanvasOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const draggingIdRef = useRef<string | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      setSize({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || size.width === 0) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size.width * dpr;
    canvas.height = size.height * dpr;
    canvas.style.width = `${size.width}px`;
    canvas.style.height = `${size.height}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, size.width, size.height);

    const byId = Object.fromEntries(points.map((p) => [p.id, p]));

    ctx.strokeStyle = "rgba(59, 130, 246, 0.8)";
    ctx.lineWidth = 1.5;
    for (const [fromId, toId] of LINES) {
      const from = byId[fromId];
      const to = byId[toId];
      if (!from || !to) continue;
      ctx.beginPath();
      ctx.moveTo(from.x * size.width, from.y * size.height);
      ctx.lineTo(to.x * size.width, to.y * size.height);
      ctx.stroke();
    }

    for (const point of points) {
      ctx.beginPath();
      ctx.arc(point.x * size.width, point.y * size.height, 5, 0, Math.PI * 2);
      ctx.fillStyle = "#3b82f6";
      ctx.fill();
      ctx.strokeStyle = "white";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
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
      const d = Math.hypot(point.x - pos.x, point.y - pos.y);
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
