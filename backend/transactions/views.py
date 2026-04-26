from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.http import HttpResponse
from django.db.models import Sum
from django.utils import timezone
from datetime import datetime
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill
from django.utils import timezone
from django.db.models import Sum
import tempfile
import io
from accounts.models import User
from .models import Transaction
from .serializers import TransactionSerializer, TransactionCreateSerializer, TransactionListSerializer
from accounts.models import User
from utils.emails import send_summary_email

class TransactionListCreateView(generics.ListCreateAPIView):
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        qs = Transaction.objects.filter(user=self.request.user)
        # Optional date range filtering: ?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
        start = self.request.query_params.get('start_date')
        end = self.request.query_params.get('end_date')
        if start:
            try:
                s = datetime.strptime(start, '%Y-%m-%d')
                qs = qs.filter(created_at__gte=s)
            except Exception:
                pass
        if end:
            try:
                e = datetime.strptime(end, '%Y-%m-%d')
                qs = qs.filter(created_at__lte=e)
            except Exception:
                pass
        return qs.order_by('-created_at')
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return TransactionCreateSerializer
        return TransactionSerializer
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class TransactionDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Transaction.objects.filter(user=self.request.user)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def transaction_summary(request):
    """
    Returns summary for the authenticated user:
    - today income/expense
    - monthly income/expense
    - savings (today)
    - recent today entries
    """
    user = request.user

    today = timezone.now().date()
    
    # TODAY data
    today_txs = Transaction.objects.filter(
        user=user, 
        created_at__date=today
    ) if user else Transaction.objects.none()
    today_income = today_txs.filter(type='income').aggregate(Sum('amount'))['amount__sum'] or 0
    today_expense = today_txs.filter(type='expense').aggregate(Sum('amount'))['amount__sum'] or 0
    today_entries = TransactionListSerializer(today_txs[:10], many=True).data  # Limit 10
    
    # MONTH data  
    month_start = timezone.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    month_txs = Transaction.objects.filter(
        user=user, 
        created_at__gte=month_start
    ) if user else Transaction.objects.none()
    month_income = month_txs.filter(type='income').aggregate(Sum('amount'))['amount__sum'] or 0
    month_expense = month_txs.filter(type='expense').aggregate(Sum('amount'))['amount__sum'] or 0
    
    savings = (today_income - today_expense)  # or month?
    
    return Response({
        'today': {
            'income': float(today_income),
            'expense': float(today_expense)
        },
        'month': {
            'income': float(month_income),
            'expense': float(month_expense)
        },
        'savings': float(savings),
        'today_entries': today_entries
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def download_excel(request):
    monthly = request.query_params.get('monthly', 'false').lower() == 'true'
    user = request.user
    
    # Get transactions (same logic as summary)
    today = timezone.now().date()
    if monthly:
        month_start = timezone.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        txs = Transaction.objects.filter(user=user, created_at__gte=month_start)
    else:
        txs = Transaction.objects.filter(user=user, created_at__date=today)
    
    wb = Workbook()
    ws = wb.active
    
    if monthly:
        title = f'Monthly Summary - {timezone.now().strftime("%B %Y")}'
    else:
        title = 'Daily Summary'
    
    ws.append([title])
    ws.append([])
    
    income = txs.filter(type='income').aggregate(Sum('amount'))['amount__sum'] or 0
    expense = txs.filter(type='expense').aggregate(Sum('amount'))['amount__sum'] or 0
    
    ws.append(['Income', income])
    ws.append(['Expense', expense])
    ws.append(['Net', income - expense])
    ws.append([])
    ws.append(['Date', 'Type', 'Amount', 'Description'])
    
    for tx in txs.order_by('-created_at'):
        ws.append([
            tx.created_at.strftime('%Y-%m-%d %H:%M'),
            tx.type.title(),
            tx.amount,
            tx.description or ''
        ])
    
    # Style header
    for col in ws.columns:
        max_length = 0
        column = col[0].column_letter
        for cell in col:
            try:
                if len(str(cell.value)) > max_length:
                    max_length = len(str(cell.value))
            except:
                pass
        adjusted_width = min(max_length + 2, 50)
        ws.column_dimensions[column].width = adjusted_width
    
    filename = 'monthly-summary.xlsx' if monthly else 'daily-summary.xlsx'
    
    # Save to BytesIO buffer
    output = io.BytesIO()
    wb.save(output)
    output.seek(0)

    response = HttpResponse(
        output.getvalue(),
        content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
    response['Content-Disposition'] = f'attachment; filename={filename}'
    return response

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_summary_email_view(request):
    """Trigger sending a summary email (daily or monthly) to the authenticated user."""
    monthly = request.query_params.get('monthly', 'false').lower() == 'true'
    try:
        send_summary_email(request.user, monthly=monthly)
        return Response({'ok': True, 'message': 'Email sent successfully.'})
    except Exception as e:
        return Response({'ok': False, 'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

