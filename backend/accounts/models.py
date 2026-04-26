from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.utils import timezone
from django.core.mail import send_mail
from django.utils.translation import gettext_lazy as _
import jwt
from datetime import timedelta
from django.conf import settings

class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError(_('The Email field must be set'))
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra_fields)

class User(AbstractBaseUser, PermissionsMixin, models.Model):
    email = models.EmailField(_('email address'), unique=True)
    is_guest = models.BooleanField(default=False)
    nickname = models.CharField(max_length=32, blank=True, null=True)
    created = models.DateTimeField(default=timezone.now)
    guest_expires_at = models.DateTimeField(blank=True, null=True)
    
    objects = UserManager()
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []
    
    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'users'

    def __str__(self):
        return self.email or self.nickname or 'Guest'
    
    def create_jwt_token(self, refresh=False):
        payload = {
            'user_id': str(self.pk),
            'email': self.email,
            'is_guest': self.is_guest,
            'exp': timezone.now() + timedelta(minutes=15 if not refresh else 7*24*60)
        }
        return jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')

class BlacklistedToken(models.Model):
    token = models.CharField(max_length=500, unique=True)
    blacklisted_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'blacklisted_tokens'

