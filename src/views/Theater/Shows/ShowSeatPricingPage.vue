<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import message from 'ant-design-vue/es/message'
import SeatMapEditor from '@/components/theater/seat-map-editor/SeatMapEditor.vue'
import type {
  TheaterData,
  Seat,
  Zone,
  Floor,
  Stage,
  PriceTier as EditorPriceTier,
} from '@/components/theater/seat-map-editor/types.simplified'
import type { ShowPriceTier } from '@/api/endpoints/theater/types'
import { fetchShowDetail } from '@/api/show'
import { fetchVenueDetail, type Venue } from '@/api/theaterVenue'

const route = useRoute()
const router = useRouter()
const showId = (route.params.id as string) || 'show-1'

const loading = ref(false)
const theaterData = ref<TheaterData | null>(null)
const latestData = ref<TheaterData | null>(null)

const loadData = async () => {
  loading.value = true
  try {
    // 1. 读取演出详情，拿到绑定的场馆
    const showDetail = await fetchShowDetail(showId)
    const show = showDetail.show

    let floors: Floor[] = []
    let seats: Seat[] = []
    let zones: Zone[] = []
    let stage: Stage | undefined

    // 2. 读取场馆座位图（与 a 项目保持一致）
    if (show.venueId) {
      const venue: Venue = await fetchVenueDetail(show.venueId)

      floors = (((venue as any).floors || []) as Floor[]) || []

      const rawSeats = (((venue as any).seats || []) as Seat[]) || []
      // 票档配置页只按票档颜色着色，不再按座区颜色着色
      seats = rawSeats.map((seat: Seat) => ({
        ...seat,
        zoneColor: undefined,
      }))

      zones =
        (venue.zones || []).map((z: any, index: number) => ({
          id: z.id,
          venueId: z.venueId,
          floorId: z.floorId || floors[0]?.id || '',
          name: z.name,
          shortName: z.shortName,
          color: z.color || '#1890ff',
          order: (z as any).order ?? z.sort ?? index + 1,
        })) || []

      const stageConfig = (venue as any).seatMapConfig?.stage
      if (stageConfig) {
        stage = {
          id: stageConfig.id || 'stage-1',
          name: stageConfig.name || '舞台方向',
          x: stageConfig.x ?? 0,
          y: stageConfig.y ?? -300,
          width: stageConfig.width ?? 480,
          height: stageConfig.height ?? 40,
          angle: (stageConfig as any).angle,
          color: stageConfig.color || '#dedede',
          shape: stageConfig.shape || 'trapezoid',
        }
      }
    }

    // 如果当前演出还没有关联精确座位场馆，兜底为一块空画布，避免编辑器报错
    if (!floors.length || !seats.length) {
      floors = [
        {
          id: 'F1',
          name: '1F',
          level: 1,
        },
      ] as any
      seats = []
      zones = []
      stage =
        stage ||
        ({
          id: 'stage-1',
          name: '舞台方向',
          x: 0,
          y: -300,
          width: 480,
          height: 40,
          shape: 'trapezoid',
          color: '#dedede',
        } as Stage)
    }

    // 3. 使用演出详情里的票档配置（与 a 项目 show-001 数据保持一致）
    let showPriceTiers: ShowPriceTier[] = (showDetail as any).priceTiers || []

    // 夜游山水实景演出示例：票档只展示 A 区 / B 区，VIP 不出现在票档列表
    if (showId === 'show-001') {
      const filtered = showPriceTiers.filter((t) => !t.zoneIds?.includes('zone-001'))

      // 如果后端只返回了部分票档，这里补全 A 区 / B 区的示例票档，保证与 a 项目一致
      if (filtered.length >= 2) {
        showPriceTiers = filtered
      } else {
        showPriceTiers = [
          {
            id: 'tier-002',
            showId: 'show-001',
            name: 'A 区',
            price: 480,
            zoneIds: ['zone-002'],
            color: '#FF6B6B',
            remark: undefined,
            createdAt: '2025-11-01',
            updatedAt: '2025-11-01',
          },
          {
            id: 'tier-003',
            showId: 'show-001',
            name: 'B 区',
            price: 280,
            zoneIds: ['zone-003'],
            color: '#4ECDC4',
            remark: undefined,
            createdAt: '2025-11-01',
            updatedAt: '2025-11-01',
          },
        ]
      }
    }

    // 根据座区推导票档所在楼层：zoneId -> floorId
    const zoneFloorMap = new Map<string, string>()
    zones.forEach((z) => {
      if (z.floorId) {
        zoneFloorMap.set(z.id, z.floorId)
      }
    })

    const editorPriceTiers: EditorPriceTier[] = showPriceTiers.map((t, index) => {
      const zoneId = t.zoneIds && t.zoneIds.length ? t.zoneIds[0] : undefined
      const floorId = zoneId ? zoneFloorMap.get(zoneId) : undefined

      return {
        id: t.id,
        showId: t.showId,
        floorId,
        zoneId,
        name: t.name,
        price: t.price,
        color: t.color || '#1890ff',
        remark: t.remark,
        order: index,
      }
    })

    const base: TheaterData = {
      id: `theater-${showId}`,
      name: `${show.venueName || show.name} - 票档配置`,
      venueId: show.venueId,
      floors,
      // 座位直接使用场馆数据；演出模式下编辑器内部会按 zoneId 自动分配到对应票档
      seats,
      stage,
      zones,
      priceTiers: editorPriceTiers,
      metadata: {
        createdAt: new Date().toISOString(),
      },
    }

    theaterData.value = base
    latestData.value = base
  } catch (error) {
    console.error('加载票档配置数据失败:', error)
    message.error('加载票档配置数据失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})

const handleEditorChange = (data: TheaterData) => {
  latestData.value = data
}

const handleCancel = () => {
  router.push(`/dashboard/theater/shows/${showId}`)
}

const handleFinish = () => {
  router.push(`/dashboard/theater/shows/${showId}`)
}
</script>

<template>
  <div class="show-seat-pricing-page">
    <div class="show-seat-pricing-page__editor-wrapper">
      <a-spin :spinning="loading">
        <div class="show-seat-pricing-page__editor">
          <SeatMapEditor
            v-if="theaterData"
            :is-in-modal="true"
            :initial-data="latestData || theaterData"
            mode="show"
            @change="handleEditorChange"
          />
        </div>
      </a-spin>
    </div>

    <div class="show-seat-pricing-page__footer">
      <a-button @click="handleCancel">取消</a-button>
      <a-button type="primary" @click="handleFinish">完成</a-button>
    </div>
  </div>
</template>

<style scoped>
.show-seat-pricing-page {
  height: 100vh;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.show-seat-pricing-page__editor-wrapper {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.show-seat-pricing-page__editor {
  height: 100%;
}

.show-seat-pricing-page__editor-wrapper :deep(.ant-spin-nested-loading) {
  height: 100%;
}

.show-seat-pricing-page__editor-wrapper :deep(.ant-spin-container) {
  height: 100%;
}

.show-seat-pricing-page__footer {
  flex-shrink: 0;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
  padding: 8px 24px 16px;
  background: #ffffff;
  border-top: 1px solid #f0f0f0;
}
</style>
