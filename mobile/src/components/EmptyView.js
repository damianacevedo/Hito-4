import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../theme/colors';

export default function EmptyView({ message = 'No hay nada para mostrar.' }) {
  return (
    <View style={styles.container}>
      <Ionicons name="file-tray-outline" size={56} color={colors.inactive} />
      <Text style={styles.message}>{message}</Text>
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
    fontSize: 15,
    lineHeight: 21,
    color: colors.textMuted,
    textAlign: 'center',
    maxWidth: 320,
  },
});
