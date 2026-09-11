# 📱 Greenline Mobile Store - Cross-Platform Mobile App (Android & iOS)

A complete cross-platform mobile shopping application built for **Android** and **iOS** with **Razorpay Payment Gateway Integration**, door-step delivery scheduling, and live tracking.

---

## 🌟 Key Features

1. **Native Android & iOS Support (React Native & Expo)**
   - Single codebase that runs natively on **Android (Google Play / APK / AAB)** and **iOS (Apple App Store / TestFlight / Simulator)**.
   - Signature **Emerald Green & White texture** design system matching the web store.
   - **Indian Store Branding**: `🇮🇳 INDIA` emblem, all prices formatted in Indian Rupees (`₹`), helpline: `+91 1234567890`.

2. **Flagship Catalog & Search**
   - Official smartphone brands: **Apple**, **Samsung**, **OnePlus**, **Google Pixel**, **Nothing**, **Xiaomi**, **Vivo**.
   - Instant live search & filtering (5G flagships, RAM options: 8GB/12GB/16GB, Storage: 128GB/256GB/512GB/1TB).
   - High-res photo galleries, specs pill breakdown (Snapdragon 8 Gen 3, 200MP camera, AMOLED 120Hz).

3. **Dedicated Shopping Cart & Coupons**
   - Dynamic free delivery meter (`₹25,000` free shipping threshold).
   - Instant promo coupons (`GREEN10` for 10% off).
   - Color & storage variant selectors.

4. **Doorstep Delivery Scheduling**
   - Choose exact delivery date and time slots:
     - 🌅 Morning Slot (09:00 AM - 01:00 PM)
     - ☀️ Afternoon Slot (01:00 PM - 05:00 PM)
     - 🌆 Evening Slot (05:00 PM - 09:00 PM)
     - ⚡ Express Priority (Within 3 Hours)

5. **Razorpay Payment Gateway Integration**
   - Supports **UPI** (Google Pay, PhonePe, Paytm, BHIM, CRED), **Credit/Debit Cards**, **NetBanking**, and **Cash on Delivery (COD)**.
   - Built-in test sandbox payment simulator and live webhook verification with signature validation.

6. **Live Fulfillment Tracking Timeline**
   - Real-time order progress: `Placed` ➔ `Scheduled` ➔ `Processing` ➔ `Shipped` ➔ `Out for Delivery` ➔ `Delivered`.
   - Courier AWB tracking ID assignment and one-click order sharing.

---

## 🚀 How to Run the Mobile App

### Prerequisites
1. Ensure your Django backend server is running:
   ```cmd
   .\run_server.bat
   ```
2. Install **Node.js (LTS)** from [https://nodejs.org/](https://nodejs.org/) (if not already installed).

---

### Step 1: Launch with One-Click Script
In your project folder, double-click:
```cmd
run_mobile_app.bat
```
*Or via terminal:*
```bash
cd mobile_app
npm install
npx expo start
```

---

### Step 2: Choose Your Target Device

Once the terminal server is running:
- **Run on Android Emulator**:
  - Press `a` in the terminal.
  - Make sure Android Studio emulator is running. It connects automatically via `http://10.0.2.2:8000`.
- **Run on Physical Android Phone**:
  - Install **Expo Go** from Google Play Store on your phone.
  - Scan the QR code shown in the terminal.
  - *(Ensure your phone and PC are connected to the same Wi-Fi)*.
- **Run on iPhone / iOS Simulator**:
  - Install **Expo Go** from Apple App Store on your iPhone.
  - Open Camera app and scan the QR code to open directly.
- **Run on Web Preview**:
  - Press `w` in the terminal to open the app inside your browser.

---

## 🛠️ Building Standalone Android APK / iOS App

To build standalone release packages using Expo EAS:
```bash
cd mobile_app

# Install EAS CLI
npm install -g eas-cli

# Build Android APK directly
eas build -p android --profile preview

# Build iOS App
eas build -p ios --profile preview
```

---

## 📡 REST API Endpoints in Django

The mobile application connects to these newly added REST API routes in `store/api.py`:
- `GET  /api/home/` - Homepage flagship highlights, brands, deals
- `GET  /api/products/` - Catalog list with multi-facet filters & search
- `GET  /api/products/<slug>/` - Smartphone specifications & photo gallery
- `GET  /api/cart/` - Current shopping cart summary
- `POST /api/cart/add/` - Add phone with color & storage variant
- `POST /api/cart/update/` - Update quantity (+ / -)
- `POST /api/cart/remove/` - Remove item
- `POST /api/cart/coupon/` - Validate and apply promo code
- `POST /api/checkout/create-order/` - Generate order and Razorpay order ID (in paise)
- `POST /api/payment/verify/` - Verify Razorpay HMAC signature & capture payment
- `GET  /api/orders/<order_number>/` - Live order status & delivery tracking
