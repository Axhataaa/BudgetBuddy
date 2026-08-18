from rest_framework import serializers


class ReportQuerySerializer(serializers.Serializer):

    date_from = serializers.DateField()
    date_to = serializers.DateField()

    def validate(self, attrs):
        if attrs["date_from"] > attrs["date_to"]:
            raise serializers.ValidationError(
                {"date_to": "date_to must be on or after date_from."}
            )
        return attrs
