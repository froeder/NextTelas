import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['assets/favicon.png', 'assets/icon.png'],
      manifest: {
        name: 'NextTelas',
        short_name: 'NextTelas',
        description: 'Descubra filmes por padrões. Rastreie o que você assistiu e receba recomendações personalizadas.',
        start_url: '/',
        display: 'standalone',
        background_color: '#0B0C12',
        theme_color: '#0B0C12',
        orientation: 'portrait',
        lang: 'pt-BR',
        icons: [
          {
            src: '/assets/favicon.png',
            sizes: '48x48',
            type: 'image/png',
          },
          {
            src: '/assets/icon.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
        categories: ['entertainment', 'lifestyle'],
      },
      workbox: {
        // Cache de recursos estáticos (JS, CSS, fontes)
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            // Cache de imagens da TMDb (pôsteres)
            urlPattern: /^https:\/\/image\.tmdb\.org\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'tmdb-images',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 dias
              },
            },
          },
          {
            // Cache de fontes do Google Fonts
            urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 ano
              },
            },
          },
        ],
      },
      devOptions: {
        // Habilita o service worker também em dev para facilitar testes
        enabled: false,
      },
    }),
  ],
  define: {
    global: 'window',
    __DEV__: JSON.stringify(process.env.NODE_ENV !== 'production'),
  },
  resolve: {
    alias: [
      { find: /^react-native$/, replacement: 'react-native-web' },
      { find: 'react-native-safe-area-context', replacement: path.resolve(__dirname, 'src/utils/safeAreaMock.jsx') },
      { find: 'expo-status-bar', replacement: path.resolve(__dirname, 'src/utils/statusBarMock.jsx') },
      { find: '@expo/vector-icons', replacement: path.resolve(__dirname, 'src/components/Icon.jsx') },
    ],
    extensions: [
      '.web.jsx',
      '.web.js',
      '.jsx',
      '.js',
      '.web.tsx',
      '.web.ts',
      '.tsx',
      '.ts',
      '.json',
    ],
  },
  server: {
    port: 5173,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
