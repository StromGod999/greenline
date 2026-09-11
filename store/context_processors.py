from django.conf import settings
from .models import Category, Brand, Cart

def store_context(request):
    """
    Context processor providing global variables to all templates.
    """
    categories = Category.objects.all()
    brands = Brand.objects.filter(is_featured=True)[:8]

    # Cart item count
    cart_count = 0
    cart_subtotal = 0
    cart = None

    if request.user.is_authenticated:
        cart = Cart.objects.filter(user=request.user).first()
    else:
        session_key = request.session.session_key
        if session_key:
            cart = Cart.objects.filter(session_key=session_key).first()

    if cart:
        cart_count = cart.get_item_count()
        cart_subtotal = cart.get_subtotal()

    return {
        'nav_categories': categories,
        'nav_brands': brands,
        'cart_count': cart_count,
        'cart_subtotal': cart_subtotal,
        'CURRENCY_SYMBOL': getattr(settings, 'CURRENCY_SYMBOL', '$'),
        'STORE_NAME': getattr(settings, 'STORE_NAME', 'GreenPulse Mobile Store'),
        'STORE_PHONE': getattr(settings, 'STORE_PHONE', '+1 (800) 555-MOBI'),
        'STORE_EMAIL': getattr(settings, 'STORE_EMAIL', 'support@greenpulsemobiles.com'),
        'RAZORPAY_KEY_ID': getattr(settings, 'RAZORPAY_KEY_ID', 'rzp_test_GreenMobileStoreKey'),
    }
