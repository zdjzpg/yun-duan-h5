<script setup lang="ts">
import { computed } from 'vue'
import { LockOutlined, CopyOutlined, InfoCircleOutlined } from '@ant-design/icons-vue'
import type { VenueLockStatus } from '@/types/theater'

const props = withDefaults(
  defineProps<{
    lockStatus: VenueLockStatus
    showCopyButton?: boolean
  }>(),
  {
    showCopyButton: true,
  },
)

const emit = defineEmits<{
  (e: 'copy'): void
}>()

const isLocked = computed(() => props.lockStatus?.isLocked)
</script>

<template>
  <div v-if="isLocked" style="margin-bottom: 16px">
    <a-alert type="warning" show-icon>
      <template #icon>
        <LockOutlined />
      </template>
      <template #message>
        座位结构已锁定
      </template>
      <template #description>
        <a-space direction="vertical" :size="8" style="width: 100%">
          <div v-if="lockStatus.lockReason === 'has_orders'">
            该场馆已产生
            <strong>{{ lockStatus.totalOrders }}</strong>
            个订单，座位结构已被锁定。为了保障已购票用户的权益，禁止进行结构性修改（如增删座位、调整座位坐标）。
          </div>
          <div v-else-if="lockStatus.lockReason === 'has_referenced_shows'">
            该场馆已被多个演出引用，座位结构已被锁定。为了保障演出排期与座位数据一致，禁止进行结构性修改。
          </div>
          <div v-else>
            该场馆的座位结构已被锁定，禁止进行增删座位、调整座位坐标等结构性修改。
          </div>

          <div style="color: #8c8c8c; font-size: 12px">
            <InfoCircleOutlined style="margin-right: 4px" />
            仍允许进行展示级调整：如座位标签、座区颜色等。
          </div>

          <div v-if="showCopyButton">
            <a-button
              type="primary"
              size="small"
              @click="emit('copy')"
            >
              <template #icon>
                <CopyOutlined />
              </template>
              复制场馆创建新版本
            </a-button>
          </div>
        </a-space>
      </template>
    </a-alert>
  </div>
</template>
