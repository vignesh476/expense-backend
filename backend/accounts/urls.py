from django.urls import path
from . import views

urlpatterns = [
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/', views.LoginView.as_view(), name='login'),
    path('guest-login/', views.GuestLoginView.as_view(), name='guest_login'),
    path('refresh/', views.RefreshTokenView.as_view(), name='refresh'),
    path('forgot-password/', views.ForgotPasswordView.as_view(), name='forgot_password'),
    path('reset-password/', views.ResetPasswordView.as_view(), name='reset_password'),
    path('profile/', views.UserProfileView.as_view(), name='profile'),
    path('avatar/', views.UserAvatarView.as_view(), name='avatar'),
    path('logout/', views.LogoutView.as_view(), name='logout'),
]

