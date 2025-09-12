import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  server: {
    port: 8888,
    open: true,
    proxy: {
      '/api': {
        target: 'http://www.callxyq.xyzs',
        changeOrigin: true,
        secure: false
      }
    }
  }
}) 