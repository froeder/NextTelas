# 🎬 NextTelas - Recomendação de Filmes por Descoberta de Padrões

Aplicativo mobile e web desenvolvido em **React Native for Web**, **Vite** e **Firebase (Authentication e Cloud Firestore)** com integração à **TMDb API (The Movie Database)**.

A regra de negócio principal é baseada na **"Descoberta por Padrões"**:
1. O usuário pesquisa filmes e marca os que **já assistiu**.
2. Os filmes assistidos são salvos na subcoleção `users/{userId}/watched_movies` no Firestore.
3. O algoritmo analisa a frequência dos gêneros (`genre_ids`) no histórico e identifica os 2 a 3 gêneros predominantes.
4. Consulta o endpoint `/discover/movie` da TMDb filtrando pelos gêneros favoritos (`with_genres`).
5. Filtra da exibição os títulos que o usuário já assistiu, recomendando apenas novidades altamente compatíveis!

---

## 🚀 Como Executar e Testar no Navegador (Vite)

### 1. Iniciar o Servidor de Desenvolvimento
```bash
npm run dev
```
O app abrirá no navegador em **`http://localhost:5173`** com interface cinematográfica responsiva (formato app mobile em desktop e tela cheia em celulares).

### 2. Gerar o Build de Produção
```bash
npm run build
```
Gera os arquivos otimizados e minificados na pasta `dist/`.

### 3. Fazer Deploy no Firebase Hosting
```bash
npm run deploy
```
Executa o build de produção e publica diretamente no Firebase Hosting!

---

## 🔑 Configuração de Chaves (.env)

Crie um arquivo `.env` na raiz do projeto (ou edite o `.env.example`):

```bash
# TMDb API (https://www.themoviedb.org/settings/api)
VITE_TMDB_API_KEY=sua_tmdb_api_key_ou_token

# Firebase (https://console.firebase.google.com/)
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=nexttelas.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=NextTelas
VITE_FIREBASE_STORAGE_BUCKET=nexttelas.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
```

---

## 📂 Estrutura de Arquivos

```
NextTelas/
├── App.jsx                        # Ponto de entrada com Auth, TabBar e Header
├── index.html                     # HTML raiz com viewport mobile responsivo
├── vite.config.js                 # Configuração do Vite com alias React Native Web
├── firebase.json                  # Configuração de deploy do Firebase Hosting (dist)
├── .firebaserc                    # Projeto Firebase padrão (NextTelas)
├── src/
│   ├── main.jsx                   # Montagem React 19 no navegador
│   ├── components/
│   │   ├── CustomTabBar.jsx       # Navegação inferior customizada Dark Cinema
│   │   ├── GenreBadge.jsx         # Tags e chips de gêneros
│   │   ├── Header.jsx             # Cabeçalho com logo NextTelas, usuário e logout
│   │   ├── Icon.jsx               # Ícones vetoriais SVG de alta performance (Lucide)
│   │   ├── InsightBanner.jsx      # Banner explicativo da Descoberta por Padrões
│   │   ├── Loading.jsx            # Indicador de carregamento estilizado
│   │   ├── MovieCard.jsx          # Card do filme com imagem concatenada e botão Já Assisti
│   │   └── MovieCarousel.jsx      # Carrossel horizontal de destaques
│   ├── screens/
│   │   ├── AuthScreen.jsx         # Login e Cadastro no Firebase Auth
│   │   ├── RecommendationsScreen.jsx # Tela principal de Descoberta por Padrões
│   │   ├── SearchScreen.jsx       # Busca de filmes na TMDb (/search/movie)
│   │   └── WatchedScreen.jsx      # Histórico de assistidos com estatísticas
│   ├── services/
│   │   ├── authService.js         # Autenticação Firebase com mensagens em pt-BR
│   │   ├── firebaseConfig.js      # Configuração e inicialização web do Firebase
│   │   ├── firestoreService.js    # CRUD de users/{userId}/watched_movies
│   │   └── tmdbService.js         # Clientes de busca e descoberta da TMDb (language=pt-BR)
│   └── utils/
│       ├── genreExtractor.js      # Algoritmo de frequência dos top gêneros e filtros
│       ├── theme.js               # Paleta de cores Dark Cinema
│       └── tmdbGenres.js          # Mapeamento oficial de IDs de gênero para pt-BR
```

---

## 🔒 Regras de Segurança do Firestore

No Firebase Console > Firestore Database > Regras:

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
