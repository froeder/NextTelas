/**
 * SERVIÇO DA TMDb API (The Movie Database) - EXPO MOBILE
 */

const getTmdbKey = () => {
  if (typeof process !== 'undefined' && process.env && process.env.EXPO_PUBLIC_TMDB_API_KEY) {
    return process.env.EXPO_PUBLIC_TMDB_API_KEY;
  }
  if (typeof process !== 'undefined' && process.env && process.env.VITE_TMDB_API_KEY) {
    return process.env.VITE_TMDB_API_KEY;
  }
  return '9977c30244b446cc40c2f1b98154e04d';
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
  const headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  };

  if (TMDB_API_KEY && TMDB_API_KEY.length > 50) {
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
      console.warn('TMDb API Key não configurada. Configure EXPO_PUBLIC_TMDB_API_KEY no .env');
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
 */
export const getMoviePosterUrl = (posterPath) => {
  if (!posterPath) return null;
  if (posterPath.startsWith('http')) return posterPath;
  return `${TMDB_IMAGE_BASE_URL}${posterPath}`;
};

/**
 * Consome o endpoint /search/movie com language=pt-BR
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
 * Consome o endpoint /discover/movie com os gêneros mais frequentes
 */
export const discoverMoviesByGenres = async (genreIds = [], page = 1) => {
  if (!Array.isArray(genreIds) || genreIds.length === 0) {
    return getTrendingOrPopularMovies(page);
  }

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
 * Filmes populares em alta
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
 */
export const formatRuntime = (minutes) => {
  if (!minutes || minutes <= 0) return null;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  if (hours > 0 && remaining > 0) return `${hours}h ${remaining}m`;
  if (hours > 0) return `${hours}h`;
  return `${remaining}m`;
};

const movieDetailsCache = new Map();

/**
 * Consulta os detalhes completos de um filme
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
 * Recomendações baseadas em um filme específico
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
 * Verifica década de lançamento
 */
export const isMovieInDecade = (releaseDate, decadeKey) => {
  if (!releaseDate || !decadeKey) return false;
  const year = parseInt(String(releaseDate).substring(0, 4), 10);
  if (isNaN(year)) return false;

  const key = String(decadeKey).trim();

  if (key.includes('70') || key.includes('≤')) {
    return year <= 1979;
  }
  if (key.includes('80')) {
    return year >= 1980 && year <= 1989;
  }
  if (key.includes('90')) {
    return year >= 1990 && year <= 1999;
  }
  if (key.includes('2000')) {
    return year >= 2000 && year <= 2009;
  }
  if (key.includes('2010')) {
    return year >= 2010 && year <= 2019;
  }
  if (key.includes('2020')) {
    return year >= 2020 && year <= 2029;
  }

  return true;
};

/**
 * Filmes da TMDb por década
 */
export const discoverMoviesByEra = async (decadeKey, genreIds = [], page = 1) => {
  let gte = '1900-01-01';
  let lte = '2029-12-31';

  const key = String(decadeKey || '').trim();

  if (key.includes('70') || key.includes('≤')) {
    gte = '1900-01-01';
    lte = '1979-12-31';
  } else if (key.includes('80')) {
    gte = '1980-01-01';
    lte = '1989-12-31';
  } else if (key.includes('90')) {
    gte = '1990-01-01';
    lte = '1999-12-31';
  } else if (key.includes('2000')) {
    gte = '2000-01-01';
    lte = '2009-12-31';
  } else if (key.includes('2010')) {
    gte = '2010-01-01';
    lte = '2019-12-31';
  } else if (key.includes('2020')) {
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
