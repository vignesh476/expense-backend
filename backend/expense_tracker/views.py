from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

@api_view(['GET'])
def api_root(request):
    '''API Root endpoint - returns available API endpoints.'''
    data = {
        'message': 'Welcome to Expense Tracker API v1.0',
        'version': '1.0',
        'endpoints': {
            'Authentication': {
                'POST /api/auth/login/': 'User login',
                'POST /api/auth/register/': 'User registration',
                'POST /api/auth/guest-login/': 'Guest access',
                'POST /api/auth/refresh/': 'Refresh JWT token',
                'POST /api/auth/logout/': 'Logout',
                'POST /api/auth/forgot-password/': 'Forgot password',
                'POST /api/auth/reset-password/': 'Reset password',
            },
            'Transactions': {
                'GET/POST /api/transactions/': 'List/create transactions (auth required)',
                'GET /api/transactions/summary/': 'Monthly/daily summary (auth)',
                'GET /api/transactions/download-excel/?monthly=true': 'Excel export',
            },
            'Trips': {
                'GET/POST /trips/': 'Trip list/create (auth)',
                'GET/PUT/DELETE /trips/<pk>/': 'Trip detail',
                'POST /trips/<pk>/participant/': 'Add participant',
                'POST /trips/<pk>/expense/': 'Add expense to trip',
            },
            'Admin': '/admin/ (Django admin)',
        },
        'docs': 'See Django REST Framework browsable API for interactive docs.',
        'debug': request.user.is_authenticated if request.user else False,
    }
    return Response(data, status=status.HTTP_200_OK)

