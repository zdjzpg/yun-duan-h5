<script setup lang="ts">
import { computed, ref } from 'vue'
import dayjs from 'dayjs'
import type { SessionConfig } from '../types'
import AddSessionModal from '../AddSessionModal.vue'

const props = defineProps<{
  modelValue: SessionConfig[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: SessionConfig[]): void
}>()

const sessionConfigs = computed<SessionConfig[]>({
  get: () => props.modelValue || [],
  set: (val: SessionConfig[]) => emit('update:modelValue', val),
} as any)

const modalVisible = ref(false)
const editingIndex = ref<number | null>(null)
const editingConfig = ref<SessionConfig | undefined>(undefined)

const totalSessionCount = computed(() =>
  (sessionConfigs.value || []).reduce(
    (sum: number, config: SessionConfig) => sum + (config.sessions?.length || 0),
    0,
  ),
)

const handleAdd = () => {
  editingIndex.value = null
  editingConfig.value = undefined
  modalVisible.value = true
}

const handleEdit = (index: number) => {
  const config = sessionConfigs.value[index]
  if (!config) return
  editingIndex.value = index
  editingConfig.value = config
  modalVisible.value = true
}

const handleDelete = (index: number) => {
  const next = [...sessionConfigs.value]
  next.splice(index, 1)
  sessionConfigs.value = next
}

const getDateRangeText = (sessions: { date?: string }[]) => {
  if (!sessions || !sessions.length) return '-'

  const dates = sessions
    .map((s) => dayjs(s.date))
    .sort((a, b) => a.valueOf() - b.valueOf())
  const first = dates[0]?.format('YYYY-MM-DD')
  const last = dates[dates.length - 1]?.format('YYYY-MM-DD')
  if (!first || !last) return '-'

  return first === last ? first : `${first} ~ ${last}`
}

const getStartTimesText = (sessions: { startTime?: string }[]) => {
  if (!sessions || !sessions.length) return '-'

  const times = sessions.map((s) => s.startTime)
  const unique = Array.from(new Set(times.filter((t): t is string => !!t))).sort()

  if (!unique.length) return '-'
  if (unique.length > 3) {
    return `${unique.slice(0, 3).join(', ')} 等${unique.length}个时间`
  }
  return unique.join(', ')
}

const getDurationText = (sessions: { durationMinutes?: number }[]) => {
  if (!sessions || !sessions.length) return '-'

  const durations = Array.from(
    new Set(
      sessions
        .map((s) => s.durationMinutes)
        .filter((d: number | undefined) => typeof d === 'number'),
    ),
  ) as number[]

  if (!durations.length) return '-'
  if (durations.length === 1) return `${durations[0]}`
  return `${Math.min(...durations)}-${Math.max(...durations)}`
}

const formatPriceValue = (value?: number) => {
  if (typeof value !== 'number' || Number.isNaN(value)) return '未定价'
  return `¥${value.toFixed(2)}`
}

const getPriceTierTooltipLines = (tiers?: SessionConfig['priceTiers']) => {
  if (!tiers || !tiers.length) {
    return ['暂无票档']
  }
  return tiers.map((tier) => `${tier.name || '未命名'} · ${formatPriceValue(tier.price)}`)
}

const handleModalOk = (config: SessionConfig) => {
  const list = [...sessionConfigs.value]
  if (editingIndex.value !== null && editingIndex.value >= 0) {
    list[editingIndex.value] = config
  } else {
    list.push(config)
  }
  sessionConfigs.value = list
  modalVisible.value = false
}

const handleModalCancel = () => {
  modalVisible.value = false
}
</script>

<template>
  <div>
    <a-alert
      type="info"
      show-icon
      style="margin-bottom: 16px"
      message="支持配置多个场馆，每个场馆可配置多个场次和多个票档"
    />

    <div style="margin-bottom: 16px; display: flex; justify-content: space-between">
      <a-typography-text type="secondary">
        已添加 {{ sessionConfigs.length }} 个场馆配置，共 {{ totalSessionCount }} 个场次
      </a-typography-text>
      <a-button type="primary" @click="handleAdd">添加场次配置</a-button>
    </div>

    <a-table
      v-if="sessionConfigs.length"
      :data-source="
        sessionConfigs.map((config: SessionConfig, index: number) => ({
          ...config,
          key: index,
          index,
        }))
      "
      :pagination="false"
      :row-key="(record: any) => String(record.key)"
      :scroll="{ x: 'max-content' }"
    >
      <a-table-column key="venueName" :width="180" fixed="left">
        <template #title>场馆</template>
        <template #default="{ record }">
          <div>
            <div>{{ record.venueName || '未知场馆' }}</div>
            <a-typography-text v-if="record.venueCapacityType" type="secondary" style="font-size: 12px">
              <template v-if="record.venueCapacityType === 'precise_seat'">
                精确座位
              </template>
              <template v-else-if="record.venueCapacityType === 'zone_capacity'">
                按座区数量
              </template>
              <template v-else-if="record.venueCapacityType === 'free_seating'">
                自由站席
              </template>
            </a-typography-text>
          </div>
        </template>
      </a-table-column>

      <a-table-column key="dateRange" :width="220">
        <template #title>演出日期</template>
        <template #default="{ record }">
          {{ getDateRangeText(record.sessions || []) }}
        </template>
      </a-table-column>

      <a-table-column key="startTimes" :width="200">
        <template #title>开演时间</template>
        <template #default="{ record }">
          {{ getStartTimesText(record.sessions || []) }}
        </template>
      </a-table-column>

      <a-table-column key="duration" :width="120" align="right">
        <template #title>时长(分钟)</template>
        <template #default="{ record }">
          {{ getDurationText(record.sessions || []) }}
        </template>
      </a-table-column>

      <a-table-column key="configStats" :width="220">
        <template #title>配置统计</template>
        <template #default="{ record }">
          <a-space :size="8">
            <a-tooltip>
              <template #title>
                <div class="session-price-tier-tooltip">
                  <div
                    v-for="(line, idx) in getPriceTierTooltipLines(record.priceTiers)"
                    :key="idx"
                    class="session-price-tier-tooltip__line"
                  >
                    {{ line }}
                  </div>
                </div>
              </template>
              <a-tag :color="(record.priceTiers || []).length > 0 ? 'success' : 'default'">
                {{ (record.priceTiers || []).length }} 个票档
              </a-tag>
            </a-tooltip>
            <a-tag color="blue">
              {{ (record.sessions || []).length }} 个场次
            </a-tag>
          </a-space>
        </template>
      </a-table-column>

      <a-table-column key="actions" :width="120" fixed="right" align="right">
        <template #title>操作</template>
        <template #default="{ record }">
          <a-space :size="8">
            <a-button type="link" size="small" @click="handleEdit(record.index)">
              编辑
            </a-button>
            <a-popconfirm
              title="确认删除该场次配置吗？"
              :description="`将删除 ${record.sessions?.length || 0} 个场次`"
              ok-text="确认"
              cancel-text="取消"
              ok-type="danger"
              @confirm="() => handleDelete(record.index)"
            >
              <a-button type="link" size="small">删除</a-button>
            </a-popconfirm>
          </a-space>
        </template>
      </a-table-column>
    </a-table>

    <a-empty
      v-else
      description="暂无场次配置，请点击上方“添加场次配置”按钮"
      style="margin: 32px 0"
    />

    <AddSessionModal
      v-model:visible="modalVisible"
      :initial-values="editingConfig"
      :existing-configs="sessionConfigs"
      @ok="handleModalOk"
      @cancel="handleModalCancel"
    />
  </div>
</template>

<style scoped>
.session-price-tier-tooltip {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.session-price-tier-tooltip__line {
  white-space: nowrap;
}
</style>
