import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import AchievementCard from "./AchievementCard";

const baseGoal = {
  id: 1,
  goal_name: "Test Achievement",
  description: "",
  target_amount: "1000",
  purchase_date: "2026-06-01",
  purchase_note: "",
};

function renderCard(overrides = {}) {
  return render(
    <AchievementCard
      goal={{ ...baseGoal, ...overrides }}
      onViewJourney={vi.fn()}
      onDelete={vi.fn()}
    />
  );
}

describe("AchievementCard", () => {
  it("uses purchase terminology for a PURCHASE goal", () => {
    renderCard({ goal_type: "PURCHASE" });

    expect(screen.getByText("Purchased")).toBeInTheDocument();
    expect(screen.getByText("Purchase Value")).toBeInTheDocument();
    expect(screen.getByText("Purchased On")).toBeInTheDocument();
    expect(screen.getByText("Purchase Note")).toBeInTheDocument();
  });

  it("uses generic completion terminology for a non-purchase goal", () => {
    renderCard({ goal_type: "TRAVEL" });

    expect(screen.getByText("Completed")).toBeInTheDocument();
    expect(screen.getByText("Amount Saved")).toBeInTheDocument();
    expect(screen.getByText("Completed On")).toBeInTheDocument();
    expect(screen.getByText("Completion Note")).toBeInTheDocument();
    expect(screen.queryByText("Purchased")).not.toBeInTheDocument();
  });

  it("falls back to purchase terminology when goal_type is missing", () => {
    renderCard({});

    expect(screen.getByText("Purchased")).toBeInTheDocument();
  });
});
