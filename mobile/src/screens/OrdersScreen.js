import React, { useCallback, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import EmptyView from '../components/EmptyView';
import ErrorView from '../components/ErrorView';
import LoadingView from '../components/LoadingView';
import OrderStatusBadge from '../components/OrderStatusBadge';
import orderService from '../services/orderService';
import colors from '../theme/colors';
import { formatDate, formatPrice } from '../utils/format';

export default function OrdersScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const loadOrders = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const data = await orderService.getMyOrders();
      if (!Array.isArray(data)) {
        throw new Error('El servidor devolvió un listado de pedidos inválido.');
      }
      setOrders(data);
    } catch (err) {
      setError(err?.message || 'No se pudieron cargar tus pedidos.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadOrders(false);
    }, [loadOrders])
  );

  const openOrder = (order) => {
    navigation.navigate('OrderDetail', { orderId: order.id });
  };

  if (loading && !refreshing) {
    return <LoadingView message="Cargando tus pedidos..." />;
  }

  if (error && orders.length === 0) {
    return <ErrorView message={error} onRetry={() => loadOrders(false)} />;
  }

  const renderOrder = ({ item }) => {
    const items = Array.isArray(item.items) ? item.items : [];
    const itemSummary = items
      .slice(0, 2)
      .map((orderItem) => orderItem.product?.title || 'Producto')
      .join(' · ');
    const remainingItems = items.length - 2;

    return (
      <TouchableOpacity
        style={styles.orderCard}
        onPress={() => openOrder(item)}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={`Ver pedido ${item.id}, ${formatPrice(item.total)}, ${items.length} productos`}
      >
        <View style={styles.cardHeader}>
          <View style={styles.orderTitleRow}>
            <Ionicons name="receipt-outline" size={20} color={colors.primary} />
            <Text style={styles.orderTitle}>Pedido #{item.id}</Text>
          </View>
          <OrderStatusBadge status={item.status} />
        </View>

        <View style={styles.dateRow}>
          <Ionicons name="calendar-outline" size={15} color={colors.textMuted} />
          <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
        </View>

        <Text style={styles.itemSummary} numberOfLines={2}>
          {itemSummary || 'Sin artículos'}
          {remainingItems > 0 ? ` y ${remainingItems} más` : ''}
        </Text>

        <View style={styles.cardFooter}>
          <Text style={styles.itemCount}>
            {items.length} {items.length === 1 ? 'artículo' : 'artículos'}
          </Text>
          <Text style={styles.total}>{formatPrice(item.total)}</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.inactive} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <FlatList
      style={styles.container}
      data={orders}
      keyExtractor={(item) => String(item.id)}
      renderItem={renderOrder}
      contentContainerStyle={orders.length === 0 ? styles.emptyContent : styles.listContent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => loadOrders(true)}
          colors={[colors.primary]}
        />
      }
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.heading}>Mis compras</Text>
          <Text style={styles.subtitle}>Revisa el estado y el historial de tus pedidos.</Text>
          {error ? <Text style={styles.refreshError}>{error}</Text> : null}
        </View>
      }
      ListEmptyComponent={
        <View style={styles.emptyBox}>
          <EmptyView message="Aún no tienes compras. Cuando realices un pedido, aparecerá aquí." />
          <TouchableOpacity
            style={styles.catalogButton}
            onPress={() => navigation.navigate('ExploreTab', { screen: 'Catalog' })}
            activeOpacity={0.85}
          >
            <Ionicons name="search-outline" size={18} color={colors.textOnPrimary} />
            <Text style={styles.catalogButtonText}>Ir al catálogo</Text>
          </TouchableOpacity>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    padding: 16,
    paddingBottom: 28,
    gap: 12,
  },
  emptyContent: {
    flexGrow: 1,
    padding: 16,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 4,
  },
  heading: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  refreshError: {
    color: colors.danger,
    fontSize: 13,
    marginTop: 8,
  },
  orderCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  orderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  orderTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    color: colors.textMuted,
    fontSize: 13,
  },
  itemSummary: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
    gap: 10,
  },
  itemCount: {
    color: colors.textMuted,
    fontSize: 13,
    flex: 1,
  },
  total: {
    color: colors.primary,
    fontSize: 17,
    fontWeight: '800',
  },
  emptyBox: {
    alignItems: 'center',
  },
  catalogButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  catalogButtonText: {
    color: colors.textOnPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
});
