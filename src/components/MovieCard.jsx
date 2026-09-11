import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Icon } from './Icon';
import { theme } from '../utils/theme';
import { GenreBadge } from './GenreBadge';
import { getGenreNames } from '../utils/tmdbGenres';
import { getMovieDetails, formatRuntime } from '../services/tmdbService';
import { MovieDetailsModal } from './MovieDetailsModal';

export const MovieCard = ({
  movie,
  isWatched = false,
  isOnWatchlist = false,
  onPressWatch,
  onPressRemove,
  onAddToWatchlist,
  onRemoveFromWatchlist,
  showRemoveButton = false,
  isSelectable = false,
  isSelected = false,
  onToggleSelect,
  onPressMoveToList,
  customListName = null,
}) => {
  const [loadingAction, setLoadingAction] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [runtimeText, setRuntimeText] = useState(formatRuntime(movie?.runtime));

  // Concatenação exigida para a capa do filme
  const posterUri = movie.poster_path
    ? 'https://image.tmdb.org/t/p/w500' + movie.poster_path
    : null;

  const releaseYear = movie.release_date
    ? movie.release_date.split('-')[0]
    : null;

  const rating = movie.vote_average
    ? Number(movie.vote_average).toFixed(1)
    : null;

  const genreNames = getGenreNames(movie.genre_ids).slice(0, 3);

  // Busca e exibe a duração do filme no card caso ainda não esteja disponível
  useEffect(() => {
    let isMounted = true;
    if (!runtimeText && movie?.id) {
      const fetchRuntime = async () => {
        const { data } = await getMovieDetails(movie.id);
        if (isMounted && data?.runtime) {
          setRuntimeText(formatRuntime(data.runtime));
        }
      };
      fetchRuntime();
    }
    return () => {
      isMounted = false;
    };
  }, [movie?.id, runtimeText]);

  const handleCardPress = () => {
    if (isSelectable) {
      if (onToggleSelect) onToggleSelect(movie);
    } else {
      setShowDetailsModal(true);
    }
  };

  const handleWatchToggle = async () => {
    if (loadingAction || isWatched) return;
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
    <>
      <TouchableOpacity
        style={[
          styles.card,
          isSelected && styles.cardSelected,
        ]}
        activeOpacity={0.88}
        onPress={handleCardPress}
      >
        {/* Pôster com proporção cinematográfica */}
        <View style={styles.posterContainer}>
          {posterUri ? (
            <Image
              source={{ uri: posterUri }}
              style={styles.poster}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.posterPlaceholder}>
              <Icon name="film-outline" size={36} color={theme.colors.textMuted} />
              <Text style={styles.placeholderText}>Sem Capa</Text>
            </View>
          )}

          {/* Badge de Nota Sobreposta */}
          {rating && rating !== '0.0' ? (
            <View style={styles.ratingBadge}>
              <Icon name="star" size={11} color={theme.colors.accent} />
              <Text style={styles.ratingText}>{rating}</Text>
            </View>
          ) : null}

          {/* Checkbox quando em modo de seleção */}
          {isSelectable && (
            <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
              {isSelected && <Icon name="checkmark" size={14} color="#FFF" />}
            </View>
          )}
        </View>

        {/* Conteúdo e Informações do Filme */}
        <View style={styles.detailsContainer}>
          <View style={styles.headerInfo}>
            <Text style={styles.title} numberOfLines={2}>
              {movie.title}
            </Text>

            {/* Linha com Ano, Duração e Lista */}
            <View style={styles.metaRow}>
              {releaseYear ? (
                <Text style={styles.year}>{releaseYear}</Text>
              ) : null}

              {releaseYear && runtimeText ? (
                <Text style={styles.metaDot}>•</Text>
              ) : null}

              {runtimeText ? (
                <View style={styles.runtimeContainer}>
                  <Icon name="clock" size={11} color={theme.colors.accent} style={{ marginRight: 3 }} />
                  <Text style={styles.runtimeText}>{runtimeText}</Text>
                </View>
              ) : null}

              {customListName ? (
                <View style={styles.listBadge}>
                  <Text style={styles.listBadgeText}>{customListName}</Text>
                </View>
              ) : null}
            </View>
          </View>

          {/* Badges de Gênero */}
          {genreNames.length > 0 ? (
            <View style={styles.genresWrapper}>
              {genreNames.map((name, index) => (
                <GenreBadge key={index} name={name} size="xs" />
              ))}
            </View>
          ) : null}

          {/* Sinopse Curta */}
          {movie.overview ? (
            <Text style={styles.overview} numberOfLines={2}>
              {movie.overview}
            </Text>
          ) : null}

          {/* Ação: Botão 'Já Assisti' ou 'Remover' ou 'Mover' */}
          <View style={styles.actionRow}>
            {showRemoveButton ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={(e) => {
                    e?.stopPropagation?.();
                    handleRemove();
                  }}
                  disabled={loadingAction}
                  activeOpacity={0.7}
                >
                  {loadingAction ? (
                    <View style={styles.btnContentRow}>
                      <ActivityIndicator size="small" color={theme.colors.error} style={{ marginRight: 6 }} />
                      <Text style={styles.removeButtonText}>Removendo...</Text>
                    </View>
                  ) : (
                    <View style={styles.btnContentRow}>
                      <Icon name="trash-outline" size={15} color={theme.colors.error} />
                      <Text style={styles.removeButtonText}>Remover</Text>
                    </View>
                  )}
                </TouchableOpacity>

                {onPressMoveToList && (
                  <TouchableOpacity
                    style={styles.moveButton}
                    onPress={(e) => {
                      e?.stopPropagation?.();
                      onPressMoveToList(movie);
                    }}
                    activeOpacity={0.7}
                  >
                    <Icon name="add" size={14} color={theme.colors.textSecondary} />
                    <Text style={styles.moveButtonText}>Lista</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <View style={styles.mainActionRow}>
                {/* Botão Já Assisti */}
                <TouchableOpacity
                  style={[
                    styles.watchButton,
                    isWatched && styles.watchedButtonActive,
                  ]}
                  onPress={(e) => {
                    e?.stopPropagation?.();
                    handleWatchToggle();
                  }}
                  disabled={isWatched || loadingAction}
                  activeOpacity={0.7}
                >
                  {loadingAction ? (
                    <View style={styles.btnContentRow}>
                      <ActivityIndicator
                        size="small"
                        color="#FFF"
                        style={{ marginRight: 6 }}
                      />
                      <Text style={styles.watchButtonText}>Adicionando...</Text>
                    </View>
                  ) : isWatched ? (
                    <View style={styles.btnContentRow}>
                      <Icon
                        name="checkmark-circle"
                        size={16}
                        color={theme.colors.success}
                        style={{ marginRight: 5 }}
                      />
                      <Text style={styles.watchedButtonText}>Assistido</Text>
                    </View>
                  ) : (
                    <View style={styles.btnContentRow}>
                      <Icon
                        name="add-circle-outline"
                        size={16}
                        color="#FFF"
                        style={{ marginRight: 5 }}
                      />
                      <Text style={styles.watchButtonText}>Já Assisti</Text>
                    </View>
                  )}
                </TouchableOpacity>

                {/* Botão Quero Assistir (ocultado se já assistiu) */}
                {!isWatched && (onAddToWatchlist || onRemoveFromWatchlist) && (
                  <TouchableOpacity
                    style={[
                      styles.watchlistButton,
                      isOnWatchlist && styles.watchlistButtonActive,
                    ]}
                    onPress={(e) => {
                      e?.stopPropagation?.();
                      handleWatchlistToggle();
                    }}
                    disabled={loadingAction}
                    activeOpacity={0.7}
                  >
                    <Icon
                      name={isOnWatchlist ? 'bookmark' : 'bookmark-outline'}
                      size={15}
                      color={isOnWatchlist ? theme.colors.accent : theme.colors.textSecondary}
                      style={{ marginRight: 4 }}
                    />
                    <Text
                      style={[
                        styles.watchlistButtonText,
                        isOnWatchlist && styles.watchlistButtonTextActive,
                      ]}
                    >
                      {isOnWatchlist ? 'Na Lista' : 'Quero Assistir'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {!isSelectable && (
              <View style={styles.tapForMore}>
                <Text style={styles.tapForMoreText}>Toque para detalhes</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>

      {/* Modal com Todas as Informações Detalhadas */}
      <MovieDetailsModal
        visible={showDetailsModal}
        movie={movie}
        isWatched={isWatched}
        isOnWatchlist={isOnWatchlist}
        onClose={() => setShowDetailsModal(false)}
        onPressWatch={onPressWatch}
        onPressRemove={onPressRemove}
        onAddToWatchlist={onAddToWatchlist}
        onRemoveFromWatchlist={onRemoveFromWatchlist}
        showRemoveButton={showRemoveButton}
      />
    </>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.md,
    marginHorizontal: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  cardSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: 'rgba(229, 9, 20, 0.08)',
  },
  posterContainer: {
    width: 100,
    height: 145,
    borderRadius: theme.borderRadius.sm,
    overflow: 'hidden',
    backgroundColor: theme.colors.surfaceLight,
    position: 'relative',
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
    backgroundColor: theme.colors.surfaceLight,
  },
  placeholderText: {
    color: theme.colors.textMuted,
    fontSize: theme.fontSize.xs,
    marginTop: 4,
  },
  ratingBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(11, 12, 18, 0.85)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.xs,
    borderWidth: 1,
    borderColor: 'rgba(255, 184, 0, 0.4)',
  },
  ratingText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 3,
  },
  checkbox: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(11, 12, 18, 0.85)',
    borderWidth: 2,
    borderColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  detailsContainer: {
    flex: 1,
    marginLeft: theme.spacing.md,
    justifyContent: 'space-between',
  },
  headerInfo: {
    marginBottom: 4,
  },
  title: {
    color: theme.colors.text,
    fontSize: theme.fontSize.md,
    fontWeight: '700',
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    flexWrap: 'wrap',
    gap: 4,
  },
  year: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.xs,
  },
  metaDot: {
    color: theme.colors.textMuted,
    marginHorizontal: 3,
    fontSize: 10,
  },
  runtimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 184, 0, 0.09)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: theme.borderRadius.xs,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 184, 0, 0.25)',
  },
  runtimeText: {
    color: theme.colors.accent,
    fontSize: 11,
    fontWeight: '700',
  },
  listBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: theme.borderRadius.xs,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    marginLeft: 4,
  },
  listBadgeText: {
    color: theme.colors.textSecondary,
    fontSize: 10,
    fontWeight: '600',
  },
  genresWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 4,
  },
  overview: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.xs,
    lineHeight: 16,
    marginBottom: 6,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    gap: 6,
  },
  mainActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  btnContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  watchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: theme.borderRadius.sm,
    justifyContent: 'center',
  },
  watchButtonText: {
    color: '#FFF',
    fontSize: theme.fontSize.xs,
    fontWeight: '700',
  },
  watchedButtonActive: {
    backgroundColor: theme.colors.successBg,
    borderWidth: 1,
    borderColor: theme.colors.success,
  },
  watchedButtonText: {
    color: theme.colors.success,
    fontSize: theme.fontSize.xs,
    fontWeight: '700',
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.errorBg,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.sm,
    minWidth: 90,
    justifyContent: 'center',
  },
  removeButtonText: {
    color: theme.colors.error,
    fontSize: theme.fontSize.xs,
    fontWeight: '600',
    marginLeft: 4,
  },
  moveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceLight,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.sm,
  },
  moveButtonText: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.xs,
    fontWeight: '600',
    marginLeft: 3,
  },
  tapForMore: {
    paddingLeft: 4,
  },
  tapForMoreText: {
    color: theme.colors.textMuted,
    fontSize: 10,
    fontStyle: 'italic',
  },
  watchlistButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 184, 0, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 184, 0, 0.2)',
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: theme.borderRadius.sm,
    justifyContent: 'center',
  },
  watchlistButtonActive: {
    backgroundColor: 'rgba(255, 184, 0, 0.18)',
    borderColor: 'rgba(255, 184, 0, 0.5)',
  },
  watchlistButtonText: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.xs,
    fontWeight: '700',
  },
  watchlistButtonTextActive: {
    color: theme.colors.accent,
  },
});
