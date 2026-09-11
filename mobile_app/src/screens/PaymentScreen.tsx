import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Colors, FormatINR } from '../constants/theme';
import { Header } from '../components/Header';
import { ApiService } from '../services/api';
import {
  ShieldCheck,
  CreditCard,
  QrCode,
  Building2,
  Lock,
  CheckCircle,
  AlertCircle,
  Clock,
} from 'lucide-react-native';

export const PaymentScreen: React.FC<{ navigation: any; route: any }> = ({
  navigation,
  route,
}) => {
  const { order } = route.params;
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'upi' | 'card' | 'netbank'>('upi');

  const handleCompletePayment = async (isSuccess = true) => {
    if (!isSuccess) {
      Alert.alert('Payment Failed', 'Transaction was cancelled or declined.');
      return;
    }

    try {
      setProcessing(true);
      const res = await ApiService.verifyPayment({
        order_number: order.order_number,
        razorpay_order_id: order.razorpay_order_id,
        razorpay_payment_id: `pay_rzp_mock_${Date.now()}`,
        razorpay_signature: 'sandbox_signature_verified',
        mock_payment: true,
      });

      if (res.status === 'success') {
        navigation.reset({
          index: 1,
          routes: [
            { name: 'HomeTab' },
            {
              name: 'OrderSuccess',
              params: {
                orderNumber: order.order_number,
                paymentMethod: 'Razorpay (UPI / Cards)',
                scheduledDate: order.scheduled_date,
                timeSlot: order.delivery_time_slot,
                totalAmount: order.total_amount,
                trackingNumber: res.order?.tracking_number,
              },
            },
          ],
        });
      }
    } catch (err: any) {
      Alert.alert('Payment Error', err.message || 'Verification failed');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header navigation={navigation} showBack title="Razorpay Secure Payment" />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Gateway Security Header */}
        <View style={styles.gatewayBadge}>
          <ShieldCheck size={18} color="#34D399" />
          <Text style={styles.gatewayBadgeText}>Razorpay Payment Gateway • 256-Bit SSL</Text>
        </View>

        {/* Order Details Card */}
        <View style={styles.orderCard}>
          <View style={styles.orderCardHeader}>
            <View>
              <Text style={styles.orderNoLabel}>Order ID</Text>
              <Text style={styles.orderNoVal}>{order.order_number}</Text>
            </View>
            <View style={styles.amountBox}>
              <Text style={styles.amountLabel}>Total Payable</Text>
              <Text style={styles.amountVal}>{FormatINR(order.total_amount)}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Delivery Date:</Text>
            <Text style={styles.infoVal}>{order.scheduled_date} ({order.delivery_time_slot})</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Customer:</Text>
            <Text style={styles.infoVal}>{order.customer?.name} ({order.customer?.phone})</Text>
          </View>
        </View>

        {/* Payment Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'upi' && styles.tabBtnActive]}
            onPress={() => setActiveTab('upi')}
          >
            <QrCode size={16} color={activeTab === 'upi' ? Colors.surface : Colors.textSecondary} />
            <Text style={[styles.tabText, activeTab === 'upi' && styles.tabTextActive]}>UPI / QR</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'card' && styles.tabBtnActive]}
            onPress={() => setActiveTab('card')}
          >
            <CreditCard size={16} color={activeTab === 'card' ? Colors.surface : Colors.textSecondary} />
            <Text style={[styles.tabText, activeTab === 'card' && styles.tabTextActive]}>Cards</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'netbank' && styles.tabBtnActive]}
            onPress={() => setActiveTab('netbank')}
          >
            <Building2 size={16} color={activeTab === 'netbank' ? Colors.surface : Colors.textSecondary} />
            <Text style={[styles.tabText, activeTab === 'netbank' && styles.tabTextActive]}>NetBanking</Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        <View style={styles.tabContentCard}>
          {activeTab === 'upi' && (
            <View style={styles.centerAlign}>
              <View style={styles.qrCodeBox}>
                <Text style={styles.qrIcon}>📱</Text>
                <Text style={styles.qrVpaText}>greenpulse.mobiles@razorpay</Text>
              </View>

              <Text style={styles.upiAppsTitle}>Supported Instant UPI Apps:</Text>
              <View style={styles.upiAppsRow}>
                {['Google Pay', 'PhonePe', 'Paytm', 'BHIM', 'CRED'].map((app) => (
                  <View key={app} style={styles.upiBadge}>
                    <Text style={styles.upiBadgeText}>{app}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {activeTab === 'card' && (
            <View>
              <Text style={styles.cardSimulatorTitle}>Test Card (Sandbox Mode):</Text>
              <View style={styles.simCard}>
                <Text style={styles.simCardNumber}>4111 2222 3333 4444</Text>
                <View style={styles.simCardRow}>
                  <Text style={styles.simCardSub}>EXP: 12/28</Text>
                  <Text style={styles.simCardSub}>CVV: 123</Text>
                  <Text style={styles.simCardSub}>VISA / MC</Text>
                </View>
              </View>
            </View>
          )}

          {activeTab === 'netbank' && (
            <View>
              <Text style={styles.cardSimulatorTitle}>Popular Supported Banks:</Text>
              <View style={styles.banksGrid}>
                {['HDFC Bank', 'ICICI Bank', 'State Bank of India', 'Axis Bank', 'Kotak', 'Punjab National Bank'].map((b) => (
                  <View key={b} style={styles.bankChip}>
                    <Text style={styles.bankChipText}>{b}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Action Trigger Buttons */}
          <TouchableOpacity
            style={styles.payNowBtn}
            onPress={() => handleCompletePayment(true)}
            disabled={processing}
            activeOpacity={0.88}
          >
            {processing ? (
              <ActivityIndicator color={Colors.surface} />
            ) : (
              <>
                <Lock size={18} color={Colors.surface} />
                <Text style={styles.payNowBtnText}>
                  Pay {FormatINR(order.total_amount)} via Razorpay
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => handleCompletePayment(false)}
            disabled={processing}
          >
            <Text style={styles.cancelBtnText}>Simulate Cancel / Failure</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.pciRow}>
          <ShieldCheck size={14} color={Colors.primaryDark} />
          <Text style={styles.pciText}>PCI-DSS Level 1 Compliant • RBI Tokenized</Text>
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
  scroll: {
    padding: 16,
  },
  gatewayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#022C22',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 6,
    marginBottom: 14,
  },
  gatewayBadgeText: {
    color: '#34D399',
    fontSize: 12,
    fontWeight: '700',
  },
  orderCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: Colors.greenBorder,
    marginBottom: 14,
  },
  orderCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderNoLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  orderNoVal: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textGreen,
    fontFamily: 'monospace',
  },
  amountBox: {
    alignItems: 'flex-end',
  },
  amountLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  amountVal: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.textGreen,
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 10,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  infoLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  infoVal: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 12,
    padding: 4,
    marginBottom: 14,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  tabBtnActive: {
    backgroundColor: Colors.primaryDark,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.surface,
  },
  tabContentCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  centerAlign: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  qrCodeBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    width: '100%',
    marginBottom: 14,
  },
  qrIcon: {
    fontSize: 44,
    marginBottom: 6,
  },
  qrVpaText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textGreen,
    fontFamily: 'monospace',
  },
  upiAppsTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  upiAppsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
    marginBottom: 16,
  },
  upiBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  upiBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#065F46',
  },
  cardSimulatorTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 10,
  },
  simCard: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  simCardNumber: {
    color: '#38BDF8',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 12,
    fontFamily: 'monospace',
  },
  simCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  simCardSub: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  banksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  bankChip: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  bankChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  payNowBtn: {
    backgroundColor: Colors.primaryDark,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    marginTop: 6,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  payNowBtnText: {
    color: Colors.surface,
    fontSize: 15,
    fontWeight: '800',
  },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: 10,
    marginTop: 6,
  },
  cancelBtnText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '600',
  },
  pciRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 4,
  },
  pciText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
});
