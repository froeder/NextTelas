import React, { useState } from 'react';
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

export const MovieCard = ({
  movie,
  isWatched = false,
  onPressWatch,
  onPressRemove,
  showRemoveButton = false,
}) => {
  const [loadingAction, setLoadingAction] = useState(false);

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

  return (
    <View style={styles.card}>
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
      </View>

      {/* Conteúdo e Informações do Filme */}
      <View style={styles.detailsContainer}>
        <View style={styles.headerInfo}>
          <Text style={styles.title} numberOfLines={2}>
            {movie.title}
          </Text>

          {releaseYear ? (
            <Text style={styles.year}>{releaseYear}</Text>
          ) : null}
        </View>

        {/* Badges de Gênero */}
        {genreNames.length > 0 ? (
          <View style={styles.genresWrapper}>
            {genreNames.map((name, index) => (
              <GenreBadge key={index} name={name} size="xs" />
            ))}
          </View>
        ) : null}

        {/* Sinopse Curta (se disponível) */}
        {movie.overview ? (
          <Text style={styles.overview} numberOfLines={2}>
            {movie.overview}
          </Text>
        ) : null}

        {/* Ação: Botão 'Já Assisti' ou 'Remover' */}
        <View style={styles.actionRow}>
          {showRemoveButton ? (
            <TouchableOpacity
              style={styles.removeButton}
              onPress={handleRemove}
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
          ) : (
            <TouchableOpacity
              style={[
                styles.watchButton,
                isWatched && styles.watchedButtonActive,
              ]}
              onPress={handleWatchToggle}
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
          )}
        </View>
      </View>
    </View>
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
  year: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.xs,
    marginTop: 2,
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
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginTop: 4,
  },
  btnContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  watchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: theme.borderRadius.sm,
    minWidth: 105,
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
    minWidth: 95,
    justifyContent: 'center',
  },
  removeButtonText: {
    color: theme.colors.error,
    fontSize: theme.fontSize.xs,
    fontWeight: '600',
    marginLeft: 4,
  },
});
