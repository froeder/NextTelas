import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Icon } from './Icon';
import { theme } from '../utils/theme';
import { logoutUser } from '../services/authService';
import { registerModalHistory } from '../utils/pwaHistory';
import versionData from '../version.json';

export const Header = ({ user }) => {
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Registra no histórico do navegador para fechar o modal com o gesto de voltar
  useEffect(() => {
    if (showLogoutModal) {
      const unregister = registerModalHistory(() => setShowLogoutModal(false));
      return () => unregister();
    }
  }, [showLogoutModal]);

  const handleConfirmLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logoutUser();
      setShowLogoutModal(false);
    } catch (error) {
      console.error('Erro ao sair da conta:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const userEmail = user?.email || 'Usuário';
  const username = userEmail.split('@')[0];

  return (
    <>
      <View style={styles.container}>
        <View style={styles.brandRow}>
          <Image
            source={{ uri: '/assets/icon.png' }}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <View style={styles.brandTextCol}>
            <Text style={styles.brandName}>
              Next<Text style={styles.brandAccent}>Telas</Text>
            </Text>
            <View style={styles.taglineRow}>
              <Text style={styles.tagline} numberOfLines={1}>
                Descoberta por Padrões
              </Text>
              <View style={styles.versionBadge}>
                <Text style={styles.versionBadgeText}>v{versionData.version}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.userActionsRow}>
          <View style={styles.userBadge}>
            <Icon name="person-circle-outline" size={16} color={theme.colors.accent} />
            <Text style={styles.userNameText} numberOfLines={1}>
              {username}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={() => setShowLogoutModal(true)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.7}
            accessibilityLabel="Sair da Conta"
          >
            <Icon name="log-out-outline" size={18} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Modal de Confirmação de Logout Cinematográfico (Compatível 100% Web & Mobile) */}
      <Modal
        visible={showLogoutModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          if (!isLoggingOut) setShowLogoutModal(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconBadge}>
              <Icon name="log-out-outline" size={26} color={theme.colors.primary} />
            </View>

            <Text style={styles.modalTitle}>Encerrar Sessão?</Text>
            <Text style={styles.modalSubtitle}>
              Você sairá da conta <Text style={styles.modalUserHighlight}>{userEmail}</Text>. Deseja realmente desconectar?
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowLogoutModal(false)}
                disabled={isLoggingOut}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={handleConfirmLogout}
                disabled={isLoggingOut}
                activeOpacity={0.8}
              >
                {isLoggingOut ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.confirmBtnText}>Sair</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Rodapé com detalhes da versão */}
            <View style={styles.versionFooter}>
              <Text style={styles.versionFooterText}>
                NextTelas v{versionData.version} • Build #{versionData.buildNumber}
              </Text>
              <Text style={styles.versionDateText}>Atualizado em {versionData.buildTime}</Text>
            </View>
          </View>
        </View>
      </Modal>
    </>
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
    zIndex: 10,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    minWidth: 0,
  },
  logoImage: {
    width: 34,
    height: 34,
    borderRadius: theme.borderRadius.sm,
    marginRight: 10,
  },
  brandTextCol: {
    flexShrink: 1,
    minWidth: 0,
  },
  taglineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 1,
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
  versionBadge: {
    backgroundColor: 'rgba(229, 9, 20, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(229, 9, 20, 0.35)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: theme.borderRadius.xs,
    flexShrink: 0,
  },
  versionBadgeText: {
    color: theme.colors.primary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  tagline: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: '500',
    flexShrink: 1,
  },
  userActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
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
    width: 34,
    height: 34,
    borderRadius: theme.borderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 6, 10, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  modalCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
    padding: theme.spacing.lg,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  modalIconBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(229, 9, 20, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(229, 9, 20, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  modalTitle: {
    color: theme.colors.text,
    fontSize: theme.fontSize.lg,
    fontWeight: '800',
    marginBottom: 6,
    textAlign: 'center',
  },
  modalSubtitle: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: theme.spacing.lg,
  },
  modalUserHighlight: {
    color: theme.colors.text,
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surfaceLight,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
  },
  confirmBtn: {
    flex: 1,
    height: 44,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmBtnText: {
    color: '#FFF',
    fontSize: theme.fontSize.sm,
    fontWeight: '700',
  },
  versionFooter: {
    marginTop: theme.spacing.md,
    alignItems: 'center',
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.surfaceBorder,
    width: '100%',
  },
  versionFooterText: {
    color: theme.colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  versionDateText: {
    color: theme.colors.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
});
