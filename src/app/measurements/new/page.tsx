"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { ImageUploader } from "@/components/ImageUploader";
import { ProcessingSpinner } from "@/components/ProcessingSpinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMeasurementsStore } from "@/store/measurementsStore";

export default function NewMeasurementPage() {
  const router = useRouter();
  const create = useMeasurementsStore((s) => s.create);
  const isCreating = useMeasurementsStore((s) => s.isCreating);

  const [customerName, setCustomerName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = customerName.trim().length > 0 && file !== null && !isCreating;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setError(null);
    try {
      const created = await create({ customerName: customerName.trim(), image: file });
      router.push(`/measurements/${created.id}`);
    } catch {
      setError("Something went wrong processing this photo. Please try again.");
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New Measurement</h1>
        <p className="text-sm text-muted-foreground">
          Upload a front-facing photo to detect facial landmarks and compute fitting dimensions.
        </p>
      </div>

      <Card>
        <CardContent>
          {isCreating ? (
            <ProcessingSpinner label="Detecting facial landmarks…" />
          ) : (
            <form className="space-y-5" onSubmit={handleSubmit}>
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

              <div className="space-y-1.5">
                <Label>Photo</Label>
                <ImageUploader onFileSelected={setFile} disabled={isCreating} />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button type="submit" disabled={!canSubmit} className="w-full">
                Detect Measurements
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
