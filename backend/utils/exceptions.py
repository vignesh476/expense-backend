from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
from django.core.exceptions import ObjectDoesNotExist
from django.db import DatabaseError

def custom_exception_handler(exc, context):
    # Call default handler first
    response = exception_handler(exc, context)
    
    if response is not None:
        # DRF already handled → customize
        if response.status_code >= 500:
            response.data = {'error': 'Internal server error. Please try again later.'}
        elif response.status_code == 404:
            response.data = {'error': 'Endpoint or resource not found.'}
        elif response.status_code == 400:
            response.data = {'error': 'Bad request - check your data.'}
        elif response.status_code == 401:
            response.data = {'error': 'Authentication required or invalid token.'}
        elif response.status_code == 403:
            response.data = {'error': 'Permission denied.'}
        return response
    
    # Unhandled exception
    if isinstance(exc, ObjectDoesNotExist):
        return Response({'error': 'Resource not found.'}, status=status.HTTP_404_NOT_FOUND)
    elif isinstance(exc, DatabaseError):
        return Response({'error': 'Database error. Please try again.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
    
    # Generic 500
    return Response({
        'error': 'An unexpected error occurred. Please try again or contact support.'
    }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
