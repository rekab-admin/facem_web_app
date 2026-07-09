"use client";

import Link from "next/link";
import { useEffect } from "react";

import { MeasurementCard } from "@/components/MeasurementCard";
import { ProcessingSpinner } from "@/components/ProcessingSpinner";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useMeasurementsStore } from "@/store/measurementsStore";

export default function DashboardPage() {
  const { measurements, status, fetchAll } = useMeasurementsStore();

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const recent = measurements.slice(0, 5);
  const frameCounts = measurements.reduce<Record<string, number>>((acc, m) => {
    acc[m.recommendedFrameSize] = (acc[m.recommendedFrameSize] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Facial measurement sessions for eyewear &amp; mask fitting</p>
        </div>
        <Link href="/measurements/new" className={cn(buttonVariants({ variant: "default" }))}>
          New Measurement
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardContent>
            <p className="text-xs text-muted-foreground">Total sessions</p>
            <p className="text-2xl font-semibold">{measurements.length}</p>
          </CardContent>
        </Card>
        {(["S", "M", "L"] as const).map((size) => (
          <Card key={size}>
            <CardContent>
              <p className="text-xs text-muted-foreground">Frame {size}</p>
              <p className="text-2xl font-semibold">{frameCounts[size] ?? 0}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Recent measurements</h2>
          <Link href="/measurements" className="text-sm text-primary hover:underline">
            View all
          </Link>
        </div>

        {status === "loading" && measurements.length === 0 ? (
          <ProcessingSpinner label="Loading measurements…" />
        ) : recent.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No measurements yet. Start with a{" "}
            <Link href="/measurements/new" className="text-primary hover:underline">
              new measurement
            </Link>
            .
          </p>
        ) : (
          <div className="space-y-2">
            {recent.map((m) => (
              <MeasurementCard key={m.id} measurement={m} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
