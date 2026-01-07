<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import message from 'ant-design-vue/es/message'
import FormPageLayout from '@/components/layouts/FormPageLayout.vue'
import ShowForm from '@/components/theater/show-form/ShowForm.vue'
import {
  FORM_STEPS,
  type ShowFormData,
  type SessionConfig,
} from '@/components/theater/show-form/types'
import { fetchShowDetail, updateShow, type UpdateShowRequest } from '@/api/show'
import {
  fetchVenues,
  fetchVenueDetail,
  type VenueListRequest,
  type Venue,
} from '@/api/theaterVenue'

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
    const show = res.show

    let venueCapacityType: SessionConfig['venueCapacityType'] = undefined
    if (show.venueId) {
      try {
        const venueDetail = await fetchVenueDetail(show.venueId)
        venueCapacityType = venueDetail.capacityType as SessionConfig['venueCapacityType']
      } catch (err) {
        console.warn('获取场馆详情失败，仅用于显示容量类型，不影响编辑', err)
      }
    }

    const sessions = (res.sessions || []).map((session) => ({
      date: session.date,
      startTime: session.startTime,
      durationMinutes: session.durationMinutes,
      openTime: session.openTime,
    }))

    const priceTiers = (res.priceTiers || []).map((tier) => ({
      name: tier.name,
      price: tier.price,
      zoneIds: tier.zoneIds,
      color: tier.color,
      remark: tier.remark,
    }))

    // 保持与 a 项一致：编辑旧数据时不预先生成 sessionConfigs，
    // 仅填充旧字段 sessions / priceTiers，由表单内部在提交时兼容处理。
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
      sessions,
      priceTiers,
      seatPriceTierMapping: res.seatPriceTierMapping,
      salesRule: res.salesRule || {
        saleStartType: 'immediate',
        saleEndType: 'before_show',
        saleEndMinutesBeforeShow: 30,
        allowRefund: true,
        refundDeadlineType: 'before_show',
        refundDeadlineHoursBeforeShow: 24,
        maxPurchasePerOrder: 10,
      },
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
      sessionConfigs?: import('@/components/theater/show-form/types').SessionConfig[]
    }

    const sessionConfigs =
      (values.sessionConfigs && values.sessionConfigs.length
        ? values.sessionConfigs
        : [
            {
              venueId: values.basicInfo.venueId,
              venueName: undefined,
              venueCapacityType: undefined,
              priceTiers: (values.priceTiers || []) as any,
              seatPriceTierMapping: values.seatPriceTierMapping,
              seatDisabledStates: undefined,
              sessions: (values.sessions || []) as any,
            },
          ]) || []

    const flattenedSessions = sessionConfigs.flatMap((config) =>
      (config.sessions || []).map((session) => ({
        date: session.date || '',
        startTime: session.startTime || '',
        durationMinutes: session.durationMinutes,
        openTime: session.openTime || undefined,
      })),
    )

    const primaryVenueId = sessionConfigs[0]?.venueId || values.basicInfo.venueId

    const flattenedPriceTiers = (sessionConfigs[0]?.priceTiers ||
      values.priceTiers ||
      []) as ShowFormData['priceTiers']

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
      salesRule: {
        saleStartType: values.salesRule.saleStartType,
        saleStartTime: values.salesRule.saleStartTime || undefined,
        saleEndType: values.salesRule.saleEndType,
        saleEndMinutesBeforeShow: values.salesRule.saleEndMinutesBeforeShow,
        saleEndTime: values.salesRule.saleEndTime || undefined,
        allowRefund: values.salesRule.allowRefund,
        refundDeadlineType: values.salesRule.refundDeadlineType,
        refundDeadlineHoursBeforeShow: values.salesRule.refundDeadlineHoursBeforeShow,
        refundDeadlineTime: values.salesRule.refundDeadlineTime || undefined,
        maxPurchasePerOrder: values.salesRule.maxPurchasePerOrder,
      },
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
