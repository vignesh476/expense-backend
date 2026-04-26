from django.db import models
from django.utils import timezone
from accounts.models import User

class Transaction(models.Model):
    amount = models.FloatField()
    type = models.CharField(max_length=20)  # 'income', 'expense'
    description = models.TextField(blank=True, default='')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='transactions')
    created_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        db_table = 'transactions'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.type}: {self.amount}"

