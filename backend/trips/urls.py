from django.urls import path
from . import views

urlpatterns = [
    path('', views.TripListCreateView.as_view(), name='trip-list-create'),
    path('<int:pk>/', views.TripDetailView.as_view(), name='trip-detail'),
    path('<int:pk>/participant/', views.add_participant, name='add-participant'),
    path('<int:pk>/participant/<int:participant_id>/', views.delete_participant, name='delete-participant'),
    path('<int:pk>/expense/', views.add_expense, name='add-expense'),
    path('<int:pk>/expense/<int:expense_id>/', views.update_expense, name='update-expense'),
    path('<int:pk>/expense/<int:expense_id>/delete/', views.delete_expense, name='delete-expense'),
    path('<int:pk>/settlement/', views.trip_settlement, name='trip-settlement'),
    path('<int:pk>/export/', views.trip_export, name='trip-export'),
    path('<int:pk>/email-report/', views.trip_email_report, name='trip-email-report'),
]

