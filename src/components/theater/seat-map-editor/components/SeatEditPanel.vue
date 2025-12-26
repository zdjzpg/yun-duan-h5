<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  CheckCircleOutlined,
  StopOutlined,
  AppstoreAddOutlined,
  DownOutlined,
  DeleteOutlined,
} from '@ant-design/icons-vue'
import type { VenueSeatStatus, SeatDisabledReason } from '@/types/theater'
import type { Seat, Zone } from '../types.simplified'
import { SEAT_STATUS_COLORS } from '../utils/constants'

const props = defineProps<{
  selectedSeats: Seat[]
  zones?: Zone[]
}>()

const emit = defineEmits<{
  (e: 'update-status', status: VenueSeatStatus, disabledReason?: SeatDisabledReason): void
  (e: 'delete-seats'): void
  (e: 'create-zone'): void
  (e: 'assign-to-zone', zoneId: string): void
}>()

const showDisabledReasonModal = ref(false)
const selectedDisabledReason = ref<SeatDisabledReason>('equipment')

const SEAT_STATUS_OPTIONS = [
  {
    label: '可用',
    value: 'available' as VenueSeatStatus,
    color: SEAT_STATUS_COLORS.available,
    icon: CheckCircleOutlined,
    description: '正常可用座位',
  },
  {
    label: '禁用',
    value: 'disabled' as VenueSeatStatus,
    color: SEAT_STATUS_COLORS.disabled,
    icon: StopOutlined,
    description: '设备占用、维护中、其他原因',
  },
]

const DISABLED_REASON_OPTIONS: { label: string; value: SeatDisabledReason }[] = [
  { label: '设备占用', value: 'equipment' },
  { label: '维护中', value: 'maintenance' },
  { label: '其他', value: 'other' },
]

const hasSelection = computed(() => props.selectedSeats.length > 0)

const currentStatus = computed<VenueSeatStatus | undefined>(() => {
  if (!props.selectedSeats.length) return undefined
  if (props.selectedSeats.length === 1) return props.selectedSeats[0].status
  const first = props.selectedSeats[0].status
  const allSame = props.selectedSeats.every((s: Seat) => s.status === first)
  return allSame ? first : undefined
})

const currentDisabledReason = computed<SeatDisabledReason | undefined>(() => {
  if (props.selectedSeats.length !== 1) return undefined
  const seat = props.selectedSeats[0]
  return seat.status === 'disabled' ? (seat.disabledReason as SeatDisabledReason) : undefined
})

const statusStats = computed(() => {
  const stats: Record<VenueSeatStatus, number> = {
    available: 0,
    disabled: 0,
  }
  props.selectedSeats.forEach((seat: Seat) => {
    if (seat.status in stats) {
      stats[seat.status] += 1
    }
  })
  return stats
})

const disabledReasonStats = computed(() => {
  const stats: Record<SeatDisabledReason, number> = {
    equipment: 0,
    maintenance: 0,
    other: 0,
  }
  props.selectedSeats.forEach((seat: Seat) => {
    if (
      seat.status === 'disabled' &&
      seat.disabledReason &&
      (seat.disabledReason as SeatDisabledReason) in stats
    ) {
      const key = seat.disabledReason as SeatDisabledReason
      stats[key] += 1
    }
  })
  return stats
})

const handleStatusChange = (status: VenueSeatStatus) => {
  if (status === 'disabled') {
    showDisabledReasonModal.value = true
  } else {
    emit('update-status', status)
  }
}

const handleConfirmDisabledReason = () => {
  emit('update-status', 'disabled', selectedDisabledReason.value)
  showDisabledReasonModal.value = false
}

const handleAssignToZone = (zoneId: string) => {
  emit('assign-to-zone', zoneId)
}
</script>

<template>
  <div>
    <!-- 未选中座位 -->
    <div v-if="!hasSelection">
      <a-typography-title :level="5" style="margin-bottom: 12px">
        座位属性
      </a-typography-title>
      <a-empty
        description="选中座位以编辑属性"
        style="padding: 32px 0"
      />
      <div
        style="
          margin-top: 16px;
          padding: 12px 16px;
          background: #f5f5f5;
          border-radius: 8px;
          font-size: 13px;
          color: #595959;
          line-height: 1.6;
        "
      >
        通过画布选中一个或多个座位，然后在这里修改状态或分配座区。
      </div>
    </div>

    <!-- 已选中座位 -->
    <template v-else>
      <!-- 选中座位统计卡片 -->
      <div style="margin-bottom: 20px">
        <a-typography-title :level="5" style="margin-bottom: 8px">
          选中座位
        </a-typography-title>

        <div
          style="
            background: #fafafa;
            padding: 12px;
            border-radius: 6px;
          "
        >
          <div
            style="
              font-size: 16px;
              font-weight: 600;
              color: #262626;
              margin-bottom: 8px;
            "
          >
            {{ selectedSeats.length }} 个座位
          </div>

          <div
            style="
              height: 1px;
              background: #e8e8e8;
              margin: 8px 0;
            "
          />

          <div
            style="
              font-size: 14px;
              color: #595959;
              line-height: 1.6;
            "
          >
            <span v-if="statusStats.available > 0">
              {{ statusStats.available }} 可用
            </span>
            <span
              v-if="statusStats.available > 0 && statusStats.disabled > 0"
              style="margin: 0 6px; color: #d9d9d9"
            >
              ·
            </span>
            <span v-if="statusStats.disabled > 0">
              {{ statusStats.disabled }} 禁用
            </span>
          </div>

          <div
            v-if="selectedSeats.length > 1 && statusStats.disabled > 0"
            style="font-size: 12px; color: #8c8c8c; margin-top: 6px; line-height: 1.6"
          >
            <span v-if="disabledReasonStats.equipment > 0">
              设备占用 {{ disabledReasonStats.equipment }}
            </span>
            <span
              v-if="
                disabledReasonStats.equipment > 0 &&
                (disabledReasonStats.maintenance > 0 || disabledReasonStats.other > 0)
              "
              style="margin: 0 6px; color: #d9d9d9"
            >
              ·
            </span>
            <span v-if="disabledReasonStats.maintenance > 0">
              维护中 {{ disabledReasonStats.maintenance }}
            </span>
            <span
              v-if="
                disabledReasonStats.maintenance > 0 &&
                disabledReasonStats.other > 0
              "
              style="margin: 0 6px; color: #d9d9d9"
            >
              ·
            </span>
            <span v-if="disabledReasonStats.other > 0">
              其他 {{ disabledReasonStats.other }}
            </span>
          </div>

          <div
            v-if="currentDisabledReason"
            style="font-size: 12px; color: #8c8c8c; margin-top: 6px"
          >
            {{
              DISABLED_REASON_OPTIONS.find(
                (o: { label: string; value: SeatDisabledReason }) =>
                  o.value === currentDisabledReason,
              )?.label
            }}
          </div>
        </div>
      </div>

      <!-- 座位状态 -->
      <div style="margin-bottom: 20px">
        <a-typography-title :level="5" style="margin-bottom: 12px">
          座位状态
        </a-typography-title>
        <a-space>
          <a-radio-group
            :value="currentStatus"
            @change="(e: any) => handleStatusChange(e.target.value)"
          >
            <a-radio
              v-for="option in SEAT_STATUS_OPTIONS"
              :key="option.value"
              :value="option.value"
            >
              <a-space>
                <component :is="option.icon" :style="{ color: option.color }" />
                <span>{{ option.label }}</span>
              </a-space>
            </a-radio>
          </a-radio-group>
        </a-space>
      </div>

      <!-- 座区操作 -->
      <div style="margin-bottom: 20px">
        <a-typography-title :level="5" style="margin-bottom: 8px">
          座区操作
        </a-typography-title>
        <a-space
          direction="vertical"
          :size="8"
          style="width: 100%"
        >
          <a-button
            type="primary"
            block
            @click="emit('create-zone')"
          >
            <template #icon>
              <AppstoreAddOutlined />
            </template>
            创建新座区 ({{ selectedSeats.length }})
          </a-button>

          <template v-if="zones">
            <a-dropdown v-if="zones.length">
              <template #overlay>
                <a-menu>
                  <a-menu-item
                    v-for="zone in zones"
                    :key="zone.id"
                    @click="handleAssignToZone(zone.id)"
                  >
                    {{ zone.name }}
                  </a-menu-item>
                </a-menu>
              </template>
              <a-button block>
                分配到座区 ({{ selectedSeats.length }})
                <DownOutlined />
              </a-button>
            </a-dropdown>
            <a-tooltip
              v-else
              title="当前楼层暂无座区，请先创建座区"
            >
              <a-button
                block
                disabled
              >
                分配到座区 ({{ selectedSeats.length }})
                <DownOutlined />
              </a-button>
            </a-tooltip>
          </template>
        </a-space>
      </div>

      <a-divider />

      <a-button
        danger
        block
        @click="emit('delete-seats')"
      >
        <template #icon>
          <DeleteOutlined />
        </template>
        删除选中座位
      </a-button>
    </template>

    <a-modal
      title="请选择禁用原因"
      :open="showDisabledReasonModal"
      @ok="handleConfirmDisabledReason"
      @cancel="() => (showDisabledReasonModal = false)"
      centered
      ok-text="确定"
      cancel-text="取消"
      width="400"
    >
      <div style="padding: 16px 0">
        <a-typography-text
          type="secondary"
          style="display: block; margin-bottom: 16px"
        >
          请选择座位禁用的原因：
        </a-typography-text>
        <a-radio-group
          v-model:value="selectedDisabledReason"
          style="width: 100%"
        >
          <a-space
            direction="vertical"
            size="small"
            style="width: 100%"
          >
            <a-radio
              v-for="option in DISABLED_REASON_OPTIONS"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </a-radio>
          </a-space>
        </a-radio-group>
      </div>
    </a-modal>
  </div>
</template>
