import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { Icon } from './Icon';
import { theme } from '../utils/theme';
import { GenreBadge } from './GenreBadge';
import {
  getMovieDetails,
  formatRuntime,
  getMoviePosterUrl,
  getMovieBackdropUrl,
  getMovieRecommendations,
} from '../services/tmdbService';
import { getGenreNames } from '../utils/tmdbGenres';

export const MovieDetailsModal = ({
  visible,
  movie,
  isWatched = false,
  isOnWatchlist = false,
  onClose,
  onPressWatch,
  onPressRemove,
  onAddToWatchlist,
  onRemoveFromWatchlist,
  showRemoveButton = false,
}) => {
  const [details, setDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const [similarMovies, setSimilarMovies] = useState([]);

  useEffect(() => {
    let isMounted = true;
    if (visible && movie?.id) {
      const loadDetails = async () => {
        setLoadingDetails(true);
        setSimilarMovies([]);
        // Busca detalhes e semelhantes em paralelo
        const [detailResult, similarResult] = await Promise.allSettled([
          getMovieDetails(movie.id),
          getMovieRecommendations(movie.id, 1),
        ]);
        if (isMounted) {
          if (detailResult.status === 'fulfilled') setDetails(detailResult.value.data);
          if (similarResult.status === 'fulfilled') {
            setSimilarMovies((similarResult.value.results || []).slice(0, 10));
          }
          setLoadingDetails(false);
        }
      };
      loadDetails();
    } else {
      setDetails(null);
      setSimilarMovies([]);
    }

    return () => {
      isMounted = false;
    };
  }, [visible, movie?.id]);

  if (!movie) return null;

  const posterUri = getMoviePosterUrl(movie.poster_path);
  const backdropUri = getMovieBackdropUrl(details?.backdrop_path || movie.backdrop_path);
  
  const runtimeDisplay = formatRuntime(details?.runtime || movie.runtime);
  const releaseYear = (movie.release_date || details?.release_date || '').split('-')[0];
  const rating = (details?.vote_average || movie.vote_average)
    ? Number(details?.vote_average || movie.vote_average).toFixed(1)
    : null;
  const voteCount = details?.vote_count || movie.vote_count;

  // Gêneros
  const genreNames = details?.genres
    ? details.genres.map((g) => g.name)
    : getGenreNames(movie.genre_ids);

  // Diretor
  const director = details?.credits?.crew?.find((c) => c.job === 'Director')?.name;

  // Elenco principal (top 5)
  const cast = details?.credits?.cast?.slice(0, 5) || [];

  // Trailer no YouTube
  const trailer = details?.videos?.results?.find(
    (v) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser')
  );

  const handleOpenTrailer = () => {
    if (trailer?.key) {
      const youtubeUrl = `https://www.youtube.com/watch?v=${trailer.key}`;
      Linking.openURL(youtubeUrl);
    }
  };

  const handleWatchToggle = async () => {
    if (loadingAction || isWatched || !onPressWatch) return;
    try {
      setLoadingAction(true);
      await onPressWatch(movie);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleRemove = async () => {
    if (loadingAction || !onPressRemove) return;
    try {
      setLoadingAction(true);
      await onPressRemove(movie);
      onClose();
    } finally {
      setLoadingAction(false);
    }
  };

  const handleWatchlistToggle = async () => {
    if (loadingAction) return;
    try {
      setLoadingAction(true);
      if (isOnWatchlist) {
        if (onRemoveFromWatchlist) await onRemoveFromWatchlist(movie.id);
      } else {
        if (onAddToWatchlist) await onAddToWatchlist(movie);
      }
    } finally {
      setLoadingAction(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          {/* Imagem de Fundo / Backdrop */}
          <View style={styles.backdropContainer}>
            {backdropUri ? (
              <Image source={{ uri: backdropUri }} style={styles.backdropImage} resizeMode="cover" />
            ) : (
              <View style={styles.backdropFallback} />
            )}
            <View style={styles.backdropGradient} />

            {/* Botão Fechar */}
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              activeOpacity={0.8}
            >
              <Icon name="close" size={18} color="#FFF" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollContent}
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* Cabeçalho do Filme com Poster e Título */}
            <View style={styles.movieHeaderRow}>
              <View style={styles.posterWrapper}>
                {posterUri ? (
                  <Image source={{ uri: posterUri }} style={styles.poster} resizeMode="cover" />
                ) : (
                  <View style={styles.posterPlaceholder}>
                    <Icon name="film-outline" size={32} color={theme.colors.textMuted} />
                  </View>
                )}
              </View>

              <View style={styles.movieHeaderDetails}>
                <Text style={styles.movieTitle}>{movie.title}</Text>

                {details?.tagline ? (
                  <Text style={styles.tagline}>"{details.tagline}"</Text>
                ) : null}

                {/* Chips de Informações Rápidas (Ano, Duração, Nota) */}
                <View style={styles.metaRow}>
                  {releaseYear ? (
                    <View style={styles.metaBadge}>
                      <Icon name="calendar" size={12} color={theme.colors.textSecondary} style={{ marginRight: 4 }} />
                      <Text style={styles.metaBadgeText}>{releaseYear}</Text>
                    </View>
                  ) : null}

                  {runtimeDisplay ? (
                    <View style={[styles.metaBadge, styles.runtimeBadge]}>
                      <Icon name="clock" size={12} color={theme.colors.accent} style={{ marginRight: 4 }} />
                      <Text style={[styles.metaBadgeText, { color: theme.colors.accent, fontWeight: '700' }]}>
                        {runtimeDisplay}
                      </Text>
                    </View>
                  ) : loadingDetails ? (
                    <View style={styles.metaBadge}>
                      <ActivityIndicator size="small" color={theme.colors.accent} style={{ transform: [{ scale: 0.7 }] }} />
                    </View>
                  ) : null}

                  {rating && rating !== '0.0' ? (
                    <View style={styles.metaBadge}>
                      <Icon name="star" size={12} color={theme.colors.accent} style={{ marginRight: 4 }} />
                      <Text style={styles.metaBadgeText}>{rating}</Text>
                    </View>
                  ) : null}
                </View>

                {voteCount ? (
                  <Text style={styles.votesText}>{voteCount.toLocaleString('pt-BR')} avaliações na TMDb</Text>
                ) : null}
              </View>
            </View>

            {/* Badges de Gêneros */}
            {genreNames.length > 0 && (
              <View style={styles.genresRow}>
                {genreNames.map((name, i) => (
                  <GenreBadge key={i} name={name} size="sm" />
                ))}
              </View>
            )}

            {/* Botão de Trailer no YouTube (se houver) */}
            {trailer?.key && (
              <TouchableOpacity
                style={styles.trailerButton}
                onPress={handleOpenTrailer}
                activeOpacity={0.8}
              >
                <Icon name="play" size={16} color="#FFF" style={{ marginRight: 8 }} />
                <Text style={styles.trailerButtonText}>Assistir Trailer no YouTube</Text>
                <Icon name="external-link" size={14} color="#FFF" style={{ marginLeft: 'auto' }} />
              </TouchableOpacity>
            )}

            {/* Sinopse Completa */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Sinopse</Text>
              <Text style={styles.overviewText}>
                {details?.overview || movie.overview || 'Sinopse não informada em português.'}
              </Text>
            </View>

            {/* Direção e Equipe */}
            {director ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Direção</Text>
                <Text style={styles.directorName}>{director}</Text>
              </View>
            ) : null}

            {/* Elenco Principal */}
            {cast.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Elenco Principal</Text>
                <View style={styles.castRow}>
                  {cast.map((actor) => (
                    <View key={actor.id} style={styles.castCard}>
                      <Text style={styles.castName} numberOfLines={1}>{actor.name}</Text>
                      {actor.character ? (
                        <Text style={styles.castCharacter} numberOfLines={1}>{actor.character}</Text>
                      ) : null}
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* ── Seção Semelhantes ── */}
            {similarMovies.length > 0 && (
              <View style={styles.similarSection}>
                <View style={styles.similarHeader}>
                  <Icon name="film" size={15} color={theme.colors.primary} style={{ marginRight: 6 }} />
                  <Text style={styles.similarTitle}>Semelhantes</Text>
                  <Text style={styles.similarCount}>{similarMovies.length} títulos</Text>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.similarScroll}
                  nestedScrollEnabled
                >
                  {similarMovies.map((sim) => {
                    const simPoster = getMoviePosterUrl(sim.poster_path);
                    const simRating = sim.vote_average
                      ? Number(sim.vote_average).toFixed(1)
                      : null;
                    const simYear = (sim.release_date || '').split('-')[0];
                    return (
                      <View key={sim.id} style={styles.simCard}>
                        <View style={styles.simPosterBox}>
                          {simPoster ? (
                            <Image
                              source={{ uri: simPoster }}
                              style={styles.simPoster}
                              resizeMode="cover"
                            />
                          ) : (
                            <View style={styles.simPosterFallback}>
                              <Icon name="film-outline" size={22} color={theme.colors.textMuted} />
                            </View>
                          )}

                          {simRating && simRating !== '0.0' ? (
                            <View style={styles.simRatingBadge}>
                              <Icon name="star" size={8} color={theme.colors.accent} />
                              <Text style={styles.simRatingText}>{simRating}</Text>
                            </View>
                          ) : null}

                          {/* Botão rápido Já Assisti */}
                          {onPressWatch && (
                            <TouchableOpacity
                              style={styles.simWatchBtn}
                              onPress={() => onPressWatch(sim)}
                              activeOpacity={0.8}
                            >
                              <Icon name="add" size={13} color="#FFF" />
                            </TouchableOpacity>
                          )}
                        </View>

                        <Text style={styles.simTitle} numberOfLines={2}>
                          {sim.title}
                        </Text>
                        {simYear ? (
                          <Text style={styles.simYear}>{simYear}</Text>
                        ) : null}
                      </View>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* Loading semelhantes */}
            {loadingDetails && similarMovies.length === 0 && (
              <View style={styles.similarLoadingRow}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
                <Text style={styles.similarLoadingText}>Buscando semelhantes...</Text>
              </View>
            )}
          </ScrollView>

          {/* Barra de Ação Fixa no Rodapé do Modal */}
          <View style={styles.footerAction}>
            {showRemoveButton ? (
              <TouchableOpacity
                style={styles.removeActionBtn}
                onPress={handleRemove}
                disabled={loadingAction}
                activeOpacity={0.8}
              >
                {loadingAction ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <>
                    <Icon name="trash-outline" size={18} color="#FFF" style={{ marginRight: 8 }} />
                    <Text style={styles.removeActionBtnText}>Remover do Histórico</Text>
                  </>
                )}
              </TouchableOpacity>
            ) : (
              <View style={styles.footerBtnRow}>
                {/* Botão principal: Já Assisti / Assistido */}
                <TouchableOpacity
                  style={[
                    styles.watchActionBtn,
                    isWatched && styles.watchActionBtnActive,
                  ]}
                  onPress={handleWatchToggle}
                  disabled={isWatched || loadingAction}
                  activeOpacity={0.8}
                >
                  {loadingAction ? (
                    <View style={styles.actionContentRow}>
                      <ActivityIndicator size="small" color="#FFF" style={{ marginRight: 8 }} />
                      <Text style={styles.watchActionBtnText}>Adicionando...</Text>
                    </View>
                  ) : isWatched ? (
                    <View style={styles.actionContentRow}>
                      <Icon name="checkmark-circle" size={18} color={theme.colors.success} style={{ marginRight: 8 }} />
                      <Text style={[styles.watchActionBtnText, { color: theme.colors.success }]}>
                        Filme Já Assistido
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.actionContentRow}>
                      <Icon name="add-circle-outline" size={18} color="#FFF" style={{ marginRight: 8 }} />
                      <Text style={styles.watchActionBtnText}>Já Assisti</Text>
                    </View>
                  )}
                </TouchableOpacity>

                {/* Botão Quero Assistir (somente quando não assistiu ainda) */}
                {!isWatched && (onAddToWatchlist || onRemoveFromWatchlist) && (
                  <TouchableOpacity
                    style={[
                      styles.watchlistActionBtn,
                      isOnWatchlist && styles.watchlistActionBtnActive,
                    ]}
                    onPress={handleWatchlistToggle}
                    disabled={loadingAction}
                    activeOpacity={0.8}
                  >
                    <Icon
                      name={isOnWatchlist ? 'bookmark' : 'bookmark-outline'}
                      size={18}
                      color={isOnWatchlist ? theme.colors.accent : theme.colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.watchlistActionBtnText,
                        isOnWatchlist && styles.watchlistActionBtnTextActive,
                      ]}
                    >
                      {isOnWatchlist ? 'Na Lista' : 'Quero Assistir'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 6, 10, 0.88)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  sheetContainer: {
    width: '100%',
    maxWidth: 500,
    height: '90%',
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    overflow: 'hidden',
    borderTopWidth: 1,
    borderColor: theme.colors.surfaceBorder,
    display: 'flex',
    flexDirection: 'column',
  },
  backdropContainer: {
    width: '100%',
    height: 160,
    position: 'relative',
    backgroundColor: '#000',
  },
  backdropImage: {
    width: '100%',
    height: '100%',
  },
  backdropFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: theme.colors.surfaceLight,
  },
  backdropGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 90,
    backgroundColor: 'rgba(21, 23, 34, 0.95)',
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(11, 12, 18, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  scrollContent: {
    flex: 1,
  },
  scrollContainer: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
  },
  movieHeaderRow: {
    flexDirection: 'row',
    marginTop: -40,
    marginBottom: theme.spacing.md,
  },
  posterWrapper: {
    width: 100,
    height: 150,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    backgroundColor: theme.colors.surfaceLight,
    borderWidth: 2,
    borderColor: theme.colors.surfaceBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  poster: {
    width: '100%',
    height: '100%',
  },
  posterPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  movieHeaderDetails: {
    flex: 1,
    marginLeft: theme.spacing.md,
    justifyContent: 'flex-end',
  },
  movieTitle: {
    color: theme.colors.text,
    fontSize: theme.fontSize.lg,
    fontWeight: '800',
    lineHeight: 22,
    marginBottom: 4,
  },
  tagline: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.xs,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 6,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.borderRadius.xs,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
  },
  runtimeBadge: {
    borderColor: 'rgba(255, 184, 0, 0.35)',
    backgroundColor: 'rgba(255, 184, 0, 0.08)',
  },
  metaBadgeText: {
    color: theme.colors.text,
    fontSize: theme.fontSize.xs,
    fontWeight: '600',
  },
  votesText: {
    color: theme.colors.textMuted,
    fontSize: 10,
  },
  genresRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: theme.spacing.md,
  },
  trailerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(229, 9, 20, 0.85)',
    paddingVertical: 10,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.sm,
    marginBottom: theme.spacing.md,
  },
  trailerButtonText: {
    color: '#FFF',
    fontSize: theme.fontSize.sm,
    fontWeight: '700',
  },
  section: {
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: theme.fontSize.sm,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  overviewText: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
    lineHeight: 22,
  },
  directorName: {
    color: theme.colors.text,
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
  },
  castRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  castCard: {
    backgroundColor: theme.colors.surfaceLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
    maxWidth: '48%',
  },
  castName: {
    color: theme.colors.text,
    fontSize: theme.fontSize.xs,
    fontWeight: '700',
  },
  castCharacter: {
    color: theme.colors.textSecondary,
    fontSize: 10,
    marginTop: 2,
  },
  footerAction: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderColor: theme.colors.surfaceBorder,
  },
  footerBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  watchActionBtn: {
    height: 48,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  watchActionBtnActive: {
    backgroundColor: theme.colors.successBg,
    borderWidth: 1,
    borderColor: theme.colors.success,
  },
  watchActionBtnText: {
    color: '#FFF',
    fontSize: theme.fontSize.sm,
    fontWeight: '700',
  },
  removeActionBtn: {
    height: 48,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.error,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeActionBtnText: {
    color: '#FFF',
    fontSize: theme.fontSize.sm,
    fontWeight: '700',
  },
  watchlistActionBtn: {
    height: 48,
    borderRadius: theme.borderRadius.md,
    backgroundColor: 'rgba(255, 184, 0, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 184, 0, 0.25)',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
  },
  watchlistActionBtnActive: {
    backgroundColor: 'rgba(255, 184, 0, 0.18)',
    borderColor: 'rgba(255, 184, 0, 0.55)',
  },
  watchlistActionBtnText: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
    fontWeight: '700',
  },
  watchlistActionBtnTextActive: {
    color: theme.colors.accent,
  },

  // ── Seção Semelhantes ──
  similarSection: {
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.surfaceBorder,
  },
  similarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  similarTitle: {
    color: theme.colors.text,
    fontSize: theme.fontSize.sm,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    flex: 1,
  },
  similarCount: {
    color: theme.colors.textMuted,
    fontSize: 11,
  },
  similarScroll: {
    gap: 10,
    paddingRight: theme.spacing.md,
  },
  simCard: {
    width: 80,
  },
  simPosterBox: {
    width: 80,
    height: 120,
    borderRadius: theme.borderRadius.sm,
    overflow: 'hidden',
    backgroundColor: theme.colors.surfaceLight,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
    position: 'relative',
  },
  simPoster: { width: '100%', height: '100%' },
  simPosterFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  simRatingBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: 'rgba(11,12,18,0.85)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.xs,
    gap: 2,
  },
  simRatingText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '700',
  },
  simWatchBtn: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  simTitle: {
    color: theme.colors.text,
    fontSize: 10,
    fontWeight: '700',
    marginTop: 5,
    lineHeight: 13,
  },
  simYear: {
    color: theme.colors.textMuted,
    fontSize: 9,
    marginTop: 2,
  },
  similarLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: theme.spacing.sm,
    marginTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.surfaceBorder,
  },
  similarLoadingText: {
    color: theme.colors.textMuted,
    fontSize: 11,
  },
});
