# 📱 GreenPulse Mobile Store - Python Django E-Commerce Platform

A flagship, modern **Online Mobile Store** built with **Python & Django**, designed with a **Green & White luxury texture theme** (Emerald Green, Mint Frost, and Clean White), dedicated Cart management, integrated **Razorpay Secure Payment Gateway**, interactive **Order Delivery Scheduling**, and a **Custom Admin Management & Dispatch Portal**.

---

## ✨ Key Features

### 1. 🎨 Emerald Green & Clean White Aesthetic
- Luxury color palette: Emerald Green (`#10B981`, `#059669`), Deep Forest (`#064E3B`), Mint Frost (`#ECFDF5`), and Crisp White (`#FFFFFF`).
- Glassmorphic navigation bar with live cart counter badge, search auto-focus, brand dropdown, and category shortcuts.
- Micro-interactions, phone floating animations, floating 5G badges, and rating stars.

### 2. 📲 Smartphone Catalog & Filtering
- Multi-faceted sidebar filter: **5G toggle**, **Brand multi-select** (Apple, Samsung, OnePlus, Google, Xiaomi, Nothing, Vivo, Realme), **RAM** (8GB, 12GB, 16GB), **Storage** (128GB, 256GB, 512GB, 1TB), and **Price Range slider**.
- Product detail pages with multi-image gallery thumbnail switcher, color swatch selector, storage variant selector, in-depth technical specifications grid, stock counter, and customer star rating & reviews system.
- Customer Wishlist (AJAX instant heart toggle).

### 3. 🛒 Dedicated Shopping Cart Page (`/cart/`)
- Distinct dedicated cart experience.
- Free Express Shipping progress meter ($500 threshold).
- Instant quantity modifier (+ / - buttons) with subtotal and item total recalculation.
- Promo coupon discount box (Pre-loaded with `GREEN10` for 10% off and `WELCOME500` for 15% off).

### 4. 📅 Order Delivery Scheduling & Tracking
- **Doorstep Delivery Scheduler**: Select your preferred delivery date and time slot:
  - 🌅 **Morning Slot** (09:00 AM - 01:00 PM)
  - ☀️ **Afternoon Slot** (01:00 PM - 05:00 PM)
  - 🌙 **Evening Slot** (05:00 PM - 09:00 PM)
  - ⚡ **Express Same-Day Priority Dispatch** (Within 3 Hours)
- Add gate / door delivery instructions.
- Visual step-by-step order tracking timeline: `Placed` ➔ `Scheduled` ➔ `Processing` ➔ `Shipped` ➔ `Out for Delivery` ➔ `Delivered`.
- Tax invoice generator with 1-click printable / PDF receipt.

### 5. 💳 Razorpay Payment Gateway Integration
- Secure checkout supporting **Razorpay Standard Checkout** as well as a high-fidelity **interactive test sandbox modal** (Cards, UPI / QR, Netbanking).
- Support for Cash on Delivery (COD) and signature verification.

### 7. 📱 Cross-Platform Mobile App for Android & iOS (`mobile_app/`)
- Native **Android APK** & **iOS** application built with React Native & Expo.
- Complete feature parity: Flagship catalog, search, dedicated cart, promo coupons, doorstep delivery time slot scheduler, **Razorpay Payment Gateway** (UPI GPay/PhonePe, Cards, NetBanking), and live fulfillment timeline.
- One-click launcher: Run `run_mobile_app.bat`.

---

## 🚀 Quick Start Guide

### Option 1: One-Click Windows Batch (Easiest)
Double-click `run_server.bat` in the project folder. It will automatically apply migrations, populate sample smartphones, and start the development server.

### Option 2: Python Command Line
```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Run migrations
python manage.py makemigrations store
python manage.py migrate

# 3. Seed initial smartphones, categories, brands, coupons, and admin
python populate_db.py

# 4. Start the Django Server
python manage.py runserver 127.0.0.1:8000
```

---

## 🔑 Default Credentials

| Account Role | Username | Password | Purpose |
| :--- | :--- | :--- | :--- |
| **Store Super Admin** | `admin` | `admin123` | Access `/admin-dashboard/` and `/admin/` |
| **Demo Customer** | `customer` | `customer123` | Storefront orders & wishlist testing |

---

## 🎟️ Active Promo Coupons

- **`GREEN10`**: 10% Discount on all smartphone orders above $200.
- **`WELCOME500`**: 15% Discount on orders above $500.

---

## 📁 Project Structure

```
Store Of Mobile/
│
├── mobilestore/               # Django project settings & main router
│   ├── settings.py           # Configured apps, Razorpay settings, currencies
│   ├── urls.py               # Main URL endpoints
│   ├── wsgi.py
│   └── asgi.py
│
├── store/                     # Main E-Commerce Application
│   ├── models.py             # Product, Brand, Category, Order, Cart, Coupon, Specs
│   ├── views.py              # Catalog, Cart, Checkout, Razorpay, Admin Dashboard
│   ├── forms.py              # CheckoutForm, ReviewForm, RegisterForm
│   ├── admin.py              # Custom Django Admin panel
│   ├── urls.py               # Application URL routes
│   ├── utils.py              # Razorpay order creator & signature verification
│   └── context_processors.py # Global cart counter & store settings
│
├── templates/                 # Green & White Themed HTML Templates
│   ├── base.html             # Master layout with Navbar & Footer
│   ├── store/
│   │   ├── home.html         # Hero banner, featured phones, brand logos
│   │   ├── product_list.html # Catalog with multi-attribute filters & search
│   │   ├── product_detail.html# Specs table, gallery, variant selectors
│   │   ├── cart.html         # Dedicated Cart page with shipping progress
│   │   ├── checkout.html     # Shipping & Delivery Date/Slot scheduler
│   │   ├── razorpay_payment.html # Razorpay payment gateway & sandbox
│   │   ├── order_success.html# Order confirmation & celebratory screen
│   │   ├── order_tracking.html# Visual delivery timeline tracker
│   │   ├── invoice.html      # Tax invoice receipt (printable)
│   │   ├── wishlist.html     # Saved favorites
│   │   ├── profile.html      # Customer dashboard & active deliveries
│   │   └── admin_dashboard.html # Custom green admin & dispatch manager
│   └── auth/
│       ├── login.html        # Customer & admin sign in
│       └── register.html     # Customer registration
│
├── static/                    # Styling & Scripts
│   ├── css/custom-theme.css  # Emerald & Mint green + white texture styles
│   └── js/
│       ├── main.js           # AJAX cart, gallery switcher, toast triggers
│       └── razorpay-checkout.js # Razorpay payment gateway script
│
├── populate_db.py            # Automatic seed script with 12+ real flagships
├── requirements.txt          # Django, Pillow, razorpay
├── run_server.bat            # Windows 1-click launcher
├── start_server.py           # Python 1-click launcher
└── README.md
```
