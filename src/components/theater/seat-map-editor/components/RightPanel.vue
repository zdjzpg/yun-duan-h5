<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { Floor, Seat, Stage, Zone } from '../types.simplified'
import SeatEditPanel from '../components/SeatEditPanel.vue'
import StageEditPanel from '../components/StageEditPanel.vue'
import ZoneListPanel from '../components/ZoneListPanel.vue'

type SelectedElement =
  | { type: 'seat'; id: string }
  | { type: 'seats'; ids: string[] }
  | { type: 'stage'; id: string }
  | null

const props = defineProps<{
  selectedElement: SelectedElement
  floor?: Floor
  selectedSeats: Seat[]
  selectedStage?: Stage
  zones?: Zone[]
  stage?: Stage
  seats?: Seat[]
  venueId?: string
  currentFloorId?: string
}>()

const emit = defineEmits<{
  (e: 'updateSeatStatus', status: string, disabledReason?: string): void
  (e: 'deleteSeats'): void
  (e: 'createZone'): void
  (e: 'assignToZone', zoneId: string): void
  (e: 'updateStage', stageId: string, updates: Partial<Stage>): void
  (e: 'deleteStage', stageId: string): void
  (e: 'addStage'): void
  (e: 'updateZone', zoneId: string, updates: Partial<Zone>): void
  (e: 'deleteZone', zoneId: string): void
}>()

const activeKey = ref<'seat' | 'stage' | 'zone'>('seat')

watch(
  () => props.selectedElement,
  (el) => {
    if (!el) {
      activeKey.value = 'seat'
      return
    }

    if (el.type === 'seat' || el.type === 'seats') {
      activeKey.value = 'seat'
    } else if (el.type === 'stage') {
      activeKey.value = 'stage'
    } else {
      activeKey.value = 'zone'
    }
  },
)

const hasSeats = computed(() => (props.seats || []).length > 0)

const hasSeatSelection = computed(
  () =>
    !!(
      props.selectedElement &&
      (props.selectedElement.type === 'seat' || props.selectedElement.type === 'seats')
    ),
)

const isMac = computed(
  () => typeof navigator !== 'undefined' && navigator.platform.toUpperCase().includes('MAC'),
)

const modifierKey = computed(() => (isMac.value ? 'Command' : 'Ctrl'))
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
    <div style="margin-bottom: 8px">
      <a-segmented
        v-model:value="activeKey"
        :options="[
          { label: '💺 座位', value: 'seat' },
          { label: '🎭 舞台', value: 'stage' },
          { label: '🏷️ 座区', value: 'zone' },
        ]"
        block
      />
    </div>

    <div style="flex: 1; overflow: auto">
      <!-- 座位 Tab -->
      <template v-if="activeKey === 'seat'">
        <!-- 1）有选中座位：展示编辑面板 -->
        <template v-if="hasSeatSelection">
          <SeatEditPanel
            :selected-seats="selectedSeats"
            :zones="zones || []"
            @update-status="
              (status: string, reason?: string) => emit('updateSeatStatus', status, reason)
            "
            @delete-seats="() => emit('deleteSeats')"
            @create-zone="() => emit('createZone')"
            @assign-to-zone="(zoneId: string) => emit('assignToZone', zoneId)"
          />
        </template>

        <!-- 2）完全没有座位：提示去顶部“生成座位” -->
        <template v-else-if="!hasSeats">
          <div>
            <a-empty :image="undefined" description="暂无座位" style="padding: 24px 0" />
            <div
              style="
                margin-top: 16px;
                padding: 12px 16px;
                background: #f5f5f5;
                border-radius: 8px;
                font-size: 13px;
                color: #595959;
                line-height: 1.6;
                text-align: center;
              "
            >
              💡 在画布顶部操作栏点击
              <strong style="color: #1890ff">「生成座位」</strong>
              按钮，开始创建本场馆的座位。
            </div>
          </div>
        </template>

        <!-- 3）有座位但未选中：提示如何选择座位 -->
        <template v-else>
          <div>
            <a-empty
              :image="undefined"
              description="点击画布上的座位开始编辑"
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
                  <span style="margin-right: 8px; color: #1890ff; font-weight: 500"> 1. </span>
                  <span><strong>点击</strong>单个座位选中</span>
                </div>
                <div style="display: flex; align-items: flex-start">
                  <span style="margin-right: 8px; color: #1890ff; font-weight: 500"> 2. </span>
                  <span>
                    按住 <strong>{{ modifierKey }}</strong> 点击多个座位
                  </span>
                </div>
                <div style="display: flex; align-items: flex-start">
                  <span style="margin-right: 8px; color: #1890ff; font-weight: 500"> 3. </span>
                  <span><strong>拖拽框选</strong>批量选择</span>
                </div>
                <div style="display: flex; align-items: flex-start">
                  <span style="margin-right: 8px; color: #1890ff; font-weight: 500"> 4. </span>
                  <span>
                    <strong>{{ modifierKey }} + A</strong> 全选
                  </span>
                </div>
              </div>
            </div>
          </div>
        </template>
      </template>

      <!-- 舞台 Tab -->
      <template v-else-if="activeKey === 'stage'">
        <StageEditPanel
          :selected-stage="selectedStage"
          :stage="stage"
          @update-stage="(id: string, updates: Partial<Stage>) => emit('updateStage', id, updates)"
          @delete-stage="(id: string) => emit('deleteStage', id)"
          @add-stage="() => emit('addStage')"
        />
      </template>

      <!-- 座区 Tab -->
      <template v-else>
        <ZoneListPanel
          v-if="currentFloorId && zones && seats"
          :venue-id="venueId || ''"
          :current-floor-id="currentFloorId"
          :zones="zones"
          :seats="seats"
          :selected-seat-ids="selectedSeats.map((s: Seat) => s.id)"
          @update-zone="
            (zoneId: string, updates: Partial<Zone>) => emit('updateZone', zoneId, updates)
          "
          @delete-zone="(zoneId: string) => emit('deleteZone', zoneId)"
          @assign-seats-to-zone="(zoneId: string) => emit('assignToZone', zoneId)"
        />
        <div v-else style="padding: 24px 0">
          <a-empty description="暂无座区" />
          <div
            style="
              padding: 12px 16px;
              background: rgb(245, 245, 245);
              border-radius: 8px;
              font-size: 13px;
              color: rgb(89, 89, 89);
              line-height: 1.6;
              text-align: center;
            "
          >
            💡 选择座位后，在右侧面板或右键菜单中创建座区
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
