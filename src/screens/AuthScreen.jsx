import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Icon } from '../components/Icon';
import { theme } from '../utils/theme';
import { loginUser, registerUser } from '../services/authService';
import { isFirebaseConfigured } from '../services/firebaseConfig';

export const AuthScreen = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async () => {
    setErrorMessage('');

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Por favor, preencha todos os campos.');
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      setErrorMessage('As senhas não coincidem.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await loginUser(email, password);
        if (error) setErrorMessage(error);
      } else {
        const { error } = await registerUser(email, password);
        if (error) setErrorMessage(error);
      }
    } finally {
      setLoading(false);
    }
  };

  const configured = isFirebaseConfigured();

  return (
    <KeyboardAvoidingView
      style={styles.keyboardView}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Banner de Aviso caso o Firebase ainda use chaves de placeholder */}
        {!configured && (
          <View style={styles.configAlert}>
            <Icon name="information-circle" size={20} color={theme.colors.accent} />
            <Text style={styles.configAlertText}>
              Configure suas credenciais do Firebase em <Text style={{ fontWeight: '700' }}>src/services/firebaseConfig.js</Text> ou no arquivo <Text style={{ fontWeight: '700' }}>.env</Text> para autenticar.
            </Text>
          </View>
        )}

        {/* Logo e Cabeçalho */}
        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <Icon name="film" size={36} color="#FFF" />
          </View>
          <Text style={styles.appName}>
            Cine<Text style={styles.appAccent}>Pattern</Text>
          </Text>
          <Text style={styles.tagline}>
            Recomendações inteligentes baseadas nos seus padrões de cinema
          </Text>
        </View>

        {/* Abas Alternar Login / Cadastro */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tabButton, isLogin && styles.tabButtonActive]}
            onPress={() => {
              setIsLogin(true);
              setErrorMessage('');
            }}
          >
            <Text style={[styles.tabText, isLogin && styles.tabTextActive]}>
              Entrar
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, !isLogin && styles.tabButtonActive]}
            onPress={() => {
              setIsLogin(false);
              setErrorMessage('');
            }}
          >
            <Text style={[styles.tabText, !isLogin && styles.tabTextActive]}>
              Criar Conta
            </Text>
          </TouchableOpacity>
        </View>

        {/* Card do Formulário */}
        <View style={styles.formCard}>
          {/* Mensagem de Erro */}
          {errorMessage ? (
            <View style={styles.errorContainer}>
              <Icon name="alert-circle" size={18} color={theme.colors.error} />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {/* Campo E-mail */}
          <Text style={styles.inputLabel}>E-mail</Text>
          <View style={styles.inputWrapper}>
            <Icon name="mail-outline" size={20} color={theme.colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="seuemail@exemplo.com"
              placeholderTextColor={theme.colors.textMuted}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoCorrect={false}
            />
          </View>

          {/* Campo Senha */}
          <Text style={styles.inputLabel}>Senha</Text>
          <View style={styles.inputWrapper}>
            <Icon name="lock-closed-outline" size={20} color={theme.colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={theme.colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Icon
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={theme.colors.textMuted}
              />
            </TouchableOpacity>
          </View>

          {/* Confirmação de Senha (apenas no cadastro) */}
          {!isLogin && (
            <>
              <Text style={styles.inputLabel}>Confirmar Senha</Text>
              <View style={styles.inputWrapper}>
                <Icon name="lock-closed-outline" size={20} color={theme.colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor={theme.colors.textMuted}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
              </View>
            </>
          )}

          {/* Botão de Submissão */}
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={styles.submitButtonText}>
                {isLogin ? 'Entrar no CinePattern' : 'Finalizar Cadastro'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Rodapé explicativo */}
        <Text style={styles.footerNote}>
          Seus dados de filmes assistidos são salvos em segurança na nuvem via Google Firebase.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  configAlert: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 184, 0, 0.15)',
    borderColor: theme.colors.accent,
    borderWidth: 1,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    alignItems: 'center',
  },
  configAlertText: {
    color: theme.colors.text,
    fontSize: theme.fontSize.xs,
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  logoBadge: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  appName: {
    color: theme.colors.text,
    fontSize: theme.fontSize.xxl,
    fontWeight: '900',
    letterSpacing: 1,
  },
  appAccent: {
    color: theme.colors.primary,
  },
  tagline: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.xs,
    textAlign: 'center',
    marginTop: 6,
    maxWidth: 280,
    lineHeight: 18,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: 4,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: theme.borderRadius.sm,
  },
  tabButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  tabText: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#FFF',
    fontWeight: '700',
  },
  formCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.errorBg,
    borderColor: theme.colors.error,
    borderWidth: 1,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: theme.fontSize.xs,
    marginLeft: 6,
    flex: 1,
  },
  inputLabel: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.xs,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
    paddingHorizontal: theme.spacing.md,
    height: 48,
    marginBottom: theme.spacing.md,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: theme.colors.text,
    fontSize: theme.fontSize.sm,
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.spacing.sm,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: theme.fontSize.md,
    fontWeight: '700',
  },
  footerNote: {
    color: theme.colors.textMuted,
    fontSize: 11,
    textAlign: 'center',
    marginTop: theme.spacing.lg,
  },
});
