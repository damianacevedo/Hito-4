import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../theme/colors';

export default function ErrorView({ message = 'Ocurrió un error inesperado.', onRetry }) {
  return (
    <View style={styles.container}>
      <Ionicons name="alert-circle-outline" size={56} color={colors.secondary} />
      <Text style={styles.message}>{message}</Text>
      {onRetry ? (
        <TouchableOpacity style={styles.button} onPress={onRetry} activeOpacity={0.85}>
          <Ionicons name="refresh" size={18} color={colors.textOnPrimary} />
          <Text style={styles.buttonText}>Reintentar</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: colors.background,
  },
  message: {
    marginTop: 12,
    marginBottom: 20,
    fontSize: 15,
    lineHeight: 21,
    color: colors.text,
    textAlign: 'center',
    maxWidth: 320,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  buttonText: {
    color: colors.textOnPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
});
