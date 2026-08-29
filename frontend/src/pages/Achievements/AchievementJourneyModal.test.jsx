import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import AchievementJourneyModal from "./AchievementJourneyModal";

const baseGoal = {
  id: 1,
  goal_name: "Test Journey Goal",
  target_amount: "1000",
  created_at: "2026-01-01T00:00:00Z",
  purchase_date: "2026-06-01",
  purchase_note: "",
  transactions: [],
};

describe("AchievementJourneyModal", () => {
  it("uses purchase terminology for a PURCHASE goal", () => {
    render(
      <AchievementJourneyModal
        show={true}
        goal={{ ...baseGoal, goal_type: "PURCHASE" }}
        onHide={() => {}}
      />
    );

    expect(screen.getByText("Purchase Completed 🎉")).toBeInTheDocument();
    expect(screen.getByText("Purchase Value")).toBeInTheDocument();
    expect(screen.getByText("Purchase Date")).toBeInTheDocument();
    expect(screen.getByText(/you successfully purchased/i)).toBeInTheDocument();
  });

  it("uses generic completion terminology for a non-purchase goal", () => {
    render(
      <AchievementJourneyModal
        show={true}
        goal={{ ...baseGoal, goal_type: "EDUCATION" }}
        onHide={() => {}}
      />
    );

    expect(screen.getByText("Savings Goal Completed 🎉")).toBeInTheDocument();
    expect(screen.getByText("Amount Saved")).toBeInTheDocument();
    expect(screen.getByText("Completed On")).toBeInTheDocument();
    expect(screen.getByText(/you successfully completed/i)).toBeInTheDocument();
    expect(screen.queryByText("Purchase Completed 🎉")).not.toBeInTheDocument();
  });
});
