import { useEffect, useState } from "react";
import { getLocalDateString, getMillisUntilNextLocalMidnight } from "../utils/localDate";

/**
 * Returns today's date as a local "YYYY-MM-DD" string. The value updates
 * itself automatically the moment local midnight passes (via a single
 * precisely-timed timer, not polling), so components using this hook pick
 * up the new calendar day without requiring a page refresh.
 */
export function useTodayLocalDate() {
  const [today, setToday] = useState(() => getLocalDateString());

  useEffect(() => {
    let timeoutId;

    const scheduleRollover = () => {
      // +1s buffer to make sure we fire just after midnight, not just before.
      const delay = getMillisUntilNextLocalMidnight() + 1000;
      timeoutId = setTimeout(() => {
        setToday(getLocalDateString());
        scheduleRollover();
      }, delay);
    };

    scheduleRollover();

    return () => clearTimeout(timeoutId);
  }, []);

  return today;
}
