import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Icon } from '../components/Icon';
import { theme } from '../utils/theme';
import { Loading } from '../components/Loading';
import { MovieCard } from '../components/MovieCard';
import { MovieCarousel } from '../components/MovieCarousel';
import { InsightBanner } from '../components/InsightBanner';
import { extractTopGenres, filterAlreadyWatchedMovies } from '../utils/genreExtractor';
import { discoverMoviesByGenres, getTrendingOrPopularMovies } from '../services/tmdbService';
import { addWatchedMovie } from '../services/firestoreService';

export const RecommendationsScreen = ({
  user,
  watchedMovies = [],
  customLists = [],
  selectedListId = 'all',
  onSelectRecommendationList,
  onNavigateToSearch,
  onAddWatched,
}) => {
  const [recommendedMovies, setRecommendedMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [topGenresInfo, setTopGenresInfo] = useState({ topGenreIds: [], topGenresDetails: [], totalWatched: 0 });

  const activeListObj = customLists.find((l) => l.id === selectedListId);
  const activeListName = selectedListId === 'all' ? null : activeListObj?.name;

  // Filtra filmes assistidos que pertencem à lista selecionada para geração de padrões
  const moviesForPattern = selectedListId === 'all'
    ? watchedMovies
    : watchedMovies.filter((m) => Array.isArray(m.listIds) && m.listIds.includes(selectedListId));

  // Set com os IDs de todos os assistidos para conferência O(1)
  const watchedIdsSet = new Set(watchedMovies.map((m) => String(m.id)));
  const isMovieWatched = (movieId) => watchedIdsSet.has(String(movieId));

  // PASSO A (Leitura) + PASSO B (Padrões da Lista) + PASSO C (Descoberta) + PASSO D (Filtro)
  const fetchRecommendations = useCallback(async () => {
    setLoading(true);
    try {
      // Passo B: Extrai gêneros mais frequentes da lista selecionada
      const patternResult = extractTopGenres(moviesForPattern, 3);
      setTopGenresInfo(patternResult);

      let rawDiscoverList = [];

      if (patternResult.topGenreIds.length > 0) {
        // Passo C: Consulta TMDb com os gêneros da lista
        const { results, error } = await discoverMoviesByGenres(patternResult.topGenreIds);
        if (error) {
          console.warn('Erro ao consultar /discover/movie:', error);
        }
        rawDiscoverList = results || [];
      } else {
        // Fallback: se a lista não tem filmes ou usuário não tem histórico
        const { results } = await getTrendingOrPopularMovies(1);
        rawDiscoverList = results || [];
      }

      // Passo D: Filtra filmes já assistidos (de qualquer lista)
      const filtered = filterAlreadyWatchedMovies(rawDiscoverList, watchedMovies);
      setRecommendedMovies(filtered);
    } catch (error) {
      console.error('Erro no fluxo de recomendações:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [moviesForPattern, watchedMovies]);

  // Atualiza recomendações sempre que a lista de filmes ou a lista ativa mudar
  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchRecommendations();
  };

  const handleWatchMovie = async (movie) => {
    if (!user?.uid) return;
    if (onAddWatched) {
      // Se estiver em uma lista customizada, adiciona já vinculando à lista!
      const targetList = selectedListId !== 'all' ? selectedListId : null;
      const res = await onAddWatched(movie, targetList);
      if (res && !res.success && res.error) {
        if (typeof window !== 'undefined' && window.alert) {
          window.alert(res.error);
        } else {
          Alert.alert('Erro ao salvar', res.error);
        }
      }
    } else {
      const { success, error } = await addWatchedMovie(user.uid, movie);
      if (!success) {
        if (typeof window !== 'undefined' && window.alert) {
          window.alert(error || 'Não foi possível registrar o filme.');
        } else {
          Alert.alert('Erro ao salvar', error || 'Não foi possível registrar o filme.');
        }
      }
    }
  };

  // Separa os primeiros 6 filmes para o carrossel e o restante para a lista vertical
  const carouselItems = recommendedMovies.slice(0, 6);
  const listItems = recommendedMovies.slice(6);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={theme.colors.primary}
          colors={[theme.colors.primary]}
        />
      }
    >
      {/* Seletor de Listas para Recomendações Segmentadas */}
      <View style={styles.listSelectorWrapper}>
        <View style={styles.listSelectorHeader}>
          <Text style={styles.listSelectorTitle}>Recomendações Baseadas Em:</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.listSelectorScroll}
        >
          {/* Opção Geral */}
          <TouchableOpacity
            style={[
              styles.selectorChip,
              selectedListId === 'all' && styles.selectorChipActive,
            ]}
            onPress={() => onSelectRecommendationList && onSelectRecommendationList('all')}
            activeOpacity={0.8}
          >
            <Icon
              name="sparkles"
              size={13}
              color={selectedListId === 'all' ? '#FFF' : theme.colors.textSecondary}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                styles.selectorChipText,
                selectedListId === 'all' && styles.selectorChipTextActive,
              ]}
            >
              Geral ({watchedMovies.length})
            </Text>
          </TouchableOpacity>

          {/* Listas Customizadas */}
          {customLists.map((list) => {
            const isActive = selectedListId === list.id;
            const count = watchedMovies.filter(
              (m) => Array.isArray(m.listIds) && m.listIds.includes(list.id)
            ).length;

            return (
              <TouchableOpacity
                key={list.id}
                style={[
                  styles.selectorChip,
                  isActive && styles.selectorChipActive,
                ]}
                onPress={() => onSelectRecommendationList && onSelectRecommendationList(list.id)}
                activeOpacity={0.8}
              >
                <Icon
                  name={list.icon || 'film'}
                  size={13}
                  color={isActive ? '#FFF' : theme.colors.textSecondary}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={[
                    styles.selectorChipText,
                    isActive && styles.selectorChipTextActive,
                  ]}
                >
                  {list.name} ({count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Banner Explicativo da Descoberta por Padrões */}
      <InsightBanner
        topGenresDetails={topGenresInfo.topGenresDetails}
        totalWatched={topGenresInfo.totalWatched}
        listName={activeListName}
      />

      {loading && !refreshing ? (
        <Loading message={activeListName ? `Descobrindo filmes para "${activeListName}"...` : "Calculando padrões e descobrindo recomendações..."} />
      ) : selectedListId !== 'all' && moviesForPattern.length === 0 ? (
        /* Empty State: A lista customizada não tem filmes */
        <View style={styles.emptyStateContainer}>
          <View style={styles.emptyIconBg}>
            <Icon name="film-outline" size={42} color={theme.colors.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>Lista "{activeListName}" Vazia</Text>
          <Text style={styles.emptyDescription}>
            Adicione ou mova filmes que você já assistiu para a lista "{activeListName}" na aba Já Assisti para gerar recomendações exclusivas!
          </Text>
        </View>
      ) : watchedMovies.length === 0 ? (
        /* Empty State Geral */
        <View style={styles.emptyStateContainer}>
          <View style={styles.emptyIconBg}>
            <Icon name="sparkles" size={48} color={theme.colors.accent} />
          </View>
          <Text style={styles.emptyTitle}>Seu Perfil Está Vazio</Text>
          <Text style={styles.emptyDescription}>
            Para ativarmos a <Text style={{ color: theme.colors.primary, fontWeight: '700' }}>Descoberta por Padrões</Text>, marque alguns filmes que você já assistiu.
          </Text>

          <TouchableOpacity
            style={styles.goToSearchButton}
            onPress={onNavigateToSearch}
            activeOpacity={0.8}
          >
            <Icon name="search" size={18} color="#FFF" style={{ marginRight: 8 }} />
            <Text style={styles.goToSearchButtonText}>Buscar e Marcar Filmes</Text>
          </TouchableOpacity>
        </View>
      ) : recommendedMovies.length === 0 ? (
        /* Nenhum filme encontrado após filtragem */
        <View style={styles.emptyStateContainer}>
          <Icon name="film-outline" size={48} color={theme.colors.textMuted} />
          <Text style={styles.emptyTitle}>Sem Novas Sugestões no Momento</Text>
          <Text style={styles.emptyDescription}>
            Você já assistiu a quase todos os títulos mais populares desses gêneros! Tente puxar a tela para atualizar.
          </Text>
        </View>
      ) : (
        /* Conteúdo de Recomendações */
        <>
          {/* Carrossel de Destaques Recomendados */}
          {carouselItems.length > 0 && (
            <MovieCarousel
              title={activeListName ? `Destaques para "${activeListName}"` : "Destaques para Você"}
              movies={carouselItems}
              onPressWatch={handleWatchMovie}
              isMovieWatched={isMovieWatched}
            />
          )}

          {/* Lista Vertical de Mais Recomendações */}
          {listItems.length > 0 && (
            <View style={styles.verticalSection}>
              <View style={styles.sectionHeader}>
                <Icon name="film" size={18} color={theme.colors.primary} style={{ marginRight: 6 }} />
                <Text style={styles.sectionTitle}>
                  {activeListName ? `Mais Títulos para "${activeListName}"` : 'Mais Títulos Compatíveis'}
                </Text>
              </View>

              {listItems.map((movie) => (
                <MovieCard
                  key={movie.id}
                  movie={movie}
                  isWatched={isMovieWatched(movie.id)}
                  onPressWatch={handleWatchMovie}
                />
              ))}
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  listSelectorWrapper: {
    backgroundColor: theme.colors.surface,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: 1,
    borderColor: theme.colors.surfaceBorder,
  },
  listSelectorHeader: {
    paddingHorizontal: theme.spacing.md,
    marginBottom: 6,
  },
  listSelectorTitle: {
    color: theme.colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  listSelectorScroll: {
    paddingHorizontal: theme.spacing.md,
    gap: 8,
    alignItems: 'center',
  },
  selectorChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.round,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
  },
  selectorChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  selectorChipText: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.xs,
    fontWeight: '600',
  },
  selectorChipTextActive: {
    color: '#FFF',
    fontWeight: '700',
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
    marginTop: theme.spacing.lg,
  },
  emptyIconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
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
    textAlign: 'center',
  },
  emptyDescription: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 320,
    marginBottom: theme.spacing.lg,
  },
  goToSearchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 12,
    borderRadius: theme.borderRadius.md,
  },
  goToSearchButtonText: {
    color: '#FFF',
    fontSize: theme.fontSize.sm,
    fontWeight: '700',
  },
  verticalSection: {
    marginTop: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: theme.fontSize.md,
    fontWeight: '700',
  },
});
