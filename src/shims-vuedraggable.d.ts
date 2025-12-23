declare module 'vuedraggable' {
  // 使用 any 避免模板插槽类型检查报错（如 #item）
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const component: any
  export default component
}
