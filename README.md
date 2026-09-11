# 🎬 CinePattern - Recomendação de Filmes por Descoberta de Padrões

Aplicativo mobile desenvolvido em **React Native com Expo**, integrado ao **Firebase (Authentication e Cloud Firestore)** e à **TMDb API (The Movie Database)**.

A inteligência de recomendação é baseada na **"Descoberta por Padrões"**:
1. O usuário pesquisa filmes e marca os que **já assistiu**.
2. Os filmes assistidos são salvos na subcoleção `users/{userId}/watched_movies` no Firestore.
3. O algoritmo analisa a frequência dos gêneros (`genre_ids`) no histórico e identifica os 2 a 3 gêneros predominantes.
4. Consulta o endpoint `/discover/movie` da TMDb filtrando pelos gêneros favoritos (`with_genres`).
5. Filtra da exibição os títulos que o usuário já assistiu, recomendando apenas novidades altamente compatíveis!

---

## 🚀 Como Executar o Projeto

### 1. Pré-requisitos
- Node.js instalado (v18+)
- Aplicativo **Expo Go** instalado no seu celular (Android ou iOS) ou um emulador configurado.

### 2. Configurar as Chaves da TMDb e do Firebase

Crie um arquivo `.env` na raiz do projeto (ou copie do `.env.example`):

```bash
# TMDb API (https://www.themoviedb.org/settings/api)
EXPO_PUBLIC_TMDB_API_KEY=sua_tmdb_api_key_ou_token

# Firebase (https://console.firebase.google.com/)
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSy...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=seu-app.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=seu-app-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=seu-app.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
```

> **Dica:** Você também pode colar as credenciais diretamente em:
> - TMDb: [src/services/tmdbService.js](src/services/tmdbService.js) (na constante `TMDB_API_KEY`)
> - Firebase: [src/services/firebaseConfig.js](src/services/firebaseConfig.js) (no objeto `firebaseConfig`)

### 3. Rodar o Aplicativo

```bash
npx expo start
```

Pressione `a` para Android, `i` para iOS ou escaneie o QR Code com o aplicativo Expo Go!

---

## 📂 Estrutura de Arquivos

```
NextTelas/
├── App.js                         # Ponto de entrada com Auth, TabBar e Header
├── src/
│   ├── components/
│   │   ├── CustomTabBar.js        # Navegação inferior customizada Dark Cinema
│   │   ├── GenreBadge.js          # Tags e chips de gêneros
│   │   ├── Header.js              # Cabeçalho com logo, usuário e botão de logout
│   │   ├── InsightBanner.js       # Banner da Descoberta por Padrões
│   │   ├── Loading.js             # Indicador de carregamento estilizado
│   │   ├── MovieCard.js           # Card do filme com imagem concatenada e botão Já Assisti
│   │   └── MovieCarousel.js       # Carrossel horizontal de destaques
│   ├── screens/
│   │   ├── AuthScreen.js          # Login e Cadastro no Firebase Auth
│   │   ├── RecommendationsScreen.js# Tela principal de Descoberta por Padrões
│   │   ├── SearchScreen.js        # Busca de filmes na TMDb (/search/movie)
│   │   └── WatchedScreen.js       # Histórico de assistidos com estatísticas
│   ├── services/
│   │   ├── authService.js         # Métodos de autenticação Firebase com erros em pt-BR
│   │   ├── firebaseConfig.js      # Configuração e inicialização do Firebase com AsyncStorage
│   │   ├── firestoreService.js    # CRUD de users/{userId}/watched_movies
│   │   └── tmdbService.js         # Clientes de busca e descoberta da TMDb (language=pt-BR)
│   └── utils/
│       ├── genreExtractor.js      # Algoritmo de frequência dos top gêneros e filtros
│       ├── theme.js               # Paleta de cores Dark Cinema
│       └── tmdbGenres.js          # Mapeamento oficial de IDs de gênero para pt-BR
```

---

## 🔒 Regras de Segurança do Firestore (Recomendado)

No Firebase Console > Firestore Database > Regras, utilize:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/watched_movies/{movieId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```
