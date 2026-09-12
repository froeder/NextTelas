import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Icon } from './Icon';
import { theme } from '../utils/theme';
import { GenreBadge } from './GenreBadge';
import { MovieDetailsModal } from './MovieDetailsModal';
import {
  getMoviePosterUrl,
  getMovieRecommendations,
  discoverMoviesByEra,
  isMovieInDecade,
} from '../services/tmdbService';
import { getGenreNames } from '../utils/tmdbGenres';
import { extractTopGenres } from '../utils/genreExtractor';

export const EraRecommendationsSection = ({
  decadeKey,
  watchedMovies = [],
  watchlist = [],
  onClose,
  onAddWatched,
  onAddToWatchlist,
  onRemoveFromWatchlist,
}) => {
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState([]);
  const [eraWatchedMovies, setEraWatchedMovies] = useState([]);
  const [selectedMovieForDetails, setSelectedMovieForDetails] = useState(null);
  const [loadingMovieId, setLoadingMovieId] = useState(null);

  const watchedIdsSet = new Set(watchedMovies.map((m) => String(m.id)));
  const watchlistIdsSet = new Set(watchlist.map((m) => String(m.id)));

  const isMovieWatched = (id) => watchedIdsSet.has(String(id));
  const isMovieOnWatchlist = (id) => watchlistIdsSet.has(String(id));

  // Busca recomendações quando uma década é selecionada
  const fetchEraRecommendations = useCallback(async () => {
    if (!decadeKey) return;
    setLoading(true);

    try {
      // 1. Filtra os filmes assistidos do usuário que pertencem a esta era
      const watchedInEra = watchedMovies.filter((m) =>
        isMovieInDecade(m.release_date, decadeKey)
      );
      setEraWatchedMovies(watchedInEra);

      // 2. Extrai os gêneros principais dos filmes assistidos nesta era
      const { topGenresDetails } = extractTopGenres(watchedInEra, 3);
      const topGenreIds = (topGenresDetails || []).map((g) => g.id);

      const seedMovies = watchedInEra.slice(0, 3);

      // 3. Busca em PARALELO todas as fontes para tempo de resposta super rápido
      const [discoverRes, discoverFallback, ...recResults] = await Promise.all([
        discoverMoviesByEra(decadeKey, topGenreIds, 1).catch(() => ({ results: [] })),
        discoverMoviesByEra(decadeKey, [], 1).catch(() => ({ results: [] })),
        ...seedMovies.map((m) => getMovieRecommendations(m.id, 1).catch(() => ({ results: [] }))),
      ]);

      const candidateMap = new Map();

      // Processa descobertas baseadas nos gêneros da era
      if (discoverRes?.results) {
        discoverRes.results.forEach((m) => {
          if (m?.id && !watchedIdsSet.has(String(m.id))) {
            candidateMap.set(String(m.id), m);
          }
        });
      }

      // Processa descobertas gerais da era
      if (discoverFallback?.results) {
        discoverFallback.results.forEach((m) => {
          if (m?.id && !watchedIdsSet.has(String(m.id))) {
            candidateMap.set(String(m.id), m);
          }
        });
      }

      // Processa recomendações baseadas nos filmes assistidos na era
      recResults.forEach((res) => {
        if (res?.results) {
          res.results.forEach((m) => {
            if (m?.id && !watchedIdsSet.has(String(m.id))) {
              candidateMap.set(String(m.id), m);
            }
          });
        }
      });

      // 4. REGRA RÍGIDA: Filtra estritamente filmes que pertencem ÀQUELA ERA e não assistidos
      let finalRecs = Array.from(candidateMap.values())
        .filter((m) => isMovieInDecade(m.release_date, decadeKey))
        .filter((m) => !watchedIdsSet.has(String(m.id)))
        .sort((a, b) => (Number(b.vote_average) || 0) - (Number(a.vote_average) || 0));

      if (finalRecs.length === 0 && candidateMap.size > 0) {
        finalRecs = Array.from(candidateMap.values()).filter((m) => !watchedIdsSet.has(String(m.id)));
      }

      setRecommendations(finalRecs);
    } catch (err) {
      console.error('Erro ao buscar recomendações por era:', err);
    } finally {
      setLoading(false);
    }
  }, [decadeKey, watchedMovies]);

  useEffect(() => {
    fetchEraRecommendations();
  }, [decadeKey, fetchEraRecommendations]);

  const handleToggleWatch = async (movie, e) => {
    e?.stopPropagation?.();
    if (loadingMovieId) return;
    setLoadingMovieId(movie.id);
    try {
      if (onAddWatched) {
        await onAddWatched(movie);
      }
    } finally {
      setLoadingMovieId(null);
    }
  };

  const handleToggleWatchlist = async (movie, e) => {
    e?.stopPropagation?.();
    if (loadingMovieId) return;
    setLoadingMovieId(movie.id);
    try {
      if (isMovieOnWatchlist(movie.id)) {
        if (onRemoveFromWatchlist) await onRemoveFromWatchlist(movie.id);
      } else {
        if (onAddToWatchlist) await onAddToWatchlist(movie);
      }
    } finally {
      setLoadingMovieId(null);
    }
  };

  return (
    <View style={styles.cardContainer}>
      {/* CABEÇALHO DO CARD EXPANSÍVEL */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconBox}>
            <Icon name="sparkles" size={18} color={theme.colors.accent} />
          </View>
          <View style={styles.headerTextCol}>
            <Text style={styles.title}>Recomendações da Era: Anos {decadeKey}</Text>
            <Text style={styles.subtitle}>Filmes e clássicos dos Anos {decadeKey} selecionados para você</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
          <Icon name="close" size={20} color={theme.colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* BANNER INFORMATIVO / CONTEXTO */}
      <View style={styles.contextBanner}>
        <Icon name="sparkles" size={14} color={theme.colors.accent} />
        <Text style={styles.contextText}>
          {eraWatchedMovies.length > 0 ? (
            <>
              Com base nos seus <Text style={styles.bold}>{eraWatchedMovies.length} filme(s)</Text> assistidos nesta época (como{' '}
              <Text style={styles.bold}>{eraWatchedMovies.slice(0, 2).map((m) => m.title).join(', ')}</Text>)
            </>
          ) : (
            <>Descubra os melhores e mais aclamados filmes lançados nos <Text style={styles.bold}>Anos {decadeKey}</Text>!</>
          )}
        </Text>
      </View>

      {/* CONTEÚDO PRINCIPAL (LOADING, VAZIO OU LISTA) */}
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Buscando recomendações dos Anos {decadeKey}...</Text>
        </View>
      ) : recommendations.length === 0 ? (
        <View style={styles.emptyBox}>
          <Icon name="film-outline" size={32} color={theme.colors.textMuted} />
          <Text style={styles.emptyText}>Nenhuma recomendação encontrada para esta era.</Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalList}
        >
          {recommendations.map((movie) => {
            const posterUri = getMoviePosterUrl(movie.poster_path);
            const year = movie.release_date ? movie.release_date.substring(0, 4) : '';
            const rating = movie.vote_average ? Number(movie.vote_average).toFixed(1) : null;
            const genreName = getGenreNames(movie.genre_ids || [])[0] || '';
            const watched = isMovieWatched(movie.id);
            const onWatchlist = isMovieOnWatchlist(movie.id);
            const isItemLoading = loadingMovieId === movie.id;

            return (
              <TouchableOpacity
                key={movie.id}
                style={styles.itemCard}
                activeOpacity={0.88}
                onPress={() => setSelectedMovieForDetails(movie)}
              >
                <View style={styles.posterContainer}>
                  {posterUri ? (
                    <Image source={{ uri: posterUri }} style={styles.poster} resizeMode="cover" />
                  ) : (
                    <View style={[styles.poster, styles.posterFallback]}>
                      <Icon name="film-outline" size={24} color={theme.colors.textMuted} />
                    </View>
                  )}

                  {rating && rating !== '0.0' ? (
                    <View style={styles.ratingBadge}>
                      <Icon name="star" size={9} color={theme.colors.accent} />
                      <Text style={styles.ratingText}>{rating}</Text>
                    </View>
                  ) : null}

                  {year ? (
                    <View style={styles.yearBadge}>
                      <Text style={styles.yearBadgeText}>{year}</Text>
                    </View>
                  ) : null}
                </View>

                <Text style={styles.movieTitle} numberOfLines={1}>
                  {movie.title}
                </Text>

                {genreName ? (
                  <Text style={styles.genreText} numberOfLines={1}>
                    {genreName}
                  </Text>
                ) : null}

                {/* BOTOES DE AÇÃO COMPACTOS */}
                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    style={[
                      styles.actionBtn,
                      watched ? styles.watchedBtn : styles.addWatchBtn,
                    ]}
                    disabled={watched || isItemLoading}
                    onPress={(e) => handleToggleWatch(movie, e)}
                    activeOpacity={0.8}
                  >
                    <Icon
                      name={watched ? 'checkmark-circle' : 'eye'}
                      size={12}
                      color={watched ? theme.colors.success : '#FFF'}
                    />
                    <Text style={[styles.actionBtnText, watched && styles.watchedBtnText]}>
                      {watched ? 'Visto' : '+ Ver'}
                    </Text>
                  </TouchableOpacity>

                  {!watched ? (
                    <TouchableOpacity
                      style={[
                        styles.actionBtn,
                        onWatchlist ? styles.watchlistBtnActive : styles.watchlistBtn,
                      ]}
                      disabled={isItemLoading}
                      onPress={(e) => handleToggleWatchlist(movie, e)}
                      activeOpacity={0.8}
                    >
                      <Icon
                        name={onWatchlist ? 'bookmark' : 'bookmark-outline'}
                        size={12}
                        color={onWatchlist ? theme.colors.accent : theme.colors.textSecondary}
                      />
                    </TouchableOpacity>
                  ) : null}
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* MODAL DE DETALHES COMPLEMENTAR AO CLICAR EM UM FILME */}
      {selectedMovieForDetails && (
        <MovieDetailsModal
          visible={!!selectedMovieForDetails}
          movie={selectedMovieForDetails}
          isWatched={isMovieWatched(selectedMovieForDetails.id)}
          isOnWatchlist={isMovieOnWatchlist(selectedMovieForDetails.id)}
          onClose={() => setSelectedMovieForDetails(null)}
          onPressWatch={onAddWatched}
          onAddToWatchlist={onAddToWatchlist}
          onRemoveFromWatchlist={onRemoveFromWatchlist}
          isMovieWatched={isMovieWatched}
          isMovieOnWatchlist={isMovieOnWatchlist}
          onSelectMovie={(m) => setSelectedMovieForDetails(m)}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.4)',
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    marginTop: 4,
    shadowColor: '#60A5FA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(96, 165, 250, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextCol: {
    flex: 1,
  },
  title: {
    fontSize: theme.fontSize.sm,
    fontWeight: '800',
    color: theme.colors.text,
  },
  subtitle: {
    fontSize: 10,
    color: theme.colors.textMuted,
    marginTop: 1,
  },
  closeBtn: {
    padding: 6,
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: theme.borderRadius.round,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
  },

  contextBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.surfaceLight,
    padding: 8,
    borderRadius: theme.borderRadius.sm,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
  },
  contextText: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    flex: 1,
    lineHeight: 15,
  },
  bold: {
    fontWeight: '700',
    color: theme.colors.text,
  },

  loadingBox: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
  },

  emptyBox: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
  },

  horizontalList: {
    gap: 10,
    paddingRight: 10,
  },
  itemCard: {
    width: 105,
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: theme.borderRadius.md,
    padding: 6,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
  },
  posterContainer: {
    width: '100%',
    height: 140,
    borderRadius: theme.borderRadius.sm,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 6,
  },
  poster: {
    width: '100%',
    height: '100%',
  },
  posterFallback: {
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ratingBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(11, 12, 18, 0.85)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  ratingText: {
    fontSize: 9,
    fontWeight: '800',
    color: theme.colors.accent,
  },
  yearBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: 'rgba(11, 12, 18, 0.85)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 3,
  },
  yearBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#60A5FA',
  },
  movieTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: 2,
  },
  genreText: {
    fontSize: 9,
    color: theme.colors.textMuted,
    marginBottom: 6,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 4,
    flex: 1,
  },
  addWatchBtn: {
    backgroundColor: theme.colors.primary,
  },
  watchedBtn: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  actionBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFF',
  },
  watchedBtnText: {
    color: theme.colors.success,
  },
  watchlistBtn: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
    paddingHorizontal: 6,
  },
  watchlistBtnActive: {
    backgroundColor: 'rgba(255, 184, 0, 0.15)',
    borderWidth: 1,
    borderColor: theme.colors.accent,
    paddingHorizontal: 6,
  },
});
