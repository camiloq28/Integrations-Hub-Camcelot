import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5001,
    strictPort: true,
    hmr: {
      clientPort: 443,
      host: '4510d6f5-60d4-4d1c-b423-94f825eeb9b3-00-3mho543xreghf.spock.replit.dev'
    },
    allowedHosts: [
      '4510d6f5-60d4-4d1c-b423-94f825eeb9b3-00-3mho543xreghf.spock.replit.dev'
    ],
    proxy: {
      '/api': {
        target: 'http://0.0.0.0:5000',
        changeOrigin: true,
        secure: false
      }
    }
  }
});

