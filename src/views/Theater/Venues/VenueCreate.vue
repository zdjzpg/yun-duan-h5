<script setup lang="ts">
import { ref } from 'vue'
import message from 'ant-design-vue/es/message'
import { useRouter } from 'vue-router'
import { saveVenue, type SaveVenueRequest } from '@/api/theaterVenue'
import type { TheaterData } from '@/components/theater/seat-map-editor/types.simplified'
import FormPageLayout from '@/components/layouts/FormPageLayout.vue'
import VenueForm, { type VenueFormValues } from './VenueForm.vue'

const router = useRouter()
const submitting = ref(false)
const formRef = ref<InstanceType<typeof VenueForm> | null>(null)

const buildTempId = (prefix: string, index: number) => `${prefix}_${Date.now()}_${index}`

const handleSubmit = async (values: VenueFormValues) => {
  try {
    submitting.value = true

    let payload: SaveVenueRequest

    if (values.capacityType === 'free_seating') {
      payload = {
        id: '',
        name: values.name,
        type: values.type,
        scenicId: values.scenicId,
        address: values.address,
        description: values.description,
        capacityType: 'free_seating',
        totalCapacity: values.totalCapacity || 0,
        status: 'active',
      }
    } else if (values.capacityType === 'zone_capacity') {
      const mappedZones = (values.zones || []).map((zone, index) => ({
        id: zone.id || buildTempId('zone', index),
        name: zone.name,
        capacity: zone.capacity,
        sort: zone.sort ?? index + 1,
      }))
      payload = {
        id: '',
        name: values.name,
        type: values.type,
        scenicId: values.scenicId,
        address: values.address,
        description: values.description,
        capacityType: 'zone_capacity',
        totalCapacity: mappedZones.reduce((sum, zone) => sum + (zone.capacity || 0), 0),
        status: 'active',
        zones: mappedZones,
      }
    } else {
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

      payload = {
        id: '',
        name: values.name,
        type: values.type,
        scenicId: values.scenicId,
        address: values.address,
        description: values.description,
        capacityType: 'precise_seat',
        totalCapacity: mappedSeats.length,
        status: 'active',
        floors: mappedFloors,
        zones: mappedZones,
        seats: mappedSeats,
        stage: stage
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
          : undefined,
      } as SaveVenueRequest
    }

    await saveVenue(payload)
    message.success('创建场馆成功')
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
    <div style="max-width: 896px">
      <VenueForm
        ref="formRef"
        @submit="handleSubmit"
      />
    </div>

    <template #footer>
      <a-button @click="router.push('/dashboard/theater/venues')">取消</a-button>
      <a-button
        type="primary"
        :loading="submitting"
        @click="formRef?.submit()"
      >
        创建
      </a-button>
    </template>
  </FormPageLayout>
</template>
