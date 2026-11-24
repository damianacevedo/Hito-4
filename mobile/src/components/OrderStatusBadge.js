import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { orderStatusLabel } from '../utils/format';

const STATUS_STYLES = {
  pendiente: { background: '#FEF3C7', color: '#92400E', icon: 'time-outline' },
  pagado: { background: '#DBEAFE', color: '#1D4ED8', icon: 'card-outline' },
  enviado: { background: '#E0F2FE', color: '#0369A1', icon: 'car-outline' },
  listo_retiro: { background: '#EDE9FE', color: '#6D28D9', icon: 'location-outline' },
  entregado: { background: '#DCFCE7', color: '#166534', icon: 'checkmark-circle-outline' },
  cancelado: { background: '#FEE2E2', color: '#B91C1C', icon: 'close-circle-outline' },
};

export default function OrderStatusBadge({ status }) {
  const statusStyle = STATUS_STYLES[status] || {
    background: '#F1F5F9',
    color: '#475569',
    icon: 'help-circle-outline',
  };

  return (
    <View style={[styles.badge, { backgroundColor: statusStyle.background }]}>
      <Ionicons name={statusStyle.icon} size={14} color={statusStyle.color} />
      <Text style={[styles.label, { color: statusStyle.color }]}>
        {orderStatusLabel(status) || 'Estado desconocido'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
  },
});
