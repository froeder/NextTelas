import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { theme } from '../utils/theme';

export const Loading = ({ message = 'Carregando...', fullScreen = false }) => {
  return (
    <View style={[styles.container, fullScreen && styles.fullScreen]}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      {message ? <Text style={styles.text}>{message}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreen: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    marginTop: theme.spacing.sm,
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
    fontWeight: '500',
  },
});
