import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppButton from './AppButton';
import colors from '../theme/colors';

export default function ErrorView({ message = 'Ocurrió un error inesperado.', onRetry }) {
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Ionicons name="alert-circle-outline" size={44} color={colors.primary} />
      </View>
      <Text style={styles.message}>{message}</Text>
      {onRetry ? <AppButton title="Reintentar" icon="refresh" onPress={onRetry} /> : null}
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
  iconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight,
  },
  message: {
    marginTop: 14,
    marginBottom: 20,
    fontSize: 15,
    lineHeight: 21,
    color: colors.text,
    textAlign: 'center',
    maxWidth: 320,
  },
});
