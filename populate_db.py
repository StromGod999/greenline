#!/usr/bin/env python
"""
Database Seeder Script for Greenline Mobile Store India
Populates brands, categories, real-world flagship smartphones with Indian Rupee (₹) pricing,
specifications, coupons, sample scheduled delivery orders, and admin/customer accounts.
"""
import os
import sys
import django
from datetime import date, timedelta
from decimal import Decimal

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mobilestore.settings')
django.setup()

from django.contrib.auth.models import User
from django.utils.text import slugify
from store.models import (
    Brand, Category, Product, ProductSpecification, ProductImage,
    Coupon, Order, OrderItem, Review
)

def run_seed():
    print("🌿 Starting Greenline Mobile Store India Database Seeder (₹ INR)...")

    # 1. Superuser & Demo User
    admin_user, created = User.objects.get_or_create(username='admin')
    if created:
        admin_user.set_password('admin123')
        admin_user.is_superuser = True
        admin_user.is_staff = True
        admin_user.email = 'admin@greenlinemobiles.in'
        admin_user.first_name = 'Store'
        admin_user.last_name = 'Manager'
        admin_user.save()
        print("✓ Created Superuser: admin / admin123")
    else:
        admin_user.set_password('admin123')
        admin_user.is_superuser = True
        admin_user.is_staff = True
        admin_user.save()

    demo_user, created = User.objects.get_or_create(username='customer')
    if created:
        demo_user.set_password('customer123')
        demo_user.email = 'customer@example.com'
        demo_user.first_name = 'Rahul'
        demo_user.last_name = 'Sharma'
        demo_user.save()
        print("✓ Created Demo User: customer / customer123")

    # 2. Brands
    brands_data = [
        {"name": "Apple", "logo_url": "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=100&auto=format&fit=crop&q=60", "desc": "Innovating the future with iOS and titanium craft."},
        {"name": "Samsung", "logo_url": "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=100&auto=format&fit=crop&q=60", "desc": "Galaxy AI flagships and revolutionizing foldable displays."},
        {"name": "OnePlus", "logo_url": "https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=100&auto=format&fit=crop&q=60", "desc": "Never Settle. Fast & Smooth performance with Hasselblad cameras."},
        {"name": "Google", "logo_url": "https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?w=100&auto=format&fit=crop&q=60", "desc": "The power of Google AI, Tensor chips, and pro computational photography."},
        {"name": "Nothing", "logo_url": "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=100&auto=format&fit=crop&q=60", "desc": "Transparent tech, Glyph lighting interface, and pure clean OS."},
        {"name": "Xiaomi", "logo_url": "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=100&auto=format&fit=crop&q=60", "desc": "Leica optical mastery and ultra-fast 120W charging."},
        {"name": "Vivo", "logo_url": "https://images.unsplash.com/photo-1580910051074-3eb694886505?w=100&auto=format&fit=crop&q=60", "desc": "ZEISS co-engineered portrait & telephoto camera champions."},
        {"name": "Realme", "logo_url": "https://images.unsplash.com/photo-1575695342320-d2d2d2f9b73f?w=100&auto=format&fit=crop&q=60", "desc": "Dare to leap with flagship killers and elite gaming cooling."},
    ]

    brand_objs = {}
    for b in brands_data:
        obj, _ = Brand.objects.get_or_create(
            name=b["name"],
            defaults={"slug": slugify(b["name"]), "logo_url": b["logo_url"], "description": b["desc"], "is_featured": True}
        )
        brand_objs[b["name"]] = obj

    # 3. Categories
    categories_data = [
        {"name": "Flagship 5G Mobiles", "icon": "fa-bolt", "desc": "Top-tier processors, titanium bodies, and 200MP sensors."},
        {"name": "Foldable & Flip Phones", "icon": "fa-book-open", "desc": "Dual screen multitasking and flexible OLED innovations."},
        {"name": "Gaming & Performance", "icon": "fa-gamepad", "desc": "144Hz high refresh displays with liquid cooling chambers."},
        {"name": "Budget & Value Flagships", "icon": "fa-tag", "desc": "Maximum specs and battery endurance at affordable pricing."},
    ]

    cat_objs = {}
    for c in categories_data:
        obj, _ = Category.objects.get_or_create(
            name=c["name"],
            defaults={"slug": slugify(c["name"]), "icon": c["icon"], "description": c["desc"]}
        )
        cat_objs[c["name"]] = obj

    # 4. Coupons in Indian Rupees (₹)
    Coupon.objects.update_or_create(
        code="GREEN10",
        defaults={
            "discount_percent": 10,
            "max_discount_amount": Decimal("5000.00"),
            "min_order_amount": Decimal("15000.00"),
            "active": True
        }
    )
    Coupon.objects.update_or_create(
        code="WELCOME500",
        defaults={
            "discount_percent": 15,
            "max_discount_amount": Decimal("8000.00"),
            "min_order_amount": Decimal("25000.00"),
            "active": True
        }
    )

    # 5. Products & Tech Specs in ₹ INR
    products_seed = [
        {
            "name": "Galaxy S24 Ultra 5G",
            "brand": "Samsung",
            "category": "Flagship 5G Mobiles",
            "price": Decimal("129999.00"),
            "discount_price": Decimal("114999.00"),
            "stock": 18,
            "is_featured": True,
            "is_trending": True,
            "rating": Decimal("4.9"),
            "reviews_count": 84,
            "image_url": "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=800&auto=format&fit=crop&q=80",
            "short_description": 'Galaxy AI • 200MP Quad Zoom • Snapdragon 8 Gen 3 for Galaxy • 6.8" 120Hz Titanium',
            "description": "Meet Galaxy S24 Ultra, the ultimate form of Galaxy Ultra with a new titanium exterior and a 6.8-inch flat display. Galaxy AI is here, featuring Live Translate, Note Assist, Circle to Search with Google, and ProVisual Engine.",
            "specs": {
                "ram": "12 GB", "storage": "512 GB", "processor": "Snapdragon 8 Gen 3 (4nm) Galaxy Edition",
                "display": '6.8" Dynamic AMOLED 2X, 120Hz, HDR10+, 2600 nits Corning Armor Glass',
                "camera_rear": "200 MP (wide) + 50 MP (periscope 5x) + 10 MP (telephoto 3x) + 12 MP (ultrawide)",
                "camera_front": "12 MP Dual Pixel PDAF 4K 60fps",
                "battery": "5000 mAh with 45W Fast Charging & 15W Wireless Charging",
                "operating_system": "Android 14, One UI 6.1 with 7 Years OS Updates",
                "network": "5G SA/NSA Dual SIM, Wi-Fi 7, Bluetooth 5.3, UWB",
                "colors": "Titanium Green, Titanium Gray, Titanium Black, Titanium Violet",
                "weight": "232g", "warranty": "1 Year Samsung India Official Warranty"
            }
        },
        {
            "name": "iPhone 15 Pro Max",
            "brand": "Apple",
            "category": "Flagship 5G Mobiles",
            "price": Decimal("149900.00"),
            "discount_price": Decimal("134900.00"),
            "stock": 14,
            "is_featured": True,
            "is_trending": True,
            "rating": Decimal("4.9"),
            "reviews_count": 112,
            "image_url": "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&auto=format&fit=crop&q=80",
            "short_description": "Titanium Design • A17 Pro Chip • 5x Optical Telephoto • Action Button • USB-C",
            "description": "iPhone 15 Pro Max. Forged in aerospace-grade titanium and featuring the groundbreaking A17 Pro chip, customizable Action button, and 5x optical telephoto zoom.",
            "specs": {
                "ram": "8 GB", "storage": "256 GB", "processor": "Apple A17 Pro Bionic (3nm)",
                "display": '6.7" Super Retina XDR OLED, 120Hz ProMotion, Dynamic Island, 2000 nits',
                "camera_rear": "48 MP Main OIS + 12 MP 5x Telephoto + 12 MP Ultra-Wide 120°",
                "camera_front": "12 MP TrueDepth Camera with Photonic Engine",
                "battery": "4422 mAh with 29W Fast Charge & MagSafe 15W",
                "operating_system": "iOS 17 (Upgradable to iOS 18+)",
                "network": "5G Dual eSIM, Wi-Fi 6E, Bluetooth 5.3, Thread Support",
                "colors": "Natural Titanium, Emerald Green Finish, Black Titanium, White Titanium",
                "weight": "221g", "warranty": "1 Year Apple India Warranty + AppleCare Available"
            }
        },
        {
            "name": "OnePlus 12 5G",
            "brand": "OnePlus",
            "category": "Flagship 5G Mobiles",
            "price": Decimal("69999.00"),
            "discount_price": Decimal("64999.00"),
            "stock": 22,
            "is_featured": True,
            "is_trending": True,
            "rating": Decimal("4.8"),
            "reviews_count": 65,
            "image_url": "https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=800&auto=format&fit=crop&q=80",
            "short_description": "4th Gen Hasselblad • Snapdragon 8 Gen 3 • 5400mAh 100W Flash • Flowy Emerald Glass",
            "description": "The OnePlus 12 redefines the flagship standard with Snapdragon 8 Gen 3, up to 16GB LPDDR5X RAM, 2K 120Hz ProXDR display, and 4th Gen Hasselblad Camera System.",
            "specs": {
                "ram": "16 GB", "storage": "512 GB", "processor": "Qualcomm Snapdragon 8 Gen 3 (4nm)",
                "display": '6.82" 2K 120Hz ProXDR LTPO AMOLED, 4500 nits peak brightness',
                "camera_rear": "50 MP Sony LYT-808 OIS + 64 MP 3x Periscope OIS + 48 MP Ultra-Wide",
                "camera_front": "32 MP Sony IMX615 4K 30fps",
                "battery": "5400 mAh with 100W SUPERVOOC + 50W AIRVOOC Wireless",
                "operating_system": "OxygenOS 14 based on Android 14",
                "network": "5G SA/NSA Dual SIM, Wi-Fi 7, Bluetooth 5.4, IR Blaster",
                "colors": "Flowy Emerald, Silky Black, Glacial White",
                "weight": "220g", "warranty": "1 Year Official India Warranty + Red Cable Club"
            }
        },
        {
            "name": "Google Pixel 8 Pro",
            "brand": "Google",
            "category": "Flagship 5G Mobiles",
            "price": Decimal("89999.00"),
            "discount_price": Decimal("79999.00"),
            "stock": 16,
            "is_featured": True,
            "is_trending": False,
            "rating": Decimal("4.8"),
            "reviews_count": 58,
            "image_url": "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800&auto=format&fit=crop&q=80",
            "short_description": "Google Tensor G3 • Best Take AI • Temperature Sensor • 50MP Pro Camera • 7 Yrs Updates",
            "description": "Pixel 8 Pro is the all-pro phone engineered by Google; it's super fast, secure, and has the best Pixel Camera yet with Next-Gen Magic Editor and 7 years of Feature Drops.",
            "specs": {
                "ram": "12 GB", "storage": "256 GB", "processor": "Google Tensor G3 with Titan M2 Co-processor",
                "display": '6.7" Super Actua LTPO OLED (1-120Hz), 2400 nits, Gorilla Glass Victus 2',
                "camera_rear": "50 MP Octa PD Main + 48 MP Quad PD Ultrawide + 48 MP 5x Telephoto",
                "camera_front": "10.5 MP Dual PD Selfie with Autofocus",
                "battery": "5050 mAh with 30W Fast Charging & Qi Wireless",
                "operating_system": "Pure Android 14 with 7 Years Android OS & Security Upgrades",
                "network": "5G Sub-6 & mmWave, Wi-Fi 7, Bluetooth 5.3, Built-in Temp Sensor",
                "colors": "Mint Green, Bay Blue, Obsidian Black, Porcelain",
                "weight": "213g", "warranty": "1 Year Google India Warranty"
            }
        },
        {
            "name": "Nothing Phone (2) 5G",
            "brand": "Nothing",
            "category": "Flagship 5G Mobiles",
            "price": Decimal("44999.00"),
            "discount_price": Decimal("38999.00"),
            "stock": 20,
            "is_featured": False,
            "is_trending": True,
            "rating": Decimal("4.7"),
            "reviews_count": 42,
            "image_url": "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&auto=format&fit=crop&q=80",
            "short_description": "Glyph Interface LED • Snapdragon 8+ Gen 1 • Nothing OS 2.5 • Dual 50MP Sony Sensors",
            "description": "Phone (2) prioritizes mindful tech usage with the interactive Glyph Interface, monochrome design aesthetics, 50MP dual rear cameras, and ultra-smooth Nothing OS.",
            "specs": {
                "ram": "12 GB", "storage": "256 GB", "processor": "Qualcomm Snapdragon 8+ Gen 1 (4nm)",
                "display": '6.7" Flexible LTPO OLED, 120Hz, 1600 nits, HDR10+',
                "camera_rear": "50 MP Sony IMX890 OIS + 50 MP Samsung JN1 Ultrawide 114°",
                "camera_front": "32 MP Sony IMX615",
                "battery": "4700 mAh with 45W PPS Fast Charging & 15W Wireless",
                "operating_system": "Nothing OS 2.5 powered by Android 14",
                "network": "5G Dual SIM, Wi-Fi 6, Bluetooth 5.3, 33-Zone Glyph LEDs",
                "colors": "Dark Gray, White, Special Emerald Edition",
                "weight": "201g", "warranty": "1 Year Official India Warranty"
            }
        },
        {
            "name": "Samsung Galaxy Z Fold 5 5G",
            "brand": "Samsung",
            "category": "Foldable & Flip Phones",
            "price": Decimal("164999.00"),
            "discount_price": Decimal("149999.00"),
            "stock": 8,
            "is_featured": True,
            "is_trending": False,
            "rating": Decimal("4.8"),
            "reviews_count": 39,
            "image_url": "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&auto=format&fit=crop&q=80",
            "short_description": '7.6" Main Dynamic AMOLED 2X • Flex Hinge Zero Gap • Taskbar Multitasking • S-Pen',
            "description": "Unfold an expansive 7.6-inch screen that lets you game and multitask like a PC. Powered by Snapdragon 8 Gen 2 for Galaxy with IPX8 water resistance.",
            "specs": {
                "ram": "12 GB", "storage": "512 GB", "processor": "Snapdragon 8 Gen 2 for Galaxy",
                "display": '7.6" QXGA+ Dynamic AMOLED 2X 120Hz + 6.2" Cover Screen',
                "camera_rear": "50 MP Dual Pixel OIS + 10 MP 3x Telephoto + 12 MP Ultrawide",
                "camera_front": "4 MP Under-Display + 10 MP Cover Camera",
                "battery": "4400 mAh Dual Battery with 25W Fast Charging",
                "operating_system": "Android 14, One UI 6.1 with Flex Mode",
                "network": "5G Dual SIM, Wi-Fi 6E, Bluetooth 5.3",
                "colors": "Icy Blue, Phantom Black, Cream, Emerald Tint",
                "weight": "253g", "warranty": "1 Year Samsung Care+ India"
            }
        },
        {
            "name": "Xiaomi 14 Ultra 5G",
            "brand": "Xiaomi",
            "category": "Flagship 5G Mobiles",
            "price": Decimal("109999.00"),
            "discount_price": Decimal("99999.00"),
            "stock": 10,
            "is_featured": False,
            "is_trending": True,
            "rating": Decimal("4.9"),
            "reviews_count": 31,
            "image_url": "https://images.unsplash.com/photo-1575695342320-d2d2d2f9b73f?w=800&auto=format&fit=crop&q=80",
            "short_description": "Leica 1-inch Quad 50MP System • Snapdragon 8 Gen 3 • 90W HyperCharge • Vegan Leather",
            "description": "The Pinnacle of Optical Mobile Photography co-engineered with Leica. Features a true 1-inch LYT-900 sensor with stepless variable aperture and Xiaomi Shield Glass.",
            "specs": {
                "ram": "16 GB", "storage": "512 GB", "processor": "Snapdragon 8 Gen 3 (4nm)",
                "display": '6.73" WQHD+ AMOLED 120Hz LTPO, 3000 nits, Dolby Vision',
                "camera_rear": "50 MP 1-inch LYT-900 Variable Aperture + 50 MP 3.2x Tele + 50 MP 5x Periscope + 50 MP Ultrawide",
                "camera_front": "32 MP 4K 60fps Selfie",
                "battery": "5000 mAh with 90W HyperCharge + 80W Wireless",
                "operating_system": "Xiaomi HyperOS based on Android 14",
                "network": "5G Dual SIM, Wi-Fi 7, Bluetooth 5.4",
                "colors": "Titanium Black, White Vegan Leather, Jade Green",
                "weight": "224g", "warranty": "1 Year Official India Warranty"
            }
        },
        {
            "name": "Vivo X100 Pro 5G",
            "brand": "Vivo",
            "category": "Flagship 5G Mobiles",
            "price": Decimal("94999.00"),
            "discount_price": Decimal("89999.00"),
            "stock": 12,
            "is_featured": True,
            "is_trending": False,
            "rating": Decimal("4.8"),
            "reviews_count": 28,
            "image_url": "https://images.unsplash.com/photo-1580910051074-3eb694886505?w=800&auto=format&fit=crop&q=80",
            "short_description": "ZEISS APO Floating Telephoto • Dimensity 9300 • V3 Imaging Chip • 100W FlashCharge",
            "description": "The camera powerhouse equipped with ZEISS APO certified floating telephoto lens, Dimensity 9300 octa-core flagship processor, and custom Vivo V3 ISP.",
            "specs": {
                "ram": "16 GB", "storage": "512 GB", "processor": "MediaTek Dimensity 9300 (4nm) + Vivo V3 Chip",
                "display": '6.78" 1.5K 120Hz 8T LTPO AMOLED, 3000 nits, 2160Hz PWM Dimming',
                "camera_rear": "50 MP ZEISS 1-inch IMX989 OIS + 50 MP ZEISS APO Telephoto + 50 MP Ultra-wide",
                "camera_front": "32 MP HDR Portrait Camera",
                "battery": "5400 mAh with 100W FlashCharge + 50W Wireless",
                "operating_system": "Funtouch OS 14 / OriginOS based on Android 14",
                "network": "5G Dual SIM, Wi-Fi 7, Bluetooth 5.4, IP68 Waterproof",
                "colors": "Asteroid Black, Sunset Orange, Emerald Green",
                "weight": "225g", "warranty": "1 Year Vivo India Brand Warranty"
            }
        },
    ]

    for pdata in products_seed:
        specs_data = pdata.pop("specs")
        brand_name = pdata.pop("brand")
        cat_name = pdata.pop("category")

        product, _ = Product.objects.update_or_create(
            name=pdata["name"],
            defaults={
                "slug": slugify(pdata["name"]),
                "brand": brand_objs[brand_name],
                "category": cat_objs[cat_name],
                **pdata
            }
        )

        ProductSpecification.objects.update_or_create(
            product=product,
            defaults=specs_data
        )

        # Add sample review
        Review.objects.get_or_create(
            product=product,
            author_name="Aditya Verma",
            defaults={
                "rating": 5,
                "title": "Super fast delivery on scheduled time slot!",
                "comment": f"Got my {product.name} delivered right on schedule via Greenline delivery slot in Mumbai. 100% authentic seal and smooth Razorpay UPI payment!",
                "is_verified_buyer": True
            }
        )

    # 6. Create Demo Scheduled Orders in INR for the Admin Dashboard
    tomorrow = date.today() + timedelta(days=1)
    day_after = date.today() + timedelta(days=2)

    sample_orders = [
        {
            "order_number": "GPM-2026-001",
            "user": demo_user,
            "full_name": "Aarav Patel",
            "email": "aarav.patel@example.com",
            "phone": "+91 1234567890",
            "address": "402, Emerald Heights, MG Road, Nariman Point",
            "city": "Mumbai",
            "state": "Maharashtra",
            "pincode": "400021",
            "scheduled_date": date.today(),
            "delivery_time_slot": "09:00 AM - 01:00 PM",
            "schedule_notes": "Call upon arrival at tower gate B.",
            "subtotal": Decimal("114999.00"),
            "discount_amount": Decimal("5000.00"),
            "shipping_charge": Decimal("0.00"),
            "total_amount": Decimal("109999.00"),
            "coupon_applied": "GREEN10",
            "payment_method": "razorpay",
            "payment_status": "Paid",
            "razorpay_order_id": "order_rzp_mock_001",
            "razorpay_payment_id": "pay_rzp_mock_001",
            "razorpay_signature": "sandbox_signature_verified",
            "order_status": "Out for Delivery",
            "tracking_number": "GP-MUM-9921",
            "dispatch_notes": "Out for delivery in Morning slot with BlueDart courier."
        },
        {
            "order_number": "GPM-2026-002",
            "user": demo_user,
            "full_name": "Pooja Reddy",
            "email": "pooja.reddy@example.com",
            "phone": "+91 9876543210",
            "address": "78, Koramangala 4th Block, 80 Feet Road",
            "city": "Bengaluru",
            "state": "Karnataka",
            "pincode": "560034",
            "scheduled_date": tomorrow,
            "delivery_time_slot": "01:00 PM - 05:00 PM",
            "schedule_notes": "Deliver at tech park security desk.",
            "subtotal": Decimal("134900.00"),
            "discount_amount": Decimal("0.00"),
            "shipping_charge": Decimal("0.00"),
            "total_amount": Decimal("134900.00"),
            "payment_method": "razorpay",
            "payment_status": "Paid",
            "razorpay_order_id": "order_rzp_mock_002",
            "razorpay_payment_id": "pay_rzp_mock_002",
            "razorpay_signature": "sandbox_signature_verified",
            "order_status": "Scheduled",
            "tracking_number": "GP-BLR-4412",
            "dispatch_notes": "Package staged in warehouse shelf B-4."
        },
        {
            "order_number": "GPM-2026-003",
            "user": None,
            "full_name": "Vikram Singh",
            "email": "vikram.s@example.com",
            "phone": "+91 9123456780",
            "address": "B-14, Connaught Place, Inner Circle",
            "city": "New Delhi",
            "state": "Delhi",
            "pincode": "110001",
            "scheduled_date": day_after,
            "delivery_time_slot": "05:00 PM - 09:00 PM",
            "schedule_notes": "Call before arrival.",
            "subtotal": Decimal("64999.00"),
            "discount_amount": Decimal("5000.00"),
            "shipping_charge": Decimal("0.00"),
            "total_amount": Decimal("59999.00"),
            "coupon_applied": "GREEN10",
            "payment_method": "cod",
            "payment_status": "Pending",
            "order_status": "Scheduled",
            "tracking_number": "GP-DEL-8812",
            "dispatch_notes": "COD Order - collect ₹59,999 upon delivery."
        }
    ]

    p1 = Product.objects.first()
    for odata in sample_orders:
        ord_obj, o_created = Order.objects.update_or_create(
            order_number=odata["order_number"],
            defaults=odata
        )
        if o_created and p1:
            OrderItem.objects.create(
                order=ord_obj,
                product=p1,
                product_name=p1.name,
                product_image_url=p1.get_image_url(),
                price=p1.get_current_price(),
                quantity=1,
                color="Emerald Green",
                storage="512 GB",
                total_price=p1.get_current_price()
            )

    print("🎉 Database successfully seeded with flagship smartphones (₹ INR), Indian store details, coupons, and scheduled orders!")
    print("---------------------------------------------------------------")
    print("📞 Store Helpline:        +91 1234567890")
    print("🔑 Admin Credentials:     admin / admin123")
    print("👤 Demo User Credentials: customer / customer123")
    print("🎟️ Promo Coupons:         GREEN10 (10% off up to ₹5,000)")
    print("---------------------------------------------------------------")

if __name__ == '__main__':
    run_seed()
