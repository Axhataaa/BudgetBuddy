import logging

from rest_framework.views import exception_handler as drf_exception_handler

logger = logging.getLogger("budgetbuddy")

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

    response = drf_exception_handler(exc, context)

    if response is None:

        return response

    code = _CODE_BY_STATUS.get(response.status_code, "error")

    if code == "validation_error":

        details = response.data if isinstance(response.data, dict) else None
        message = _DEFAULT_MESSAGE_BY_CODE[code]
    else:
        details = None

        raw_detail = response.data.get("detail") if isinstance(response.data, dict) else None
        message = str(raw_detail) if raw_detail else _DEFAULT_MESSAGE_BY_CODE.get(code, "An error occurred.")

    if response.status_code >= 500:
        logger.error("Unhandled API error: %s", exc, exc_info=exc)

    response.data = {"error": {"code": code, "message": message, "details": details}}
    return response
