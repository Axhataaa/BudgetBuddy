export const AMOUNT_DATE_SORT_OPTIONS = [
  { value: "-date", label: "Latest First" },
  { value: "date", label: "Oldest First" },
  { value: "-amount", label: "Highest Amount" },
  { value: "amount", label: "Lowest Amount" },
];

export const GOAL_SORT_OPTIONS = [
  { value: "target_date", label: "Target date — soonest" },
  { value: "-target_date", label: "Target date — latest" },
  { value: "target_amount", label: "Target amount — lowest" },
  { value: "-target_amount", label: "Target amount — highest" },
  { value: "current_amount", label: "Saved amount — lowest" },
  { value: "-current_amount", label: "Saved amount — highest" },
  { value: "goal_name", label: "Name — A to Z" },
  { value: "-goal_name", label: "Name — Z to A" },
  { value: "-created_at", label: "Recently added" },
];
