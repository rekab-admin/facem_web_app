"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Measurement } from "@/lib/types";

interface HistoryListProps {
  measurements: Measurement[];
  onDelete: (id: string) => void;
}

export function HistoryList({ measurements, onDelete }: HistoryListProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return measurements;
    return measurements.filter((m) => m.customerName.toLowerCase().includes(q));
  }, [measurements, query]);

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search by customer name…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="max-w-sm"
      />

      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">No measurements found.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Frame size</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="font-medium">
                  <Link href={`/measurements/${m.id}`} className="hover:underline">
                    {m.customerName}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(m.createdAt).toLocaleDateString("en-ZA", { dateStyle: "medium" })}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{m.recommendedFrameSize}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="destructive" size="sm" onClick={() => onDelete(m.id)}>
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
