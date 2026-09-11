import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Icon } from './Icon';
import { theme } from '../utils/theme';
import { getGenreNames } from '../utils/tmdbGenres';
import { MovieDetailsModal } from './MovieDetailsModal';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = width * 0.42;
const ITEM_HEIGHT = ITEM_WIDTH * 1.5;

export const MovieCarousel = ({
  title = 'Destaques Recomendados',
  movies = [],
  onPressWatch,
  isMovieWatched,
}) => {
  const [loadingMovieId, setLoadingMovieId] = useState(null);
  const [selectedMovie, setSelectedMovie] = useState(null);

  if (!movies || movies.length === 0) return null;

  const handleWatch = async (item) => {
    const isWatched = isMovieWatched ? isMovieWatched(item.id) : false;
    if (isWatched || loadingMovieId || !onPressWatch) return;

    try {
      setLoadingMovieId(item.id);
      await onPressWatch(item);
    } finally {
      setLoadingMovieId(null);
    }
  };

  const renderItem = ({ item }) => {
    const posterUri = item.poster_path
      ? 'https://image.tmdb.org/t/p/w500' + item.poster_path
      : null;

    const rating = item.vote_average
      ? Number(item.vote_average).toFixed(1)
      : null;

    const watched = isMovieWatched ? isMovieWatched(item.id) : false;
    const isLoading = loadingMovieId === item.id;
    const primaryGenre = getGenreNames(item.genre_ids)[0] || '';

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.88}
        onPress={() => setSelectedMovie(item)}
      >
        <View style={styles.posterContainer}>
          {posterUri ? (
            <Image
              source={{ uri: posterUri }}
              style={styles.poster}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.posterPlaceholder}>
              <Icon name="film-outline" size={32} color={theme.colors.textMuted} />
            </View>
          )}

          {/* Rating Badge */}
          {rating ? (
            <View style={styles.ratingBadge}>
              <Icon name="star" size={10} color={theme.colors.accent} />
              <Text style={styles.ratingText}>{rating}</Text>
            </View>
          ) : null}

          {/* Botão Flutuante de Assistido com Loading */}
          <TouchableOpacity
            style={[
              styles.floatingWatchBtn,
              watched && styles.floatingWatchBtnActive,
            ]}
            onPress={(e) => {
              e?.stopPropagation?.();
              handleWatch(item);
            }}
            disabled={watched || isLoading}
            activeOpacity={0.7}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Icon
                name={watched ? 'checkmark' : 'add'}
                size={16}
                color={watched ? theme.colors.success : '#FFF'}
              />
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.movieTitle} numberOfLines={1}>
          {item.title}
        </Text>

        {primaryGenre ? (
          <Text style={styles.genreText} numberOfLines={1}>
            {primaryGenre}
          </Text>
        ) : null}
      </TouchableOpacity>
    );
  };

  return (
    <>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Icon name="flame" size={18} color={theme.colors.primary} style={{ marginRight: 6 }} />
            <Text style={styles.sectionTitle}>{title}</Text>
          </View>
          <Text style={styles.countText}>{movies.length} títulos</Text>
        </View>

        <FlatList
          data={movies}
          renderItem={renderItem}
          keyExtractor={(item) => String(item.id)}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          decelerationRate="fast"
        />
      </View>

      {/* Modal de Detalhes do Filme */}
      <MovieDetailsModal
        visible={!!selectedMovie}
        movie={selectedMovie}
        isWatched={isMovieWatched && selectedMovie ? isMovieWatched(selectedMovie.id) : false}
        onClose={() => setSelectedMovie(null)}
        onPressWatch={onPressWatch}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: theme.spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: theme.fontSize.lg,
    fontWeight: '700',
  },
  countText: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.xs,
  },
  listContent: {
    paddingHorizontal: theme.spacing.md,
  },
  card: {
    width: ITEM_WIDTH,
    marginRight: theme.spacing.md,
  },
  posterContainer: {
    width: ITEM_WIDTH,
    height: ITEM_HEIGHT,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    backgroundColor: theme.colors.surface,
    position: 'relative',
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
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
  ratingBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(11, 12, 18, 0.85)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: theme.borderRadius.xs,
    borderWidth: 1,
    borderColor: 'rgba(255, 184, 0, 0.4)',
  },
  ratingText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
    marginLeft: 3,
  },
  floatingWatchBtn: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: theme.colors.primary,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 3,
  },
  floatingWatchBtnActive: {
    backgroundColor: 'rgba(11, 12, 18, 0.85)',
    borderWidth: 1,
    borderColor: theme.colors.success,
  },
  movieTitle: {
    color: theme.colors.text,
    fontSize: theme.fontSize.sm,
    fontWeight: '700',
    marginTop: 6,
  },
  genreText: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    marginTop: 1,
  },
});
