/**
 * =====================================================================
 * SERVIÇO DA TMDb API (The Movie Database)
 * =====================================================================
 * 
 * 📌 ONDE INSERIR SEU TOKEN / API KEY DA TMDb:
 * 
 * 1. Crie uma conta gratuita em https://www.themoviedb.org/
 * 2. Vá em Configurações > API (https://www.themoviedb.org/settings/api)
 * 3. Copie sua "Chave da API (v3 auth)" OU seu "Token de Leitura da API (v4 auth)"
 * 4. Insira a chave abaixo na constante TMDB_API_KEY ou configure
 *    no arquivo .env: EXPO_PUBLIC_TMDB_API_KEY=sua_chave_aqui
 * =====================================================================
 */

const getTmdbKey = () => {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_TMDB_API_KEY) {
    return import.meta.env.VITE_TMDB_API_KEY;
  }
  if (typeof process !== 'undefined' && process.env && process.env.EXPO_PUBLIC_TMDB_API_KEY) {
    return process.env.EXPO_PUBLIC_TMDB_API_KEY;
  }
  return 'INSIRA_SEU_TMDB_TOKEN_OU_API_KEY_AQUI';
};

export const TMDB_API_KEY = getTmdbKey();

const BASE_URL = 'https://api.themoviedb.org/3';
export const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

/**
 * Monta os headers e query params adequados para v3 (api_key) ou v4 (Bearer token)
 */
const buildRequestConfig = (endpoint, params = {}) => {
  const url = new URL(`${BASE_URL}${endpoint}`);
  const isBearer = TMDB_API_KEY.startsWith('ey'); // JWT Token v4

  const headers = {
    Accept: 'application/json',
  };

  if (isBearer) {
    headers['Authorization'] = `Bearer ${TMDB_API_KEY}`;
  } else {
    url.searchParams.append('api_key', TMDB_API_KEY);
  }

  // Sempre garantir language=pt-BR conforme requisito
  url.searchParams.append('language', 'pt-BR');

  // Adiciona parâmetros adicionais
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.append(key, value);
    }
  });

  return { url: url.toString(), headers };
};

/**
 * Helper para realizar a requisição HTTP com tratamento de erros
 */
const fetchTmdb = async (endpoint, params = {}) => {
  try {
    if (!TMDB_API_KEY || TMDB_API_KEY.includes('INSIRA_SEU_TMDB')) {
      console.warn('TMDb API Key não configurada. Configure TMDB_API_KEY em tmdbService.js ou .env');
    }

    const { url, headers } = buildRequestConfig(endpoint, params);
    const response = await fetch(url, { headers });

    if (!response.ok) {
      throw new Error(`Erro TMDb [${response.status}]: ${response.statusText}`);
    }

    const data = await response.json();
    return { data, error: null };
  } catch (error) {
    console.error(`Erro ao consultar endpoint TMDb (${endpoint}):`, error);
    return { data: null, error: error.message };
  }
};

/**
 * Constrói a URL completa para a imagem do poster
 * Requisito: https://image.tmdb.org/t/p/w500 + movie.poster_path
 * @param {string} posterPath
 * @returns {string|null}
 */
export const getMoviePosterUrl = (posterPath) => {
  if (!posterPath) return null;
  if (posterPath.startsWith('http')) return posterPath;
  return `${TMDB_IMAGE_BASE_URL}${posterPath}`;
};

/**
 * 1. TELA DE BUSCA:
 * Consome o endpoint /search/movie com language=pt-BR
 * @param {string} query - Termo de busca digitado pelo usuário
 * @param {number} page - Número da página
 */
export const searchMovies = async (query, page = 1) => {
  if (!query || query.trim() === '') {
    return { results: [], total_pages: 0, error: null };
  }

  const { data, error } = await fetchTmdb('/search/movie', {
    query: query.trim(),
    page,
    include_adult: 'false',
  });

  if (error || !data) {
    return { results: [], total_pages: 0, error };
  }

  return {
    results: data.results || [],
    total_pages: data.total_pages || 1,
    total_results: data.total_results || 0,
    error: null,
  };
};

/**
 * 2. PASSO C (Descoberta):
 * Consome o endpoint /discover/movie com os gêneros mais frequentes
 * @param {number[]} genreIds - Array com os 2 ou 3 principais IDs de gênero
 * @param {number} page - Página para paginação
 */
export const discoverMoviesByGenres = async (genreIds = [], page = 1) => {
  if (!Array.isArray(genreIds) || genreIds.length === 0) {
    // Se não há gêneros especificados, busca os mais populares em alta
    return getTrendingOrPopularMovies(page);
  }

  // Usa pipe '|' para buscar filmes que pertençam a QUALQUER UM dos gêneros favoritos do usuário,
  // garantindo uma descoberta rica e variada
  const withGenresParam = genreIds.join('|');

  const { data, error } = await fetchTmdb('/discover/movie', {
    with_genres: withGenresParam,
    sort_by: 'popularity.desc',
    include_adult: 'false',
    page,
  });

  if (error || !data) {
    return { results: [], error };
  }

  return {
    results: data.results || [],
    total_pages: data.total_pages || 1,
    error: null,
  };
};

/**
 * Filmes populares em alta (Fallback / Descoberta Inicial quando sem histórico)
 */
export const getTrendingOrPopularMovies = async (page = 1) => {
  const { data, error } = await fetchTmdb('/movie/popular', {
    page,
  });

  if (error || !data) {
    return { results: [], error };
  }

  return {
    results: data.results || [],
    total_pages: data.total_pages || 1,
    error: null,
  };
};
