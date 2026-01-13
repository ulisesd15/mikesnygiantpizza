import { defineConfig } from 'vite';

export default defineConfig({
  root: 'frontend',
  base: './',  // ✅ Add for deployed builds
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        secure: false
      }
    }
  },
  build: {
    rollupOptions: {
      input: {
        main: './index.html'
      }
    }
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@import "./style.css";`
      }
    }
  },
  publicDir: false  
});
