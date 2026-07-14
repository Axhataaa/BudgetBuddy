// Mirrors expenses/models.py CATEGORY_CHOICES / PAYMENT_METHODS exactly.
// Kept here (not hardcoded inline in the page) so if the backend adds a
// category later, this is the one place the frontend needs updating.
export const EXPENSE_CATEGORIES = [
  "Food",
  "Travel",
  "Shopping",
  "Education",
  "Entertainment",
  "Healthcare",
  "Bills",
  "Miscellaneous",
];

export const PAYMENT_METHODS = ["Cash", "UPI", "Card", "Bank Transfer"];
