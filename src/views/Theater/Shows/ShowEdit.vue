<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import message from 'ant-design-vue/es/message'
import FormPageLayout from '@/components/layouts/FormPageLayout.vue'
import ShowForm from '@/components/theater/show-form/ShowForm.vue'
import { FORM_STEPS, type ShowFormData } from '@/components/theater/show-form/types'
import {
  fetchShowDetail,
  updateShow,
  type UpdateShowRequest,
} from '@/api/show'
import { fetchVenues, type VenueListRequest, type Venue } from '@/api/theaterVenue'

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
      sessions: (res.sessions || []).map((session) => ({
        date: session.date,
        startTime: session.startTime,
        durationMinutes: session.durationMinutes,
        openTime: session.openTime,
      })),
      priceTiers: (res.priceTiers || []).map((tier) => ({
        name: tier.name,
        price: tier.price,
        zoneIds: tier.zoneIds,
        color: tier.color,
        remark: tier.remark,
      })),
      salesRule: res.salesRule || {
        saleStartType: 'immediate',
        saleEndType: 'before_show',
        saleEndMinutesBeforeShow: 30,
        allowRefund: true,
        refundDeadlineType: 'before_show',
        refundDeadlineHoursBeforeShow: 24,
        maxPurchasePerOrder: 10,
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
    const values = showFormRef.value.getValues()

    const payload: UpdateShowRequest = {
      id: showId,
      name: values.basicInfo.name.trim(),
      venueId: values.basicInfo.venueId,
      type: values.basicInfo.type,
      suitableAudience: values.basicInfo.suitableAudience,
      coverImage: values.basicInfo.coverImage,
      subtitle: values.basicInfo.subtitle?.trim() || undefined,
      description: values.basicInfo.description?.trim() || undefined,
      producer: values.basicInfo.producer?.trim() || undefined,
      status: values.basicInfo.status,
      sessions: (values.sessions || []).map((session: ShowFormData['sessions'][number]) => ({
        date: session.date || '',
        startTime: session.startTime || '',
        durationMinutes: session.durationMinutes,
        openTime: session.openTime || undefined,
      })),
      priceTiers: (values.priceTiers || []).map((tier: ShowFormData['priceTiers'][number]) => ({
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
        <div style="max-width: 960px">
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
        <a-button
          v-else
          type="primary"
          :loading="submitting"
          @click="handleFinish"
        >
          保存
        </a-button>
      </div>
    </template>
  </FormPageLayout>
</template>
