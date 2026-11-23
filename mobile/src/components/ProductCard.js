import React, { useState } from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../theme/colors';
import { formatPrice } from '../utils/format';

const CONDITION_LABELS = {
  nuevo: 'Nuevo',
  usado: 'Usado',
};

export default function ProductCard({ product, onPress }) {
  const [imageError, setImageError] = useState(false);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={`Ver ${product.title}`}
    >
      {product.imageUrl && !imageError ? (
        <Image
          source={{ uri: product.imageUrl }}
          style={styles.image}
          resizeMode="cover"
          onError={() => setImageError(true)}
          accessibilityLabel={`Imagen de ${product.title}`}
        />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Ionicons name="image-outline" size={32} color={colors.inactive} />
        </View>
      )}

      <View style={styles.details}>
        <Text style={styles.category} numberOfLines={1}>
          {product.category?.name || 'General'}
        </Text>
        <Text style={styles.title} numberOfLines={2}>
          {product.title}
        </Text>
        <Text style={styles.price}>{formatPrice(product.price)}</Text>
        <View style={styles.meta}>
          <Text style={styles.condition}>
            {CONDITION_LABELS[product.condition] || product.condition || 'Estado no informado'}
          </Text>
          {product.seller?.name ? (
            <Text style={styles.seller} numberOfLines={1}>
              {product.seller.name}
            </Text>
          ) : null}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.inactive} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  image: {
    width: 84,
    height: 84,
    borderRadius: 8,
    backgroundColor: colors.background,
  },
  imagePlaceholder: {
    width: 84,
    height: 84,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: colors.background,
  },
  details: {
    flex: 1,
    marginHorizontal: 12,
  },
  category: {
    marginBottom: 4,
    color: colors.textMuted,
    fontSize: 12,
  },
  title: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  price: {
    marginTop: 6,
    color: colors.primary,
    fontSize: 17,
    fontWeight: '700',
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    gap: 8,
  },
  condition: {
    color: colors.textMuted,
    fontSize: 12,
  },
  seller: {
    flexShrink: 1,
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'right',
  },
});
