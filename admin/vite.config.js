/// <reference types="vitest" />
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

const alias = [
  {
    find: '@',
    replacement: fileURLToPath(new URL('./src', import.meta.url))
  }
]

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias
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
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    include: ['src/**/*.{test,spec}.{js,ts}']
  }
})
