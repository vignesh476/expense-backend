from django.contrib import admin
from django.urls import path, include
from .views import api_root

urlpatterns = [
    path('', api_root, name='api-root'),
    path('admin/', admin.site.urls),
    path('api/transactions/', include('transactions.urls')),
    path('api/trips/', include('trips.urls')),
    path('api/auth/', include('accounts.urls')),
]

