import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  const isDev = command === 'serve'
  const isVercel = process.env.VERCEL === '1' || mode === 'production'

  return {
    plugins: [
      vue(),
      // 在生产环境中禁用 devtools
      ...(isDev ? [vueDevTools()] : []),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      },
    },
    // Vercel 部署使用绝对路径，本地开发使用相对路径
    base: isVercel ? '/' : './',
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      assetsDir: 'assets',
      // 优化构建性能
      target: 'es2015',
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
        },
      },
      rollupOptions: {
        output: {
          // 确保资源使用正确的路径
          assetFileNames: 'assets/[name]-[hash][extname]',
          chunkFileNames: 'assets/[name]-[hash].js',
          entryFileNames: 'assets/[name]-[hash].js',
          // 代码分割优化
          manualChunks: {
            vendor: ['vue', 'vue-router', 'pinia'],
            elementPlus: ['element-plus', '@element-plus/icons-vue'],
            utils: ['axios', 'dayjs', 'lodash']
          }
        }
      },
      // 增加 chunk 大小警告阈值
      chunkSizeWarningLimit: 1000,
    },
    server: {
      port: 5173,
      strictPort: true,
      host: 'localhost'
    },
    preview: {
      port: 4173,
      host: '0.0.0.0'
    },
    // 环境变量配置
    define: {
      __VUE_PROD_DEVTOOLS__: false,
      __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false,
    },
  }
})
