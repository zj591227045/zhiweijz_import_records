import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig(({ command }) => {
  const isDev = command === 'serve'
  
  return {
    plugins: [
      vue(),
      vueDevTools(),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      },
    },
    base: './', // 始终使用相对路径，适配Electron环境
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      assetsDir: 'assets',
      rollupOptions: {
        output: {
          // 确保资源使用正确的路径
          assetFileNames: 'assets/[name]-[hash][extname]',
          chunkFileNames: 'assets/[name]-[hash].js',
          entryFileNames: 'assets/[name]-[hash].js'
        }
      }
    },
    experimental: {
      renderBuiltUrl(filename, { hostType }) {
        // 对于Electron环境，确保路径不重复
        if (filename.startsWith('assets/')) {
          return `./${filename}`
        }
        return `./assets/${filename}`
      }
    },
    server: {
      port: 5173,
      strictPort: true,
      host: 'localhost'
    }
  }
})
