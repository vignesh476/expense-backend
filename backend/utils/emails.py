from django.core.mail import EmailMultiAlternatives
from django.conf import settings
from django.utils import timezone
from django.db.models import Sum
from openpyxl import Workbook
import tempfile
import os
from transactions.models import Transaction
from accounts.models import User

def send_summary_email(user, monthly=False):
    """Send expense summary email with Excel attachment"""
    today = timezone.now().date()
    if monthly:
        month_start = timezone.now().replace(day=1)
        txs = Transaction.objects.filter(user=user, created_at__gte=month_start)
        subject = f'Your Monthly Expense Summary - {timezone.now().strftime("%B %Y")}'
    else:
        txs = Transaction.objects.filter(user=user, created_at__date=today)
        subject = 'Your Daily Expense Summary'
    
    # Create Excel
    wb = Workbook()
    ws = wb.active
    ws.append([subject])
    ws.append([])
    
    income = txs.filter(type='income').aggregate(Sum('amount'))['amount__sum'] or 0
    expense = txs.filter(type='expense').aggregate(Sum('amount'))['amount__sum'] or 0
    
    ws.append(['Income', income])
    ws.append(['Expense', expense])
    ws.append(['Net', income - expense])
    
    # Save temp file
    with tempfile.NamedTemporaryFile(suffix='.xlsx', delete=False) as tmp:
        wb.save(tmp.name)
        filename = tmp.name
    
    try:
        email = EmailMultiAlternatives(
            subject,
            f'Please find your { "monthly" if monthly else "daily" } summary attached.',
            settings.DEFAULT_FROM_EMAIL,
            [user.email]
        )
        email.attach_file(filename, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        email.send()
        return True
    finally:
        os.unlink(filename)

