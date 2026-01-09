<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import message from 'ant-design-vue/es/message'
import FormPageLayout from '@/components/layouts/FormPageLayout.vue'
import ShowForm from '@/components/theater/show-form/ShowForm.vue'
import { FORM_STEPS, type ShowFormData, type SessionConfig } from '@/components/theater/show-form/types'
import { fetchShowDetail, updateShow, type UpdateShowRequest } from '@/api/show'
import type { Show } from '@/api/endpoints/theater/types'
import {
  fetchVenues,
  fetchVenueDetail,
  type VenueListRequest,
  type Venue,
} from '@/api/theaterVenue'

type ShowWithDetails = Show & {
  detailsIntro?: string
  detailsBookingRule?: string
  detailsRefundRule?: string
  detailsSafetyNotice?: string
  detailImages?: string[]
}

const route = useRoute()
const router = useRouter()

const showId = route.params.id as string

const showFormRef = ref<InstanceType<typeof ShowForm> | null>(null)
const currentStep = ref(0)
const loading = ref(false)
const submitting = ref(false)
const venueOptions = ref<Array<{ label: string; value: string }>>([])
const initialValues = ref<Partial<ShowFormData>>()

const loadVenues = async () => {
  try {
    const params: VenueListRequest = {
      page: 1,
      pageSize: 100,
      status: 'active',
    }
    const res = await fetchVenues(params)
    venueOptions.value = res.list.map((v: Venue) => ({
      label: v.name,
      value: v.id,
    }))
  } catch (err) {
    console.error(err)
    message.error('获取场馆列表失败')
  }
}

const loadDetail = async () => {
  try {
    loading.value = true
    const res = await fetchShowDetail(showId)
    const show = res.show as ShowWithDetails

    let venueCapacityType: SessionConfig['venueCapacityType'] = undefined
    if (show.venueId) {
      try {
        const venueDetail = await fetchVenueDetail(show.venueId)
        venueCapacityType = venueDetail.capacityType as SessionConfig['venueCapacityType']
      } catch (err) {
        console.warn('获取场馆详情失败，仅用于显示容量类型，不影响编辑', err)
      }
    }

    const sessionConfigsFromApi =
      ((res as any).sessionConfigs as SessionConfig[] | undefined) || undefined

    initialValues.value = {
      basicInfo: {
        name: show.name,
        venueId: show.venueId,
        type: show.type,
        suitableAudience: show.suitableAudience,
        coverImage: show.coverImage,
        subtitle: show.subtitle,
        description: show.description,
        producer: show.producer,
        status: show.status,
      },
      sessionConfigs: sessionConfigsFromApi,
      salesRule: res.salesRule || {},
      details: {
        intro: show.detailsIntro,
        bookingRule: show.detailsBookingRule,
        refundRule: show.detailsRefundRule,
        safetyNotice: show.detailsSafetyNotice,
        detailImages: show.detailImages,
      },
    }
  } catch (err) {
    console.error(err)
    message.error('获取演出详情失败')
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await Promise.all([loadVenues(), loadDetail()])
})

const handlePrev = () => {
  if (currentStep.value > 0) {
    currentStep.value -= 1
  }
}

const handleNext = async () => {
  if (!showFormRef.value) return
  const ok = await showFormRef.value.validateStep(currentStep.value)
  if (!ok) return

  if (currentStep.value < FORM_STEPS.length - 1) {
    currentStep.value += 1
  }
}

const handleFinish = async () => {
  if (!showFormRef.value) return

  const ok = await showFormRef.value.validateStep(currentStep.value)
  if (!ok) return

  try {
    submitting.value = true
    const values = showFormRef.value.getValues() as ShowFormData & {
      sessionConfigs?: SessionConfig[]
    }

    const sessionConfigs: SessionConfig[] = (values.sessionConfigs || []) as SessionConfig[]

    const flattenedSessions = sessionConfigs.flatMap((config) =>
      (config.sessions || []).map((session: SessionConfig['sessions'][number]) => ({
        date: session.date || '',
        startTime: session.startTime || '',
        durationMinutes: session.durationMinutes,
        openTime: session.openTime || undefined,
      })),
    )

    const primaryVenueId = sessionConfigs[0]?.venueId || values.basicInfo.venueId

    const flattenedPriceTiers = sessionConfigs[0]?.priceTiers || []

    const payload: UpdateShowRequest = {
      id: showId,
      name: values.basicInfo.name.trim(),
      venueId: primaryVenueId,
      type: values.basicInfo.type,
      suitableAudience: values.basicInfo.suitableAudience,
      coverImage: values.basicInfo.coverImage,
      subtitle: values.basicInfo.subtitle?.trim() || undefined,
      description: values.basicInfo.description?.trim() || undefined,
      producer: values.basicInfo.producer?.trim() || undefined,
      status: values.basicInfo.status,
      detailsIntro: values.details?.intro?.trim() || undefined,
      detailsBookingRule: values.details?.bookingRule?.trim() || undefined,
      detailsRefundRule: values.details?.refundRule?.trim() || undefined,
      detailsSafetyNotice: values.details?.safetyNotice?.trim() || undefined,
      detailImages: values.details?.detailImages,
      sessions: flattenedSessions,
      priceTiers: flattenedPriceTiers.map((tier) => ({
        name: tier.name.trim(),
        price: tier.price,
        zoneIds: tier.zoneIds,
        color: tier.color,
        remark: tier.remark?.trim() || undefined,
      })),
    }

    await updateShow(payload)
    message.success('更新演出成功')
    router.push('/dashboard/theater/shows')
  } catch (err) {
    console.error(err)
    message.error('更新演出失败')
  } finally {
    submitting.value = false
  }
}

const handleCancel = () => {
  router.push('/dashboard/theater/shows')
}
</script>

<template>
  <FormPageLayout>
    <template #default>
      <a-spin :spinning="loading">
        <div>
          <ShowForm
            v-if="initialValues"
            ref="showFormRef"
            :initial-values="initialValues"
            :current-step="currentStep"
            :venue-options="venueOptions"
            :show-id="showId"
            :is-edit="true"
            @update:currentStep="(step: number) => (currentStep = step)"
          />
        </div>
      </a-spin>
    </template>

    <template #footer>
      <a-button @click="handleCancel">取消</a-button>
      <div style="display: flex; gap: 12px">
        <a-button v-if="currentStep > 0" @click="handlePrev">上一步</a-button>
        <a-button
          v-if="currentStep < FORM_STEPS.length - 1"
          type="primary"
          @click="handleNext"
          :loading="loading"
        >
          下一步
        </a-button>
        <a-button v-else type="primary" :loading="submitting" @click="handleFinish">
          保存
        </a-button>
      </div>
    </template>
  </FormPageLayout>
</template>

