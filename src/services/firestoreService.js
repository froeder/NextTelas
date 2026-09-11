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
} from 'firebase/firestore';
import { db } from './firebaseConfig';

/**
 * Retorna a referência da subcoleção 'watched_movies' do usuário
 * Estrutura: users/{userId}/watched_movies
 */
export const getWatchedMoviesRef = (userId) => {
  if (!userId) throw new Error('UserId é obrigatório para acessar o Firestore.');
  return collection(db, 'users', userId, 'watched_movies');
};

/**
 * Salva um filme na subcoleção 'watched_movies' do usuário
 * @param {string} userId - ID do usuário logado
 * @param {object} movie - Dados do filme vindo da TMDb
 */
export const addWatchedMovie = async (userId, movie) => {
  try {
    if (!userId || !movie || !movie.id) {
      throw new Error('Dados incompletos para salvar filme.');
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
