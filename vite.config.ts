import { defineConfig } from "vite";
import uni from "@dcloudio/vite-plugin-uni";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [uni()],
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@import "${path.resolve(__dirname, 'src/uni.scss')}";`,
        api: 'modern-compiler',
        quietDeps: true,
        silenceDeprecations: ['legacy-js-api', 'import', 'global-builtin']
      }
    }
  },
  server: {
    // 允许局域网访问
    host: '0.0.0.0',
    port: 5175,
    // API 代理配置
    proxy: {
      '/api/v1': {
        target: 'http://127.0.0.1:8001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
