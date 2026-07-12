import logging

from rest_framework.views import exception_handler as drf_exception_handler

logger = logging.getLogger("budgetbuddy")

# Maps DRF's default exception classes to the stable, machine-readable
# `code` values defined in the Backend API Design Document, §6.
_CODE_BY_STATUS = {
    400: "validation_error",
    401: "authentication_failed",
    403: "permission_denied",
    404: "not_found",
    405: "method_not_allowed",
    429: "throttled",
}

_DEFAULT_MESSAGE_BY_CODE = {
    "validation_error": "Please fix the highlighted fields.",
    "authentication_failed": "Authentication credentials were not provided or are invalid.",
    "permission_denied": "You do not have permission to perform this action.",
    "not_found": "The requested resource was not found.",
    "method_not_allowed": "This method is not allowed on this endpoint.",
    "throttled": "Too many requests. Please try again shortly.",
}


def custom_exception_handler(exc, context):
    """
    Wraps every DRF-handled error (APIException, Http404, PermissionDenied)
    into the single response shape every module must return, per the
    approved Backend API Design Document §6 (errors) and §7 (validation).

    Plain success responses are untouched - this only runs when DRF's
    default handler would otherwise return a raw {"field": [...]} or
    {"detail": "..."} body, which is exactly the inconsistency this
    handler exists to remove.
    """
    response = drf_exception_handler(exc, context)

    if response is None:
        # Not something DRF's default handler recognizes (e.g. an
        # unhandled Python exception). Let Django's own 500 handling
        # take over - wrapping arbitrary 500s in this envelope too is a
        # larger, separate piece of production hardening, not required
        # for this module.
        return response

    code = _CODE_BY_STATUS.get(response.status_code, "error")

    if code == "validation_error":
        # response.data is DRF's native {"field": ["msg", ...]} dict -
        # exactly the shape §7 asks `details` to mirror, so it's reused
        # as-is rather than restructured.
        details = response.data if isinstance(response.data, dict) else None
        message = _DEFAULT_MESSAGE_BY_CODE[code]
    else:
        details = None
        # DRF puts a human-readable string in `detail` for non-validation
        # errors - prefer it when present, otherwise fall back to our
        # default so the client never sees an empty message.
        raw_detail = response.data.get("detail") if isinstance(response.data, dict) else None
        message = str(raw_detail) if raw_detail else _DEFAULT_MESSAGE_BY_CODE.get(code, "An error occurred.")

    if response.status_code >= 500:
        logger.error("Unhandled API error: %s", exc, exc_info=exc)

    response.data = {"error": {"code": code, "message": message, "details": details}}
    return response
