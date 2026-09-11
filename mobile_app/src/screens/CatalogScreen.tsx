import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Colors } from '../constants/theme';
import { Header } from '../components/Header';
import { ProductCard } from '../components/ProductCard';
import { ApiService } from '../services/api';
import { Product, Brand } from '../types';
import { FALLBACK_BRANDS, FALLBACK_PRODUCTS } from '../constants/fallbackData';
import { Search, X, SlidersHorizontal, Check } from 'lucide-react-native';

export const CatalogScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const initialBrand = route?.params?.brand || '';
  const initial5g = route?.params?.is5g ? '1' : '';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState(initialBrand);
  const [is5gOnly, setIs5gOnly] = useState(initial5g === '1');
  const [selectedRam, setSelectedRam] = useState('');
  const [selectedStorage, setSelectedStorage] = useState('');
  const [sortBy, setSortBy] = useState('featured');

  const [products, setProducts] = useState<Product[]>(FALLBACK_PRODUCTS);
  const [loading, setLoading] = useState(false);
  const [brands, setBrands] = useState<Brand[]>(FALLBACK_BRANDS);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params: Record<string, any> = {
        q: searchQuery,
        brand: selectedBrand,
        sort: sortBy,
      };
      if (is5gOnly) params['5g'] = '1';
      if (selectedRam) params.ram = selectedRam;
      if (selectedStorage) params.storage = selectedStorage;

      const res = await ApiService.getProducts(params);
      if (res.status === 'success' && res.products?.length) {
        setProducts(res.products);
      }
    } catch (err) {
      console.warn('Catalog error (using preloaded catalog):', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    ApiService.getHome().then((res) => {
      if (res.brands) setBrands(res.brands);
    });
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [selectedBrand, is5gOnly, selectedRam, selectedStorage, sortBy]);

  const handleSearchSubmit = () => {
    fetchProducts();
  };

  return (
    <View style={styles.container}>
      <Header navigation={navigation} />

      {/* Search Input Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchBox}>
          <Search size={18} color={Colors.textSecondary} />
          <TextInput
            style={styles.input}
            placeholder="Search iPhone, Samsung, OnePlus..."
            placeholderTextColor={Colors.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => { setSearchQuery(''); fetchProducts(); }}>
              <X size={16} color={Colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Chips Bar */}
      <View style={styles.filterChipsRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {/* 5G Toggle */}
          <TouchableOpacity
            style={[styles.chip, is5gOnly && styles.chipActive]}
            onPress={() => setIs5gOnly(!is5gOnly)}
          >
            <Text style={[styles.chipText, is5gOnly && styles.chipTextActive]}>⚡ 5G Only</Text>
          </TouchableOpacity>

          {/* All Brands */}
          <TouchableOpacity
            style={[styles.chip, !selectedBrand && styles.chipActive]}
            onPress={() => setSelectedBrand('')}
          >
            <Text style={[styles.chipText, !selectedBrand && styles.chipTextActive]}>All Brands</Text>
          </TouchableOpacity>

          {/* Brand Chips */}
          {brands.map((b) => (
            <TouchableOpacity
              key={b.id}
              style={[styles.chip, selectedBrand === b.slug && styles.chipActive]}
              onPress={() => setSelectedBrand(selectedBrand === b.slug ? '' : b.slug)}
            >
              <Text style={[styles.chipText, selectedBrand === b.slug && styles.chipTextActive]}>
                {b.name}
              </Text>
            </TouchableOpacity>
          ))}

          {/* RAM Chips */}
          {['8 GB', '12 GB', '16 GB'].map((ram) => (
            <TouchableOpacity
              key={ram}
              style={[styles.chip, selectedRam === ram && styles.chipActive]}
              onPress={() => setSelectedRam(selectedRam === ram ? '' : ram)}
            >
              <Text style={[styles.chipText, selectedRam === ram && styles.chipTextActive]}>{ram}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Catalog List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Filtering smartphones...</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              onPress={() => navigation.navigate('ProductDetail', { slug: item.slug })}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No Smartphones Found</Text>
              <Text style={styles.emptySub}>Try adjusting your filters or search keywords.</Text>
              <TouchableOpacity
                style={styles.resetButton}
                onPress={() => {
                  setSelectedBrand('');
                  setIs5gOnly(false);
                  setSelectedRam('');
                  setSelectedStorage('');
                  setSearchQuery('');
                }}
              >
                <Text style={styles.resetButtonText}>Reset All Filters</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  input: {
    flex: 1,
    marginLeft: 8,
    color: Colors.textPrimary,
    fontSize: 14,
  },
  filterChipsRow: {
    backgroundColor: Colors.surface,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipActive: {
    backgroundColor: Colors.primaryDark,
    borderColor: Colors.primaryDark,
  },
  chipText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  chipTextActive: {
    color: Colors.surface,
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
    paddingBottom: 30,
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
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  resetButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
  },
  resetButtonText: {
    color: Colors.surface,
    fontWeight: '700',
    fontSize: 13,
  },
});
