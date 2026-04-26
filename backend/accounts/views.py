from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
import jwt
import uuid
from .models import User
from .serializers import (
    RegisterSerializer, LoginSerializer, 
    GuestLoginSerializer, ResetPasswordSerializer
)

class RegisterView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            refresh = RefreshToken.for_user(user)
            return Response({
                'access': str(refresh.access_token),
                'refresh': str(refresh),
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LoginView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            user = serializer.validated_data['user']
            refresh = RefreshToken.for_user(user)
            return Response({
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': {
                    'id': user.pk,
                    'email': user.email,
                    'nickname': user.nickname,
                    'is_guest': user.is_guest,
                }
            })
        return Response(serializer.errors, status=status.HTTP_401_UNAUTHORIZED)

class GuestLoginView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = GuestLoginSerializer(data=request.data)
        if serializer.is_valid():
            raw_nickname = serializer.validated_data.get('nickname')
            base = (raw_nickname or 'Guest').strip() or 'Guest'

            # Generate a unique nickname (case-insensitive). If the requested nickname
            # is already taken, append a counter suffix until unique.
            candidate = base
            counter = 0
            while User.objects.filter(is_guest=True, nickname__iexact=candidate).exists():
                counter += 1
                candidate = f"{base}_{counter}"

            nickname = candidate

            email = f"guest_{nickname.lower().replace(' ', '_')}_{str(uuid.uuid4())[:8]}@demo.expense"
            user = User.objects.create(
                email=email,
                is_guest=True,
                nickname=nickname,
                guest_expires_at=timezone.now() + timedelta(days=1)
            )
            refresh = RefreshToken.for_user(user)
            # set refresh token expiry for guest sessions
            try:
                refresh.set_exp(lifetime=timedelta(days=1))
            except Exception:
                # older versions of SimpleJWT may not have set_exp; ignore if not available
                pass

            return Response({
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'guest': True,
                'user': {'id': user.pk, 'nickname': user.nickname}
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        email = request.data.get('email')
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'ok': True})  # Don't reveal if user exists
        
        token = jwt.encode({
            'user_id': user.pk,
            'exp': timezone.now() + timedelta(minutes=15)
        }, settings.SECRET_KEY, algorithm='HS256')
        
        reset_url = f"{settings.FRONTEND_URL}/reset-password?token={token}"
        
        send_mail(
            'Password Reset',
            f'Click to reset: {reset_url}',
            settings.DEFAULT_FROM_EMAIL,
            [email],
            html_message=f'<h3>Reset Password</h3><a href="{reset_url}">Reset</a>'
        )
        
        return Response({'ok': True})

class ResetPasswordView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        if serializer.is_valid():
            try:
                payload = jwt.decode(
                    serializer.validated_data['token'], 
                    settings.SECRET_KEY, 
                    algorithms=['HS256']
                )
                user = User.objects.get(pk=payload['user_id'])
                user.set_password(serializer.validated_data['password'])
                user.save()
                return Response({'ok': True})
            except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
                return Response({'error': 'Invalid/expired token'}, status=status.HTTP_400_BAD_REQUEST)
            except User.DoesNotExist:
                return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class RefreshTokenView(APIView):
    # Allow anyone to call refresh with a valid refresh token (access may be expired)
    permission_classes = [AllowAny]
    
    def post(self, request):
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return Response({'error': 'Refresh token required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            token = RefreshToken(refresh_token)
            new_access = str(token.access_token)
            return Response({'access': new_access})
        except Exception:
            return Response({'error': 'Invalid refresh token'}, status=status.HTTP_401_UNAUTHORIZED)

class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        return Response({
            'name': user.nickname or user.email,
            'email': user.email
        })

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        from .models import BlacklistedToken
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        if auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
            BlacklistedToken.objects.get_or_create(token=token)
        return Response({'ok': True})

class UserAvatarView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        return Response({'url': None})

