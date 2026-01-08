<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import message from 'ant-design-vue/es/message'
import { useRoute, useRouter } from 'vue-router'
import {
  fetchVenueDetail,
  saveVenue,
  type SaveVenueRequest,
  type VenueStatus,
} from '@/api/theaterVenue'
import type { TheaterData } from '@/components/theater/seat-map-editor/types.simplified'
import FormPageLayout from '@/components/layouts/FormPageLayout.vue'
import VenueForm, { type VenueFormValues } from './VenueForm.vue'

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const submitting = ref(false)
const initialValues = ref<VenueFormValues | undefined>(undefined)
const currentStatus = ref<VenueStatus>('active')

const formRef = ref<InstanceType<typeof VenueForm> | null>(null)

const buildTempId = (prefix: string, index: number) => `${prefix}_${Date.now()}_${index}`

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

    currentStatus.value = detail.status || 'active'

    if (detail.capacityType === 'precise_seat') {
      const preciseSeats: TheaterData = {
        id: detail.id,
        name: detail.name,
        floors: ((detail as any).floors || []).map((floor: any, index: number) => ({
          id: floor.id,
          name: floor.name,
          level: floor.level ?? floor.order ?? index + 1,
        })),
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
        stage: (detail as any).stage,
        metadata: {
          createdAt: detail.createdAt || '',
          updatedAt: detail.updatedAt || '',
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

    const payload: SaveVenueRequest = {
      id,
      name: values.name,
      type: values.type,
      scenicId: values.scenicId,
      address: values.address,
      description: values.description,
      capacityType: values.capacityType,
      status: currentStatus.value,
      totalCapacity: values.totalCapacity || 0,
    }

    if (values.capacityType === 'free_seating') {
      payload.capacityType = 'free_seating'
    } else if (values.capacityType === 'zone_capacity') {
      const mappedZones = (values.zones || []).map((zone, index) => ({
        id: zone.id || buildTempId('zone', index),
        name: zone.name,
        capacity: zone.capacity,
        sort: zone.sort ?? index + 1,
      }))

      payload.capacityType = 'zone_capacity'
      payload.zones = mappedZones
      payload.totalCapacity = mappedZones.reduce((sum, zone) => sum + (zone.capacity || 0), 0)
    } else if (values.capacityType === 'precise_seat') {
      const precise = (values as any).preciseSeats as TheaterData | undefined
      if (!precise || !precise.zones || !precise.seats) {
        throw new Error('请先配置座位图')
      }

      const mappedFloors = (precise.floors || []).map((floor, index) => ({
        id: floor.id || buildTempId('floor', index),
        name: floor.name,
        order: (floor as any).order ?? floor.level ?? index + 1,
      }))

      const mappedZones = (precise.zones || []).map((zone, index) => ({
        id: zone.id || buildTempId('zone', index),
        floorId: zone.floorId,
        name: zone.name,
        shortName: zone.shortName,
        color: zone.color,
        sort: zone.order ?? index + 1,
      }))

      const mappedSeats = (precise.seats || []).map((seat, index) => ({
        id: seat.id || buildTempId('seat', index),
        zoneId: seat.zoneId || '',
        floorId: seat.floorId,
        rowLabel: seat.rowLabel,
        seatLabel: seat.seatLabel,
        status: seat.status,
        disabledReason: seat.disabledReason,
        label: seat.label,
        x: seat.x,
        y: seat.y,
      }))

      const stage = precise.stage

      payload.capacityType = 'precise_seat'
      payload.floors = mappedFloors
      payload.zones = mappedZones
      payload.seats = mappedSeats
      payload.totalCapacity = mappedSeats.length
      payload.stage = stage
        ? {
            id: stage.id || buildTempId('stage', 0),
            name: stage.name || '舞台方向',
            x: stage.x ?? 0,
            y: stage.y ?? -300,
            shape: stage.shape || 'trapezoid',
            width: stage.width ?? 480,
            height: stage.height ?? 40,
            position: (stage.position as 'top-center') || 'top-center',
            color: stage.color,
          }
        : undefined
    }

    await saveVenue(payload)
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
</script>

<template>
  <FormPageLayout>
    <a-spin :spinning="loading">
      <div style="max-width: 896px">
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
  </FormPageLayout>
</template>
