import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
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
