import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { theme } from './src/utils/theme';
import { subscribeAuthState } from './src/services/authService';
import {
  subscribeWatchedMovies,
  addWatchedMovie,
  removeWatchedMovie,
  subscribeCustomLists,
  createCustomList,
  deleteCustomList,
  moveMoviesToList,
  subscribeWatchlist,
  addToWatchlist,
  removeFromWatchlist,
} from './src/services/firestoreService';
import { Header } from './src/components/Header';
import { CustomTabBar } from './src/components/CustomTabBar';
import { Loading } from './src/components/Loading';
import { AuthScreen } from './src/screens/AuthScreen';
import { RecommendationsScreen } from './src/screens/RecommendationsScreen';
import { SearchScreen } from './src/screens/SearchScreen';
import { WatchedScreen } from './src/screens/WatchedScreen';
import { getMovieDetails } from './src/services/tmdbService';
import { pushTabHistory } from './src/utils/pwaHistory';

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('recommendations');
  const [watchedMovies, setWatchedMovies] = useState([]);
  const [customLists, setCustomLists] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const [selectedListIdForRecommendations, setSelectedListIdForRecommendations] = useState('all');

  // Escuta o evento customizado pwa-tab-change (gesto voltar trocando de aba)
  useEffect(() => {
    const handlePwaTabChange = (e) => {
      if (e.detail?.tab) {
        setActiveTab(e.detail.tab);
      }
    };
    window.addEventListener('pwa-tab-change', handlePwaTabChange);
    return () => window.removeEventListener('pwa-tab-change', handlePwaTabChange);
  }, []);

  const handleSelectTab = (tab) => {
    setActiveTab(tab);
    pushTabHistory(tab);
  };

  // Escuta o estado de autenticação do Firebase
  useEffect(() => {
    const unsubscribe = subscribeAuthState((currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Quando o usuário estiver logado, escuta a subcoleção de filmes assistidos, listas e watchlist
  useEffect(() => {
    if (!user?.uid) {
      setWatchedMovies([]);
      setCustomLists([]);
      setWatchlist([]);
      return;
    }

    const unsubMovies = subscribeWatchedMovies(user.uid, (movies) => {
      setWatchedMovies(movies || []);
    });

    const unsubLists = subscribeCustomLists(user.uid, (lists) => {
      setCustomLists(lists || []);
    });

    const unsubWatchlist = subscribeWatchlist(user.uid, (items) => {
      setWatchlist(items || []);
    });

    return () => {
      unsubMovies();
      unsubLists();
      unsubWatchlist();
    };
  }, [user]);

  // Adiciona filme aos assistidos com atualização otimista instantânea
  const handleAddWatched = async (movie, listId = null) => {
    if (!user?.uid || !movie?.id) return { success: false, error: 'Dados inválidos' };

    // Resolve o runtime: usa o que já existe no objeto ou busca da TMDb
    let runtime = Number(movie.runtime) || 0;
    if (!runtime) {
      try {
        const { data } = await getMovieDetails(movie.id);
        runtime = Number(data?.runtime) || 0;
      } catch (_) {
        runtime = 0;
      }
    }

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
      runtime: runtime || 110,
      listIds: listId ? [listId] : (Array.isArray(movie.listIds) ? movie.listIds : []),
    };

    // 1. Atualização Otimista Imediata
    setWatchedMovies((prev) => {
      if (prev.some((m) => String(m.id) === String(movie.id))) return prev;
      return [movieData, ...prev];
    });

    // 2. Persiste no Cloud Firestore
    const res = await addWatchedMovie(user.uid, movieData, listId);
    if (!res.success) {
      setWatchedMovies((prev) => prev.filter((m) => String(m.id) !== String(movie.id)));
    }
    return res;
  };

  // Remove filme dos assistidos com atualização otimista instantânea
  const handleRemoveWatched = async (movieId) => {
    if (!user?.uid || !movieId) return { success: false, error: 'Dados inválidos' };

    const movieToRemove = watchedMovies.find((m) => String(m.id) === String(movieId));

    // 1. Atualização Otimista Imediata
    setWatchedMovies((prev) => prev.filter((m) => String(m.id) !== String(movieId)));

    // 2. Persiste a exclusão no Cloud Firestore
    const res = await removeWatchedMovie(user.uid, movieId);
    if (!res.success && movieToRemove) {
      setWatchedMovies((prev) => [...prev, movieToRemove]);
    }
    return res;
  };

  // Criação de lista customizada com atualização otimista
  const handleCreateList = async (name, icon = 'film') => {
    if (!user?.uid || !name) return { success: false };
    const tempId = `temp_${Date.now()}`;
    const newList = { id: tempId, name: name.trim(), icon: icon || 'film' };

    setCustomLists((prev) => [...prev, newList]);

    const res = await createCustomList(user.uid, name, icon);
    if (!res.success) {
      setCustomLists((prev) => prev.filter((l) => l.id !== tempId));
    }
    return res;
  };

  // Exclusão de lista customizada
  const handleDeleteList = async (listId) => {
    if (!user?.uid || !listId) return { success: false };
    const listToDelete = customLists.find((l) => l.id === listId);

    setCustomLists((prev) => prev.filter((l) => l.id !== listId));
    if (selectedListIdForRecommendations === listId) {
      setSelectedListIdForRecommendations('all');
    }

    // Desvincula localmente os filmes da lista excluída
    setWatchedMovies((prev) =>
      prev.map((m) => {
        if (Array.isArray(m.listIds) && m.listIds.includes(listId)) {
          return { ...m, listIds: m.listIds.filter((id) => id !== listId) };
        }
        return m;
      })
    );

    const res = await deleteCustomList(user.uid, listId);
    if (!res.success && listToDelete) {
      setCustomLists((prev) => [...prev, listToDelete]);
    }
    return res;
  };

  // Movimentação/Atribuição de filmes para uma lista com atualização otimista
  const handleMoveMoviesToList = async (movieIds = [], targetListId = 'all') => {
    if (!user?.uid || !Array.isArray(movieIds) || movieIds.length === 0) return { success: false };

    const idsSet = new Set(movieIds.map(String));
    const previousMoviesState = [...watchedMovies];

    // Atualização otimista local
    setWatchedMovies((prev) =>
      prev.map((m) => {
        if (idsSet.has(String(m.id))) {
          const newListIds = targetListId && targetListId !== 'all' ? [targetListId] : [];
          return { ...m, listIds: newListIds };
        }
        return m;
      })
    );

    const res = await moveMoviesToList(user.uid, movieIds, targetListId);
    if (!res.success) {
      setWatchedMovies(previousMoviesState);
    }
    return res;
  };

  // Adiciona à Watchlist (Quero Assistir) com atualização otimista
  const handleAddToWatchlist = async (movie) => {
    if (!user?.uid || !movie?.id) return { success: false };

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

    // Atualização otimista
    setWatchlist((prev) => {
      if (prev.some((m) => String(m.id) === String(movie.id))) return prev;
      return [movieData, ...prev];
    });

    const res = await addToWatchlist(user.uid, movie);
    if (!res.success) {
      setWatchlist((prev) => prev.filter((m) => String(m.id) !== String(movie.id)));
    }
    return res;
  };

  // Remove da Watchlist com atualização otimista
  const handleRemoveFromWatchlist = async (movieId) => {
    if (!user?.uid || !movieId) return { success: false };

    const prev = watchlist.find((m) => String(m.id) === String(movieId));
    setWatchlist((list) => list.filter((m) => String(m.id) !== String(movieId)));

    const res = await removeFromWatchlist(user.uid, movieId);
    if (!res.success && prev) {
      setWatchlist((list) => [...list, prev]);
    }
    return res;
  };

  // Atalho para ver recomendações de uma lista específica
  const handleNavigateToRecommendationsForList = (listId) => {
    setSelectedListIdForRecommendations(listId || 'all');
    setActiveTab('recommendations');
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
            customLists={customLists}
            selectedListId={selectedListIdForRecommendations}
            onSelectRecommendationList={setSelectedListIdForRecommendations}
            onNavigateToSearch={() => setActiveTab('search')}
            onAddWatched={handleAddWatched}
          />
        );
      case 'search':
        return (
          <SearchScreen
            user={user}
            watchedMovies={watchedMovies}
            watchlist={watchlist}
            onAddWatched={handleAddWatched}
            onAddToWatchlist={handleAddToWatchlist}
            onRemoveFromWatchlist={handleRemoveFromWatchlist}
          />
        );
      case 'watched':
        return (
          <WatchedScreen
            user={user}
            watchedMovies={watchedMovies}
            customLists={customLists}
            onCreateList={handleCreateList}
            onDeleteList={handleDeleteList}
            onMoveMoviesToList={handleMoveMoviesToList}
            onNavigateToSearch={() => setActiveTab('search')}
            onNavigateToRecommendations={handleNavigateToRecommendationsForList}
            onRemoveWatched={handleRemoveWatched}
          />
        );
      default:
        return (
          <RecommendationsScreen
            user={user}
            watchedMovies={watchedMovies}
            customLists={customLists}
            selectedListId={selectedListIdForRecommendations}
            onSelectRecommendationList={setSelectedListIdForRecommendations}
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
        onSelectTab={handleSelectTab}
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
