import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), vueDevTools()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
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
