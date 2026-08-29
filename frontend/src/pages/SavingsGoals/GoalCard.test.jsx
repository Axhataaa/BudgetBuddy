import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import GoalCard from "./GoalCard";

const baseGoal = {
  id: 1,
  goal_name: "Test Goal",
  description: "",
  target_amount: "1000",
  current_amount: "1000",
  progress_percentage: "100",
  target_date: "2026-12-31",
  transactions: [],
  is_completed: true,
  is_purchased: false,
};

function renderCard(overrides = {}) {
  return render(
    <GoalCard
      goal={{ ...baseGoal, ...overrides }}
      onAddSavings={vi.fn()}
      onWithdraw={vi.fn()}
      onPurchase={vi.fn()}
      onEdit={vi.fn()}
      onDelete={vi.fn()}
    />
  );
}

describe("GoalCard completion wording", () => {
  it("shows purchase wording for a completed PURCHASE goal", () => {
    renderCard({ goal_type: "PURCHASE" });

    expect(screen.getByText("Ready to Purchase")).toBeInTheDocument();
    expect(screen.getByText(/purchase completed/i)).toBeInTheDocument();
  });

  it("shows generic completion wording for a completed non-purchase goal", () => {
    renderCard({ goal_type: "FUND" });

    expect(screen.getByText("Goal Reached")).toBeInTheDocument();
    expect(screen.getByText(/complete savings goal/i)).toBeInTheDocument();
    expect(screen.queryByText(/purchase completed/i)).not.toBeInTheDocument();
  });

  it("falls back to purchase wording when goal_type is missing", () => {
    renderCard({});

    expect(screen.getByText("Ready to Purchase")).toBeInTheDocument();
  });
});
