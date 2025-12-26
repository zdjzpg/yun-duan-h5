/**
 * 座位图编辑器 - 历史记录管理（撤销/重做）
 */

import { computed, ref } from 'vue'

export type HistoryEntry<T> = {
  state: T
  timestamp: number
  description?: string
}

export type UseHistoryReturn<T> = {
  state: ReturnType<typeof computed<T>>
  setState: (newState: T | ((prev: T) => T), description?: string) => void
  undo: () => void
  redo: () => void
  canUndo: ReturnType<typeof computed<boolean>>
  canRedo: ReturnType<typeof computed<boolean>>
  clearHistory: () => void
  historySize: ReturnType<typeof computed<number>>
}

export function useHistory<T>(initialState: T, maxSize: number = 50): UseHistoryReturn<T> {
  const history = ref<HistoryEntry<T>[]>([
    {
      state: initialState,
      timestamp: Date.now(),
      description: '初始状态',
    },
  ])

  const currentIndex = ref(0)
  const lastUpdateTime = ref(Date.now())
  const DEBOUNCE_TIME = 300

  const state = computed<T>(() => history.value[currentIndex.value]?.state ?? initialState)

  const setState = (newState: T | ((prev: T) => T), description?: string): void => {
    const now = Date.now()

    const currentState = history.value[currentIndex.value]?.state ?? initialState

    const computedState =
      typeof newState === 'function' ? (newState as (prev: T) => T)(currentState) : newState

    const shouldMerge = now - lastUpdateTime.value < DEBOUNCE_TIME
    lastUpdateTime.value = now

    const current = currentIndex.value
    let newHistory = history.value.slice(0, current + 1)

    if (shouldMerge && newHistory.length > 1) {
      newHistory[newHistory.length - 1] = {
        state: computedState,
        timestamp: now,
        description: description || newHistory[newHistory.length - 1].description,
      }
    } else {
      newHistory.push({
        state: computedState,
        timestamp: now,
        description,
      })

      if (newHistory.length > maxSize) {
        newHistory = newHistory.slice(newHistory.length - maxSize)
        currentIndex.value = maxSize - 1
      } else {
        currentIndex.value = newHistory.length - 1
      }
    }

    history.value = newHistory
  }

  const undo = (): void => {
    const newIndex = Math.max(currentIndex.value - 1, 0)
    if (newIndex !== currentIndex.value) {
      currentIndex.value = newIndex
    }
  }

  const redo = (): void => {
    const newIndex = Math.min(currentIndex.value + 1, history.value.length - 1)
    if (newIndex !== currentIndex.value) {
      currentIndex.value = newIndex
    }
  }

  const clearHistory = (): void => {
    const currentState = history.value[currentIndex.value]?.state ?? initialState
    history.value = [
      {
        state: currentState,
        timestamp: Date.now(),
        description: '初始状态',
      },
    ]
    currentIndex.value = 0
  }

  const canUndo = computed<boolean>(() => currentIndex.value > 0)
  const canRedo = computed<boolean>(() => currentIndex.value < history.value.length - 1)
  const historySize = computed<number>(() => history.value.length)

  return {
    state,
    setState,
    undo,
    redo,
    canUndo,
    canRedo,
    clearHistory,
    historySize,
  }
}
