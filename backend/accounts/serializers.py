from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from django.utils import timezone
from datetime import timedelta

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    
    class Meta:
        model = User
        fields = ('email', 'password')
    
    def create(self, validated_data):
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password']
        )
        return user

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()

    def validate(self, data):
        from django.contrib.auth import authenticate
        user = authenticate(
            request=self.context.get('request'),
            username=data['email'],
            password=data['password']
        )
        if user:
            return {'user': user}
        raise serializers.ValidationError('Invalid credentials')

class GuestLoginSerializer(serializers.Serializer):
    nickname = serializers.CharField(max_length=32, min_length=2, required=False)

class ResetPasswordSerializer(serializers.Serializer):
    token = serializers.CharField()
    password = serializers.CharField(min_length=6)

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['is_guest'] = user.is_guest
        token['nickname'] = user.nickname
        return token

