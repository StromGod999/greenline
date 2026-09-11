import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Colors } from '../constants/theme';
import { ShoppingBag, ArrowLeft, Phone } from 'lucide-react-native';
import { useCart } from '../context/CartContext';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  navigation?: any;
}

export const Header: React.FC<HeaderProps> = ({ title, showBack, onBack, navigation }) => {
  const { cart } = useCart();
  const itemCount = cart?.item_count || 0;

  return (
    <View style={styles.container}>
      {/* Top Helpline Banner */}
      <View style={styles.topBar}>
        <View style={styles.row}>
          <Text style={styles.flag}>🇮🇳</Text>
          <Text style={styles.topBarText}>Pan-India Scheduled Delivery</Text>
        </View>
        <View style={styles.row}>
          <Phone size={12} color="#A7F3D0" />
          <Text style={styles.phoneText}> +91 1234567890</Text>
        </View>
      </View>

      {/* Main Bar */}
      <View style={styles.mainBar}>
        {showBack ? (
          <TouchableOpacity style={styles.backButton} onPress={onBack || (() => navigation?.goBack())}>
            <ArrowLeft size={22} color={Colors.surface} />
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity 
          style={styles.brandRow} 
          activeOpacity={0.8}
          onPress={() => navigation?.navigate('Home')}
        >
          <View style={styles.iconCircle}>
            <Text style={styles.iconText}>📱</Text>
          </View>
          <View>
            <View style={styles.titleRow}>
              <Text style={styles.brandGreen}>Green</Text>
              <Text style={styles.brandEmerald}>Pulse</Text>
              <View style={styles.indiaBadge}>
                <Text style={styles.indiaBadgeText}>🇮🇳 INDIA</Text>
              </View>
            </View>
            <Text style={styles.subBrand}>Premium 5G Flagship Store</Text>
          </View>
        </TouchableOpacity>

        {/* Cart Icon with badge */}
        <TouchableOpacity
          style={styles.cartButton}
          onPress={() => navigation?.navigate('CartTab')}
          activeOpacity={0.7}
        >
          <ShoppingBag size={22} color={Colors.surface} />
          {itemCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{itemCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.primaryDeep,
  },
  topBar: {
    backgroundColor: Colors.primaryDarker,
    paddingVertical: 5,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(16, 185, 129, 0.2)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flag: {
    fontSize: 12,
    marginRight: 4,
  },
  topBarText: {
    color: '#D1FAE5',
    fontSize: 11,
    fontWeight: '500',
  },
  phoneText: {
    color: '#34D399',
    fontSize: 11,
    fontWeight: '600',
  },
  mainBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(16, 185, 129, 0.25)',
    borderWidth: 1,
    borderColor: '#34D399',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  iconText: {
    fontSize: 18,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandGreen: {
    color: Colors.surface,
    fontSize: 18,
    fontWeight: '800',
  },
  brandEmerald: {
    color: '#34D399',
    fontSize: 18,
    fontWeight: '800',
  },
  indiaBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  indiaBadgeText: {
    color: '#065F46',
    fontSize: 9,
    fontWeight: '800',
  },
  subBrand: {
    color: '#A7F3D0',
    fontSize: 10,
    fontWeight: '500',
  },
  cartButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: Colors.primaryDeep,
  },
  cartBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
});
