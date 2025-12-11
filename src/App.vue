<script setup lang="ts">
import { onLaunch, onShow, onHide } from "@dcloudio/uni-app";
onLaunch(() => {
  console.log("App Launch");
});
onShow(() => {
  console.log("App Show");
});
onHide(() => {
  console.log("App Hide");
});
</script>
<style lang="scss">
/* 全局样式 - 强制应用背景色 */
page {
  background-color: $pet-bg-base !important;
  min-height: 100vh;
}

uni-page-body {
  background-color: $pet-bg-base !important;
  min-height: 100vh;
}

html,
body {
  background-color: $pet-bg-base !important;
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  color: $pet-text-main;
}

#app {
  background-color: $pet-bg-base !important;
  min-height: 100vh;
}

/* uni-app H5 特定容器 */
.uni-app--showtabbar,
.uni-app--showsystembar {
  background-color: $pet-bg-base !important;
}

/* 隐藏滚动条 */
::-webkit-scrollbar {
  display: none;
  width: 0 !important;
  height: 0 !important;
  -webkit-appearance: none;
  background: transparent;
}
</style>

