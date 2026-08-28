from rest_framework import serializers

MAX_MESSAGE_LENGTH = 2000
MAX_HISTORY_TURNS = 20
MAX_HISTORY_CONTENT_LENGTH = 4000


class FinoraHistoryTurnSerializer(serializers.Serializer):
    """
    One prior turn of a conversation, as sent by the client. Finora does
    not persist conversation history server-side - the client resends
    whatever context it wants included on each request.
    """

    role = serializers.ChoiceField(choices=["user", "assistant"])
    content = serializers.CharField(
        allow_blank=False, max_length=MAX_HISTORY_CONTENT_LENGTH
    )


class FinoraChatRequestSerializer(serializers.Serializer):
    message = serializers.CharField(allow_blank=False, max_length=MAX_MESSAGE_LENGTH)

    history = FinoraHistoryTurnSerializer(many=True, required=False, default=list)

    # Optional window for the financial context. Both or neither -
    # defaulting a lone date would silently change the other bound.
    date_from = serializers.DateField(required=False)
    date_to = serializers.DateField(required=False)

    def validate_message(self, value):
        stripped = value.strip()
        if not stripped:
            raise serializers.ValidationError("This field may not be blank.")
        return stripped

    def validate_history(self, value):
        if len(value) > MAX_HISTORY_TURNS:
            raise serializers.ValidationError(
                f"history cannot contain more than {MAX_HISTORY_TURNS} turns."
            )
        return value

    def validate(self, attrs):
        date_from = attrs.get("date_from")
        date_to = attrs.get("date_to")

        if bool(date_from) != bool(date_to):
            raise serializers.ValidationError(
                "date_from and date_to must be provided together."
            )

        if date_from and date_to and date_from > date_to:
            raise serializers.ValidationError(
                {"date_to": "date_to must be on or after date_from."}
            )

        return attrs
