import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { Measurement } from "@/lib/types";

export function MeasurementCard({ measurement }: { measurement: Measurement }) {
  return (
    <Link href={`/measurements/${measurement.id}`}>
      <Card className="transition-colors hover:bg-muted/50">
        <CardContent className="flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={measurement.imageUrl}
            alt={measurement.customerName}
            className="size-14 shrink-0 rounded-full object-cover"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{measurement.customerName}</p>
            <p className="text-xs text-muted-foreground">
              {new Date(measurement.createdAt).toLocaleDateString("en-ZA", { dateStyle: "medium" })}
            </p>
          </div>
          <Badge variant="secondary">Frame {measurement.recommendedFrameSize}</Badge>
        </CardContent>
      </Card>
    </Link>
  );
}
