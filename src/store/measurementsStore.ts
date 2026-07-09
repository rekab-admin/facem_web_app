import { create } from "zustand";

import * as measurementsApi from "@/lib/api/measurements";
import type { CreateMeasurementInput, FacialPoint, Measurement } from "@/lib/types";

interface MeasurementsState {
  measurements: Measurement[];
  status: "idle" | "loading" | "error";
  error: string | null;
  isCreating: boolean;
  fetchAll: () => Promise<void>;
  create: (input: CreateMeasurementInput) => Promise<Measurement>;
  updatePoints: (id: string, points: FacialPoint[]) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export const useMeasurementsStore = create<MeasurementsState>((set, get) => ({
  measurements: [],
  status: "idle",
  error: null,
  isCreating: false,

  fetchAll: async () => {
    set({ status: "loading", error: null });
    try {
      const measurements = await measurementsApi.listMeasurements();
      set({ measurements, status: "idle" });
    } catch (err) {
      set({ status: "error", error: err instanceof Error ? err.message : "Failed to load measurements" });
    }
  },

  create: async (input) => {
    set({ isCreating: true, error: null });
    try {
      const created = await measurementsApi.createMeasurement(input);
      set({ measurements: [created, ...get().measurements], isCreating: false });
      return created;
    } catch (err) {
      set({ isCreating: false, error: err instanceof Error ? err.message : "Failed to create measurement" });
      throw err;
    }
  },

  updatePoints: async (id, points) => {
    const updated = await measurementsApi.updateMeasurementPoints(id, points);
    set({
      measurements: get().measurements.map((m) => (m.id === id ? updated : m)),
    });
  },

  remove: async (id) => {
    await measurementsApi.deleteMeasurement(id);
    set({ measurements: get().measurements.filter((m) => m.id !== id) });
  },
}));
