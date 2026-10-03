# 📱 NextTelas Mobile (Expo SDK 57)

Aplicativo nativo NextTelas construído com **Expo** e **React Native**, mantendo 100% de todas as funcionalidades da versão PWA:
- 🎬 **Descoberta por Padrões**: Recomendações personalizadas geradas a partir dos gêneros mais frequentes da sua lista de filmes assistidos.
- 🔍 **Busca Completa (TMDb)**: Pesquisa em tempo real com sinopse, capa, avaliação, duração e elenco.
- 📋 **Já Assisti & Listas Customizadas**: Organização de filmes em listas personalizadas com ícones e recomendações segmentadas por lista.
- ⭐ **Quero Assistir (Watchlist)**: Lista de desejos sincronizada em tempo real.
- 📊 **Estatísticas Detalhadas**: Tempo total assistido, filmes por década, equivalências divertidas e recomendações por era.
- ☁️ **Sincronização Cloud Firestore**: Dados persistidos em nuvem em tempo real com atualizações otimistas.
- 🛡️ **Autenticação Firebase**: Login e cadastro persistidos localmente via `AsyncStorage`.
- 🔙 **Navegação & Botão Voltar Nativo**: Tratamento inteligente do botão voltar físico do Android para fechar modais e navegar entre abas.

---

## 🚀 Como Executar Localmente

### 1. Instalar as Dependências
Dentro da pasta `mobile/`:
```bash
cd mobile
npm install
```

### 2. Iniciar o Servidor Expo
```bash
npx expo start
```
Ou usando os atalhos:
- **Android:** `npx expo start --android` ou `npm run android`
- **iOS:** `npx expo start --ios` ou `npm run ios`
- **Web:** `npx expo start --web` ou `npm run web`

### 3. Testar no Celular com Expo Go
1. Instale o aplicativo **Expo Go** na Google Play Store (Android) ou App Store (iOS).
2. Conecte o celular na mesma rede Wi-Fi do computador.
3. Escaneie o QR Code exibido no terminal.

---

## 📦 Como Gerar o Arquivo APK (Android)

O arquivo `eas.json` já está pré-configurado com o profile `preview` para gerar um arquivo `.apk` diretamente para instalação em qualquer aparelho Android.

### Passo 1: Instalar a CLI do EAS (se ainda não tiver)
```bash
npm install -g eas-cli
```

### Passo 2: Fazer login na sua conta Expo
```bash
eas login
```

### Passo 3: Configurar o projeto no EAS (primeira vez)
```bash
cd mobile
eas project:init
```

### Passo 4: Disparar o Build do APK
```bash
eas build -p android --profile preview
```

Ao finalizar a compilação nos servidores do EAS, você receberá um link direto para baixar o arquivo `.apk` pronto para instalar no seu celular.

---

## 🔑 Variáveis de Ambiente

As credenciais do Firebase e TMDb estão configuradas no arquivo `.env` com o prefixo `EXPO_PUBLIC_`:

```env
EXPO_PUBLIC_TMDB_API_KEY=sua_tmdb_api_key
EXPO_PUBLIC_FIREBASE_API_KEY=sua_firebase_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=nexttelas.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=nexttelas
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=nexttelas.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1:913654975072:web:...
EXPO_PUBLIC_FIREBASE_APP_ID=G-88VX46MK9K
```

---

## 📁 Estrutura do Projeto Mobile

```
mobile/
├── assets/                  # Ícones, splash screen e imagens adaptativas
├── src/
│   ├── components/          # Componentes visuais nativos (Header, TabBar, Modais, Cards, Ícones)
│   ├── screens/             # Telas principais (Auth, Descobrir, Buscar, Já Assisti, Estatísticas)
│   ├── services/            # Serviços de API (Firebase Auth, Firestore, TMDb)
│   ├── utils/               # Tema, extrator de gêneros, histórico de navegação
│   └── version.json         # Versão e build do app
├── .env                     # Variáveis de ambiente
├── .gitignore
├── app.json                 # Configurações do Expo (pacote com.nexttelas.app, ícones, permissões)
├── eas.json                 # Perfis de build EAS (APK para Android preview)
├── index.js                 # Ponto de entrada do Expo
├── metro.config.js          # Configuração do Metro Bundler
└── package.json             # Dependências e scripts do app mobile
```
