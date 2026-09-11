import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Icon } from '../components/Icon';
import { theme } from '../utils/theme';
import { MovieCard } from '../components/MovieCard';
import { removeWatchedMovie, addWatchedMovie } from '../services/firestoreService';
import { extractTopGenres } from '../utils/genreExtractor';
import { CreateListModal } from '../components/CreateListModal';
import { MoveToListModal } from '../components/MoveToListModal';
import { getMovieDetails } from '../services/tmdbService';

export const WatchedScreen = ({
  user,
  watchedMovies = [],
  customLists = [],
  onCreateList,
  onDeleteList,
  onMoveMoviesToList,
  onNavigateToSearch,
  onNavigateToRecommendations,
  onRemoveWatched,
}) => {
  // Lista ativa selecionada na aba: 'all' ou o ID da lista customizada
  const [activeListId, setActiveListId] = useState('all');

  // Modo de Seleção Múltipla
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedMovieIds, setSelectedMovieIds] = useState(new Set());

  // Modais
  const [movieToRemove, setMovieToRemove] = useState(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [showCreateListModal, setShowCreateListModal] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [singleMovieToMove, setSingleMovieToMove] = useState(null);

  // Filtra filmes da lista ativa e ordena alfabeticamente
  const filteredMovies = (activeListId === 'all'
    ? watchedMovies
    : watchedMovies.filter(
        (m) => Array.isArray(m.listIds) && m.listIds.includes(activeListId)
      )
  ).slice().sort((a, b) =>
    (a.title || '').localeCompare(b.title || '', 'pt-BR', { sensitivity: 'base' })
  );

  const activeListObj = customLists.find((l) => l.id === activeListId);

  // Estatísticas de gênero e total baseados na lista atualmente exibida
  const { topGenresDetails, totalWatched } = extractTopGenres(filteredMovies, 5);

  // Auto-backfill em segundo plano para filmes sem runtime no Firestore
  useEffect(() => {
    if (!user?.uid || watchedMovies.length === 0) return;
    const missing = watchedMovies.filter((m) => !m.runtime || Number(m.runtime) === 0);
    if (missing.length === 0) return;

    let isMounted = true;
    const backfillRuntimes = async () => {
      for (const m of missing.slice(0, 8)) {
        try {
          const { data } = await getMovieDetails(m.id);
          if (isMounted && data?.runtime) {
            await addWatchedMovie(user.uid, { ...m, runtime: data.runtime });
          }
        } catch (_) {}
      }
    };
    backfillRuntimes();
  }, [user, watchedMovies]);

  // Cálculo do total de minutos assistidos (usa runtime exato ou estimativa média de 110 min)
  const totalMinutes = filteredMovies.reduce((acc, m) => {
    const r = Number(m.runtime);
    return acc + (r > 0 ? r : 110);
  }, 0);
  const totalHours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;
  const totalTimeLabel = totalMinutes > 0
    ? (totalHours > 0
        ? (remainingMinutes > 0 ? `${totalHours}h ${remainingMinutes}m` : `${totalHours}h`)
        : `${remainingMinutes}m`)
    : null;

  // Controle de Seleção
  const toggleSelectMovie = (movie) => {
    setSelectedMovieIds((prev) => {
      const next = new Set(prev);
      const strId = String(movie.id);
      if (next.has(strId)) {
        next.delete(strId);
      } else {
        next.add(strId);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedMovieIds.size === filteredMovies.length) {
      setSelectedMovieIds(new Set());
    } else {
      setSelectedMovieIds(new Set(filteredMovies.map((m) => String(m.id))));
    }
  };

  const handleExitSelection = () => {
    setIsSelectionMode(false);
    setSelectedMovieIds(new Set());
  };

  // Mover filmes em lote
  const handleConfirmMove = async (targetListId) => {
    const idsToMove = singleMovieToMove
      ? [singleMovieToMove.id]
      : Array.from(selectedMovieIds);

    if (onMoveMoviesToList) {
      await onMoveMoviesToList(idsToMove, targetListId);
    }

    setSingleMovieToMove(null);
    handleExitSelection();
  };

  // Abertura do modal de mover para filme individual
  const handleOpenMoveSingle = (movie) => {
    setSingleMovieToMove(movie);
    setShowMoveModal(true);
  };

  // Remoção de filme
  const handleConfirmRemove = async () => {
    if (!movieToRemove) return;
    try {
      setIsRemoving(true);
      if (onRemoveWatched) {
        await onRemoveWatched(movieToRemove.id);
      } else if (user?.uid) {
        await removeWatchedMovie(user.uid, movieToRemove.id);
      }
      setMovieToRemove(null);
    } catch (err) {
      console.error('Erro ao remover filme:', err);
    } finally {
      setIsRemoving(false);
    }
  };

  // Exclusão de lista customizada
  const handleDeleteCurrentList = () => {
    if (activeListId !== 'all' && onDeleteList) {
      if (typeof window !== 'undefined' && window.confirm) {
        if (window.confirm(`Deseja excluir a lista "${activeListObj?.name}"? Os filmes continuarão salvos no histórico geral.`)) {
          onDeleteList(activeListId);
          setActiveListId('all');
        }
      } else {
        onDeleteList(activeListId);
        setActiveListId('all');
      }
    }
  };

  // Retorna o nome da lista de um filme para exibir no card
  const getMovieCustomListName = (movie) => {
    if (!Array.isArray(movie.listIds) || movie.listIds.length === 0) return null;
    const found = customLists.find((l) => movie.listIds.includes(l.id));
    return found ? found.name : null;
  };

  return (
    <View style={styles.container}>
      {/* Seletor de Listas Horizontal (Chips) */}
      <View style={styles.listsBarContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.listsScrollContent}
        >
          {/* Aba 'Todos' */}
          <TouchableOpacity
            style={[styles.listChip, activeListId === 'all' && styles.listChipActive]}
            onPress={() => {
              setActiveListId('all');
              handleExitSelection();
            }}
            activeOpacity={0.8}
          >
            <Icon
              name="film"
              size={14}
              color={activeListId === 'all' ? '#FFF' : theme.colors.textSecondary}
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.listChipText, activeListId === 'all' && styles.listChipTextActive]}>
              Todos ({watchedMovies.length})
            </Text>
          </TouchableOpacity>

          {/* Listas Customizadas */}
          {customLists.map((list) => {
            const isActive = activeListId === list.id;
            const count = watchedMovies.filter(
              (m) => Array.isArray(m.listIds) && m.listIds.includes(list.id)
            ).length;

            return (
              <TouchableOpacity
                key={list.id}
                style={[styles.listChip, isActive && styles.listChipActive]}
                onPress={() => {
                  setActiveListId(list.id);
                  handleExitSelection();
                }}
                activeOpacity={0.8}
              >
                <Icon
                  name={list.icon || 'film'}
                  size={14}
                  color={isActive ? '#FFF' : theme.colors.textSecondary}
                  style={{ marginRight: 6 }}
                />
                <Text style={[styles.listChipText, isActive && styles.listChipTextActive]}>
                  {list.name} ({count})
                </Text>
              </TouchableOpacity>
            );
          })}

          {/* Botão + Nova Lista */}
          <TouchableOpacity
            style={styles.addListChip}
            onPress={() => setShowCreateListModal(true)}
            activeOpacity={0.8}
          >
            <Icon name="add" size={14} color={theme.colors.primary} style={{ marginRight: 4 }} />
            <Text style={styles.addListChipText}>Nova Lista</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Cabeçalho da Lista Ativa com Ações (Selecionar, Excluir Lista, Recomendações) */}
      <View style={styles.listHeaderActions}>
        <View style={styles.listHeaderTitleCol}>
          <Text style={styles.listHeaderTitle}>
            {activeListId === 'all' ? 'Histórico Geral de Assistidos' : activeListObj?.name}
          </Text>
          <View style={styles.listHeaderMetaRow}>
            <Text style={styles.listHeaderSubtitle}>
              {filteredMovies.length} {filteredMovies.length === 1 ? 'filme' : 'filmes'}
            </Text>
            {totalTimeLabel && (
              <>
                <Text style={styles.listHeaderMetaDot}>•</Text>
                <Icon name="clock" size={11} color={theme.colors.accent} style={{ marginRight: 3 }} />
                <Text style={styles.listHeaderTotalTime}>{totalTimeLabel} assistidas</Text>
              </>
            )}
          </View>
        </View>

        <View style={styles.headerRightButtons}>
          {filteredMovies.length > 0 && (
            <TouchableOpacity
              style={[styles.selectToggleBtn, isSelectionMode && styles.selectToggleBtnActive]}
              onPress={() => {
                if (isSelectionMode) {
                  handleExitSelection();
                } else {
                  setIsSelectionMode(true);
                }
              }}
              activeOpacity={0.8}
            >
              <Icon
                name={isSelectionMode ? 'close' : 'checkmark-circle'}
                size={14}
                color={isSelectionMode ? '#FFF' : theme.colors.textSecondary}
                style={{ marginRight: 4 }}
              />
              <Text style={[styles.selectToggleText, isSelectionMode && { color: '#FFF' }]}>
                {isSelectionMode ? 'Cancelar' : 'Selecionar'}
              </Text>
            </TouchableOpacity>
          )}

          {activeListId !== 'all' && (
            <TouchableOpacity
              style={styles.deleteListBtn}
              onPress={handleDeleteCurrentList}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Icon name="trash-outline" size={16} color={theme.colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Banner de Atalho para Recomendações desta Lista */}
      {filteredMovies.length > 0 && (
        <TouchableOpacity
          style={styles.recommendShortcutBanner}
          onPress={() => onNavigateToRecommendations && onNavigateToRecommendations(activeListId)}
          activeOpacity={0.85}
        >
          <View style={styles.recommendShortcutLeft}>
            <View style={styles.recommendShortcutIconBg}>
              <Icon name="sparkles" size={16} color="#FFF" />
            </View>
            <View>
              <Text style={styles.recommendShortcutTitle}>
                Recomendações para {activeListId === 'all' ? 'esta coleção' : `"${activeListObj?.name}"`}
              </Text>
              <Text style={styles.recommendShortcutSub}>
                Descubra títulos afins baseados nestes {filteredMovies.length} filmes
              </Text>
            </View>
          </View>
          <Icon name="trending-up" size={16} color={theme.colors.accent} />
        </TouchableOpacity>
      )}

      {/* Card com Estatísticas do Histórico / Gêneros Mais Frequentes */}
      {topGenresDetails.length > 0 && (
        <View style={styles.statsCard}>
          <Text style={styles.topGenresTitle}>Padrão Predominante desta Lista:</Text>
          <View style={styles.chipsRow}>
            {topGenresDetails.map((genre) => (
              <View key={genre.id} style={styles.chip}>
                <Text style={styles.chipName}>{genre.name}</Text>
                <Text style={styles.chipCount}>{genre.count}x</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Barra de Seleção Rápida (Selecionar Todos / Nenhum) */}
      {isSelectionMode && filteredMovies.length > 0 && (
        <View style={styles.selectionQuickRow}>
          <TouchableOpacity onPress={handleSelectAll}>
            <Text style={styles.quickSelectText}>
              {selectedMovieIds.size === filteredMovies.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
            </Text>
          </TouchableOpacity>
          <Text style={styles.selectionCountLabel}>
            {selectedMovieIds.size} de {filteredMovies.length} selecionados
          </Text>
        </View>
      )}

      {/* Lista de Filmes Assistidos */}
      <FlatList
        data={filteredMovies}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <MovieCard
            movie={item}
            isWatched={true}
            showRemoveButton={!isSelectionMode}
            onPressRemove={setMovieToRemove}
            isSelectable={isSelectionMode}
            isSelected={selectedMovieIds.has(String(item.id))}
            onToggleSelect={toggleSelectMovie}
            onPressMoveToList={handleOpenMoveSingle}
            customListName={activeListId === 'all' ? getMovieCustomListName(item) : null}
          />
        )}
        contentContainerStyle={[
          styles.listContent,
          isSelectionMode && selectedMovieIds.size > 0 && { paddingBottom: 100 },
        ]}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconBg}>
              <Icon name="film-outline" size={42} color={theme.colors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>
              {activeListId === 'all'
                ? 'Nenhum Filme Registrado'
                : `A lista "${activeListObj?.name}" está vazia`}
            </Text>
            <Text style={styles.emptyText}>
              {activeListId === 'all'
                ? 'Pesquise seus filmes favoritos e marque "Já Assisti" para alimentar as recomendações.'
                : 'Mova filmes da aba "Todos" para esta lista para obter recomendações direcionadas!'}
            </Text>

            {activeListId === 'all' ? (
              <TouchableOpacity
                style={styles.searchButton}
                onPress={onNavigateToSearch}
                activeOpacity={0.8}
              >
                <Icon name="search" size={16} color="#FFF" style={{ marginRight: 6 }} />
                <Text style={styles.searchButtonText}>Buscar Filmes Agora</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.searchButton}
                onPress={() => setActiveListId('all')}
                activeOpacity={0.8}
              >
                <Text style={styles.searchButtonText}>Ver Todos os Assistidos</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />

      {/* Barra Inferior Flutuante quando houver filmes selecionados */}
      {isSelectionMode && selectedMovieIds.size > 0 && (
        <View style={styles.floatingSelectionBar}>
          <View style={styles.floatingSelectionLeft}>
            <View style={styles.floatingCountBadge}>
              <Text style={styles.floatingCountText}>{selectedMovieIds.size}</Text>
            </View>
            <Text style={styles.floatingSelectionText}>
              {selectedMovieIds.size === 1 ? 'filme selecionado' : 'filmes selecionados'}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.moveSubmitBtn}
            onPress={() => setShowMoveModal(true)}
            activeOpacity={0.8}
          >
            <Icon name="film" size={16} color="#FFF" style={{ marginRight: 6 }} />
            <Text style={styles.moveSubmitBtnText}>Mover para Lista...</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Modal para Criar Nova Lista */}
      <CreateListModal
        visible={showCreateListModal}
        onClose={() => setShowCreateListModal(false)}
        onCreate={onCreateList}
      />

      {/* Modal para Escolher Lista de Destino ao Mover */}
      <MoveToListModal
        visible={showMoveModal}
        onClose={() => {
          setShowMoveModal(false);
          setSingleMovieToMove(null);
        }}
        customLists={customLists}
        selectedCount={singleMovieToMove ? 1 : selectedMovieIds.size}
        onMove={handleConfirmMove}
        onOpenCreateList={() => setShowCreateListModal(true)}
      />

      {/* Modal de Confirmação para Remover Filme */}
      <Modal
        visible={!!movieToRemove}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          if (!isRemoving) setMovieToRemove(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconBadge}>
              <Icon name="trash-outline" size={26} color={theme.colors.error} />
            </View>

            <Text style={styles.modalTitle}>Remover do Histórico?</Text>
            <Text style={styles.modalSubtitle}>
              Deseja remover <Text style={styles.modalMovieHighlight}>"{movieToRemove?.title}"</Text> da sua lista de assistidos? Seus padrões de recomendação serão recalculados.
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setMovieToRemove(null)}
                disabled={isRemoving}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.deleteConfirmBtn}
                onPress={handleConfirmRemove}
                disabled={isRemoving}
                activeOpacity={0.8}
              >
                {isRemoving ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.deleteConfirmBtnText}>Remover</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  listsBarContainer: {
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderColor: theme.colors.surfaceBorder,
    paddingVertical: 8,
  },
  listsScrollContent: {
    paddingHorizontal: theme.spacing.md,
    gap: 8,
    alignItems: 'center',
  },
  listChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceLight,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: theme.borderRadius.round,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
  },
  listChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  listChipText: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.xs,
    fontWeight: '600',
  },
  listChipTextActive: {
    color: '#FFF',
    fontWeight: '700',
  },
  addListChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(229, 9, 20, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(229, 9, 20, 0.35)',
    borderStyle: 'dashed',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.round,
  },
  addListChipText: {
    color: theme.colors.primary,
    fontSize: theme.fontSize.xs,
    fontWeight: '700',
  },
  listHeaderActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
    paddingBottom: 4,
  },
  listHeaderTitleCol: {
    flex: 1,
  },
  listHeaderTitle: {
    color: theme.colors.text,
    fontSize: theme.fontSize.md,
    fontWeight: '800',
  },
  listHeaderSubtitle: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  listHeaderMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
    flexWrap: 'wrap',
    gap: 3,
  },
  listHeaderMetaDot: {
    color: theme.colors.textMuted,
    fontSize: 10,
    marginHorizontal: 2,
  },
  listHeaderTotalTime: {
    color: theme.colors.accent,
    fontSize: 11,
    fontWeight: '700',
  },
  headerRightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
  },
  selectToggleBtnActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  selectToggleText: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.xs,
    fontWeight: '600',
  },
  deleteListBtn: {
    padding: 6,
  },
  recommendShortcutBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 184, 0, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 184, 0, 0.3)',
    borderRadius: theme.borderRadius.md,
    marginHorizontal: theme.spacing.md,
    marginTop: 8,
    marginBottom: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  recommendShortcutLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  recommendShortcutIconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recommendShortcutTitle: {
    color: '#FFF',
    fontSize: theme.fontSize.xs,
    fontWeight: '700',
  },
  recommendShortcutSub: {
    color: theme.colors.textSecondary,
    fontSize: 10,
    marginTop: 1,
  },
  statsCard: {
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.md,
    marginVertical: 6,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
  },
  topGenresTitle: {
    color: theme.colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.borderRadius.round,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
  },
  chipName: {
    color: theme.colors.text,
    fontSize: 11,
    fontWeight: '600',
    marginRight: 4,
  },
  chipCount: {
    color: theme.colors.accent,
    fontSize: 10,
    fontWeight: '700',
  },
  selectionQuickRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 6,
  },
  quickSelectText: {
    color: theme.colors.primary,
    fontSize: theme.fontSize.xs,
    fontWeight: '700',
  },
  selectionCountLabel: {
    color: theme.colors.textSecondary,
    fontSize: 11,
  },
  listContent: {
    paddingTop: theme.spacing.xs,
    paddingBottom: theme.spacing.xl,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
    marginTop: theme.spacing.lg,
  },
  emptyIconBg: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
  },
  emptyTitle: {
    color: theme.colors.text,
    fontSize: theme.fontSize.md,
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptyText: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.xs,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
    marginBottom: theme.spacing.lg,
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 10,
    borderRadius: theme.borderRadius.md,
  },
  searchButtonText: {
    color: '#FFF',
    fontSize: theme.fontSize.sm,
    fontWeight: '700',
  },
  floatingSelectionBar: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 12,
    zIndex: 100,
  },
  floatingSelectionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  floatingCountBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingCountText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
  },
  floatingSelectionText: {
    color: theme.colors.text,
    fontSize: theme.fontSize.xs,
    fontWeight: '600',
  },
  moveSubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.md,
  },
  moveSubmitBtnText: {
    color: '#FFF',
    fontSize: theme.fontSize.xs,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 6, 10, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  modalCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
    padding: theme.spacing.lg,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  modalIconBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  modalTitle: {
    color: theme.colors.text,
    fontSize: theme.fontSize.lg,
    fontWeight: '800',
    marginBottom: 6,
    textAlign: 'center',
  },
  modalSubtitle: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: theme.spacing.lg,
  },
  modalMovieHighlight: {
    color: theme.colors.text,
    fontWeight: '700',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surfaceLight,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
  },
  deleteConfirmBtn: {
    flex: 1,
    height: 44,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteConfirmBtnText: {
    color: '#FFF',
    fontSize: theme.fontSize.sm,
    fontWeight: '700',
  },
});
