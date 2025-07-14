import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    uni(),
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/users': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/posts': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/comments': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/likes': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/favorites': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/follows': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/messages': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/topics': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/categories': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/upload': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
})
