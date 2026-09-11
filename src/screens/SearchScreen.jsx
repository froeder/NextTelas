import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Icon } from '../components/Icon';
import { theme } from '../utils/theme';
import { MovieCard } from '../components/MovieCard';
import { Loading } from '../components/Loading';
import { searchMovies, getTrendingOrPopularMovies } from '../services/tmdbService';
import { addWatchedMovie } from '../services/firestoreService';

export const SearchScreen = ({ user, watchedMovies = [], watchlist = [], onAddWatched, onAddToWatchlist, onRemoveFromWatchlist }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [popularMovies, setPopularMovies] = useState([]);
  const [loadingPopular, setLoadingPopular] = useState(true);
  const [searchError, setSearchError] = useState(null);

  const debounceTimerRef = useRef(null);
  const requestIdRef = useRef(0);

  // Set com os IDs dos filmes já assistidos para conferência instantânea O(1)
  const watchedIdsSet = new Set(watchedMovies.map((m) => String(m.id)));
  // Set com os IDs dos filmes na watchlist (Quero Assistir)
  const watchlistIdsSet = new Set(watchlist.map((m) => String(m.id)));

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

  // Executa a busca na TMDb com proteção contra concorrência/respostas antigas
  const performSearch = useCallback(async (termToSearch) => {
    const term = (termToSearch !== undefined ? termToSearch : query).trim();
    if (!term) {
      setResults([]);
      setSearched(false);
      setLoading(false);
      setSearchError(null);
      return;
    }

    setLoading(true);
    setSearched(true);
    setSearchError(null);

    const currentReqId = ++requestIdRef.current;
    try {
      const { results: movies, error } = await searchMovies(term);
      // Descarta a resposta caso o usuário já tenha digitado outro termo posteriormente
      if (currentReqId === requestIdRef.current) {
        if (error) {
          setSearchError('Não foi possível buscar filmes. Verifique se a TMDb API Key está configurada no .env.');
          setResults([]);
        } else {
          setSearchError(null);
          setResults(movies || []);
        }
      }
    } catch (err) {
      if (currentReqId === requestIdRef.current) {
        setSearchError('Erro ao consultar filmes.');
        setResults([]);
      }
    } finally {
      if (currentReqId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [query]);

  // Efeito de Busca Dinâmica / Tempo Real ao digitar (Debounce de 350ms)
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    const trimmed = query.trim();
    if (trimmed.length === 0) {
      setResults([]);
      setSearched(false);
      setLoading(false);
      setSearchError(null);
      return;
    }

    setSearched(true);
    setLoading(true);

    debounceTimerRef.current = setTimeout(() => {
      performSearch(trimmed);
    }, 350);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query, performSearch]);

  // Busca imediata quando o usuário clica no botão "Buscar" ou dá Enter
  const handleImmediateSearch = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    performSearch(query);
  };

  // Limpa campo de busca e restaura os títulos em alta
  const handleClear = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    setQuery('');
    setResults([]);
    setSearched(false);
    setLoading(false);
    setSearchError(null);
  };

  // Ação ao clicar em 'Já Assisti'
  const handleWatchMovie = async (movie) => {
    if (!user || !user.uid) {
      if (typeof window !== 'undefined' && window.alert) {
        window.alert('Usuário não autenticado.');
      } else {
        Alert.alert('Erro', 'Usuário não autenticado.');
      }
      return;
    }

    if (onAddWatched) {
      const res = await onAddWatched(movie);
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

  const isMovieWatched = (movieId) => watchedIdsSet.has(String(movieId));

  return (
    <View style={styles.container}>
      {/* Barra de Busca Cinematográfica com Live Search */}
      <View style={styles.searchBarWrapper}>
        <View style={styles.searchBar}>
          <Icon name="search" size={20} color={theme.colors.textSecondary} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por título (ex: Interestelar, Batman)..."
            placeholderTextColor={theme.colors.textMuted}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleImmediateSearch}
            returnKeyType="search"
          />

          {/* Indicador de carregamento sutil enquanto digita */}
          {loading && (
            <ActivityIndicator
              size="small"
              color={theme.colors.primary}
              style={{ marginRight: query.length > 0 ? 8 : 0 }}
            />
          )}

          {/* Botão para limpar */}
          {query.length > 0 && (
            <TouchableOpacity onPress={handleClear} style={styles.clearBtn}>
              <Icon name="close-circle" size={18} color={theme.colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={styles.searchBtn}
          onPress={handleImmediateSearch}
          activeOpacity={0.8}
        >
          <Text style={styles.searchBtnText}>Buscar</Text>
        </TouchableOpacity>
      </View>

      {/* Mensagem de Erro / Aviso TMDb se houver */}
      {searchError && (
        <View style={styles.errorBanner}>
          <Icon name="alert-circle" size={18} color={theme.colors.warning || '#f59e0b'} style={{ marginRight: 8 }} />
          <Text style={styles.errorText}>{searchError}</Text>
        </View>
      )}

      {/* Se estiver buscando e ainda não tem nenhum resultado na tela */}
      {loading && results.length === 0 ? (
        <Loading message={`Pesquisando "${query}" na TMDb...`} />
      ) : searched ? (
        /* Lista de Resultados da Busca Dinâmica */
        <FlatList
          data={results}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <MovieCard
              movie={item}
              isWatched={isMovieWatched(item.id)}
              isOnWatchlist={watchlistIdsSet.has(String(item.id))}
              onPressWatch={handleWatchMovie}
              onAddToWatchlist={onAddToWatchlist}
              onRemoveFromWatchlist={onRemoveFromWatchlist}
            />
          )}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsCount}>
                {results.length} {results.length === 1 ? 'resultado encontrado' : 'resultados encontrados'}
                {loading ? ' (atualizando...)' : ''}
              </Text>
            </View>
          }
          ListEmptyComponent={
            !loading ? (
              <View style={styles.emptyState}>
                <Icon name="film-outline" size={48} color={theme.colors.textMuted} />
                <Text style={styles.emptyTitle}>Nenhum filme encontrado</Text>
                <Text style={styles.emptySubtitle}>
                  Não encontramos títulos correspondentes a "{query}". Verifique a ortografia ou tente outro termo.
                </Text>
              </View>
            ) : null
          }
        />
      ) : (
        /* Sugestões em Alta quando o campo de busca estiver vazio */
        <FlatList
          data={popularMovies}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <MovieCard
              movie={item}
              isWatched={isMovieWatched(item.id)}
              isOnWatchlist={watchlistIdsSet.has(String(item.id))}
              onPressWatch={handleWatchMovie}
              onAddToWatchlist={onAddToWatchlist}
              onRemoveFromWatchlist={onRemoveFromWatchlist}
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
                Marque os filmes que você já viu para alimentar seu algoritmo de descoberta de padrões!
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
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderWidth: 1,
    borderRadius: theme.borderRadius.sm,
    marginHorizontal: theme.spacing.md,
    marginVertical: theme.spacing.xs,
    padding: theme.spacing.sm,
  },
  errorText: {
    flex: 1,
    color: '#fbbf24',
    fontSize: theme.fontSize.xs,
    lineHeight: 16,
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
    maxWidth: 280,
  },
});
