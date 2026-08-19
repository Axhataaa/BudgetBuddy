import { describe, it, expect, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { render, screen, fireEvent } from "@testing-library/react";
import DateRangeFilter from "./DateRangeFilter";

describe("DateRangeFilter", () => {
  it("renders all period presets", () => {
    render(
      <DateRangeFilter period="this_month" onPeriodChange={vi.fn()} customFrom="" customTo="" onCustomChange={vi.fn()} />
    );
    ["Today", "Week", "Month", "Year", "Custom Range"].forEach((label) => {
      expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
    });
  });

  it("marks the active period as selected", () => {
    render(
      <DateRangeFilter period="this_year" onPeriodChange={vi.fn()} customFrom="" customTo="" onCustomChange={vi.fn()} />
    );
    expect(screen.getByRole("button", { name: "Year" })).toHaveClass("active");
    expect(screen.getByRole("button", { name: "Month" })).not.toHaveClass("active");
  });

  it("calls onPeriodChange and computes a date range for preset selections", async () => {
    const onPeriodChange = vi.fn();
    const onCustomChange = vi.fn();
    const user = userEvent.setup();
    render(
      <DateRangeFilter period="this_month" onPeriodChange={onPeriodChange} customFrom="" customTo="" onCustomChange={onCustomChange} />
    );

    await user.click(screen.getByRole("button", { name: "Week" }));

    expect(onPeriodChange).toHaveBeenCalledWith("last7");
    expect(onCustomChange).toHaveBeenCalledTimes(1);
    const [from, to] = onCustomChange.mock.calls[0];
    expect(from).toBeTruthy();
    expect(to).toBeTruthy();
  });

  it("shows custom date inputs only when period is 'custom', and does not auto-fill a range", async () => {
    const onPeriodChange = vi.fn();
    const onCustomChange = vi.fn();
    const user = userEvent.setup();
    render(
      <DateRangeFilter period="this_month" onPeriodChange={onPeriodChange} customFrom="" customTo="" onCustomChange={onCustomChange} />
    );

    expect(screen.queryByLabelText(/from date/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Custom Range" }));

    expect(onPeriodChange).toHaveBeenCalledWith("custom");
    // Custom selection should not auto-fill a computed range.
    expect(onCustomChange).not.toHaveBeenCalled();
  });

  it("updates custom from/to values independently", async () => {
    const onCustomChange = vi.fn();
    render(
      <DateRangeFilter
        period="custom"
        onPeriodChange={vi.fn()}
        customFrom="2026-01-01"
        customTo="2026-01-31"
        onCustomChange={onCustomChange}
      />
    );

    const fromInput = screen.getByLabelText(/from date/i);
    fireEvent.change(fromInput, { target: { value: "2026-01-05" } });

    expect(onCustomChange).toHaveBeenCalledWith("2026-01-05", "2026-01-31");
  });
});
