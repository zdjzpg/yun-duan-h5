<script lang="ts" setup>
import { ref, watch } from 'vue'
import dayjs, { type Dayjs } from 'dayjs'
import YDatePicker from './YDatePicker.vue'

interface Props {
  value?: [Dayjs | null, Dayjs | null] | null
  separator?: string
  disabled?: boolean
  format?: string
}

const props = withDefaults(defineProps<Props>(), {
  separator: '至',
  disabled: false,
  format: 'YYYY-MM-DD',
})

const emit = defineEmits<{
  (e: 'update:value', value: [Dayjs | null, Dayjs | null] | null): void
  (e: 'change', value: [Dayjs | null, Dayjs | null] | null, dateStrings: [string, string]): void
}>()

const initialRange: [Dayjs | null, Dayjs | null] = props.value ?? [null, null]

const rangeValue = ref<[Dayjs | null, Dayjs | null]>([initialRange[0], initialRange[1]])

const startValue = ref<Dayjs | null>(initialRange[0])
const endValue = ref<Dayjs | null>(initialRange[1])

watch(
  () => props.value,
  (val) => {
    const next: [Dayjs | null, Dayjs | null] = val ?? [null, null]
    rangeValue.value = [next[0], next[1]]
    startValue.value = next[0]
    endValue.value = next[1]
  },
  { deep: true },
)

const formatDate = (val: Dayjs | null): string => (val ? val.format(props.format) : '')

const emitRangeChange = (next: [Dayjs | null, Dayjs | null]) => {
  rangeValue.value = [next[0], next[1]]
  startValue.value = next[0]
  endValue.value = next[1]
  emit('update:value', next)
  emit('change', next, [formatDate(next[0]), formatDate(next[1])])
}

const handleStartChange = (val: Dayjs | null) => {
  const [, end] = rangeValue.value
  let nextStart = val
  let nextEnd = end

  if (val && end && val.isAfter(end, 'day')) {
    nextEnd = val
  }

  const next: [Dayjs | null, Dayjs | null] = [nextStart, nextEnd]
  emitRangeChange(next)
}

const handleEndChange = (val: Dayjs | null) => {
  const [start] = rangeValue.value
  let nextStart = start
  let nextEnd = val

  if (start && val && val.isBefore(start, 'day')) {
    nextStart = val
  }

  const next: [Dayjs | null, Dayjs | null] = [nextStart, nextEnd]
  emitRangeChange(next)
}
</script>

<template>
  <div class="y-date-range">
    <YDatePicker
      v-model:value="startValue"
      :disabled="disabled"
      class="y-date-range-picker"
      @change="handleStartChange"
      v-bind="$attrs"
      placeholder="开始日期"
    />
    <span class="y-date-range-separator">
      {{ separator }}
    </span>
    <YDatePicker
      v-model:value="endValue"
      :disabled="disabled"
      class="y-date-range-picker"
      @change="handleEndChange"
      v-bind="$attrs"
      placeholder="结束日期"
    />
  </div>
</template>

<style scoped lang="less">
.y-date-range {
  display: inline-flex;
  align-items: center;

  .y-date-range-picker {
    width: 216px;
  }

  .y-date-range-separator {
    margin: 0 8px;
    color: #555;
  }
}
</style>
