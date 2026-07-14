import type { FacialPoint } from "@/lib/types";

/** Sizes a canvas for crisp rendering at the current devicePixelRatio and returns its 2D context. */
export function prepareCanvas(canvas: HTMLCanvasElement, width: number, height: number): CanvasRenderingContext2D | null {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  const ctx = canvas.getContext("2d");
  ctx?.scale(dpr, dpr);
  return ctx;
}

const LINES: Array<[string, string]> = [
  ["leftPupil", "rightPupil"],
  ["noseBridgeLeft", "noseBridgeRight"],
  ["leftTemple", "rightTemple"],
  ["rightTemple", "chin"],
];

/** Draws the facial landmark points and connecting guide lines onto a canvas already sized to (width, height). */
export function drawFacialPointsOnCanvas(
  ctx: CanvasRenderingContext2D,
  points: FacialPoint[],
  width: number,
  height: number,
): void {
  ctx.clearRect(0, 0, width, height);

  const byId = Object.fromEntries(points.map((p) => [p.id, p]));

  ctx.strokeStyle = "rgba(59, 130, 246, 0.8)";
  ctx.lineWidth = 1.5;
  for (const [fromId, toId] of LINES) {
    const from = byId[fromId];
    const to = byId[toId];
    if (!from || !to) continue;
    ctx.beginPath();
    ctx.moveTo(from.x * width, from.y * height);
    ctx.lineTo(to.x * width, to.y * height);
    ctx.stroke();
  }

  for (const point of points) {
    ctx.beginPath();
    ctx.arc(point.x * width, point.y * height, 5, 0, Math.PI * 2);
    ctx.fillStyle = "#3b82f6";
    ctx.fill();
    ctx.strokeStyle = "white";
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}
