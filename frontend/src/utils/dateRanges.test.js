import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { getLastNMonthsRange } from "./dateRanges";

// Regression tests for the Dashboard "Last 6 Months" chart bug: the window
// must be anchored to the Dashboard's selected month/year (used as the END
// of the range), not to the real current date.
describe("getLastNMonthsRange", () => {
  it("uses the selected month/year as the end of a 6-month window: August 2026 -> March-August 2026", () => {
    const { months, date_from, date_to } = getLastNMonthsRange(6, 8, 2026);

    expect(months).toEqual([
      "2026-03",
      "2026-04",
      "2026-05",
      "2026-06",
      "2026-07",
      "2026-08",
    ]);
    expect(date_from).toBe("2026-03-01");
    // date_to must cover the FULL end month, not just "today" within it.
    expect(date_to).toBe("2026-08-31");
  });

  it("uses the selected month/year as the end of a 6-month window: July 2026 -> February-July 2026", () => {
    const { months, date_from, date_to } = getLastNMonthsRange(6, 7, 2026);

    expect(months).toEqual([
      "2026-02",
      "2026-03",
      "2026-04",
      "2026-05",
      "2026-06",
      "2026-07",
    ]);
    expect(date_from).toBe("2026-02-01");
    expect(date_to).toBe("2026-07-31");
  });

  it("shifts the window further back for an earlier selected month: June 2026 -> January-June 2026", () => {
    const { months, date_from, date_to } = getLastNMonthsRange(6, 6, 2026);

    expect(months).toEqual([
      "2026-01",
      "2026-02",
      "2026-03",
      "2026-04",
      "2026-05",
      "2026-06",
    ]);
    expect(date_from).toBe("2026-01-01");
    expect(date_to).toBe("2026-06-30");
  });

  it("crosses a year boundary correctly: January 2026 -> August-December 2025 + January 2026", () => {
    const { months, date_from, date_to } = getLastNMonthsRange(6, 1, 2026);

    expect(months).toEqual([
      "2025-08",
      "2025-09",
      "2025-10",
      "2025-11",
      "2025-12",
      "2026-01",
    ]);
    expect(date_from).toBe("2025-08-01");
    expect(date_to).toBe("2026-01-31");
  });

  describe("default end month/year (no arguments given)", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 7, 15)); // 15 Aug 2026
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("falls back to the real current month/year for backward compatibility", () => {
      const { months, date_from, date_to } = getLastNMonthsRange(6);

      expect(months).toEqual([
        "2026-03",
        "2026-04",
        "2026-05",
        "2026-06",
        "2026-07",
        "2026-08",
      ]);
      expect(date_from).toBe("2026-03-01");
      expect(date_to).toBe("2026-08-31");
    });
  });
});
