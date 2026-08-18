// Local-calendar-date helpers.
//
// `Date#toISOString()` always renders the UTC calendar date. For users whose
// local timezone is ahead of UTC (e.g. IST, UTC+5:30), this can report
// *yesterday's* date for several hours after local midnight has already
// passed, because the UTC day hasn't rolled over yet. These helpers build
// the date string from the browser's local date components instead
// (`getFullYear`/`getMonth`/`getDate`), the same approach already used in
// `dateRanges.js`, so a transaction date always reflects the user's actual
// local calendar day.

const pad = (n) => String(n).padStart(2, "0");

/** Formats a Date as a local "YYYY-MM-DD" calendar-date string. */
export function getLocalDateString(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Milliseconds from `from` until the next local midnight (00:00:00.000). */
export function getMillisUntilNextLocalMidnight(from = new Date()) {
  const nextMidnight = new Date(
    from.getFullYear(),
    from.getMonth(),
    from.getDate() + 1,
    0,
    0,
    0,
    0
  );
  return nextMidnight.getTime() - from.getTime();
}
