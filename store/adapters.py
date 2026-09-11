import random

from allauth.account.adapter import DefaultAccountAdapter
from django.shortcuts import redirect

from .models import LoginOTP
from .utils import send_login_otp_email


class TwoFactorAccountAdapter(DefaultAccountAdapter):
    """
    Intercepts a completed username/password login for users who have
    email-based two-factor authentication enabled, sending a one-time
    code (via Resend) and redirecting to the verification page instead
    of finishing the session.
    """

    def pre_login(self, request, user, **kwargs):
        profile = getattr(user, 'profile', None)
        if profile and profile.two_factor_enabled:
            code = f"{random.randint(0, 999999):06d}"
            LoginOTP.objects.filter(user=user, is_used=False).update(is_used=True)
            LoginOTP.objects.create(user=user, code=code)
            send_login_otp_email(user, code)

            request.session['pending_2fa_user_id'] = user.pk
            request.session['pending_2fa_redirect'] = kwargs.get('redirect_url') or ''
            return redirect('store:verify_2fa')

        return super().pre_login(request, user, **kwargs)
