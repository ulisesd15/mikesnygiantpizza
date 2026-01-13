import { defineConfig } from 'vite';

export default defineConfig({
  root: 'frontend', // Serve from frontend/
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
        main: './index.html'  // ✅ Fixed: frontend/index.html
        // Removed dead pages (admin.html, cart.html, etc.)
      }
    }
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@import "./style.css";`  // ✅ Fixed path
      }
    }
  }
});
