import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Colors, FormatINR } from '../constants/theme';
import { Product } from '../types';
import { Star, ShoppingCart, Cpu, HardDrive } from 'lucide-react-native';
import { useCart } from '../context/CartContext';

interface ProductCardProps {
  product: Product;
  onPress: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onPress }) => {
  const { addToCart } = useCart();

  const handleQuickAdd = async (e: any) => {
    e?.stopPropagation?.();
    const defaultColor = product.specs?.colors?.[0] || 'Emerald Green';
    const defaultStorage = product.specs?.storage || '256 GB';
    await addToCart(product.id, 1, defaultColor, defaultStorage);
  };

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.88} onPress={onPress}>
      {/* Badges */}
      <View style={styles.badgeRow}>
        {product.is_5g && (
          <View style={styles.badge5G}>
            <Text style={styles.badgeText5G}>5G</Text>
          </View>
        )}
        {product.discount_percentage > 0 && (
          <View style={styles.badgeDiscount}>
            <Text style={styles.badgeTextDiscount}>-{product.discount_percentage}%</Text>
          </View>
        )}
      </View>

      {/* Product Image */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: product.image_url }}
          style={styles.image}
          resizeMode="contain"
        />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.brandRow}>
          <Text style={styles.brandName}>{product.brand?.name || 'Smartphone'}</Text>
          <View style={styles.ratingRow}>
            <Star size={12} color={Colors.ratingStar} fill={Colors.ratingStar} />
            <Text style={styles.ratingText}> {product.rating}</Text>
          </View>
        </View>

        <Text style={styles.title} numberOfLines={1}>
          {product.name}
        </Text>

        {/* Specs Pills */}
        <View style={styles.specsRow}>
          {product.specs?.ram && (
            <View style={styles.specPill}>
              <Cpu size={10} color={Colors.textGreen} />
              <Text style={styles.specText}>{product.specs.ram}</Text>
            </View>
          )}
          {product.specs?.storage && (
            <View style={styles.specPill}>
              <HardDrive size={10} color={Colors.textGreen} />
              <Text style={styles.specText}>{product.specs.storage}</Text>
            </View>
          )}
        </View>

        {/* Price & Action */}
        <View style={styles.bottomRow}>
          <View>
            <Text style={styles.currentPrice}>{FormatINR(product.current_price)}</Text>
            {product.discount_price && (
              <Text style={styles.originalPrice}>{FormatINR(product.price)}</Text>
            )}
          </View>

          <TouchableOpacity style={styles.addButton} onPress={handleQuickAdd} activeOpacity={0.8}>
            <ShoppingCart size={15} color={Colors.surface} />
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    position: 'relative',
  },
  badgeRow: {
    position: 'absolute',
    top: 8,
    left: 8,
    zIndex: 10,
    flexDirection: 'row',
    gap: 4,
  },
  badge5G: {
    backgroundColor: '#064E3B',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText5G: {
    color: '#34D399',
    fontSize: 10,
    fontWeight: '800',
  },
  badgeDiscount: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeTextDiscount: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  imageContainer: {
    height: 160,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  content: {
    padding: 12,
  },
  brandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  brandName: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    color: Colors.textPrimary,
    fontSize: 11,
    fontWeight: '600',
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
  },
  specsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  specPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceAlt,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.greenBorder,
    gap: 3,
  },
  specText: {
    color: Colors.textGreen,
    fontSize: 10,
    fontWeight: '600',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
  },
  currentPrice: {
    color: Colors.textGreen,
    fontSize: 16,
    fontWeight: '800',
  },
  originalPrice: {
    color: Colors.textLight,
    fontSize: 11,
    textDecorationLine: 'line-through',
  },
  addButton: {
    backgroundColor: Colors.primaryDark,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    gap: 4,
  },
  addButtonText: {
    color: Colors.surface,
    fontSize: 12,
    fontWeight: '700',
  },
});
