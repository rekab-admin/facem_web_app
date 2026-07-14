import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ConsentGate } from "./ConsentGate";

describe("ConsentGate", () => {
  it("disables Enter until the checkbox is checked", async () => {
    render(<ConsentGate onAcknowledge={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Enter" })).toBeDisabled();

    await userEvent.click(screen.getByRole("checkbox"));

    expect(screen.getByRole("button", { name: "Enter" })).toBeEnabled();
  });

  it("calls onAcknowledge when Enter is clicked after checking", async () => {
    const onAcknowledge = vi.fn();
    render(<ConsentGate onAcknowledge={onAcknowledge} />);

    await userEvent.click(screen.getByRole("checkbox"));
    await userEvent.click(screen.getByRole("button", { name: "Enter" }));

    expect(onAcknowledge).toHaveBeenCalledOnce();
  });

  it("does not call onAcknowledge while Enter is disabled", async () => {
    const onAcknowledge = vi.fn();
    render(<ConsentGate onAcknowledge={onAcknowledge} />);

    await userEvent.click(screen.getByRole("button", { name: "Enter" }));

    expect(onAcknowledge).not.toHaveBeenCalled();
  });
});
