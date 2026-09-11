import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../utils/theme';
import { logoutUser } from '../services/authService';

export const Header = ({ user }) => {
  const handleLogout = () => {
    Alert.alert(
      'Sair da Conta',
      'Tem certeza que deseja sair do CinePattern?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            await logoutUser();
          },
        },
      ]
    );
  };

  const userEmail = user?.email || 'Usuário';
  const username = userEmail.split('@')[0];

  return (
    <View style={styles.container}>
      <View style={styles.brandRow}>
        <View style={styles.logoIconBg}>
          <Ionicons name="film" size={18} color="#FFF" />
        </View>
        <View>
          <Text style={styles.brandName}>
            Cine<Text style={styles.brandAccent}>Pattern</Text>
          </Text>
          <Text style={styles.tagline}>Descoberta por Padrões</Text>
        </View>
      </View>

      <View style={styles.userActionsRow}>
        <View style={styles.userBadge}>
          <Ionicons name="person-circle-outline" size={16} color={theme.colors.accent} />
          <Text style={styles.userNameText} numberOfLines={1}>
            {username}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="log-out-outline" size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.sm,
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceBorder,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoIconBg: {
    backgroundColor: theme.colors.primary,
    width: 34,
    height: 34,
    borderRadius: theme.borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  brandName: {
    color: theme.colors.text,
    fontSize: theme.fontSize.lg,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  brandAccent: {
    color: theme.colors.primary,
  },
  tagline: {
    color: theme.colors.textSecondary,
    fontSize: 10,
    fontWeight: '500',
    marginTop: -2,
  },
  userActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: theme.borderRadius.round,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
    maxWidth: 130,
  },
  userNameText: {
    color: theme.colors.text,
    fontSize: theme.fontSize.xs,
    fontWeight: '600',
    marginLeft: 4,
  },
  logoutBtn: {
    backgroundColor: theme.colors.surface,
    width: 32,
    height: 32,
    borderRadius: theme.borderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
  },
});
