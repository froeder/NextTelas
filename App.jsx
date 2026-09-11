import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { theme } from './src/utils/theme';
import { subscribeAuthState } from './src/services/authService';
import { subscribeWatchedMovies } from './src/services/firestoreService';
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
          />
        );
      case 'search':
        return (
          <SearchScreen
            user={user}
            watchedMovies={watchedMovies}
          />
        );
      case 'watched':
        return (
          <WatchedScreen
            user={user}
            watchedMovies={watchedMovies}
            onNavigateToSearch={() => setActiveTab('search')}
          />
        );
      default:
        return (
          <RecommendationsScreen
            user={user}
            watchedMovies={watchedMovies}
            onNavigateToSearch={() => setActiveTab('search')}
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
