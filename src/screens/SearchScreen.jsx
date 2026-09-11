import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
} from 'react-native';
import { Icon } from '../components/Icon';
import { theme } from '../utils/theme';
import { MovieCard } from '../components/MovieCard';
import { Loading } from '../components/Loading';
import { searchMovies, getTrendingOrPopularMovies } from '../services/tmdbService';
import { addWatchedMovie } from '../services/firestoreService';

export const SearchScreen = ({ user, watchedMovies = [] }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [popularMovies, setPopularMovies] = useState([]);
  const [loadingPopular, setLoadingPopular] = useState(true);

  // Set com os IDs dos filmes já assistidos para conferência instantânea O(1)
  const watchedIdsSet = new Set(watchedMovies.map((m) => String(m.id)));

  // Carrega filmes populares em alta como sugestões iniciais
  useEffect(() => {
    let isMounted = true;
    const loadPopular = async () => {
      setLoadingPopular(true);
      const { results: popResults } = await getTrendingOrPopularMovies(1);
      if (isMounted && popResults) {
        setPopularMovies(popResults.slice(0, 10));
      }
      if (isMounted) setLoadingPopular(false);
    };

    loadPopular();
    return () => {
      isMounted = false;
    };
  }, []);

  // Executa a busca na TMDb (/search/movie com language=pt-BR)
  const handleSearch = useCallback(async (textToSearch) => {
    const term = textToSearch !== undefined ? textToSearch : query;
    if (!term || term.trim().length === 0) {
      setResults([]);
      setSearched(false);
      return;
    }

    setLoading(true);
    setSearched(true);
    try {
      const { results: movies, error } = await searchMovies(term.trim());
      if (error) {
        Alert.alert('Aviso TMDb', 'Não foi possível buscar filmes. Verifique se a sua TMDb API Key está configurada.');
      }
      setResults(movies || []);
    } finally {
      setLoading(false);
    }
  }, [query]);

  // Ação ao clicar em 'Já Assisti'
  const handleWatchMovie = async (movie) => {
    if (!user || !user.uid) {
      Alert.alert('Erro', 'Usuário não autenticado.');
      return;
    }

    const { success, error } = await addWatchedMovie(user.uid, movie);
    if (!success) {
      Alert.alert('Erro ao salvar', error || 'Não foi possível registrar o filme.');
    }
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setSearched(false);
  };

  const isMovieWatched = (movieId) => watchedIdsSet.has(String(movieId));

  return (
    <View style={styles.container}>
      {/* Barra de Busca Cinematográfica */}
      <View style={styles.searchBarWrapper}>
        <View style={styles.searchBar}>
          <Icon name="search" size={20} color={theme.colors.textSecondary} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por título (ex: Interestelar, Batman)..."
            placeholderTextColor={theme.colors.textMuted}
            value={query}
            onChangeText={(text) => {
              setQuery(text);
              if (text.length === 0) {
                setResults([]);
                setSearched(false);
              }
            }}
            onSubmitEditing={() => handleSearch()}
            returnKeyType="search"
          />
          {query.length > 0 ? (
            <TouchableOpacity onPress={handleClear} style={styles.clearBtn}>
              <Icon name="close-circle" size={18} color={theme.colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        <TouchableOpacity
          style={styles.searchBtn}
          onPress={() => handleSearch()}
          activeOpacity={0.8}
        >
          <Text style={styles.searchBtnText}>Buscar</Text>
        </TouchableOpacity>
      </View>

      {/* Indicador de carregamento */}
      {loading ? (
        <Loading message="Pesquisando títulos na TMDb..." />
      ) : searched ? (
        /* Lista de Resultados da Busca */
        <FlatList
          data={results}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <MovieCard
              movie={item}
              isWatched={isMovieWatched(item.id)}
              onPressWatch={handleWatchMovie}
            />
          )}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsCount}>
                {results.length} {results.length === 1 ? 'resultado encontrado' : 'resultados encontrados'}
              </Text>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Icon name="film-outline" size={48} color={theme.colors.textMuted} />
              <Text style={styles.emptyTitle}>Nenhum filme encontrado</Text>
              <Text style={styles.emptySubtitle}>
                Tente buscar por outro termo ou confira a ortografia do título.
              </Text>
            </View>
          }
        />
      ) : (
        /* Sugestões em Alta quando não houver busca ativa */
        <FlatList
          data={popularMovies}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <MovieCard
              movie={item}
              isWatched={isMovieWatched(item.id)}
              onPressWatch={handleWatchMovie}
            />
          )}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <View style={styles.popularHeader}>
              <View style={styles.popularTitleRow}>
                <Icon name="trending-up" size={20} color={theme.colors.accent} style={{ marginRight: 6 }} />
                <Text style={styles.popularTitle}>Títulos Populares para Começar</Text>
              </View>
              <Text style={styles.popularSubtitle}>
                Marque os que você já viu para começar a alimentar o algoritmo de descoberta por padrões!
              </Text>
            </View>
          }
          ListEmptyComponent={
            loadingPopular ? (
              <Loading message="Carregando sugestões populares..." />
            ) : null
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  searchBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    gap: 8,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
    paddingHorizontal: theme.spacing.md,
    height: 48,
  },
  searchInput: {
    flex: 1,
    color: theme.colors.text,
    fontSize: theme.fontSize.sm,
  },
  clearBtn: {
    padding: 4,
  },
  searchBtn: {
    backgroundColor: theme.colors.primary,
    height: 48,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBtnText: {
    color: '#FFF',
    fontSize: theme.fontSize.sm,
    fontWeight: '700',
  },
  listContent: {
    paddingBottom: theme.spacing.xl,
  },
  resultsHeader: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  resultsCount: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.xs,
    fontWeight: '600',
  },
  popularHeader: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  popularTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  popularTitle: {
    color: theme.colors.text,
    fontSize: theme.fontSize.md,
    fontWeight: '700',
  },
  popularSubtitle: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.xs,
    lineHeight: 18,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
    marginTop: theme.spacing.xl,
  },
  emptyTitle: {
    color: theme.colors.text,
    fontSize: theme.fontSize.lg,
    fontWeight: '700',
    marginTop: theme.spacing.md,
  },
  emptySubtitle: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
    textAlign: 'center',
    marginTop: 6,
    maxWidth: 260,
  },
});
