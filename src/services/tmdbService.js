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
export const TMDB_BACKDROP_BASE_URL = 'https://image.tmdb.org/t/p/w780';

export const getMovieBackdropUrl = (backdropPath) => {
  if (!backdropPath) return null;
  if (backdropPath.startsWith('http')) return backdropPath;
  return `${TMDB_BACKDROP_BASE_URL}${backdropPath}`;
};

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

/**
 * Converte minutos para o formato amigável cinematográfico (ex: 148 -> '2h 28m')
 * @param {number} minutes
 * @returns {string|null}
 */
export const formatRuntime = (minutes) => {
  if (!minutes || minutes <= 0) return null;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  if (hours > 0 && remaining > 0) return `${hours}h ${remaining}m`;
  if (hours > 0) return `${hours}h`;
  return `${remaining}m`;
};

// Cache em memória para os detalhes de filmes para resposta instantânea
const movieDetailsCache = new Map();

/**
 * Consulta os detalhes completos de um filme (duração/runtime, sinopse detalhada, elenco e trailer)
 * @param {number|string} movieId
 * @returns {Promise<{data: object|null, error: string|null}>}
 */
export const getMovieDetails = async (movieId) => {
  if (!movieId) return { data: null, error: 'ID do filme é obrigatório.' };

  const idKey = String(movieId);
  if (movieDetailsCache.has(idKey)) {
    return { data: movieDetailsCache.get(idKey), error: null };
  }

  const { data, error } = await fetchTmdb(`/movie/${movieId}`, {
    append_to_response: 'credits,videos',
  });

  if (error || !data) {
    return { data: null, error };
  }

  movieDetailsCache.set(idKey, data);
  return { data, error: null };
};

/**
 * Busca filmes recomendados pela TMDb baseados em um filme específico
 * Endpoint: /movie/{movie_id}/recommendations
 * @param {number|string} movieId
 * @param {number} page
 * @returns {Promise<{results: Array, error: string|null}>}
 */
export const getMovieRecommendations = async (movieId, page = 1) => {
  if (!movieId) return { results: [], error: 'ID do filme é obrigatório.' };

  const { data, error } = await fetchTmdb(`/movie/${movieId}/recommendations`, { page });

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
 * Verifica se a data de lançamento de um filme pertence a uma determinada década
 * @param {string} releaseDate - ex: '1985-07-03'
 * @param {string} decadeKey - ex: '80s', '90s', '≤ 70s', '2000s', '2010s', '2020s'
 * @returns {boolean}
 */
export const isMovieInDecade = (releaseDate, decadeKey) => {
  if (!releaseDate) return false;
  const year = parseInt(releaseDate.substring(0, 4), 10);
  if (isNaN(year)) return false;

  switch (decadeKey) {
    case '≤ 70s':
      return year <= 1979;
    case '80s':
      return year >= 1980 && year <= 1989;
    case '90s':
      return year >= 1990 && year <= 1999;
    case '2000s':
      return year >= 2000 && year <= 2009;
    case '2010s':
      return year >= 2010 && year <= 2019;
    case '2020s':
      return year >= 2020 && year <= 2029;
    default:
      return false;
  }
};

/**
 * Busca filmes da TMDb filtrados por era/década
 * @param {string} decadeKey - ex: '80s', '90s', etc.
 * @param {number[]} genreIds - array de IDs de gênero para filtrar
 * @param {number} page
 */
export const discoverMoviesByEra = async (decadeKey, genreIds = [], page = 1) => {
  let gte = '1900-01-01';
  let lte = '2029-12-31';

  if (decadeKey === '≤ 70s') {
    gte = '1900-01-01';
    lte = '1979-12-31';
  } else if (decadeKey === '80s') {
    gte = '1980-01-01';
    lte = '1989-12-31';
  } else if (decadeKey === '90s') {
    gte = '1990-01-01';
    lte = '1999-12-31';
  } else if (decadeKey === '2000s') {
    gte = '2000-01-01';
    lte = '2009-12-31';
  } else if (decadeKey === '2010s') {
    gte = '2010-01-01';
    lte = '2019-12-31';
  } else if (decadeKey === '2020s') {
    gte = '2020-01-01';
    lte = '2029-12-31';
  }

  const params = {
    'primary_release_date.gte': gte,
    'primary_release_date.lte': lte,
    sort_by: 'popularity.desc',
    include_adult: 'false',
    page,
  };

  if (Array.isArray(genreIds) && genreIds.length > 0) {
    params.with_genres = genreIds.join('|');
  }

  const { data, error } = await fetchTmdb('/discover/movie', params);

  if (error || !data) {
    return { results: [], error };
  }

  const filteredResults = (data.results || []).filter((m) =>
    isMovieInDecade(m.release_date, decadeKey)
  );

  return {
    results: filteredResults,
    total_pages: data.total_pages || 1,
    error: null,
  };
};

