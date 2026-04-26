from django.db import models
from django.utils import timezone
from accounts.models import User
from django.core.validators import MinValueValidator

class Participant(models.Model):
    name = models.CharField(max_length=100)
    trip = models.ForeignKey('Trip', on_delete=models.CASCADE, related_name='participants')

class TripExpense(models.Model):
    paid_by = models.CharField(max_length=100)
    amount = models.FloatField(validators=[MinValueValidator(0.01)])
    description = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(default=timezone.now)
    trip = models.ForeignKey('Trip', on_delete=models.CASCADE, related_name='expenses')

class Trip(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='trips')
    trip_name = models.CharField(max_length=200)
    start_date = models.DateTimeField(blank=True, null=True)
    end_date = models.DateTimeField(blank=True, null=True)
    budget = models.FloatField(blank=True, null=True, validators=[MinValueValidator(0)])
    created = models.DateTimeField(default=timezone.now)
    
    class Meta:
        db_table = 'trips'
        ordering = ['-created']

    def __str__(self):
        return self.trip_name

