<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import dayjs from 'dayjs'
import message from 'ant-design-vue/es/message'
import type { ShowFormSession } from '../types'

const props = defineProps<{
  modelValue: ShowFormSession[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: ShowFormSession[]): void
}>()

const sessions = computed({
  get: () => props.modelValue,
  set: (val: ShowFormSession[]) => emit('update:modelValue', val),
} as any)

const batchVisible = ref(false)
const batchForm = reactive<{
  dateRange: [string, string] | []
  weekdays: number[]
  startTime: string | null
  durationMinutes: number | null
  openTime: string | null
}>({
  dateRange: [],
  weekdays: [],
  startTime: null,
  durationMinutes: 90,
  openTime: null,
})

const handleAdd = () => {
  const next: ShowFormSession[] = [
    ...sessions.value,
    {
      date: '',
      startTime: '',
      durationMinutes: 90,
      openTime: '',
    },
  ]
  sessions.value = next
}

const handleRemove = (index: number) => {
  const next = sessions.value.filter((_: ShowFormSession, i: number) => i !== index)
  sessions.value = next
}

const resetBatchForm = () => {
  batchForm.dateRange = []
  batchForm.weekdays = []
  batchForm.startTime = null
  batchForm.durationMinutes = 90
  batchForm.openTime = null
}

const handleBatchGenerate = () => {
  if (!batchForm.dateRange || batchForm.dateRange.length !== 2) {
    message.error('请选择日期范围')
    return
  }
  if (!batchForm.weekdays.length) {
    message.error('请选择星期')
    return
  }
  if (!batchForm.startTime) {
    message.error('请选择开演时间')
    return
  }
  if (!batchForm.durationMinutes || batchForm.durationMinutes <= 0) {
    message.error('请输入演出时长')
    return
  }

  const [start, end] = batchForm.dateRange
  let current = dayjs(start)
  const endDate = dayjs(end)
  const result: ShowFormSession[] = []

  while (current.isBefore(endDate) || current.isSame(endDate, 'day')) {
    const weekday = current.day()
    if (batchForm.weekdays.includes(weekday)) {
      result.push({
        date: current.format('YYYY-MM-DD'),
        startTime: batchForm.startTime,
        durationMinutes: batchForm.durationMinutes,
        openTime: batchForm.openTime || undefined,
      })
    }
    current = current.add(1, 'day')
  }

  if (!result.length) {
    message.warning('未生成任何场次，请检查日期范围和星期选择')
    return
  }

  sessions.value = [...sessions.value, ...result]
  message.success(`批量生成 ${result.length} 个场次`)
  batchVisible.value = false
  resetBatchForm()
}
</script>

<template>
  <div>
    <div style="margin-bottom: 16px; display: flex; justify-content: space-between">
      <a-typography-text type="secondary">
        已添加 {{ sessions.length }} 个场次
      </a-typography-text>
      <div style="display: flex; gap: 8px">
        <a-button @click="batchVisible = true">批量生成</a-button>
        <a-button type="dashed" @click="handleAdd">添加场次</a-button>
      </div>
    </div>

    <a-table
      v-if="sessions.length"
      :data-source="sessions"
      :pagination="false"
      :row-key="(_: any, index: number) => String(index)"
    >
      <a-table-column key="date" :width="'25%'">
        <template #title>演出日期</template>
        <template #default="{ index }">
          <a-form-item
            :name="['sessions', index, 'date']"
            :rules="[{ required: true, message: '请选择演出日期' }]"
            style="margin-bottom: 0"
          >
            <a-date-picker
              v-model:value="sessions[index].date"
              value-format="YYYY-MM-DD"
              style="width: 100%"
              placeholder="选择日期"
            />
          </a-form-item>
        </template>
      </a-table-column>

      <a-table-column key="startTime" :width="'25%'">
        <template #title>开演时间</template>
        <template #default="{ index }">
          <a-form-item
            :name="['sessions', index, 'startTime']"
            :rules="[{ required: true, message: '请选择开演时间' }]"
            style="margin-bottom: 0"
          >
            <a-time-picker
              v-model:value="sessions[index].startTime"
              value-format="HH:mm"
              format="HH:mm"
              style="width: 100%"
              placeholder="选择时间"
            />
          </a-form-item>
        </template>
      </a-table-column>

      <a-table-column key="durationMinutes" :width="'20%'">
        <template #title>演出时长（分钟）</template>
        <template #default="{ index }">
          <a-form-item
            :name="['sessions', index, 'durationMinutes']"
            :rules="[{ required: true, message: '请输入演出时长' }]"
            style="margin-bottom: 0"
          >
            <a-input-number
              v-model:value="sessions[index].durationMinutes"
              :min="1"
              :max="600"
              style="width: 100%"
              placeholder="时长"
            />
          </a-form-item>
        </template>
      </a-table-column>

      <a-table-column key="openTime" :width="'20%'">
        <template #title>开场时间</template>
        <template #default="{ index }">
          <a-form-item :name="['sessions', index, 'openTime']" style="margin-bottom: 0">
            <a-time-picker
              v-model:value="sessions[index].openTime"
              value-format="HH:mm"
              format="HH:mm"
              style="width: 100%"
              placeholder="可选"
            />
          </a-form-item>
        </template>
      </a-table-column>

      <a-table-column key="actions" :width="80" align="right">
        <template #title>操作</template>
        <template #default="{ index }">
          <a-popconfirm
            title="确认删除该场次吗？"
            ok-text="确认"
            cancel-text="取消"
            @confirm="() => handleRemove(index)"
          >
            <a-button type="link" size="small">删除</a-button>
          </a-popconfirm>
        </template>
      </a-table-column>
    </a-table>

    <a-empty v-else description="暂无场次，请点击上方“添加场次”按钮" />

    <a-modal
      v-model:open="batchVisible"
      title="批量生成场次"
      ok-text="生成"
      cancel-text="取消"
      @ok="handleBatchGenerate"
      @cancel="() => { batchVisible = false; resetBatchForm() }"
    >
      <a-form layout="vertical">
        <a-form-item label="日期范围" required>
          <a-range-picker
            v-model:value="(batchForm.dateRange as any)"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </a-form-item>

        <a-form-item label="星期选择" required>
          <a-checkbox-group
            v-model:value="batchForm.weekdays"
            :options="[
              { label: '周一', value: 1 },
              { label: '周二', value: 2 },
              { label: '周三', value: 3 },
              { label: '周四', value: 4 },
              { label: '周五', value: 5 },
              { label: '周六', value: 6 },
              { label: '周日', value: 0 },
            ]"
          />
        </a-form-item>

        <a-form-item label="开演时间" required>
          <a-time-picker
            v-model:value="batchForm.startTime"
            value-format="HH:mm"
            format="HH:mm"
            style="width: 100%"
            placeholder="选择开演时间"
          />
        </a-form-item>

        <a-form-item label="演出时长（分钟）" required>
          <a-input-number
            v-model:value="batchForm.durationMinutes"
            :min="1"
            :max="600"
            style="width: 100%"
            placeholder="请输入演出时长"
          />
        </a-form-item>

        <a-form-item label="开场时间（可选）">
          <a-time-picker
            v-model:value="batchForm.openTime"
            value-format="HH:mm"
            format="HH:mm"
            style="width: 100%"
            placeholder="选择开场时间"
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

