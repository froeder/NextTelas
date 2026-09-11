import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../utils/theme';

export const GenreBadge = ({ name, active = false, size = 'sm' }) => {
  if (!name) return null;

  return (
    <View style={[styles.badge, active && styles.activeBadge, size === 'xs' && styles.smallBadge]}>
      <Text style={[styles.text, active && styles.activeText, size === 'xs' && styles.smallText]}>
        {name}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    backgroundColor: theme.colors.surfaceLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
    marginRight: 6,
    marginBottom: 4,
  },
  activeBadge: {
    backgroundColor: 'rgba(229, 9, 20, 0.2)',
    borderColor: theme.colors.primary,
  },
  smallBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  text: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.xs,
    fontWeight: '600',
  },
  activeText: {
    color: '#FF7B82',
  },
  smallText: {
    fontSize: 10,
  },
});
