from rest_framework import serializers
from .models import Trip, Participant, TripExpense

class ParticipantSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(read_only=True)

    class Meta:
        model = Participant
        fields = ['id', 'name']

class TripExpenseSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(read_only=True)

    class Meta:
        model = TripExpense
        fields = ['id', 'paid_by', 'amount', 'description', 'created_at']

class TripSerializer(serializers.ModelSerializer):
    participants = ParticipantSerializer(many=True, read_only=True)
    expenses = TripExpenseSerializer(many=True, read_only=True)

    class Meta:
        model = Trip
        fields = ['id', 'trip_name', 'start_date', 'end_date', 'budget', 'participants', 'expenses', 'created']

class TripCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Trip
        fields = ['trip_name', 'start_date', 'end_date', 'budget']

class TripExpenseCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = TripExpense
        # Do not include 'trip' here; the view will pass it on save()
        fields = ['paid_by', 'amount', 'description', 'created_at']
        read_only_fields = ['created_at']

    def create(self, validated_data):
        # When save(trip=trip_obj) is called, DRF will pass trip as kwarg to save(),
        # which we capture in save() below and then use here via self._validated_trip.
        return TripExpense.objects.create(**validated_data, trip=self._validated_trip)

    def save(self, **kwargs):
        """
        Override save so we accept trip passed via save(trip=trip_obj).
        """
        trip = kwargs.pop('trip', None)
        if trip is None:
            trip = self.context.get('trip')
        if trip is None:
            raise serializers.ValidationError("Trip is required to save an expense.")
        # store for create()
        self._validated_trip = trip
        return super().save(**kwargs)

