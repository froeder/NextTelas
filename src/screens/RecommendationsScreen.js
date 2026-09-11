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
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../utils/theme';
import { Loading } from '../components/Loading';
import { MovieCard } from '../components/MovieCard';
import { MovieCarousel } from '../components/MovieCarousel';
import { InsightBanner } from '../components/InsightBanner';
import { extractTopGenres, filterAlreadyWatchedMovies } from '../utils/genreExtractor';
import { discoverMoviesByGenres, getTrendingOrPopularMovies } from '../services/tmdbService';
import { addWatchedMovie } from '../services/firestoreService';

export const RecommendationsScreen = ({ user, watchedMovies = [], onNavigateToSearch }) => {
  const [recommendedMovies, setRecommendedMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [topGenresInfo, setTopGenresInfo] = useState({ topGenreIds: [], topGenresDetails: [], totalWatched: 0 });

  // PASSO A (Leitura) é fornecido por watchedMovies em tempo real via props/Firestore listener!
  // PASSO B (Padrões) + PASSO C (Descoberta) + PASSO D (Filtro)
  const fetchRecommendations = useCallback(async () => {
    setLoading(true);
    try {
      // Passo B (Padrões): Extrai os 2 ou 3 gêneros mais frequentes
      const patternResult = extractTopGenres(watchedMovies, 3);
      setTopGenresInfo(patternResult);

      let rawDiscoverList = [];

      if (patternResult.topGenreIds.length > 0) {
        // Passo C (Descoberta): Consulta TMDb /discover/movie com with_genres
        const { results, error } = await discoverMoviesByGenres(patternResult.topGenreIds);
        if (error) {
          console.warn('Erro ao consultar /discover/movie:', error);
        }
        rawDiscoverList = results || [];
      } else {
        // Fallback: se o usuário ainda não assistiu a nada, pega os populares
        const { results } = await getTrendingOrPopularMovies(1);
        rawDiscoverList = results || [];
      }

      // Passo D (Filtro): Oculta os filmes que o usuário já assistiu
      const filtered = filterAlreadyWatchedMovies(rawDiscoverList, watchedMovies);
      setRecommendedMovies(filtered);
    } catch (error) {
      console.error('Erro no fluxo de recomendações:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [watchedMovies]);

  // Dispara nova descoberta sempre que a lista de filmes assistidos mudar
  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchRecommendations();
  };

  const handleWatchMovie = async (movie) => {
    if (!user?.uid) return;
    const { success, error } = await addWatchedMovie(user.uid, movie);
    if (!success) {
      Alert.alert('Erro ao salvar', error || 'Não foi possível registrar o filme.');
    }
  };

  // Separa os primeiros 6 filmes para o carrossel de destaques e o restante para a lista
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
      {/* Banner Explicativo da Descoberta por Padrões */}
      <InsightBanner
        topGenresDetails={topGenresInfo.topGenresDetails}
        totalWatched={topGenresInfo.totalWatched}
      />

      {loading && !refreshing ? (
        <Loading message="Calculando padrões e descobrindo recomendações..." />
      ) : watchedMovies.length === 0 ? (
        /* Empty State: Usuário ainda não marcou nenhum filme */
        <View style={styles.emptyStateContainer}>
          <View style={styles.emptyIconBg}>
            <Ionicons name="sparkles" size={48} color={theme.colors.accent} />
          </View>
          <Text style={styles.emptyTitle}>Seu Perfil Está Vazio</Text>
          <Text style={styles.emptyDescription}>
            Para ativarmos a <Text style={{ color: theme.colors.primary, fontWeight: '700' }}>Descoberta por Padrões</Text>, você precisa marcar alguns filmes que já assistiu.
          </Text>

          <TouchableOpacity
            style={styles.goToSearchButton}
            onPress={onNavigateToSearch}
            activeOpacity={0.8}
          >
            <Ionicons name="search" size={18} color="#FFF" style={{ marginRight: 8 }} />
            <Text style={styles.goToSearchButtonText}>Buscar e Marcar Filmes</Text>
          </TouchableOpacity>
        </View>
      ) : recommendedMovies.length === 0 ? (
        /* Nenhum filme encontrado após filtragem */
        <View style={styles.emptyStateContainer}>
          <Ionicons name="film-outline" size={48} color={theme.colors.textMuted} />
          <Text style={styles.emptyTitle}>Sem Novas Sugestões no Momento</Text>
          <Text style={styles.emptyDescription}>
            Você já assistiu a quase todos os títulos mais populares desses gêneros! Tente puxar a tela para atualizar ou adicionar filmes de outros estilos.
          </Text>
        </View>
      ) : (
        /* Renderização das Recomendações: Carrossel + Grid */
        <View style={styles.resultsContainer}>
          {/* Carrossel de Destaques Recomendados */}
          {carouselItems.length > 0 && (
            <MovieCarousel
              title="Em Alta no Seu Gosto"
              movies={carouselItems}
              onPressWatch={handleWatchMovie}
            />
          )}

          {/* Lista de Filmes Recomendados */}
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="star" size={18} color={theme.colors.accent} style={{ marginRight: 6 }} />
              <Text style={styles.sectionTitle}>Mais Descobertas para Você</Text>
            </View>
            <Text style={styles.sectionSubtitle}>
              Filmes inéditos que combinam com seu histórico
            </Text>
          </View>

          {listItems.map((movie) => (
            <MovieCard
              key={String(movie.id)}
              movie={movie}
              isWatched={false}
              onPressWatch={handleWatchMovie}
            />
          ))}
        </View>
      )}

      <View style={{ height: theme.spacing.xl }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
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
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyDescription: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 290,
    marginBottom: theme.spacing.lg,
  },
  goToSearchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 12,
    borderRadius: theme.borderRadius.md,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  goToSearchButtonText: {
    color: '#FFF',
    fontSize: theme.fontSize.sm,
    fontWeight: '700',
  },
  resultsContainer: {
    marginTop: theme.spacing.xs,
  },
  sectionHeader: {
    paddingHorizontal: theme.spacing.md,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: theme.fontSize.lg,
    fontWeight: '700',
  },
  sectionSubtitle: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.xs,
    marginTop: 2,
  },
});
