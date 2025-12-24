<script setup lang="ts">
import { onMounted, ref } from 'vue'
import message from 'ant-design-vue/es/message'
import { useRoute, useRouter } from 'vue-router'
import { fetchVenueDetail, updateVenue, type UpdateVenueRequest } from '@/api/theaterVenue'
import FormPageLayout from '@/components/layouts/FormPageLayout.vue'
import VenueForm, { type VenueFormValues } from './VenueForm.vue'

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const submitting = ref(false)
const initialValues = ref<VenueFormValues | undefined>(undefined)
const capacityType = ref<string>('free_seating')

const formRef = ref<InstanceType<typeof VenueForm> | null>(null)

const loadDetail = async () => {
  const id = route.params.id as string
  if (!id) {
    router.replace('/dashboard/theater/venues')
    return
  }

  try {
    loading.value = true
    const detail = await fetchVenueDetail(id)

    capacityType.value = detail.capacityType

    if (detail.capacityType === 'precise_seat') {
      initialValues.value = {
        name: detail.name,
        type: detail.type,
        scenicId: detail.scenicId,
        address: detail.address,
        description: detail.description,
        capacityType: detail.capacityType,
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
  const id = route.params.id as string
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
</script>

<template>
  <FormPageLayout>
    <a-spin :spinning="loading">
      <div style="max-width: 896px">
        <template v-if="capacityType === 'precise_seat'">
          <a-alert
            type="warning"
            show-icon
            message="暂不支持在 H5 端编辑精确座位类型的场馆"
            description="请在后台 PC 系统中使用座位图编辑器调整该场馆的座位结构。此处仅可查看基础信息。"
            style="margin-bottom: 16px"
          />
        </template>

        <VenueForm
          v-if="initialValues"
          ref="formRef"
          :initial-values="initialValues"
          :is-edit="capacityType !== 'precise_seat'"
          @submit="handleSubmit"
        />
      </div>
    </a-spin>

    <template #footer>
      <a-button @click="router.push('/dashboard/theater/venues')">返回</a-button>
      <a-button
        v-if="capacityType !== 'precise_seat'"
        type="primary"
        :loading="submitting"
        @click="formRef?.submit()"
      >
        保存
      </a-button>
    </template>
  </FormPageLayout>
</template>

