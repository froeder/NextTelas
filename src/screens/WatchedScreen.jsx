import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Icon } from '../components/Icon';
import { theme } from '../utils/theme';
import { MovieCard } from '../components/MovieCard';
import { removeWatchedMovie } from '../services/firestoreService';
import { extractTopGenres } from '../utils/genreExtractor';

export const WatchedScreen = ({
  user,
  watchedMovies = [],
  onNavigateToSearch,
  onRemoveWatched,
}) => {
  const [movieToRemove, setMovieToRemove] = useState(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const { topGenresDetails, totalWatched } = extractTopGenres(watchedMovies, 5);

  const handleOpenRemoveModal = (movie) => {
    setMovieToRemove(movie);
  };

  const handleConfirmRemove = async () => {
    if (!movieToRemove) return;
    try {
      setIsRemoving(true);
      if (onRemoveWatched) {
        await onRemoveWatched(movieToRemove.id);
      } else if (user?.uid) {
        await removeWatchedMovie(user.uid, movieToRemove.id);
      }
      setMovieToRemove(null);
    } catch (err) {
      console.error('Erro ao remover filme:', err);
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header com Estatísticas do Histórico */}
      <View style={styles.statsCard}>
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{totalWatched}</Text>
            <Text style={styles.statLabel}>Filmes Vistos</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{topGenresDetails.length}</Text>
            <Text style={styles.statLabel}>Gêneros Mapeados</Text>
          </View>
        </View>

        {topGenresDetails.length > 0 && (
          <View style={styles.topGenresSection}>
            <Text style={styles.topGenresTitle}>Seus Gêneros Mais Frequentes:</Text>
            <View style={styles.chipsRow}>
              {topGenresDetails.map((genre) => (
                <View key={genre.id} style={styles.chip}>
                  <Text style={styles.chipName}>{genre.name}</Text>
                  <Text style={styles.chipCount}>{genre.count}x</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>

      {/* Lista de Filmes Assistidos */}
      <FlatList
        data={watchedMovies}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <MovieCard
            movie={item}
            isWatched={true}
            showRemoveButton={true}
            onPressRemove={handleOpenRemoveModal}
          />
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconBg}>
              <Icon name="film-outline" size={42} color={theme.colors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>Nenhum Filme Registrado</Text>
            <Text style={styles.emptyText}>
              Pesquise seus filmes favoritos e marque "Já Assisti" para alimentar as recomendações.
            </Text>

            <TouchableOpacity
              style={styles.searchButton}
              onPress={onNavigateToSearch}
              activeOpacity={0.8}
            >
              <Icon name="search" size={16} color="#FFF" style={{ marginRight: 6 }} />
              <Text style={styles.searchButtonText}>Buscar Filmes Agora</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Modal de Confirmação para Remover Filme (Compatível 100% Web & Mobile) */}
      <Modal
        visible={!!movieToRemove}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          if (!isRemoving) setMovieToRemove(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconBadge}>
              <Icon name="trash-outline" size={26} color={theme.colors.error} />
            </View>

            <Text style={styles.modalTitle}>Remover do Histórico?</Text>
            <Text style={styles.modalSubtitle}>
              Deseja remover <Text style={styles.modalMovieHighlight}>"{movieToRemove?.title}"</Text> da sua lista de assistidos? Seus padrões de recomendação serão recalculados.
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setMovieToRemove(null)}
                disabled={isRemoving}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.deleteConfirmBtn}
                onPress={handleConfirmRemove}
                disabled={isRemoving}
                activeOpacity={0.8}
              >
                {isRemoving ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.deleteConfirmBtnText}>Remover</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  statsCard: {
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    color: theme.colors.primary,
    fontSize: theme.fontSize.xxl,
    fontWeight: '900',
  },
  statLabel: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.xs,
    fontWeight: '600',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: theme.colors.surfaceBorder,
  },
  topGenresSection: {
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.surfaceBorder,
  },
  topGenresTitle: {
    color: theme.colors.text,
    fontSize: theme.fontSize.xs,
    fontWeight: '700',
    marginBottom: 6,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.borderRadius.round,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
  },
  chipName: {
    color: theme.colors.text,
    fontSize: 11,
    fontWeight: '600',
    marginRight: 4,
  },
  chipCount: {
    color: theme.colors.accent,
    fontSize: 10,
    fontWeight: '700',
  },
  listContent: {
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.xl,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
    marginTop: theme.spacing.xl,
  },
  emptyIconBg: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
  },
  emptyTitle: {
    color: theme.colors.text,
    fontSize: theme.fontSize.lg,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptyText: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
    marginBottom: theme.spacing.lg,
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 10,
    borderRadius: theme.borderRadius.md,
  },
  searchButtonText: {
    color: '#FFF',
    fontSize: theme.fontSize.sm,
    fontWeight: '700',
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
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
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
  modalMovieHighlight: {
    color: theme.colors.text,
    fontWeight: '700',
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
  deleteConfirmBtn: {
    flex: 1,
    height: 44,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteConfirmBtnText: {
    color: '#FFF',
    fontSize: theme.fontSize.sm,
    fontWeight: '700',
  },
});
