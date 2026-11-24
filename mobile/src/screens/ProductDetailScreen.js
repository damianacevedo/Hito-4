import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import productService from '../services/productService';
import favoriteService from '../services/favoriteService';
import LoadingView from '../components/LoadingView';
import ErrorView from '../components/ErrorView';
import colors from '../theme/colors';
import * as formatUtils from '../utils/format';

const CONDITION_LABELS = {
  nuevo: 'Nuevo',
  como_nuevo: 'Como nuevo',
  buen_estado: 'Buen estado',
  usado: 'Usado',
  para_repuestos: 'Para repuestos',
};

function formatPriceCLP(price) {
  if (typeof formatUtils.formatPrice === 'function') {
    return formatUtils.formatPrice(price);
  }
  if (typeof formatUtils.formatCLP === 'function') {
    return formatUtils.formatCLP(price);
  }
  const amount = Number(price) || 0;
  return '$' + Math.round(amount).toLocaleString('es-CL');
}

export default function ProductDetailScreen({ route }) {
  const productId = route?.params?.productId ?? route?.params?.id;
  const { user } = useAuth();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [imageError, setImageError] = useState(false);

  const [isFavorite, setIsFavorite] = useState(false);
  const [togglingFavorite, setTogglingFavorite] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState(null);

  const showFeedback = useCallback((text) => {
    setFeedbackMessage(text);
    setTimeout(() => {
      setFeedbackMessage((prev) => (prev === text ? null : prev));
    }, 2600);
  }, []);

  const syncFavoriteStatus = useCallback(async () => {
    if (!productId) return;
    try {
      const favorites = await favoriteService.getFavorites();
      const exists = favorites.some(
        (item) => Number(item.id) === Number(productId)
      );
      setIsFavorite(exists);
    } catch {
      // Si falla silenciosamente la sincronización inicial, no bloquea el detalle
    }
  }, [productId]);

  const loadProduct = useCallback(
    async (isRefresh = false) => {
      if (!productId) {
        setError('No se especificó el identificador del producto.');
        setLoading(false);
        setRefreshing(false);
        return;
      }

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        const data = await productService.getById(productId);
        if (!data || data.isActive === false) {
          setProduct(null);
          setError('Este producto no está disponible o fue desactivado.');
        } else {
          setProduct(data);
          setImageError(false);
          await syncFavoriteStatus();
        }
      } catch (err) {
        setProduct(null);
        if (err?.status === 404 || err?.status === 400) {
          setError('El producto solicitado no existe o ya no está disponible.');
        } else {
          setError(err?.message || 'No se pudo cargar el detalle del producto.');
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [productId, syncFavoriteStatus]
  );

  useEffect(() => {
    loadProduct(false);
  }, [loadProduct]);

  useFocusEffect(
    useCallback(() => {
      if (product) {
        syncFavoriteStatus();
      }
    }, [product, syncFavoriteStatus])
  );

  const handleToggleFavorite = async () => {
    if (!product || togglingFavorite) return;

    setTogglingFavorite(true);
    try {
      if (isFavorite) {
        await favoriteService.removeFavorite(product.id);
        setIsFavorite(false);
        showFeedback('Quitado de favoritos');
      } else {
        await favoriteService.addFavorite(product.id);
        setIsFavorite(true);
        showFeedback('Agregado a favoritos');
      }
    } catch (err) {
      if (err?.status === 409) {
        setIsFavorite(true);
        showFeedback('El producto ya estaba en favoritos');
      } else if (err?.status === 404 && isFavorite) {
        setIsFavorite(false);
        showFeedback('Quitado de favoritos');
      } else {
        showFeedback(err?.message || 'No se pudo actualizar favoritos');
      }
    } finally {
      setTogglingFavorite(false);
    }
  };

  if (loading) {
    return <LoadingView message="Cargando detalle del producto..." />;
  }

  if (error || !product) {
    return (
      <ErrorView
        message={error || 'Producto no encontrado.'}
        onRetry={() => loadProduct(false)}
      />
    );
  }

  const conditionText =
    CONDITION_LABELS[product.condition] || product.condition || 'No especificada';
  const stockCount = Number(product.stock) || 0;
  const hasStock = stockCount > 0;
  const isOwnProduct = Boolean(
    user && product.seller && Number(user.id) === Number(product.seller.id)
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => loadProduct(true)}
          colors={[colors.primary || '#002855']}
        />
      }
    >
      {feedbackMessage ? (
        <View style={styles.toastBanner}>
          <Ionicons name="heart" size={16} color="#FFFFFF" />
          <Text style={styles.toastText}>{feedbackMessage}</Text>
        </View>
      ) : null}

      <View style={styles.imageWrapper}>
        {product.imageUrl && !imageError ? (
          <Image
            source={{ uri: product.imageUrl }}
            style={styles.image}
            resizeMode="contain"
            onError={() => setImageError(true)}
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="image-outline" size={56} color="#94A3B8" />
            <Text style={styles.placeholderText}>Sin imagen disponible</Text>
          </View>
        )}
      </View>

      <View style={styles.card}>
        <View style={styles.badgesRow}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>
              {product.category?.name || 'General'}
            </Text>
          </View>
          <View style={styles.conditionBadge}>
            <Text style={styles.conditionBadgeText}>{conditionText}</Text>
          </View>
        </View>

        <Text style={styles.title}>{product.title}</Text>
        <Text style={styles.price}>{formatPriceCLP(product.price)}</Text>

        <View style={styles.stockRow}>
          <Ionicons
            name={hasStock ? 'checkmark-circle' : 'close-circle'}
            size={18}
            color={hasStock ? '#15803D' : colors.secondary || '#B91C1C'}
          />
          <Text
            style={[
              styles.stockText,
              { color: hasStock ? '#15803D' : colors.secondary || '#B91C1C' },
            ]}
          >
            {hasStock ? `Stock disponible: ${stockCount} un.` : 'Sin stock disponible'}
          </Text>
        </View>

        {!isOwnProduct ? (
          <TouchableOpacity
            style={[
              styles.favoriteButton,
              isFavorite ? styles.favoriteButtonActive : styles.favoriteButtonInactive,
            ]}
            onPress={handleToggleFavorite}
            disabled={togglingFavorite}
            activeOpacity={0.8}
          >
            {togglingFavorite ? (
              <ActivityIndicator
                size="small"
                color={isFavorite ? '#FFFFFF' : colors.secondary || '#B91C1C'}
              />
            ) : (
              <Ionicons
                name={isFavorite ? 'heart' : 'heart-outline'}
                size={26}
                color={isFavorite ? '#FFFFFF' : colors.secondary || '#B91C1C'}
              />
            )}
            <Text
              style={[
                styles.favoriteButtonText,
                isFavorite
                  ? styles.favoriteButtonTextActive
                  : styles.favoriteButtonTextInactive,
              ]}
            >
              {isFavorite ? 'En tus favoritos' : 'Agregar a favoritos'}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.ownProductNotice}>
            <Ionicons name="person-outline" size={18} color="#475569" />
            <Text style={styles.ownProductText}>Esta es tu propia publicación</Text>
          </View>
        )}

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>Descripción</Text>
        <Text style={styles.description}>
          {product.description?.trim() || 'El vendedor no agregó una descripción.'}
        </Text>

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>Vendedor</Text>
        <View style={styles.sellerBox}>
          <View style={styles.sellerHeader}>
            <Ionicons
              name="person-circle-outline"
              size={28}
              color={colors.primary || '#002855'}
            />
            <Text style={styles.sellerName}>
              {product.seller?.name || 'Estudiante UNAB'}
            </Text>
          </View>

          {product.seller?.career ? (
            <Text style={styles.sellerMeta}>Carrera: {product.seller.career}</Text>
          ) : null}

          {product.seller?.campus ? (
            <Text style={styles.sellerMeta}>Campus: {product.seller.campus}</Text>
          ) : null}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  contentContainer: {
    paddingBottom: 28,
  },
  toastBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0F172A',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  imageWrapper: {
    width: '100%',
    height: 270,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    marginTop: 8,
    fontSize: 13,
    color: '#64748B',
  },
  card: {
    margin: 16,
    padding: 18,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  categoryBadge: {
    backgroundColor: colors.primary || '#002855',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  conditionBadge: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  conditionBadgeText: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '600',
  },
  title: {
    fontSize: 21,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  price: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.primary || '#002855',
    marginBottom: 10,
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  stockText: {
    fontSize: 14,
    fontWeight: '600',
  },
  favoriteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  favoriteButtonInactive: {
    backgroundColor: '#FFF1F2',
    borderColor: colors.secondary || '#B91C1C',
  },
  favoriteButtonActive: {
    backgroundColor: colors.secondary || '#B91C1C',
    borderColor: colors.secondary || '#B91C1C',
  },
  favoriteButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  favoriteButtonTextInactive: {
    color: colors.secondary || '#B91C1C',
  },
  favoriteButtonTextActive: {
    color: '#FFFFFF',
  },
  ownProductNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F1F5F9',
    paddingVertical: 10,
    borderRadius: 10,
  },
  ownProductText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 6,
  },
  description: {
    fontSize: 14,
    lineHeight: 21,
    color: '#475569',
  },
  sellerBox: {
    backgroundColor: '#F1F5F9',
    padding: 12,
    borderRadius: 10,
  },
  sellerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  sellerName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  sellerMeta: {
    fontSize: 13,
    color: '#475569',
    marginTop: 2,
    marginLeft: 36,
  },
});
