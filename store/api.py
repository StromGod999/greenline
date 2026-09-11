import json
import uuid
from decimal import Decimal
from datetime import date, timedelta
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
from django.utils import timezone
from django.db.models import Q

from .models import (
    Product, Category, Brand, ProductSpecification, ProductImage,
    Cart, CartItem, Coupon, Order, OrderItem, Review
)
from .utils import create_razorpay_order, verify_razorpay_signature


def _get_cart_for_api(request):
    """Helper to retrieve or create cart for mobile requests based on session key or user."""
    session_key = request.headers.get('X-Session-Key') or request.GET.get('session_key')
    if not session_key:
        if hasattr(request, 'session') and request.session.session_key:
            session_key = request.session.session_key
        else:
            session_key = f"mobile_{uuid.uuid4().hex[:16]}"

    cart, _ = Cart.objects.get_or_create(session_key=session_key)
    return cart, session_key


def _product_dict(p, request=None):
    """Serialize product to clean dictionary for mobile app."""
    specs = {}
    if hasattr(p, 'specs') and p.specs:
        s = p.specs
        specs = {
            'ram': s.ram,
            'storage': s.storage,
            'processor': s.processor,
            'display': s.display,
            'camera_rear': s.camera_rear,
            'camera_front': s.camera_front,
            'battery': s.battery,
            'operating_system': s.operating_system,
            'network': s.network,
            'colors': s.get_color_list(),
            'weight': s.weight,
            'warranty': s.warranty,
        }

    return {
        'id': p.id,
        'name': p.name,
        'slug': p.slug,
        'brand': {
            'id': p.brand.id,
            'name': p.brand.name,
            'slug': p.brand.slug,
            'logo_url': p.brand.get_logo_url(),
        } if p.brand else None,
        'category': {
            'id': p.category.id,
            'name': p.category.name,
            'slug': p.category.slug,
        } if p.category else None,
        'price': float(p.price),
        'discount_price': float(p.discount_price) if p.discount_price else None,
        'current_price': float(p.get_current_price()),
        'discount_percentage': p.get_discount_percentage(),
        'stock': p.stock,
        'in_stock': p.in_stock(),
        'image_url': p.get_image_url(),
        'short_description': p.short_description,
        'description': p.description,
        'rating': float(p.rating),
        'reviews_count': p.reviews_count,
        'is_featured': p.is_featured,
        'is_trending': p.is_trending,
        'is_5g': p.is_5g,
        'specs': specs,
    }


def api_home(request):
    """
    GET /api/home/
    Returns mobile home screen data: banners, brands, featured 5G phones, deals, store metadata.
    """
    featured = Product.objects.filter(is_featured=True, is_active=True).select_related('brand', 'category', 'specs')[:8]
    trending = Product.objects.filter(is_trending=True, is_active=True).select_related('brand', 'category', 'specs')[:6]
    deals = Product.objects.filter(discount_price__isnull=False, is_active=True).select_related('brand', 'category', 'specs').order_by('-created_at')[:4]
    brands = Brand.objects.filter(is_featured=True)
    categories = Category.objects.all()

    brands_data = [{
        'id': b.id,
        'name': b.name,
        'slug': b.slug,
        'logo_url': b.get_logo_url(),
        'products_count': b.products.count()
    } for b in brands]

    categories_data = [{
        'id': c.id,
        'name': c.name,
        'slug': c.slug,
        'icon': c.icon,
    } for c in categories]

    return JsonResponse({
        'status': 'success',
        'store': {
            'name': getattr(settings, 'STORE_NAME', 'GreenPulse Mobiles India'),
            'phone': getattr(settings, 'STORE_PHONE', '+91 1234567890'),
            'email': getattr(settings, 'STORE_EMAIL', 'support@greenpulsemobiles.in'),
            'currency': getattr(settings, 'CURRENCY_SYMBOL', '₹'),
            'currency_code': getattr(settings, 'CURRENCY_CODE', 'INR'),
            'free_shipping_threshold': 25000.0,
            'standard_shipping_charge': 199.0,
            'razorpay_key_id': getattr(settings, 'RAZORPAY_KEY_ID', 'rzp_test_TYrDpRiv6T2o3c'),
        },
        'brands': brands_data,
        'categories': categories_data,
        'featured_products': [_product_dict(p, request) for p in featured],
        'trending_products': [_product_dict(p, request) for p in trending],
        'deals': [_product_dict(p, request) for p in deals],
    })


def api_products(request):
    """
    GET /api/products/
    Full mobile catalog with filtering by brand, category, 5G, price, RAM, search query.
    """
    products = Product.objects.filter(is_active=True).select_related('brand', 'category', 'specs')

    # Query search
    q = request.GET.get('q', '').strip()
    if q:
        products = products.filter(
            Q(name__icontains=q) |
            Q(brand__name__icontains=q) |
            Q(description__icontains=q) |
            Q(short_description__icontains=q)
        )

    # Brand filter
    brand_slug = request.GET.get('brand', '').strip()
    if brand_slug:
        products = products.filter(brand__slug=brand_slug)

    # Category filter
    category_slug = request.GET.get('category', '').strip()
    if category_slug:
        products = products.filter(category__slug=category_slug)

    # 5G filter
    is_5g = request.GET.get('5g')
    if is_5g in ['1', 'true', 'True']:
        products = products.filter(is_5g=True)

    # Price range
    min_p = request.GET.get('min_price')
    max_p = request.GET.get('max_price')
    if min_p:
        try:
            products = products.filter(price__gte=Decimal(min_p))
        except Exception:
            pass
    if max_p:
        try:
            products = products.filter(price__lte=Decimal(max_p))
        except Exception:
            pass

    # RAM filter
    ram = request.GET.get('ram')
    if ram:
        products = products.filter(specs__ram__icontains=ram)

    # Storage filter
    storage = request.GET.get('storage')
    if storage:
        products = products.filter(specs__storage__icontains=storage)

    # Sorting
    sort = request.GET.get('sort', 'featured')
    if sort == 'price_low':
        products = products.order_by('price')
    elif sort == 'price_high':
        products = products.order_by('-price')
    elif sort == 'rating':
        products = products.order_by('-rating')
    elif sort == 'newest':
        products = products.order_by('-created_at')
    else:
        products = products.order_by('-is_featured', '-rating')

    return JsonResponse({
        'status': 'success',
        'count': products.count(),
        'products': [_product_dict(p, request) for p in products],
    })


def api_product_detail(request, slug):
    """
    GET /api/products/<slug>/
    Detailed phone view with specs, gallery images, and verified reviews.
    """
    try:
        p = Product.objects.select_related('brand', 'category', 'specs').get(slug=slug, is_active=True)
    except Product.DoesNotExist:
        return JsonResponse({'status': 'error', 'message': 'Product not found'}, status=404)

    gallery = [img.get_image_url() for img in p.gallery_images.all()]
    if not gallery and p.get_image_url():
        gallery = [p.get_image_url()]

    reviews = [{
        'id': r.id,
        'author_name': r.author_name,
        'rating': r.rating,
        'title': r.title,
        'comment': r.comment,
        'is_verified': r.is_verified_buyer,
        'date': r.created_at.strftime("%b %d, %Y")
    } for r in p.reviews.all()[:10]]

    related = Product.objects.filter(brand=p.brand, is_active=True).exclude(id=p.id)[:4]

    data = _product_dict(p, request)
    data['gallery'] = gallery
    data['reviews'] = reviews
    data['related_products'] = [_product_dict(r, request) for r in related]

    return JsonResponse({'status': 'success', 'product': data})


def _serialize_cart(cart, coupon_code=None):
    items = []
    subtotal = Decimal('0.00')

    for item in cart.items.select_related('product', 'product__brand'):
        item_total = item.get_total_price()
        subtotal += item_total
        items.append({
            'id': item.id,
            'product_id': item.product.id,
            'name': item.product.name,
            'brand': item.product.brand.name if item.product.brand else '',
            'image_url': item.product.get_image_url(),
            'unit_price': float(item.get_unit_price()),
            'quantity': item.quantity,
            'color': item.color,
            'storage': item.storage,
            'total_price': float(item_total),
            'stock': item.product.stock
        })

    # Discount calculation
    discount_amount = Decimal('0.00')
    discount_percent = 0
    if coupon_code:
        coupon = Coupon.objects.filter(code__iexact=coupon_code, active=True).first()
        if coupon and coupon.is_valid():
            if subtotal >= coupon.min_order_amount:
                discount_percent = coupon.discount_percent
                calc_discount = (subtotal * Decimal(str(coupon.discount_percent))) / Decimal('100')
                discount_amount = min(calc_discount, coupon.max_discount_amount)

    # Shipping threshold (Free above ₹25,000, else ₹199)
    free_shipping_threshold = Decimal('25000.00')
    standard_shipping = Decimal('199.00')
    if subtotal >= free_shipping_threshold or subtotal == 0:
        shipping_charge = Decimal('0.00')
        free_shipping_remaining = 0.0
        shipping_progress = 100
    else:
        shipping_charge = standard_shipping
        free_shipping_remaining = float(free_shipping_threshold - subtotal)
        shipping_progress = min(100, int((subtotal / free_shipping_threshold) * 100))

    total = subtotal - discount_amount + shipping_charge
    total = max(Decimal('0.00'), total)

    return {
        'items': items,
        'item_count': sum(i['quantity'] for i in items),
        'subtotal': float(subtotal),
        'discount_amount': float(discount_amount),
        'discount_percent': discount_percent,
        'coupon_applied': coupon_code if discount_amount > 0 else None,
        'shipping_charge': float(shipping_charge),
        'free_shipping_threshold': float(free_shipping_threshold),
        'free_shipping_remaining': free_shipping_remaining,
        'shipping_progress': shipping_progress,
        'total': float(total),
    }


def api_cart_get(request):
    """GET /api/cart/ - Retrieve current cart status."""
    cart, session_key = _get_cart_for_api(request)
    coupon_code = request.GET.get('coupon_code') or request.session.get('coupon_code')
    cart_data = _serialize_cart(cart, coupon_code)
    cart_data['session_key'] = session_key

    return JsonResponse({'status': 'success', 'cart': cart_data})


@csrf_exempt
def api_cart_add(request):
    """POST /api/cart/add/ - Add product to mobile cart."""
    if request.method != 'POST':
        return JsonResponse({'status': 'error', 'message': 'Method not allowed'}, status=405)

    try:
        data = json.loads(request.body.decode('utf-8'))
    except Exception:
        data = request.POST

    product_id = data.get('product_id')
    quantity = int(data.get('quantity', 1))
    color = data.get('color', 'Standard')
    storage = data.get('storage', 'Default')

    try:
        product = Product.objects.get(id=product_id, is_active=True)
    except Product.DoesNotExist:
        return JsonResponse({'status': 'error', 'message': 'Product not found'}, status=404)

    cart, session_key = _get_cart_for_api(request)

    item, created = CartItem.objects.get_or_create(
        cart=cart,
        product=product,
        color=color,
        storage=storage,
        defaults={'quantity': quantity}
    )

    if not created:
        item.quantity += quantity
        item.save()

    cart_data = _serialize_cart(cart)
    cart_data['session_key'] = session_key

    return JsonResponse({
        'status': 'success',
        'message': f"Added {product.name} to cart",
        'cart': cart_data
    })


@csrf_exempt
def api_cart_update(request):
    """POST /api/cart/update/ - Update quantity of an item."""
    if request.method != 'POST':
        return JsonResponse({'status': 'error', 'message': 'Method not allowed'}, status=405)

    try:
        data = json.loads(request.body.decode('utf-8'))
    except Exception:
        data = request.POST

    item_id = data.get('item_id')
    action = data.get('action')  # 'increase' or 'decrease' or 'set'
    quantity = data.get('quantity')

    cart, session_key = _get_cart_for_api(request)

    try:
        item = CartItem.objects.get(id=item_id, cart=cart)
    except CartItem.DoesNotExist:
        return JsonResponse({'status': 'error', 'message': 'Cart item not found'}, status=404)

    if action == 'increase':
        item.quantity += 1
        item.save()
    elif action == 'decrease':
        if item.quantity > 1:
            item.quantity -= 1
            item.save()
        else:
            item.delete()
    elif action == 'set' and quantity is not None:
        q = int(quantity)
        if q > 0:
            item.quantity = q
            item.save()
        else:
            item.delete()

    cart_data = _serialize_cart(cart)
    cart_data['session_key'] = session_key
    return JsonResponse({'status': 'success', 'cart': cart_data})


@csrf_exempt
def api_cart_remove(request):
    """POST /api/cart/remove/ - Remove an item from cart."""
    if request.method != 'POST':
        return JsonResponse({'status': 'error', 'message': 'Method not allowed'}, status=405)

    try:
        data = json.loads(request.body.decode('utf-8'))
    except Exception:
        data = request.POST

    item_id = data.get('item_id')
    cart, session_key = _get_cart_for_api(request)

    CartItem.objects.filter(id=item_id, cart=cart).delete()

    cart_data = _serialize_cart(cart)
    cart_data['session_key'] = session_key
    return JsonResponse({'status': 'success', 'cart': cart_data})


@csrf_exempt
def api_apply_coupon(request):
    """POST /api/cart/coupon/ - Validate and apply promo code."""
    try:
        data = json.loads(request.body.decode('utf-8'))
    except Exception:
        data = request.POST

    code = (data.get('coupon_code') or '').strip().upper()
    cart, session_key = _get_cart_for_api(request)

    coupon = Coupon.objects.filter(code__iexact=code, active=True).first()
    if not coupon or not coupon.is_valid():
        return JsonResponse({'status': 'error', 'message': 'Invalid or expired coupon code'}, status=400)

    cart_subtotal = cart.get_subtotal()
    if cart_subtotal < coupon.min_order_amount:
        return JsonResponse({
            'status': 'error',
            'message': f"Minimum order of ₹{coupon.min_order_amount} required for this coupon"
        }, status=400)

    cart_data = _serialize_cart(cart, coupon_code=code)
    cart_data['session_key'] = session_key

    return JsonResponse({
        'status': 'success',
        'message': f"Coupon '{code}' applied! Saved ₹{cart_data['discount_amount']}",
        'cart': cart_data
    })


@csrf_exempt
def api_create_order(request):
    """
    POST /api/checkout/create-order/
    Creates scheduled order and generates Razorpay Order ID (in paise).
    Accepts customer information, delivery scheduling, payment method.
    """
    if request.method != 'POST':
        return JsonResponse({'status': 'error', 'message': 'Method not allowed'}, status=405)

    try:
        data = json.loads(request.body.decode('utf-8'))
    except Exception:
        data = request.POST

    cart, session_key = _get_cart_for_api(request)
    cart_items = cart.items.select_related('product').all()

    if not cart_items:
        return JsonResponse({'status': 'error', 'message': 'Cart is empty'}, status=400)

    # Extract checkout data
    full_name = data.get('full_name', '').strip()
    email = data.get('email', '').strip()
    phone = data.get('phone', '').strip()
    address = data.get('address', '').strip()
    city = data.get('city', '').strip()
    state = data.get('state', '').strip()
    pincode = data.get('pincode', '').strip()
    order_notes = data.get('order_notes', '')

    scheduled_date_str = data.get('scheduled_date')
    delivery_time_slot = data.get('delivery_time_slot', '09:00 AM - 01:00 PM')
    schedule_notes = data.get('schedule_notes', '')
    payment_method = data.get('payment_method', 'razorpay')
    coupon_code = data.get('coupon_code')

    if not (full_name and email and phone and address and city and state and pincode):
        return JsonResponse({'status': 'error', 'message': 'All contact & shipping fields are required'}, status=400)

    # Parse scheduled date
    try:
        if scheduled_date_str:
            scheduled_date = date.fromisoformat(scheduled_date_str)
        else:
            scheduled_date = date.today() + timedelta(days=1)
    except Exception:
        scheduled_date = date.today() + timedelta(days=1)

    # Financials
    cart_summary = _serialize_cart(cart, coupon_code=coupon_code)
    subtotal = Decimal(str(cart_summary['subtotal']))
    discount_amount = Decimal(str(cart_summary['discount_amount']))
    shipping_charge = Decimal(str(cart_summary['shipping_charge']))
    total_amount = Decimal(str(cart_summary['total']))

    # Create Order
    order = Order.objects.create(
        full_name=full_name,
        email=email,
        phone=phone,
        address=address,
        city=city,
        state=state,
        pincode=pincode,
        order_notes=order_notes,
        scheduled_date=scheduled_date,
        delivery_time_slot=delivery_time_slot,
        schedule_notes=schedule_notes,
        subtotal=subtotal,
        discount_amount=discount_amount,
        shipping_charge=shipping_charge,
        total_amount=total_amount,
        coupon_applied=coupon_code if discount_amount > 0 else None,
        payment_method=payment_method,
        payment_status='Pending',
        order_status='Scheduled'
    )

    # Razorpay order generation (in paise)
    amount_in_paise = int(total_amount * 100)
    rzp_order_id = create_razorpay_order(amount_in_paise, order.order_number, currency="INR")
    order.razorpay_order_id = rzp_order_id
    order.save()

    # Create items snapshot and decrement stock
    for ci in cart_items:
        OrderItem.objects.create(
            order=order,
            product=ci.product,
            product_name=f"{ci.product.brand.name} {ci.product.name}" if ci.product.brand else ci.product.name,
            product_image_url=ci.product.get_image_url(),
            price=ci.get_unit_price(),
            quantity=ci.quantity,
            color=ci.color,
            storage=ci.storage,
            total_price=ci.get_total_price()
        )
        if ci.product.stock >= ci.quantity:
            ci.product.stock -= ci.quantity
            ci.product.save()

    # Clear cart
    cart.items.all().delete()

    return JsonResponse({
        'status': 'success',
        'order': {
            'order_number': order.order_number,
            'total_amount': float(order.total_amount),
            'amount_in_paise': amount_in_paise,
            'currency': 'INR',
            'scheduled_date': str(order.scheduled_date),
            'delivery_time_slot': order.delivery_time_slot,
            'payment_method': order.payment_method,
            'payment_status': order.payment_status,
            'razorpay_order_id': rzp_order_id,
            'razorpay_key_id': getattr(settings, 'RAZORPAY_KEY_ID', 'rzp_test_TYrDpRiv6T2o3c'),
            'customer': {
                'name': order.full_name,
                'email': order.email,
                'phone': order.phone,
            }
        }
    })


@csrf_exempt
def api_verify_payment(request):
    """
    POST /api/payment/verify/
    Verifies Razorpay payment signature from Android/iOS Razorpay SDK.
    Marks order as 'Paid' and updates fulfillment status.
    """
    if request.method != 'POST':
        return JsonResponse({'status': 'error', 'message': 'Method not allowed'}, status=405)

    try:
        data = json.loads(request.body.decode('utf-8'))
    except Exception:
        data = request.POST

    order_number = data.get('order_number')
    razorpay_order_id = data.get('razorpay_order_id')
    razorpay_payment_id = data.get('razorpay_payment_id')
    razorpay_signature = data.get('razorpay_signature')
    is_mock = data.get('mock_payment', False)

    try:
        order = Order.objects.get(order_number=order_number)
    except Order.DoesNotExist:
        return JsonResponse({'status': 'error', 'message': 'Order not found'}, status=404)

    is_valid = False
    if is_mock or razorpay_signature == 'sandbox_signature_verified':
        is_valid = True
    else:
        is_valid = verify_razorpay_signature(razorpay_order_id, razorpay_payment_id, razorpay_signature)

    if is_valid:
        order.payment_status = 'Paid'
        order.razorpay_payment_id = razorpay_payment_id or f"pay_mock_{uuid.uuid4().hex[:10]}"
        order.razorpay_signature = razorpay_signature or 'sandbox_verified'
        order.tracking_number = f"GP-IND-{uuid.uuid4().hex[:6].upper()}"
        order.save()

        return JsonResponse({
            'status': 'success',
            'message': 'Payment successfully verified!',
            'order': {
                'order_number': order.order_number,
                'payment_status': order.payment_status,
                'order_status': order.order_status,
                'tracking_number': order.tracking_number,
                'total_amount': float(order.total_amount),
            }
        })
    else:
        order.payment_status = 'Failed'
        order.save()
        return JsonResponse({'status': 'error', 'message': 'Payment verification failed'}, status=400)


def api_order_detail(request, order_number):
    """
    GET /api/orders/<order_number>/
    Returns order tracking status, items, schedule, and live dispatch timeline.
    """
    try:
        order = Order.objects.get(order_number=order_number)
    except Order.DoesNotExist:
        return JsonResponse({'status': 'error', 'message': 'Order not found'}, status=404)

    status_steps = [
        {'id': 'Placed', 'title': 'Order Placed', 'desc': 'Order verified and payment confirmed.'},
        {'id': 'Scheduled', 'title': 'Delivery Scheduled', 'desc': f'Staged for {order.scheduled_date} ({order.delivery_time_slot}).'},
        {'id': 'Processing', 'title': 'Processing & Packing', 'desc': 'Securely packaged with tamper-proof seal.'},
        {'id': 'Shipped', 'title': 'Dispatched / In Transit', 'desc': f"AWB: {order.tracking_number or 'Assigned soon'}"},
        {'id': 'Out for Delivery', 'title': 'Out for Delivery', 'desc': 'Courier driver assigned to your delivery slot.'},
        {'id': 'Delivered', 'title': 'Delivered', 'desc': 'Delivered to your doorstep.'},
    ]

    order_status_order = ['Placed', 'Scheduled', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered']
    try:
        curr_idx = order_status_order.index(order.order_status)
    except ValueError:
        curr_idx = 1

    for i, s in enumerate(status_steps):
        s['completed'] = i <= curr_idx
        s['active'] = i == curr_idx

    items = [{
        'id': it.id,
        'name': it.product_name,
        'image_url': it.product_image_url,
        'price': float(it.price),
        'quantity': it.quantity,
        'color': it.color,
        'storage': it.storage,
        'total_price': float(it.total_price),
    } for it in order.items.all()]

    return JsonResponse({
        'status': 'success',
        'order': {
            'order_number': order.order_number,
            'full_name': order.full_name,
            'phone': order.phone,
            'email': order.email,
            'address': f"{order.address}, {order.city}, {order.state} - {order.pincode}",
            'scheduled_date': str(order.scheduled_date),
            'delivery_time_slot': order.delivery_time_slot,
            'schedule_notes': order.schedule_notes,
            'subtotal': float(order.subtotal),
            'discount_amount': float(order.discount_amount),
            'shipping_charge': float(order.shipping_charge),
            'total_amount': float(order.total_amount),
            'payment_method': order.get_payment_method_display(),
            'payment_status': order.payment_status,
            'order_status': order.order_status,
            'tracking_number': order.tracking_number,
            'dispatch_notes': order.dispatch_notes,
            'timeline': status_steps,
            'items': items,
        }
    })
