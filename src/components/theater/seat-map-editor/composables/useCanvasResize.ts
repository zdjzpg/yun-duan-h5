/**
 * 座位图编辑器 - Canvas 尺寸自适应（Vue 版）
 *
 * - 使用 ResizeObserver 监听容器尺寸
 * - 计算可用宽高，并应用最小尺寸保护（800x600）
 * - 初次挂载时立即读取一次尺寸，保证初始画布大小正确
 * - 后续变更通过简单的防抖更新，避免高频重算
 */

import { onMounted, onBeforeUnmount, ref, watch } from 'vue'

export type CanvasSize = {
  width: number
  height: number
}

export function useCanvasResize(
  containerRef: { value: HTMLElement | null },
  padding: number = 0,
  debounceMs: number = 150,
) {
  const size = ref<CanvasSize>({
    width: 1200,
    height: 700,
  })

  let resizeObserver: ResizeObserver | null = null
  let timer: number | null = null

  const updateSize = (width: number, height: number, immediate = false) => {
    const availableWidth = Math.max(800, width - padding * 2)
    const availableHeight = Math.max(600, height - padding * 2)

    const next: CanvasSize = {
      width: availableWidth,
      height: availableHeight,
    }

    if (immediate || debounceMs <= 0) {
      size.value = next
      return
    }

    if (timer !== null) {
      window.clearTimeout(timer)
    }

    timer = window.setTimeout(() => {
      size.value = next
    }, debounceMs)
  }

  const setupObserver = () => {
    const el = containerRef.value
    if (!el || typeof ResizeObserver === 'undefined') return

    resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      const rect = entry.contentRect
      updateSize(rect.width, rect.height, false)
    })

    resizeObserver.observe(el)

    // 初次挂载时立刻计算一次尺寸（不防抖，保证初始值正确）
    const rect = el.getBoundingClientRect()
    updateSize(rect.width, rect.height, true)
  }

  onMounted(() => {
    setupObserver()
  })

  // 如果 ref 指向的元素变化（理论上不会频繁发生），重新绑定观察器
  watch(
    () => containerRef.value,
    () => {
      if (resizeObserver) {
        resizeObserver.disconnect()
        resizeObserver = null
      }
      setupObserver()
    },
  )

  onBeforeUnmount(() => {
    if (resizeObserver) {
      resizeObserver.disconnect()
      resizeObserver = null
    }
    if (timer !== null) {
      window.clearTimeout(timer)
      timer = null
    }
  })

  return size
}
