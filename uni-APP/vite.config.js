import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'

// 设置环境变量来屏蔽 Sass 弃用警告
process.env.SASS_SILENCE_DEPRECATIONS = 'legacy-js-api,import,global-builtin,color-functions'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    uni(),
  ],
  css: {
    preprocessorOptions: {
      scss: {
        // 屏蔽 Sass 弃用警告
        api: 'modern-compiler',
        silenceDeprecations: ['legacy-js-api', 'import', 'global-builtin', 'color-functions'],
        quietDeps: true
      }
    }
  },
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
