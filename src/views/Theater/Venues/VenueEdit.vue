<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import message from 'ant-design-vue/es/message'
import { useRoute, useRouter } from 'vue-router'
import { fetchVenueDetail, updateVenue, type UpdateVenueRequest } from '@/api/theaterVenue'
import type { TheaterData } from '@/components/theater/seat-map-editor/types.simplified'
import type { VenueLockStatus } from '@/types/theater'
import { checkVenueLockStatus } from '@/api/endpoints/theater/venue-lock'
import FormPageLayout from '@/components/layouts/FormPageLayout.vue'
import VenueForm, { type VenueFormValues } from './VenueForm.vue'
import VenueLockAlert from '@/components/theater/VenueLockAlert.vue'
import CopyVenueModal from '@/components/theater/CopyVenueModal.vue'

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const submitting = ref(false)
const initialValues = ref<VenueFormValues | undefined>(undefined)
const capacityType = ref<string>('free_seating')

const formRef = ref<InstanceType<typeof VenueForm> | null>(null)
const lockStatus = ref<VenueLockStatus | null>(null)
const copyModalVisible = ref(false)

const venueId = computed(() => route.params.id as string)

const loadDetail = async () => {
  const id = venueId.value
  if (!id) {
    router.replace('/dashboard/theater/venues')
    return
  }

  try {
    loading.value = true
    const detail = await fetchVenueDetail(id)

    capacityType.value = detail.capacityType

    if (detail.capacityType === 'precise_seat') {
      const preciseSeats: TheaterData = {
        id: detail.id,
        name: detail.name,
        floors: (detail as any).floors || [],
        zones: (detail.zones || []).map((z: any, index: number) => ({
          id: z.id,
          venueId: z.venueId,
          floorId: z.floorId || '',
          name: z.name,
          shortName: z.shortName,
          color: z.color || '#1890ff',
          order: (z as any).order ?? z.sort ?? index + 1,
        })),
        seats: (detail as any).seats || [],
        stage: (detail as any).seatMapConfig?.stage,
        metadata: {
          createdAt: detail.createdAt,
          updatedAt: detail.updatedAt,
        },
      }

      initialValues.value = {
        name: detail.name,
        type: detail.type,
        scenicId: detail.scenicId,
        address: detail.address,
        description: detail.description,
        capacityType: detail.capacityType,
        preciseSeats,
      }
    } else {
      initialValues.value = {
        name: detail.name,
        type: detail.type,
        scenicId: detail.scenicId,
        address: detail.address,
        description: detail.description,
        capacityType: detail.capacityType,
        totalCapacity: detail.totalCapacity,
        zones: detail.zones
          ? detail.zones.map((z) => ({
              id: z.id,
              name: z.name,
              capacity: z.capacity || 0,
              sort: z.sort,
            }))
          : [],
      }
    }

    // 加载锁定状态
    try {
      lockStatus.value = await checkVenueLockStatus(id)
    } catch (e) {
      console.error('获取场馆锁定状态失败:', e)
      lockStatus.value = null
    }
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadDetail()
})

const handleSubmit = async (values: VenueFormValues) => {
  const id = venueId.value
  if (!id) return

  try {
    submitting.value = true

    const payload: UpdateVenueRequest = {
      id,
    }

    if (values.capacityType === 'free_seating') {
      Object.assign(payload, {
        name: values.name,
        type: values.type,
        scenicId: values.scenicId,
        address: values.address,
        description: values.description,
        capacityType: 'free_seating',
        totalCapacity: values.totalCapacity || 0,
      })
    } else if (values.capacityType === 'zone_capacity') {
      Object.assign(payload, {
        name: values.name,
        type: values.type,
        scenicId: values.scenicId,
        address: values.address,
        description: values.description,
        capacityType: 'zone_capacity',
        zones: (values.zones || []).map((zone, index) => ({
          name: zone.name,
          capacity: zone.capacity,
          sort: index + 1,
        })),
      })
    } else if (values.capacityType === 'precise_seat') {
      const precise = (values as any).preciseSeats as TheaterData | undefined
      if (!precise || !precise.zones || !precise.seats) {
        throw new Error('请先配置座位图')
      }

      Object.assign(payload, {
        name: values.name,
        type: values.type,
        scenicId: values.scenicId,
        address: values.address,
        description: values.description,
        capacityType: 'precise_seat',
        zones: precise.zones.map((zone) => ({
          name: zone.name,
          shortName: zone.shortName,
          color: zone.color,
          floor: precise.floors.find((f) => f.id === zone.floorId)?.name,
        })),
        seats: precise.seats.map((seat) => ({
          zoneId: seat.zoneId || '',
          rowLabel: seat.rowLabel,
          seatLabel: seat.seatLabel,
          status: seat.status,
          label: seat.label,
          x: seat.x,
          y: seat.y,
        })),
      })
    }

    await updateVenue(payload)
    message.success('保存成功')
    router.push('/dashboard/theater/venues')
  } catch (err: any) {
    if (err && err.message) {
      message.error(err.message)
    }
    console.error(err)
  } finally {
    submitting.value = false
  }
}

const handleCopySuccess = (newVenueId: string) => {
  message.success('场馆复制成功')
  copyModalVisible.value = false
  router.push(`/dashboard/theater/venues/${newVenueId}/edit`)
}
</script>

<template>
  <FormPageLayout>
    <a-spin :spinning="loading">
      <div style="max-width: 896px">
        <VenueLockAlert
          v-if="lockStatus"
          :lock-status="lockStatus"
          :show-copy-button="true"
          @copy="copyModalVisible = true"
        />

        <VenueForm
          v-if="initialValues"
          ref="formRef"
          :initial-values="initialValues"
          :is-edit="true"
          @submit="handleSubmit"
        />
      </div>
    </a-spin>

    <template #footer>
      <a-button @click="router.push('/dashboard/theater/venues')">返回</a-button>
      <a-button
        type="primary"
        :loading="submitting"
        @click="formRef?.submit()"
      >
        保存
      </a-button>
    </template>

    <CopyVenueModal
      v-if="lockStatus"
      :open="copyModalVisible"
      :source-venue-id="venueId"
      :source-venue-name="initialValues?.name || ''"
      @close="copyModalVisible = false"
      @success="handleCopySuccess"
    />
  </FormPageLayout>
</template>
