import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages 项目名，确保静态资源路径正确： https://zdjzpg.github.io/yun-duan-h5/
  base: '/yun-duan-h5/',
  plugins: [vue(), vueDevTools()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id) return

          // 统一分隔符，兼容 Windows 路径
          const normalizedId = id.replace(/\\+/g, '/')

          // 按 views 一级目录（路由模块）切 chunk，例如 Demo、Theater
          const viewMatch = normalizedId.match(/\/src\/views\/([^/]+)/)
          if (viewMatch?.[1]) {
            return viewMatch[1].toLowerCase()
          }
        },
      },
    },
  },
  server: {
    // 允许外网访问与临时隧道主机名
    host: true,
    allowedHosts: true,
    port: 6173,
    open: true,
    proxy: {
      '/TMSH5': {
        // target: 'https://tms2.pospal.cn:443',
        // target: 'https://tms-dev1.pospal.cn',
        changeOrigin: true,
        cookieDomainRewrite: '',
        secure: false,
      },
    },
  },
})
