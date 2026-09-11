import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    global: 'window',
    __DEV__: JSON.stringify(process.env.NODE_ENV !== 'production'),
  },
  resolve: {
    alias: {
      'react-native': 'react-native-web',
    },
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
