import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Icon } from '../components/Icon';
import { theme } from '../utils/theme';
import { Loading } from '../components/Loading';
import { MovieDetailsModal } from '../components/MovieDetailsModal';
import { InsightBanner } from '../components/InsightBanner';
import { extractTopGenres, filterAlreadyWatchedMovies } from '../utils/genreExtractor';
import {
  getMovieRecommendations,
  getTrendingOrPopularMovies,
  getMoviePosterUrl,
} from '../services/tmdbService';
import { getGenreNames } from '../utils/tmdbGenres';
import { addWatchedMovie } from '../services/firestoreService';

// ─── Constantes de layout ───────────────────────────────────────────────────
const POSTER_W = 100;
const POSTER_H = 150;
const MAX_SOURCE_MOVIES = 12; // quantos filmes-origem usamos
const RECS_PER_MOVIE = 8;     // quantas recomendações por filme buscamos inicialmente

// ─── Componente interno: Card compacto para o carrossel ─────────────────────
const RecCard = ({ movie, isWatched, onWatch, onOpenDetails }) => {
  const [loading, setLoading] = useState(false);
  const posterUri = getMoviePosterUrl(movie.poster_path);
  const rating = movie.vote_average ? Number(movie.vote_average).toFixed(1) : null;
  const primaryGenre = getGenreNames(movie.genre_ids || [])[0] || '';

  const handleWatch = async (e) => {
    e?.stopPropagation?.();
    if (loading || isWatched) return;
    setLoading(true);
    try { await onWatch(movie); } finally { setLoading(false); }
  };

  return (
    <TouchableOpacity style={recCardStyles.card} activeOpacity={0.88} onPress={() => onOpenDetails(movie)}>
      <View style={recCardStyles.posterBox}>
        {posterUri ? (
          <Image source={{ uri: posterUri }} style={recCardStyles.poster} resizeMode="cover" />
        ) : (
          <View style={recCardStyles.posterFallback}>
            <Icon name="film-outline" size={28} color={theme.colors.textMuted} />
          </View>
        )}

        {rating && rating !== '0.0' ? (
          <View style={recCardStyles.ratingBadge}>
            <Icon name="star" size={9} color={theme.colors.accent} />
            <Text style={recCardStyles.ratingText}>{rating}</Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={[recCardStyles.watchBtn, isWatched && recCardStyles.watchBtnActive]}
          onPress={handleWatch}
          disabled={isWatched || loading}
          activeOpacity={0.7}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Icon
              name={isWatched ? 'checkmark' : 'add'}
              size={15}
              color={isWatched ? theme.colors.success : '#FFF'}
            />
          )}
        </TouchableOpacity>
      </View>

      <Text style={recCardStyles.title} numberOfLines={1}>{movie.title}</Text>
      {primaryGenre ? <Text style={recCardStyles.genre} numberOfLines={1}>{primaryGenre}</Text> : null}
    </TouchableOpacity>
  );
};

const recCardStyles = StyleSheet.create({
  card: { width: POSTER_W, marginRight: 12 },
  posterBox: {
    width: POSTER_W,
    height: POSTER_H,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
    position: 'relative',
  },
  poster: { width: '100%', height: '100%' },
  posterFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceLight,
  },
  ratingBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(11,12,18,0.85)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.xs,
    borderWidth: 1,
    borderColor: 'rgba(255,184,0,0.4)',
  },
  ratingText: { color: '#FFF', fontSize: 10, fontWeight: '700', marginLeft: 3 },
  watchBtn: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  watchBtnActive: {
    backgroundColor: 'rgba(11,12,18,0.85)',
    borderWidth: 1,
    borderColor: theme.colors.success,
  },
  title: {
    color: theme.colors.text,
    fontSize: theme.fontSize.xs,
    fontWeight: '700',
    marginTop: 5,
  },
  genre: {
    color: theme.colors.textSecondary,
    fontSize: 10,
    marginTop: 1,
  },
});

// ─── Componente interno: Seção de recomendações de UM filme ─────────────────
const SourceMovieSection = ({ sourceMovie, recommendations, isMovieWatched, onWatch, onOpenDetails }) => {
  if (!recommendations || recommendations.length === 0) return null;

  const sourcePoster = getMoviePosterUrl(sourceMovie.poster_path);
  const sourceYear = (sourceMovie.release_date || '').split('-')[0];

  return (
    <View style={sectionStyles.container}>
      {/* Cabeçalho com mini-poster do filme origem */}
      <TouchableOpacity
        style={sectionStyles.header}
        onPress={() => onOpenDetails && onOpenDetails(sourceMovie)}
        activeOpacity={0.7}
      >
        <View style={sectionStyles.sourcePosterBox}>
          {sourcePoster ? (
            <Image source={{ uri: sourcePoster }} style={sectionStyles.sourcePoster} resizeMode="cover" />
          ) : (
            <View style={sectionStyles.sourcePosterFallback}>
              <Icon name="film-outline" size={14} color={theme.colors.textMuted} />
            </View>
          )}
        </View>
        <View style={sectionStyles.headerText}>
          <Text style={sectionStyles.sourceLabel}>Porque você assistiu</Text>
          <Text style={sectionStyles.sourceTitle} numberOfLines={1}>
            {sourceMovie.title}
            {sourceYear ? <Text style={sectionStyles.sourceYear}> · {sourceYear}</Text> : null}
          </Text>
        </View>
        <View style={sectionStyles.countBadge}>
          <Text style={sectionStyles.countBadgeText}>{recommendations.length}</Text>
        </View>
      </TouchableOpacity>

      {/* Carrossel das recomendações */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={sectionStyles.scrollContent}
      >
        {recommendations.map((movie) => (
          <RecCard
            key={movie.id}
            movie={movie}
            isWatched={isMovieWatched(movie.id)}
            onWatch={onWatch}
            onOpenDetails={onOpenDetails}
          />
        ))}
      </ScrollView>
    </View>
  );
};

const sectionStyles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceBorder,
    paddingBottom: theme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    marginBottom: 10,
    gap: 10,
  },
  sourcePosterBox: {
    width: 36,
    height: 54,
    borderRadius: theme.borderRadius.xs,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
    backgroundColor: theme.colors.surfaceLight,
  },
  sourcePoster: { width: '100%', height: '100%' },
  sourcePosterFallback: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerText: { flex: 1 },
  sourceLabel: {
    color: theme.colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  sourceTitle: {
    color: theme.colors.text,
    fontSize: theme.fontSize.sm,
    fontWeight: '800',
  },
  sourceYear: {
    color: theme.colors.textSecondary,
    fontWeight: '400',
  },
  countBadge: {
    backgroundColor: 'rgba(229,9,20,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(229,9,20,0.35)',
    borderRadius: theme.borderRadius.round,
    width: 26,
    height: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countBadgeText: {
    color: theme.colors.primary,
    fontSize: 11,
    fontWeight: '800',
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.md,
    paddingRight: theme.spacing.lg,
  },
});

// ─── Tela Principal ─────────────────────────────────────────────────────────
export const RecommendationsScreen = ({
  user,
  watchedMovies = [],
  customLists = [],
  selectedListId = 'all',
  onSelectRecommendationList,
  onNavigateToSearch,
  onAddWatched,
}) => {
  // { movieId: [rec, rec, ...] }
  const [recsBySource, setRecsBySource] = useState({});
  // ordem dos filmes-origem para exibição
  const [sourceOrder, setSourceOrder] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [topGenresInfo, setTopGenresInfo] = useState({ topGenreIds: [], topGenresDetails: [], totalWatched: 0 });
  const [detailMovie, setDetailMovie] = useState(null);

  const activeListObj = customLists.find((l) => l.id === selectedListId);
  const activeListName = selectedListId === 'all' ? null : activeListObj?.name;

  const moviesForPattern = React.useMemo(() => {
    return selectedListId === 'all'
      ? watchedMovies
      : watchedMovies.filter((m) => Array.isArray(m.listIds) && m.listIds.includes(selectedListId));
  }, [watchedMovies, selectedListId]);

  const moviesKey = React.useMemo(() => {
    return (
      selectedListId +
      '_' +
      watchedMovies.length +
      '_' +
      moviesForPattern.map((m) => String(m.id)).join(',')
    );
  }, [selectedListId, watchedMovies.length, moviesForPattern]);

  const watchedIdsSet = React.useMemo(() => {
    return new Set(watchedMovies.map((m) => String(m.id)));
  }, [watchedMovies]);

  const isMovieWatched = (movieId) => watchedIdsSet.has(String(movieId));

  // Array 'recomendados' com TODOS os filmes recomendados únicos (sem repetidos)
  const recomendados = React.useMemo(() => {
    const map = new Map();
    Object.values(recsBySource).forEach((movieList) => {
      if (Array.isArray(movieList)) {
        movieList.forEach((movie) => {
          if (movie && movie.id && !map.has(String(movie.id))) {
            map.set(String(movie.id), movie);
          }
        });
      }
    });
    return Array.from(map.values());
  }, [recsBySource]);

  // Escolhe um filme aleatório entre todos os recomendados
  const handlePickRandomMovie = () => {
    if (!recomendados || recomendados.length === 0) {
      if (typeof window !== 'undefined' && window.alert) {
        window.alert('Nenhuma recomendação disponível no momento.');
      } else {
        Alert.alert('Aviso', 'Nenhuma recomendação disponível no momento.');
      }
      return;
    }
    const randomIndex = Math.floor(Math.random() * recomendados.length);
    const randomMovie = recomendados[randomIndex];
    setDetailMovie(randomMovie);
  };

  const fetchRecommendations = useCallback(async () => {
    setLoading(true);
    try {
      // Extrai padrões de gênero para o InsightBanner
      const patternResult = extractTopGenres(moviesForPattern, 3);
      setTopGenresInfo(patternResult);

      // Sem filmes: mostra fallback de populares como "seed"
      if (moviesForPattern.length === 0) {
        const { results } = await getTrendingOrPopularMovies(1);
        const filtered = filterAlreadyWatchedMovies(results || [], watchedMovies).slice(0, 6);
        setSourceOrder(['__trending__']);
        setRecsBySource({ '__trending__': filtered });
        return;
      }

      // Escolhe os filmes-origem: os mais recentemente adicionados (ou embaralhados para variar)
      const sourceCandidates = [...moviesForPattern]
        .sort((a, b) => {
          // Prioriza filmes com nota alta para seed de melhor qualidade
          return (b.vote_average || 0) - (a.vote_average || 0);
        })
        .slice(0, MAX_SOURCE_MOVIES);

      // Busca recomendações em paralelo para todos os filmes-origem (página 1)
      const results = await Promise.allSettled(
        sourceCandidates.map((src) => getMovieRecommendations(src.id, 1))
      );

      const newRecsBySource = {};
      const newOrder = [];

      let anyHasMore = false;
      results.forEach((result, idx) => {
        const sourceMovie = sourceCandidates[idx];
        if (result.status !== 'fulfilled') return;

        const recs = result.value.results || [];
        const totalPages = result.value.total_pages || 1;
        if (totalPages > 1) anyHasMore = true;

        // Filtra já assistidos + duplicatas entre seções
        const seen = new Set(Object.values(newRecsBySource).flat().map((m) => String(m.id)));
        const fresh = recs
          .filter((m) => !watchedIdsSet.has(String(m.id)) && !seen.has(String(m.id)))
          .slice(0, RECS_PER_MOVIE);

        if (fresh.length > 0) {
          newRecsBySource[sourceMovie.id] = fresh;
          newOrder.push(sourceMovie.id);
        }
      });

      setRecsBySource(newRecsBySource);
      setSourceOrder(newOrder);
      setCurrentPage(1);
      setHasMore(anyHasMore);
    } catch (error) {
      console.error('Erro no fluxo de recomendações:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [moviesForPattern, watchedMovies, watchedIdsSet]);

  useEffect(() => {
    fetchRecommendations();
  }, [moviesKey]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchRecommendations();
  };

  // Carrega mais recomendações (próxima página da TMDb por filme-origem)
  const handleLoadMore = async () => {
    if (loadingMore || loading) return;
    setLoadingMore(true);
    const nextPage = currentPage + 1;
    try {
      const sourceCandidates = [...moviesForPattern]
        .sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0))
        .slice(0, MAX_SOURCE_MOVIES);

      const results = await Promise.allSettled(
        sourceCandidates.map((src) => getMovieRecommendations(src.id, nextPage))
      );

      const allCurrentIds = new Set([
        ...watchedIdsSet,
        ...Object.values(recsBySource).flat().map((m) => String(m.id)),
      ]);

      let anyNewFound = false;
      let anyHasMore = false;

      setRecsBySource((prev) => {
        const updated = { ...prev };
        results.forEach((result, idx) => {
          const sourceMovie = sourceCandidates[idx];
          if (result.status !== 'fulfilled') return;

          const recs = result.value.results || [];
          const totalPages = result.value.total_pages || 1;
          if (nextPage < totalPages) anyHasMore = true;

          const fresh = recs.filter((m) => !allCurrentIds.has(String(m.id)));
          fresh.forEach((m) => allCurrentIds.add(String(m.id)));

          if (fresh.length > 0) {
            anyNewFound = true;
            // Acumula, mas limita a 12 por seção para não sobrecarregar a UI
            const existing = updated[sourceMovie.id] || [];
            updated[sourceMovie.id] = [...existing, ...fresh].slice(0, 12);

            // Garante que a seção está na ordem
            setSourceOrder((order) =>
              order.includes(String(sourceMovie.id)) ? order : [...order, String(sourceMovie.id)]
            );
          }
        });
        return updated;
      });

      setCurrentPage(nextPage);
      setHasMore(anyHasMore && anyNewFound);
    } catch (err) {
      console.error('Erro ao carregar mais:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleWatchMovie = async (movie) => {
    if (!user?.uid) return;
    if (onAddWatched) {
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

  // Total de recomendações únicas encontradas
  const totalRecs = Object.values(recsBySource).flat().length;
  const hasTrending = sourceOrder[0] === '__trending__';

  return (
    <>
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
        {/* Seletor de Listas */}
        <View style={styles.listSelectorWrapper}>
          <View style={styles.listSelectorHeader}>
            <Text style={styles.listSelectorTitle}>Recomendações Baseadas Em:</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.listSelectorScroll}
          >
            <TouchableOpacity
              style={[styles.selectorChip, selectedListId === 'all' && styles.selectorChipActive]}
              onPress={() => onSelectRecommendationList && onSelectRecommendationList('all')}
              activeOpacity={0.8}
            >
              <Icon
                name="sparkles"
                size={13}
                color={selectedListId === 'all' ? '#FFF' : theme.colors.textSecondary}
                style={{ marginRight: 6 }}
              />
              <Text style={[styles.selectorChipText, selectedListId === 'all' && styles.selectorChipTextActive]}>
                Geral ({watchedMovies.length})
              </Text>
            </TouchableOpacity>

            {customLists.map((list) => {
              const isActive = selectedListId === list.id;
              const count = watchedMovies.filter(
                (m) => Array.isArray(m.listIds) && m.listIds.includes(list.id)
              ).length;
              return (
                <TouchableOpacity
                  key={list.id}
                  style={[styles.selectorChip, isActive && styles.selectorChipActive]}
                  onPress={() => onSelectRecommendationList && onSelectRecommendationList(list.id)}
                  activeOpacity={0.8}
                >
                  <Icon
                    name={list.icon || 'film'}
                    size={13}
                    color={isActive ? '#FFF' : theme.colors.textSecondary}
                    style={{ marginRight: 6 }}
                  />
                  <Text style={[styles.selectorChipText, isActive && styles.selectorChipTextActive]}>
                    {list.name} ({count})
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Banner de Gêneros */}
        <InsightBanner
          topGenresDetails={topGenresInfo.topGenresDetails}
          totalWatched={topGenresInfo.totalWatched}
          listName={activeListName}
        />

        {/* Banner de Sortear Filme Aleatório entre todos os recomendados */}
        {recomendados.length > 0 && !loading && (
          <View style={styles.randomBarWrapper}>
            <TouchableOpacity
              style={styles.randomPickBanner}
              onPress={handlePickRandomMovie}
              activeOpacity={0.85}
            >
              <View style={styles.randomPickLeft}>
                <View style={styles.randomIconBadge}>
                  <Icon name="sparkles" size={18} color="#FFF" />
                </View>
                <View style={styles.randomPickTextCol}>
                  <Text style={styles.randomPickTitle}>Não sabe o que assistir?</Text>
                  <Text style={styles.randomPickSub}>
                    Escolha um filme aleatório entre os {recomendados.length} recomendados
                  </Text>
                </View>
              </View>
              <View style={styles.randomPickBtn}>
                <Icon name="zap" size={14} color="#FFF" style={{ marginRight: 5 }} />
                <Text style={styles.randomPickBtnText}>Sortear</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Estados */}
        {loading && !refreshing ? (
          <Loading message={activeListName ? `Descobrindo filmes para "${activeListName}"...` : 'Buscando recomendações personalizadas...'} />
        ) : selectedListId !== 'all' && moviesForPattern.length === 0 ? (
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
          <View style={styles.emptyStateContainer}>
            <View style={styles.emptyIconBg}>
              <Icon name="sparkles" size={48} color={theme.colors.accent} />
            </View>
            <Text style={styles.emptyTitle}>Seu Perfil Está Vazio</Text>
            <Text style={styles.emptyDescription}>
              Para ativarmos a{' '}
              <Text style={{ color: theme.colors.primary, fontWeight: '700' }}>Descoberta por Padrões</Text>
              , marque alguns filmes que você já assistiu.
            </Text>
            <TouchableOpacity style={styles.goToSearchButton} onPress={onNavigateToSearch} activeOpacity={0.8}>
              <Icon name="search" size={18} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={styles.goToSearchButtonText}>Buscar e Marcar Filmes</Text>
            </TouchableOpacity>
          </View>
        ) : totalRecs === 0 && !loading ? (
          <View style={styles.emptyStateContainer}>
            <Icon name="film-outline" size={48} color={theme.colors.textMuted} />
            <Text style={styles.emptyTitle}>Sem Novas Sugestões</Text>
            <Text style={styles.emptyDescription}>
              Você já assistiu a quase todos os títulos semelhantes! Puxe a tela para atualizar.
            </Text>
          </View>
        ) : (
          /* ── Conteúdo principal ── */
          <View style={styles.sectionsWrapper}>
            {/* Cabeçalho global */}
            {!hasTrending && sourceOrder.length > 0 && (
              <View style={styles.globalHeader}>
                <View style={styles.globalHeaderLeft}>
                  <Icon name="sparkles" size={16} color={theme.colors.accent} style={{ marginRight: 6 }} />
                  <Text style={styles.globalHeaderTitle}>
                    {activeListName ? `Para "${activeListName}"` : 'Para Você'}
                  </Text>
                </View>
                <View style={styles.globalHeaderRightGroup}>
                  <TouchableOpacity
                    style={styles.globalHeaderRandomBtn}
                    onPress={handlePickRandomMovie}
                    activeOpacity={0.8}
                  >
                    <Icon name="zap" size={12} color={theme.colors.accent} style={{ marginRight: 4 }} />
                    <Text style={styles.globalHeaderRandomBtnText}>Sortear Aleatório</Text>
                  </TouchableOpacity>

                  <View style={styles.globalHeaderBadge}>
                    <Text style={styles.globalHeaderBadgeText}>{recomendados.length} sugestões</Text>
                  </View>
                </View>
              </View>
            )}

            {hasTrending ? (
              /* Fallback trending quando não há histórico */
              <View style={styles.trendingSection}>
                <View style={styles.sectionHeader}>
                  <Icon name="trending-up" size={18} color={theme.colors.accent} style={{ marginRight: 6 }} />
                  <Text style={styles.sectionTitle}>Títulos em Alta para Começar</Text>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={sectionStyles.scrollContent}
                >
                  {(recsBySource['__trending__'] || []).map((movie) => (
                    <RecCard
                      key={movie.id}
                      movie={movie}
                      isWatched={isMovieWatched(movie.id)}
                      onWatch={handleWatchMovie}
                      onOpenDetails={setDetailMovie}
                    />
                  ))}
                </ScrollView>
              </View>
            ) : (
              /* Uma seção por filme assistido */
              sourceOrder.map((sourceId) => {
                const sourceMovie = moviesForPattern.find((m) => String(m.id) === String(sourceId));
                if (!sourceMovie) return null;
                return (
                  <SourceMovieSection
                    key={sourceId}
                    sourceMovie={sourceMovie}
                    recommendations={recsBySource[sourceId] || []}
                    isMovieWatched={isMovieWatched}
                    onWatch={handleWatchMovie}
                    onOpenDetails={setDetailMovie}
                  />
                );
              })
            )}

            {/* Botão de Carregar Mais no rodapé */}
            {!hasTrending && (
              <View style={styles.loadMoreWrapper}>
                {hasMore ? (
                  <TouchableOpacity
                    style={[styles.loadMoreBtn, loadingMore && styles.loadMoreBtnLoading]}
                    onPress={handleLoadMore}
                    disabled={loadingMore || loading}
                    activeOpacity={0.8}
                  >
                    {loadingMore ? (
                      <>
                        <ActivityIndicator size="small" color="#FFF" style={{ marginRight: 8 }} />
                        <Text style={styles.loadMoreBtnText}>Buscando mais...</Text>
                      </>
                    ) : (
                      <>
                        <Icon name="refresh" size={16} color="#FFF" style={{ marginRight: 8 }} />
                        <Text style={styles.loadMoreBtnText}>Buscar Mais Recomendações</Text>
                        {currentPage > 1 && (
                          <View style={styles.pageChip}>
                            <Text style={styles.pageChipText}>p.{currentPage + 1}</Text>
                          </View>
                        )}
                      </>
                    )}
                  </TouchableOpacity>
                ) : (
                  <View style={styles.noMoreWrapper}>
                    <Icon name="checkmark-circle" size={16} color={theme.colors.success} style={{ marginRight: 6 }} />
                    <Text style={styles.noMoreText}>Todas as sugestões foram carregadas</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Modal de detalhes */}
      <MovieDetailsModal
        visible={!!detailMovie}
        movie={detailMovie}
        isWatched={detailMovie ? isMovieWatched(detailMovie.id) : false}
        isMovieWatched={isMovieWatched}
        onClose={() => setDetailMovie(null)}
        onPressWatch={handleWatchMovie}
      />
    </>
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
  randomBarWrapper: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
    paddingBottom: 2,
  },
  randomPickBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(229, 9, 20, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(229, 9, 20, 0.4)',
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
  },
  randomPickLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  randomIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  randomPickTextCol: {
    flex: 1,
  },
  randomPickTitle: {
    color: theme.colors.text,
    fontSize: theme.fontSize.xs,
    fontWeight: '800',
  },
  randomPickSub: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    marginTop: 1,
  },
  randomPickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: theme.borderRadius.sm,
  },
  randomPickBtnText: {
    color: '#FFF',
    fontSize: theme.fontSize.xs,
    fontWeight: '700',
  },
  globalHeaderRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  globalHeaderRandomBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 184, 0, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 184, 0, 0.35)',
    borderRadius: theme.borderRadius.round,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  globalHeaderRandomBtnText: {
    color: theme.colors.accent,
    fontSize: 11,
    fontWeight: '700',
  },
  sectionsWrapper: {
    paddingBottom: theme.spacing.xl,
    paddingTop: theme.spacing.sm,
  },
  globalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
    marginBottom: 4,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderColor: theme.colors.surfaceBorder,
  },
  globalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  globalHeaderTitle: {
    color: theme.colors.text,
    fontSize: theme.fontSize.md,
    fontWeight: '800',
  },
  globalHeaderBadge: {
    backgroundColor: 'rgba(255,184,0,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,184,0,0.3)',
    borderRadius: theme.borderRadius.round,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  globalHeaderBadgeText: {
    color: theme.colors.accent,
    fontSize: 11,
    fontWeight: '700',
  },
  trendingSection: {
    paddingTop: theme.spacing.md,
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
  loadMoreWrapper: {
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
  },
  loadMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 13,
    borderRadius: theme.borderRadius.md,
    width: '100%',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  loadMoreBtnLoading: {
    backgroundColor: theme.colors.primaryDark,
    shadowOpacity: 0.2,
  },
  loadMoreBtnText: {
    color: '#FFF',
    fontSize: theme.fontSize.sm,
    fontWeight: '700',
  },
  pageChip: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: theme.borderRadius.round,
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginLeft: 8,
  },
  pageChipText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
  },
  noMoreWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.successBg,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.3)',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
    borderRadius: theme.borderRadius.md,
  },
  noMoreText: {
    color: theme.colors.success,
    fontSize: theme.fontSize.xs,
    fontWeight: '600',
  },
});
