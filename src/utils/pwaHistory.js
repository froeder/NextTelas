/**
 * Utilitário de navegação de histórico para PWA / Web.
 * Intercepta o gesto de voltar do navegador/dispositivo para fechar modais e trocar de aba
 * sem fechar a aplicação PWA instalada.
 */

const modalCloseHandlers = [];
let isPoppingState = false;

if (typeof window !== 'undefined') {
  try {
    // Registra a entrada base inicial do app no histórico
    if (!window.history.state || !window.history.state.appInitialized) {
      window.history.replaceState({ appInitialized: true, tab: 'recommendations', root: true }, '', window.location.pathname);
      window.history.pushState({ appInitialized: true, tab: 'recommendations' }, '', window.location.pathname);
    }
  } catch (_) {}

  // Listener global do evento popstate (gesto voltar / botão voltar do sistema)
  window.addEventListener('popstate', (event) => {
    isPoppingState = true;

    try {
      // 1. Se houver modais abertos, fecha o modal mais recente
      if (modalCloseHandlers.length > 0) {
        const topHandler = modalCloseHandlers.pop();
        if (typeof topHandler.close === 'function') {
          topHandler.close();
        }
        return;
      }

      // 2. Se não houver modal aberto, navega entre abas
      const targetTab = event.state?.tab || 'recommendations';
      window.dispatchEvent(new CustomEvent('pwa-tab-change', { detail: { tab: targetTab } }));

      // 3. Se estiver na raiz e sem histórico anterior, impede o fechamento acidental do PWA
      if (!event.state || event.state.root) {
        window.history.pushState({ appInitialized: true, tab: 'recommendations' }, '', window.location.pathname);
      }
    } finally {
      setTimeout(() => {
        isPoppingState = false;
      }, 50);
    }
  });
}

/**
 * Registra a abertura de um modal para capturar o gesto de voltar.
 * Retorna uma função de limpeza para desregistrar ao fechar.
 */
export const registerModalHistory = (onClose) => {
  if (typeof window === 'undefined' || !window.history || typeof onClose !== 'function') {
    return () => {};
  }

  const handlerObj = { close: onClose };
  modalCloseHandlers.push(handlerObj);

  // Push uma entrada de histórico para representar a abertura do modal
  try {
    window.history.pushState({ modalOpen: true }, '', '#modal');
  } catch (_) {}

  let cleanedUp = false;
  return () => {
    if (cleanedUp) return;
    cleanedUp = true;

    const index = modalCloseHandlers.indexOf(handlerObj);
    if (index !== -1) {
      modalCloseHandlers.splice(index, 1);
    }

    // Se o modal foi fechado por clique na UI (e não pelo gesto de voltar), desfaz a entrada no history
    if (!isPoppingState) {
      isPoppingState = true;
      try {
        if (window.history.state && window.history.state.modalOpen) {
          window.history.back();
        }
      } catch (_) {}
      setTimeout(() => {
        isPoppingState = false;
      }, 100);
    }
  };
};

/**
 * Registra a navegação de abas no histórico do browser.
 */
export const pushTabHistory = (tab) => {
  if (typeof window === 'undefined' || !window.history) return;
  if (window.history.state?.tab === tab) return;

  try {
    window.history.pushState({ appInitialized: true, tab }, '', `#${tab}`);
  } catch (_) {}
};
