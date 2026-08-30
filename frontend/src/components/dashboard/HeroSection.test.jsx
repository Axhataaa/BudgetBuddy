import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import HeroSection from "./HeroSection";

const baseSummary = {
  net_savings: "5000.00",
  monthly_saving_target: "5000.00",
  lifetime: { current_balance: "100000.00" },
  total_budget: "0.00",
  budget_status: { overspent_categories: 0, warning_categories: 0 },
  active_goals: 0,
  completed_goals: 0,
};

describe("HeroSection monthly saving target", () => {
  it("shows 100% achieved when net savings equals the target", () => {
    render(<HeroSection summary={baseSummary} periodLabel="August 2026" />);
    expect(screen.getByText("100% achieved")).toBeInTheDocument();
  });

  it("shows the exceeded percentage and amount above target", () => {
    render(
      <HeroSection
        summary={{ ...baseSummary, net_savings: "6000.00" }}
        periodLabel="August 2026"
      />
    );
    expect(screen.getByText("120% achieved")).toBeInTheDocument();
    expect(screen.getByText(/above target/)).toBeInTheDocument();
  });

  it("shows a partial percentage and remaining amount", () => {
    render(
      <HeroSection
        summary={{ ...baseSummary, net_savings: "2500.00" }}
        periodLabel="August 2026"
      />
    );
    expect(screen.getByText("50% achieved")).toBeInTheDocument();
    expect(screen.getByText(/to go/)).toBeInTheDocument();
  });

  it("shows 0% achieved and a below-target amount for negative net savings", () => {
    render(
      <HeroSection
        summary={{ ...baseSummary, net_savings: "-1000.00" }}
        periodLabel="August 2026"
      />
    );
    expect(screen.getByText("0% achieved")).toBeInTheDocument();
    expect(screen.getByText(/below target/)).toBeInTheDocument();
    // Negative net savings must still be visible elsewhere in the hero.
    expect(screen.getAllByText(/-.*1,000|1,000.*-/).length).toBeGreaterThan(0);
  });

  it("shows a compact 'no target set' state without dividing by zero", () => {
    render(
      <HeroSection
        summary={{ ...baseSummary, monthly_saving_target: "0.00" }}
        periodLabel="August 2026"
      />
    );
    expect(screen.getByText("No monthly target set")).toBeInTheDocument();
    expect(screen.queryByText(/achieved/)).not.toBeInTheDocument();
  });

  it("still renders the existing Net Savings value alongside the target", () => {
    render(<HeroSection summary={baseSummary} periodLabel="August 2026" />);
    expect(screen.getByText(/Net Savings/)).toBeInTheDocument();
  });
});
