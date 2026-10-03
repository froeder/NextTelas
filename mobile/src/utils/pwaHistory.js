import { BackHandler, Platform } from 'react-native';

/**
 * Gerenciador de navegação e histórico para Mobile (Android/iOS) e Web.
 * Intercepta o botão voltar nativo do Android e o histórico do navegador
 * para fechar modais e navegar entre abas de forma fluida.
 */

const modalCloseHandlers = [];
let currentActiveTab = 'recommendations';
let registeredBackHandler = null;

/**
 * Registra a abertura de um modal na pilha.
 * Retorna uma função para desregistrar quando o modal fechar.
 */
export const registerModalHistory = (onClose) => {
  if (typeof onClose !== 'function') return () => {};

  const handlerObj = { close: onClose };
  modalCloseHandlers.push(handlerObj);

  let cleanedUp = false;
  return () => {
    if (cleanedUp) return;
    cleanedUp = true;
    const index = modalCloseHandlers.indexOf(handlerObj);
    if (index !== -1) {
      modalCloseHandlers.splice(index, 1);
    }
  };
};

/**
 * Registra a aba ativa atual
 */
export const pushTabHistory = (tab) => {
  currentActiveTab = tab;

  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.history) {
    try {
      if (window.history.state?.tab !== tab) {
        window.history.pushState({ appInitialized: true, tab }, '', `#${tab}`);
      }
    } catch (_) {}
  }
};

/**
 * Inicializa o listener de botão voltar nativo do Android
 */
export const initHardwareBackHandler = (getActiveTab, setActiveTab) => {
  if (registeredBackHandler) {
    registeredBackHandler.remove();
    registeredBackHandler = null;
  }

  const backAction = () => {
    // 1. Se houver modal aberto na pilha, fecha o mais recente
    if (modalCloseHandlers.length > 0) {
      const topHandler = modalCloseHandlers.pop();
      if (typeof topHandler?.close === 'function') {
        topHandler.close();
        return true; // Interrompe o evento e não fecha o app
      }
    }

    // 2. Se estiver em outra aba, volta para 'recommendations'
    const activeTab = getActiveTab ? getActiveTab() : currentActiveTab;
    if (activeTab && activeTab !== 'recommendations') {
      if (typeof setActiveTab === 'function') {
        setActiveTab('recommendations');
      }
      currentActiveTab = 'recommendations';
      return true; // Tratado
    }

    // 3. Na tela inicial sem modais: permite sair do app
    return false;
  };

  registeredBackHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
  return () => {
    if (registeredBackHandler) {
      registeredBackHandler.remove();
      registeredBackHandler = null;
    }
  };
};

export default {
  registerModalHistory,
  pushTabHistory,
  initHardwareBackHandler,
};
