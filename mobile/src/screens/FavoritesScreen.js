import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import favoriteService from '../services/favoriteService';
import LoadingView from '../components/LoadingView';
import ErrorView from '../components/ErrorView';
import colors from '../theme/colors';
import * as formatUtils from '../utils/format';

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

export default function FavoritesScreen({ navigation }) {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [removingId, setRemovingId] = useState(null);

  const loadFavorites = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const items = await favoriteService.getFavorites();
      setFavorites(items);
    } catch (err) {
      setError(err?.message || 'No se pudieron cargar tus favoritos.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadFavorites(false);
    }, [loadFavorites])
  );

  const handleRemoveFavorite = async (productId) => {
    if (removingId) return;
    setRemovingId(productId);
    try {
      await favoriteService.removeFavorite(productId);
      setFavorites((prev) =>
        prev.filter((item) => Number(item.id) !== Number(productId))
      );
    } catch (err) {
      if (err?.status === 404) {
        setFavorites((prev) =>
          prev.filter((item) => Number(item.id) !== Number(productId))
        );
      } else {
        setError(err?.message || 'No se pudo quitar el producto de favoritos.');
      }
    } finally {
      setRemovingId(null);
    }
  };

  const handleOpenProduct = (product) => {
    navigation?.navigate('ProductDetail', {
      productId: product.id,
      id: product.id,
    });
  };

  const handleGoCatalog = () => {
    navigation?.navigate('Catalog');
  };

  if (loading && !refreshing) {
    return <LoadingView message="Cargando tus favoritos..." />;
  }

  if (error && favorites.length === 0) {
    return (
      <ErrorView
        message={error}
        onRetry={() => loadFavorites(false)}
      />
    );
  }

  const renderFavoriteItem = ({ item }) => {
    const isRemoving = Number(removingId) === Number(item.id);

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => handleOpenProduct(item)}
        activeOpacity={0.85}
      >
        {item.imageUrl ? (
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.thumbnail}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.thumbnailPlaceholder}>
            <Ionicons name="image-outline" size={28} color="#94A3B8" />
          </View>
        )}

        <View style={styles.info}>
          <Text style={styles.categoryText}>
            {item.category?.name || 'General'}
          </Text>
          <Text style={styles.title} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.price}>{formatPriceCLP(item.price)}</Text>
          {item.seller?.name ? (
            <Text style={styles.sellerText} numberOfLines={1}>
              Vendedor: {item.seller.name}
            </Text>
          ) : null}
        </View>

        <TouchableOpacity
          style={styles.removeBtn}
          onPress={() => handleRemoveFavorite(item.id)}
          disabled={isRemoving}
          accessibilityLabel="Quitar de favoritos"
        >
          {isRemoving ? (
            <ActivityIndicator size="small" color={colors.secondary || '#B91C1C'} />
          ) : (
            <Ionicons
              name="heart"
              size={24}
              color={colors.secondary || '#B91C1C'}
            />
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={favorites}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderFavoriteItem}
        contentContainerStyle={
          favorites.length === 0 ? styles.emptyContainer : styles.listContainer
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadFavorites(true)}
            colors={[colors.primary || '#002855']}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Ionicons name="heart-outline" size={64} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>Todavía no tienes favoritos</Text>
            <Text style={styles.emptySubtitle}>
              Guarda productos desde el catálogo o su detalle para verlos aquí y
              sincronizarlos con la web.
            </Text>
            <TouchableOpacity
              style={styles.catalogButton}
              onPress={handleGoCatalog}
              activeOpacity={0.85}
            >
              <Ionicons name="search-outline" size={18} color="#FFFFFF" />
              <Text style={styles.catalogButtonText}>Ir al catálogo</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  listContainer: {
    padding: 16,
    gap: 12,
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  thumbnail: {
    width: 78,
    height: 78,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  thumbnailPlaceholder: {
    width: 78,
    height: 78,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary || '#002855',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  price: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary || '#002855',
  },
  sellerText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  removeBtn: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: '#FFF1F2',
  },
  emptyBox: {
    alignItems: 'center',
    maxWidth: 300,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 14,
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  catalogButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary || '#002855',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  catalogButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
