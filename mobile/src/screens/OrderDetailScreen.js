import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import ErrorView from '../components/ErrorView';
import LoadingView from '../components/LoadingView';
import OrderStatusBadge from '../components/OrderStatusBadge';
import orderService from '../services/orderService';
import colors from '../theme/colors';
import { formatDate, formatPrice } from '../utils/format';

const TIMELINE_STEPS = [
  { key: 'pendiente', label: 'Pedido creado', icon: 'document-text-outline' },
  { key: 'pagado', label: 'Pago confirmado', icon: 'card-outline' },
  { key: 'enviado', label: 'Envío o retiro', icon: 'cube-outline' },
  { key: 'entregado', label: 'Entregado', icon: 'checkmark-circle-outline' },
];

function getStepState(status, stepKey) {
  if (status === 'cancelado') return 'inactive';

  const currentStatus = status === 'listo_retiro' ? 'enviado' : status;
  const currentIndex = TIMELINE_STEPS.findIndex((step) => step.key === currentStatus);
  const stepIndex = TIMELINE_STEPS.findIndex((step) => step.key === stepKey);

  if (currentIndex < 0) return 'pending';
  if (stepIndex < currentIndex) return 'complete';
  if (stepIndex === currentIndex) return 'current';
  return 'pending';
}

export default function OrderDetailScreen({ route }) {
  const orderId = route?.params?.orderId;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  const loadOrder = useCallback(async (isRefresh = false) => {
    if (!orderId) {
      setError('No se especificó el identificador del pedido.');
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
      const data = await orderService.getById(orderId);
      if (!data || Number(data.id) !== Number(orderId)) {
        throw new Error('El servidor devolvió un pedido inválido.');
      }
      setOrder(data);
    } catch (err) {
      setError(err?.message || 'No se pudo cargar el detalle del pedido.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [orderId]);

  useFocusEffect(
    useCallback(() => {
      loadOrder(false);
    }, [loadOrder])
  );

  const cancelOrder = async () => {
    if (!order || !['pendiente', 'pagado'].includes(order.status) || cancelling) return;

    setCancelling(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const updatedOrder = await orderService.cancel(order.id);
      if (updatedOrder?.status !== 'cancelado') {
        throw new Error('El servidor no confirmó la cancelación del pedido.');
      }
      setOrder((current) => ({ ...current, ...updatedOrder }));
      setActionSuccess('El pedido fue cancelado y el stock quedó disponible nuevamente.');
    } catch (err) {
      setActionError(err?.message || 'No se pudo cancelar el pedido.');
    } finally {
      setCancelling(false);
    }
  };

  const confirmCancelOrder = () => {
    Alert.alert(
      'Cancelar pedido',
      `¿Quieres cancelar el pedido #${order.id}? El stock reservado será liberado.`,
      [
        { text: 'Volver', style: 'cancel' },
        { text: 'Cancelar pedido', style: 'destructive', onPress: cancelOrder },
      ]
    );
  };

  if (loading) {
    return <LoadingView message={`Cargando pedido #${orderId}...`} />;
  }

  if (error || !order) {
    return (
      <ErrorView
        message={error || 'No se encontró el pedido.'}
        onRetry={() => loadOrder(false)}
      />
    );
  }

  const items = Array.isArray(order.items) ? order.items : [];
  const transactions = Array.isArray(order.transactions) ? order.transactions : [];
  const canCancel = ['pendiente', 'pagado'].includes(order.status);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => loadOrder(true)}
          colors={[colors.primary]}
        />
      }
    >
      <View style={styles.summaryCard}>
        <View style={styles.summaryHeading}>
          <View>
            <Text style={styles.orderNumber}>Pedido #{order.id}</Text>
            <Text style={styles.dateText}>Realizado el {formatDate(order.createdAt)}</Text>
          </View>
          <OrderStatusBadge status={order.status} />
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.total}>{formatPrice(order.total)}</Text>
        </View>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>
          <Ionicons name="git-branch-outline" size={19} color={colors.primary} /> Seguimiento
        </Text>

        {order.status === 'cancelado' ? (
          <View style={styles.cancelledNotice}>
            <Ionicons name="close-circle" size={24} color={colors.danger} />
            <View style={styles.noticeText}>
              <Text style={styles.cancelledTitle}>Pedido cancelado</Text>
              <Text style={styles.cancelledDescription}>
                El stock reservado fue liberado.
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.timeline}>
            {TIMELINE_STEPS.map((step, index) => {
              const state = getStepState(order.status, step.key);
              const tint = state === 'complete' || state === 'current'
                ? colors.primary
                : colors.inactive;

              return (
                <View key={step.key} style={styles.timelineStep}>
                  <View style={styles.timelineMarkerColumn}>
                    <View
                      style={[
                        styles.timelineMarker,
                        state === 'complete' && styles.timelineMarkerComplete,
                        state === 'current' && styles.timelineMarkerCurrent,
                      ]}
                    >
                      <Ionicons
                        name={state === 'complete' ? 'checkmark' : step.icon}
                        size={17}
                        color={state === 'current' || state === 'complete' ? '#FFFFFF' : colors.inactive}
                      />
                    </View>
                    {index < TIMELINE_STEPS.length - 1 ? (
                      <View
                        style={[
                          styles.timelineLine,
                          state === 'complete' && styles.timelineLineComplete,
                        ]}
                      />
                    ) : null}
                  </View>
                  <View style={styles.timelineCopy}>
                    <Text style={[styles.timelineLabel, { color: tint }]}>{step.label}</Text>
                    <Text style={styles.timelineState}>
                      {state === 'complete' ? 'Completado' : state === 'current' ? 'Estado actual' : 'Pendiente'}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>
          <Ionicons name="bag-outline" size={19} color={colors.primary} /> Artículos
        </Text>
        {items.length === 0 ? (
          <Text style={styles.mutedText}>Este pedido no tiene artículos disponibles para mostrar.</Text>
        ) : (
          items.map((item) => {
            const title = item.product?.title || 'Producto';
            const unitPrice = Number(item.unitPrice) || 0;

            return (
              <View key={item.id} style={styles.itemRow}>
                {item.product?.imageUrl ? (
                  <Image
                    source={{ uri: item.product.imageUrl }}
                    style={styles.productImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Ionicons name="image-outline" size={24} color={colors.inactive} />
                  </View>
                )}
                <View style={styles.itemInfo}>
                  <Text style={styles.itemTitle} numberOfLines={2}>{title}</Text>
                  <Text style={styles.itemMeta}>
                    {item.quantity} × {formatPrice(unitPrice)}
                  </Text>
                </View>
                <Text style={styles.itemSubtotal}>
                  {formatPrice(unitPrice * Number(item.quantity || 0))}
                </Text>
              </View>
            );
          })
        )}
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>
          <Ionicons name="receipt-outline" size={19} color={colors.primary} /> Transacciones
        </Text>
        {transactions.length === 0 ? (
          <Text style={styles.mutedText}>Todavía no hay transacciones registradas.</Text>
        ) : (
          transactions.map((transaction) => {
            const approved = transaction.status === 'aprobada';
            return (
              <View key={transaction.id} style={styles.transactionRow}>
                <View style={styles.transactionIcon}>
                  <Ionicons
                    name={approved ? 'checkmark-circle-outline' : 'close-circle-outline'}
                    size={22}
                    color={approved ? colors.success : colors.danger}
                  />
                </View>
                <View style={styles.transactionInfo}>
                  <Text style={styles.transactionTitle}>Transacción #{transaction.id}</Text>
                  <Text style={styles.transactionMeta}>
                    {approved ? 'Aprobada' : 'Rechazada'} · {formatDate(transaction.createdAt)}
                  </Text>
                </View>
                <Text style={styles.transactionAmount}>{formatPrice(transaction.amount)}</Text>
              </View>
            );
          })
        )}
      </View>

      {actionError ? <Text style={styles.actionError}>{actionError}</Text> : null}
      {actionSuccess ? <Text style={styles.actionSuccess}>{actionSuccess}</Text> : null}

      {canCancel ? (
        <TouchableOpacity
          style={[styles.cancelButton, cancelling && styles.disabledButton]}
          onPress={confirmCancelOrder}
          disabled={cancelling}
          activeOpacity={0.85}
        >
          {cancelling ? (
            <ActivityIndicator size="small" color={colors.danger} />
          ) : (
            <Ionicons name="close-circle-outline" size={19} color={colors.danger} />
          )}
          <Text style={styles.cancelButtonText}>
            {cancelling ? 'Cancelando...' : 'Cancelar pedido'}
          </Text>
        </TouchableOpacity>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
    gap: 14,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  summaryHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  orderNumber: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  dateText: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 5,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: 16,
    paddingTop: 12,
  },
  totalLabel: {
    color: colors.textMuted,
    fontSize: 15,
  },
  total: {
    color: colors.primary,
    fontSize: 21,
    fontWeight: '800',
  },
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 14,
  },
  timeline: {
    gap: 0,
  },
  timelineStep: {
    flexDirection: 'row',
    minHeight: 56,
  },
  timelineMarkerColumn: {
    width: 30,
    alignItems: 'center',
  },
  timelineMarker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineMarkerComplete: {
    backgroundColor: colors.success,
  },
  timelineMarkerCurrent: {
    backgroundColor: colors.primary,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    minHeight: 22,
    backgroundColor: colors.border,
  },
  timelineLineComplete: {
    backgroundColor: colors.success,
  },
  timelineCopy: {
    flex: 1,
    paddingLeft: 10,
    paddingBottom: 12,
  },
  timelineLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  timelineState: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  cancelledNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    padding: 12,
  },
  noticeText: {
    flex: 1,
  },
  cancelledTitle: {
    color: colors.danger,
    fontWeight: '800',
  },
  cancelledDescription: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 3,
  },
  mutedText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingVertical: 12,
    gap: 12,
  },
  productImage: {
    width: 58,
    height: 58,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  imagePlaceholder: {
    width: 58,
    height: 58,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  itemMeta: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 4,
  },
  itemSubtotal: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingVertical: 12,
    gap: 10,
  },
  transactionIcon: {
    width: 30,
    alignItems: 'center',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  transactionMeta: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 3,
  },
  transactionAmount: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  actionError: {
    color: colors.danger,
    fontSize: 14,
    textAlign: 'center',
  },
  actionSuccess: {
    color: colors.success,
    fontSize: 14,
    textAlign: 'center',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: 10,
    paddingVertical: 13,
  },
  disabledButton: {
    opacity: 0.6,
  },
  cancelButtonText: {
    color: colors.danger,
    fontSize: 15,
    fontWeight: '700',
  },
});
