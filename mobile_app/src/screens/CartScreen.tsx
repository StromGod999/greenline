import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Colors, FormatINR } from '../constants/theme';
import { Header } from '../components/Header';
import { useCart } from '../context/CartContext';
import {
  Truck,
  Trash2,
  Plus,
  Minus,
  Tag,
  ShieldCheck,
  ArrowRight,
  ShoppingBag,
} from 'lucide-react-native';

export const CartScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { cart, loading, updateQuantity, removeItem, applyCoupon } = useCart();
  const [couponInput, setCouponInput] = useState('GREEN10');
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setApplyingCoupon(true);
    const res = await applyCoupon(couponInput.trim());
    setApplyingCoupon(false);
    if (res.success) {
      Alert.alert('Coupon Applied 🎉', res.message);
    } else {
      Alert.alert('Notice', res.message);
    }
  };

  const isEmpty = !cart || cart.items.length === 0;

  return (
    <View style={styles.container}>
      <Header navigation={navigation} />

      {isEmpty ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <ShoppingBag size={48} color={Colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>Your Cart is Empty</Text>
          <Text style={styles.emptySub}>Looks like you haven't added any flagship smartphones yet.</Text>
          <TouchableOpacity
            style={styles.browseButton}
            onPress={() => navigation.navigate('CatalogTab')}
            activeOpacity={0.85}
          >
            <Text style={styles.browseButtonText}>Browse 5G Smartphones</Text>
            <ArrowRight size={16} color={Colors.surface} />
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* =========================================================
              FREE SHIPPING PROGRESS BAR
              ========================================================= */}
          <View style={styles.shippingMeterBox}>
            <View style={styles.shippingMeterRow}>
              <View style={styles.rowCenter}>
                <Truck size={16} color={Colors.primaryDark} />
                <Text style={styles.shippingMeterTitle}>
                  {cart.shipping_progress >= 100 ? (
                    <Text style={{ fontWeight: '800' }}>🎉 FREE Express Shipping Unlocked!</Text>
                  ) : (
                    <Text>
                      Add <Text style={{ fontWeight: '800' }}>{FormatINR(cart.free_shipping_remaining)}</Text> for <Text style={{ fontWeight: '800' }}>FREE Delivery</Text>
                    </Text>
                  )}
                </Text>
              </View>
              <Text style={styles.shippingMeterPercent}>{cart.shipping_progress}%</Text>
            </View>

            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: `${cart.shipping_progress}%` }]} />
            </View>
          </View>

          {/* =========================================================
              CART ITEMS LIST
              ========================================================= */}
          <View style={styles.cardBox}>
            <Text style={styles.cardHeaderTitle}>Shopping Cart ({cart.item_count} Items)</Text>

            {cart.items.map((item) => (
              <View key={item.id} style={styles.cartItemRow}>
                <Image source={{ uri: item.image_url }} style={styles.itemImage} resizeMode="contain" />

                <View style={styles.itemDetails}>
                  <View style={styles.itemHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemBrand}>{item.brand}</Text>
                      <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                    </View>
                    <TouchableOpacity onPress={() => removeItem(item.id)} style={styles.deleteBtn}>
                      <Trash2 size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.itemPillsRow}>
                    <Text style={styles.itemPill}>Color: {item.color}</Text>
                    <Text style={styles.itemPill}>{item.storage}</Text>
                  </View>

                  {/* Price & Quantity Stepper */}
                  <View style={styles.itemActionRow}>
                    <View style={styles.stepper}>
                      <TouchableOpacity
                        style={styles.stepperBtn}
                        onPress={() => updateQuantity(item.id, 'decrease')}
                      >
                        <Minus size={14} color={Colors.textPrimary} />
                      </TouchableOpacity>
                      <Text style={styles.stepperVal}>{item.quantity}</Text>
                      <TouchableOpacity
                        style={styles.stepperBtn}
                        onPress={() => updateQuantity(item.id, 'increase')}
                      >
                        <Plus size={14} color={Colors.textPrimary} />
                      </TouchableOpacity>
                    </View>

                    <Text style={styles.itemTotalPrice}>{FormatINR(item.total_price)}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>

          {/* =========================================================
              PROMO COUPON BOX
              ========================================================= */}
          <View style={styles.cardBox}>
            <View style={styles.rowCenter}>
              <Tag size={16} color={Colors.primaryDark} />
              <Text style={styles.couponTitle}> Apply Discount Coupon</Text>
            </View>

            <View style={styles.couponInputRow}>
              <TextInput
                style={styles.couponInput}
                placeholder="Enter GREEN10"
                value={couponInput}
                onChangeText={setCouponInput}
                autoCapitalize="characters"
              />
              <TouchableOpacity
                style={styles.applyBtn}
                onPress={handleApplyCoupon}
                disabled={applyingCoupon}
              >
                {applyingCoupon ? (
                  <ActivityIndicator size="small" color={Colors.surface} />
                ) : (
                  <Text style={styles.applyBtnText}>Apply</Text>
                )}
              </TouchableOpacity>
            </View>

            {cart.coupon_applied ? (
              <View style={styles.couponActiveBadge}>
                <Text style={styles.couponActiveText}>
                  ✓ Promo '{cart.coupon_applied}' Active: Saved {FormatINR(cart.discount_amount)}
                </Text>
              </View>
            ) : (
              <Text style={styles.couponHint}>💡 Tip: Use code <Text style={{ fontWeight: '800', color: Colors.primaryDark }}>GREEN10</Text> for 10% instant off!</Text>
            )}
          </View>

          {/* =========================================================
              ORDER SUMMARY BREAKDOWN
              ========================================================= */}
          <View style={styles.cardBox}>
            <Text style={styles.cardHeaderTitle}>Price Breakdown (₹ INR)</Text>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Cart Subtotal</Text>
              <Text style={styles.summaryVal}>{FormatINR(cart.subtotal)}</Text>
            </View>

            {cart.discount_amount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: '#059669' }]}>Coupon Discount ({cart.discount_percent}%)</Text>
                <Text style={[styles.summaryVal, { color: '#059669', fontWeight: '700' }]}>
                  -{FormatINR(cart.discount_amount)}
                </Text>
              </View>
            )}

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Doorstep Scheduled Delivery</Text>
              <Text style={styles.summaryVal}>
                {cart.shipping_charge === 0 ? (
                  <Text style={{ color: '#059669', fontWeight: '800' }}>FREE</Text>
                ) : (
                  FormatINR(cart.shipping_charge)
                )}
              </Text>
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.totalRow}>
              <View>
                <Text style={styles.totalLabel}>Grand Total</Text>
                <Text style={styles.totalTaxLabel}>Includes GST & Insurance</Text>
              </View>
              <Text style={styles.totalVal}>{FormatINR(cart.total)}</Text>
            </View>

            {/* Checkout CTA */}
            <TouchableOpacity
              style={styles.checkoutBtn}
              onPress={() => navigation.navigate('Checkout')}
              activeOpacity={0.88}
            >
              <Text style={styles.checkoutBtnText}>Proceed to Schedule & Pay</Text>
              <ArrowRight size={18} color={Colors.surface} />
            </TouchableOpacity>

            <View style={styles.trustRow}>
              <ShieldCheck size={14} color={Colors.primaryDark} />
              <Text style={styles.trustText}>Secured by Razorpay • 256-Bit Encryption</Text>
            </View>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  emptyIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: Colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.greenBorder,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 18,
  },
  browseButton: {
    backgroundColor: Colors.primaryDark,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
  },
  browseButtonText: {
    color: Colors.surface,
    fontSize: 14,
    fontWeight: '700',
  },
  shippingMeterBox: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.greenBorder,
    marginBottom: 14,
  },
  shippingMeterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  rowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shippingMeterTitle: {
    fontSize: 12,
    color: '#065F46',
    marginLeft: 6,
  },
  shippingMeterPercent: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: '#D1FAE5',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  cardBox: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  cardHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  cartItemRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 12,
  },
  itemImage: {
    width: 65,
    height: 65,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
  },
  itemDetails: {
    flex: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  itemBrand: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  deleteBtn: {
    padding: 4,
  },
  itemPillsRow: {
    flexDirection: 'row',
    gap: 6,
    marginVertical: 6,
  },
  itemPill: {
    fontSize: 10,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    color: Colors.textSecondary,
  },
  itemActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
  },
  stepperBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#F8FAFC',
  },
  stepperVal: {
    paddingHorizontal: 10,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  itemTotalPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textGreen,
  },
  couponTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  couponInputRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  couponInput: {
    flex: 1,
    height: 42,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: '#F8FAFC',
    fontSize: 13,
    fontWeight: '700',
  },
  applyBtn: {
    backgroundColor: Colors.primaryDark,
    paddingHorizontal: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  applyBtnText: {
    color: Colors.surface,
    fontSize: 13,
    fontWeight: '700',
  },
  couponActiveBadge: {
    backgroundColor: '#ECFDF5',
    padding: 8,
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  couponActiveText: {
    color: '#065F46',
    fontSize: 11,
    fontWeight: '700',
  },
  couponHint: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
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
  summaryDivider: {
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
  totalTaxLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
  },
  totalVal: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.textGreen,
  },
  checkoutBtn: {
    backgroundColor: Colors.primaryDark,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  checkoutBtnText: {
    color: Colors.surface,
    fontSize: 15,
    fontWeight: '800',
  },
  trustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
  },
  trustText: {
    color: Colors.textSecondary,
    fontSize: 11,
  },
});
