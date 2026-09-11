import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Icon } from './Icon';
import { theme } from '../utils/theme';
import { registerModalHistory } from '../utils/pwaHistory';

const AVAILABLE_ICONS = ['film', 'flame', 'star', 'sparkles', 'trending-up', 'analytics'];

export const CreateListModal = ({ visible, onClose, onCreate }) => {
  const [listName, setListName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('film');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Registra no histórico do navegador para fechar o modal com o gesto de voltar
  useEffect(() => {
    if (visible && onClose) {
      const unregister = registerModalHistory(onClose);
      return () => unregister();
    }
  }, [visible, onClose]);

  const handleCreate = async () => {
    if (!listName.trim()) {
      setErrorMsg('Por favor, informe um nome para a lista.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');
      const res = await onCreate(listName.trim(), selectedIcon);
      if (res && !res.success) {
        setErrorMsg(res.error || 'Não foi possível criar a lista.');
      } else {
        setListName('');
        setSelectedIcon('film');
        onClose();
      }
    } catch (err) {
      setErrorMsg('Erro inesperado ao criar lista.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={() => {
        if (!loading) onClose();
      }}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.headerIconBadge}>
            <Icon name="sparkles" size={24} color={theme.colors.primary} />
          </View>

          <Text style={styles.title}>Nova Lista Personalizada</Text>
          <Text style={styles.subtitle}>
            Organize seus filmes assistidos por estilo ou ocasião. Cada lista gerará suas próprias recomendações!
          </Text>

          {errorMsg ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          ) : null}

          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Nome da Lista</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Ficção & Universo, Sessão Pipoca..."
              placeholderTextColor={theme.colors.textMuted}
              value={listName}
              onChangeText={(t) => {
                setListName(t);
                if (errorMsg) setErrorMsg('');
              }}
              autoFocus
              maxLength={40}
            />
          </View>

          {/* Seleção de Ícone */}
          <View style={styles.iconSelectionWrapper}>
            <Text style={styles.inputLabel}>Escolha um Ícone</Text>
            <View style={styles.iconsRow}>
              {AVAILABLE_ICONS.map((iconName) => {
                const isSelected = selectedIcon === iconName;
                return (
                  <TouchableOpacity
                    key={iconName}
                    style={[styles.iconChoice, isSelected && styles.iconChoiceSelected]}
                    onPress={() => setSelectedIcon(iconName)}
                    activeOpacity={0.7}
                  >
                    <Icon
                      name={iconName}
                      size={20}
                      color={isSelected ? '#FFF' : theme.colors.textSecondary}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Botões de Ação */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => {
                setListName('');
                setErrorMsg('');
                onClose();
              }}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelBtnText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleCreate}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.submitBtnText}>Criar Lista</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 6, 10, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
    alignItems: 'center',
  },
  headerIconBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(229, 9, 20, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(229, 9, 20, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  title: {
    color: theme.colors.text,
    fontSize: theme.fontSize.lg,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.xs,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: theme.spacing.md,
  },
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderRadius: theme.borderRadius.xs,
    padding: 8,
    width: '100%',
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  errorText: {
    color: theme.colors.error,
    fontSize: theme.fontSize.xs,
    textAlign: 'center',
  },
  inputWrapper: {
    width: '100%',
    marginBottom: theme.spacing.md,
  },
  inputLabel: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.xs,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    backgroundColor: theme.colors.surfaceLight,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
    color: theme.colors.text,
    fontSize: theme.fontSize.sm,
  },
  iconSelectionWrapper: {
    width: '100%',
    marginBottom: theme.spacing.lg,
  },
  iconsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  iconChoice: {
    width: 42,
    height: 42,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.surfaceLight,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconChoiceSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  actionsRow: {
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
  submitBtn: {
    flex: 1,
    height: 44,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#FFF',
    fontSize: theme.fontSize.sm,
    fontWeight: '700',
  },
});
