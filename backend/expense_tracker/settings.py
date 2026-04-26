import os
from pathlib import Path
from datetime import timedelta

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.getenv('DJANGO_SECRET_KEY', 'django-insecure-change_me_during_production')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.getenv('DEBUG', 'True').lower() == 'true'

ALLOWED_HOSTS = ['localhost', '127.0.0.1', '*']

# Render and other platform hosts (add your specific Render URL here after deployment)
# Example: 'bhavanis-expense-backend.onrender.com'

# Application definition
DJANGO_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
]

THIRD_PARTY_APPS = [
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    # Clean Django-only - no Mongo remnants
]

LOCAL_APPS = [
    'accounts',
    'transactions',
    'trips',
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'expense_tracker.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'expense_tracker.wsgi.application'

# SQLite Database - moved outside OneDrive to avoid I/O errors
DB_DIR = Path(os.environ.get('LOCALAPPDATA', os.path.expanduser('~'))) / 'expense-backend-data'
DB_DIR.mkdir(parents=True, exist_ok=True)
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': DB_DIR / 'db.sqlite3',
    }
}

# DRF Configuration
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [],
    'EXCEPTION_HANDLER': 'utils.exceptions.custom_exception_handler',
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
}

# JWT Configuration  
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=15),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'GUEST_TOKEN_LIFETIME': timedelta(minutes=60),
}

# CORS
FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:3000')

CORS_ALLOWED_ORIGINS = [
    FRONTEND_URL,
    'http://127.0.0.1:3000',
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:4173',
    'http://0.0.0.0:3000',
    'https://bhavanis-expense-app.vercel.app',
    'https://expense-gamma-six.vercel.app',
    'https://marvelous-pastelito-f03022.netlify.app',
]

# Allow any local network IP for mobile testing (e.g., http://192.168.x.x:3000)
# Also allow Render deployments automatically
CORS_ALLOWED_ORIGIN_REGEXES = [
    r'^http://192\.168\.\d{1,3}\.\d{1,3}(:\d+)?$',
    r'^http://10\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?$',
    r'^https://.*\.onrender\.com$',
]

CORS_ALLOW_CREDENTIALS = True

# In development, allow all origins to eliminate CORS friction
if DEBUG:
    CORS_ALLOW_ALL_ORIGINS = True

# Email Configuration
# For local development use console backend so reset emails are printed to the server console.
# In production configure SMTP credentials via environment variables.
if os.getenv('DJANGO_ENV', 'development') == 'production':
    EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
    EMAIL_HOST = os.getenv('BREVO_SMTP_HOST', 'smtp-relay.brevo.com')
    EMAIL_PORT = int(os.getenv('BREVO_SMTP_PORT', 587))
    EMAIL_USE_TLS = True
    EMAIL_HOST_USER = os.getenv('BREVO_SMTP_USER')
    EMAIL_HOST_PASSWORD = os.getenv('BREVO_SMTP_PASS')
else:
    EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

DEFAULT_FROM_EMAIL = os.getenv('EMAIL_FROM', 'no-reply@example.com')

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Custom User Model (will configure after accounts app)
AUTH_USER_MODEL = 'accounts.User'

# Logging
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
        },
    },
}

APPEND_SLASH = False
