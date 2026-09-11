import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { Colors, FormatINR } from '../constants/theme';
import { Header } from '../components/Header';
import { ProductCard } from '../components/ProductCard';
import { ApiService } from '../services/api';
import { Product, Brand } from '../types';
import { FALLBACK_BRANDS, FALLBACK_PRODUCTS } from '../constants/fallbackData';
import { Sparkles, Zap, Truck, ShieldCheck, ArrowRight, Flame } from 'lucide-react-native';

export const HomeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [featured, setFeatured] = useState<Product[]>(FALLBACK_PRODUCTS);
  const [trending, setTrending] = useState<Product[]>(FALLBACK_PRODUCTS.slice(0, 3));
  const [deals, setDeals] = useState<Product[]>(FALLBACK_PRODUCTS.filter(p => p.discount_price));
  const [brands, setBrands] = useState<Brand[]>(FALLBACK_BRANDS);

  const loadData = async () => {
    try {
      const res = await ApiService.getHome();
      if (res.status === 'success') {
        if (res.featured_products?.length) setFeatured(res.featured_products);
        if (res.trending_products?.length) setTrending(res.trending_products);
        if (res.deals?.length) setDeals(res.deals);
        if (res.brands?.length) setBrands(res.brands);
      }
    } catch (err) {
      console.warn('Home fetch note (using preloaded flagship catalog):', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading Flagship Mobiles...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header navigation={navigation} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
      >
        {/* =========================================================
            HERO PROMO BANNER (Green & White Theme)
            ========================================================= */}
        <View style={styles.heroBanner}>
          <View style={styles.heroPill}>
            <Sparkles size={12} color="#FBBF24" />
            <Text style={styles.heroPillText}>2026 Next-Gen 5G Flagships</Text>
          </View>

          <Text style={styles.heroHeading}>
            Power Meets Elegance.{'\n'}
            <Text style={styles.heroHeadingAccent}>Superfast 5G Mobiles</Text>
          </Text>

          <Text style={styles.heroSub}>
            Discover titanium designs, 200MP Quad Zoom cameras, Snapdragon 8 Gen 3, and door-step scheduled delivery.
          </Text>

          {/* Value Props Row */}
          <View style={styles.propsRow}>
            <View style={styles.propItem}>
              <Truck size={14} color="#34D399" />
              <Text style={styles.propText}>Scheduled Delivery</Text>
            </View>
            <View style={styles.propItem}>
              <ShieldCheck size={14} color="#34D399" />
              <Text style={styles.propText}>Razorpay UPI & Cards</Text>
            </View>
            <View style={styles.propItem}>
              <Zap size={14} color="#34D399" />
              <Text style={styles.propText}>100% Brand Seal</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.heroButton}
            onPress={() => navigation.navigate('CatalogTab', { is5g: true })}
            activeOpacity={0.85}
          >
            <Text style={styles.heroButtonText}>Explore All 5G Phones</Text>
            <ArrowRight size={16} color={Colors.primaryDeep} />
          </TouchableOpacity>
        </View>

        {/* =========================================================
            TOP SMARTPHONE BRANDS
            ========================================================= */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Official Brands</Text>
          <TouchableOpacity onPress={() => navigation.navigate('CatalogTab')}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.brandsScroll}>
          {brands.map((b) => (
            <TouchableOpacity
              key={b.id}
              style={styles.brandChip}
              onPress={() => navigation.navigate('CatalogTab', { brand: b.slug, brandName: b.name })}
              activeOpacity={0.7}
            >
              <Image source={{ uri: b.logo_url }} style={styles.brandLogo} resizeMode="contain" />
              <Text style={styles.brandChipText}>{b.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* =========================================================
            LIMITED TIME DEALS / PRICE DROPS
            ========================================================= */}
        {deals.length > 0 && (
          <View style={styles.dealsBox}>
            <View style={styles.dealsHeaderRow}>
              <View style={styles.rowCenter}>
                <Flame size={18} color="#DC2626" />
                <Text style={styles.dealsTitle}> Hot Price Drops & Deals</Text>
              </View>
              <View style={styles.dealBadge}>
                <Text style={styles.dealBadgeText}>Limited Stock</Text>
              </View>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dealsScroll}>
              {deals.map((phone) => (
                <TouchableOpacity
                  key={phone.id}
                  style={styles.dealCard}
                  onPress={() => navigation.navigate('ProductDetail', { slug: phone.slug })}
                  activeOpacity={0.88}
                >
                  <View style={styles.dealDiscountPill}>
                    <Text style={styles.dealDiscountText}>Save {FormatINR(phone.price - phone.current_price)}</Text>
                  </View>
                  <Image source={{ uri: phone.image_url }} style={styles.dealImage} resizeMode="contain" />
                  <Text style={styles.dealName} numberOfLines={1}>{phone.name}</Text>
                  <View style={styles.dealPriceRow}>
                    <Text style={styles.dealCurrentPrice}>{FormatINR(phone.current_price)}</Text>
                    <Text style={styles.dealOldPrice}>{FormatINR(phone.price)}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* =========================================================
            FEATURED FLAGSHIP SMARTPHONES
            ========================================================= */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Featured Flagships</Text>
            <Text style={styles.sectionSub}>Top-rated smartphones with premium AI & Cameras</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('CatalogTab')}>
            <Text style={styles.viewAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.grid}>
          {featured.map((item) => (
            <View key={item.id} style={styles.gridCol}>
              <ProductCard
                product={item}
                onPress={() => navigation.navigate('ProductDetail', { slug: item.slug })}
              />
            </View>
          ))}
        </View>

        {/* =========================================================
            DELIVERY & RAZORPAY HIGHLIGHT BANNER
            ========================================================= */}
        <View style={styles.infoCard}>
          <Text style={styles.infoCardTitle}>📦 Scheduled Delivery at Checkout</Text>
          <Text style={styles.infoCardText}>
            Never miss a package. Pick your exact date and delivery slot: Morning, Afternoon, Evening, or Same-Day 3-Hour Express!
          </Text>
          <View style={styles.paymentBadgesRow}>
            <View style={styles.paymentBadge}>
              <Text style={styles.paymentBadgeText}>Razorpay UPI (GPay/PhonePe)</Text>
            </View>
            <View style={styles.paymentBadge}>
              <Text style={styles.paymentBadgeText}>Cards & NetBanking</Text>
            </View>
            <View style={styles.paymentBadge}>
              <Text style={styles.paymentBadgeText}>Cash on Delivery</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
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
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: 12,
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  heroBanner: {
    backgroundColor: Colors.primaryDeep,
    margin: 16,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  heroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 10,
    gap: 5,
  },
  heroPillText: {
    color: '#D1FAE5',
    fontSize: 11,
    fontWeight: '700',
  },
  heroHeading: {
    color: Colors.surface,
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 28,
    marginBottom: 8,
  },
  heroHeadingAccent: {
    color: '#34D399',
  },
  heroSub: {
    color: '#A7F3D0',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 16,
  },
  propsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.12)',
    paddingTop: 12,
  },
  propItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  propText: {
    color: Colors.surface,
    fontSize: 11,
    fontWeight: '500',
  },
  heroButton: {
    backgroundColor: '#34D399',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    gap: 6,
  },
  heroButtonText: {
    color: Colors.primaryDarker,
    fontSize: 14,
    fontWeight: '800',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    marginTop: 10,
    marginBottom: 12,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  sectionSub: {
    color: Colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  viewAllText: {
    color: Colors.primaryDark,
    fontSize: 13,
    fontWeight: '700',
  },
  brandsScroll: {
    paddingHorizontal: 16,
    gap: 10,
    paddingBottom: 8,
  },
  brandChip: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    minWidth: 90,
  },
  brandLogo: {
    width: 38,
    height: 38,
    marginBottom: 4,
  },
  brandChipText: {
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  dealsBox: {
    backgroundColor: '#FEF2F2',
    marginHorizontal: 16,
    marginVertical: 14,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  dealsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  rowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dealsTitle: {
    color: '#991B1B',
    fontSize: 15,
    fontWeight: '800',
  },
  dealBadge: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  dealBadgeText: {
    color: Colors.surface,
    fontSize: 10,
    fontWeight: '700',
  },
  dealsScroll: {
    gap: 12,
  },
  dealCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 10,
    width: 150,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    position: 'relative',
  },
  dealDiscountPill: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  dealDiscountText: {
    color: Colors.surface,
    fontSize: 9,
    fontWeight: '800',
  },
  dealImage: {
    width: '100%',
    height: 100,
    marginBottom: 6,
  },
  dealName: {
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  dealPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  dealCurrentPrice: {
    color: Colors.textGreen,
    fontSize: 13,
    fontWeight: '800',
  },
  dealOldPrice: {
    color: Colors.textLight,
    fontSize: 10,
    textDecorationLine: 'line-through',
  },
  grid: {
    paddingHorizontal: 16,
  },
  gridCol: {
    width: '100%',
  },
  infoCard: {
    backgroundColor: Colors.surfaceAlt,
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.greenBorder,
  },
  infoCardTitle: {
    color: Colors.primaryDeep,
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 6,
  },
  infoCardText: {
    color: '#065F46',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 10,
  },
  paymentBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  paymentBadge: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.greenBorder,
  },
  paymentBadgeText: {
    color: Colors.textGreen,
    fontSize: 10,
    fontWeight: '700',
  },
});
