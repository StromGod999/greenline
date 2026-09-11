from django.urls import path
from . import views
from . import api

app_name = 'store'

urlpatterns = [
    # Storefront
    path('', views.home_view, name='home'),
    path('phones/', views.product_list_view, name='product_list'),
    path('phones/<slug:slug>/', views.product_detail_view, name='product_detail'),

    # Dedicated Cart Management
    path('cart/', views.cart_view, name='cart'),
    path('cart/add/<int:product_id>/', views.add_to_cart, name='add_to_cart'),
    path('cart/update/<int:item_id>/', views.update_cart_item, name='update_cart_item'),
    path('cart/remove/<int:item_id>/', views.remove_from_cart, name='remove_from_cart'),
    path('cart/coupon/apply/', views.apply_coupon, name='apply_coupon'),
    path('cart/coupon/remove/', views.remove_coupon, name='remove_coupon'),

    # Checkout & Razorpay Payment & Delivery Scheduling
    path('checkout/', views.checkout_view, name='checkout'),
    path('payment/razorpay/callback/', views.razorpay_callback_view, name='razorpay_callback'),
    path('payment/razorpay/<str:order_number>/', views.razorpay_payment_view, name='razorpay_payment'),
    path('order/success/<str:order_number>/', views.order_success_view, name='order_success'),
    path('order/track/<str:order_number>/', views.order_tracking_view, name='order_tracking'),
    path('order/invoice/<str:order_number>/', views.invoice_view, name='invoice'),

    # Customer Wishlist & Profile
    path('wishlist/', views.wishlist_view, name='wishlist'),
    path('wishlist/toggle/<int:product_id>/', views.toggle_wishlist, name='toggle_wishlist'),
    path('profile/', views.profile_view, name='profile'),

    # Custom Admin Management & Order Schedule Dashboard
    path('admin-dashboard/', views.admin_dashboard_view, name='admin_dashboard'),
    path('admin-dashboard/order/<int:order_id>/update/', views.admin_update_order_status, name='admin_update_order_status'),
    path('admin-dashboard/product/add/', views.admin_add_product, name='admin_add_product'),
    path('admin-dashboard/product/<int:product_id>/stock/', views.admin_update_product_stock, name='admin_update_product_stock'),

    # Authentication
    path('auth/register/', views.register_view, name='register'),
    path('auth/login/', views.login_view, name='login'),
    path('auth/logout/', views.logout_view, name='logout'),

    # -------------------------------------------------------------
    # REST API for Cross-Platform Mobile Application (Android & iOS)
    # -------------------------------------------------------------
    path('api/home/', api.api_home, name='api_home'),
    path('api/products/', api.api_products, name='api_products'),
    path('api/products/<slug:slug>/', api.api_product_detail, name='api_product_detail'),
    path('api/cart/', api.api_cart_get, name='api_cart_get'),
    path('api/cart/add/', api.api_cart_add, name='api_cart_add'),
    path('api/cart/update/', api.api_cart_update, name='api_cart_update'),
    path('api/cart/remove/', api.api_cart_remove, name='api_cart_remove'),
    path('api/cart/coupon/', api.api_apply_coupon, name='api_apply_coupon'),
    path('api/checkout/create-order/', api.api_create_order, name='api_create_order'),
    path('api/payment/verify/', api.api_verify_payment, name='api_verify_payment'),
    path('api/orders/<str:order_number>/', api.api_order_detail, name='api_order_detail'),
]
