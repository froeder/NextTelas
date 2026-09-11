import { getGenreNameById } from './tmdbGenres.js';

/**
 * PASSO B (Padrões):
 * Analisa a lista de filmes assistidos pelo usuário, conta a frequência
 * de cada gênero e retorna os IDs dos 2 ou 3 gêneros mais recorrentes.
 * 
 * @param {Array} watchedMovies - Lista de filmes recuperados do Firestore
 * @param {number} limit - Quantidade de gêneros principais a retornar (padrão: 3)
 * @returns {{ topGenreIds: number[], topGenresDetails: Array<{ id: number, name: string, count: number }>, totalWatched: number }}
 */
export const extractTopGenres = (watchedMovies = [], limit = 3) => {
  if (!Array.isArray(watchedMovies) || watchedMovies.length === 0) {
    return {
      topGenreIds: [],
      topGenresDetails: [],
      totalWatched: 0,
    };
  }

  // Mapa de frequência dos IDs de gênero
  const frequencyMap = {};

  watchedMovies.forEach((movie) => {
    if (Array.isArray(movie.genre_ids)) {
      movie.genre_ids.forEach((genreId) => {
        const id = Number(genreId);
        if (!isNaN(id) && id > 0) {
          frequencyMap[id] = (frequencyMap[id] || 0) + 1;
        }
      });
    }
  });

  // Converte o mapa em lista e ordena decrescente pela contagem
  const sortedGenres = Object.entries(frequencyMap)
    .map(([idStr, count]) => ({
      id: Number(idStr),
      name: getGenreNameById(Number(idStr)),
      count: count,
    }))
    .sort((a, b) => b.count - a.count);

  // Seleciona os 'limit' principais (ex: 2 a 3)
  const topGenresDetails = sortedGenres.slice(0, limit);
  const topGenreIds = topGenresDetails.map((item) => item.id);

  return {
    topGenreIds,
    topGenresDetails,
    totalWatched: watchedMovies.length,
  };
};

/**
 * PASSO D (Filtro):
 * Remove da lista de recomendações os filmes que o usuário já salvou como assistidos.
 * 
 * @param {Array} recommendedMovies - Lista de filmes retornados da TMDb (/discover/movie)
 * @param {Array} watchedMovies - Lista de filmes já assistidos salvos no Firestore
 * @returns {Array} Filmes recomendados e ainda não assistidos
 */
export const filterAlreadyWatchedMovies = (recommendedMovies = [], watchedMovies = []) => {
  if (!Array.isArray(recommendedMovies)) return [];
  if (!Array.isArray(watchedMovies) || watchedMovies.length === 0) {
    return recommendedMovies;
  }

  // Cria um Set com os IDs dos filmes assistidos para verificação O(1)
  const watchedIdsSet = new Set(
    watchedMovies.map((movie) => String(movie.id))
  );

  return recommendedMovies.filter(
    (movie) => !watchedIdsSet.has(String(movie.id))
  );
};
