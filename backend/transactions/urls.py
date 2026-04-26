from django.urls import path
from . import views

urlpatterns = [
    path('', views.TransactionListCreateView.as_view(), name='transaction-list-create'),
    path('<int:pk>/', views.TransactionDetailView.as_view(), name='transaction-detail'),
    path('summary/', views.transaction_summary, name='transaction-summary'),
    path('download-excel/', views.download_excel, name='download-excel'),
    path('send-summary-email/', views.send_summary_email_view, name='send-summary-email'),
]

