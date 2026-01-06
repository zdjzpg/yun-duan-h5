<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    isInModal?: boolean
    isFullscreen?: boolean
    /** 左侧面板宽度：场馆模式 240，票档配置可设置为 500，与 a 项目对齐 */
    leftSiderWidth?: number
  }>(),
  {
    isInModal: false,
    isFullscreen: false,
    leftSiderWidth: 240,
  },
)
</script>

<template>
  <a-layout
    :style="{
      // Modal 中预留约 60px 空间给底部 AntD 按钮条，确保 seat-map-editor-footer 不被遮挡
      height: props.isInModal ? '100%' : '100vh',
      background: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
    }"
  >
    <a-layout-header
      :style="{
        background: '#ffffff',
        padding: '0 24px',
        borderBottom: '1px solid #f0f0f0',
        height: '54px',
        lineHeight: '54px',
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
        background: '#ffffff',
        flex: 1,
        overflow: 'hidden',
        display: 'flex',
      }"
    >
      <a-layout-sider
        v-if="!props.isFullscreen"
        :width="props.leftSiderWidth"
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
            overflow: 'hidden',
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

<style>
/* ========================================
   座位图编辑器 - 悬浮滚动条 & 面板布局
   ======================================== */

.seat-map-editor-overlay-scrollbar {
  overflow-y: auto;
  scrollbar-gutter: stable;
}

.seat-map-editor-overlay-scrollbar::-webkit-scrollbar {
  width: 8px;
  position: absolute;
}

.seat-map-editor-overlay-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.seat-map-editor-overlay-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
  transition: background-color 0.2s;
}

.seat-map-editor-overlay-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: rgba(0, 0, 0, 0.4);
}

.seat-map-editor-overlay-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.2) transparent;
}

.seat-map-editor-overlay-scrollbar .ant-layout-sider-children {
  overflow: visible !important;

}
.seat-map-editor-modal-fullscreen .ant-layout{
      height: calc(100vh - 115px)!important;
}
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

.seat-map-editor-panel-content {
  padding-right: 16px;
  box-sizing: border-box;
  overflow-x: hidden;
  word-break: break-word;
}

.seat-map-editor-panel-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.seat-map-editor-panel-scrollbar::-webkit-scrollbar-track {
  background: transparent;
  margin: 8px 0;
}

.seat-map-editor-panel-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.15);
  border-radius: 3px;
  transition: background-color 0.2s;
}

.seat-map-editor-panel-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: rgba(0, 0, 0, 0.3);
}

.seat-map-editor-panel-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.15) transparent;
}

.seat-map-editor-panel-content .ant-slider {
  max-width: 100% !important;
}

.seat-map-editor-panel-content .ant-slider-mark {
  max-width: 100% !important;
}

.seat-map-editor-panel-content .ant-slider-mark-text {
  white-space: nowrap !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
}

.seat-map-editor-footer {
  flex-shrink: 0;
}
</style>
