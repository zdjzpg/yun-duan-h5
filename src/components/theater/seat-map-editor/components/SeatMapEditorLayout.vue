<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    isInModal?: boolean
    isFullscreen?: boolean
  }>(),
  {
    isInModal: false,
    isFullscreen: false,
  },
)
</script>

<template>
  <a-layout
    :style="{
      height: props.isInModal ? '100%' : '100vh',
      background: '#f5f5f5',
      display: 'flex',
      flexDirection: 'column',
    }"
  >
    <a-layout-header
      :style="{
        background: '#ffffff',
        padding: '0 24px',
        borderBottom: '1px solid #f0f0f0',
        height: '64px',
        lineHeight: '64px',
        position: props.isInModal ? 'static' : 'sticky',
        top: props.isInModal ? undefined : 0,
        zIndex: 100,
        flexShrink: 0,
      }"
    >
      <slot name="header" />
    </a-layout-header>

    <a-layout
      :style="{
        background: '#f5f5f5',
        flex: 1,
        overflow: 'hidden',
        display: 'flex',
      }"
    >
      <a-layout-sider
        v-if="!props.isFullscreen"
        :width="240"
        :style="{
          background: '#ffffff',
          borderRight: '1px solid #f0f0f0',
          height: '100%',
          overflow: 'hidden',
          position: props.isInModal ? 'static' : 'sticky',
          top: props.isInModal ? undefined : 64,
          left: 0,
          flexShrink: 0,
        }"
      >
        <div class="seat-map-editor-panel-scrollbar">
          <slot name="left" />
        </div>
      </a-layout-sider>

      <a-layout-content
        :style="{
          padding: props.isInModal ? 0 : 24,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative',
          height: '100%',
        }"
      >
        <div
          :style="{
            flex: 1,
            overflow: 'auto',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
          }"
        >
          <slot name="canvas" />
        </div>
      </a-layout-content>

      <a-layout-sider
        v-if="!props.isFullscreen"
        :width="320"
        :style="{
          background: '#ffffff',
          borderLeft: '1px solid #f0f0f0',
          height: '100%',
          overflow: 'hidden',
          position: props.isInModal ? 'static' : 'sticky',
          top: props.isInModal ? undefined : 64,
          right: 0,
          flexShrink: 0,
        }"
      >
        <div class="seat-map-editor-panel-scrollbar">
          <slot name="right" />
        </div>
      </a-layout-sider>
    </a-layout>

    <div class="seat-map-editor-footer">
      <slot name="footer" />
    </div>
  </a-layout>
</template>

<style scoped>
.seat-map-editor-panel-scrollbar {
  height: 100%;
  padding-left: 16px;
  padding-top: 16px;
  padding-bottom: 16px;
  padding-right: 0;
  overflow-y: auto;
  overflow-x: hidden;
  box-sizing: border-box;
}

.seat-map-editor-footer {
  flex-shrink: 0;
}
</style>
