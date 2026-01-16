<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import message from 'ant-design-vue/es/message'
import FormPageLayout from '@/components/layouts/FormPageLayout.vue'
import ShowForm from '@/components/theater/show-form/ShowForm.vue'
import {
  FORM_STEPS,
  type ShowFormData,
  type SessionConfig,
  type ShowPublishStatus,
  type ShowPublishOnlineTimeType,
  type ShowPublishOfflineTimeType,
} from '@/components/theater/show-form/types'
import type { ShowType } from '@/api/endpoints/theater/types'
import { fetchVenues, type VenueListRequest, type Venue } from '@/api/theaterVenue'
import { saveShow, type ShowDto } from '@/api/show'

const router = useRouter()

const showFormRef = ref<InstanceType<typeof ShowForm> | null>(null)
const currentStep = ref(0)
const submitting = ref(false)
const venueOptions = ref<Array<{ label: string; value: string }>>([])

const initialValues = ref<Partial<ShowFormData>>({})

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

onMounted(() => {
  loadVenues()
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

const validateAllStepsBeforeSubmit = async (): Promise<boolean> => {
  if (!showFormRef.value) return false
  for (let stepIndex = 0; stepIndex < FORM_STEPS.length; stepIndex += 1) {
    const ok = await showFormRef.value.validateStep(stepIndex)
    if (!ok) {
      currentStep.value = stepIndex
      return false
    }
  }
  return true
}

const handleFinish = async () => {
  if (!showFormRef.value) return

  const ok = await validateAllStepsBeforeSubmit()
  if (!ok) return

  try {
    submitting.value = true

    const values = showFormRef.value.getValues() as ShowFormData
    const dto = buildShowDtoFromForm(values)
    await saveShow(dto)
    message.success('创建演出成功')
    router.push('/dashboard/theater/shows')
  } catch (err) {
    console.error(err)
    message.error('创建演出失败')
  } finally {
    submitting.value = false
  }
}

const handleCancel = () => {
  router.push('/dashboard/theater/shows')
}

type ShowStatusCode = 1 | 2 | 3 | 4
type ShowTypeCode = 1 | 2 | 3 | 4 | 5
type OnlineTimeTypeCode = 1 | 2 | 3
type OfflineTimeTypeCode = 2 | 3
type OrderChannel = NonNullable<ShowFormData['salesRule']['orderChannels']>[number]
type OrderChannelCode = 0 | 1 | 2 | 3 | 4
type VerifyMethod = NonNullable<ShowFormData['salesRule']['verifyMethods']>[number]
type CheckingWayCode = 1 | 2 | 3 | 4 | 5
type RefundRule = NonNullable<ShowFormData['salesRule']['refundRuleType']>
type RefundRuleCode = 0 | 1 | 2
type RefundFeeRuleType = NonNullable<ShowFormData['salesRule']['refundFeeRuleType']>
type RefundFeeModeCode = 0 | 1
type RefundFeeFixedUnit = NonNullable<ShowFormData['salesRule']['refundFeeFixedUnit']>
type RefundFeeUnitCode = 0 | 1
type RefundReviewType = NonNullable<ShowFormData['salesRule']['refundReviewType']>
type RefundAuditModeCode = 0 | 1
type OverdueOperationType = NonNullable<ShowFormData['salesRule']['overdueOperationType']>
type OverdueOperationCode = 0 | 1
type PickupTimeType = NonNullable<ShowFormData['salesRule']['pickupTimeType']>
type PickupTimeCode = 0 | 1
type PrintModeType = NonNullable<ShowFormData['salesRule']['printMode']>
type PrintModeCode = 0 | 2
type RiskNoticeMode = NonNullable<ShowFormData['salesRule']['riskNoticeMode']>
type RiskNoticeModeCode = 0 | 1

const showTypeToDto: Record<ShowType, ShowTypeCode> = {
  live_show: 1,
  musical: 2,
  drama: 3,
  concert: 4,
  other: 5,
}

const publishStatusToDto: Record<ShowPublishStatus, ShowStatusCode> = {
  on_sale: 1,
  stored: 2,
  off_sale: 3,
  scheduled: 4,
}

const onlineTimeTypeToDto: Record<ShowPublishOnlineTimeType, OnlineTimeTypeCode> = {
  immediate: 1,
  booking_start: 2,
  at_time: 3,
}

const offlineTimeTypeToDto: Record<ShowPublishOfflineTimeType, OfflineTimeTypeCode> = {
  booking_end: 2,
  at_time: 3,
}

const orderChannelToDto: Record<OrderChannel, OrderChannelCode> = {
  offline_window: 0,
  online_mini_program: 1,
  online_sub_mini_program: 2,
  offline_distribute_window: 3,
  offline_self_service: 4,
}

const checkingWayToDto: Record<VerifyMethod, CheckingWayCode> = {
  order_qr: 1,
  paper: 2,
  ticket_qr: 3,
  id_card: 4,
  face: 5,
}

const refundFeeModeToDto: Record<RefundFeeRuleType, RefundFeeModeCode> = {
  fixed: 0,
  ladder: 1,
}

const refundFeeUnitToDto: Record<RefundFeeFixedUnit, RefundFeeUnitCode> = {
  yuan: 0,
  percent: 1,
}

const refundAuditModeToDto: Record<RefundReviewType, RefundAuditModeCode> = {
  auto: 0,
  manual: 1,
}

const refundRuleToDto: Record<RefundRule, RefundRuleCode> = {
  not_refundable: 0,
  conditional: 1,
  anytime: 2,
}

const overdueOperationToDto: Record<OverdueOperationType, OverdueOperationCode> = {
  none: 0,
  auto_refund: 1,
}

const pickupTimeTypeToDto: Record<PickupTimeType, PickupTimeCode> = {
  no_pickup: 0,
  same_day: 1,
}

const riskNoticeModeToDto: Record<RiskNoticeMode, RiskNoticeModeCode> = {
  text: 0,
  file: 1,
}

const printModeToDto: Record<PrintModeType, PrintModeCode> = {
  one_per_person: 0,
  one_per_type: 2,
}

function ensureBool(value: any): boolean {
  return !!value
}

function extractDigits(value?: string | number | null): number {
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    const digits = value.match(/\d+/g)?.join('')
    if (digits) {
      const num = Number(digits)
      if (!Number.isNaN(num)) return num
    }
  }
  return 0
}

function toNumericArray(values?: Array<number | string>): number[] {
  if (!Array.isArray(values)) return []
  return values
    .map((val) => extractDigits(val as string | number))
    .filter((num) => typeof num === 'number' && !Number.isNaN(num) && num > 0)
}

function mapOrderChannels(
  channels?: ShowFormData['salesRule']['orderChannels'],
): OrderChannelCode[] {
  if (!Array.isArray(channels)) return []
  return channels
    .map((channel) => orderChannelToDto[channel])
    .filter((val): val is OrderChannelCode => typeof val === 'number')
}

function mapCheckingWay(methods?: ShowFormData['salesRule']['verifyMethods']): CheckingWayCode[] {
  if (!Array.isArray(methods)) return []
  return methods
    .map((method) => checkingWayToDto[method])
    .filter((val): val is CheckingWayCode => typeof val === 'number')
}

function mapSessionsToDto(sessionConfigs?: SessionConfig[]) {
  if (!Array.isArray(sessionConfigs)) return []

  return sessionConfigs.flatMap((config) => {
    const priceTiers = (config.priceTiers || []).map((tier) => ({
      PriceTierName: tier.name?.trim() || '',
      Price: Number(tier.price) || 0,
      VenueZoneUid: extractDigits((tier as any).zoneId || (tier as any).zoneIds?.[0] || 0),
      Stock: Number((tier as any).capacity ?? 0) || 0,
    }))
    return (config.sessions || []).map((session) => ({
      Date: session.date || '',
      StartTime: session.startTime || '',
      DurationMinutes: Number(session.durationMinutes) || 0,
      PriceTiers: priceTiers,
    }))
  })
}

function mapVerifyStoreStationsToDto(
  configs?: ShowFormData['salesRule']['verifyStoreStations'],
): ShowDto['VerifyStoreStations'] {
  if (!Array.isArray(configs)) return []

  const mapped = configs
    .map((config) => {
      const enabledStations = Array.isArray(config.stations)
        ? config.stations.filter((item) => item.enabled)
        : []

      if (!enabledStations.length) return null

      return {
        StoreId: config.storeId,
        StoreName: config.storeName,
        Stations: enabledStations.map((item) => ({
          StationId: item.stationId,
          StationName: item.stationName,
          Enabled: 1,
          VerifyLimit:
            item.verifyLimit == null || Number(item.verifyLimit) <= 0
              ? null
              : Number(item.verifyLimit),
        })),
      }
    })
    .filter((item): item is NonNullable<typeof item> => !!item)

  return mapped
}

function buildShowDtoFromForm(values: ShowFormData, existingUid?: number): ShowDto {
  const basicInfo = values.basicInfo
  const salesRule = values.salesRule
  const details = values.details
  const sessionConfigs = values.sessionConfigs || []

  const status = publishStatusToDto[basicInfo.status] || 2
  const isScheduled = basicInfo.status === 'scheduled'

  const dto: ShowDto = {
    Uid: existingUid ?? 0,
    VenueUid: extractDigits(basicInfo.venueId),
    ShowName: basicInfo.name?.trim() || '',
    ShowType: showTypeToDto[basicInfo.type] ?? 5,
    CoverImages: basicInfo.coverImage || [],
    Description: basicInfo.description || '',
    DetailsIncludeRule: details.intro || '',
    DetailsBookingRule: details.bookingRule || '',
    DetailsRefundRule: details.refundRule || '',
    DetailsSafetyNotice: details.safetyNotice || '',
    DetailImages: details.detailImages || [],
    ShowStatus: status,
    OnlineTimeType:
      isScheduled && basicInfo.onlineTimeType
        ? onlineTimeTypeToDto[basicInfo.onlineTimeType]
        : null,
    OnlineTime:
      isScheduled && basicInfo.onlineTimeType === 'at_time' ? basicInfo.onlineTime || null : null,
    OfflineTimeType:
      isScheduled && basicInfo.offlineTimeType
        ? offlineTimeTypeToDto[basicInfo.offlineTimeType]
        : null,
    OfflineTime:
      isScheduled && basicInfo.offlineTimeType === 'at_time' ? basicInfo.offlineTime || null : null,
    AssignUsersForSale: toNumericArray((salesRule as any).storeIds),
    OrderChannels: mapOrderChannels(salesRule.orderChannels),
    NeedRiskNotice: ensureBool(salesRule.needRiskNotice) ? 1 : 0,
    RiskNoticeMode: riskNoticeModeToDto[salesRule.riskNoticeMode || 'text'],
    RiskNoticeText: salesRule.riskNoticeText || '',
    RiskNoticeFileName: salesRule.riskNoticeFileName || '',
    EnableGroupTicket: ensureBool(salesRule.enableGroupTicket) ? 1 : 0,
    GroupTicketMinQuantity:
      salesRule.enableGroupTicket && salesRule.groupMinOrderLimitType === 'at_least'
        ? salesRule.groupMinOrderQuantity || null
        : null,
    TimeLengthForAutoCancel:
      salesRule.paymentLimitType === 'minutes_after_order'
        ? salesRule.paymentLimitMinutesAfterOrder || null
        : null,
    MaxQuantityForPerIdentity:
      salesRule.purchaseLimitType === 'per_identity'
        ? salesRule.purchaseLimitPerIdentity || null
        : null,
    TimeLengthForStopSale:
      salesRule.saleEndRuleType === 'after'
        ? -(salesRule.saleEndAfterMinutes || 0)
        : salesRule.saleEndBeforeMinutes || 0,
    AssignUsersForVerify: toNumericArray((salesRule as any).verifyStoreIds),
    VerifyStoreStations: mapVerifyStoreStationsToDto(salesRule.verifyStoreStations),
    VenueCapacityType: 2,
    PickupTimeType: salesRule.pickupTimeType
      ? pickupTimeTypeToDto[salesRule.pickupTimeType]
      : pickupTimeTypeToDto.no_pickup,
    PrintMode: salesRule.printMode
      ? printModeToDto[salesRule.printMode]
      : printModeToDto.one_per_person,
    PrintTiming: ensureBool(salesRule.autoPrint) ? 0 : 1,
    PrintTemplateUid: extractDigits(salesRule.printTemplate || 0),
    PrintPriceType: salesRule.printCopyType === 'custom' ? 1 : 0,
    CustomPrintPrice:
      salesRule.printCopyType === 'custom' ? Number(salesRule.printCustomPrice || 0) : null,
    CheckingWay: mapCheckingWay(salesRule.verifyMethods),
    VerifyTimeType: salesRule.verifyTimeType === 'custom' ? 1 : 0,
    VerifyTimeBeforeHours:
      salesRule.verifyTimeType === 'custom' ? salesRule.verifyTimeBeforeHours || null : null,
    VerifyTimeBeforeMinutes:
      salesRule.verifyTimeType === 'custom' ? salesRule.verifyTimeBeforeMinutes || null : null,
    VerifyTimeAfterHours:
      salesRule.verifyTimeType === 'custom' ? salesRule.verifyTimeAfterHours || null : null,
    VerifyTimeAfterMinutes:
      salesRule.verifyTimeType === 'custom' ? salesRule.verifyTimeAfterMinutes || null : null,
    RefundRuleType: salesRule.refundRuleType ? refundRuleToDto[salesRule.refundRuleType] : 0,
    RefundDeadlineMinutesBeforeShow:
      salesRule.refundRuleType === 'conditional'
        ? salesRule.refundDeadlineMinutesBeforeShow || null
        : null,
    // 随时退 / 有条件退都可以配置手续费
    NeedRefundFee:
      salesRule.refundRuleType !== 'not_refundable' &&
      salesRule.refundFeeType === 'need_fee'
        ? 1
        : 0,
    RefundFeeMode:
      salesRule.refundRuleType !== 'not_refundable' &&
      salesRule.refundFeeType === 'need_fee' &&
      salesRule.refundFeeRuleType
        ? refundFeeModeToDto[salesRule.refundFeeRuleType]
        : null,
    RefundFeeFixedUnit:
      salesRule.refundRuleType !== 'not_refundable' &&
      salesRule.refundFeeType === 'need_fee' &&
      salesRule.refundFeeRuleType === 'fixed'
        ? refundFeeUnitToDto[salesRule.refundFeeFixedUnit || 'yuan']
        : null,
    RefundFeeFixedValue:
      salesRule.refundRuleType !== 'not_refundable' &&
      salesRule.refundFeeType === 'need_fee' &&
      salesRule.refundFeeRuleType === 'fixed'
        ? Number(salesRule.refundFeeFixedAmount || 0)
        : null,
    RefundFeeLadderRules:
      salesRule.refundRuleType !== 'not_refundable' &&
      salesRule.refundFeeType === 'need_fee' &&
      salesRule.refundFeeRuleType === 'ladder'
        ? (salesRule.refundFeeLadderRules || []).map((rule) => ({
            OffsetDirection: rule.offsetDirection === 'after' ? 1 : 0,
            OffsetDays: rule.offsetDays ?? 0,
            OffsetTime: rule.offsetTime || '00:00',
            FeeUnit: refundFeeUnitToDto[rule.feeUnit || 'yuan'],
            FeeValue: Number(rule.feeRate ?? 0),
          }))
        : [],
    RefundAuditMode:
      salesRule.refundRuleType && salesRule.refundRuleType !== 'not_refundable'
        ? refundAuditModeToDto[salesRule.refundReviewType || 'auto']
        : 0,
    OverdueOperationType: overdueOperationToDto[salesRule.overdueOperationType || 'none'],
    Sessions: mapSessionsToDto(sessionConfigs),
  }

  return dto
}
</script>

<template>
  <FormPageLayout>
    <template #default>
      <div>
        <ShowForm
          ref="showFormRef"
          :initial-values="initialValues"
          :current-step="currentStep"
          :venue-options="venueOptions"
          @update:currentStep="(step: number) => (currentStep = step)"
        />
      </div>
    </template>

    <template #footer>
      <a-button @click="handleCancel">取消</a-button>
      <div style="display: flex; gap: 12px">
        <a-button v-if="currentStep > 0" @click="handlePrev">上一步</a-button>
        <a-button v-if="currentStep < FORM_STEPS.length - 1" type="primary" @click="handleNext">
          下一步
        </a-button>
        <a-button v-else type="primary" :loading="submitting" @click="handleFinish">
          创建
        </a-button>
      </div>
    </template>
  </FormPageLayout>
</template>
