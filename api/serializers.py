from rest_framework import serializers


class MessageSerializer(serializers.Serializer):
    message = serializers.CharField(max_length=200)
    timestamp = serializers.DateTimeField(read_only=True)


class CalculatorInputSerializer(serializers.Serializer):
    a = serializers.FloatField()
    b = serializers.FloatField()
    op = serializers.ChoiceField(choices=("add", "sub", "mul", "div"))

    def validate(self, attrs):
        op = attrs.get("op")
        b = attrs.get("b")
        if op == "div" and b == 0:
            # Bind error to field 'b' for clearer client-side handling
            raise serializers.ValidationError({"b": "Division by zero"})
        return attrs


class CalculatorOutputSerializer(serializers.Serializer):
    result = serializers.FloatField()
