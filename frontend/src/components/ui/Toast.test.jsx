import { render, screen, act, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ToastProvider, useToast } from "./Toast";

function TestHarness() {
  const { showToast } = useToast();

  return (
    <div>
      <button onClick={() => showToast("Saved successfully.", "success")}>
        fire-success
      </button>
      <button onClick={() => showToast("You've used 80% of your Food budget.", "warning")}>
        fire-warning
      </button>
      <button onClick={() => showToast("Couldn't save expense.", "error")}>
        fire-error
      </button>
      <button
        onClick={() =>
          showToast("Your Food budget has been exceeded.", "error", {
            persistent: true,
          })
        }
      >
        fire-persistent
      </button>
    </div>
  );
}

function renderWithProvider() {
  return render(
    <ToastProvider>
      <TestHarness />
    </ToastProvider>
  );
}

describe("ToastProvider", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("auto-dismisses a normal success toast after 5 seconds", () => {
    renderWithProvider();

    fireEvent.click(screen.getByText("fire-success"));
    expect(screen.getByText("Saved successfully.")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(screen.queryByText("Saved successfully.")).not.toBeInTheDocument();
  });

  it("auto-dismisses a warning toast after 5 seconds", () => {
    renderWithProvider();

    fireEvent.click(screen.getByText("fire-warning"));
    expect(screen.getByText("You've used 80% of your Food budget.")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(
      screen.queryByText("You've used 80% of your Food budget.")
    ).not.toBeInTheDocument();
  });

  it("auto-dismisses a normal error toast after 5 seconds", () => {
    renderWithProvider();

    fireEvent.click(screen.getByText("fire-error"));
    expect(screen.getByText("Couldn't save expense.")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(screen.queryByText("Couldn't save expense.")).not.toBeInTheDocument();
  });

  it("does not dismiss before 5 seconds have elapsed", () => {
    renderWithProvider();

    fireEvent.click(screen.getByText("fire-success"));

    act(() => {
      vi.advanceTimersByTime(4999);
    });

    expect(screen.getByText("Saved successfully.")).toBeInTheDocument();
  });

  it("closes a toast immediately when the X is clicked, before the timer fires", () => {
    renderWithProvider();

    fireEvent.click(screen.getByText("fire-success"));
    expect(screen.getByText("Saved successfully.")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Dismiss"));

    expect(screen.queryByText("Saved successfully.")).not.toBeInTheDocument();
  });

  it("keeps a toast explicitly marked persistent visible past 5 seconds, until manually closed", () => {
    renderWithProvider();

    fireEvent.click(screen.getByText("fire-persistent"));
    expect(screen.getByText("Your Food budget has been exceeded.")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(10000);
    });

    expect(screen.getByText("Your Food budget has been exceeded.")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Dismiss"));

    expect(
      screen.queryByText("Your Food budget has been exceeded.")
    ).not.toBeInTheDocument();
  });
});
