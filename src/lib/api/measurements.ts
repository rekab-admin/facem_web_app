import { computeDimensions, createSeedMeasurements, generatePoints, randomMmPerUnit, recommendFrameSize } from "@/lib/mockData";
import type { CreateMeasurementInput, FacialPoint, Measurement } from "@/lib/types";

/**
 * Mock service layer standing in for a future `/api/measurements` REST backend.
 * Every export here is async and shaped like a fetch wrapper so call sites
 * (the Zustand store) don't change when this is swapped for real HTTP calls.
 *
 * State lives in an in-memory array + localStorage, simulating a server-side
 * database for this frontend-only phase.
 */

const STORAGE_KEY = "facem:measurements";
const UPLOAD_DELAY_MS = 1500;
const REQUEST_DELAY_MS = 300;

let db: Measurement[] | null = null;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function loadDb(): Measurement[] {
  if (db) return db;

  if (typeof window !== "undefined") {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        db = JSON.parse(raw) as Measurement[];
        return db;
      } catch {
        // fall through to reseed on corrupt storage
      }
    }
  }

  db = createSeedMeasurements();
  persist();
  return db;
}

function persist(): void {
  if (typeof window !== "undefined" && db) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  }
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export async function listMeasurements(): Promise<Measurement[]> {
  await delay(REQUEST_DELAY_MS);
  return [...loadDb()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getMeasurement(id: string): Promise<Measurement> {
  await delay(REQUEST_DELAY_MS);
  const found = loadDb().find((m) => m.id === id);
  if (!found) throw new Error(`Measurement ${id} not found`);
  return found;
}

export async function createMeasurement(input: CreateMeasurementInput): Promise<Measurement> {
  const imageUrl = await fileToDataUrl(input.image);
  await delay(UPLOAD_DELAY_MS);

  const points = generatePoints();
  const mmPerUnit = randomMmPerUnit();
  const dimensions = computeDimensions(points, mmPerUnit);

  const measurement: Measurement = {
    id: crypto.randomUUID(),
    customerName: input.customerName,
    createdAt: new Date().toISOString(),
    imageUrl,
    points,
    mmPerUnit,
    dimensions,
    recommendedFrameSize: recommendFrameSize(dimensions.faceWidthMm),
    status: "complete",
  };

  loadDb().push(measurement);
  persist();
  return measurement;
}

export async function updateMeasurementPoints(id: string, points: FacialPoint[]): Promise<Measurement> {
  await delay(REQUEST_DELAY_MS);
  const current = loadDb();
  const index = current.findIndex((m) => m.id === id);
  if (index === -1) throw new Error(`Measurement ${id} not found`);

  const existing = current[index];
  const dimensions = computeDimensions(points, existing.mmPerUnit);
  const updated: Measurement = {
    ...existing,
    points,
    dimensions,
    recommendedFrameSize: recommendFrameSize(dimensions.faceWidthMm),
  };

  current[index] = updated;
  persist();
  return updated;
}

export async function deleteMeasurement(id: string): Promise<void> {
  await delay(REQUEST_DELAY_MS);
  db = loadDb().filter((m) => m.id !== id);
  persist();
}
