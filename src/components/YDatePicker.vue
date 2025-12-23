<script lang="ts" setup>
import { ref, watch } from 'vue'
import dayjs, { type Dayjs } from 'dayjs'

interface Props {
  value?: Dayjs | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:value', value: Dayjs | null): void
  (e: 'change', value: Dayjs | null, dateString: string): void
}>()

const open = ref(false)

const innerValue = ref<Dayjs | null>(props.value ?? null)

watch(
  () => props.value,
  (val) => {
    innerValue.value = val ?? null
  },
)

watch(
  innerValue,
  (val) => {
    emit('update:value', val)
  },
)

const handleOpenChange = (val: boolean) => {
  open.value = val
}

const handleChange = (val: Dayjs | null, dateString: string) => {
  emit('change', val, dateString)
}

const handleFooterClick = (action: 'close' | 'clear' | 'now') => {
  if (action === 'close') {
    open.value = false
    return
  }
  if (action === 'clear') {
    innerValue.value = null
    return
  }
  if (action === 'now') {
    innerValue.value = dayjs()
  }
}
</script>

<template>
  <a-date-picker
    v-model:value="innerValue"
    :open="open"
    :show-today="false"
    :allow-clear="false"
    v-bind="$attrs"
    @openChange="handleOpenChange"
    @change="handleChange"
  >
    <template #renderExtraFooter>
      <div class="y-date-footer">
        <a-button @click.stop="handleFooterClick('close')" class="button button-close">
          关闭
        </a-button>
        <div>
          <a-button @click.stop="handleFooterClick('clear')" class="button button-clear">
            清空
          </a-button>
          <a-button type="primary" @click.stop="handleFooterClick('now')" class="button button-now">
            现在时间
          </a-button>
        </div>
      </div>
    </template>
  </a-date-picker>
</template>

<style scoped lang="less">
.y-date-footer {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  align-items: center;
  .button {
    height: 28px;
    padding: 0;
    border-radius: 2px;
  }
  .button-close {
    width: 50px;
    border: 1px solid #e5e5e5;
    background: #eee;
    font-weight: normal;
    color: #999;
  }
  .button-clear {
    width: 50px;
    color: #09c;
    border: 1px solid #7fcce5;
    background: #e5f5fa;
  }
  .button-now {
    width: 100px;
    background: #0088dd;
    border: 1px solid #0088dd;
    color: #fff;
    margin-left: 4px;
  }
}
</style>
