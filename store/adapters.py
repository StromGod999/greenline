import logging
import random

from allauth.account.adapter import DefaultAccountAdapter
from django.contrib import messages
from django.shortcuts import redirect

from .models import LoginOTP
from .utils import send_login_otp_email

logger = logging.getLogger(__name__)


class TwoFactorAccountAdapter(DefaultAccountAdapter):
    """
    Intercepts a completed username/password login for users who have
    email-based two-factor authentication enabled, sending a one-time
    code (via Resend) and redirecting to the verification page instead
    of finishing the session.
    """

    def send_mail(self, template_prefix, email, context):
        """
        Wrap allauth's outgoing mail (signup/login confirmation, password
        reset, etc.) so a provider-side delivery failure (e.g. Resend
        rejecting an unverified/test recipient domain) degrades to a
        user-facing message instead of a 500 error.
        """
        try:
            super().send_mail(template_prefix, email, context)
        except Exception:
            logger.exception("Failed to send account email (%s) to %s", template_prefix, email)
            request = context.get('request')
            if request is not None:
                messages.warning(
                    request,
                    "We couldn't send an email to that address right now. "
                    "Please try again later or contact support."
                )

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
