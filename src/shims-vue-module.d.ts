declare module 'vue' {
  // 宽松声明：允许传类型参数，但内部都按 any 处理
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function createApp(...args: any[]): any

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function ref<T = any>(value?: T): any

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function reactive<T extends object = any>(value: T): any

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function computed<T = any>(getter: () => T): any

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function watch<T = any>(
    source: any,
     
    cb: (value: T, oldValue: T) => void,
    options?: any,
  ): void

  export function onMounted(fn: () => void): void
  export function onBeforeUnmount(fn: () => void): void
  export function onUnmounted(fn: () => void): void

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function createVNode(...args: any[]): any

  // 给 shims-vue.d.ts 用的组件类型，占位即可
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export type DefineComponent<P = any, S = any, E = any> = any

  // 默认导出也按 any 处理
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Vue: any
  export default Vue
}
