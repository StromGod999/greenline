import { API_BASE_URL } from '../constants/config';
import {
  Product,
  CartSummary,
  OrderCheckoutData,
  CreatedOrderResponse,
  OrderDetail
} from '../types';

let currentSessionKey: string = '';

export const setSessionKey = (key: string) => {
  currentSessionKey = key;
};

export const getSessionKey = () => currentSessionKey;

const defaultHeaders = () => ({
  'Content-Type': 'application/json',
  'X-Session-Key': currentSessionKey,
});

export const ApiService = {
  // Fetch home screen data
  async getHome() {
    const res = await fetch(`${API_BASE_URL}/api/home/`, {
      headers: defaultHeaders(),
    });
    if (!res.ok) throw new Error(`Failed to fetch home: ${res.status}`);
    return await res.json();
  },

  // Fetch product catalog with filters
  async getProducts(params: Record<string, string | number | boolean> = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, String(val));
      }
    });

    const url = `${API_BASE_URL}/api/products/?${query.toString()}`;
    const res = await fetch(url, { headers: defaultHeaders() });
    if (!res.ok) throw new Error(`Failed to fetch products: ${res.status}`);
    return await res.json();
  },

  // Fetch phone detail
  async getProductDetail(slug: string): Promise<{ status: string; product: Product }> {
    const res = await fetch(`${API_BASE_URL}/api/products/${slug}/`, {
      headers: defaultHeaders(),
    });
    if (!res.ok) throw new Error(`Product not found`);
    return await res.json();
  },

  // Cart operations
  async getCart(couponCode?: string): Promise<{ status: string; cart: CartSummary }> {
    const url = `${API_BASE_URL}/api/cart/${couponCode ? `?coupon_code=${couponCode}` : ''}`;
    const res = await fetch(url, { headers: defaultHeaders() });
    if (!res.ok) throw new Error('Failed to get cart');
    const data = await res.json();
    if (data.cart?.session_key) {
      setSessionKey(data.cart.session_key);
    }
    return data;
  },

  async addToCart(productId: number, quantity = 1, color = 'Standard', storage = 'Default') {
    const res = await fetch(`${API_BASE_URL}/api/cart/add/`, {
      method: 'POST',
      headers: defaultHeaders(),
      body: JSON.stringify({ product_id: productId, quantity, color, storage }),
    });
    if (!res.ok) throw new Error('Failed to add to cart');
    const data = await res.json();
    if (data.cart?.session_key) {
      setSessionKey(data.cart.session_key);
    }
    return data;
  },

  async updateCartItem(itemId: number, action: 'increase' | 'decrease') {
    const res = await fetch(`${API_BASE_URL}/api/cart/update/`, {
      method: 'POST',
      headers: defaultHeaders(),
      body: JSON.stringify({ item_id: itemId, action }),
    });
    if (!res.ok) throw new Error('Failed to update item');
    return await res.json();
  },

  async removeCartItem(itemId: number) {
    const res = await fetch(`${API_BASE_URL}/api/cart/remove/`, {
      method: 'POST',
      headers: defaultHeaders(),
      body: JSON.stringify({ item_id: itemId }),
    });
    if (!res.ok) throw new Error('Failed to remove item');
    return await res.json();
  },

  async applyCoupon(couponCode: string) {
    const res = await fetch(`${API_BASE_URL}/api/cart/coupon/`, {
      method: 'POST',
      headers: defaultHeaders(),
      body: JSON.stringify({ coupon_code: couponCode }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to apply coupon');
    return data;
  },

  // Checkout & Razorpay
  async createOrder(orderData: OrderCheckoutData): Promise<CreatedOrderResponse> {
    const res = await fetch(`${API_BASE_URL}/api/checkout/create-order/`, {
      method: 'POST',
      headers: defaultHeaders(),
      body: JSON.stringify(orderData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to create order');
    return data;
  },

  async verifyPayment(payload: {
    order_number: string;
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    mock_payment?: boolean;
  }) {
    const res = await fetch(`${API_BASE_URL}/api/payment/verify/`, {
      method: 'POST',
      headers: defaultHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Payment verification failed');
    return data;
  },

  // Order Details & Live Tracking
  async getOrderDetail(orderNumber: string): Promise<{ status: string; order: OrderDetail }> {
    const res = await fetch(`${API_BASE_URL}/api/orders/${orderNumber}/`, {
      headers: defaultHeaders(),
    });
    if (!res.ok) throw new Error('Order not found');
    return await res.json();
  },
};
