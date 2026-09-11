import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth } from './firebaseConfig';

/**
 * Traduz mensagens de erro do Firebase Auth para o português
 */
export const getAuthErrorMessage = (error) => {
  if (!error) return 'Ocorreu um erro desconhecido.';
  const code = error.code || '';

  switch (code) {
    case 'auth/invalid-email':
      return 'O formato do e-mail é inválido.';
    case 'auth/user-disabled':
      return 'Este usuário foi desativado.';
    case 'auth/user-not-found':
      return 'Nenhum usuário encontrado com este e-mail.';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'E-mail ou senha incorretos.';
    case 'auth/email-already-in-use':
      return 'Já existe uma conta cadastrada com este e-mail.';
    case 'auth/weak-password':
      return 'A senha é muito fraca. Utilize pelo menos 6 caracteres.';
    case 'auth/network-request-failed':
      return 'Falha na conexão de rede. Verifique sua internet.';
    case 'auth/too-many-requests':
      return 'Muitas tentativas sem sucesso. Tente novamente mais tarde.';
    default:
      return error.message || 'Erro ao processar autenticação.';
  }
};

/**
 * Realiza login com e-mail e senha
 */
export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
    return { user: userCredential.user, error: null };
  } catch (error) {
    return { user: null, error: getAuthErrorMessage(error) };
  }
};

/**
 * Cadastra um novo usuário com e-mail e senha
 */
export const registerUser = async (email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
    return { user: userCredential.user, error: null };
  } catch (error) {
    return { user: null, error: getAuthErrorMessage(error) };
  }
};

/**
 * Realiza logout do usuário
 */
export const logoutUser = async () => {
  try {
    await signOut(auth);
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: getAuthErrorMessage(error) };
  }
};

/**
 * Observa alterações no estado de autenticação do usuário
 */
export const subscribeAuthState = (callback) => {
  return onAuthStateChanged(auth, callback);
};
