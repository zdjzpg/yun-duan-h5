<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    /** 预留扩展位，当前仅负责布局 */
  }>(),
  {},
)
</script>

<template>
  <div class="form-page-layout">
    <div class="form-page-layout__card">
      <slot />
    </div>

    <div class="form-page-layout__footer">
      <div class="form-page-layout__footer-inner">
        <slot name="footer" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.form-page-layout {
  padding: 16px;
}

.form-page-layout__card {
  background: #ffffff;
  border-radius: 2px;
  padding: 16px;
  margin-bottom: 40px;
}

.form-page-layout__footer {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  height: 64px;
  background: #ffffff;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.form-page-layout__footer-inner {
  display: flex;
  gap: 12px;
}
</style>
