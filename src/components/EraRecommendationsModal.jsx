import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
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
import { registerModalHistory } from '../utils/pwaHistory';

export const EraRecommendationsModal = ({
  visible,
  decadeKey,
  watchedMovies = [],
  watchlist = [],
  onClose,
  onAddWatched,
  onAddToWatchlist,
  onRemoveFromWatchlist,
}) => {
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [eraWatchedMovies, setEraWatchedMovies] = useState([]);
  const [selectedMovieForDetails, setSelectedMovieForDetails] = useState(null);
  const [loadingMovieId, setLoadingMovieId] = useState(null);

  const onCloseRef = React.useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Registra navegação para fechar com o botão Voltar do navegador/PWA (apenas quando visible altera)
  useEffect(() => {
    if (visible) {
      const unregister = registerModalHistory(() => {
        if (onCloseRef.current) onCloseRef.current();
      });
      return () => unregister();
    }
  }, [visible]);

  const watchedIdsSet = new Set(watchedMovies.map((m) => String(m.id)));
  const watchlistIdsSet = new Set(watchlist.map((m) => String(m.id)));

  const isMovieWatched = (id) => watchedIdsSet.has(String(id));
  const isMovieOnWatchlist = (id) => watchlistIdsSet.has(String(id));

  // Busca recomendações quando o modal fica visível para uma década específica
  const fetchEraRecommendations = async () => {
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
      const topGenreIds = topGenresDetails.map((g) => g.id);

      const seedMovies = watchedInEra.slice(0, 3);

      // 3. Busca em PARALELO todas as fontes para tempo de resposta super rápido (< 500ms)
      const [discoverRes, discoverFallback, ...recResults] = await Promise.all([
        discoverMoviesByEra(decadeKey, topGenreIds, 1),
        discoverMoviesByEra(decadeKey, [], 1),
        ...seedMovies.map((m) => getMovieRecommendations(m.id, 1)),
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
      const finalRecs = Array.from(candidateMap.values())
        .filter((m) => isMovieInDecade(m.release_date, decadeKey))
        .filter((m) => !watchedIdsSet.has(String(m.id)))
        .sort((a, b) => (Number(b.vote_average) || 0) - (Number(a.vote_average) || 0));

      setRecommendations(finalRecs);
    } catch (err) {
      console.error('Erro ao buscar recomendações por era:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible && decadeKey) {
      fetchEraRecommendations();
    } else if (!visible) {
      setRecommendations([]);
      setEraWatchedMovies([]);
      setLoading(false);
    }
  }, [visible, decadeKey]);

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
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* CABEÇALHO DO MODAL */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.iconBox}>
                <Icon name="calendar" size={20} color="#60A5FA" />
              </View>
              <View>
                <Text style={styles.headerTitle}>Recomendações: Anos {decadeKey}</Text>
                <Text style={styles.headerSubtitle}>Filmes clássicos e destaques da era {decadeKey}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <Icon name="close" size={22} color={theme.colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* BANNER DE CONTEXTO */}
          <View style={styles.contextBanner}>
            <Icon name="sparkles" size={16} color={theme.colors.accent} />
            <Text style={styles.contextText}>
              {eraWatchedMovies.length > 0 ? (
                <>
                  Com base nos seus <Text style={styles.bold}>{eraWatchedMovies.length} filme(s)</Text> assistidos nesta época (como{' '}
                  <Text style={styles.bold}>{eraWatchedMovies.slice(0, 2).map((m) => m.title).join(', ')}</Text>)
                </>
              ) : (
                <>Descubra os melhores e mais populares filmes lançados nos <Text style={styles.bold}>Anos {decadeKey}</Text>!</>
              )}
            </Text>
          </View>

          {/* CORPO DO MODAL */}
          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={styles.loadingText}>Buscando relíquias dos Anos {decadeKey}...</Text>
            </View>
          ) : recommendations.length === 0 ? (
            <View style={styles.emptyBox}>
              <Icon name="film-outline" size={40} color={theme.colors.textMuted} />
              <Text style={styles.emptyText}>Nenhuma recomendação encontrada para esta era.</Text>
            </View>
          ) : (
            <ScrollView
              style={styles.scrollContent}
              contentContainerStyle={styles.scrollContainer}
              showsVerticalScrollIndicator={false}
            >
              {recommendations.map((movie) => {
                const posterUri = getMoviePosterUrl(movie.poster_path);
                const year = movie.release_date ? movie.release_date.substring(0, 4) : '';
                const rating = movie.vote_average ? Number(movie.vote_average).toFixed(1) : null;
                const genreNames = getGenreNames(movie.genre_ids || []).slice(0, 2);
                const watched = isMovieWatched(movie.id);
                const onWatchlist = isMovieOnWatchlist(movie.id);
                const isItemLoading = loadingMovieId === movie.id;

                return (
                  <TouchableOpacity
                    key={movie.id}
                    style={styles.movieItem}
                    activeOpacity={0.85}
                    onPress={() => setSelectedMovieForDetails(movie)}
                  >
                    {posterUri ? (
                      <Image source={{ uri: posterUri }} style={styles.poster} resizeMode="cover" />
                    ) : (
                      <View style={[styles.poster, styles.posterFallback]}>
                        <Icon name="film-outline" size={24} color={theme.colors.textMuted} />
                      </View>
                    )}

                    <View style={styles.movieInfo}>
                      <View style={styles.titleRow}>
                        <Text style={styles.movieTitle} numberOfLines={1}>
                          {movie.title}
                        </Text>
                        {year ? <Text style={styles.yearBadge}>{year}</Text> : null}
                      </View>

                      <View style={styles.ratingGenreRow}>
                        {rating && rating !== '0.0' ? (
                          <View style={styles.ratingBadge}>
                            <Icon name="star" size={10} color={theme.colors.accent} />
                            <Text style={styles.ratingText}>{rating}</Text>
                          </View>
                        ) : null}

                        {genreNames.map((gName, idx) => (
                          <GenreBadge key={idx} genreName={gName} />
                        ))}
                      </View>

                      {movie.overview ? (
                        <Text style={styles.overview} numberOfLines={2}>
                          {movie.overview}
                        </Text>
                      ) : null}

                      {/* BOTAO DE AÇÕES */}
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
                            size={14}
                            color={watched ? theme.colors.success : '#FFF'}
                          />
                          <Text
                            style={[
                              styles.actionBtnText,
                              watched && styles.watchedBtnText,
                            ]}
                          >
                            {watched ? 'Assistido' : '+ Assistido'}
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
                              size={14}
                              color={onWatchlist ? theme.colors.accent : theme.colors.textSecondary}
                            />
                            <Text
                              style={[
                                styles.actionBtnText,
                                onWatchlist && styles.watchlistBtnTextActive,
                              ]}
                            >
                              {onWatchlist ? 'Na Fila' : '+ Quero Ver'}
                            </Text>
                          </TouchableOpacity>
                        ) : null}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>
      </View>

      {/* MODAL DE DETALHES COMPLEMENTAR */}
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
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 500,
    height: '88%',
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
    padding: theme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceBorder,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(96, 165, 250, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: '800',
    color: theme.colors.text,
  },
  headerSubtitle: {
    fontSize: 10,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },

  contextBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.colors.surface,
    padding: 10,
    borderRadius: theme.borderRadius.md,
    marginTop: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
  },
  contextText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    flex: 1,
    lineHeight: 16,
  },
  bold: {
    fontWeight: '700',
    color: theme.colors.text,
  },

  loadingBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },

  emptyBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  emptyText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },

  scrollContent: {
    flex: 1,
  },
  scrollContainer: {
    gap: 12,
    paddingBottom: 30,
  },

  movieItem: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: 10,
    gap: 12,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
  },
  poster: {
    width: 75,
    height: 110,
    borderRadius: theme.borderRadius.sm,
  },
  posterFallback: {
    backgroundColor: theme.colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  movieInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 6,
  },
  movieTitle: {
    fontSize: theme.fontSize.sm,
    fontWeight: '800',
    color: theme.colors.text,
    flex: 1,
  },
  yearBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#60A5FA',
    backgroundColor: 'rgba(96, 165, 250, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  ratingGenreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginVertical: 4,
    flexWrap: 'wrap',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(255, 184, 0, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  ratingText: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.colors.accent,
  },
  overview: {
    fontSize: 11,
    color: theme.colors.textMuted,
    lineHeight: 15,
    marginBottom: 6,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.sm,
  },
  addWatchBtn: {
    backgroundColor: theme.colors.primary,
  },
  watchedBtn: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFF',
  },
  watchedBtnText: {
    color: theme.colors.success,
  },
  watchlistBtn: {
    backgroundColor: theme.colors.surfaceLight,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
  },
  watchlistBtnActive: {
    backgroundColor: 'rgba(255, 184, 0, 0.15)',
    borderWidth: 1,
    borderColor: theme.colors.accent,
  },
  watchlistBtnTextActive: {
    color: theme.colors.accent,
  },
});
