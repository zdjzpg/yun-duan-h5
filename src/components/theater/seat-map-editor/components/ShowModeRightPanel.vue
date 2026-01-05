<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  CheckCircleOutlined,
  StopOutlined,
  WarningOutlined,
  AppstoreAddOutlined,
} from '@ant-design/icons-vue'
import type { Seat, PriceTier } from '../types.simplified'

const props = defineProps<{
  selectedSeats: Seat[]
  priceTiers: PriceTier[]
}>()

const emit = defineEmits<{
  (e: 'assignPriceTier', priceTierId: string): void
  (e: 'clearPriceTier'): void
  (e: 'cancelSelection'): void
  (e: 'updateShowSeatStatus', isDisabled: boolean, reason?: string): void
  (e: 'createPriceTier'): void
}>()

type ShowDisabledReason = 'vip_reserved' | 'equipment' | 'staged_release' | 'maintenance' | 'other'

const showDisabledReasonModal = ref(false)
const selectedDisabledReason = ref<ShowDisabledReason>('vip_reserved')

const DISABLED_REASON_OPTIONS: { label: string; value: ShowDisabledReason }[] = [
  { label: 'VIP 预留', value: 'vip_reserved' },
  { label: '设备占用', value: 'equipment' },
  { label: '分批开售', value: 'staged_release' },
  { label: '维护中', value: 'maintenance' },
  { label: '其他', value: 'other' },
]

const hasSelection = computed(() => props.selectedSeats.length > 0)

const statusStats = computed(() => {
  const stats = {
    available: 0,
    disabled: 0,
    sold: 0,
  }

  props.selectedSeats.forEach((seat: Seat) => {
    if (seat.isSold) {
      stats.sold += 1
    } else if (seat.isShowDisabled || seat.status === 'disabled') {
      stats.disabled += 1
    } else {
      stats.available += 1
    }
  })

  return stats
})

const currentShowStatus = computed<'available' | 'disabled'>(() => {
  if (!props.selectedSeats.length) return 'available'
  const firstDisabled = !!props.selectedSeats[0].isShowDisabled
  const allSame = props.selectedSeats.every((s: Seat) => !!s.isShowDisabled === firstDisabled)
  if (allSame && firstDisabled) return 'disabled'
  if (allSame && !firstDisabled) return 'available'
  return 'available'
})

const selectedPriceTierId = ref<string | undefined>(undefined)

const handleShowStatusChange = (value: 'available' | 'disabled') => {
  if (value === 'disabled') {
    showDisabledReasonModal.value = true
  } else {
    emit('updateShowSeatStatus', false)
  }
}

const handleConfirmDisabledReason = () => {
  emit('updateShowSeatStatus', true, selectedDisabledReason.value)
  showDisabledReasonModal.value = false
}

const handleAssignPriceTier = () => {
  if (!selectedPriceTierId.value) return
  emit('assignPriceTier', selectedPriceTierId.value)
}

const handleClearPriceTier = () => {
  emit('clearPriceTier')
}

const handleCancelSelection = () => {
  emit('cancelSelection')
}
</script>

<template>
  <div
    class="seat-map-editor-panel-content"
    style="
      display: flex;
      flex-direction: column;
      height: 100%;
      padding-right: 16px;
      box-sizing: border-box;
      overflow-x: hidden;
      word-break: break-word;
    "
  >
    <div style="flex: 1; overflow: auto">
      <!-- 未选中座位：展示引导 -->
      <template v-if="!hasSelection">
        <span
          :level="5"
          style="
            margin-bottom: 8px;
            color: rgba(38, 38, 38, 0.88);
            font-weight: 600;
            font-size: 16px;
          "
        >
          选择座位
        </span>

        <a-empty
          :image="undefined"
          description="选择画布上的座位开始配置票档"
          style="padding: 24px 0"
        />

        <div
          style="
            margin-top: 16px;
            background: #f5f5f5;
            padding: 12px 16px;
            border-radius: 8px;
            font-size: 13px;
            line-height: 1.8;
          "
        >
          <div style="color: #262626; margin-bottom: 8px; font-weight: 500">
            💡 选择座位的四种方法：
          </div>
          <div style="color: #595959; display: flex; flex-direction: column; gap: 6px">
            <div style="display: flex; align-items: flex-start">
              <span style="margin-right: 8px; color: #1890ff; font-weight: 500">1.</span>
              <span><strong>点击</strong>单个座位选择</span>
            </div>
            <div style="display: flex; align-items: flex-start">
              <span style="margin-right: 8px; color: #1890ff; font-weight: 500">2.</span>
              <span>按住 <strong>Ctrl/Command</strong> 点击多个座位</span>
            </div>
            <div style="display: flex; align-items: flex-start">
              <span style="margin-right: 8px; color: #1890ff; font-weight: 500">3.</span>
              <span><strong>拖拽框选</strong>批量选择</span>
            </div>
            <div style="display: flex; align-items: flex-start">
              <span style="margin-right: 8px; color: #1890ff; font-weight: 500">4.</span>
              <span><strong>Ctrl/Command + A</strong> 全选当前楼层座位</span>
            </div>
          </div>
        </div>
      </template>

      <!-- 已选中座位：展示统计与操作 -->
      <template v-else>
        <!-- 选中座位统计 -->
        <div style="margin-bottom: 20px">
          <span :level="5" style="margin-bottom: 8px"> 选中座位 </span>

          <div style="background: #fafafa; padding: 12px; border-radius: 6px">
            <div style="font-size: 16px; font-weight: 600; color: #262626; margin-bottom: 8px">
              {{ selectedSeats.length }} 个座位
            </div>

            <div style="height: 1px; background: #e8e8e8; margin: 8px 0" />

            <div style="font-size: 14px; color: #595959; line-height: 1.6">
              <span v-if="statusStats.available > 0"> {{ statusStats.available }} 可用 </span>
              <span
                v-if="
                  statusStats.available > 0 && (statusStats.disabled > 0 || statusStats.sold > 0)
                "
                style="margin: 0 6px; color: #d9d9d9"
              >
                ·
              </span>
              <span v-if="statusStats.disabled > 0"> {{ statusStats.disabled }} 禁用 </span>
              <span
                v-if="statusStats.disabled > 0 && statusStats.sold > 0"
                style="margin: 0 6px; color: #d9d9d9"
              >
                ·
              </span>
              <span v-if="statusStats.sold > 0"> {{ statusStats.sold }} 已售 </span>
            </div>
          </div>
        </div>

        <!-- 演出级状态 -->
        <div style="margin-bottom: 20px">
          <span :level="5" style="margin-bottom: 12px"> 演出级状态 </span>

          <a-radio-group
            :value="currentShowStatus"
            @change="(e: any) => handleShowStatusChange(e.target.value)"
          >
            <a-space direction="vertical" :size="8">
              <a-radio value="available">
                <a-space>
                  <CheckCircleOutlined style="color: #52c41a" />
                  <span>可用</span>
                </a-space>
              </a-radio>
              <a-radio value="disabled">
                <a-space>
                  <StopOutlined style="color: #ff4d4f" />
                  <span>演出级禁用</span>
                  <a-tooltip title="不会影响场馆级禁用，仅对当前演出生效">
                    <WarningOutlined style="color: #faad14" />
                  </a-tooltip>
                </a-space>
              </a-radio>
            </a-space>
          </a-radio-group>
        </div>

        <!-- 票档操作 -->
        <div style="margin-bottom: 20px">
          <span :level="5" style="margin-bottom: 12px"> 票档操作 </span>

          <a-space direction="vertical" :size="8" style="width: 100%">
            <a-space style="width: 100%">
              <a-select
                v-model:value="selectedPriceTierId"
                placeholder="选择票档"
                style="flex: 1"
                :options="priceTiers.map((pt: PriceTier) => ({ label: pt.name, value: pt.id }))"
                :dropdown-match-select-width="false"
              />
              <a-button
                type="primary"
                :disabled="!selectedPriceTierId"
                @click="handleAssignPriceTier"
              >
                分配到票档 ({{ selectedSeats.length }})
              </a-button>
            </a-space>

            <a-space :size="8">
              <a-button type="link" @click="handleClearPriceTier"> 清除票档 </a-button>
              <a-button type="link" @click="emit('createPriceTier')">
                <template #icon>
                  <AppstoreAddOutlined />
                </template>
                新建票档
              </a-button>
              <a-button type="link" @click="handleCancelSelection"> 取消选择 </a-button>
            </a-space>
          </a-space>
        </div>
      </template>
    </div>

    <!-- 禁用原因弹窗 -->
    <a-modal
      title="请选择演出级禁用原因"
      :open="showDisabledReasonModal"
      @ok="handleConfirmDisabledReason"
      @cancel="() => (showDisabledReasonModal = false)"
      centered
      ok-text="确定"
      cancel-text="取消"
      width="400"
    >
      <div style="padding: 16px 0">
        <a-typography-text type="secondary" style="display: block; margin-bottom: 16px">
          请选择演出级禁用的原因：
        </a-typography-text>
        <a-radio-group v-model:value="selectedDisabledReason" style="width: 100%">
          <a-space direction="vertical" size="small" style="width: 100%">
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
