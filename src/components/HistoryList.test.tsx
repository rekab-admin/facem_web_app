import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { HistoryList } from "./HistoryList";
import type { Measurement } from "@/lib/types";

const MEASUREMENTS: Measurement[] = [
  {
    id: "1",
    customerName: "Thabo Nkosi",
    createdAt: "2026-07-08T00:00:00.000Z",
    imageUrl: "data:image/svg+xml,%3Csvg%3E%3C/svg%3E",
    points: [],
    mmPerUnit: 250,
    dimensions: {
      pupillaryDistanceMm: 60,
      faceWidthMm: 140,
      bridgeWidthMm: 12,
      templeLengthMm: 100,
      faceLengthMm: 180,
      foreheadWidthMm: 130,
      jawWidthMm: 125,
    },
    recommendedFrameSize: "M",
    faceShape: "Oval",
    status: "complete",
  },
  {
    id: "2",
    customerName: "Aisha Patel",
    createdAt: "2026-07-07T00:00:00.000Z",
    imageUrl: "data:image/svg+xml,%3Csvg%3E%3C/svg%3E",
    points: [],
    mmPerUnit: 250,
    dimensions: {
      pupillaryDistanceMm: 58,
      faceWidthMm: 125,
      bridgeWidthMm: 11,
      templeLengthMm: 95,
      faceLengthMm: 140,
      foreheadWidthMm: 118,
      jawWidthMm: 110,
    },
    recommendedFrameSize: "S",
    faceShape: "Round",
    status: "complete",
  },
];

describe("HistoryList", () => {
  it("renders every measurement by default", () => {
    render(<HistoryList measurements={MEASUREMENTS} onDelete={vi.fn()} />);

    expect(screen.getByText("Thabo Nkosi")).toBeInTheDocument();
    expect(screen.getByText("Aisha Patel")).toBeInTheDocument();
  });

  it("filters by customer name search", async () => {
    render(<HistoryList measurements={MEASUREMENTS} onDelete={vi.fn()} />);

    await userEvent.type(screen.getByPlaceholderText("Search by customer name…"), "aisha");

    expect(screen.queryByText("Thabo Nkosi")).not.toBeInTheDocument();
    expect(screen.getByText("Aisha Patel")).toBeInTheDocument();
  });

  it("calls onDelete with the measurement id", async () => {
    const onDelete = vi.fn();
    render(<HistoryList measurements={MEASUREMENTS} onDelete={onDelete} />);

    await userEvent.click(screen.getAllByRole("button", { name: "Delete" })[0]);

    expect(onDelete).toHaveBeenCalledWith("1");
  });
});
