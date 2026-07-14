"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { ConsentGate } from "@/components/ConsentGate";
import { LiveCameraCapture } from "@/components/LiveCameraCapture";
import { ProcessingSpinner } from "@/components/ProcessingSpinner";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FacialPoint } from "@/lib/types";
import { useMeasurementsStore } from "@/store/measurementsStore";

export default function NewMeasurementPage() {
  const router = useRouter();
  const create = useMeasurementsStore((s) => s.create);
  const isCreating = useMeasurementsStore((s) => s.isCreating);

  const [acknowledged, setAcknowledged] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleCapture({ file, points, mmPerUnit }: { file: File; points: FacialPoint[]; mmPerUnit: number }) {
    if (!customerName.trim()) {
      setError("Enter a customer name before capturing.");
      return;
    }
    setError(null);
    try {
      const created = await create({ customerName: customerName.trim(), image: file, points, mmPerUnit });
      router.push(`/measurements/${created.id}`);
    } catch {
      setError("Something went wrong saving this measurement. Please try again.");
    }
  }

  if (!acknowledged) {
    return (
      <div className="mx-auto max-w-lg">
        <ConsentGate onAcknowledge={() => setAcknowledged(true)} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New Measurement</h1>
        <p className="text-sm text-muted-foreground">
          Look at the camera — facial landmarks and fitting dimensions are detected automatically, no calibration object needed.
        </p>
      </div>

      <Card>
        <CardContent className="space-y-5">
          {isCreating ? (
            <ProcessingSpinner label="Saving measurement…" />
          ) : (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="customerName">Customer name</Label>
                <Input
                  id="customerName"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Lindiwe Dlamini"
                  required
                />
              </div>

              <LiveCameraCapture onCapture={handleCapture} disabled={isCreating} />

              {error && <p className="text-sm text-destructive">{error}</p>}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
