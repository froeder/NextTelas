import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { theme } from './src/utils/theme';
import { subscribeAuthState } from './src/services/authService';
import {
  subscribeWatchedMovies,
  addWatchedMovie,
  removeWatchedMovie,
} from './src/services/firestoreService';
import { Header } from './src/components/Header';
import { CustomTabBar } from './src/components/CustomTabBar';
import { Loading } from './src/components/Loading';
import { AuthScreen } from './src/screens/AuthScreen';
import { RecommendationsScreen } from './src/screens/RecommendationsScreen';
import { SearchScreen } from './src/screens/SearchScreen';
import { WatchedScreen } from './src/screens/WatchedScreen';

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('recommendations');
  const [watchedMovies, setWatchedMovies] = useState([]);

  // Escuta o estado de autenticação do Firebase
  useEffect(() => {
    const unsubscribe = subscribeAuthState((currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Quando o usuário estiver logado, escuta a subcoleção users/{userId}/watched_movies em tempo real
  useEffect(() => {
    if (!user?.uid) {
      setWatchedMovies([]);
      return;
    }

    const unsubscribe = subscribeWatchedMovies(user.uid, (movies) => {
      setWatchedMovies(movies || []);
    });

    return () => unsubscribe();
  }, [user]);

  // Adiciona filme aos assistidos com atualização otimista instantânea
  const handleAddWatched = async (movie) => {
    if (!user?.uid || !movie?.id) return { success: false, error: 'Dados inválidos' };

    const movieData = {
      id: Number(movie.id),
      title: movie.title || movie.name || 'Sem título',
      poster_path: movie.poster_path || null,
      genre_ids: Array.isArray(movie.genre_ids)
        ? movie.genre_ids
        : (movie.genres ? movie.genres.map((g) => g.id) : []),
      vote_average: Number(movie.vote_average) || 0,
      release_date: movie.release_date || '',
      overview: movie.overview || '',
    };

    // 1. Atualização Otimista Imediata: reflete na UI no mesmo milissegundo
    setWatchedMovies((prev) => {
      if (prev.some((m) => String(m.id) === String(movie.id))) return prev;
      return [movieData, ...prev];
    });

    // 2. Persiste no Cloud Firestore
    const res = await addWatchedMovie(user.uid, movie);
    if (!res.success) {
      // Se a requisição falhar, reverte a alteração local
      setWatchedMovies((prev) => prev.filter((m) => String(m.id) !== String(movie.id)));
    }
    return res;
  };

  // Remove filme dos assistidos com atualização otimista instantânea
  const handleRemoveWatched = async (movieId) => {
    if (!user?.uid || !movieId) return { success: false, error: 'Dados inválidos' };

    const movieToRemove = watchedMovies.find((m) => String(m.id) === String(movieId));

    // 1. Atualização Otimista Imediata: some da tela na mesma hora
    setWatchedMovies((prev) => prev.filter((m) => String(m.id) !== String(movieId)));

    // 2. Persiste a exclusão no Cloud Firestore
    const res = await removeWatchedMovie(user.uid, movieId);
    if (!res.success && movieToRemove) {
      // Se a exclusão falhar, restaura o filme na lista local
      setWatchedMovies((prev) => [...prev, movieToRemove]);
    }
    return res;
  };

  // Carregamento inicial da sessão
  if (authLoading) {
    return (
      <View style={styles.container}>
        <Loading message="Iniciando NextTelas..." fullScreen />
      </View>
    );
  }

  // Se não houver usuário autenticado, exibe a tela de Login/Cadastro
  if (!user) {
    return (
      <View style={styles.container}>
        <AuthScreen />
      </View>
    );
  }

  // Renderiza a tela selecionada na barra de navegação
  const renderScreen = () => {
    switch (activeTab) {
      case 'recommendations':
        return (
          <RecommendationsScreen
            user={user}
            watchedMovies={watchedMovies}
            onNavigateToSearch={() => setActiveTab('search')}
            onAddWatched={handleAddWatched}
          />
        );
      case 'search':
        return (
          <SearchScreen
            user={user}
            watchedMovies={watchedMovies}
            onAddWatched={handleAddWatched}
          />
        );
      case 'watched':
        return (
          <WatchedScreen
            user={user}
            watchedMovies={watchedMovies}
            onNavigateToSearch={() => setActiveTab('search')}
            onRemoveWatched={handleRemoveWatched}
          />
        );
      default:
        return (
          <RecommendationsScreen
            user={user}
            watchedMovies={watchedMovies}
            onNavigateToSearch={() => setActiveTab('search')}
            onAddWatched={handleAddWatched}
          />
        );
    }
  };

  return (
    <View style={styles.container}>
      {/* Cabeçalho do App com perfil e logout */}
      <Header user={user} />

      {/* Conteúdo da Tela Ativa */}
      <View style={styles.content}>
        {renderScreen()}
      </View>

      {/* Barra de Navegação Inferior Customizada */}
      <CustomTabBar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        watchedCount={watchedMovies.length}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
  },
});
