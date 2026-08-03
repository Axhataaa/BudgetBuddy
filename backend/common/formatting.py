from decimal import Decimal, ROUND_HALF_UP


def format_inr(amount):
    """
    Formats a numeric amount using Indian digit grouping with a fixed
    2 decimal places, e.g. Decimal("103200") -> "1,03,200.00".

    Matches the frontend's Intl.NumberFormat("en-IN", {style: "currency",
    currency: "INR"}) grouping (frontend/src/utils/formatCurrency.js) so
    backend-generated notification text (budgets/views.py,
    budgets/serializers.py, budgets/notifications.py, incomes/views.py)
    stays visually consistent with the rest of the app instead of
    printing raw, un-grouped numbers like "103200.00".

    Does not include the currency symbol - callers prepend "₹"
    themselves, matching how every existing notification message
    already embeds the symbol directly rather than this helper owning
    presentation of the symbol too.
    """
    value = Decimal(str(amount)).quantize(
        Decimal("0.01"), rounding=ROUND_HALF_UP
    )
    negative = value < 0
    value = abs(value)

    int_part, _, dec_part = f"{value:.2f}".partition(".")

    if len(int_part) > 3:
        last_three = int_part[-3:]
        remaining = int_part[:-3]
        groups = []
        while len(remaining) > 2:
            groups.insert(0, remaining[-2:])
            remaining = remaining[:-2]
        if remaining:
            groups.insert(0, remaining)
        int_part = ",".join(groups) + "," + last_three

    formatted = f"{int_part}.{dec_part}"
    return f"-{formatted}" if negative else formatted
