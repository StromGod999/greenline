export interface Brand {
  id: number;
  name: string;
  slug: string;
  logo_url: string;
  products_count?: number;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  icon: string;
}

export interface ProductSpecs {
  ram?: string;
  storage?: string;
  processor?: string;
  display?: string;
  camera_rear?: string;
  camera_front?: string;
  battery?: string;
  operating_system?: string;
  network?: string;
  colors?: string[];
  weight?: string;
  warranty?: string;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  brand: Brand | null;
  category: Category | null;
  price: number;
  discount_price: number | null;
  current_price: number;
  discount_percentage: number;
  stock: number;
  in_stock: boolean;
  image_url: string;
  short_description: string;
  description: string;
  rating: number;
  reviews_count: number;
  is_featured: boolean;
  is_trending: boolean;
  is_5g: boolean;
  specs: ProductSpecs;
  gallery?: string[];
  reviews?: Review[];
  related_products?: Product[];
}

export interface Review {
  id: number;
  author_name: string;
  rating: number;
  title: string;
  comment: string;
  is_verified: boolean;
  date: string;
}

export interface CartItem {
  id: number;
  product_id: number;
  name: string;
  brand: string;
  image_url: string;
  unit_price: number;
  quantity: number;
  color: string;
  storage: string;
  total_price: number;
  stock: number;
}

export interface CartSummary {
  items: CartItem[];
  item_count: number;
  subtotal: number;
  discount_amount: number;
  discount_percent: number;
  coupon_applied: string | null;
  shipping_charge: number;
  free_shipping_threshold: number;
  free_shipping_remaining: number;
  shipping_progress: number;
  total: number;
  session_key?: string;
}

export interface OrderCheckoutData {
  full_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  order_notes?: string;
  scheduled_date: string;
  delivery_time_slot: string;
  schedule_notes?: string;
  payment_method: 'razorpay' | 'cod';
  coupon_code?: string;
}

export interface CreatedOrderResponse {
  status: string;
  order: {
    order_number: string;
    total_amount: number;
    amount_in_paise: number;
    currency: string;
    scheduled_date: string;
    delivery_time_slot: string;
    payment_method: string;
    payment_status: string;
    razorpay_order_id: string;
    razorpay_key_id: string;
    customer: {
      name: string;
      email: string;
      phone: string;
    };
  };
}

export interface OrderDetail {
  order_number: string;
  full_name: string;
  phone: string;
  email: string;
  address: string;
  scheduled_date: string;
  delivery_time_slot: string;
  schedule_notes: string;
  subtotal: number;
  discount_amount: number;
  shipping_charge: number;
  total_amount: number;
  payment_method: string;
  payment_status: string;
  order_status: string;
  tracking_number: string;
  dispatch_notes: string;
  timeline: {
    id: string;
    title: string;
    desc: string;
    completed: boolean;
    active: boolean;
  }[];
  items: {
    id: number;
    name: string;
    image_url: string;
    price: number;
    quantity: number;
    color: string;
    storage: string;
    total_price: number;
  }[];
}
