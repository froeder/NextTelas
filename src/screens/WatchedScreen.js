import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../utils/theme';
import { MovieCard } from '../components/MovieCard';
import { removeWatchedMovie } from '../services/firestoreService';
import { extractTopGenres } from '../utils/genreExtractor';

export const WatchedScreen = ({ user, watchedMovies = [], onNavigateToSearch }) => {
  const { topGenresDetails, totalWatched } = extractTopGenres(watchedMovies, 5);

  const handleRemoveMovie = (movie) => {
    Alert.alert(
      'Remover Filme',
      `Deseja remover "${movie.title}" do seu histórico de assistidos?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            if (!user?.uid) return;
            const { success, error } = await removeWatchedMovie(user.uid, movie.id);
            if (!success) {
              Alert.alert('Erro', error || 'Não foi possível remover o filme.');
            }
          },
        },
      ]
    );
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
            onPressRemove={handleRemoveMovie}
          />
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconBg}>
              <Ionicons name="film-outline" size={42} color={theme.colors.textMuted} />
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
              <Ionicons name="search" size={16} color="#FFF" style={{ marginRight: 6 }} />
              <Text style={styles.searchButtonText}>Buscar Filmes Agora</Text>
            </TouchableOpacity>
          </View>
        }
      />
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
});
