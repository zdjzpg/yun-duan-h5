<script setup lang="ts">
export type ActionConfig = {
  label: string
  type?: 'primary' | 'default' | 'dashed' | 'link' | 'text'
  icon?: any
  onClick?: () => void
  disabled?: boolean
  danger?: boolean
}

const props = withDefaults(
  defineProps<{
    actions?: ActionConfig[]
  }>(),
  {
    actions: () => [],
  },
)
</script>

<template>
  <div class="list-page-layout">
    <div class="list-page-layout__header" v-if="props.actions.length || $slots.filters">
      <div class="list-page-layout__actions" v-if="props.actions.length">
        <a-space :size="12">
          <template v-for="(action, index) in props.actions" :key="index">
            <a-button
              :type="action.type"
              :danger="action.danger"
              :disabled="action.disabled"
              @click="action.onClick && action.onClick()"
            >
              <template v-if="action.icon" #icon>
                <component :is="action.icon" />
              </template>
              {{ action.label }}
            </a-button>
          </template>
        </a-space>
      </div>
      <div class="list-page-layout__filters" v-if="$slots.filters">
        <slot name="filters" />
      </div>
    </div>

    <div class="list-page-layout__content">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.list-page-layout {
  background: #ffffff;
  border-radius: 2px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.list-page-layout__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.list-page-layout__filters {
  display: flex;
  align-items: center;
  gap: 12px;
}
</style>

