from django.contrib import admin
from django.utils.html import format_html
from .models import (
    Brand, Category, Product, ProductSpecification, ProductImage,
    Coupon, Cart, CartItem, Order, OrderItem, Review, Wishlist
)

class ProductSpecificationInline(admin.StackedInline):
    model = ProductSpecification
    can_delete = False
    verbose_name_plural = 'Technical Specifications'


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 2


@admin.register(Brand)
class BrandAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'is_featured', 'brand_logo_preview', 'product_count']
    list_editable = ['is_featured']
    prepopulated_fields = {'slug': ('name',)}
    search_fields = ['name']

    def brand_logo_preview(self, obj):
        url = obj.get_logo_url()
        return format_html('<img src="{}" style="width: 40px; height: 40px; object-fit: contain; border-radius: 6px;" />', url)
    brand_logo_preview.short_description = "Logo"

    def product_count(self, obj):
        return obj.products.count()
    product_count.short_description = "Phones"


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'icon', 'product_count']
    prepopulated_fields = {'slug': ('name',)}
    search_fields = ['name']

    def product_count(self, obj):
        return obj.products.count()
    product_count.short_description = "Total Mobiles"


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['image_preview', 'name', 'brand', 'price_display', 'stock_badge', 'is_featured', 'is_trending', 'is_5g', 'rating_stars']
    list_editable = ['is_featured', 'is_trending', 'is_5g']
    list_filter = ['brand', 'category', 'is_5g', 'is_featured', 'is_trending', 'is_active']
    prepopulated_fields = {'slug': ('name',)}
    search_fields = ['name', 'brand__name', 'description']
    inlines = [ProductSpecificationInline, ProductImageInline]
    readonly_fields = ['created_at', 'updated_at']

    def image_preview(self, obj):
        url = obj.get_image_url()
        return format_html('<img src="{}" style="width: 48px; height: 48px; object-fit: cover; border-radius: 8px; border: 1px solid #10b981;" />', url)
    image_preview.short_description = "Preview"

    def price_display(self, obj):
        if obj.discount_price:
            return format_html('<span style="color: #059669; font-weight: bold;">₹{}</span> <s style="color: #94a3b8; font-size: 0.85em;">₹{}</s>', obj.discount_price, obj.price)
        return format_html('<b>₹{}</b>', obj.price)
    price_display.short_description = "Price (₹)"

    def stock_badge(self, obj):
        if obj.stock <= 0:
            return format_html('<span style="background: #fee2e2; color: #991b1b; padding: 3px 8px; border-radius: 9999px; font-weight: 600; font-size: 11px;">Out of Stock</span>')
        if obj.stock <= 5:
            return format_html('<span style="background: #fef3c7; color: #92400e; padding: 3px 8px; border-radius: 9999px; font-weight: 600; font-size: 11px;">Low ({})</span>', obj.stock)
        return format_html('<span style="background: #d1fae5; color: #065f46; padding: 3px 8px; border-radius: 9999px; font-weight: 600; font-size: 11px;">In Stock ({})</span>', obj.stock)
    stock_badge.short_description = "Stock"

    def rating_stars(self, obj):
        return format_html('<span style="color: #f59e0b;">★</span> {} ({})', obj.rating, obj.reviews_count)
    rating_stars.short_description = "Rating"


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ['product_name', 'price', 'quantity', 'color', 'storage', 'total_price']
    can_delete = False


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['order_number', 'customer_info', 'scheduled_delivery_badge', 'payment_status_badge', 'order_status_badge', 'total_amount_display', 'created_at']
    list_filter = ['order_status', 'payment_status', 'payment_method', 'scheduled_date']
    search_fields = ['order_number', 'full_name', 'email', 'phone', 'razorpay_order_id', 'razorpay_payment_id']
    inlines = [OrderItemInline]
    readonly_fields = ['order_number', 'created_at', 'updated_at', 'razorpay_order_id', 'razorpay_payment_id', 'razorpay_signature']
    
    fieldsets = (
        ("Order Identity", {
            'fields': ('order_number', 'user', 'order_status', 'tracking_number', 'dispatch_notes')
        }),
        ("Customer & Shipping Address (India)", {
            'fields': ('full_name', 'email', 'phone', 'address', 'city', 'state', 'pincode', 'order_notes')
        }),
        ("Delivery Scheduling", {
            'fields': ('scheduled_date', 'delivery_time_slot', 'schedule_notes')
        }),
        ("Payment & Financials (₹ INR)", {
            'fields': ('payment_method', 'payment_status', 'subtotal', 'discount_amount', 'shipping_charge', 'total_amount', 'coupon_applied', 'razorpay_order_id', 'razorpay_payment_id', 'razorpay_signature')
        }),
        ("Timestamps", {
            'fields': ('created_at', 'updated_at')
        }),
    )

    def customer_info(self, obj):
        return format_html('<b>{}</b><br><small style="color: #64748b;">{}</small>', obj.full_name, obj.phone)
    customer_info.short_description = "Customer"

    def scheduled_delivery_badge(self, obj):
        return format_html('<span style="background: #e0f2fe; color: #0369a1; padding: 4px 8px; border-radius: 6px; font-weight: 600; font-size: 11px;">📅 {}<br>⏰ {}</span>', obj.scheduled_date, obj.delivery_time_slot)
    scheduled_delivery_badge.short_description = "Scheduled For"

    def payment_status_badge(self, obj):
        color = "#10b981" if obj.payment_status == 'Paid' else "#f59e0b"
        if obj.payment_status == 'Failed':
            color = "#ef4444"
        return format_html('<span style="color: {}; font-weight: bold;">● {}</span> ({})', color, obj.payment_status, obj.get_payment_method_display())
    payment_status_badge.short_description = "Payment"

    def order_status_badge(self, obj):
        return format_html('<span style="font-weight: 600; padding: 4px 8px; border-radius: 6px; background: #ecfdf5; color: #047857; border: 1px solid #6ee7b7;">{}</span>', obj.order_status)
    order_status_badge.short_description = "Status"

    def total_amount_display(self, obj):
        return format_html('<b>₹{}</b>', obj.total_amount)
    total_amount_display.short_description = "Total (₹)"


@admin.register(Coupon)
class CouponAdmin(admin.ModelAdmin):
    list_display = ['code', 'discount_percent', 'max_discount_amount', 'min_order_amount', 'active', 'valid_from', 'valid_to']
    list_editable = ['active']
    search_fields = ['code']


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ['product', 'author_name', 'rating', 'title', 'created_at']
    list_filter = ['rating', 'created_at']
    search_fields = ['author_name', 'comment', 'product__name']


@admin.register(Wishlist)
class WishlistAdmin(admin.ModelAdmin):
    list_display = ['user', 'product', 'added_at']
