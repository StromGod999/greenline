import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Colors, FormatINR } from '../constants/theme';
import { Header } from '../components/Header';
import { useCart } from '../context/CartContext';
import { ApiService } from '../services/api';
import {
  Calendar,
  Clock,
  MapPin,
  CreditCard,
  Banknote,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react-native';

export const CheckoutScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { cart, couponCode } = useCart();

  // Contact & Address state
  const [fullName, setFullName] = useState('Aarav Sharma');
  const [phone, setPhone] = useState('+91 1234567890');
  const [email, setEmail] = useState('aarav.sharma@example.com');
  const [address, setAddress] = useState('Flat 402, Green Orchid Apartments, MG Road');
  const [city, setCity] = useState('Mumbai');
  const [state, setState] = useState('Maharashtra');
  const [pincode, setPincode] = useState('400001');
  const [gateNotes, setGateNotes] = useState('Call before arrival at Tower A');

  // Scheduling State
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowIso = tomorrow.toISOString().split('T')[0];

  const [scheduledDate, setScheduledDate] = useState(tomorrowIso);
  const [timeSlot, setTimeSlot] = useState('09:00 AM - 01:00 PM');
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'cod'>('razorpay');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const slotOptions = [
    { id: '09:00 AM - 01:00 PM', label: 'Morning Slot (9 AM - 1 PM)', icon: '🌅' },
    { id: '01:00 PM - 05:00 PM', label: 'Afternoon Slot (1 PM - 5 PM)', icon: '☀️' },
    { id: '05:00 PM - 09:00 PM', label: 'Evening Slot (5 PM - 9 PM)', icon: '🌆' },
    { id: 'Express Same-Day', label: '⚡ Priority Express (Within 3 Hours)', icon: '🚀' },
  ];

  const handlePlaceOrder = async () => {
    if (!fullName || !phone || !email || !address || !city || !state || !pincode) {
      Alert.alert('Missing Details', 'Please fill in all contact and shipping address fields.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await ApiService.createOrder({
        full_name: fullName,
        phone,
        email,
        address,
        city,
        state,
        pincode,
        scheduled_date: scheduledDate,
        delivery_time_slot: timeSlot,
        schedule_notes: gateNotes,
        payment_method: paymentMethod,
        coupon_code: couponCode,
      });

      if (res.status === 'success' && res.order) {
        if (paymentMethod === 'razorpay') {
          navigation.navigate('Payment', { order: res.order });
        } else {
          // COD Success
          navigation.navigate('OrderSuccess', {
            orderNumber: res.order.order_number,
            paymentMethod: 'Cash on Delivery (COD)',
            scheduledDate: res.order.scheduled_date,
            timeSlot: res.order.delivery_time_slot,
            totalAmount: res.order.total_amount,
          });
        }
      }
    } catch (err: any) {
      Alert.alert('Checkout Error', err.message || 'Unable to place order');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!cart) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header navigation={navigation} showBack title="Delivery Scheduling & Checkout" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* =========================================================
            DELIVERY SCHEDULING (Date & Slot Selector)
            ========================================================= */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Calendar size={18} color={Colors.primaryDark} />
            <Text style={styles.cardTitle}> Doorstep Delivery Scheduling</Text>
          </View>
          <Text style={styles.cardSub}>Select your preferred date & time slot for mobile delivery:</Text>

          {/* Quick Date Chips */}
          <View style={styles.datesRow}>
            {[1, 2, 3].map((offset) => {
              const d = new Date();
              d.setDate(d.getDate() + offset);
              const iso = d.toISOString().split('T')[0];
              const display = d.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });
              const isSelected = scheduledDate === iso;

              return (
                <TouchableOpacity
                  key={iso}
                  style={[styles.dateChip, isSelected && styles.dateChipActive]}
                  onPress={() => setScheduledDate(iso)}
                >
                  <Text style={[styles.dateDayText, isSelected && styles.dateDayTextActive]}>
                    {offset === 1 ? 'Tomorrow' : display}
                  </Text>
                  <Text style={[styles.dateSubText, isSelected && styles.dateSubTextActive]}>{iso}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Time Slot Selector */}
          <Text style={styles.inputLabel}>Choose Delivery Slot:</Text>
          <View style={styles.slotsCol}>
            {slotOptions.map((opt) => {
              const isSelected = timeSlot === opt.id;
              return (
                <TouchableOpacity
                  key={opt.id}
                  style={[styles.slotCard, isSelected && styles.slotCardActive]}
                  onPress={() => setTimeSlot(opt.id)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.slotEmoji}>{opt.icon}</Text>
                  <Text style={[styles.slotLabel, isSelected && styles.slotLabelActive]}>{opt.label}</Text>
                  {isSelected && <CheckCircle2 size={16} color={Colors.primaryDark} />}
                </TouchableOpacity>
              );
            })}
          </View>

          <TextInput
            style={styles.inputArea}
            placeholder="Special delivery instructions (e.g. Call at gate B, Leave with receptionist)"
            value={gateNotes}
            onChangeText={setGateNotes}
            multiline
          />
        </View>

        {/* =========================================================
            CONTACT & SHIPPING ADDRESS
            ========================================================= */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <MapPin size={18} color={Colors.primaryDark} />
            <Text style={styles.cardTitle}> Shipping Address (India)</Text>
          </View>

          <Text style={styles.inputLabel}>Full Name</Text>
          <TextInput style={styles.input} value={fullName} onChangeText={setFullName} placeholder="Aarav Sharma" />

          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.inputLabel}>Phone (WhatsApp)</Text>
              <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" />
            </View>
          </View>

          <Text style={styles.inputLabel}>Door / Flat / Street Address</Text>
          <TextInput style={styles.input} value={address} onChangeText={setAddress} placeholder="Address" />

          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 6 }}>
              <Text style={styles.inputLabel}>City</Text>
              <TextInput style={styles.input} value={city} onChangeText={setCity} />
            </View>
            <View style={{ flex: 1, marginRight: 6 }}>
              <Text style={styles.inputLabel}>State</Text>
              <TextInput style={styles.input} value={state} onChangeText={setState} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>Pincode</Text>
              <TextInput style={styles.input} value={pincode} onChangeText={setPincode} keyboardType="number-pad" />
            </View>
          </View>
        </View>

        {/* =========================================================
            PAYMENT METHOD SELECTION
            ========================================================= */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Select Payment Method</Text>

          {/* Razorpay Option */}
          <TouchableOpacity
            style={[styles.payMethodCard, paymentMethod === 'razorpay' && styles.payMethodActive]}
            onPress={() => setPaymentMethod('razorpay')}
            activeOpacity={0.8}
          >
            <CreditCard size={22} color={Colors.primaryDark} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <View style={styles.rowCenter}>
                <Text style={styles.payMethodName}>Razorpay Payment Gateway</Text>
                <View style={styles.rzpBadge}>
                  <Text style={styles.rzpBadgeText}>Instant & Secure</Text>
                </View>
              </View>
              <Text style={styles.payMethodSub}>UPI (Google Pay, PhonePe, Paytm), Cards, NetBanking</Text>
            </View>
            {paymentMethod === 'razorpay' && <CheckCircle2 size={18} color={Colors.primaryDark} />}
          </TouchableOpacity>

          {/* Cash on Delivery */}
          <TouchableOpacity
            style={[styles.payMethodCard, paymentMethod === 'cod' && styles.payMethodActive]}
            onPress={() => setPaymentMethod('cod')}
            activeOpacity={0.8}
          >
            <Banknote size={22} color="#64748B" />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.payMethodName}>Cash on Delivery (COD)</Text>
              <Text style={styles.payMethodSub}>Pay cash or QR at doorstep upon parcel arrival</Text>
            </View>
            {paymentMethod === 'cod' && <CheckCircle2 size={18} color={Colors.primaryDark} />}
          </TouchableOpacity>
        </View>

        {/* =========================================================
            ORDER FINANCIAL TOTAL
            ========================================================= */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryVal}>{FormatINR(cart.subtotal)}</Text>
          </View>
          {cart.discount_amount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: '#059669' }]}>Promo Discount</Text>
              <Text style={[styles.summaryVal, { color: '#059669', fontWeight: '700' }]}>
                -{FormatINR(cart.discount_amount)}
              </Text>
            </View>
          )}
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Scheduled Shipping</Text>
            <Text style={styles.summaryVal}>
              {cart.shipping_charge === 0 ? 'FREE' : FormatINR(cart.shipping_charge)}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Grand Total (₹)</Text>
            <Text style={styles.totalVal}>{FormatINR(cart.total)}</Text>
          </View>

          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handlePlaceOrder}
            disabled={isSubmitting}
            activeOpacity={0.88}
          >
            {isSubmitting ? (
              <ActivityIndicator color={Colors.surface} />
            ) : (
              <Text style={styles.submitBtnText}>
                {paymentMethod === 'razorpay' ? 'Proceed to Razorpay Payment' : 'Confirm Cash on Delivery'}
              </Text>
            )}
          </TouchableOpacity>

          <View style={styles.sslRow}>
            <ShieldCheck size={14} color={Colors.primaryDark} />
            <Text style={styles.sslText}>256-Bit SSL Encrypted & RBI Compliant</Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: {
    padding: 16,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  cardSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  datesRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  dateChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  dateChipActive: {
    backgroundColor: Colors.surfaceAlt,
    borderColor: Colors.primaryDark,
    borderWidth: 2,
  },
  dateDayText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  dateDayTextActive: {
    color: Colors.textGreen,
    fontWeight: '800',
  },
  dateSubText: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  dateSubTextActive: {
    color: Colors.textGreen,
  },
  slotsCol: {
    gap: 8,
    marginBottom: 12,
  },
  slotCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  slotCardActive: {
    backgroundColor: Colors.surfaceAlt,
    borderColor: Colors.primaryDark,
    borderWidth: 1.5,
  },
  slotEmoji: {
    fontSize: 16,
    marginRight: 8,
  },
  slotLabel: {
    flex: 1,
    fontSize: 13,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  slotLabelActive: {
    color: Colors.textGreen,
    fontWeight: '800',
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 4,
    marginTop: 8,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    fontSize: 13,
    color: Colors.textPrimary,
  },
  inputArea: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    color: Colors.textPrimary,
    minHeight: 50,
  },
  row: {
    flexDirection: 'row',
  },
  rowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  payMethodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 10,
    backgroundColor: '#F8FAFC',
  },
  payMethodActive: {
    backgroundColor: Colors.surfaceAlt,
    borderColor: Colors.primaryDark,
    borderWidth: 2,
  },
  payMethodName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  payMethodSub: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  rzpBadge: {
    backgroundColor: '#059669',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 6,
  },
  rzpBadgeText: {
    color: Colors.surface,
    fontSize: 9,
    fontWeight: '800',
  },
  summaryCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: Colors.greenBorder,
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  summaryLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  summaryVal: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 10,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  totalVal: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.textGreen,
  },
  submitBtn: {
    backgroundColor: Colors.primaryDark,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnText: {
    color: Colors.surface,
    fontSize: 15,
    fontWeight: '800',
  },
  sslRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
  },
  sslText: {
    color: Colors.textSecondary,
    fontSize: 11,
  },
});
