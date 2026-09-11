import uuid
from decimal import Decimal
from django.db import models
from django.contrib.auth.models import User
from django.urls import reverse
from django.utils import timezone

class Brand(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True)
    logo = models.ImageField(upload_to='brands/', blank=True, null=True)
    logo_url = models.URLField(blank=True, null=True, help_text="External image URL fallback")
    description = models.TextField(blank=True)
    is_featured = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name

    def get_logo_url(self):
        if self.logo:
            return self.logo.url
        if self.logo_url:
            return self.logo_url
        return 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=100&auto=format&fit=crop&q=60'


class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True)
    icon = models.CharField(max_length=50, default='fa-mobile-screen-button', help_text="FontAwesome icon class name")
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = 'Categories'
        ordering = ['name']

    def __str__(self):
        return self.name


class Product(models.Model):
    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=220, unique=True)
    brand = models.ForeignKey(Brand, on_delete=models.CASCADE, related_name='products')
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name='products')
    price = models.DecimalField(max_digits=10, decimal_places=2)
    discount_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    stock = models.PositiveIntegerField(default=10)
    main_image = models.ImageField(upload_to='products/', blank=True, null=True)
    image_url = models.URLField(blank=True, null=True, help_text="Direct high-res photo URL")
    short_description = models.CharField(max_length=300, help_text="Short highlight specs")
    description = models.TextField()
    rating = models.DecimalField(max_digits=3, decimal_places=1, default=4.8)
    reviews_count = models.PositiveIntegerField(default=48)
    is_featured = models.BooleanField(default=False)
    is_trending = models.BooleanField(default=False)
    is_5g = models.BooleanField(default=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.brand.name} {self.name}"

    def get_absolute_url(self):
        return reverse('store:product_detail', kwargs={'slug': self.slug})

    def get_current_price(self):
        if self.discount_price and self.discount_price > 0:
            return self.discount_price
        return self.price

    def get_discount_percentage(self):
        if self.discount_price and self.discount_price < self.price:
            diff = self.price - self.discount_price
            percent = (diff / self.price) * 100
            return int(percent)
        return 0

    def in_stock(self):
        return self.stock > 0

    def get_image_url(self):
        if self.main_image:
            return self.main_image.url
        if self.image_url:
            return self.image_url
        return 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&auto=format&fit=crop&q=80'


class ProductSpecification(models.Model):
    product = models.OneToOneField(Product, on_delete=models.CASCADE, related_name='specs')
    ram = models.CharField(max_length=50, default='12 GB', help_text="e.g. 8 GB, 12 GB, 16 GB")
    storage = models.CharField(max_length=50, default='256 GB', help_text="e.g. 128 GB, 256 GB, 512 GB, 1 TB")
    processor = models.CharField(max_length=150, default='Snapdragon 8 Gen 3 (4nm)')
    display = models.CharField(max_length=150, default='6.7" Dynamic AMOLED 2X, 120Hz, HDR10+')
    camera_rear = models.CharField(max_length=200, default='200 MP + 50 MP + 12 MP + 10 MP Quad OIS')
    camera_front = models.CharField(max_length=100, default='12 MP HDR 4K 60fps')
    battery = models.CharField(max_length=150, default='5000 mAh with 65W Turbo Charging')
    operating_system = models.CharField(max_length=100, default='Android 14 / Custom UI')
    network = models.CharField(max_length=100, default='5G Dual SIM, Wi-Fi 7, Bluetooth 5.4')
    colors = models.CharField(max_length=200, default='Emerald Green, Phantom Black, Glacier Silver')
    weight = models.CharField(max_length=50, default='210g')
    warranty = models.CharField(max_length=100, default='1 Year Brand Warranty + 6 Months Screen Protection')

    def __str__(self):
        return f"Specs for {self.product.name}"

    def get_color_list(self):
        return [c.strip() for c in self.colors.split(',') if c.strip()]


class ProductImage(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='gallery_images')
    image = models.ImageField(upload_to='product_gallery/', blank=True, null=True)
    image_url = models.URLField(blank=True, null=True)
    alt_text = models.CharField(max_length=200, blank=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order', 'id']

    def __str__(self):
        return f"Gallery image for {self.product.name}"

    def get_image_url(self):
        if self.image:
            return self.image.url
        if self.image_url:
            return self.image_url
        return self.product.get_image_url()


class Coupon(models.Model):
    code = models.CharField(max_length=50, unique=True)
    discount_percent = models.PositiveIntegerField(default=10, help_text="Discount percentage (e.g. 10 for 10%)")
    max_discount_amount = models.DecimalField(max_digits=8, decimal_places=2, default=100.00)
    min_order_amount = models.DecimalField(max_digits=8, decimal_places=2, default=200.00)
    active = models.BooleanField(default=True)
    valid_from = models.DateTimeField(default=timezone.now)
    valid_to = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.code} ({self.discount_percent}% off)"

    def is_valid(self):
        now = timezone.now()
        if not self.active:
            return False
        if self.valid_to and now > self.valid_to:
            return False
        return True


class Cart(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name='carts')
    session_key = models.CharField(max_length=40, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Cart #{self.id} ({self.user.username if self.user else 'Guest'})"

    def get_items(self):
        return self.items.select_related('product', 'product__brand')

    def get_subtotal(self):
        total = sum(item.get_total_price() for item in self.items.all())
        return Decimal(str(total))

    def get_item_count(self):
        return sum(item.quantity for item in self.items.all())


class CartItem(models.Model):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    color = models.CharField(max_length=50, default='Standard')
    storage = models.CharField(max_length=50, default='Default')
    added_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.quantity}x {self.product.name}"

    def get_unit_price(self):
        return self.product.get_current_price()

    def get_total_price(self):
        return self.get_unit_price() * self.quantity


class Order(models.Model):
    PAYMENT_CHOICES = [
        ('razorpay', 'Razorpay Secure Checkout'),
        ('cod', 'Cash on Delivery (COD)'),
        ('card', 'Credit / Debit Card'),
        ('upi', 'UPI / Instant Bank Transfer'),
    ]

    PAYMENT_STATUS_CHOICES = [
        ('Pending', 'Pending'),
        ('Paid', 'Paid (Captured)'),
        ('Failed', 'Failed'),
        ('Refunded', 'Refunded'),
    ]

    ORDER_STATUS_CHOICES = [
        ('Placed', 'Order Placed'),
        ('Scheduled', 'Delivery Scheduled'),
        ('Processing', 'Processing / In Packing'),
        ('Shipped', 'Dispatched / In Transit'),
        ('Out for Delivery', 'Out for Delivery'),
        ('Delivered', 'Delivered'),
        ('Cancelled', 'Cancelled'),
    ]

    TIME_SLOT_CHOICES = [
        ('09:00 AM - 01:00 PM', 'Morning Slot (09:00 AM - 01:00 PM)'),
        ('01:00 PM - 05:00 PM', 'Afternoon Slot (01:00 PM - 05:00 PM)'),
        ('05:00 PM - 09:00 PM', 'Evening Slot (05:00 PM - 09:00 PM)'),
        ('Express Same-Day', '⚡ Express Priority Dispatch (Within 3 Hours)'),
    ]

    order_number = models.CharField(max_length=32, unique=True, editable=False)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='orders')
    
    # Shipping Information
    full_name = models.CharField(max_length=150)
    email = models.EmailField()
    phone = models.CharField(max_length=20)
    address = models.TextField()
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    pincode = models.CharField(max_length=20)
    order_notes = models.TextField(blank=True, null=True)

    # Order Scheduling
    scheduled_date = models.DateField(help_text="Customer's preferred delivery date")
    delivery_time_slot = models.CharField(max_length=100, choices=TIME_SLOT_CHOICES, default='09:00 AM - 01:00 PM')
    schedule_notes = models.CharField(max_length=255, blank=True, null=True, help_text="Special delivery gate instructions")

    # Financial details
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    shipping_charge = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    coupon_applied = models.CharField(max_length=50, blank=True, null=True)

    # Payment & Gateway Information
    payment_method = models.CharField(max_length=30, choices=PAYMENT_CHOICES, default='razorpay')
    payment_status = models.CharField(max_length=30, choices=PAYMENT_STATUS_CHOICES, default='Pending')
    razorpay_order_id = models.CharField(max_length=100, blank=True, null=True)
    razorpay_payment_id = models.CharField(max_length=100, blank=True, null=True)
    razorpay_signature = models.CharField(max_length=255, blank=True, null=True)

    # Fulfillment tracking
    order_status = models.CharField(max_length=40, choices=ORDER_STATUS_CHOICES, default='Placed')
    tracking_number = models.CharField(max_length=50, blank=True, null=True)
    dispatch_notes = models.TextField(blank=True, null=True, help_text="Admin dispatch / warehouse remarks")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.order_number:
            self.order_number = f"GPM-{uuid.uuid4().hex[:8].upper()}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Order #{self.order_number} - {self.full_name} (${self.total_amount})"

    def get_status_badge_class(self):
        mapping = {
            'Placed': 'bg-emerald-100 text-emerald-800 border-emerald-300',
            'Scheduled': 'bg-blue-100 text-blue-800 border-blue-300',
            'Processing': 'bg-amber-100 text-amber-800 border-amber-300',
            'Shipped': 'bg-purple-100 text-purple-800 border-purple-300',
            'Out for Delivery': 'bg-teal-100 text-teal-800 border-teal-300',
            'Delivered': 'bg-green-100 text-green-800 border-green-300',
            'Cancelled': 'bg-rose-100 text-rose-800 border-rose-300',
        }
        return mapping.get(self.order_status, 'bg-slate-100 text-slate-800')


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True, blank=True)
    product_name = models.CharField(max_length=200)
    product_image_url = models.URLField(blank=True, null=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.PositiveIntegerField(default=1)
    color = models.CharField(max_length=50, default='Standard')
    storage = models.CharField(max_length=50, default='Default')
    total_price = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.quantity}x {self.product_name} in #{self.order.order_number}"


class Review(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='reviews')
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    author_name = models.CharField(max_length=100)
    rating = models.PositiveIntegerField(default=5)
    title = models.CharField(max_length=150, blank=True)
    comment = models.TextField()
    is_verified_buyer = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Review by {self.author_name} for {self.product.name} ({self.rating}★)"


class Wishlist(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='wishlist_items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'product')
        ordering = ['-added_at']

    def __str__(self):
        return f"{self.user.username}'s wishlist item: {self.product.name}"
