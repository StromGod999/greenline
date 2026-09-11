import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Colors, FormatINR } from '../constants/theme';
import { Header } from '../components/Header';
import { ApiService } from '../services/api';
import { Product } from '../types';
import { FALLBACK_PRODUCTS } from '../constants/fallbackData';
import { useCart } from '../context/CartContext';
import {
  Star,
  ShieldCheck,
  Truck,
  RotateCcw,
  Check,
  ShoppingCart,
  Zap,
} from 'lucide-react-native';

export const ProductDetailScreen: React.FC<{ navigation: any; route: any }> = ({
  navigation,
  route,
}) => {
  const { slug } = route.params;
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedStorage, setSelectedStorage] = useState<string>('');
  const [addingToCart, setAddingToCart] = useState(false);

  const { addToCart } = useCart();

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setLoading(true);
        const res = await ApiService.getProductDetail(slug);
        if (res.status === 'success') {
          const p = res.product;
          setProduct(p);
          setSelectedImage(p.image_url);
          setSelectedColor(p.specs?.colors?.[0] || 'Emerald Green');
          setSelectedStorage(p.specs?.storage || '256 GB');
          return;
        }
      } catch (err) {
        // Fallback to preloaded phone
        const fallback = FALLBACK_PRODUCTS.find(item => item.slug === slug);
        if (fallback) {
          setProduct(fallback);
          setSelectedImage(fallback.image_url);
          setSelectedColor(fallback.specs?.colors?.[0] || 'Emerald Green');
          setSelectedStorage(fallback.specs?.storage || '256 GB');
          return;
        }
        Alert.alert('Error', 'Unable to load smartphone details');
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [slug]);

  if (loading || !product) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Fetching Phone Specs...</Text>
      </View>
    );
  }

  const handleAddToCart = async (goToCheckout = false) => {
    try {
      setAddingToCart(true);
      await addToCart(product.id, 1, selectedColor, selectedStorage);
      if (goToCheckout) {
        navigation.navigate('Checkout');
      } else {
        Alert.alert('Added to Cart! 🛒', `${product.name} (${selectedColor}, ${selectedStorage}) added to your cart.`, [
          { text: 'Continue Shopping' },
          { text: 'View Cart', onPress: () => navigation.navigate('CartTab') },
        ]);
      }
    } catch (err: any) {
      Alert.alert('Notice', err.message || 'Could not add item to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  const specsList = [
    { label: 'Display', value: product.specs?.display },
    { label: 'Processor', value: product.specs?.processor },
    { label: 'Rear Camera', value: product.specs?.camera_rear },
    { label: 'Selfie Camera', value: product.specs?.camera_front },
    { label: 'Battery & Charging', value: product.specs?.battery },
    { label: 'OS Version', value: product.specs?.operating_system },
    { label: 'Network', value: product.specs?.network },
    { label: 'Official Warranty', value: product.specs?.warranty },
  ].filter((s) => s.value);

  return (
    <View style={styles.container}>
      <Header navigation={navigation} showBack />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Main Photo Gallery */}
        <View style={styles.imageGallery}>
          <Image source={{ uri: selectedImage || product.image_url }} style={styles.mainImage} resizeMode="contain" />

          {/* Thumbnails */}
          {product.gallery && product.gallery.length > 1 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbsScroll}>
              {product.gallery.map((img, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[styles.thumbBox, selectedImage === img && styles.thumbBoxActive]}
                  onPress={() => setSelectedImage(img)}
                >
                  <Image source={{ uri: img }} style={styles.thumbImage} resizeMode="contain" />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Product Info Section */}
        <View style={styles.infoSection}>
          <View style={styles.brandRow}>
            <Text style={styles.brandBadge}>{product.brand?.name}</Text>
            {product.is_5g && (
              <View style={styles.badge5g}>
                <Text style={styles.badge5gText}>5G Enabled</Text>
              </View>
            )}
            <View style={styles.ratingBox}>
              <Star size={13} color={Colors.ratingStar} fill={Colors.ratingStar} />
              <Text style={styles.ratingNum}> {product.rating}</Text>
              <Text style={styles.ratingCount}> ({product.reviews_count} reviews)</Text>
            </View>
          </View>

          <Text style={styles.productName}>{product.name}</Text>
          <Text style={styles.shortDesc}>{product.short_description}</Text>

          {/* Price Box in INR */}
          <View style={styles.priceBox}>
            <View style={styles.priceRow}>
              <Text style={styles.currentPrice}>{FormatINR(product.current_price)}</Text>
              {product.discount_price && (
                <Text style={styles.originalPrice}>{FormatINR(product.price)}</Text>
              )}
              {product.discount_percentage > 0 && (
                <View style={styles.discountTag}>
                  <Text style={styles.discountTagText}>{product.discount_percentage}% OFF</Text>
                </View>
              )}
            </View>
            <Text style={styles.taxNotice}>Inclusive of all Indian taxes & Razorpay buyer protection</Text>
          </View>

          {/* Color Selector */}
          {product.specs?.colors && product.specs.colors.length > 0 && (
            <View style={styles.variantSection}>
              <Text style={styles.variantTitle}>Choose Color: <Text style={styles.variantSelected}>{selectedColor}</Text></Text>
              <View style={styles.variantRow}>
                {product.specs.colors.map((color, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.variantChip, selectedColor === color && styles.variantChipActive]}
                    onPress={() => setSelectedColor(color)}
                  >
                    {selectedColor === color && <Check size={12} color={Colors.surface} style={{ marginRight: 4 }} />}
                    <Text style={[styles.variantChipText, selectedColor === color && styles.variantChipTextActive]}>
                      {color}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Storage / RAM Option */}
          <View style={styles.variantSection}>
            <Text style={styles.variantTitle}>Configuration: <Text style={styles.variantSelected}>{selectedStorage}</Text></Text>
            <View style={styles.variantRow}>
              {['128 GB', '256 GB', '512 GB', '1 TB'].map((st) => (
                <TouchableOpacity
                  key={st}
                  style={[styles.storageChip, selectedStorage === st && styles.storageChipActive]}
                  onPress={() => setSelectedStorage(st)}
                >
                  <Text style={[styles.storageText, selectedStorage === st && styles.storageTextActive]}>{st}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Trust Guarantees */}
          <View style={styles.guaranteeBox}>
            <View style={styles.guaranteeItem}>
              <Truck size={18} color={Colors.primaryDark} />
              <View style={{ flex: 1 }}>
                <Text style={styles.guaranteeTitle}>Doorstep Scheduled Delivery</Text>
                <Text style={styles.guaranteeSub}>Pick your convenient date & time slot at checkout</Text>
              </View>
            </View>
            <View style={styles.guaranteeItem}>
              <ShieldCheck size={18} color={Colors.primaryDark} />
              <View style={{ flex: 1 }}>
                <Text style={styles.guaranteeTitle}>100% Brand Sealed Genuine</Text>
                <Text style={styles.guaranteeSub}>Direct manufacturer warranty with India GST invoice</Text>
              </View>
            </View>
            <View style={styles.guaranteeItem}>
              <RotateCcw size={18} color={Colors.primaryDark} />
              <View style={{ flex: 1 }}>
                <Text style={styles.guaranteeTitle}>7-Day Replacement Policy</Text>
                <Text style={styles.guaranteeSub}>Instant doorstep exchange on technical defect</Text>
              </View>
            </View>
          </View>

          {/* Technical Specifications Table */}
          <View style={styles.specsContainer}>
            <Text style={styles.specsHeader}>Technical Specifications</Text>
            {specsList.map((s, idx) => (
              <View key={idx} style={[styles.specRow, idx % 2 === 1 && { backgroundColor: '#F8FAFC' }]}>
                <Text style={styles.specLabel}>{s.label}</Text>
                <Text style={styles.specVal}>{s.value}</Text>
              </View>
            ))}
          </View>

          {/* Description */}
          <View style={styles.descSection}>
            <Text style={styles.specsHeader}>About this Phone</Text>
            <Text style={styles.descText}>{product.description}</Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Bottom Purchase Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.cartBtn}
          onPress={() => handleAddToCart(false)}
          activeOpacity={0.8}
          disabled={addingToCart}
        >
          <ShoppingCart size={18} color={Colors.primaryDark} />
          <Text style={styles.cartBtnText}>Add to Cart</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.buyNowBtn}
          onPress={() => handleAddToCart(true)}
          activeOpacity={0.85}
          disabled={addingToCart}
        >
          <Zap size={18} color={Colors.surface} />
          <Text style={styles.buyNowText}>Buy Now • {FormatINR(product.current_price)}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: Colors.textSecondary,
    fontSize: 13,
  },
  imageGallery: {
    backgroundColor: Colors.surface,
    paddingVertical: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  mainImage: {
    width: '85%',
    height: 240,
    marginBottom: 12,
  },
  thumbsScroll: {
    gap: 8,
    paddingHorizontal: 16,
  },
  thumbBox: {
    width: 50,
    height: 50,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    padding: 4,
    backgroundColor: '#F8FAFC',
  },
  thumbBoxActive: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  infoSection: {
    padding: 16,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  brandBadge: {
    backgroundColor: Colors.surfaceAlt,
    color: Colors.textGreen,
    fontSize: 11,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    textTransform: 'uppercase',
  },
  badge5g: {
    backgroundColor: '#064E3B',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badge5gText: {
    color: '#34D399',
    fontSize: 10,
    fontWeight: '800',
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  ratingNum: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  ratingCount: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  productName: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  shortDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 14,
  },
  priceBox: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: Colors.greenBorder,
    marginBottom: 18,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
    marginBottom: 4,
  },
  currentPrice: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.textGreen,
  },
  originalPrice: {
    fontSize: 15,
    color: Colors.textLight,
    textDecorationLine: 'line-through',
  },
  discountTag: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  discountTagText: {
    color: Colors.surface,
    fontSize: 11,
    fontWeight: '800',
  },
  taxNotice: {
    fontSize: 11,
    color: '#065F46',
    fontWeight: '500',
  },
  variantSection: {
    marginBottom: 16,
  },
  variantTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  variantSelected: {
    color: Colors.primaryDark,
    fontWeight: '800',
  },
  variantRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  variantChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  variantChipActive: {
    backgroundColor: Colors.primaryDark,
    borderColor: Colors.primaryDark,
  },
  variantChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  variantChipTextActive: {
    color: Colors.surface,
    fontWeight: '700',
  },
  storageChip: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  storageChipActive: {
    backgroundColor: Colors.surfaceAlt,
    borderColor: Colors.primaryDark,
    borderWidth: 2,
  },
  storageText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  storageTextActive: {
    color: Colors.textGreen,
    fontWeight: '800',
  },
  guaranteeBox: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
    gap: 12,
  },
  guaranteeItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  guaranteeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  guaranteeSub: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  specsContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  specsHeader: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  specRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  specLabel: {
    width: '40%',
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  specVal: {
    width: '60%',
    fontSize: 12,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  descSection: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  descText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
  },
  cartBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceAlt,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.greenBorder,
    gap: 6,
  },
  cartBtnText: {
    color: Colors.textGreen,
    fontSize: 14,
    fontWeight: '800',
  },
  buyNowBtn: {
    flex: 1.6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryDark,
    paddingVertical: 14,
    borderRadius: 14,
    gap: 6,
  },
  buyNowText: {
    color: Colors.surface,
    fontSize: 14,
    fontWeight: '800',
  },
});
