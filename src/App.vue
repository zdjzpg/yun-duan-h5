<script lang="ts" setup>
import zhCN from 'ant-design-vue/es/locale/zh_CN'
const locale = zhCN
</script>

<template>
  <a-config-provider :locale="locale">
    <router-view />
  </a-config-provider>
</template>

<style lang="less">
@font-face {
  font-family: 'font_family'; /* Project id 1102841 */
  src:
    url('//at.alicdn.com/t/c/font_1102841_t3p1mvboi4.woff2?t=1733049318877') format('woff2'),
    url('//at.alicdn.com/t/c/font_1102841_t3p1mvboi4.woff?t=1733049318877') format('woff'),
    url('//at.alicdn.com/t/c/font_1102841_t3p1mvboi4.ttf?t=1733049318877') format('truetype');
}

.iconfont {
  font-family: 'font_family' !important;
  font-size: 16px;
  font-style: normal;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.date-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
