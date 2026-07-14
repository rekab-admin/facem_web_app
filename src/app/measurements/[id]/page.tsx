"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useMemo, useState } from "react";

import { FaceCanvasOverlay } from "@/components/FaceCanvasOverlay";
import { MeasurementTable } from "@/components/MeasurementTable";
import { ProcessingSpinner } from "@/components/ProcessingSpinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { computeDimensions, determineFaceShape, recommendFrameSize } from "@/lib/mockData";
import type { FacialPoint } from "@/lib/types";
import { useMeasurementsStore } from "@/store/measurementsStore";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function MeasurementDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { measurements, status, fetchAll, updatePoints, remove } = useMeasurementsStore();

  const measurement = measurements.find((m) => m.id === id);

  const [isEditing, setIsEditing] = useState(false);
  const [draftPoints, setDraftPoints] = useState<FacialPoint[] | null>(null);

  useEffect(() => {
    if (measurements.length === 0) fetchAll();
  }, [measurements.length, fetchAll]);

  const displayPoints = draftPoints ?? measurement?.points ?? [];

  const liveDimensions = useMemo(() => {
    if (!measurement) return null;
    if (!draftPoints) return measurement.dimensions;
    return computeDimensions(draftPoints, measurement.mmPerUnit);
  }, [measurement, draftPoints]);

  if (status === "loading" && !measurement) {
    return <ProcessingSpinner label="Loading measurement…" />;
  }

  if (!measurement) {
    return (
      <div className="space-y-3 text-center">
        <p className="text-sm text-muted-foreground">Measurement not found.</p>
        <Link href="/measurements" className="text-sm text-primary hover:underline">
          Back to history
        </Link>
      </div>
    );
  }

  async function handleDelete() {
    await remove(measurement!.id);
    router.push("/measurements");
  }

  async function handleDoneEditing() {
    if (draftPoints) {
      await updatePoints(measurement!.id, draftPoints);
    }
    setDraftPoints(null);
    setIsEditing(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{measurement.customerName}</h1>
          <p className="text-sm text-muted-foreground">
            {new Date(measurement.createdAt).toLocaleString("en-ZA", { dateStyle: "medium", timeStyle: "short" })}
          </p>
        </div>
        <Button variant="destructive" size="sm" onClick={handleDelete}>
          Delete
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-3">
          <FaceCanvasOverlay
            imageUrl={measurement.imageUrl}
            points={displayPoints}
            editable={isEditing}
            onPointsChange={setDraftPoints}
            onDragEnd={setDraftPoints}
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {isEditing ? "Drag a point to correct its position." : "Landmark points detected from your camera."}
            </p>
            {isEditing ? (
              <Button size="sm" onClick={handleDoneEditing}>
                Save adjustments
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                Adjust points
              </Button>
            )}
          </div>
        </div>

        <Card>
          <CardContent>
            <MeasurementTable
              dimensions={liveDimensions ?? measurement.dimensions}
              recommendedFrameSize={
                liveDimensions ? recommendFrameSize(liveDimensions.faceWidthMm) : measurement.recommendedFrameSize
              }
              faceShape={liveDimensions ? determineFaceShape(liveDimensions) : measurement.faceShape}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
