import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import LatestAchievement from "./LatestAchievement";

const baseAchievement = {
  goal_name: "Test Latest Achievement",
  target_amount: "1000",
  purchase_date: "2026-06-01",
  purchase_note: "",
};

describe("LatestAchievement", () => {
  it("shows purchase wording for a PURCHASE goal", () => {
    render(
      <LatestAchievement
        summary={{
          latest_achievement: { ...baseAchievement, goal_type: "PURCHASE" },
        }}
      />
    );

    expect(screen.getByText("Purchased On")).toBeInTheDocument();
  });

  it("shows generic completion wording for a non-purchase goal", () => {
    render(
      <LatestAchievement
        summary={{
          latest_achievement: { ...baseAchievement, goal_type: "GENERAL" },
        }}
      />
    );

    expect(screen.getByText("Completed On")).toBeInTheDocument();
    expect(screen.queryByText("Purchased On")).not.toBeInTheDocument();
  });

  it("falls back to purchase wording when goal_type is missing", () => {
    render(
      <LatestAchievement
        summary={{ latest_achievement: { ...baseAchievement } }}
      />
    );

    expect(screen.getByText("Purchased On")).toBeInTheDocument();
  });

  it("renders the empty state when there is no achievement yet", () => {
    render(<LatestAchievement summary={{ latest_achievement: null }} />);

    expect(screen.getByText("No Achievements Yet")).toBeInTheDocument();
  });
});
