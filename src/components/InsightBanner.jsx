import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Icon } from './Icon';
import { theme } from '../utils/theme';

export const InsightBanner = ({
  topGenresDetails = [],
  totalWatched = 0,
  listName = null,
}) => {
  if (!topGenresDetails || topGenresDetails.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Icon name="sparkles-outline" size={24} color={theme.colors.accent} />
        <View style={styles.emptyTextContainer}>
          <Text style={styles.emptyTitle}>
            {listName ? `Descobrir para "${listName}"` : 'Descubra Novos Favoritos'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {listName
              ? 'Adicione ou mova filmes para esta lista na aba Já Assisti para mapear este padrão!'
              : 'Marque filmes que você já assistiu na aba Buscar para o algoritmo mapear seu gosto cinematográfico!'}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.badgePattern}>
          <Icon name="analytics" size={14} color="#FFF" style={{ marginRight: 4 }} />
          <Text style={styles.badgePatternText}>
            {listName ? `PADRÕES • ${listName.toUpperCase()}` : 'DESCOBERTA POR PADRÕES'}
          </Text>
        </View>
        <Text style={styles.statCount}>
          {totalWatched} {totalWatched === 1 ? 'filme' : 'filmes'} analisados
        </Text>
      </View>

      <Text style={styles.title}>Gêneros Predominantes:</Text>

      <View style={styles.genresRow}>
        {topGenresDetails.map((genre) => (
          <View key={genre.id} style={styles.genreChip}>
            <Text style={styles.genreChipName}>{genre.name}</Text>
            <View style={styles.genreChipCountBadge}>
              <Text style={styles.genreChipCount}>{genre.count}x</Text>
            </View>
          </View>
        ))}
      </View>

      <Text style={styles.explanation}>
        {listName
          ? `Recomendando títulos afins baseados exclusivamente no perfil da sua lista "${listName}".`
          : 'Sugerindo os melhores lançamentos e títulos aclamados combinando seus gostos mais frequentes.'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  badgePattern: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.borderRadius.xs,
  },
  badgePatternText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statCount: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.xs,
    fontWeight: '500',
  },
  title: {
    color: theme.colors.text,
    fontSize: theme.fontSize.md,
    fontWeight: '700',
    marginBottom: theme.spacing.sm,
  },
  genresRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: theme.spacing.sm,
  },
  genreChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceLight,
    borderColor: theme.colors.surfaceBorder,
    borderWidth: 1,
    borderRadius: theme.borderRadius.round,
    paddingLeft: 10,
    paddingRight: 6,
    paddingVertical: 4,
  },
  genreChipName: {
    color: theme.colors.text,
    fontSize: theme.fontSize.xs,
    fontWeight: '600',
    marginRight: 6,
  },
  genreChipCountBadge: {
    backgroundColor: 'rgba(229, 9, 20, 0.3)',
    borderRadius: theme.borderRadius.round,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  genreChipCount: {
    color: '#FF7B82',
    fontSize: 10,
    fontWeight: '700',
  },
  explanation: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.xs,
    lineHeight: 16,
  },
  emptyContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
    alignItems: 'center',
  },
  emptyTextContainer: {
    marginLeft: theme.spacing.md,
    flex: 1,
  },
  emptyTitle: {
    color: theme.colors.text,
    fontSize: theme.fontSize.sm,
    fontWeight: '700',
    marginBottom: 2,
  },
  emptySubtitle: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.xs,
    lineHeight: 16,
  },
});
