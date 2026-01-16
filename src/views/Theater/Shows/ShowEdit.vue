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
  type ShowPublishStatus,
  type ShowPublishOnlineTimeType,
  type ShowPublishOfflineTimeType,
} from '@/components/theater/show-form/types'
import { saveShow, fetchShowDetail, type ShowDto } from '@/api/show'
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
const venueIdMap = ref<Record<number, string>>({})

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
    const map: Record<number, string> = {}
    res.list.forEach((v: Venue) => {
      const uid = extractDigits(v.id as any)
      if (uid > 0) {
        map[uid] = v.id
      }
    })
    venueIdMap.value = map
  } catch (err) {
    console.error(err)
    message.error('获取场馆列表失败')
  }
}

const loadDetail = async () => {
  try {
    loading.value = true
    const numericUid = normalizeShowUid(showId)
    if (!numericUid) {
      throw new Error('无效的票档 ID')
    }
    const dto = await fetchShowDetail(numericUid)
    const formValues = buildFormValuesFromShowDto(dto)
    console.log(dto, formValues)
    const venueIdForForm = resolveVenueIdFromUid(dto.VenueUid)
    if (venueIdForForm) {
      try {
        const venueDetail = await fetchVenueDetail(venueIdForForm)
        const capacityType = venueDetail.capacityType as SessionConfig['venueCapacityType']
        if (formValues.sessionConfigs && formValues.sessionConfigs.length) {
          formValues.sessionConfigs = formValues.sessionConfigs.map((config) => ({
            ...config,
            venueCapacityType: capacityType,
            venueName: venueDetail.name || config.venueName,
          }))
        }
      } catch (err) {
        console.warn('获取场馆详情失败，仅用于显示容量类型，不影响编辑', err)
      }
    }

    initialValues.value = formValues
  } catch (err) {
    console.error(err)
    message.error('获取演出详情失败')
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await loadVenues()
  await loadDetail()
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
    const numericUid = normalizeShowUid(showId)
    if (!numericUid) {
      throw new Error('无效的票档 ID')
    }
    const dto = buildShowDtoFromForm(values, numericUid)
    console.log(dto)
    await saveShow(dto)
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
type BasicInfo = ShowFormData['basicInfo']
type ShowFormType = BasicInfo['type']
type PickupTimeType = NonNullable<ShowFormData['salesRule']['pickupTimeType']>
type PickupTimeCode = 0 | 1
type PrintModeType = NonNullable<ShowFormData['salesRule']['printMode']>
type PrintModeCode = 0 | 2
type RiskNoticeMode = NonNullable<ShowFormData['salesRule']['riskNoticeMode']>
type RiskNoticeModeCode = 0 | 1

const showTypeToDto: Record<ShowFormType, ShowTypeCode> = {
  live_show: 1,
  musical: 2,
  drama: 3,
  concert: 4,
  other: 5,
}

const showTypeFromDto: Record<ShowTypeCode, ShowFormType> = {
  1: 'live_show',
  2: 'musical',
  3: 'drama',
  4: 'concert',
  5: 'other',
}

const publishStatusToDto: Record<ShowPublishStatus, ShowStatusCode> = {
  on_sale: 1,
  stored: 2,
  off_sale: 3,
  scheduled: 4,
}

const publishStatusFromDto: Record<ShowStatusCode, ShowPublishStatus> = {
  1: 'on_sale',
  2: 'stored',
  3: 'off_sale',
  4: 'scheduled',
}

const onlineTimeTypeToDto: Record<ShowPublishOnlineTimeType, OnlineTimeTypeCode> = {
  immediate: 1,
  booking_start: 2,
  at_time: 3,
}

const onlineTimeTypeFromDto: Record<OnlineTimeTypeCode, ShowPublishOnlineTimeType> = {
  1: 'immediate',
  2: 'booking_start',
  3: 'at_time',
}

const offlineTimeTypeToDto: Record<ShowPublishOfflineTimeType, OfflineTimeTypeCode> = {
  booking_end: 2,
  at_time: 3,
}

const offlineTimeTypeFromDto: Record<OfflineTimeTypeCode, ShowPublishOfflineTimeType> = {
  2: 'booking_end',
  3: 'at_time',
}

const orderChannelToDto: Record<OrderChannel, OrderChannelCode> = {
  offline_window: 0,
  online_mini_program: 1,
  online_sub_mini_program: 2,
  offline_distribute_window: 3,
  offline_self_service: 4,
}

const orderChannelFromDto: Record<OrderChannelCode, OrderChannel> = {
  0: 'offline_window',
  1: 'online_mini_program',
  2: 'online_sub_mini_program',
  3: 'offline_distribute_window',
  4: 'offline_self_service',
}

const checkingWayToDto: Record<VerifyMethod, CheckingWayCode> = {
  order_qr: 1,
  paper: 2,
  ticket_qr: 3,
  id_card: 4,
  face: 5,
}

const checkingWayFromDto: Record<CheckingWayCode, VerifyMethod> = {
  1: 'order_qr',
  2: 'paper',
  3: 'ticket_qr',
  4: 'id_card',
  5: 'face',
}

const refundFeeModeToDto: Record<RefundFeeRuleType, RefundFeeModeCode> = {
  fixed: 0,
  ladder: 1,
}

const refundFeeModeFromDto: Record<RefundFeeModeCode, RefundFeeRuleType> = {
  0: 'fixed',
  1: 'ladder',
}

const refundFeeUnitToDto: Record<RefundFeeFixedUnit, RefundFeeUnitCode> = {
  yuan: 0,
  percent: 1,
}

const refundFeeUnitFromDto: Record<RefundFeeUnitCode, RefundFeeFixedUnit> = {
  0: 'yuan',
  1: 'percent',
}

const refundAuditModeToDto: Record<RefundReviewType, RefundAuditModeCode> = {
  auto: 0,
  manual: 1,
}

const refundAuditModeFromDto: Record<RefundAuditModeCode, RefundReviewType> = {
  0: 'auto',
  1: 'manual',
}

const refundRuleToDto: Record<RefundRule, RefundRuleCode> = {
  not_refundable: 0,
  conditional: 1,
  anytime: 2,
}

const refundRuleFromDto: Record<RefundRuleCode, RefundRule> = {
  0: 'not_refundable',
  1: 'conditional',
  2: 'anytime',
}

const overdueOperationToDto: Record<OverdueOperationType, OverdueOperationCode> = {
  none: 0,
  auto_refund: 1,
}

const overdueOperationFromDto: Record<OverdueOperationCode, OverdueOperationType> = {
  0: 'none',
  1: 'auto_refund',
}

const pickupTimeTypeToDto: Record<PickupTimeType, PickupTimeCode> = {
  no_pickup: 0,
  same_day: 1,
}

const pickupTimeTypeFromDto: Record<PickupTimeCode, PickupTimeType> = {
  0: 'no_pickup',
  1: 'same_day',
}

const riskNoticeModeToDto: Record<RiskNoticeMode, RiskNoticeModeCode> = {
  text: 0,
  file: 1,
}

const riskNoticeModeFromDto: Record<RiskNoticeModeCode, RiskNoticeMode> = {
  0: 'text',
  1: 'file',
}

const printModeToDto: Record<PrintModeType, PrintModeCode> = {
  one_per_person: 0,
  one_per_type: 2,
}

const printModeFromDto: Record<PrintModeCode, PrintModeType> = {
  0: 'one_per_person',
  2: 'one_per_type',
}

function normalizeNumber(value: number | string | null | undefined): number | null {
  if (typeof value === 'number') {
    return Number.isNaN(value) ? null : value
  }
  if (typeof value === 'string' && value.trim().length > 0) {
    const num = Number(value)
    return Number.isNaN(num) ? null : num
  }
  return null
}

function toShowTypeCode(value: ShowDto['ShowType']): ShowTypeCode {
  const num = normalizeNumber(value as any)
  if (num === 1 || num === 2 || num === 3 || num === 4 || num === 5) {
    return num as ShowTypeCode
  }
  return 5
}

function toOnlineTimeTypeCode(value?: number | string | null): OnlineTimeTypeCode | null {
  const num = normalizeNumber(value)
  if (num === 1 || num === 2 || num === 3) {
    return num as OnlineTimeTypeCode
  }
  return null
}

function toOfflineTimeTypeCode(value?: number | string | null): OfflineTimeTypeCode | null {
  const num = normalizeNumber(value)
  if (num === 2 || num === 3) {
    return num as OfflineTimeTypeCode
  }
  return null
}

function toOrderChannelCode(value: number | string | null | undefined): OrderChannelCode | null {
  const num = normalizeNumber(value)
  if (num === 0 || num === 1 || num === 2 || num === 3 || num === 4) {
    return num as OrderChannelCode
  }
  return null
}

function toCheckingWayCode(value: number | string | null | undefined): CheckingWayCode | null {
  const num = normalizeNumber(value)
  if (num === 1 || num === 2 || num === 3 || num === 4 || num === 5) {
    return num as CheckingWayCode
  }
  return null
}

function toRefundFeeModeCode(value: number | string | null | undefined): RefundFeeModeCode | null {
  const num = normalizeNumber(value)
  if (num === 0 || num === 1) {
    return num as RefundFeeModeCode
  }
  return null
}

function toRefundFeeUnitCode(value: number | string | null | undefined): RefundFeeUnitCode | null {
  const num = normalizeNumber(value)
  if (num === 0 || num === 1) {
    return num as RefundFeeUnitCode
  }
  return null
}

function toRefundAuditModeCode(
  value: number | string | null | undefined,
): RefundAuditModeCode | null {
  const num = normalizeNumber(value)
  if (num === 0 || num === 1) {
    return num as RefundAuditModeCode
  }
  return null
}

function toRefundRuleCode(value: ShowDto['RefundRuleType']): RefundRuleCode {
  const num = normalizeNumber(value)
  if (num === 0 || num === 1 || num === 2) {
    return num as RefundRuleCode
  }
  return 0
}

function toPickupTimeTypeCode(value: number | string | null | undefined): PickupTimeCode | null {
  const num = normalizeNumber(value)
  if (num === 0 || num === 1) {
    return num as PickupTimeCode
  }
  return null
}

function toPrintModeCode(value: number | string | null | undefined): PrintModeCode | null {
  const num = normalizeNumber(value)
  if (num === 0 || num === 2) {
    return num as PrintModeCode
  }
  return null
}

function toOverdueOperationCode(
  value: number | string | null | undefined,
): OverdueOperationCode | null {
  const num = normalizeNumber(value)
  if (num === 0 || num === 1) {
    return num as OverdueOperationCode
  }
  return null
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

function resolveVenueIdFromUid(uid?: number | null): string {
  if (uid == null || Number.isNaN(uid)) return ''
  const mapped = venueIdMap.value[uid]
  if (mapped) return mapped
  return buildFallbackVenueId(uid)
}

function buildFallbackVenueId(uid: number): string {
  const str = String(uid)
  return `venue-${str.padStart(3, '0')}`
}

function resolveZoneIdFromUid(uid?: number | string | null): string | undefined {
  if (typeof uid === 'number' && !Number.isNaN(uid)) {
    return `zone-${String(uid).padStart(3, '0')}`
  }
  if (typeof uid === 'string' && uid.length > 0) {
    const parsed = Number(uid)
    if (!Number.isNaN(parsed)) {
      return `zone-${String(parsed).padStart(3, '0')}`
    }
    return uid
  }
  return undefined
}

function normalizeShowUid(value?: string | number | null): number {
  return extractDigits(value)
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

function mapOrderChannelsFromDto(values?: Array<number | string>): OrderChannel[] {
  if (!Array.isArray(values)) return []
  return values
    .map((code) => toOrderChannelCode(code))
    .filter((code): code is OrderChannelCode => code != null)
    .map((code) => orderChannelFromDto[code])
}

function mapCheckingWay(methods?: ShowFormData['salesRule']['verifyMethods']): CheckingWayCode[] {
  if (!Array.isArray(methods)) return []
  return methods
    .map((method) => checkingWayToDto[method])
    .filter((val): val is CheckingWayCode => typeof val === 'number')
}

function mapCheckingWayFromDto(values?: Array<number | string>): VerifyMethod[] {
  if (!Array.isArray(values)) return []
  return values
    .map((code) => toCheckingWayCode(code))
    .filter((code): code is CheckingWayCode => code != null)
    .map((code) => checkingWayFromDto[code])
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

function mapSessionsFromDto(dto: ShowDto): SessionConfig[] {
  const sessions = dto.Sessions || []
  const priceTiersForFirst = sessions[0]?.PriceTiers || []

  const priceTiers = priceTiersForFirst.map((tier, index) => {
    const zoneId = resolveZoneIdFromUid(tier.VenueZoneUid)
    return {
      name: tier.PriceTierName,
      price: tier.Price,
      zoneId,
      capacity: tier.Stock,
      order: index,
    }
  })

  const config: SessionConfig = {
    venueId: resolveVenueIdFromUid(dto.VenueUid) || (dto.VenueUid ? String(dto.VenueUid) : ''),
    priceTiers,
    sessions: sessions.map((session) => ({
      date: session.Date,
      startTime: session.StartTime,
      durationMinutes: session.DurationMinutes,
    })),
  }

  return [config]
}

function mapVerifyStoreStationsFromDto(
  dto: ShowDto,
): ShowFormData['salesRule']['verifyStoreStations'] {
  const list = dto.VerifyStoreStations
  if (!Array.isArray(list)) return []

  return list.map((config) => ({
    storeId: config.StoreId,
    storeName: config.StoreName,
    stations: Array.isArray(config.Stations)
      ? config.Stations.map((item) => ({
          stationId: String(item.StationId),
          stationName: item.StationName,
          enabled: item.Enabled === 1,
          verifyLimit:
            item.VerifyLimit == null || Number(item.VerifyLimit) <= 0
              ? null
              : Number(item.VerifyLimit),
        }))
      : [],
  }))
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

function buildFormValuesFromShowDto(dto: ShowDto): Partial<ShowFormData> {
  const statusCode = (dto.ShowStatus ?? 2) as ShowStatusCode
  const status = publishStatusFromDto[statusCode] || 'stored'
  const venueIdForForm = resolveVenueIdFromUid(dto.VenueUid)
  const showTypeCode = toShowTypeCode(dto.ShowType)
  const onlineTypeCode = toOnlineTimeTypeCode(dto.OnlineTimeType)
  const offlineTypeCode = toOfflineTimeTypeCode(dto.OfflineTimeType)

  const refundFeeModeCode = toRefundFeeModeCode(dto.RefundFeeMode)
  const refundFeeUnitCode = toRefundFeeUnitCode(dto.RefundFeeFixedUnit)
  const refundAuditModeCode = toRefundAuditModeCode(dto.RefundAuditMode)
  const riskNoticeModeCode = normalizeNumber(dto.RiskNoticeMode) as RiskNoticeModeCode | null
  const pickupTimeCode = toPickupTimeTypeCode(dto.PickupTimeType)
  const printModeCode = toPrintModeCode(dto.PrintMode)
  const overdueOperationCode = toOverdueOperationCode(dto.OverdueOperationType)

  const basicInfo: ShowFormData['basicInfo'] = {
    name: dto.ShowName,
    venueId: venueIdForForm || (dto.VenueUid ? String(dto.VenueUid) : ''),
    type: showTypeFromDto[showTypeCode],
    coverImage: dto.CoverImages,
    description: dto.Description,
    status,
    onlineTimeType:
      status === 'scheduled' && onlineTypeCode
        ? onlineTimeTypeFromDto[onlineTypeCode]
        : 'immediate',
    onlineTime: dto.OnlineTime || undefined,
    offlineTimeType:
      status === 'scheduled' && offlineTypeCode
        ? offlineTimeTypeFromDto[offlineTypeCode]
        : 'booking_end',
    offlineTime: dto.OfflineTime || undefined,
  }

  const salesRule: ShowFormData['salesRule'] = {
    storeIds: dto.AssignUsersForSale,
    verifyStoreIds: dto.AssignUsersForVerify,
    verifyStoreStations: mapVerifyStoreStationsFromDto(dto),
    orderChannels: mapOrderChannelsFromDto(dto.OrderChannels),
    needRiskNotice: dto.NeedRiskNotice === 1,
    riskNoticeMode: riskNoticeModeCode != null ? riskNoticeModeFromDto[riskNoticeModeCode] : 'text',
    riskNoticeText: dto.RiskNoticeText,
    riskNoticeFileName: dto.RiskNoticeFileName,
    enableGroupTicket: dto.EnableGroupTicket === 1,
    groupMinOrderLimitType:
      dto.EnableGroupTicket === 1 && dto.GroupTicketMinQuantity
        ? 'at_least'
        : ('unlimited' as const),
    groupMinOrderQuantity: dto.GroupTicketMinQuantity ?? undefined,
    paymentLimitType:
      dto.TimeLengthForAutoCancel && dto.TimeLengthForAutoCancel > 0
        ? 'minutes_after_order'
        : 'unlimited',
    paymentLimitMinutesAfterOrder: dto.TimeLengthForAutoCancel ?? undefined,
    purchaseLimitType:
      dto.MaxQuantityForPerIdentity && dto.MaxQuantityForPerIdentity > 0
        ? 'per_identity'
        : 'unlimited',
    purchaseLimitPerIdentity: dto.MaxQuantityForPerIdentity ?? undefined,
    saleEndRuleType: dto.TimeLengthForStopSale < 0 ? 'after' : ('before' as const),
    saleEndBeforeMinutes: dto.TimeLengthForStopSale >= 0 ? dto.TimeLengthForStopSale : undefined,
    saleEndAfterMinutes:
      dto.TimeLengthForStopSale < 0 ? Math.abs(dto.TimeLengthForStopSale) : undefined,
    pickupTimeType: pickupTimeCode != null ? pickupTimeTypeFromDto[pickupTimeCode] : 'no_pickup',
    printMode: printModeCode != null ? printModeFromDto[printModeCode] : 'one_per_person',
    autoPrint: dto.PrintTiming === 0,
    printTemplate: dto.PrintTemplateUid != null ? String(dto.PrintTemplateUid) : undefined,
    printCopyType: dto.PrintPriceType === 1 ? 'custom' : 'real_price',
    printCustomPrice:
      dto.PrintPriceType === 1 && dto.CustomPrintPrice != null
        ? Number(dto.CustomPrintPrice)
        : undefined,
    verifyMethods: mapCheckingWayFromDto(dto.CheckingWay),
    verifyTimeType: dto.VerifyTimeType === 1 ? 'custom' : ('same_day' as const),
    verifyTimeBeforeHours: dto.VerifyTimeBeforeHours ?? undefined,
    verifyTimeBeforeMinutes: dto.VerifyTimeBeforeMinutes ?? undefined,
    verifyTimeAfterHours: dto.VerifyTimeAfterHours ?? undefined,
    verifyTimeAfterMinutes: dto.VerifyTimeAfterMinutes ?? undefined,
    refundRuleType: refundRuleFromDto[toRefundRuleCode(dto.RefundRuleType)],
    refundDeadlineMinutesBeforeShow: dto.RefundDeadlineMinutesBeforeShow ?? undefined,
    refundFeeType: dto.NeedRefundFee === 1 ? 'need_fee' : 'no_fee',
    refundFeeRuleType:
      dto.NeedRefundFee === 1 && refundFeeModeCode != null
        ? refundFeeModeFromDto[refundFeeModeCode]
        : 'fixed',
    refundFeeFixedAmount: dto.RefundFeeFixedValue ?? undefined,
    refundFeeFixedUnit:
      refundFeeUnitCode != null ? refundFeeUnitFromDto[refundFeeUnitCode] : 'yuan',
    refundFeeLadderRules: (dto.RefundFeeLadderRules || []).map((rule) => ({
      id: `${rule.OffsetDirection}_${rule.OffsetDays}_${rule.OffsetTime}`,
      offsetDirection: rule.OffsetDirection === 1 ? 'after' : 'before',
      offsetDays: rule.OffsetDays,
      offsetTime: rule.OffsetTime,
      feeRate: rule.FeeValue,
      feeUnit: refundFeeUnitFromDto[toRefundFeeUnitCode(rule.FeeUnit) ?? 0],
    })),
    refundReviewType:
      refundAuditModeCode != null ? refundAuditModeFromDto[refundAuditModeCode] : 'auto',
    overdueOperationType:
      overdueOperationCode != null ? overdueOperationFromDto[overdueOperationCode] : 'none',
  }

  const details: ShowFormData['details'] = {
    intro: dto.DetailsIncludeRule,
    bookingRule: dto.DetailsBookingRule,
    refundRule: dto.DetailsRefundRule,
    safetyNotice: dto.DetailsSafetyNotice,
    detailImages: dto.DetailImages,
  }

  const sessionConfigs = mapSessionsFromDto(dto)

  return {
    basicInfo,
    salesRule,
    details,
    sessionConfigs,
  }
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
