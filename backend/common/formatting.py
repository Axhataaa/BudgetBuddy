from decimal import Decimal, ROUND_HALF_UP


def format_inr(amount):

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

CURRENCY_SYMBOLS = {
    "INR": "₹",
    "USD": "$",
    "EUR": "€",
    "GBP": "£",
    "JPY": "¥",
    "KRW": "₩",
    "CNY": "¥",
}

ZERO_DECIMAL_CURRENCIES = {"JPY", "KRW"}

FALLBACK_RATES_FROM_INR = {
    "INR": Decimal("1"),
    "USD": Decimal("0.0120"),
    "EUR": Decimal("0.0110"),
    "GBP": Decimal("0.0095"),
    "JPY": Decimal("1.6700"),
    "KRW": Decimal("14.8000"),
    "CNY": Decimal("0.0705"),
}


def convert_from_inr(amount_inr, currency_code):
    """
    Convert an INR-denominated amount into the given currency as a plain
    rounded Decimal (no symbol/grouping), using the same static
    FALLBACK_RATES_FROM_INR table as format_currency() above. Intended for
    callers that need the numeric value itself (e.g. building a structured
    payload for the AI Financial Analyst) rather than display text.
    """
    code = currency_code if currency_code in CURRENCY_SYMBOLS else "INR"
    rate = FALLBACK_RATES_FROM_INR.get(code, Decimal("1"))
    value = Decimal(str(amount_inr)) * rate

    decimals = 0 if code in ZERO_DECIMAL_CURRENCIES else 2
    quant = Decimal("1") if decimals == 0 else Decimal("0.01")
    return value.quantize(quant, rounding=ROUND_HALF_UP)


def format_currency(amount_inr, currency_code):
    """
    Format an INR-denominated amount for display in the given currency,
    for use in backend-generated notification/alert text.

    INR is handled via the existing format_inr() so INR-currency output
    is byte-for-byte unchanged from before this function existed. Other
    currencies are converted using the static approximate rate table
    above and grouped with standard (Western) thousands separators.
    """
    code = currency_code if currency_code in CURRENCY_SYMBOLS else "INR"

    if code == "INR":
        return f"₹{format_inr(amount_inr)}"

    rate = FALLBACK_RATES_FROM_INR.get(code, Decimal("1"))
    value = Decimal(str(amount_inr)) * rate

    decimals = 0 if code in ZERO_DECIMAL_CURRENCIES else 2
    quant = Decimal("1") if decimals == 0 else Decimal("0.01")
    value = value.quantize(quant, rounding=ROUND_HALF_UP)

    negative = value < 0
    value = abs(value)

    formatted = f"{value:,.0f}" if decimals == 0 else f"{value:,.2f}"

    symbol = CURRENCY_SYMBOLS[code]
    return f"-{symbol}{formatted}" if negative else f"{symbol}{formatted}"


def format_currency_for_user(user, amount_inr):
    """
    Convenience wrapper: format amount_inr using the given user's
    Profile.currency (defaulting to INR if the user has no profile or
    no currency set, matching Profile.Currency's own model default).
    """
    profile = getattr(user, "profile", None)
    currency_code = getattr(profile, "currency", None) or "INR"
    return format_currency(amount_inr, currency_code)
