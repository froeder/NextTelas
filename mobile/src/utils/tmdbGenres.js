// Mapeamento oficial de IDs de gêneros da TMDb para nomes em Português (pt-BR)
export const TMDB_GENRES = {
  28: 'Ação',
  12: 'Aventura',
  16: 'Animação',
  35: 'Comédia',
  80: 'Crime',
  99: 'Documentário',
  18: 'Drama',
  10751: 'Família',
  14: 'Fantasia',
  36: 'História',
  27: 'Terror',
  10402: 'Música',
  9648: 'Mistério',
  10749: 'Romance',
  878: 'Ficção Científica',
  10770: 'Cinema TV',
  53: 'Thriller',
  10752: 'Guerra',
  37: 'Faroeste',
};

/**
 * Retorna o nome em português de um gênero pelo seu ID
 * @param {number} genreId 
 * @returns {string}
 */
export const getGenreNameById = (genreId) => {
  return TMDB_GENRES[genreId] || 'Outro';
};

/**
 * Retorna uma lista com os nomes dos gêneros correspondentes a um array de IDs
 * @param {number[]} genreIds 
 * @returns {string[]}
 */
export const getGenreNames = (genreIds = []) => {
  return (genreIds || [])
    .map(id => TMDB_GENRES[id])
    .filter(Boolean);
};
