<script setup lang="ts">
import { ref } from 'vue'
import message from 'ant-design-vue/es/message'
import { useRouter } from 'vue-router'
import { createVenue, type CreateVenueRequest } from '@/api/theaterVenue'
import FormPageLayout from '@/components/layouts/FormPageLayout.vue'
import VenueForm, { type VenueFormValues } from './VenueForm.vue'

const router = useRouter()
const submitting = ref(false)
const formRef = ref<InstanceType<typeof VenueForm> | null>(null)

const handleSubmit = async (values: VenueFormValues) => {
  try {
    submitting.value = true

    let payload: CreateVenueRequest

    if (values.capacityType === 'free_seating') {
      payload = {
        name: values.name,
        type: values.type,
        scenicId: values.scenicId,
        address: values.address,
        description: values.description,
        capacityType: 'free_seating',
        totalCapacity: values.totalCapacity || 0,
      }
    } else {
      payload = {
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
      }
    }

    await createVenue(payload)
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
