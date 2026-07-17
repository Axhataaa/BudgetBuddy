// Maps to the `ordering` param both ExpenseViewSet and IncomeViewSet
// already support (ordering_fields includes "date" and "amount" on
// both) - shared here since the options are identical on both pages.
export const AMOUNT_DATE_SORT_OPTIONS = [
  { value: "-date", label: "Latest First" },
  { value: "date", label: "Oldest First" },
  { value: "-amount", label: "Highest Amount" },
  { value: "amount", label: "Lowest Amount" },
];
