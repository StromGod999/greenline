import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Share,
} from 'react-native';
import { Colors, FormatINR } from '../constants/theme';
import { Header } from '../components/Header';
import { ApiService } from '../services/api';
import { OrderDetail } from '../types';
import {
  CheckCircle2,
  Clock,
  MapPin,
  Truck,
  Share2,
  Home,
  Check,
  ShieldCheck,
} from 'lucide-react-native';

export const OrderSuccessScreen: React.FC<{ navigation: any; route: any }> = ({
  navigation,
  route,
}) => {
  const {
    orderNumber,
    paymentMethod = 'Razorpay (Paid)',
    scheduledDate,
    timeSlot,
    totalAmount,
    trackingNumber,
  } = route.params;

  const [orderDetail, setOrderDetail] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTracking = async () => {
      try {
        const res = await ApiService.getOrderDetail(orderNumber);
        if (res.status === 'success') {
          setOrderDetail(res.order);
        }
      } catch (err) {
        console.warn('Tracking fetch note:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTracking();
  }, [orderNumber]);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `📱 GreenPulse Order #${orderNumber} Confirmed!\nScheduled Delivery: ${scheduledDate || orderDetail?.scheduled_date} (${timeSlot || orderDetail?.delivery_time_slot})\nTotal Amount: ${FormatINR(totalAmount || orderDetail?.total_amount)}`,
      });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <View style={styles.container}>
      <Header navigation={navigation} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Success Header Box */}
        <View style={styles.successBox}>
          <View style={styles.successIconCircle}>
            <CheckCircle2 size={44} color={Colors.surface} />
          </View>

          <Text style={styles.successTitle}>Order Confirmed! 🎉</Text>
          <Text style={styles.successSub}>
            Your flagship mobile is scheduled for doorstep dispatch.
          </Text>

          <View style={styles.orderIdPill}>
            <Text style={styles.orderIdLabel}>Order Tracking ID: </Text>
            <Text style={styles.orderIdVal}>{orderNumber}</Text>
          </View>
        </View>

        {/* Scheduled Slot Reminder */}
        <View style={styles.slotCard}>
          <View style={styles.slotRow}>
            <Clock size={20} color={Colors.primaryDark} />
            <View style={{ marginLeft: 10, flex: 1 }}>
              <Text style={styles.slotTitle}>Scheduled Delivery Slot:</Text>
              <Text style={styles.slotHighlight}>
                📅 {scheduledDate || orderDetail?.scheduled_date}
              </Text>
              <Text style={styles.slotTime}>
                ⏰ {timeSlot || orderDetail?.delivery_time_slot}
              </Text>
            </View>
          </View>
        </View>

        {/* Live Delivery Step Tracker */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Live Fulfillment Progress</Text>
          {trackingNumber && (
            <Text style={styles.awbText}>Tracking AWB: <Text style={styles.awbHighlight}>{trackingNumber}</Text></Text>
          )}

          {loading ? (
            <ActivityIndicator color={Colors.primary} style={{ marginVertical: 20 }} />
          ) : (
            <View style={styles.timelineContainer}>
              {(orderDetail?.timeline || []).map((step, idx) => (
                <View key={step.id} style={styles.timelineRow}>
                  {/* Timeline dot & line */}
                  <View style={styles.timelineGraphic}>
                    <View style={[styles.timelineDot, step.completed && styles.timelineDotDone, step.active && styles.timelineDotActive]}>
                      {step.completed && <Check size={10} color={Colors.surface} />}
                    </View>
                    {idx < (orderDetail?.timeline?.length || 0) - 1 && (
                      <View style={[styles.timelineLine, step.completed && styles.timelineLineDone]} />
                    )}
                  </View>

                  {/* Step Info */}
                  <View style={styles.timelineContent}>
                    <Text style={[styles.stepTitle, step.active && styles.stepTitleActive]}>
                      {step.title}
                    </Text>
                    <Text style={styles.stepDesc}>{step.desc}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Summary Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Payment & Order Summary</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Payment Mode:</Text>
            <Text style={styles.infoVal}>{paymentMethod}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Total Amount Paid:</Text>
            <Text style={styles.totalPriceText}>{FormatINR(totalAmount || orderDetail?.total_amount)}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.shareBtn} onPress={handleShare} activeOpacity={0.8}>
            <Share2 size={16} color={Colors.textPrimary} />
            <Text style={styles.shareBtnText}>Share Details</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.homeBtn}
            onPress={() => navigation.navigate('HomeTab')}
            activeOpacity={0.88}
          >
            <Home size={16} color={Colors.surface} />
            <Text style={styles.homeBtnText}>Back to Store</Text>
          </TouchableOpacity>
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
  successBox: {
    backgroundColor: Colors.primaryDeep,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 14,
  },
  successIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.surface,
    marginBottom: 6,
  },
  successSub: {
    fontSize: 13,
    color: '#A7F3D0',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 14,
  },
  orderIdPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  orderIdLabel: {
    fontSize: 12,
    color: '#D1FAE5',
  },
  orderIdVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#34D399',
    fontFamily: 'monospace',
  },
  slotCard: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: Colors.greenBorder,
    marginBottom: 14,
  },
  slotRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  slotTitle: {
    fontSize: 12,
    color: '#065F46',
    fontWeight: '600',
  },
  slotHighlight: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.primaryDarker,
    marginTop: 2,
  },
  slotTime: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primaryDark,
    marginTop: 1,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 10,
  },
  awbText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 14,
  },
  awbHighlight: {
    color: Colors.textGreen,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  timelineContainer: {
    paddingLeft: 6,
    marginVertical: 6,
  },
  timelineRow: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  timelineGraphic: {
    alignItems: 'center',
    width: 24,
    marginRight: 10,
  },
  timelineDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineDotDone: {
    backgroundColor: Colors.primary,
  },
  timelineDotActive: {
    backgroundColor: Colors.primaryDark,
    borderWidth: 3,
    borderColor: '#A7F3D0',
    width: 18,
    height: 18,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E2E8F0',
    marginTop: 4,
    minHeight: 24,
  },
  timelineLineDone: {
    backgroundColor: Colors.primary,
  },
  timelineContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  stepTitleActive: {
    color: Colors.textGreen,
    fontWeight: '800',
    fontSize: 14,
  },
  stepDesc: {
    fontSize: 11,
    color: Colors.textLight,
    marginTop: 2,
    lineHeight: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  infoLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  infoVal: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  totalPriceText: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.textGreen,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  shareBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    gap: 6,
  },
  shareBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  homeBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryDark,
    paddingVertical: 14,
    borderRadius: 14,
    gap: 6,
  },
  homeBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.surface,
  },
});
