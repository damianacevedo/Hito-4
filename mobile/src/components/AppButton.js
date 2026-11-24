import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../theme/colors';

/**
 * Botón con el estilo de la web.
 * - variant="primary": rojo sólido (como .btn-unab).
 * - variant="outline": borde rojo y fondo blanco (como .btn-outline-unab, "Ver Detalles").
 * Mientras loading es true muestra un spinner (y loadingTitle si viene) y no se puede tocar.
 */
export default function AppButton({
  title,
  onPress,
  variant = 'primary',
  icon,
  loading = false,
  loadingTitle,
  disabled = false,
  style,
  accessibilityLabel,
}) {
  const isOutline = variant === 'outline';
  const isDisabled = disabled || loading;
  const contentColor = isOutline ? colors.primary : colors.textOnPrimary;
  const label = loading && loadingTitle ? loadingTitle : title;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        isOutline ? styles.outline : styles.primary,
        pressed && (isOutline ? styles.outlinePressed : styles.primaryPressed),
        isDisabled && styles.disabled,
        style,
      ]}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="small" color={contentColor} />
        ) : icon ? (
          <Ionicons name={icon} size={20} color={contentColor} />
        ) : null}
        {label ? <Text style={[styles.text, { color: contentColor }]}>{label}</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  // Al presionar: tono "hover" de la web.
  primaryPressed: {
    backgroundColor: colors.primaryDark,
    borderColor: colors.primaryDark,
  },
  outline: {
    backgroundColor: colors.surface,
    borderColor: colors.primary,
  },
  outlinePressed: {
    backgroundColor: colors.primaryLight,
  },
  disabled: {
    opacity: 0.6,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  text: {
    fontSize: 16,
    fontWeight: '700',
  },
});
