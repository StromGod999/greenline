import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * Automatically extracts your PC's actual local network IP from Expo manifest
 * so physical Android & iPhone devices seamlessly connect without manual IP configuration!
 */
export const getApiBaseUrl = (): string => {
  // Try getting host URI from Expo runtime (e.g. 192.168.1.X:8081)
  const hostUri = Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost || '';
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
      return `http://${ip}:8000`;
    }
  }

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8000';
  }
  return 'http://localhost:8000';
};

export const API_BASE_URL = getApiBaseUrl();

export const STORE_CONFIG = {
  name: 'GreenPulse Mobiles India',
  phone: '+91 1234567890',
  email: 'support@greenpulsemobiles.in',
  currency: '₹',
  currencyCode: 'INR',
  freeShippingThreshold: 25000,
  shippingCharge: 199,
  razorpayKeyId: 'rzp_test_TYrDpRiv6T2o3c',
};
