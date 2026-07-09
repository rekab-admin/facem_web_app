import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { MeasurementDimensions, FrameSize } from "@/lib/types";

const ROWS: Array<{ key: keyof MeasurementDimensions; label: string }> = [
  { key: "pupillaryDistanceMm", label: "Pupillary distance" },
  { key: "faceWidthMm", label: "Face width" },
  { key: "bridgeWidthMm", label: "Bridge width" },
  { key: "templeLengthMm", label: "Temple length" },
];

interface MeasurementTableProps {
  dimensions: MeasurementDimensions;
  recommendedFrameSize: FrameSize;
}

export function MeasurementTable({ dimensions, recommendedFrameSize }: MeasurementTableProps) {
  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Dimension</TableHead>
            <TableHead className="text-right">Value</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ROWS.map((row) => (
            <TableRow key={row.key}>
              <TableCell className="font-medium">{row.label}</TableCell>
              <TableCell className="text-right tabular-nums">{dimensions[row.key].toFixed(1)} mm</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">Recommended frame size:</span>
        <Badge variant="default">{recommendedFrameSize}</Badge>
      </div>
    </div>
  );
}
