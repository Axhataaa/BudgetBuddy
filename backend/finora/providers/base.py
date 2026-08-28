import abc


class FinoraAIProvider(abc.ABC):
    """
    Contract for a Finora AI provider.

    Groq is the active implementation (see groq.py); a Gemini
    implementation also exists (see gemini.py) but is unused at runtime,
    kept only so a rollback is a one-line change. Every view/service in
    this app talks to providers only through this interface - never to a
    specific vendor's SDK/HTTP shape directly. Swapping providers later
    means writing one new class here and changing the single factory in
    finora/services.py; nothing else in the app needs to know which
    vendor is behind it.
    """

    @abc.abstractmethod
    def generate_reply(self, *, context, message, history, scenario_result=None):
        """
        Generate an assistant reply.

        Args:
            context: dict - the structured, user-scoped financial
                context produced by finora.context.build_finora_context.
            message: str - the user's current message.
            history: list[dict] - prior turns for this conversation,
                each shaped like {"role": "user"|"assistant", "content": str}.
                This is supplied by the client on every request; Finora
                does not persist conversation history server-side.
            scenario_result: dict | None - when the message was
                classified as a what-if question and a deterministic
                result was computed by finora.whatif, that plain-data
                result is passed here. Implementations must treat its
                numbers as authoritative and must not recompute them.

        Returns:
            str: the assistant's reply text.

        Raises:
            finora.exceptions.FinoraProviderUnavailable: whenever a
                reply cannot be safely produced. Implementations must
                never let vendor-specific exceptions escape this method.
        """
        raise NotImplementedError

    @abc.abstractmethod
    def classify_scenario(self, *, message, history):
        """
        Classify `message` (with `history` for context, e.g. resolving
        "it"/"that" from a prior turn) as either a normal question or a
        what-if / hypothetical scenario, and if it's the latter, extract
        structured parameters for it.

        Returns a dict shaped like one of:
            {"is_what_if": False}
            {"is_what_if": True, "scenario_type": <one of
                finora.whatif.SUPPORTED_SCENARIO_TYPES>, "params": {...}}
            {"is_what_if": True, "scenario_type": "unsupported"}

        Implementations must never raise for a merely-ambiguous message -
        return {"is_what_if": False} or "unsupported" instead. This may
        raise finora.exceptions.FinoraProviderUnavailable only for actual
        provider failures (network/auth/malformed response), exactly
        like generate_reply.
        """
        raise NotImplementedError