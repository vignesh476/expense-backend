from rest_framework import serializers
from .models import Transaction

class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = ['id', 'amount', 'type', 'description', 'created_at']
        read_only_fields = ['id', 'created_at', 'user']

class TransactionListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = ['id', 'amount', 'type']

class TransactionCreateSerializer(serializers.ModelSerializer):
    TYPE_CHOICES = ('income', 'expense')
    type = serializers.ChoiceField(choices=TYPE_CHOICES)

    class Meta:
        model = Transaction
        fields = ['amount', 'type', 'description']

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError('Amount must be greater than zero')
        return value

