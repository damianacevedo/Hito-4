import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CatalogFilterSheet from '../components/CatalogFilterSheet';
import EmptyView from '../components/EmptyView';
import ErrorView from '../components/ErrorView';
import LoadingView from '../components/LoadingView';
import ProductCard from '../components/ProductCard';
import categoryService from '../services/categoryService';
import productService from '../services/productService';
import colors from '../theme/colors';

const PAGE_SIZE = 12;
const SEARCH_DEBOUNCE_MS = 400;

const DEFAULT_FILTERS = {
  category: '',
  minPrice: '',
  maxPrice: '',
  condition: '',
  sort: 'recent',
};

function countActiveFilters(filters) {
  return [
    filters.category,
    filters.minPrice,
    filters.maxPrice,
    filters.condition,
    filters.sort !== 'recent',
  ].filter(Boolean).length;
}

export default function CatalogScreen({ navigation }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoriesError, setCategoriesError] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filters, setFilters] = useState({ ...DEFAULT_FILTERS });
  const [filterSheetVisible, setFilterSheetVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [loadMoreError, setLoadMoreError] = useState(null);
  const pageRef = useRef(1);
  const hasMoreRef = useRef(true);
  const isLoadingMoreRef = useRef(false);
  const isLoadingFirstPageRef = useRef(false);
  const requestIdRef = useRef(0);

  const loadCategories = useCallback(async () => {
    setCategoriesLoading(true);
    setCategoriesError(null);
    try {
      const result = await categoryService.getCategories();
      if (!Array.isArray(result)) {
        throw new Error('El servidor devolvió una lista de categorías inválida.');
      }
      setCategories(result);
    } catch (err) {
      setCategoriesError(err?.message || 'No se pudieron cargar las categorías.');
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearch(searchText.trim());
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timeoutId);
  }, [searchText]);

  const buildQuery = useCallback(
    (page) => ({
      page,
      limit: PAGE_SIZE,
      search: debouncedSearch || undefined,
      category: filters.category || undefined,
      minPrice: filters.minPrice === '' ? undefined : Number(filters.minPrice),
      maxPrice: filters.maxPrice === '' ? undefined : Number(filters.maxPrice),
      condition: filters.condition || undefined,
      sort: filters.sort,
    }),
    [debouncedSearch, filters]
  );

  const loadFirstPage = useCallback(
    async (isRefresh = false) => {
      const requestId = ++requestIdRef.current;
      isLoadingFirstPageRef.current = true;
      isLoadingMoreRef.current = false;
      hasMoreRef.current = false;
      setLoadingMore(false);

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      setLoadMoreError(null);

      try {
        const result = await productService.getProducts(buildQuery(1));
        if (!result || !Array.isArray(result.data)) {
          throw new Error('El servidor devolvió una respuesta inválida para el catálogo.');
        }

        if (requestId !== requestIdRef.current) return;

        setProducts(result.data);
        pageRef.current = Number(result.page) || 1;
        hasMoreRef.current =
          result.data.length > 0 &&
          Number(result.page) * Number(result.limit) < Number(result.total);
      } catch (err) {
        if (requestId === requestIdRef.current) {
          setError(err?.message || 'No se pudo cargar el catálogo.');
        }
      } finally {
        if (requestId === requestIdRef.current) {
          isLoadingFirstPageRef.current = false;
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [buildQuery]
  );

  useEffect(() => {
    loadFirstPage();
  }, [loadFirstPage]);

  const loadMore = useCallback(async () => {
    if (
      isLoadingFirstPageRef.current ||
      isLoadingMoreRef.current ||
      !hasMoreRef.current
    ) {
      return;
    }

    const requestId = requestIdRef.current;
    const nextPage = pageRef.current + 1;
    isLoadingMoreRef.current = true;
    setLoadingMore(true);
    setLoadMoreError(null);

    try {
      const result = await productService.getProducts(buildQuery(nextPage));
      if (requestId !== requestIdRef.current) return;
      if (!result || !Array.isArray(result.data)) {
        throw new Error('El servidor devolvió una respuesta inválida para el catálogo.');
      }

      setProducts((currentProducts) => [...currentProducts, ...result.data]);
      pageRef.current = Number(result.page) || nextPage;
      hasMoreRef.current =
        result.data.length > 0 &&
        Number(result.page) * Number(result.limit) < Number(result.total);
    } catch (err) {
      if (requestId === requestIdRef.current) {
        setLoadMoreError(err?.message || 'No se pudieron cargar más productos.');
      }
    } finally {
      if (requestId === requestIdRef.current) {
        isLoadingMoreRef.current = false;
        setLoadingMore(false);
      }
    }
  }, [buildQuery]);

  const openProduct = useCallback(
    (product) => {
      navigation.navigate('ProductDetail', { productId: product.id });
    },
    [navigation]
  );

  const activeFilters = countActiveFilters(filters);

  return (
    <View style={styles.container}>
      <View style={styles.controls}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={20} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Buscar productos"
            placeholderTextColor={colors.inactive}
            returnKeyType="search"
            autoCapitalize="none"
            accessibilityLabel="Buscar productos"
          />
          {searchText ? (
            <TouchableOpacity
              onPress={() => setSearchText('')}
              accessibilityRole="button"
              accessibilityLabel="Limpiar búsqueda"
            >
              <Ionicons name="close-circle" size={20} color={colors.inactive} />
            </TouchableOpacity>
          ) : null}
        </View>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setFilterSheetVisible(true)}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={`Abrir filtros${activeFilters ? `, ${activeFilters} activos` : ''}`}
        >
          <Ionicons name="options-outline" size={20} color={colors.textOnPrimary} />
          <Text style={styles.filterButtonText}>Filtros</Text>
          {activeFilters > 0 ? (
            <View style={styles.filterCount}>
              <Text style={styles.filterCountText}>{activeFilters}</Text>
            </View>
          ) : null}
        </TouchableOpacity>
      </View>

      {loading ? (
        <LoadingView message="Cargando el catálogo..." />
      ) : error ? (
        <ErrorView message={error} onRetry={() => loadFirstPage()} />
      ) : (
        <FlatList
          style={styles.list}
          contentContainerStyle={
            products.length === 0 ? styles.emptyListContent : styles.listContent
          }
          data={products}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <ProductCard product={item} onPress={() => openProduct(item)} />
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadFirstPage(true)}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={
            <EmptyView message="No hay productos que coincidan con tu búsqueda." />
          }
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator
                style={styles.footer}
                size="small"
                color={colors.primary}
                accessibilityLabel="Cargando más productos"
              />
            ) : loadMoreError ? (
              <View style={styles.footerError}>
                <Text style={styles.footerErrorText}>{loadMoreError}</Text>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={loadMore}
                  accessibilityRole="button"
                  accessibilityLabel="Reintentar cargar más productos"
                >
                  <Ionicons name="refresh" size={18} color={colors.textOnPrimary} />
                  <Text style={styles.retryButtonText}>Reintentar</Text>
                </TouchableOpacity>
              </View>
            ) : null
          }
        />
      )}

      <CatalogFilterSheet
        visible={filterSheetVisible}
        categories={categories}
        categoriesLoading={categoriesLoading}
        categoriesError={categoriesError}
        onRetryCategories={loadCategories}
        filters={filters}
        onClose={() => setFilterSheetVisible(false)}
        onApply={(nextFilters) => {
          setFilters(nextFilters);
          setFilterSheetVisible(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 46,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.surface,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 8,
    color: colors.text,
    fontSize: 14,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 46,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: colors.primary,
  },
  filterButtonText: {
    color: colors.textOnPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  filterCount: {
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderRadius: 10,
    backgroundColor: colors.secondary,
  },
  filterCountText: {
    color: colors.textOnPrimary,
    fontSize: 11,
    fontWeight: '700',
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 24,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  footer: {
    paddingVertical: 20,
  },
  footerError: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  footerErrorText: {
    marginBottom: 12,
    color: colors.textMuted,
    textAlign: 'center',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  retryButtonText: {
    color: colors.textOnPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
});
