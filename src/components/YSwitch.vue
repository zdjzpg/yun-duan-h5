<template>
  <div class="customForm-field">
    <div class="customForm-control">
      <div class="customForm-control_content">
        <div
          class="custom-switch"
          :class="{
            'is-checked': modelValue,
            'is-disabled': isDisabled,
          }"
          @click="handleChange"
        >
          <span class="switch-text switch-text-left">{{ activeLabel }}</span>
          <span class="switch-text switch-text-right">{{ inactiveLabel }}</span>
          <div class="switch-slider"></div>
        </div>
      </div>
      <FormTip :setting-tip="item.settingTip" :error-msg="item.errorMsg" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

interface SwitchItem {
  value?: boolean
  label?: string
  required?: boolean
  disabled?: boolean
  activeText?: string
  inactiveText?: string
  settingTip?: string
  errorMsg?: string
}

interface Props {
  item?: SwitchItem
  checked?: boolean
  disabled?: boolean
  activeText?: string
  inactiveText?: string
}

const props = withDefaults(defineProps<Props>(), {
  item: () => ({} as SwitchItem),
  checked: undefined,
  disabled: false,
  activeText: '启用',
  inactiveText: '禁用',
})

const emit = defineEmits([
  'update:checked',
  'change',
  'changeAndNotify',
  'update:item',
])

const isDisabled = computed(() => props.disabled || props.item?.disabled)

const modelValue = ref<boolean>(
  props.checked !== undefined ? props.checked : !!props.item?.value,
)

watch(
  () => [props.checked, props.item?.value] as const,
  ([checked, itemValue]) => {
    if (checked !== undefined) {
      modelValue.value = checked
    } else {
      modelValue.value = !!itemValue
    }
  },
)

const activeLabel = computed(() => props.item?.activeText ?? props.activeText)
const inactiveLabel = computed(() => props.item?.inactiveText ?? props.inactiveText)

const item = computed(() => props.item || ({} as SwitchItem))

const handleChange = () => {
  if (isDisabled.value) return
  const next = !modelValue.value

  if (props.checked !== undefined) {
    emit('update:checked', next)
    emit('change', next)
  } else {
    const nextItem: SwitchItem = { ...(props.item || {}), value: next }
    emit('update:item', nextItem)
    emit('changeAndNotify', nextItem)
  }

  modelValue.value = next
}
</script>

<style lang="less" scoped>
.custom-switch {
  box-sizing: border-box;
  position: relative;
  display: inline-flex;
  align-items: center;
  width: 68px;
  height: 24px;
  border-radius: 2px;
  border: 1px solid #ccc;
  background: #ccc;
  cursor: pointer;
  overflow: hidden;

  .switch-slider {
    position: absolute;
    top: 0;
    left: 0;
    background-color: var(--color-primary-light-1);
    transform: translateX(0%);
    width: 33px;
    height: 22px;
    background: white;
    transition: transform 0.5s ease;
  }

  .switch-text {
    position: relative;
    z-index: 1;
    width: 50%;
    text-align: center;
    font-size: 12px;
    line-height: 30px;
    color: #fff;
  }

  &.is-checked {
    border: 1px solid #08d;
    background: #08d;

    .switch-slider {
      left: 0.5px;
      transform: translateX(100%);
    }

    .switch-text-left {
      color: #fff;
    }
  }

  &.is-disabled {
    cursor: not-allowed;
    opacity: 0.7;

    .switch-slider {
      background-color: var(--color-fill-3);
    }

    .switch-text {
      color: var(--color-text-4);
    }
  }
}
</style>
