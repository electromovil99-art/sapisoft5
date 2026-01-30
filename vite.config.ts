import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, path.resolve('.'), '');
    return {
      base: '/', 
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      resolve: {
        alias: {
          '@': path.resolve('.'),
        },
      },
      plugins: [react()],
      define: {
        'global': 'globalThis',
        'process.env': JSON.stringify({
          API_KEY: env.API_KEY || env.GEMINI_API_KEY || '',
          GEMINI_API_KEY: env.GEMINI_API_KEY || '',
          VITE_PADDLE_CLIENT_TOKEN: env.VITE_PADDLE_CLIENT_TOKEN || ''
        })
      }
    };
});