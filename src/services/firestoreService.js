import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebaseConfig';
import { getMovieDetails } from './tmdbService';

/**
 * Retorna a referência da subcoleção 'watched_movies' do usuário
 * Estrutura: users/{userId}/watched_movies
 */
export const getWatchedMoviesRef = (userId) => {
  if (!userId) throw new Error('UserId é obrigatório para acessar o Firestore.');
  return collection(db, 'users', userId, 'watched_movies');
};

/**
 * Retorna a referência da subcoleção 'custom_lists' do usuário
 * Estrutura: users/{userId}/custom_lists
 */
export const getCustomListsRef = (userId) => {
  if (!userId) throw new Error('UserId é obrigatório para acessar o Firestore.');
  return collection(db, 'users', userId, 'custom_lists');
};

/**
 * Salva um filme na subcoleção 'watched_movies' do usuário
 * @param {string} userId - ID do usuário logado
 * @param {object} movie - Dados do filme vindo da TMDb
 * @param {string|null} listId - ID opcional de lista customizada de destino
 */
export const addWatchedMovie = async (userId, movie, listId = null) => {
  try {
    if (!userId || !movie || !movie.id) {
      throw new Error('Dados incompletos para salvar filme.');
    }

    // Resolve o runtime se não fornecido no objeto movie
    let runtime = Number(movie.runtime) || 0;
    if (!runtime) {
      try {
        const { data } = await getMovieDetails(movie.id);
        if (data?.runtime) {
          runtime = Number(data.runtime);
        }
      } catch (_) {}
    }

    const movieDocRef = doc(db, 'users', userId, 'watched_movies', String(movie.id));

    const movieData = {
      id: Number(movie.id),
      title: movie.title || movie.name || 'Sem título',
      poster_path: movie.poster_path || null,
      genre_ids: Array.isArray(movie.genre_ids)
        ? movie.genre_ids
        : (movie.genres ? movie.genres.map(g => g.id) : []),
      vote_average: Number(movie.vote_average) || 0,
      release_date: movie.release_date || '',
      overview: movie.overview || '',
      runtime: runtime || 110,
      listIds: listId ? [listId] : (Array.isArray(movie.listIds) ? movie.listIds : []),
      watchedAt: serverTimestamp(),
    };

    await setDoc(movieDocRef, movieData, { merge: true });
    return { success: true, data: movieData };
  } catch (error) {
    console.error('Erro ao adicionar filme aos assistidos:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Remove um filme da subcoleção 'watched_movies' do usuário
 * @param {string} userId - ID do usuário
 * @param {number|string} movieId - ID do filme na TMDb
 */
export const removeWatchedMovie = async (userId, movieId) => {
  try {
    const movieDocRef = doc(db, 'users', userId, 'watched_movies', String(movieId));
    await deleteDoc(movieDocRef);
    return { success: true };
  } catch (error) {
    console.error('Erro ao remover filme dos assistidos:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Move ou atribui uma lista de filmes a uma lista customizada
 * @param {string} userId
 * @param {Array<string|number>} movieIds
 * @param {string|null} targetListId - ID da lista de destino ('all' ou id customizado)
 */
export const moveMoviesToList = async (userId, movieIds = [], targetListId = null) => {
  try {
    if (!userId || !Array.isArray(movieIds) || movieIds.length === 0) {
      return { success: false, error: 'Nenhum filme selecionado.' };
    }

    const batch = writeBatch(db);
    const targetListIds = targetListId && targetListId !== 'all' ? [targetListId] : [];

    movieIds.forEach((id) => {
      const movieDocRef = doc(db, 'users', userId, 'watched_movies', String(id));
      batch.set(movieDocRef, { listIds: targetListIds }, { merge: true });
    });

    await batch.commit();
    return { success: true };
  } catch (error) {
    console.error('Erro ao mover filmes para lista:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Cria uma nova lista customizada de filmes
 * @param {string} userId
 * @param {string} name - Nome da lista
 * @param {string} icon - Nome do ícone
 */
export const createCustomList = async (userId, name, icon = 'film') => {
  try {
    if (!userId || !name || !name.trim()) {
      throw new Error('Nome da lista é obrigatório.');
    }

    const listsRef = getCustomListsRef(userId);
    const newDocRef = doc(listsRef);
    const listData = {
      id: newDocRef.id,
      name: name.trim(),
      icon: icon || 'film',
      createdAt: serverTimestamp(),
    };

    await setDoc(newDocRef, listData);
    return { success: true, data: listData };
  } catch (error) {
    console.error('Erro ao criar lista:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Exclui uma lista customizada e desvincula os filmes que pertenciam a ela
 * @param {string} userId
 * @param {string} listId
 */
export const deleteCustomList = async (userId, listId) => {
  try {
    if (!userId || !listId) throw new Error('Dados incompletos para excluir lista.');

    const listDocRef = doc(db, 'users', userId, 'custom_lists', listId);
    await deleteDoc(listDocRef);

    // Desvincula os filmes que estavam marcados nesta lista
    const watchedRef = getWatchedMoviesRef(userId);
    const snap = await getDocs(watchedRef);
    const batch = writeBatch(db);
    let count = 0;

    snap.forEach((docSnap) => {
      const data = docSnap.data();
      if (Array.isArray(data.listIds) && data.listIds.includes(listId)) {
        const updatedListIds = data.listIds.filter((id) => id !== listId);
        batch.update(docSnap.ref, { listIds: updatedListIds });
        count++;
      }
    });

    if (count > 0) {
      await batch.commit();
    }

    return { success: true };
  } catch (error) {
    console.error('Erro ao excluir lista:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Escuta em tempo real as listas customizadas do usuário
 * @param {string} userId
 * @param {function} onUpdate
 */
export const subscribeCustomLists = (userId, onUpdate) => {
  if (!userId) return () => {};

  const listsRef = getCustomListsRef(userId);

  return onSnapshot(
    listsRef,
    (snapshot) => {
      const lists = [];
      snapshot.forEach((docSnap) => {
        lists.push(docSnap.data());
      });
      onUpdate(lists);
    },
    (error) => {
      console.warn('Listener de listas customizadas:', error);
      onUpdate([]);
    }
  );
};

/**
 * Busca todos os filmes assistidos do usuário (Passo A)
 * @param {string} userId
 * @returns {Promise<Array>}
 */
export const getWatchedMovies = async (userId) => {
  try {
    const watchedRef = getWatchedMoviesRef(userId);
    const snapshot = await getDocs(watchedRef);
    const movies = [];
    snapshot.forEach((docSnap) => {
      movies.push(docSnap.data());
    });
    return { movies, error: null };
  } catch (error) {
    console.error('Erro ao buscar filmes assistidos:', error);
    return { movies: [], error: error.message };
  }
};

/**
 * Escuta em tempo real atualizações na subcoleção 'watched_movies'
 * @param {string} userId
 * @param {function} onUpdate - Callback com lista de filmes atualizada
 * @returns {function} unsubscribe
 */
export const subscribeWatchedMovies = (userId, onUpdate) => {
  if (!userId) return () => {};

  const watchedRef = getWatchedMoviesRef(userId);
  return onSnapshot(
    watchedRef,
    (snapshot) => {
      const movies = [];
      snapshot.forEach((docSnap) => {
        movies.push(docSnap.data());
      });
      onUpdate(movies);
    },
    (error) => {
      console.error('Erro no listener de filmes assistidos:', error);
      onUpdate([]);
    }
  );
};

// ─── Watchlist (Quero Assistir) ────────────────────────────────────────────

/**
 * Retorna a referência da subcoleção 'watchlist' do usuário
 * Estrutura: users/{userId}/watchlist
 */
export const getWatchlistRef = (userId) => {
  if (!userId) throw new Error('UserId é obrigatório para acessar o Firestore.');
  return collection(db, 'users', userId, 'watchlist');
};

/**
 * Adiciona um filme à watchlist (Quero Assistir) do usuário
 * @param {string} userId
 * @param {object} movie - Dados do filme da TMDb
 */
export const addToWatchlist = async (userId, movie) => {
  try {
    if (!userId || !movie?.id) throw new Error('Dados incompletos para salvar na watchlist.');

    const docRef = doc(db, 'users', userId, 'watchlist', String(movie.id));
    const data = {
      id: Number(movie.id),
      title: movie.title || movie.name || 'Sem título',
      poster_path: movie.poster_path || null,
      genre_ids: Array.isArray(movie.genre_ids)
        ? movie.genre_ids
        : (movie.genres ? movie.genres.map((g) => g.id) : []),
      vote_average: Number(movie.vote_average) || 0,
      release_date: movie.release_date || '',
      overview: movie.overview || '',
      addedAt: serverTimestamp(),
    };

    await setDoc(docRef, data, { merge: true });
    return { success: true, data };
  } catch (error) {
    console.error('Erro ao adicionar à watchlist:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Remove um filme da watchlist do usuário
 * @param {string} userId
 * @param {number|string} movieId
 */
export const removeFromWatchlist = async (userId, movieId) => {
  try {
    const docRef = doc(db, 'users', userId, 'watchlist', String(movieId));
    await deleteDoc(docRef);
    return { success: true };
  } catch (error) {
    console.error('Erro ao remover da watchlist:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Escuta em tempo real a watchlist do usuário
 * @param {string} userId
 * @param {function} onUpdate
 * @returns {function} unsubscribe
 */
export const subscribeWatchlist = (userId, onUpdate) => {
  if (!userId) return () => {};

  const watchlistRef = getWatchlistRef(userId);
  return onSnapshot(
    query(watchlistRef, orderBy('addedAt', 'desc')),
    (snapshot) => {
      const movies = [];
      snapshot.forEach((docSnap) => movies.push(docSnap.data()));
      onUpdate(movies);
    },
    (error) => {
      console.warn('Listener da watchlist:', error);
      onUpdate([]);
    }
  );
};
