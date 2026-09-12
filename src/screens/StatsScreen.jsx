import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Icon } from '../components/Icon';
import { theme } from '../utils/theme';
import { extractTopGenres } from '../utils/genreExtractor';
import { getGenreNameById } from '../utils/tmdbGenres';
import { EraRecommendationsSection } from '../components/EraRecommendationsSection';

export const StatsScreen = ({
  watchedMovies = [],
  watchlist = [],
  customLists = [],
  onNavigateToSearch,
  onNavigateToRecommendations,
  onAddWatched,
  onAddToWatchlist,
  onRemoveFromWatchlist,
}) => {
  // Lista ativa para filtrar as estatísticas ('all' ou id da lista)
  const [selectedListId, setSelectedListId] = useState('all');

  // Década selecionada para exibir a seção inline de recomendações (collapse/expand)
  const [selectedDecadeEra, setSelectedDecadeEra] = useState(null);

  const handleToggleDecadeEra = (decade) => {
    setSelectedDecadeEra((prev) => (prev === decade ? null : decade));
  };

  // Filtra filmes com base na lista selecionada
  const filteredMovies = (selectedListId === 'all'
    ? watchedMovies
    : watchedMovies.filter(
        (m) => Array.isArray(m.listIds) && m.listIds.includes(selectedListId)
      )
  );

  const totalWatched = filteredMovies.length;
  const watchlistCount = watchlist.length;

  // --- CÁLCULO DE TEMPO TOTAL E MÉDIAS ---
  const totalMinutes = filteredMovies.reduce((acc, m) => {
    const r = Number(m.runtime);
    return acc + (r > 0 ? r : 110); // Fallback padrão de 110min se não houver runtime
  }, 0);

  const totalDays = Math.floor(totalMinutes / (60 * 24));
  const totalHours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const totalHoursAbsolute = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;

  const averageRuntime = totalWatched > 0 ? Math.round(totalMinutes / totalWatched) : 0;

  // Equivalências divertidas
  const flightsEquiv = Math.round((totalMinutes / 600) * 10) / 10; // Voos de 10h
  const soccerMatchesEquiv = Math.round(totalMinutes / 90); // Partidas de 90min

  // --- CÁLCULO DE NÍVEL DO CINÉFILO ---
  const getCinephileLevel = (hours) => {
    if (hours === 0) return { title: 'Novo Espectador', badge: '🍿', color: '#9AA0B4', level: 0 };
    if (hours < 10) return { title: 'Cinéfilo Curioso', badge: '🎬', color: '#60A5FA', level: 1 };
    if (hours < 25) return { title: 'Entusiasta de Cinema', badge: '🌟', color: '#34D399', level: 2 };
    if (hours < 60) return { title: 'Maratonista de Elite', badge: '🏆', color: '#FBBF24', level: 3 };
    if (hours < 120) return { title: 'Mestre da Sétima Arte', badge: '💎', color: '#A78BFA', level: 4 };
    return { title: 'Lenda do Cinema', badge: '👑', color: '#EC4899', level: 5 };
  };

  const levelInfo = getCinephileLevel(totalHoursAbsolute);

  // --- CÁLCULO DE MÉDIA DE AVALIAÇÃO ---
  const moviesWithRating = filteredMovies.filter((m) => Number(m.vote_average) > 0);
  const averageRating = moviesWithRating.length > 0
    ? (moviesWithRating.reduce((acc, m) => acc + Number(m.vote_average), 0) / moviesWithRating.length).toFixed(1)
    : '0.0';

  // --- DISTRIBUIÇÃO POR FAICHAS DE NOTAS ---
  const ratingTiers = {
    masterpiece: filteredMovies.filter((m) => Number(m.vote_average) >= 8.0).length,
    great: filteredMovies.filter((m) => Number(m.vote_average) >= 7.0 && Number(m.vote_average) < 8.0).length,
    good: filteredMovies.filter((m) => Number(m.vote_average) >= 5.0 && Number(m.vote_average) < 7.0).length,
    low: filteredMovies.filter((m) => Number(m.vote_average) > 0 && Number(m.vote_average) < 5.0).length,
  };

  // --- DISTRIBUIÇÃO DE GÊNEROS ---
  const { topGenresDetails } = extractTopGenres(filteredMovies, 8);
  const totalGenreCount = topGenresDetails.reduce((acc, g) => acc + g.count, 0);

  // --- DISTRIBUIÇÃO POR DÉCADAS E FILMES EXTREMOS ---
  let oldestMovie = null;
  let newestMovie = null;
  let longestMovie = null;
  let highestRatedMovie = null;

  const decadeCounts = {};

  filteredMovies.forEach((m) => {
    // Duração
    const runtimeVal = Number(m.runtime) || 110;
    if (!longestMovie || runtimeVal > (Number(longestMovie.runtime) || 110)) {
      longestMovie = m;
    }

    // Maior nota
    const ratingVal = Number(m.vote_average) || 0;
    if (!highestRatedMovie || ratingVal > (Number(highestRatedMovie.vote_average) || 0)) {
      highestRatedMovie = m;
    }

    // Décadas
    if (m.release_date) {
      const year = parseInt(m.release_date.substring(0, 4), 10);
      if (!isNaN(year)) {
        if (!oldestMovie || year < parseInt(oldestMovie.release_date.substring(0, 4), 10)) {
          oldestMovie = m;
        }
        if (!newestMovie || year > parseInt(newestMovie.release_date.substring(0, 4), 10)) {
          newestMovie = m;
        }

        let decadeKey = 'Outros';
        if (year < 1980) decadeKey = '≤ 70s';
        else if (year < 1990) decadeKey = '80s';
        else if (year < 2000) decadeKey = '90s';
        else if (year < 2010) decadeKey = '2000s';
        else if (year < 2020) decadeKey = '2010s';
        else decadeKey = '2020s';

        decadeCounts[decadeKey] = (decadeCounts[decadeKey] || 0) + 1;
      }
    }
  });

  const sortedDecades = Object.entries(decadeCounts).sort((a, b) => b[1] - a[1]);

  // Taxa de conclusão (assistidos vs fila)
  const totalCatalog = totalWatched + watchlistCount;
  const completionPercentage = totalCatalog > 0 ? Math.round((totalWatched / totalCatalog) * 100) : 0;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* SELETOR DE LISTAS PARA ESTATÍSTICAS */}
        <View style={styles.filterSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            <TouchableOpacity
              style={[styles.filterChip, selectedListId === 'all' && styles.filterChipActive]}
              onPress={() => setSelectedListId('all')}
              activeOpacity={0.7}
            >
              <Icon
                name="film"
                size={14}
                color={selectedListId === 'all' ? '#FFF' : theme.colors.textMuted}
              />
              <Text style={[styles.filterChipText, selectedListId === 'all' && styles.filterChipTextActive]}>
                Todos ({watchedMovies.length})
              </Text>
            </TouchableOpacity>

            {customLists.map((list) => {
              const countInList = watchedMovies.filter(
                (m) => Array.isArray(m.listIds) && m.listIds.includes(list.id)
              ).length;
              const isActive = selectedListId === list.id;

              return (
                <TouchableOpacity
                  key={list.id}
                  style={[styles.filterChip, isActive && styles.filterChipActive]}
                  onPress={() => setSelectedListId(list.id)}
                  activeOpacity={0.7}
                >
                  <Icon
                    name={list.icon || 'film'}
                    size={14}
                    color={isActive ? '#FFF' : theme.colors.textMuted}
                  />
                  <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                    {list.name} ({countInList})
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ESTADO VAZIO */}
        {totalWatched === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Icon name="analytics" size={42} color={theme.colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>Nenhuma estatística ainda</Text>
            <Text style={styles.emptySubtitle}>
              {selectedListId === 'all'
                ? 'Marque os filmes que você já assistiu para desbloquear gráficos, horas acumuladas, gêneros favoritos e análises de cinéfilo!'
                : 'Esta lista ainda não possui filmes registrados como assistidos.'}
            </Text>

            <View style={styles.emptyActionButtons}>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={onNavigateToSearch}
                activeOpacity={0.8}
              >
                <Icon name="search" size={18} color="#FFF" />
                <Text style={styles.primaryButtonText}>Buscar Filmes</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={onNavigateToRecommendations}
                activeOpacity={0.8}
              >
                <Icon name="sparkles" size={18} color={theme.colors.primary} />
                <Text style={styles.secondaryButtonText}>Ver Recomendações</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            {/* BANNER DO PERFIL DE CINÉFILO */}
            <View style={styles.heroCard}>
              <View style={styles.heroTopRow}>
                <View style={styles.badgeContainer}>
                  <Text style={styles.badgeEmoji}>{levelInfo.badge}</Text>
                </View>
                <View style={styles.heroTextWrapper}>
                  <Text style={styles.heroSubtitle}>SEU PERFIL CINEMATOGRÁFICO</Text>
                  <Text style={[styles.heroTitle, { color: levelInfo.color }]}>
                    {levelInfo.title}
                  </Text>
                </View>
              </View>

              <View style={styles.heroStatsRow}>
                {/* Tempo Total */}
                <View style={styles.heroStatItem}>
                  <Icon name="clock" size={20} color={theme.colors.primary} />
                  <Text style={styles.heroStatValue}>
                    {totalDays > 0 ? `${totalDays}d ${totalHours}h` : `${totalHoursAbsolute}h ${remainingMinutes}m`}
                  </Text>
                  <Text style={styles.heroStatLabel}>Tempo em Telas</Text>
                </View>

                <View style={styles.heroStatDivider} />

                {/* Total Assistidos */}
                <View style={styles.heroStatItem}>
                  <Icon name="film" size={20} color={theme.colors.accent} />
                  <Text style={styles.heroStatValue}>{totalWatched}</Text>
                  <Text style={styles.heroStatLabel}>Filmes Assistidos</Text>
                </View>

                <View style={styles.heroStatDivider} />

                {/* Média de Nota */}
                <View style={styles.heroStatItem}>
                  <Icon name="star" size={20} color={theme.colors.accent} />
                  <Text style={styles.heroStatValue}>{averageRating}</Text>
                  <Text style={styles.heroStatLabel}>Média TMDb</Text>
                </View>
              </View>

              {/* Curiosidade / Equivalência */}
              {totalMinutes > 0 && (
                <View style={styles.funFactBox}>
                  <Icon name="zap" size={15} color={theme.colors.accent} />
                  <Text style={styles.funFactText}>
                    Seu tempo de cinema equivale a <Text style={styles.boldText}>{soccerMatchesEquiv} partidas de futebol</Text> ou <Text style={styles.boldText}>{flightsEquiv} voos continentais</Text>!
                  </Text>
                </View>
              )}
            </View>

            {/* GRID DE MÉTRICAS RÁPIDAS */}
            <View style={styles.gridContainer}>
              {/* Card: Duração Média */}
              <View style={styles.metricCard}>
                <View style={styles.metricHeader}>
                  <View style={[styles.iconCircle, { backgroundColor: 'rgba(229, 9, 20, 0.15)' }]}>
                    <Icon name="time-outline" size={18} color={theme.colors.primary} />
                  </View>
                  <Text style={styles.metricLabel}>Duração Média</Text>
                </View>
                <Text style={styles.metricNumber}>{averageRuntime} <Text style={styles.metricUnit}>min</Text></Text>
                <Text style={styles.metricSubtext}>Duração média por filme</Text>
              </View>

              {/* Card: Progresso de Catalogo */}
              <View style={styles.metricCard}>
                <View style={styles.metricHeader}>
                  <View style={[styles.iconCircle, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                    <Icon name="checkmark-circle" size={18} color={theme.colors.success} />
                  </View>
                  <Text style={styles.metricLabel}>Fila de Espera</Text>
                </View>
                <Text style={styles.metricNumber}>{watchlistCount} <Text style={styles.metricUnit}>para ver</Text></Text>
                <Text style={styles.metricSubtext}>{completionPercentage}% do catálogo assistido</Text>
              </View>
            </View>

            {/* GÊNEROS MAIS ASSISTIDOS */}
            {topGenresDetails.length > 0 && (
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionTitleRow}>
                    <Icon name="flame" size={20} color={theme.colors.primary} />
                    <Text style={styles.sectionTitle}>Gêneros Predominantes</Text>
                  </View>
                  <Text style={styles.sectionBadge}>Top {topGenresDetails.length}</Text>
                </View>

                <View style={styles.genreList}>
                  {topGenresDetails.map((genre, idx) => {
                    const percentage = totalGenreCount > 0 ? Math.round((genre.count / totalGenreCount) * 100) : 0;

                    return (
                      <View key={genre.id} style={styles.genreItem}>
                        <View style={styles.genreInfoRow}>
                          <View style={styles.genreNameWrapper}>
                            <Text style={styles.genreRank}>#{idx + 1}</Text>
                            <Text style={styles.genreName}>{genre.name}</Text>
                            {idx === 0 && (
                              <View style={styles.favoriteTag}>
                                <Text style={styles.favoriteTagText}>Favorito 👑</Text>
                              </View>
                            )}
                          </View>
                          <Text style={styles.genreCountText}>
                            {genre.count} {genre.count === 1 ? 'filme' : 'filmes'} ({percentage}%)
                          </Text>
                        </View>

                        {/* Barra de Progresso */}
                        <View style={styles.progressBarBg}>
                          <View
                            style={[
                              styles.progressBarFill,
                              {
                                width: `${Math.max(percentage, 6)}%`,
                                backgroundColor: idx === 0 ? theme.colors.primary : idx === 1 ? theme.colors.accent : '#4F46E5',
                              },
                            ]}
                          />
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {/* QUALIDADE DAS NOTAS (TMDb RATINGS DISTRIBUTION) */}
            {moviesWithRating.length > 0 && (
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionTitleRow}>
                    <Icon name="star" size={20} color={theme.colors.accent} />
                    <Text style={styles.sectionTitle}>Qualidade da sua Coleção</Text>
                  </View>
                  <Text style={styles.sectionBadge}>Notas TMDb</Text>
                </View>

                <View style={styles.ratingTiersContainer}>
                  {/* 8.0 - 10.0 */}
                  <View style={styles.tierRow}>
                    <View style={styles.tierLabelCol}>
                      <Text style={styles.tierEmoji}>🌟</Text>
                      <Text style={styles.tierName}>Obras-Primas (8.0+)</Text>
                    </View>
                    <View style={styles.tierBarCol}>
                      <View style={styles.progressBarBg}>
                        <View
                          style={[
                            styles.progressBarFill,
                            {
                              width: `${totalWatched > 0 ? (ratingTiers.masterpiece / totalWatched) * 100 : 0}%`,
                              backgroundColor: '#FBBF24',
                            },
                          ]}
                        />
                      </View>
                    </View>
                    <Text style={styles.tierCountText}>{ratingTiers.masterpiece}</Text>
                  </View>

                  {/* 7.0 - 7.9 */}
                  <View style={styles.tierRow}>
                    <View style={styles.tierLabelCol}>
                      <Text style={styles.tierEmoji}>👍</Text>
                      <Text style={styles.tierName}>Muito Bons (7.0 - 7.9)</Text>
                    </View>
                    <View style={styles.tierBarCol}>
                      <View style={styles.progressBarBg}>
                        <View
                          style={[
                            styles.progressBarFill,
                            {
                              width: `${totalWatched > 0 ? (ratingTiers.great / totalWatched) * 100 : 0}%`,
                              backgroundColor: '#10B981',
                            },
                          ]}
                        />
                      </View>
                    </View>
                    <Text style={styles.tierCountText}>{ratingTiers.great}</Text>
                  </View>

                  {/* 5.0 - 6.9 */}
                  <View style={styles.tierRow}>
                    <View style={styles.tierLabelCol}>
                      <Text style={styles.tierEmoji}>🍿</Text>
                      <Text style={styles.tierName}>Bons / Medianos (5.0 - 6.9)</Text>
                    </View>
                    <View style={styles.tierBarCol}>
                      <View style={styles.progressBarBg}>
                        <View
                          style={[
                            styles.progressBarFill,
                            {
                              width: `${totalWatched > 0 ? (ratingTiers.good / totalWatched) * 100 : 0}%`,
                              backgroundColor: '#60A5FA',
                            },
                          ]}
                        />
                      </View>
                    </View>
                    <Text style={styles.tierCountText}>{ratingTiers.good}</Text>
                  </View>

                  {/* < 5.0 */}
                  {ratingTiers.low > 0 && (
                    <View style={styles.tierRow}>
                      <View style={styles.tierLabelCol}>
                        <Text style={styles.tierEmoji}>⚡</Text>
                        <Text style={styles.tierName}>Abaixo de 5.0</Text>
                      </View>
                      <View style={styles.tierBarCol}>
                        <View style={styles.progressBarBg}>
                          <View
                            style={[
                              styles.progressBarFill,
                              {
                                width: `${totalWatched > 0 ? (ratingTiers.low / totalWatched) * 100 : 0}%`,
                                backgroundColor: '#EF4444',
                              },
                            ]}
                          />
                        </View>
                      </View>
                      <Text style={styles.tierCountText}>{ratingTiers.low}</Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* DÉCADAS E ERAS DO CINEMA */}
            {sortedDecades.length > 0 && (
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionTitleRow}>
                    <Icon name="calendar" size={20} color="#60A5FA" />
                    <Text style={styles.sectionTitle}>Eras do Cinema</Text>
                  </View>
                  <Text style={styles.sectionBadge}>Clique para Recomendações ✨</Text>
                </View>

                <View style={styles.decadeGrid}>
                  {sortedDecades.map(([decade, count]) => {
                    const isSelected = selectedDecadeEra === decade;

                    return (
                      <TouchableOpacity
                        key={decade}
                        style={[
                          styles.decadeCard,
                          isSelected && styles.decadeCardActive,
                        ]}
                        activeOpacity={0.7}
                        onPress={() => handleToggleDecadeEra(decade)}
                      >
                        <View style={styles.decadeCardHeader} pointerEvents="none">
                          <Text style={[styles.decadeName, isSelected && styles.decadeNameActive]}>{decade}</Text>
                          <Icon name={isSelected ? 'sparkles' : 'sparkles-outline'} size={10} color={isSelected ? theme.colors.primary : '#60A5FA'} />
                        </View>
                        <Text style={[styles.decadeCount, isSelected && styles.decadeCountActive]} pointerEvents="none">
                          {count} {count === 1 ? 'filme' : 'filmes'}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* SEÇÃO EXPANSÍVEL / INLINE DE RECOMENDAÇÕES DA ERA */}
                {selectedDecadeEra && (
                  <EraRecommendationsSection
                    decadeKey={selectedDecadeEra}
                    watchedMovies={watchedMovies}
                    watchlist={watchlist}
                    onClose={() => setSelectedDecadeEra(null)}
                    onAddWatched={onAddWatched}
                    onAddToWatchlist={onAddToWatchlist}
                    onRemoveFromWatchlist={onRemoveFromWatchlist}
                  />
                )}

                {/* Destaque Filme Mais Antigo e Mais Recente */}
                <View style={styles.extremesRow}>
                  {oldestMovie && (
                    <View style={styles.extremeItem}>
                      <Text style={styles.extremeLabel}>📜 MAIS ANTIGO</Text>
                      <Text style={styles.extremeTitle} numberOfLines={1}>
                        {oldestMovie.title}
                      </Text>
                      <Text style={styles.extremeYear}>
                        {oldestMovie.release_date?.substring(0, 4)}
                      </Text>
                    </View>
                  )}

                  {newestMovie && (
                    <View style={styles.extremeItem}>
                      <Text style={styles.extremeLabel}>✨ MAIS RECENTE</Text>
                      <Text style={styles.extremeTitle} numberOfLines={1}>
                        {newestMovie.title}
                      </Text>
                      <Text style={styles.extremeYear}>
                        {newestMovie.release_date?.substring(0, 4)}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* DESTAQUES DA SUA COLEÇÃO */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <Icon name="trophy" size={20} color={theme.colors.accent} />
                  <Text style={styles.sectionTitle}>Recordes e Marcas</Text>
                </View>
              </View>

              <View style={styles.recordsList}>
                {/* Filme mais longo */}
                {longestMovie && (
                  <View style={styles.recordRow}>
                    <View style={[styles.recordIconBox, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                      <Icon name="clock" size={20} color={theme.colors.primary} />
                    </View>
                    <View style={styles.recordInfo}>
                      <Text style={styles.recordCategory}>FILME MAIS LONGO</Text>
                      <Text style={styles.recordMovieTitle}>{longestMovie.title}</Text>
                    </View>
                    <View style={styles.recordBadge}>
                      <Text style={styles.recordBadgeText}>
                        {Number(longestMovie.runtime) || 110} min
                      </Text>
                    </View>
                  </View>
                )}

                {/* Filme com maior nota */}
                {highestRatedMovie && (
                  <View style={styles.recordRow}>
                    <View style={[styles.recordIconBox, { backgroundColor: 'rgba(255, 184, 0, 0.15)' }]}>
                      <Icon name="star" size={20} color={theme.colors.accent} />
                    </View>
                    <View style={styles.recordInfo}>
                      <Text style={styles.recordCategory}>MAIOR NOTA ASSISTIDA</Text>
                      <Text style={styles.recordMovieTitle}>{highestRatedMovie.title}</Text>
                    </View>
                    <View style={[styles.recordBadge, { backgroundColor: 'rgba(255, 184, 0, 0.2)' }]}>
                      <Text style={[styles.recordBadgeText, { color: theme.colors.accent }]}>
                        ★ {Number(highestRatedMovie.vote_average).toFixed(1)}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Total de listas customizadas */}
                <View style={styles.recordRow}>
                  <View style={[styles.recordIconBox, { backgroundColor: 'rgba(96, 165, 250, 0.15)' }]}>
                    <Icon name="film" size={20} color="#60A5FA" />
                  </View>
                  <View style={styles.recordInfo}>
                    <Text style={styles.recordCategory}>ORGANIZAÇÃO DE LISTAS</Text>
                    <Text style={styles.recordMovieTitle}>
                      {customLists.length} {customLists.length === 1 ? 'lista criada' : 'listas criadas'}
                    </Text>
                  </View>
                  <View style={[styles.recordBadge, { backgroundColor: 'rgba(96, 165, 250, 0.2)' }]}>
                    <Text style={[styles.recordBadgeText, { color: '#60A5FA' }]}>
                      {customLists.length}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    padding: theme.spacing.md,
    paddingBottom: 40,
  },

  // Filtros de Lista
  filterSection: {
    marginBottom: theme.spacing.md,
  },
  filterScroll: {
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.round,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
  },
  filterChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterChipText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },

  // State Vazio
  emptyContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
    padding: theme.spacing.xl,
    alignItems: 'center',
    marginTop: 20,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(229, 9, 20, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  emptyTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: '800',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: theme.spacing.lg,
    maxWidth: 320,
  },
  emptyActionButtons: {
    flexDirection: 'column',
    gap: 10,
    width: '100%',
    maxWidth: 280,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    borderRadius: theme.borderRadius.md,
  },
  primaryButtonText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: theme.fontSize.md,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(229, 9, 20, 0.1)',
    borderWidth: 1,
    borderColor: theme.colors.primary,
    paddingVertical: 12,
    borderRadius: theme.borderRadius.md,
  },
  secondaryButtonText: {
    color: theme.colors.primary,
    fontWeight: '700',
    fontSize: theme.fontSize.md,
  },

  // HERO CARD
  heroCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: theme.spacing.md,
  },
  badgeContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: theme.colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
  },
  badgeEmoji: {
    fontSize: 26,
  },
  heroTextWrapper: {
    flex: 1,
  },
  heroSubtitle: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.colors.textMuted,
    letterSpacing: 1,
  },
  heroTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: '900',
    marginTop: 2,
  },

  heroStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  heroStatItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  heroStatValue: {
    fontSize: theme.fontSize.lg,
    fontWeight: '800',
    color: theme.colors.text,
  },
  heroStatLabel: {
    fontSize: 10,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  heroStatDivider: {
    width: 1,
    height: 28,
    backgroundColor: theme.colors.surfaceBorder,
  },

  funFactBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 184, 0, 0.08)',
    borderRadius: theme.borderRadius.sm,
    padding: 10,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 184, 0, 0.2)',
  },
  funFactText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    flex: 1,
    lineHeight: 16,
  },
  boldText: {
    fontWeight: '700',
    color: theme.colors.text,
  },

  // GRID METRICS
  gridContainer: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  metricCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
    padding: theme.spacing.md,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: theme.fontSize.xs,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  metricNumber: {
    fontSize: theme.fontSize.xxl,
    fontWeight: '900',
    color: theme.colors.text,
  },
  metricUnit: {
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
    color: theme.colors.textMuted,
  },
  metricSubtext: {
    fontSize: 10,
    color: theme.colors.textMuted,
    marginTop: 4,
  },

  // SECTION CARD
  sectionCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: '800',
    color: theme.colors.text,
  },
  sectionBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.textMuted,
    backgroundColor: theme.colors.surfaceLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.borderRadius.sm,
  },

  // GENRES LIST
  genreList: {
    gap: 12,
  },
  genreItem: {
    gap: 6,
  },
  genreInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  genreNameWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  genreRank: {
    fontSize: theme.fontSize.xs,
    fontWeight: '800',
    color: theme.colors.textMuted,
  },
  genreName: {
    fontSize: theme.fontSize.sm,
    fontWeight: '700',
    color: theme.colors.text,
  },
  favoriteTag: {
    backgroundColor: 'rgba(255, 184, 0, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  favoriteTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: theme.colors.accent,
  },
  genreCountText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },

  // RATING TIERS
  ratingTiersContainer: {
    gap: 12,
  },
  tierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  tierLabelCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    width: 140,
  },
  tierEmoji: {
    fontSize: 14,
  },
  tierName: {
    fontSize: theme.fontSize.xs,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  tierBarCol: {
    flex: 1,
  },
  tierCountText: {
    fontSize: theme.fontSize.xs,
    fontWeight: '800',
    color: theme.colors.text,
    width: 24,
    textAlign: 'right',
  },

  // DECADE GRID
  decadeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  decadeCard: {
    backgroundColor: theme.colors.surfaceLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
    minWidth: 85,
    alignItems: 'center',
  },
  decadeCardActive: {
    borderColor: '#60A5FA',
    backgroundColor: 'rgba(96, 165, 250, 0.15)',
  },
  decadeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  decadeName: {
    fontSize: theme.fontSize.xs,
    fontWeight: '800',
    color: theme.colors.text,
  },
  decadeCount: {
    fontSize: 10,
    color: theme.colors.textMuted,
    marginTop: 2,
  },

  extremesRow: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: theme.colors.surfaceBorder,
    paddingTop: 12,
  },
  extremeItem: {
    flex: 1,
    backgroundColor: theme.colors.surfaceLight,
    padding: 10,
    borderRadius: theme.borderRadius.sm,
  },
  extremeLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: theme.colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  extremeTitle: {
    fontSize: theme.fontSize.xs,
    fontWeight: '700',
    color: theme.colors.text,
  },
  extremeYear: {
    fontSize: 10,
    color: theme.colors.primary,
    fontWeight: '800',
    marginTop: 2,
  },

  // RECORDS
  recordsList: {
    gap: 10,
  },
  recordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: theme.colors.surfaceLight,
    padding: 10,
    borderRadius: theme.borderRadius.md,
  },
  recordIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordInfo: {
    flex: 1,
  },
  recordCategory: {
    fontSize: 9,
    fontWeight: '800',
    color: theme.colors.textMuted,
    letterSpacing: 0.5,
  },
  recordMovieTitle: {
    fontSize: theme.fontSize.sm,
    fontWeight: '700',
    color: theme.colors.text,
    marginTop: 2,
  },
  recordBadge: {
    backgroundColor: 'rgba(229, 9, 20, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
  },
  recordBadgeText: {
    fontSize: theme.fontSize.xs,
    fontWeight: '800',
    color: theme.colors.primary,
  },
});
