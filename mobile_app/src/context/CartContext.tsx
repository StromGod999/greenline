import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartSummary } from '../types';
import { ApiService } from '../services/api';

interface CartContextType {
  cart: CartSummary | null;
  loading: boolean;
  refreshCart: () => Promise<void>;
  addToCart: (productId: number, quantity?: number, color?: string, storage?: string) => Promise<void>;
  updateQuantity: (itemId: number, action: 'increase' | 'decrease') => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
  applyCoupon: (code: string) => Promise<{ success: boolean; message: string }>;
  couponCode: string;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [couponCode, setCouponCode] = useState<string>('GREEN10');

  const refreshCart = async () => {
    try {
      setLoading(true);
      const res = await ApiService.getCart(couponCode);
      if (res.status === 'success') {
        setCart(res.cart);
      }
    } catch (err) {
      console.warn('Cart refresh notice:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshCart();
  }, []);

  const addToCart = async (productId: number, quantity = 1, color = 'Standard', storage = 'Default') => {
    try {
      setLoading(true);
      const res = await ApiService.addToCart(productId, quantity, color, storage);
      if (res.status === 'success') {
        setCart(res.cart);
      }
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId: number, action: 'increase' | 'decrease') => {
    try {
      const res = await ApiService.updateCartItem(itemId, action);
      if (res.status === 'success') {
        setCart(res.cart);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const removeItem = async (itemId: number) => {
    try {
      const res = await ApiService.removeCartItem(itemId);
      if (res.status === 'success') {
        setCart(res.cart);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const applyCoupon = async (code: string) => {
    try {
      const res = await ApiService.applyCoupon(code);
      if (res.status === 'success') {
        setCart(res.cart);
        setCouponCode(code);
        return { success: true, message: res.message };
      }
      return { success: false, message: 'Invalid coupon' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Coupon failed' };
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        refreshCart,
        addToCart,
        updateQuantity,
        removeItem,
        applyCoupon,
        couponCode,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};
