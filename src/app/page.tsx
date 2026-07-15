"use client";

import Link from "next/link";
import { useEffect } from "react";

import { MeasurementCard } from "@/components/MeasurementCard";
import { ProcessingSpinner } from "@/components/ProcessingSpinner";
import { Card, CardContent } from "@/components/ui/card";
import { useMeasurementsStore } from "@/store/measurementsStore";

const STAT_META = [
  { key: "total", label: "Total sessions" },
  { key: "S", label: "Frame S" },
  { key: "M", label: "Frame M" },
  { key: "L", label: "Frame L" },
] as const;

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
  const statValues: Record<string, number> = {
    total: measurements.length,
    S: frameCounts.S ?? 0,
    M: frameCounts.M ?? 0,
    L: frameCounts.L ?? 0,
  };

  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0a2540] via-[#123a5c] to-[#1d5075] px-6 py-14 text-white sm:px-12 sm:py-20">
        <div className="pointer-events-none absolute -top-24 -right-24 size-80 rounded-full bg-[#3f7fa8] opacity-30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 size-72 rounded-full bg-[#f5b400] opacity-20 blur-3xl" />

        <div className="relative max-w-2xl space-y-6">
          <p className="text-xs font-semibold tracking-[0.2em] text-[#ffd166] uppercase">
            Precision eyewear &amp; mask fitting
          </p>
          <h1 className="text-4xl leading-tight font-bold tracking-tight sm:text-5xl">
            Find your perfect fit, in seconds
          </h1>
          <p className="max-w-lg text-base text-white/80 sm:text-lg">
            Live facial measurements from your webcam — pupillary distance, face shape, and frame size —
            no calibration object required.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/measurements/new"
              className="inline-flex items-center justify-center rounded-full bg-[#f5b400] px-7 py-3 text-sm font-semibold text-[#0a2540] shadow-lg shadow-black/20 transition-all hover:scale-[1.02] hover:bg-[#ffc41f]"
            >
              Start new measurement
            </Link>
            <Link
              href="/measurements"
              className="inline-flex items-center justify-center rounded-full border border-white/30 px-7 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              View history
            </Link>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {STAT_META.map(({ key, label }) => (
          <Card key={key} className="rounded-2xl border-none shadow-sm ring-1 ring-foreground/5">
            <CardContent className="space-y-1.5">
              <div className="h-1 w-8 rounded-full bg-[#f5b400]" />
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
              <p className="text-3xl font-bold text-[#0a2540] dark:text-white">{statValues[key]}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">Recent measurements</h2>
          <Link
            href="/measurements"
            className="text-sm font-semibold text-[#123a5c] hover:underline dark:text-[#7fb3d5]"
          >
            View all &rarr;
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
