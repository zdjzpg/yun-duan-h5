<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import message from 'ant-design-vue/es/message'
import { FORM_STEPS, type ShowFormData, type ShowFormBasicInfo } from './types'
import BasicInfoStep from './steps/BasicInfoStep.vue'
import SessionsStep from './steps/SessionsStep.vue'
import PriceTiersStep from './steps/PriceTiersStep.vue'
import SalesRuleStep from './steps/SalesRuleStep.vue'

const props = withDefaults(
  defineProps<{
    initialValues?: Partial<ShowFormData>
    isEdit?: boolean
    currentStep: number
    venueOptions: Array<{ label: string; value: string }>
    showId?: string
  }>(),
  {
    isEdit: false,
  },
)

const emit = defineEmits<{
  (e: 'update:currentStep', value: number): void
}>()

const formRef = ref()

const formState = reactive<ShowFormData>({
  basicInfo: {
    name: '',
    venueId: '',
    type: 'live_show',
    suitableAudience: undefined,
    coverImage: undefined,
    subtitle: '',
    description: '',
    producer: '',
    status: 'draft',
  } as ShowFormBasicInfo,
  sessions: [],
  priceTiers: [],
  seatPriceTierMapping: undefined,
  salesRule: {
    saleStartType: 'immediate',
    saleEndType: 'before_show',
    saleEndMinutesBeforeShow: 30,
    allowRefund: true,
    refundDeadlineType: 'before_show',
    refundDeadlineHoursBeforeShow: 24,
    maxPurchasePerOrder: 10,
  },
})

const currentStepKey = computed(() => FORM_STEPS[props.currentStep]?.key)

watch(
  () => props.initialValues,
  (val) => {
    if (!val) return
    if (val.basicInfo) {
      Object.assign(formState.basicInfo, val.basicInfo)
    }
    if (val.sessions) {
      formState.sessions = [...val.sessions]
    }
    if (val.priceTiers) {
      formState.priceTiers = [...val.priceTiers]
    }
    if (val.salesRule) {
      Object.assign(formState.salesRule, val.salesRule)
    }
    if (val.seatPriceTierMapping) {
      formState.seatPriceTierMapping = { ...val.seatPriceTierMapping }
    }
  },
  { immediate: true },
)

onMounted(() => {
  // ensure defaults applied
})

const validateStep = async (step: number): Promise<boolean> => {
  const form = formRef.value
  if (!form) return false

  const stepKey = FORM_STEPS[step]?.key

  try {
    if (stepKey === 'basicInfo') {
      await form.validateFields([
        ['basicInfo', 'name'],
        ['basicInfo', 'venueId'],
        ['basicInfo', 'type'],
        ['basicInfo', 'status'],
      ] as any)
      return true
    }

    if (stepKey === 'sessions') {
      const sessions = formState.sessions || []
      if (!sessions.length) {
        message.error('请至少添加一个场次')
        return false
      }
      const hasEmpty = sessions.some(
        (s: any) => !s.date || !s.startTime || !s.durationMinutes,
      )
      if (hasEmpty) {
        message.error('请完整填写所有场次信息')
        return false
      }
      return true
    }

    if (stepKey === 'priceTiers') {
      const tiers = formState.priceTiers || []
      if (!tiers.length) {
        message.error('请至少添加一个票档')
        return false
      }
      const hasEmpty = tiers.some(
        (t: any) => !t.name || t.price === undefined || t.price < 0,
      )
      if (hasEmpty) {
        message.error('请完整填写所有票档信息')
        return false
      }
      return true
    }

    if (stepKey === 'salesRule') {
      await form.validateFields([
        ['salesRule', 'saleStartType'],
        ['salesRule', 'saleEndType'],
        ['salesRule', 'allowRefund'],
        ['salesRule', 'maxPurchasePerOrder'],
      ] as any)
      return true
    }

    return true
  } catch (err: any) {
    if (err?.errorFields && err.errorFields.length > 0) {
      const first = err.errorFields[0]
      if (first.errors?.length) {
        message.error(first.errors[0])
      }
      if (form.scrollToField) {
        form.scrollToField(first.name)
      }
    }
    return false
  }
}

const getValues = (): ShowFormData => {
  return JSON.parse(JSON.stringify(formState)) as ShowFormData
}

const handleStepChange = (step: number) => {
  emit('update:currentStep', step)
}

defineExpose({
  validateStep,
  getValues,
})
</script>

<template>
  <a-form ref="formRef" :model="formState" layout="vertical">
    <div class="mb-6">
      <a-steps
        :current="currentStep"
        @change="handleStepChange"
        :items="
          FORM_STEPS.map((step: (typeof FORM_STEPS)[number]) => ({
            title: step.title,
            description: step.description,
          }))
        "
      />
    </div>

    <div>
      <BasicInfoStep
        v-if="currentStepKey === 'basicInfo'"
        v-model="formState.basicInfo"
        :venue-options="venueOptions"
      />
      <SessionsStep
        v-else-if="currentStepKey === 'sessions'"
        v-model="formState.sessions"
      />
      <PriceTiersStep
        v-else-if="currentStepKey === 'priceTiers'"
        v-model="formState.priceTiers"
        :venue-id="formState.basicInfo.venueId"
        :show-id="props.showId"
      />
      <SalesRuleStep
        v-else-if="currentStepKey === 'salesRule'"
        v-model="formState.salesRule"
      />
    </div>
  </a-form>
</template>

<style scoped>
.mb-6 {
  margin-bottom: 24px;
}
</style>
