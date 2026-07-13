from rest_framework import serializers

from .models import Budget


class BudgetSerializer(serializers.ModelSerializer):
    class Meta:
        model = Budget
        fields = ["id", "category", "monthly_limit", "month", "year", "created_at"]
        # `user` deliberately absent - same reasoning as Expense/Income.
        read_only_fields = ["id", "created_at"]

    def validate_monthly_limit(self, value):
        if value <= 0:
            raise serializers.ValidationError("Monthly limit must be greater than 0.")
        return value

    def validate(self, attrs):
        # The model's UniqueConstraint is on (user, category, month, year),
        # but `user` isn't a serializer field (it's set server-side in
        # perform_create), so DRF's automatic unique-together validator
        # can't see it and a duplicate would otherwise only be caught by
        # Postgres raising IntegrityError - an unhandled 500, not the
        # standard validation-error envelope. Checked explicitly here
        # instead, using the request user from context.
        request = self.context["request"]
        category = attrs.get("category", getattr(self.instance, "category", None))
        month = attrs.get("month", getattr(self.instance, "month", None))
        year = attrs.get("year", getattr(self.instance, "year", None))

        existing = Budget.objects.filter(
            user=request.user, category=category, month=month, year=year
        )
        if self.instance:
            existing = existing.exclude(pk=self.instance.pk)

        if existing.exists():
            raise serializers.ValidationError(
                {"category": "A budget for this category already exists for this month."}
            )
        return attrs
