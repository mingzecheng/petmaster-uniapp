/**
 * @description 应用入口配置
 */

import { createSSRApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

export function createApp() {
  const app = createSSRApp(App)

  // 创建Pinia实例
  const pinia = createPinia()
  app.use(pinia)

  return {
    app
  }
}
