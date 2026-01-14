<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import message from 'ant-design-vue/es/message'
import { FORM_STEPS, type ShowFormData, type ShowFormBasicInfo, type SessionConfig } from './types'
import BasicInfoStep from './steps/BasicInfoStep.vue'
import SessionsStep from './steps/SessionsStep.vue'
import SalesRuleStep from './steps/SalesRuleStep.vue'
import DetailsStep from './steps/DetailsStep.vue'

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

defineEmits<{
  (e: 'update:currentStep', value: number): void
}>()

const formRef = ref()

type InternalFormState = {
  basicInfo: ShowFormBasicInfo
  sessionConfigs: SessionConfig[]
  salesRule: ShowFormData['salesRule']
  details: ShowFormData['details']
}

const formState = reactive<InternalFormState>({
  basicInfo: {
    name: '',
    venueId: '',
    type: 'live_show' as any,
    coverImage: undefined,
    description: '',
    status: 'draft' as any,
  },
  // 新架构：场次配置列表
  sessionConfigs: [],
  salesRule: {
    // 下单规则
    orderChannels: ['online_mini_program'],
    realNameType: 'none',
    ageLimitType: 'unlimited',
    needRiskNotice: false,
    riskNoticeMode: 'text',
    riskNoticeText: '',
    riskNoticeFileName: '',
    enableGroupTicket: false,
    groupMinOrderLimitType: 'unlimited',
    groupMinOrderQuantity: undefined,
    paymentLimitType: 'unlimited',
    paymentLimitMinutesAfterOrder: undefined,
    purchaseLimitType: 'per_identity',
    purchaseLimitPerIdentity: undefined,
    saleEndRuleType: 'before',
    saleEndBeforeMinutes: 0,
    saleEndAfterMinutes: 0,
    // 取票 / 验票规则
    pickupTimeType: 'no_pickup',
    printMode: 'one_per_person',
    autoPrint: true,
    printTemplate: 'default',
    printCopyType: 'real_price',
    printCustomPrice: undefined,
    verifyMethods: [],
    verifyTimeType: 'same_day',
    verifyTimeBeforeHours: 0,
    verifyTimeBeforeMinutes: 0,
    verifyTimeAfterHours: 0,
    verifyTimeAfterMinutes: 0,
    // 退改规则
    refundRuleType: 'not_refundable',
    refundDeadlineMinutesBeforeShow: undefined,
    refundFeeType: 'no_fee',
    refundFeeRuleType: 'fixed',
    refundFeeFixedAmount: undefined,
    refundFeeFixedUnit: 'yuan',
    refundFeeLadderRules: [],
    refundReviewType: 'auto',
  },
  details: {
    intro: '',
    bookingRule: '',
    refundRule: '',
    safetyNotice: '',
    detailImages: undefined,
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

    // 仅使用新结构 sessionConfigs，旧的 sessions/priceTiers 不再兼容
    if ((val as any).sessionConfigs && (val as any).sessionConfigs!.length) {
      formState.sessionConfigs = [...((val as any).sessionConfigs as SessionConfig[])]
    } else {
      formState.sessionConfigs = []
    }

    if (val.salesRule) {
      Object.assign(formState.salesRule, val.salesRule)
    }

    if (val.details) {
      Object.assign(formState.details, val.details)
    }
  },
  { immediate: true },
)

const validateStep = async (step: number): Promise<boolean> => {
  const form = formRef.value
  if (!form) return false

  const stepKey = FORM_STEPS[step]?.key

  try {
    if (stepKey === 'basicInfo') {
      await form.validateFields([
        ['basicInfo', 'name'],
        ['basicInfo', 'type'],
        ['basicInfo', 'status'],
      ] as any)
      return true
    }

    if (stepKey === 'sessions') {
      const configs: SessionConfig[] = formState.sessionConfigs || []

      if (!configs.length) {
        message.error('请至少添加一个场次配置')
        return false
      }

      const hasNoSessions = configs.some((config) => !config.sessions || !config.sessions.length)
      if (hasNoSessions) {
        message.error('请为所有场次配置添加演出时间')
        return false
      }

      const hasNoPriceTiers = configs.some(
        (config) => !config.priceTiers || !config.priceTiers.length,
      )
      if (hasNoPriceTiers) {
        message.error('请为所有场次配置设置票档信息')
        return false
      }

      const hasInvalidPrice = configs.some((config) =>
        (config.priceTiers || []).some((tier) => !tier.price || tier.price <= 0),
      )
      if (hasInvalidPrice) {
        message.error('请为所有票档设置有效价格')
        return false
      }

      return true
    }

    if (stepKey === 'salesRule') {
      await form.validateFields([
        // 新增预订规则必填校验字段
        ['salesRule', 'realNameType'],
        ['salesRule', 'needRiskNotice'],
        ['salesRule', 'enableGroupTicket'],
        ['salesRule', 'paymentLimitType'],
        ['salesRule', 'purchaseLimitType'],
        ['salesRule', 'saleEndRuleType'],
        // 取票 / 打印规则
        ['salesRule', 'pickupTimeType'],
        ['salesRule', 'printMode'],
        ['salesRule', 'autoPrint'],
        ['salesRule', 'printTemplate'],
        ['salesRule', 'printCopyType'],
        // 验票时间
        ['salesRule', 'verifyTimeType'],
        // 退改规则
        ['salesRule', 'refundRuleType'],
        ['salesRule', 'refundDeadlineMinutesBeforeShow'],
        ['salesRule', 'refundFeeType'],
        ['salesRule', 'refundReviewType'],
      ] as any)
      return true
    }

    if (stepKey === 'details') {
      // 当前演出详情步骤不做强校验
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
  const basicInfo = JSON.parse(JSON.stringify(formState.basicInfo)) as ShowFormBasicInfo
  const sessionConfigs = JSON.parse(JSON.stringify(formState.sessionConfigs)) as SessionConfig[]
  const salesRule = JSON.parse(JSON.stringify(formState.salesRule)) as ShowFormData['salesRule']
  const details = JSON.parse(JSON.stringify(formState.details)) as ShowFormData['details']

  const result: ShowFormData = {
    basicInfo,
    sessionConfigs,
    salesRule,
    details,
  }

  return result
}

defineExpose({
  validateStep,
  getValues,
})
</script>

<template>
  <a-form
    ref="formRef"
    :model="formState"
    :label-col="{ flex: '110px' }"
    :wrapper-col="{ flex: 1 }"
  >
    <div class="mb-6">
      <a-steps
        :current="currentStep"
        :items="
          FORM_STEPS.map((step: (typeof FORM_STEPS)[number]) => ({
            title: step.title,
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
      <SessionsStep v-else-if="currentStepKey === 'sessions'" v-model="formState.sessionConfigs" />
      <SalesRuleStep v-else-if="currentStepKey === 'salesRule'" v-model="formState.salesRule" />
      <DetailsStep v-else-if="currentStepKey === 'details'" v-model="formState.details" />
    </div>
  </a-form>
</template>

<style scoped>
.mb-6 {
  margin-bottom: 24px;
}
</style>
