"use client";

import { useEffect } from "react";

import { HistoryList } from "@/components/HistoryList";
import { ProcessingSpinner } from "@/components/ProcessingSpinner";
import { useMeasurementsStore } from "@/store/measurementsStore";

export default function HistoryPage() {
  const { measurements, status, fetchAll, remove } = useMeasurementsStore();

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Measurement History</h1>
        <p className="text-sm text-muted-foreground">All recorded facial measurement sessions</p>
      </div>

      {status === "loading" && measurements.length === 0 ? (
        <ProcessingSpinner label="Loading measurements…" />
      ) : (
        <HistoryList measurements={measurements} onDelete={remove} />
      )}
    </div>
  );
}
