import { describe, it, expect } from "vitest";
import {
  getBudgetStatusColor,
  BUDGET_WARNING_THRESHOLD,
  BUDGET_HIGH_WARNING_THRESHOLD,
  BUDGET_EXCEEDED_THRESHOLD,
} from "./budgetStatus";

describe("getBudgetStatusColor", () => {
  it("exposes the standardized 80/90/100 thresholds", () => {
    expect(BUDGET_WARNING_THRESHOLD).toBe(80);
    expect(BUDGET_HIGH_WARNING_THRESHOLD).toBe(90);
    expect(BUDGET_EXCEEDED_THRESHOLD).toBe(100);
  });

  it("is income/green below 80%", () => {
    expect(getBudgetStatusColor(0)).toBe("var(--color-income)");
    expect(getBudgetStatusColor(50)).toBe("var(--color-income)");
    expect(getBudgetStatusColor(79.99)).toBe("var(--color-income)");
  });

  it("is warning/amber at exactly 80%", () => {
    expect(getBudgetStatusColor(80)).toBe("var(--color-warning)");
  });

  it("is warning/amber between 80% and 90%", () => {
    expect(getBudgetStatusColor(85)).toBe("var(--color-warning)");
    expect(getBudgetStatusColor(89.99)).toBe("var(--color-warning)");
  });

  it("is danger/red at exactly 90%", () => {
    expect(getBudgetStatusColor(90)).toBe("var(--color-danger)");
  });

  it("is danger/red between 90% and 100%", () => {
    expect(getBudgetStatusColor(95)).toBe("var(--color-danger)");
    expect(getBudgetStatusColor(99.99)).toBe("var(--color-danger)");
  });

  it("is danger/red at exactly 100%", () => {
    expect(getBudgetStatusColor(100)).toBe("var(--color-danger)");
  });

  it("stays danger/red above 100%", () => {
    expect(getBudgetStatusColor(120)).toBe("var(--color-danger)");
  });
});
