import json
from decimal import Decimal
from datetime import date, timedelta
from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse, HttpResponse
from django.contrib import messages
from django.contrib.auth import login, logout
from django.contrib.auth.decorators import login_required, user_passes_test
from django.db.models import Q, Count, Sum
from django.core.paginator import Paginator
from django.utils import timezone
from django.utils.text import slugify
from django.conf import settings

from django.contrib.auth.models import User

from .models import (
    Product, Category, Brand, ProductSpecification, ProductImage,
    Cart, CartItem, Coupon, Order, OrderItem, Review, Wishlist,
    UserProfile, PhoneOTP, LoginOTP,
)
from .forms import CheckoutForm, ReviewForm
from .utils import (
    get_or_create_cart, create_razorpay_order, verify_razorpay_signature,
    send_phone_otp, verify_phone_otp_code,
)


# -------------------------------------------------------------
# Storefront & Catalog Views
# -------------------------------------------------------------

def home_view(request):
    """
    Homepage featuring Green & White hero banner, top brands,
    flagship 5G phones, trending deals, and category shortcuts.
    """
    featured_products = Product.objects.filter(is_featured=True, is_active=True).select_related('brand', 'specs')[:8]
    trending_products = Product.objects.filter(is_trending=True, is_active=True).select_related('brand', 'specs')[:6]
    deals = Product.objects.filter(discount_price__isnull=False, is_active=True).order_by('-created_at')[:4]
    brands = Brand.objects.all()
    categories = Category.objects.all()

    # Spotlight flagship phone for Hero banner
    spotlight_phone = Product.objects.filter(is_featured=True, is_active=True).first()

    context = {
        'featured_products': featured_products,
        'trending_products': trending_products,
        'deals': deals,
        'brands': brands,
        'categories': categories,
        'spotlight_phone': spotlight_phone,
    }
    return render(request, 'store/home.html', context)


def product_list_view(request):
    """
    Full catalog with live faceted filters (Brand, Price Range, RAM, Storage, 5G, Category).
    """
    products = Product.objects.filter(is_active=True).select_related('brand', 'category', 'specs')
    categories = Category.objects.all()
    brands = Brand.objects.all()

    # Search filter
    q = request.GET.get('q', '').strip()
    if q:
        products = products.filter(
            Q(name__icontains=q) |
            Q(brand__name__icontains=q) |
            Q(description__icontains=q) |
            Q(short_description__icontains=q)
        )

    # Category filter
    category_slug = request.GET.get('category', '')
    if category_slug:
        products = products.filter(category__slug=category_slug)

    # Brand filter (can be multiple)
    selected_brands = request.GET.getlist('brand')
    if selected_brands:
        products = products.filter(brand__slug__in=selected_brands)

    # Price range filter
    min_price = request.GET.get('min_price')
    max_price = request.GET.get('max_price')
    if min_price:
        products = products.filter(price__gte=min_price)
    if max_price:
        products = products.filter(price__lte=max_price)

    # 5G filter
    is_5g = request.GET.get('5g')
    if is_5g == '1':
        products = products.filter(is_5g=True)

    # RAM filter
    ram = request.GET.get('ram')
    if ram:
        products = products.filter(specs__ram__icontains=ram)

    # Storage filter
    storage = request.GET.get('storage')
    if storage:
        products = products.filter(specs__storage__icontains=storage)

    # Sorting
    sort_by = request.GET.get('sort', 'newest')
    if sort_by == 'price_low':
        products = products.order_by('price')
    elif sort_by == 'price_high':
        products = products.order_by('-price')
    elif sort_by == 'rating':
        products = products.order_by('-rating')
    elif sort_by == 'popular':
        products = products.order_by('-reviews_count')
    else:
        products = products.order_by('-created_at')

    # Pagination
    paginator = Paginator(products, 9)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)

    context = {
        'page_obj': page_obj,
        'categories': categories,
        'brands': brands,
        'current_category': category_slug,
        'selected_brands': selected_brands,
        'search_query': q,
        'min_price': min_price,
        'max_price': max_price,
        'current_sort': sort_by,
        'selected_ram': ram,
        'selected_storage': storage,
        'is_5g': is_5g,
        'total_count': products.count(),
    }
    return render(request, 'store/product_list.html', context)


def product_detail_view(request, slug):
    """
    Detailed product showcase with image gallery, tech specifications,
    color/storage variant selections, review submission, and related phones.
    """
    product = get_object_or_404(Product.objects.select_related('brand', 'category', 'specs'), slug=slug, is_active=True)
    gallery = product.gallery_images.all()
    reviews = product.reviews.all()
    related_products = Product.objects.filter(brand=product.brand, is_active=True).exclude(id=product.id)[:4]

    # Wishlist check
    in_wishlist = False
    if request.user.is_authenticated:
        in_wishlist = Wishlist.objects.filter(user=request.user, product=product).exists()

    # Review form handling
    review_form = ReviewForm()
    if request.method == 'POST' and 'submit_review' in request.POST:
        review_form = ReviewForm(request.POST)
        if review_form.is_valid():
            rev = review_form.save(commit=False)
            rev.product = product
            if request.user.is_authenticated:
                rev.user = request.user
                if not rev.author_name:
                    rev.author_name = request.user.get_full_name() or request.user.username
            rev.save()
            
            # Recalculate product rating
            all_ratings = product.reviews.values_list('rating', flat=True)
            if all_ratings:
                avg = sum(all_ratings) / len(all_ratings)
                product.rating = round(avg, 1)
                product.reviews_count = len(all_ratings)
                product.save()

            messages.success(request, 'Thank you! Your product review has been published.')
            return redirect('store:product_detail', slug=slug)

    context = {
        'product': product,
        'gallery': gallery,
        'reviews': reviews,
        'related_products': related_products,
        'in_wishlist': in_wishlist,
        'review_form': review_form,
    }
    return render(request, 'store/product_detail.html', context)


# -------------------------------------------------------------
# Dedicated Cart System
# -------------------------------------------------------------

def cart_view(request):
    """
    Dedicated Cart Page with Green & White theme, quantity updates,
    coupon application, shipping threshold meter, and checkout link.
    """
    cart = get_or_create_cart(request)
    cart_items = cart.get_items()
    subtotal = cart.get_subtotal()

    # Coupon discount calculation
    coupon_code = request.session.get('coupon_code', '')
    discount_amount = Decimal('0.00')
    coupon_obj = None

    if coupon_code:
        coupon_obj = Coupon.objects.filter(code=coupon_code).first()
        if coupon_obj and coupon_obj.is_valid():
            if subtotal >= coupon_obj.min_order_amount:
                discount_amount = (subtotal * Decimal(coupon_obj.discount_percent)) / Decimal(100)
                if discount_amount > coupon_obj.max_discount_amount:
                    discount_amount = coupon_obj.max_discount_amount
            else:
                messages.warning(request, f"Coupon {coupon_code} requires minimum purchase of ₹{coupon_obj.min_order_amount}")
        else:
            request.session.pop('coupon_code', None)

    # Shipping Calculation (Free above ₹25,000)
    free_shipping_threshold = Decimal('25000.00')
    if subtotal >= free_shipping_threshold or subtotal == 0:
        shipping_charge = Decimal('0.00')
        free_shipping_remaining = Decimal('0.00')
        shipping_progress = 100
    else:
        shipping_charge = Decimal('199.00')
        free_shipping_remaining = free_shipping_threshold - subtotal
        shipping_progress = int((subtotal / free_shipping_threshold) * 100)

    total = subtotal - discount_amount + shipping_charge
    if total < 0:
        total = Decimal('0.00')

    context = {
        'cart': cart,
        'cart_items': cart_items,
        'subtotal': subtotal,
        'discount_amount': discount_amount,
        'shipping_charge': shipping_charge,
        'total': total,
        'coupon_code': coupon_code,
        'coupon_obj': coupon_obj,
        'free_shipping_threshold': free_shipping_threshold,
        'free_shipping_remaining': free_shipping_remaining,
        'shipping_progress': shipping_progress,
    }
    return render(request, 'store/cart.html', context)


def add_to_cart(request, product_id):
    """
    Adds a smartphone with selected color and storage to the cart.
    Supports both standard form POST and AJAX requests.
    """
    product = get_object_or_404(Product, id=product_id, is_active=True)
    cart = get_or_create_cart(request)

    quantity = int(request.POST.get('quantity', 1))
    color = request.POST.get('color', 'Emerald Green')
    storage = request.POST.get('storage', '256 GB')

    # If product has specs, fallback to first color/storage if not sent
    if hasattr(product, 'specs') and not color:
        colors = product.specs.get_color_list()
        color = colors[0] if colors else 'Default'
    if hasattr(product, 'specs') and not storage:
        storage = product.specs.storage

    cart_item, created = CartItem.objects.get_or_create(
        cart=cart,
        product=product,
        color=color,
        storage=storage,
        defaults={'quantity': quantity}
    )

    if not created:
        cart_item.quantity += quantity
        cart_item.save()

    if request.headers.get('x-requested-with') == 'XMLHttpRequest' or request.GET.get('format') == 'json':
        return JsonResponse({
            'status': 'success',
            'message': f"{product.name} ({color}, {storage}) added to your cart!",
            'cart_count': cart.get_item_count(),
            'cart_subtotal': str(cart.get_subtotal())
        })

    messages.success(request, f"✓ Added {product.name} ({color}, {storage}) to your shopping cart!")
    if request.POST.get('buy_now') == '1':
        return redirect('store:checkout')
    return redirect('store:cart')


def update_cart_item(request, item_id):
    """
    Increment, decrement, or update quantity of an item in cart.
    """
    cart = get_or_create_cart(request)
    item = get_or_create_cart_item = get_object_or_404(CartItem, id=item_id, cart=cart)

    action = request.POST.get('action') or request.GET.get('action')
    if action == 'increase':
        item.quantity += 1
        item.save()
    elif action == 'decrease':
        if item.quantity > 1:
            item.quantity -= 1
            item.save()
        else:
            item.delete()
    elif action == 'set':
        qty = int(request.POST.get('quantity', 1))
        if qty > 0:
            item.quantity = qty
            item.save()
        else:
            item.delete()

    if request.headers.get('x-requested-with') == 'XMLHttpRequest':
        return JsonResponse({
            'status': 'success',
            'item_quantity': item.quantity if item.id else 0,
            'item_total': str(item.get_total_price()) if item.id else '0.00',
            'cart_count': cart.get_item_count(),
            'cart_subtotal': str(cart.get_subtotal())
        })

    return redirect('store:cart')


def remove_from_cart(request, item_id):
    """
    Removes item completely from cart.
    """
    cart = get_or_create_cart(request)
    item = get_object_or_404(CartItem, id=item_id, cart=cart)
    product_name = item.product.name
    item.delete()

    if request.headers.get('x-requested-with') == 'XMLHttpRequest':
        return JsonResponse({
            'status': 'success',
            'message': f'{product_name} removed from cart',
            'cart_count': cart.get_item_count(),
            'cart_subtotal': str(cart.get_subtotal())
        })

    messages.info(request, f"{product_name} has been removed from your cart.")
    return redirect('store:cart')


def apply_coupon(request):
    """
    Validates and applies discount coupon code.
    """
    if request.method == 'POST':
        code = request.POST.get('coupon_code', '').strip().upper()
        coupon = Coupon.objects.filter(code=code).first()

        cart = get_or_create_cart(request)
        subtotal = cart.get_subtotal()

        if coupon and coupon.is_valid():
            if subtotal >= coupon.min_order_amount:
                request.session['coupon_code'] = code
                messages.success(request, f"🎉 Coupon '{code}' applied! You saved {coupon.discount_percent}%.")
            else:
                messages.error(request, f"Coupon '{code}' requires a minimum order of ${coupon.min_order_amount}.")
        else:
            messages.error(request, "Invalid or expired promo code. Try 'GREEN10'!")

    return redirect('store:cart')


def remove_coupon(request):
    """
    Removes active coupon from session.
    """
    if 'coupon_code' in request.session:
        del request.session['coupon_code']
        messages.info(request, "Coupon removed.")
    return redirect('store:cart')


# -------------------------------------------------------------
# Checkout & Order Delivery Scheduling & Razorpay
# -------------------------------------------------------------

def checkout_view(request):
    """
    Modern checkout workflow with:
    - Customer & Shipping address inputs
    - Delivery Date & Time Slot Scheduling selector
    - Payment Gateway selection (Razorpay, COD, Card, UPI)
    """
    cart = get_or_create_cart(request)
    cart_items = cart.get_items()

    if not cart_items.exists():
        messages.warning(request, "Your cart is empty. Please add smartphones before checkout!")
        return redirect('store:product_list')

    subtotal = cart.get_subtotal()

    # Calculate discount & shipping
    coupon_code = request.session.get('coupon_code', '')
    discount_amount = Decimal('0.00')
    if coupon_code:
        coupon_obj = Coupon.objects.filter(code=coupon_code).first()
        if coupon_obj and coupon_obj.is_valid() and subtotal >= coupon_obj.min_order_amount:
            discount_amount = (subtotal * Decimal(coupon_obj.discount_percent)) / Decimal(100)
            if discount_amount > coupon_obj.max_discount_amount:
                discount_amount = coupon_obj.max_discount_amount

    shipping_charge = Decimal('0.00') if subtotal >= 25000 else Decimal('199.00')
    total_amount = subtotal - discount_amount + shipping_charge

    # Default delivery schedule suggestion: tomorrow
    default_delivery_date = (date.today() + timedelta(days=1)).strftime('%Y-%m-%d')
    min_delivery_date = date.today().strftime('%Y-%m-%d')
    max_delivery_date = (date.today() + timedelta(days=14)).strftime('%Y-%m-%d')

    initial_data = {
        'scheduled_date': default_delivery_date,
        'payment_method': 'razorpay'
    }
    if request.user.is_authenticated:
        initial_data.update({
            'full_name': request.user.get_full_name() or request.user.username,
            'email': request.user.email,
        })

    if request.method == 'POST':
        form = CheckoutForm(request.POST)
        if form.is_valid():
            order = form.save(commit=False)
            if request.user.is_authenticated:
                order.user = request.user
            order.subtotal = subtotal
            order.discount_amount = discount_amount
            order.shipping_charge = shipping_charge
            order.total_amount = total_amount
            order.coupon_applied = coupon_code or None
            order.order_status = 'Scheduled'

            # Create Razorpay Order ID if razorpay is chosen (amount in paise)
            if order.payment_method == 'razorpay':
                amount_in_paise = int(total_amount * 100)
                rzp_order_id = create_razorpay_order(amount_in_paise, order.order_number, currency="INR")
                order.razorpay_order_id = rzp_order_id
                order.payment_status = 'Pending'
            elif order.payment_method == 'cod':
                order.payment_status = 'Pending'
            else:
                order.payment_status = 'Paid'

            order.save()

            # Create OrderItems snapshot
            for item in cart_items:
                OrderItem.objects.create(
                    order=order,
                    product=item.product,
                    product_name=f"{item.product.brand.name} {item.product.name}",
                    product_image_url=item.product.get_image_url(),
                    price=item.get_unit_price(),
                    quantity=item.quantity,
                    color=item.color,
                    storage=item.storage,
                    total_price=item.get_total_price()
                )
                # Decrement stock
                if item.product.stock >= item.quantity:
                    item.product.stock -= item.quantity
                    item.product.save()

            # Empty user cart
            cart.items.all().delete()
            if 'coupon_code' in request.session:
                del request.session['coupon_code']

            # If Razorpay selected, redirect to Razorpay payment screen
            if order.payment_method == 'razorpay':
                return redirect('store:razorpay_payment', order_number=order.order_number)

            messages.success(request, f"🎉 Order #{order.order_number} confirmed! Delivery scheduled for {order.scheduled_date}.")
            return redirect('store:order_success', order_number=order.order_number)
    else:
        form = CheckoutForm(initial=initial_data)

    context = {
        'form': form,
        'cart_items': cart_items,
        'subtotal': subtotal,
        'discount_amount': discount_amount,
        'shipping_charge': shipping_charge,
        'total_amount': total_amount,
        'coupon_code': coupon_code,
        'min_delivery_date': min_delivery_date,
        'max_delivery_date': max_delivery_date,
        'default_delivery_date': default_delivery_date,
    }
    return render(request, 'store/checkout.html', context)


def razorpay_payment_view(request, order_number):
    """
    Dedicated Razorpay Payment Gateway page with interactive checkout,
    support for active credentials, and built-in interactive simulator.
    """
    order = get_object_or_404(Order, order_number=order_number)

    if order.payment_status == 'Paid':
        return redirect('store:order_success', order_number=order.order_number)

    amount_in_paise = int(order.total_amount * 100)

    # Only provide order_id if it was created via Razorpay API (starts with order_)
    rzp_order_id = order.razorpay_order_id if (order.razorpay_order_id and order.razorpay_order_id.startswith('order_') and not order.razorpay_order_id.startswith('order_rzp_GPM')) else ""

    context = {
        'order': order,
        'razorpay_order_id': rzp_order_id,
        'razorpay_key_id': getattr(settings, 'RAZORPAY_KEY_ID', 'rzp_test_TYrDpRiv6T2o3c'),
        'amount_in_cents': amount_in_paise,
        'currency': getattr(settings, 'CURRENCY_CODE', 'INR'),
    }
    return render(request, 'store/razorpay_payment.html', context)


def razorpay_callback_view(request):
    """
    Handles payment response from Razorpay (both live POST callback & mock test verification).
    """
    if request.method == 'POST':
        razorpay_order_id = request.POST.get('razorpay_order_id')
        razorpay_payment_id = request.POST.get('razorpay_payment_id')
        razorpay_signature = request.POST.get('razorpay_signature')
        order_number = request.POST.get('order_number')

        order = None
        if order_number:
            order = Order.objects.filter(order_number=order_number).first()
        elif razorpay_order_id:
            order = Order.objects.filter(razorpay_order_id=razorpay_order_id).first()

        if not order:
            messages.error(request, "Order not found for verification.")
            return redirect('store:home')

        # Verify signature
        is_valid = verify_razorpay_signature(razorpay_order_id, razorpay_payment_id, razorpay_signature)
        if is_valid or request.POST.get('mock_payment') == 'true':
            order.payment_status = 'Paid'
            order.razorpay_payment_id = razorpay_payment_id or f"pay_mock_{order.order_number}"
            order.razorpay_signature = razorpay_signature or "sandbox_signature_verified"
            order.order_status = 'Scheduled'
            order.save()

            messages.success(request, f"✓ Payment Successful via Razorpay! Your delivery is scheduled.")
            return redirect('store:order_success', order_number=order.order_number)
        else:
            order.payment_status = 'Failed'
            order.save()
            messages.error(request, "Payment signature verification failed. Please try again.")
            return redirect('store:razorpay_payment', order_number=order.order_number)

    return redirect('store:home')


def order_success_view(request, order_number):
    """
    Order confirmation view with green celebratory effects, delivery schedule,
    contact helpline, and link to printable receipt/invoice.
    """
    order = get_object_or_404(Order, order_number=order_number)
    return render(request, 'store/order_success.html', {'order': order})


def order_tracking_view(request, order_number):
    """
    Visual Timeline Order Status and Scheduled Delivery Tracker.
    """
    order = get_object_or_404(Order, order_number=order_number)
    
    statuses = ['Placed', 'Scheduled', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered']
    current_index = 0
    if order.order_status in statuses:
        current_index = statuses.index(order.order_status)
    elif order.order_status == 'Cancelled':
        current_index = -1

    context = {
        'order': order,
        'statuses': statuses,
        'current_index': current_index,
    }
    return render(request, 'store/order_tracking.html', context)


def invoice_view(request, order_number):
    """
    Clean printable tax invoice / bill receipt.
    """
    order = get_object_or_404(Order, order_number=order_number)
    return render(request, 'store/invoice.html', {'order': order})


# -------------------------------------------------------------
# Wishlist & Profile
# -------------------------------------------------------------

@login_required
def wishlist_view(request):
    """
    Customer's saved wishlist phones.
    """
    items = Wishlist.objects.filter(user=request.user).select_related('product', 'product__brand')
    return render(request, 'store/wishlist.html', {'wishlist_items': items})


@login_required
def toggle_wishlist(request, product_id):
    """
    AJAX / button toggle to add or remove smartphone from wishlist.
    """
    product = get_object_or_404(Product, id=product_id)
    wishlist_item = Wishlist.objects.filter(user=request.user, product=product).first()

    if wishlist_item:
        wishlist_item.delete()
        in_wishlist = False
        msg = f"{product.name} removed from your Wishlist."
    else:
        Wishlist.objects.create(user=request.user, product=product)
        in_wishlist = True
        msg = f"❤️ {product.name} saved to your Wishlist!"

    if request.headers.get('x-requested-with') == 'XMLHttpRequest':
        return JsonResponse({
            'status': 'success',
            'in_wishlist': in_wishlist,
            'message': msg
        })

    messages.info(request, msg)
    return redirect(request.META.get('HTTP_REFERER', 'store:wishlist'))


@login_required
def profile_view(request):
    """
    Customer Account Profile: Personal info, order history, scheduled deliveries.
    """
    orders = Order.objects.filter(user=request.user).order_by('-created_at')
    scheduled_orders = orders.filter(order_status__in=['Placed', 'Scheduled', 'Processing', 'Shipped', 'Out for Delivery'])
    
    context = {
        'orders': orders,
        'scheduled_orders': scheduled_orders,
        'total_spent': orders.filter(payment_status='Paid').aggregate(Sum('total_amount'))['total_amount__sum'] or Decimal('0.00'),
    }
    return render(request, 'store/profile.html', context)


# -------------------------------------------------------------
# Custom Green & White Admin Management Dashboard
# -------------------------------------------------------------

def is_admin_or_staff(user):
    return user.is_authenticated and (user.is_staff or user.is_superuser)


@user_passes_test(is_admin_or_staff, login_url='account_login')
def admin_dashboard_view(request):
    """
    Custom Store Admin Dashboard:
    - Real-time revenue & sales metrics
    - Order Schedule & Dispatch Manager (Filter by Date / Slot)
    - Inventory Stock Management with inline updates
    - Recent Customer Orders & Status Updates
    """
    total_orders = Order.objects.count()
    paid_orders = Order.objects.filter(payment_status='Paid')
    total_revenue = paid_orders.aggregate(Sum('total_amount'))['total_amount__sum'] or Decimal('0.00')
    total_products = Product.objects.count()
    low_stock_products = Product.objects.filter(stock__lte=5)

    # Date filter for delivery scheduling
    selected_date_str = request.GET.get('date', date.today().strftime('%Y-%m-%d'))
    try:
        selected_date = date.fromisoformat(selected_date_str)
    except ValueError:
        selected_date = date.today()

    # Orders scheduled for the selected date
    scheduled_deliveries = Order.objects.filter(scheduled_date=selected_date).order_by('delivery_time_slot', '-created_at')

    # All upcoming scheduled deliveries
    upcoming_schedules = Order.objects.filter(
        scheduled_date__gte=date.today(),
        order_status__in=['Placed', 'Scheduled', 'Processing', 'Shipped', 'Out for Delivery']
    ).order_by('scheduled_date', 'delivery_time_slot')[:15]

    # Recent Orders
    recent_orders = Order.objects.all().order_by('-created_at')[:10]

    # All Products for quick inventory management
    products = Product.objects.all().select_related('brand').order_by('stock')

    context = {
        'total_orders': total_orders,
        'total_revenue': total_revenue,
        'total_products': total_products,
        'low_stock_count': low_stock_products.count(),
        'low_stock_products': low_stock_products,
        'selected_date': selected_date_str,
        'scheduled_deliveries': scheduled_deliveries,
        'upcoming_schedules': upcoming_schedules,
        'recent_orders': recent_orders,
        'products': products,
        'order_status_choices': Order.ORDER_STATUS_CHOICES,
        'brands': Brand.objects.all(),
        'categories': Category.objects.all(),
    }
    return render(request, 'store/admin_dashboard.html', context)


@user_passes_test(is_admin_or_staff, login_url='account_login')
def admin_add_product(request):
    """
    Adds a brand-new smartphone (with its technical specification record)
    straight from the Store Admin Dashboard inventory tab.
    """
    if request.method == 'POST':
        name = request.POST.get('name', '').strip()
        brand_id = request.POST.get('brand')
        category_id = request.POST.get('category')
        price = request.POST.get('price')
        short_description = request.POST.get('short_description', '').strip()
        description = request.POST.get('description', '').strip()

        if not (name and brand_id and price and short_description and description):
            messages.error(request, "Please fill in all required smartphone fields.")
            return redirect(request.META.get('HTTP_REFERER', 'store:admin_dashboard'))

        brand = get_object_or_404(Brand, id=brand_id)
        category = Category.objects.filter(id=category_id).first() if category_id else None

        discount_price = request.POST.get('discount_price') or None
        stock = request.POST.get('stock') or 0

        base_slug = slugify(f"{brand.name}-{name}")
        slug = base_slug
        suffix = 1
        while Product.objects.filter(slug=slug).exists():
            suffix += 1
            slug = f"{base_slug}-{suffix}"

        product = Product.objects.create(
            name=name,
            slug=slug,
            brand=brand,
            category=category,
            price=Decimal(price),
            discount_price=Decimal(discount_price) if discount_price else None,
            stock=int(stock),
            image_url=request.POST.get('image_url', '').strip() or None,
            main_image=request.FILES.get('main_image'),
            short_description=short_description,
            description=description,
            is_featured=bool(request.POST.get('is_featured')),
            is_trending=bool(request.POST.get('is_trending')),
            is_5g=bool(request.POST.get('is_5g')),
        )

        spec_kwargs = {}
        if request.POST.get('ram'):
            spec_kwargs['ram'] = request.POST.get('ram').strip()
        if request.POST.get('storage'):
            spec_kwargs['storage'] = request.POST.get('storage').strip()
        ProductSpecification.objects.create(product=product, **spec_kwargs)

        messages.success(request, f"✓ {product.name} was added to the catalog successfully!")
        return redirect('store:admin_dashboard')

    return redirect('store:admin_dashboard')


@user_passes_test(is_admin_or_staff, login_url='account_login')
def admin_update_order_status(request, order_id):
    """
    1-Click update for order status and delivery notes from admin panel.
    """
    order = get_object_or_404(Order, id=order_id)
    if request.method == 'POST':
        new_status = request.POST.get('order_status')
        new_payment_status = request.POST.get('payment_status')
        dispatch_notes = request.POST.get('dispatch_notes')
        tracking_number = request.POST.get('tracking_number')

        if new_status:
            order.order_status = new_status
        if new_payment_status:
            order.payment_status = new_payment_status
        if dispatch_notes is not None:
            order.dispatch_notes = dispatch_notes
        if tracking_number is not None:
            order.tracking_number = tracking_number

        order.save()
        messages.success(request, f"✓ Order #{order.order_number} status updated to '{order.order_status}'.")

    return redirect(request.META.get('HTTP_REFERER', 'store:admin_dashboard'))


@user_passes_test(is_admin_or_staff, login_url='account_login')
def admin_update_product_stock(request, product_id):
    """
    Quick stock & price updater from admin panel.
    """
    product = get_object_or_404(Product, id=product_id)
    if request.method == 'POST':
        stock = request.POST.get('stock')
        price = request.POST.get('price')
        if stock is not None:
            product.stock = int(stock)
        if price is not None:
            product.price = Decimal(price)
        product.save()
        messages.success(request, f"✓ Updated {product.name} (Stock: {product.stock}, Price: ${product.price})")

    return redirect(request.META.get('HTTP_REFERER', 'store:admin_dashboard'))


# -------------------------------------------------------------
# Two-Factor Login Verification (email OTP via Resend) & Phone
# Number Verification (SMS OTP via 2Factor.in)
# -------------------------------------------------------------

def verify_2fa_view(request):
    """
    Second step of login for accounts with email-based 2FA enabled.
    Triggered by TwoFactorAccountAdapter.pre_login (see store/adapters.py).
    """
    user_id = request.session.get('pending_2fa_user_id')
    if not user_id:
        return redirect('account_login')

    if request.method == 'POST':
        code = request.POST.get('code', '').strip()
        otp = LoginOTP.objects.filter(user_id=user_id, code=code, is_used=False).order_by('-created_at').first()

        if otp and not otp.is_expired():
            otp.is_used = True
            otp.save(update_fields=['is_used'])

            user = get_object_or_404(User, pk=user_id)
            login(request, user, backend='django.contrib.auth.backends.ModelBackend')

            redirect_url = request.session.pop('pending_2fa_redirect', '') or 'store:home'
            del request.session['pending_2fa_user_id']

            messages.success(request, f"Welcome back, {user.get_full_name() or user.username}!")
            return redirect(redirect_url)
        else:
            messages.error(request, "That code is invalid or has expired. Please try again.")

    return render(request, 'auth/verify_2fa.html')


@login_required
def toggle_2fa_view(request):
    """Enable/disable email-based 2FA for the logged-in user."""
    profile, _ = UserProfile.objects.get_or_create(user=request.user)
    profile.two_factor_enabled = not profile.two_factor_enabled
    profile.save(update_fields=['two_factor_enabled'])
    messages.success(
        request,
        f"Two-factor authentication {'enabled' if profile.two_factor_enabled else 'disabled'}."
    )
    return redirect('store:profile')


@login_required
def send_phone_otp_view(request):
    """Sends an SMS OTP (via 2Factor.in) to verify the user's phone number."""
    if request.method == 'POST':
        phone_number = request.POST.get('phone_number', '').strip()
        if not phone_number:
            messages.error(request, "Please enter a phone number.")
            return redirect('store:profile')

        session_id, error = send_phone_otp(phone_number)
        if error:
            messages.error(request, f"Could not send OTP: {error}")
        else:
            profile, _ = UserProfile.objects.get_or_create(user=request.user)
            profile.phone_number = phone_number
            profile.phone_verified = False
            profile.save(update_fields=['phone_number', 'phone_verified'])

            PhoneOTP.objects.create(user=request.user, phone_number=phone_number, session_id=session_id)
            messages.success(request, f"An OTP has been sent to {phone_number}.")

    return redirect('store:profile')


@login_required
def verify_phone_otp_view(request):
    """Verifies the SMS OTP entered by the user and marks the phone as verified."""
    if request.method == 'POST':
        code = request.POST.get('otp', '').strip()
        otp_obj = PhoneOTP.objects.filter(user=request.user, is_used=False).order_by('-created_at').first()

        if otp_obj and not otp_obj.is_expired() and verify_phone_otp_code(otp_obj.session_id, code):
            otp_obj.is_used = True
            otp_obj.save(update_fields=['is_used'])

            profile, _ = UserProfile.objects.get_or_create(user=request.user)
            profile.phone_verified = True
            profile.save(update_fields=['phone_verified'])

            messages.success(request, "Your phone number has been verified!")
        else:
            messages.error(request, "Invalid or expired OTP. Please try again.")

    return redirect('store:profile')
