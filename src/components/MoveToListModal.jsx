import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Icon } from './Icon';
import { theme } from '../utils/theme';

export const MoveToListModal = ({
  visible,
  onClose,
  customLists = [],
  selectedCount = 1,
  onMove,
  onOpenCreateList,
}) => {
  const [loadingListId, setLoadingListId] = useState(null);

  const handleSelectTarget = async (targetId) => {
    try {
      setLoadingListId(targetId);
      await onMove(targetId);
      onClose();
    } finally {
      setLoadingListId(null);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={() => {
        if (!loadingListId) onClose();
      }}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.badgeIcon}>
              <Icon name="film" size={20} color={theme.colors.primary} />
            </View>
            <View style={styles.headerTextCol}>
              <Text style={styles.title}>Mover para Lista</Text>
              <Text style={styles.subtitle}>
                {selectedCount} {selectedCount === 1 ? 'filme selecionado' : 'filmes selecionados'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              disabled={!!loadingListId}
            >
              <Icon name="close" size={18} color={theme.colors.textMuted} />
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionLabel}>Escolha o destino:</Text>

          <ScrollView style={styles.listsScroll} showsVerticalScrollIndicator={false}>
            {/* Opção 1: Lista Geral (Todos) */}
            <TouchableOpacity
              style={styles.listItem}
              onPress={() => handleSelectTarget('all')}
              disabled={!!loadingListId}
              activeOpacity={0.7}
            >
              <View style={styles.listIconWrapper}>
                <Icon name="film" size={18} color={theme.colors.textSecondary} />
              </View>
              <View style={styles.listInfo}>
                <Text style={styles.listName}>Geral (Apenas em Todos)</Text>
                <Text style={styles.listDesc}>Remove de listas específicas</Text>
              </View>
              {loadingListId === 'all' ? (
                <ActivityIndicator size="small" color={theme.colors.primary} />
              ) : (
                <Icon name="checkmark" size={16} color={theme.colors.textMuted} />
              )}
            </TouchableOpacity>

            {/* Listas Customizadas Criadas */}
            {customLists.map((list) => (
              <TouchableOpacity
                key={list.id}
                style={styles.listItem}
                onPress={() => handleSelectTarget(list.id)}
                disabled={!!loadingListId}
                activeOpacity={0.7}
              >
                <View style={[styles.listIconWrapper, { backgroundColor: 'rgba(229, 9, 20, 0.15)' }]}>
                  <Icon name={list.icon || 'film'} size={18} color={theme.colors.primary} />
                </View>
                <View style={styles.listInfo}>
                  <Text style={styles.listName}>{list.name}</Text>
                  <Text style={styles.listDesc}>Gera recomendações exclusivas</Text>
                </View>
                {loadingListId === list.id ? (
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                ) : (
                  <Icon name="checkmark" size={16} color={theme.colors.textMuted} />
                )}
              </TouchableOpacity>
            ))}

            {/* Opção para criar nova lista */}
            <TouchableOpacity
              style={styles.createListItem}
              onPress={() => {
                onClose();
                if (onOpenCreateList) onOpenCreateList();
              }}
              activeOpacity={0.7}
            >
              <View style={styles.createIconWrapper}>
                <Icon name="add" size={18} color={theme.colors.primary} />
              </View>
              <Text style={styles.createListText}>+ Criar Nova Lista</Text>
            </TouchableOpacity>
          </ScrollView>

          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={onClose}
            disabled={!!loadingListId}
          >
            <Text style={styles.cancelBtnText}>Cancelar</Text>
          </TouchableOpacity>
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
    maxHeight: '80%',
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  badgeIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(229, 9, 20, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  headerTextCol: {
    flex: 1,
  },
  title: {
    color: theme.colors.text,
    fontSize: theme.fontSize.md,
    fontWeight: '800',
  },
  subtitle: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.xs,
  },
  closeBtn: {
    padding: 4,
  },
  sectionLabel: {
    color: theme.colors.textMuted,
    fontSize: theme.fontSize.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  listsScroll: {
    maxHeight: 280,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceLight,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: theme.borderRadius.md,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
  },
  listIconWrapper: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  listInfo: {
    flex: 1,
  },
  listName: {
    color: theme.colors.text,
    fontSize: theme.fontSize.sm,
    fontWeight: '700',
  },
  listDesc: {
    color: theme.colors.textSecondary,
    fontSize: 10,
    marginTop: 2,
  },
  createListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(229, 9, 20, 0.3)',
    borderStyle: 'dashed',
    marginBottom: 8,
    justifyContent: 'center',
  },
  createIconWrapper: {
    marginRight: 6,
  },
  createListText: {
    color: theme.colors.primary,
    fontSize: theme.fontSize.sm,
    fontWeight: '700',
  },
  cancelBtn: {
    marginTop: theme.spacing.sm,
    height: 42,
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
});
