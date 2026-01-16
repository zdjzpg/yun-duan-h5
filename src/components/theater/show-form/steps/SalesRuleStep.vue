<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import message from 'ant-design-vue/es/message'
import type { ShowFormSalesRule, VerifyStoreStationConfig, VerifyStoreStationItem } from '../types'
import StoreSelectorModal from '@/components/store/StoreSelectorModal.vue'
import { fetchPrintTemplates, type PrintTemplateItem } from '@/api/printTemplate'

const props = defineProps<{
  modelValue: ShowFormSalesRule
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: ShowFormSalesRule): void
}>()

const salesRule = computed({
  get: () => props.modelValue,
  set: (val: ShowFormSalesRule) => emit('update:modelValue', val),
} as any)

const riskNoticeFileList = ref<any[]>([])
const storeSelectorVisible = ref(false)
const verifyStoreSelectorVisible = ref(false)

const selectedStoreIds = computed(
  (): number[] => ((salesRule.value as any).storeIds as number[]) || [],
)

const handleStoreIdsChange = (ids: number[]) => {
  ;(salesRule.value as any).storeIds = ids
}

const selectedStoreText = computed(() => {
  const count = selectedStoreIds.value.length
  if (!count) return '未选择门店'
  return `已选择 ${count} 家门店`
})

const selectedVerifyStoreIds = computed(
  (): number[] => ((salesRule.value as any).verifyStoreIds as number[]) || [],
)

const handleVerifyStoreIdsChange = (ids: number[]) => {
  ;(salesRule.value as any).verifyStoreIds = ids
}

const selectedVerifyStoreText = computed(() => {
  const count = selectedVerifyStoreIds.value.length
  if (!count) return '未选择门店'
  return `已选择 ${count} 家门店`
})

const verifyStoreStations = computed<VerifyStoreStationConfig[]>({
  get: () => {
    const raw = (salesRule.value as any)?.verifyStoreStations as
      | VerifyStoreStationConfig[]
      | undefined
    return Array.isArray(raw) ? raw : []
  },
  set: (val: VerifyStoreStationConfig[]) => {
    ;(salesRule.value as any).verifyStoreStations = val
  },
} as any)

const syncVerifyStoreStationsWithIds = (ids: number[]) => {
  const existing = verifyStoreStations.value || []
  const map = new Map<number, VerifyStoreStationConfig>()
  existing.forEach((item: VerifyStoreStationConfig) => {
    if (!item) return
    map.set(item.storeId, {
      ...item,
      stations: Array.isArray(item.stations) ? item.stations : [],
    })
  })

  const next: VerifyStoreStationConfig[] = ids.map((id: number) => {
    const found = map.get(id)
    if (found) return found
    return {
      storeId: id,
      storeName: undefined,
      stations: [],
    }
  })

  verifyStoreStations.value = next
}

watch(
  () => selectedVerifyStoreIds.value,
  (ids) => {
    syncVerifyStoreStationsWithIds(ids || [])
  },
  { immediate: true },
)

type VerifyStoreTableRow = {
  storeId: number
  storeName: string
  summaryText: string
  namesText: string
}

const getStoreDisplayName = (config: VerifyStoreStationConfig): string =>
  config.storeName || `门店 ${config.storeId}`

const buildStationSummary = (config: VerifyStoreStationConfig) => {
  const stations = Array.isArray(config.stations) ? config.stations : []
  const enabledStations = stations.filter((item: VerifyStoreStationItem) => item.enabled)
  const count = enabledStations.length
  const summaryText = count ? `已选择 ${count} 个站点` : '未选择站点'
  const namesText = enabledStations
    .map((item: VerifyStoreStationItem) => item.stationName)
    .join('，')
  return { summaryText, namesText }
}

const verifyStoreTableRows = computed<VerifyStoreTableRow[]>(() =>
  verifyStoreStations.value.map((config: VerifyStoreStationConfig) => {
    const { summaryText, namesText } = buildStationSummary(config)
    return {
      storeId: config.storeId,
      storeName: getStoreDisplayName(config),
      summaryText,
      namesText,
    }
  }),
)

const verifyStoreTableColumns = [
  { title: '门店名称', dataIndex: 'storeName', key: 'storeName', width: 150 },
  { title: '验票站点', dataIndex: 'stations', key: 'stations' },
  { title: '操作', dataIndex: 'actions', key: 'actions', width: 80 },
]

const handleRemoveVerifyStore = (storeId: number) => {
  const ids = selectedVerifyStoreIds.value.filter((id: number) => id !== storeId)
  ;(salesRule.value as any).verifyStoreIds = ids
}

const verifyStationModalVisible = ref(false)
const verifyStationModalLoading = ref(false)
const verifyStationModalItems = ref<VerifyStoreStationItem[]>([])
const verifyStationModalBatchLimit = ref<number | null>(null)
const activeVerifyStoreId = ref<number | null>(null)

const activeVerifyStoreConfig = computed<VerifyStoreStationConfig | null>(() => {
  const id = activeVerifyStoreId.value
  if (id == null) return null
  return (
    verifyStoreStations.value.find((item: VerifyStoreStationConfig) => item.storeId === id) || null
  )
})

const activeVerifyStoreName = computed(() => {
  const config = activeVerifyStoreConfig.value
  if (!config) return ''
  return getStoreDisplayName(config)
})

const createMockStations = (storeId: number): VerifyStoreStationItem[] => {
  const baseNames = ['北门出园', '北门入园', '南门入园A', '南门入园B', '新增门票时创建']
  return baseNames.map((name, index) => ({
    stationId: `${storeId}-${index + 1}`,
    stationName: name,
    enabled: false,
    verifyLimit: null,
  }))
}

const fetchStationsForStore = async (storeId: number): Promise<VerifyStoreStationItem[]> => {
  // TODO: 替换为真实接口调用
  return createMockStations(storeId)
}

const ensureStationsLoadedForStore = async (storeId: number) => {
  const existing = verifyStoreStations.value.find(
    (item: VerifyStoreStationConfig) => item.storeId === storeId,
  )
  if (!existing) return

  const existingStations = Array.isArray(existing.stations) ? existing.stations : []
  if (existingStations.length) {
    verifyStationModalItems.value = existingStations.map((item: VerifyStoreStationItem) => ({
      ...item,
    }))
    return
  }

  verifyStationModalLoading.value = true
  try {
    const list = await fetchStationsForStore(storeId)
    const normalized = list.map((item: VerifyStoreStationItem) => ({
      ...item,
      // 首次加载时默认不选中任何站点，等用户手动勾选并点击“确定”后再保存选择
      enabled: false,
    }))

    const next = verifyStoreStations.value.map((config: VerifyStoreStationConfig) =>
      config.storeId === storeId ? { ...config, stations: normalized } : config,
    )
    verifyStoreStations.value = next
    verifyStationModalItems.value = normalized.map((item: VerifyStoreStationItem) => ({ ...item }))
  } catch (err) {
    console.error(err)
    message.error('获取验票站点失败')
  } finally {
    verifyStationModalLoading.value = false
  }
}

const openVerifyStationModal = async (storeId: number) => {
  activeVerifyStoreId.value = storeId
  verifyStationModalBatchLimit.value = null
  await ensureStationsLoadedForStore(storeId)
  verifyStationModalVisible.value = true
}

const handleVerifyStationModalOk = () => {
  const storeId = activeVerifyStoreId.value
  if (storeId == null) {
    verifyStationModalVisible.value = false
    return
  }

  const items = verifyStationModalItems.value.map((item: VerifyStoreStationItem) => {
    const rawLimit = item.verifyLimit
    const normalizedLimit = rawLimit == null || rawLimit === 0 ? null : Number(rawLimit)

    return {
      ...item,
      enabled: !!item.enabled,
      verifyLimit: normalizedLimit,
    }
  })

  const next = verifyStoreStations.value.map((config: VerifyStoreStationConfig) =>
    config.storeId === storeId ? { ...config, stations: items } : config,
  )
  verifyStoreStations.value = next
  verifyStationModalVisible.value = false
}

const handleVerifyStationModalCancel = () => {
  verifyStationModalVisible.value = false
}

const applyVerifyStationBatchLimit = () => {
  const value = verifyStationModalBatchLimit.value
  // 空值：视为将已选站点改为“无限”
  if (value == null) {
    applyVerifyStationBatchUnlimited()
    return
  }

  const num = Number(value)
  if (Number.isNaN(num) || num <= 0) {
    message.error('请输入大于 0 的次数')
    return
  }

  verifyStationModalItems.value = verifyStationModalItems.value.map(
    (item: VerifyStoreStationItem) => (item.enabled ? { ...item, verifyLimit: num } : item),
  )
}

const applyVerifyStationBatchUnlimited = () => {
  verifyStationModalItems.value = verifyStationModalItems.value.map(
    (item: VerifyStoreStationItem) => (item.enabled ? { ...item, verifyLimit: null } : item),
  )
}

const verifyStationRowSelection: any = computed(() => ({
  selectedRowKeys: verifyStationModalItems.value
    .filter((item: VerifyStoreStationItem) => item.enabled)
    .map((item: VerifyStoreStationItem) => item.stationId),
  onChange: (selectedRowKeys: (string | number)[]) => {
    const keySet = new Set<string>(selectedRowKeys.map((key) => String(key)))
    verifyStationModalItems.value = verifyStationModalItems.value.map(
      (item: VerifyStoreStationItem) => ({
        ...item,
        enabled: keySet.has(item.stationId),
      }),
    )
  },
}))

const verifyStationTableColumns = [
  { title: '站点', dataIndex: 'stationName', key: 'name' },
  { title: '验票次数', dataIndex: 'verifyLimit', key: 'limit', width: 140 },
]

type PrintTemplateOption = { label: string; value: string }
const printTemplateOptions = ref<PrintTemplateOption[]>([])
const printTemplateLoading = ref(false)
type VerifyMethod = NonNullable<ShowFormSalesRule['verifyMethods']>[number]

const ensureTemplateOption = (value?: string | null) => {
  if (!value) return
  const exists = printTemplateOptions.value.some(
    (option: PrintTemplateOption) => option.value === value,
  )
  if (!exists) {
    printTemplateOptions.value.push({
      label: `模板 ${value}`,
      value,
    })
  }
}

const mapTemplatesToOptions = (list: PrintTemplateItem[]): PrintTemplateOption[] => {
  const mapped = list.map((item: PrintTemplateItem) => ({
    label: item.Name?.trim() || `模板 ${item.Uid}`,
    value: String(item.Uid),
  }))
  return mapped
}

const loadPrintTemplates = async () => {
  try {
    printTemplateLoading.value = true
    const list = await fetchPrintTemplates()
    printTemplateOptions.value = mapTemplatesToOptions(list)
    ensureTemplateOption((salesRule.value as any)?.printTemplate)
  } catch (err) {
    console.error(err)
    message.error('获取打印模板失败')
  } finally {
    printTemplateLoading.value = false
  }
}

watch(
  () => (salesRule.value as any)?.printTemplate,
  (val) => {
    if (typeof val === 'string' && val) {
      ensureTemplateOption(val)
    }
  },
  { immediate: true },
)

onMounted(() => {
  loadPrintTemplates()
})

const handleRiskNoticeBeforeUpload = (file: any) => {
  riskNoticeFileList.value = [file]
  if (salesRule.value) {
    ;(salesRule.value as any).riskNoticeFileName = file.name
  }
  return false
}

const createRefundFeeLadderRule = () => ({
  id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  offsetDirection: 'before' as const,
  offsetDays: 0,
  offsetTime: undefined as any,
  feeRate: undefined as any,
  feeUnit: 'yuan' as const,
})

const ensureRefundFeeLadderRules = () => {
  if (!salesRule.value) return
  const target: any = salesRule.value
  if (!Array.isArray(target.refundFeeLadderRules)) {
    target.refundFeeLadderRules = []
  }
}

const handleAddRefundFeeLadderRule = () => {
  ensureRefundFeeLadderRules()
  const target: any = salesRule.value
  target.refundFeeLadderRules.push(createRefundFeeLadderRule())
}

const handleRemoveRefundFeeLadderRule = (index: number) => {
  if (!salesRule.value) return
  const target: any = salesRule.value
  if (!Array.isArray(target.refundFeeLadderRules)) return
  target.refundFeeLadderRules.splice(index, 1)
}

watch(
  () => (salesRule.value as any)?.refundRuleType,
  (next) => {
    const target: any = salesRule.value || {}
    // 当退票规则不是“随时退”时，如果过期操作还是“过期自动退”，自动切回“不处理”
    if (next !== 'anytime' && target.overdueOperationType === 'auto_refund') {
      target.overdueOperationType = 'none'
    }
  },
)

const isSameMethodArray = (current: VerifyMethod[] = [], next: VerifyMethod[] = []) => {
  if (current.length !== next.length) return false
  return current.every((item, index) => item === next[index])
}

const ensureExclusiveVerifyMethods = (methods?: VerifyMethod[]) => {
  if (!Array.isArray(methods)) return []
  const result: VerifyMethod[] = []
  let hasExclusiveSelected = false

  methods.forEach((method) => {
    if (method === 'order_qr' || method === 'ticket_qr') {
      if (!hasExclusiveSelected) {
        result.push(method)
        hasExclusiveSelected = true
      }
    } else if (!result.includes(method)) {
      result.push(method)
    }
  })

  return result
}

const handleVerifyMethodsChange = (next: VerifyMethod[]) => {
  const normalized = ensureExclusiveVerifyMethods(next)
  ;(salesRule.value as any).verifyMethods = normalized
}

watch(
  () => (salesRule.value as any)?.verifyMethods,
  (methods) => {
    const normalized = ensureExclusiveVerifyMethods(methods as VerifyMethod[])
    if (!isSameMethodArray(methods as VerifyMethod[], normalized)) {
      ;(salesRule.value as any).verifyMethods = normalized
    }
  },
  { immediate: true },
)

const validateStoreSelection = () => {
  const ids = (salesRule.value as any)?.storeIds
  if (!Array.isArray(ids) || ids.length === 0) {
    return Promise.reject(new Error('请选择销售门店'))
  }
  return Promise.resolve()
}

const validateVerifyStoreSelection = () => {
  const ids = (salesRule.value as any)?.verifyStoreIds
  if (!Array.isArray(ids) || ids.length === 0) {
    return Promise.reject(new Error('请选择核销门店'))
  }
  return Promise.resolve()
}

const validateGroupMinOrderQuantity = (_rule: any, value: number) => {
  if (!salesRule.value?.enableGroupTicket) return Promise.resolve()
  if (salesRule.value.groupMinOrderLimitType !== 'at_least') return Promise.resolve()
  const parsed = typeof value === 'number' ? value : Number(value)
  if (!parsed || parsed <= 0) {
    return Promise.reject(new Error('请输入最小起订量'))
  }
  return Promise.resolve()
}

const validatePaymentLimitMinutes = (_rule: any, value: number) => {
  if (salesRule.value?.paymentLimitType !== 'minutes_after_order') return Promise.resolve()
  const parsed = typeof value === 'number' ? value : Number(value)
  if (!parsed || parsed <= 0) {
    return Promise.reject(new Error('请输入支付限制时间'))
  }
  return Promise.resolve()
}

const validatePurchaseLimitQuantity = (_rule: any, value: number) => {
  if (salesRule.value?.purchaseLimitType !== 'per_identity') return Promise.resolve()
  const parsed = typeof value === 'number' ? value : Number(value)
  if (!parsed || parsed <= 0) {
    return Promise.reject(new Error('请输入购票数量'))
  }
  return Promise.resolve()
}

const validateSaleEndBeforeMinutes = (_rule: any, value: number | null | undefined) => {
  if (salesRule.value?.saleEndRuleType !== 'before') return Promise.resolve()
  if (value === undefined || value === null) {
    return Promise.reject(new Error('请输入停售时间'))
  }
  return Promise.resolve()
}

const validateSaleEndAfterMinutes = (_rule: any, value: number | null | undefined) => {
  if (salesRule.value?.saleEndRuleType !== 'after') return Promise.resolve()
  if (value === undefined || value === null) {
    return Promise.reject(new Error('请输入停售时间'))
  }
  return Promise.resolve()
}

const validateRiskNoticeMode = (_rule: any, value: string | undefined) => {
  if (!salesRule.value?.needRiskNotice) return Promise.resolve()
  if (!value) {
    return Promise.reject(new Error('请选择风险提示内容形式'))
  }
  return Promise.resolve()
}

const validateRiskNoticeText = (_rule: any, value: string | undefined) => {
  if (!salesRule.value?.needRiskNotice) return Promise.resolve()
  if (salesRule.value.riskNoticeMode !== 'text' && salesRule.value.riskNoticeMode !== undefined) {
    return Promise.resolve()
  }
  if (!value || !value.trim()) {
    return Promise.reject(new Error('请输入风险提示内容'))
  }
  return Promise.resolve()
}

const validateRiskNoticeFileName = (_rule: any, value: string | undefined) => {
  if (!salesRule.value?.needRiskNotice) return Promise.resolve()
  if (salesRule.value.riskNoticeMode !== 'file') return Promise.resolve()
  if (!value) {
    return Promise.reject(new Error('请上传风险提示文档'))
  }
  return Promise.resolve()
}

const createVerifyTimeValidator = (field: 'beforeMinutes' | 'afterMinutes') => {
  return (_rule: any, value: number | null | undefined) => {
    if (salesRule.value?.verifyTimeType !== 'custom') return Promise.resolve()
    if (value === undefined || value === null) {
      const map: Record<string, string> = {
        beforeMinutes: '请输入提前分钟数',
        afterMinutes: '请输入推后分钟数',
      }
      return Promise.reject(new Error(map[field]))
    }
    return Promise.resolve()
  }
}

const validatePrintCustomPrice = (_rule: any, value: number | string | null | undefined) => {
  if (salesRule.value?.printCopyType !== 'custom') return Promise.resolve()
  if (value === undefined || value === null || value === '') {
    return Promise.reject(new Error('请输入自定义打印票价'))
  }
  return Promise.resolve()
}

const validateRefundFeeFixedAmount = (_rule: any, value: number | null | undefined) => {
  if (salesRule.value?.refundFeeType !== 'need_fee') return Promise.resolve()
  if (salesRule.value?.refundFeeRuleType !== 'fixed') return Promise.resolve()
  if (value === undefined || value === null) {
    return Promise.reject(new Error('请输入手续费金额'))
  }
  return Promise.resolve()
}

const createRefundFeeLadderValidator = (
  index: number,
  field: 'offsetDays' | 'offsetTime' | 'feeRate',
) => {
  return (_rule: any, value: any) => {
    const current = salesRule.value
    if (!current) return Promise.resolve()
    if (current.refundFeeType !== 'need_fee' || current.refundFeeRuleType !== 'ladder') {
      return Promise.resolve()
    }
    const target = current.refundFeeLadderRules?.[index]
    if (!target) return Promise.resolve()
    if (field === 'offsetTime') {
      if (!value) {
        return Promise.reject(new Error('请选择时间'))
      }
    } else if (field === 'feeRate') {
      if (value === undefined || value === null || value === '') {
        return Promise.reject(new Error('请输入手续费'))
      }
    } else if (field === 'offsetDays') {
      if (value === undefined || value === null || value === '') {
        return Promise.reject(new Error('请输入天数'))
      }
    }
    return Promise.resolve()
  }
}
</script>

<template>
  <div class="sales-rule-step">
    <!-- 下单规则 -->
    <div class="sales-rule-section">
      <a-typography-title :level="5" class="sales-rule-section-title">
        下单规则
      </a-typography-title>

      <a-form-item
        class="sales-rule-line"
        label="销售门店"
        :name="['salesRule', 'storeIds']"
        :rules="[{ validator: validateStoreSelection, trigger: 'change' }]"
      >
        <a-typography-link class="store-selector-link" @click="storeSelectorVisible = true">
          {{ selectedStoreText }}
        </a-typography-link>
      </a-form-item>

      <a-form-item class="sales-rule-line" label="可售渠道">
        <a-checkbox-group v-model:value="salesRule.orderChannels">
          <a-checkbox value="online_mini_program">线上小程序</a-checkbox>
          <a-checkbox value="offline_window">线下票务窗口</a-checkbox>
        </a-checkbox-group>
      </a-form-item>
      <!-- 实名制这期不做 -->
      <a-form-item
        class="sales-rule-line"
        label="实名制"
        :name="['salesRule', 'realNameType']"
        :rules="[{ required: true, message: '请选择实名制规则' }]"
        v-if="false"
      >
        <a-radio-group v-model:value="salesRule.realNameType">
          <a-radio value="none">无需</a-radio>
          <a-radio value="one_buyer">填写一位取票人身份信息</a-radio>
          <a-radio value="all_visitors">所有游客都需要填写身份信息</a-radio>
        </a-radio-group>
      </a-form-item>

      <a-form-item
        v-if="salesRule.realNameType === 'all_visitors'"
        class="sales-rule-line"
        label="年龄限制"
        :name="['salesRule', 'ageLimitType']"
        :rules="[{ required: true, message: '请选择年龄限制' }]"
      >
        <a-radio-group v-model:value="salesRule.ageLimitType">
          <a-radio value="unlimited">不限年龄</a-radio>
          <a-radio value="limited">限制年龄</a-radio>
        </a-radio-group>
      </a-form-item>

      <a-form-item
        class="sales-rule-line"
        label="风险提示"
        :name="['salesRule', 'needRiskNotice']"
        :rules="[{ required: true, message: '请选择风险提示' }]"
      >
        <div class="risk-notice-row">
          <a-radio-group v-model:value="salesRule.needRiskNotice">
            <a-radio :value="false">无需</a-radio>
            <a-radio :value="true">需要</a-radio>
          </a-radio-group>

          <template v-if="salesRule.needRiskNotice">
            <a-form-item
              class="risk-notice-inline-item"
              :name="['salesRule', 'riskNoticeMode']"
              :rules="[{ validator: validateRiskNoticeMode, trigger: 'change' }]"
            >
              <a-select
                v-model:value="salesRule.riskNoticeMode"
                style="width: 120px"
                placeholder="请选择"
              >
                <a-select-option value="text">输入文本</a-select-option>
                <a-select-option value="file">上传文档</a-select-option>
              </a-select>
            </a-form-item>

            <template v-if="salesRule.riskNoticeMode === 'file'">
              <a-form-item
                class="risk-notice-inline-item risk-notice-upload-item"
                :name="['salesRule', 'riskNoticeFileName']"
                :rules="[{ validator: validateRiskNoticeFileName, trigger: 'change' }]"
              >
                <span class="risk-notice-upload">
                  <a-upload
                    v-model:file-list="riskNoticeFileList"
                    :before-upload="handleRiskNoticeBeforeUpload"
                    :max-count="1"
                  >
                    <a-button type="default" style="height: 32px">上传</a-button>
                  </a-upload>
                </span>
              </a-form-item>
            </template>
          </template>
        </div>

        <a-form-item
          v-if="
            salesRule.needRiskNotice &&
            (salesRule.riskNoticeMode === 'text' || !salesRule.riskNoticeMode)
          "
          class="risk-notice-text-wrapper"
          :name="['salesRule', 'riskNoticeText']"
          :rules="[{ validator: validateRiskNoticeText, trigger: ['change', 'blur'] }]"
        >
          <a-textarea
            v-model:value="salesRule.riskNoticeText"
            placeholder="请输入风险提示"
            :maxlength="500"
            show-count
            :auto-size="{ minRows: 4, maxRows: 4 }"
          />
        </a-form-item>
      </a-form-item>

      <a-form-item
        class="sales-rule-line"
        label="团体票"
        :name="['salesRule', 'enableGroupTicket']"
        :rules="[{ required: true, message: '请选择是否支持团体票' }]"
      >
        <a-radio-group v-model:value="salesRule.enableGroupTicket">
          <a-radio :value="true">是</a-radio>
          <a-radio :value="false">否</a-radio>
        </a-radio-group>
      </a-form-item>

      <a-form-item
        v-if="salesRule.enableGroupTicket"
        class="sales-rule-line"
        label="最小起订量"
        :rules="[{ required: true }]"
      >
        <div class="sales-rule-control-column">
          <a-radio-group v-model:value="salesRule.groupMinOrderLimitType">
            <a-radio value="unlimited">不限制</a-radio>
            <a-radio value="at_least">
              <div class="align-center">
                <span class="sales-rule-inline-prefix">至少</span>

                <a-form-item
                  v-if="salesRule.groupMinOrderLimitType === 'at_least'"
                  class="inline-number-item"
                  :name="['salesRule', 'groupMinOrderQuantity']"
                  :rules="[
                    { validator: validateGroupMinOrderQuantity, trigger: ['change', 'blur'] },
                  ]"
                >
                  <a-input-number
                    v-model:value="salesRule.groupMinOrderQuantity"
                    :min="1"
                    :max="9999"
                    style="width: 80px; margin: 0 4px"
                  />
                </a-form-item>

                张
              </div>
            </a-radio>
          </a-radio-group>
        </div>
      </a-form-item>

      <a-form-item
        class="sales-rule-line"
        label="支付限制"
        :name="['salesRule', 'paymentLimitType']"
        :rules="[{ required: true, message: '请选择支付限制' }]"
      >
        <a-radio-group v-model:value="salesRule.paymentLimitType">
          <a-radio value="minutes_after_order">
            <div style="display: flex; align-items: center">
              <span class="sales-rule-inline-prefix">下单后</span>
              <a-form-item
                v-if="salesRule.paymentLimitType === 'minutes_after_order'"
                class="inline-number-item"
                :name="['salesRule', 'paymentLimitMinutesAfterOrder']"
                :rules="[{ validator: validatePaymentLimitMinutes, trigger: ['change', 'blur'] }]"
              >
                <a-input-number
                  v-model:value="salesRule.paymentLimitMinutesAfterOrder"
                  :min="1"
                  :max="600"
                  style="width: 80px"
                />
              </a-form-item>
              分钟未付款自动取消订单
            </div>
          </a-radio>
          <a-radio value="unlimited">不限制</a-radio>
        </a-radio-group>
      </a-form-item>

      <a-form-item
        class="sales-rule-line"
        label="购票限制"
        :name="['salesRule', 'purchaseLimitType']"
        :rules="[{ required: true, message: '请选择购票限制' }]"
      >
        <a-radio-group v-model:value="salesRule.purchaseLimitType">
          <a-radio value="per_identity">
            <div style="display: flex; align-items: center">
              <span class="sales-rule-inline-prefix">每个手机号/身份证最多购买</span>
              <a-form-item
                v-if="salesRule.purchaseLimitType === 'per_identity'"
                class="inline-number-item"
                :name="['salesRule', 'purchaseLimitPerIdentity']"
                :rules="[{ validator: validatePurchaseLimitQuantity, trigger: ['change', 'blur'] }]"
              >
                <a-input-number
                  v-model:value="salesRule.purchaseLimitPerIdentity"
                  :min="1"
                  :max="99"
                  style="width: 80px"
                />
              </a-form-item>
              张
            </div>
          </a-radio>
          <a-radio value="unlimited">不限制</a-radio>
        </a-radio-group>
      </a-form-item>

      <a-form-item
        class="sales-rule-line sales-rule-line-mt1"
        label="停售规则"
        :name="['salesRule', 'saleEndRuleType']"
        :rules="[{ required: true, message: '请选择停售规则' }]"
      >
        <div class="sales-rule-control-column">
          <a-radio-group v-model:value="salesRule.saleEndRuleType">
            <div class="sales-rule-inline-option">
              <a-radio value="before">
                <div class="align-center">
                  可售至：开演前

                  <a-form-item
                    v-if="salesRule.saleEndRuleType === 'before'"
                    class="inline-number-item"
                    :name="['salesRule', 'saleEndBeforeMinutes']"
                    :rules="[
                      { validator: validateSaleEndBeforeMinutes, trigger: ['change', 'blur'] },
                    ]"
                  >
                    <a-input-number
                      v-model:value="salesRule.saleEndBeforeMinutes"
                      :min="0"
                      :max="1440"
                      style="width: 80px"
                    />
                  </a-form-item>

                  分钟（含）
                </div>
              </a-radio>
            </div>
            <div class="sales-rule-inline-option">
              <a-radio value="after">
                <div class="align-center">
                  可售至：开演后
                  <a-form-item
                    v-if="salesRule.saleEndRuleType === 'after'"
                    class="inline-number-item"
                    :name="['salesRule', 'saleEndAfterMinutes']"
                    :rules="[
                      { validator: validateSaleEndAfterMinutes, trigger: ['change', 'blur'] },
                    ]"
                  >
                    <a-input-number
                      v-model:value="salesRule.saleEndAfterMinutes"
                      :min="0"
                      :max="1440"
                      style="width: 80px"
                    />
                  </a-form-item>
                  分钟（含）
                </div>
              </a-radio>
            </div>
          </a-radio-group>
        </div>
      </a-form-item>
    </div>

    <!-- 取票 / 验票规则 -->
    <div class="sales-rule-section">
      <a-typography-title :level="5" class="sales-rule-section-title">
        取票 / 验票规则
      </a-typography-title>

      <a-form-item
        class="sales-rule-line"
        label="核销门店"
        :name="['salesRule', 'verifyStoreIds']"
        :rules="[{ validator: validateVerifyStoreSelection, trigger: 'change' }]"
      >
        <div class="verify-store-field">
          <div class="verify-store-selector">
            <a-typography-link
              class="store-selector-link"
              @click="verifyStoreSelectorVisible = true"
            >
              {{ selectedVerifyStoreText }}
            </a-typography-link>
          </div>

          <div v-if="verifyStoreTableRows.length" class="verify-store-table-wrapper">
            <a-table
              class="verify-store-table"
              :dataSource="verifyStoreTableRows"
              :columns="verifyStoreTableColumns"
              :pagination="false"
              size="small"
              :rowKey="(row: VerifyStoreTableRow) => row.storeId"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'storeName'">
                  <span class="verify-store-name">{{ record.storeName }}</span>
                </template>
                <template v-else-if="column.key === 'stations'">
                  <div class="verify-station-cell">
                    <div
                      class="verify-station-fake-select"
                      @click="openVerifyStationModal(record.storeId)"
                    >
                      <span>{{ record.summaryText }}</span>
                      <span class="verify-station-fake-select-arrow">▼</span>
                    </div>
                    <div v-if="record.namesText" class="verify-station-names">
                      {{ record.namesText }}
                    </div>
                  </div>
                </template>
                <template v-else-if="column.key === 'actions'">
                  <a-typography-link @click="handleRemoveVerifyStore(record.storeId)">
                    删除
                  </a-typography-link>
                </template>
              </template>
            </a-table>
          </div>
        </div>
      </a-form-item>

      <a-form-item
        class="sales-rule-line"
        label="取票时机"
        :name="['salesRule', 'pickupTimeType']"
        :rules="[{ required: true, message: '请选择取票时机' }]"
      >
        <a-radio-group v-model:value="salesRule.pickupTimeType">
          <a-radio value="no_pickup">无需取票</a-radio>
          <a-radio value="same_day">当天可取</a-radio>
        </a-radio-group>
      </a-form-item>

      <a-form-item
        class="sales-rule-line"
        label="打印方式"
        :name="['salesRule', 'printMode']"
        :rules="[{ required: true, message: '请选择打印方式' }]"
      >
        <a-radio-group v-model:value="salesRule.printMode">
          <a-radio value="one_per_person">一票一人</a-radio>
          <a-radio value="one_per_type">一种票一张</a-radio>
        </a-radio-group>
      </a-form-item>

      <a-form-item
        class="sales-rule-line"
        label="自动打印"
        :name="['salesRule', 'autoPrint']"
        :rules="[{ required: true, message: '请选择是否自动打印' }]"
      >
        <a-radio-group v-model:value="salesRule.autoPrint">
          <a-radio :value="true">是</a-radio>
          <a-radio :value="false">否</a-radio>
        </a-radio-group>
      </a-form-item>

      <a-form-item
        class="sales-rule-line"
        label="打印模板"
        :name="['salesRule', 'printTemplate']"
        :rules="[{ required: true, message: '请选择打印模板' }]"
      >
        <a-select
          v-model:value="salesRule.printTemplate"
          style="width: 200px"
          placeholder="请选择"
          :loading="printTemplateLoading"
        >
          <a-select-option
            v-for="option in printTemplateOptions"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </a-select-option>
        </a-select>
      </a-form-item>

      <a-form-item
        class="sales-rule-line"
        label="打印票价"
        :name="['salesRule', 'printCopyType']"
        :rules="[{ required: true, message: '请选择打印票价' }]"
      >
        <div class="print-price-row">
          <a-radio-group v-model:value="salesRule.printCopyType" class="print-price-group">
            <a-radio value="real_price">真实票价</a-radio>
            <a-radio value="custom">自定义</a-radio>
          </a-radio-group>
          <a-form-item
            v-if="salesRule.printCopyType === 'custom'"
            class="inline-number-item"
            :name="['salesRule', 'printCustomPrice']"
            :rules="[{ validator: validatePrintCustomPrice, trigger: ['change', 'blur'] }]"
          >
            <a-input
              v-model:value="salesRule.printCustomPrice"
              addon-before="￥"
              class="print-price-input"
              placeholder="请输入"
            />
          </a-form-item>
        </div>
      </a-form-item>

      <a-form-item class="sales-rule-line" label="验票方式">
        <a-checkbox-group
          v-model:value="salesRule.verifyMethods"
          @change="handleVerifyMethodsChange"
        >
          <a-checkbox value="order_qr">订单二维码</a-checkbox>
          <a-checkbox value="ticket_qr">票二维码</a-checkbox>
          <a-checkbox value="paper">票根</a-checkbox>
        </a-checkbox-group>
      </a-form-item>

      <a-form-item
        class="sales-rule-line sales-rule-line-mt1"
        label="验票时限"
        :name="['salesRule', 'verifyTimeType']"
        :rules="[{ required: true, message: '请选择验票时限' }]"
      >
        <div class="sales-rule-control-column">
          <a-radio-group v-model:value="salesRule.verifyTimeType" class="verify-time-radio-group">
            <a-radio value="same_day">不限</a-radio>
            <a-radio value="custom">
              <div class="align-center">
                <span>自定义：开演时间提前不超过</span>
                <a-form-item
                  v-if="salesRule.verifyTimeType === 'custom'"
                  class="inline-number-item"
                  :name="['salesRule', 'verifyTimeBeforeMinutes']"
                  :rules="[
                    {
                      validator: createVerifyTimeValidator('beforeMinutes'),
                      trigger: ['change', 'blur'],
                    },
                  ]"
                >
                  <a-input-number
                    v-model:value="salesRule.verifyTimeBeforeMinutes"
                    :min="0"
                    :max="10080"
                    style="width: 100px"
                  />
                </a-form-item>
                <span>分钟；开演时间推后不超过</span>
                <a-form-item
                  v-if="salesRule.verifyTimeType === 'custom'"
                  class="inline-number-item"
                  :name="['salesRule', 'verifyTimeAfterMinutes']"
                  :rules="[
                    {
                      validator: createVerifyTimeValidator('afterMinutes'),
                      trigger: ['change', 'blur'],
                    },
                  ]"
                >
                  <a-input-number
                    v-model:value="salesRule.verifyTimeAfterMinutes"
                    :min="0"
                    :max="10080"
                    style="width: 100px"
                  />
                </a-form-item>
                <span>分钟</span>
              </div>
            </a-radio>
          </a-radio-group>
        </div>
      </a-form-item>
    </div>

    <!-- 退改规则 -->
    <div class="sales-rule-section">
      <a-typography-title :level="5" class="sales-rule-section-title">
        退改规则
      </a-typography-title>

      <a-form-item
        class="sales-rule-line"
        label="退票规则"
        :name="['salesRule', 'refundRuleType']"
        :rules="[{ required: true, message: '请选择退票规则' }]"
      >
        <a-radio-group v-model:value="salesRule.refundRuleType">
          <a-radio value="not_refundable">不可退</a-radio>
          <a-radio value="conditional">有条件退</a-radio>
          <a-radio value="anytime">随时退</a-radio>
        </a-radio-group>
      </a-form-item>

      <a-form-item
        v-if="salesRule.refundRuleType === 'conditional'"
        class="sales-rule-line"
        label="退票截止"
        :name="['salesRule', 'refundDeadlineMinutesBeforeShow']"
        :rules="[{ required: true, message: '请输入退票截止时间' }]"
      >
        <span class="sales-rule-inline-prefix">开演前</span>
        <a-input-number
          v-model:value="salesRule.refundDeadlineMinutesBeforeShow"
          :min="0"
          :max="1440"
          style="width: 80px; margin: 0 4px"
        />
        分钟（含）
      </a-form-item>

      <a-form-item
        v-if="salesRule.refundRuleType === 'conditional' || salesRule.refundRuleType === 'anytime'"
        class="sales-rule-line"
        label="退票手续费"
        :name="['salesRule', 'refundFeeType']"
        :rules="[{ required: true, message: '请选择退票手续费规则' }]"
      >
        <a-radio-group v-model:value="salesRule.refundFeeType">
          <a-radio value="no_fee">不需手续费</a-radio>
          <a-radio value="need_fee">需手续费</a-radio>
        </a-radio-group>
      </a-form-item>

      <a-form-item
        v-if="
          (salesRule.refundRuleType === 'conditional' ||
            salesRule.refundRuleType === 'anytime') &&
          salesRule.refundFeeType === 'need_fee'
        "
        class="sales-rule-line"
        label="手续费规则"
        :name="['salesRule', 'refundFeeRuleType']"
        :rules="[{ required: true, message: '请选择手续费规则' }]"
      >
        <div class="refund-fee-rule-header">
          <a-radio-group v-model:value="salesRule.refundFeeRuleType">
            <a-radio value="fixed">
              固定金额
              <span v-if="salesRule.refundFeeRuleType === 'fixed'" class="refund-fee-fixed-row">
                每张票实际售价收取
                <a-form-item
                  class="inline-number-item"
                  :name="['salesRule', 'refundFeeFixedAmount']"
                  :rules="[
                    { validator: validateRefundFeeFixedAmount, trigger: ['change', 'blur'] },
                  ]"
                >
                  <a-input-number
                    v-model:value="salesRule.refundFeeFixedAmount"
                    :min="0"
                    :precision="2"
                    style="width: 120px"
                  />
                </a-form-item>
                <a-select v-model:value="salesRule.refundFeeFixedUnit" style="width: 80px">
                  <a-select-option value="yuan">元</a-select-option>
                  <a-select-option value="percent">%</a-select-option>
                </a-select>
              </span>
            </a-radio>
            <a-radio value="ladder"> 阶梯金额 </a-radio>
          </a-radio-group>
        </div>

        <div v-if="salesRule.refundFeeRuleType === 'ladder'" class="refund-fee-ladder-list">
          <div
            v-for="(rule, index) in salesRule.refundFeeLadderRules || []"
            :key="rule.id || index"
            class="refund-fee-ladder-row"
          >
            开演时间
            <a-select v-model:value="rule.offsetDirection" style="width: 80px; margin: 0 4px">
              <a-select-option value="before">前</a-select-option>
              <a-select-option value="after">后</a-select-option>
            </a-select>
            <a-form-item
              class="inline-number-item"
              :name="['salesRule', 'refundFeeLadderRules', index, 'offsetDays']"
              :rules="[
                {
                  validator: createRefundFeeLadderValidator(index, 'offsetDays'),
                  trigger: ['change', 'blur'],
                },
              ]"
            >
              <a-input-number
                v-model:value="rule.offsetDays"
                :min="0"
                :max="365"
                style="width: 80px"
              />
            </a-form-item>
            天的
            <a-form-item
              class="inline-number-item"
              :name="['salesRule', 'refundFeeLadderRules', index, 'offsetTime']"
              :rules="[
                {
                  validator: createRefundFeeLadderValidator(index, 'offsetTime'),
                  trigger: 'change',
                },
              ]"
            >
              <a-time-picker
                v-model:value="rule.offsetTime"
                value-format="HH:mm"
                format="HH:mm"
                style="width: 120px"
                placeholder="选择时间"
              />
            </a-form-item>
            每张票实际售价收取
            <a-form-item
              class="inline-number-item"
              :name="['salesRule', 'refundFeeLadderRules', index, 'feeRate']"
              :rules="[
                {
                  validator: createRefundFeeLadderValidator(index, 'feeRate'),
                  trigger: ['change', 'blur'],
                },
              ]"
            >
              <a-input-number
                v-model:value="rule.feeRate"
                :min="0"
                :precision="2"
                style="width: 120px"
              />
            </a-form-item>
            <a-select v-model:value="rule.feeUnit" style="width: 80px; margin-right: 8px">
              <a-select-option value="yuan">元</a-select-option>
              <a-select-option value="percent">%</a-select-option>
            </a-select>
            <a-button
              type="link"
              v-if="(salesRule.refundFeeLadderRules || []).length > 1"
              @click="handleRemoveRefundFeeLadderRule(index)"
            >
              删除
            </a-button>
          </div>

          <a-typography-link @click="handleAddRefundFeeLadderRule"> 添加规则 </a-typography-link>
        </div>
      </a-form-item>

      <a-form-item
        v-if="salesRule.refundRuleType === 'conditional' || salesRule.refundRuleType === 'anytime'"
        class="sales-rule-line"
        label="退票审核"
        :name="['salesRule', 'refundReviewType']"
        :rules="[{ required: true, message: '请选择退票审核方式' }]"
      >
        <a-radio-group v-model:value="salesRule.refundReviewType">
          <a-radio value="auto">自动原路退款</a-radio>
          <a-radio value="manual">审核后退款</a-radio>
        </a-radio-group>
      </a-form-item>

      <a-form-item
        class="sales-rule-line"
        label="过期操作"
        :name="['salesRule', 'overdueOperationType']"
        :rules="[{ required: true, message: '请选择过期操作' }]"
      >
        <a-radio-group v-model:value="salesRule.overdueOperationType">
          <a-radio value="none">不处理</a-radio>
          <a-radio v-if="salesRule.refundRuleType === 'anytime'" value="auto_refund">
            过期自动退
          </a-radio>
        </a-radio-group>
      </a-form-item>
    </div>
  </div>
  <StoreSelectorModal
    v-model:open="storeSelectorVisible"
    :selectedIds="selectedStoreIds"
    @update:selectedIds="handleStoreIdsChange"
  />
  <StoreSelectorModal
    v-model:open="verifyStoreSelectorVisible"
    :selectedIds="selectedVerifyStoreIds"
    @update:selectedIds="handleVerifyStoreIdsChange"
  />
  <a-modal
    :open="verifyStationModalVisible"
    :title="activeVerifyStoreName ? `选择验票站点 - ${activeVerifyStoreName}` : '选择验票站点'"
    width="480px"
    @ok="handleVerifyStationModalOk"
    @cancel="handleVerifyStationModalCancel"
  >
    <div v-if="verifyStationModalLoading" class="verify-station-modal-loading">
      <a-spin />
    </div>
    <div v-else class="verify-station-modal-body">
      <div class="verify-station-modal-footer">
        <div class="verify-station-footer-right">
          <a-input-number
            v-model:value="verifyStationModalBatchLimit"
            :min="1"
            :precision="0"
            style="width: 96px"
            placeholder="无限"
          />
          <a-button
            type="link"
            class="verify-station-batch-action"
            @click="applyVerifyStationBatchLimit"
          >
            批量设置
          </a-button>
        </div>
      </div>

      <a-table
        :dataSource="verifyStationModalItems"
        :columns="verifyStationTableColumns"
        :pagination="false"
        size="small"
        :rowSelection="verifyStationRowSelection"
        :rowKey="(record: VerifyStoreStationItem) => record.stationId"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'name'">
            {{ record.stationName }}
          </template>
          <template v-else-if="column.key === 'limit'">
            <a-input-number
              v-model:value="record.verifyLimit"
              :min="1"
              :precision="0"
              style="width: 100%"
              placeholder="无限"
            />
          </template>
        </template>
      </a-table>
    </div>
  </a-modal>
</template>

<style scoped lang="less">
.sales-rule-section {
  margin-bottom: 32px;
}

.sales-rule-section-title {
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #ededed;
}

.sales-rule-line {
  margin-bottom: 24px;
}

.print-price-row {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.print-price-group {
  display: inline-flex;
  align-items: center;
}

.print-price-group :deep(.ant-radio-wrapper) {
  display: inline-flex;
  align-items: center;
  margin-right: 16px;
}

.print-price-input {
  width: 160px;
}

.inline-number-item {
  display: inline-block;
  margin: 0 4px;
}

.inline-number-item :deep(.ant-form-item-label) {
  display: none;
}

.inline-number-item :deep(.ant-form-item-control-input) {
  min-height: auto;
}

.inline-number-item :deep(.ant-form-item-explain) {
  font-size: 12px;
  line-height: 1.2;
}
.refund-fee-rule-header {
  display: flex;
  flex-direction: column;
}

.refund-fee-rule-header :deep(.ant-radio-wrapper) {
  display: block;
  margin-bottom: 4px;
}

.refund-fee-fixed-row {
  margin-left: 8px;
  display: inline-flex;
  align-items: center;
}

.refund-fee-fixed-row :deep(.ant-input-number),
.refund-fee-fixed-row :deep(.ant-input-number-input),
.refund-fee-fixed-row :deep(.ant-select-selector),
.refund-fee-fixed-row :deep(.ant-select-selection-item) {
  height: 32px !important;
  line-height: 32px !important;
}

.refund-fee-ladder-list {
  margin-top: 8px;
}

.refund-fee-ladder-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  margin-bottom: 16px;
}

.sales-rule-control-column {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}

.sales-rule-inline-option {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.risk-notice-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.store-selector-link {
  display: inline-flex;
  align-items: center;
}

.risk-notice-text-wrapper {
  margin-top: 8px;
  margin-bottom: 0;
}

.risk-notice-inline-item {
  margin-bottom: 0;
}

.risk-notice-inline-item :deep(.ant-form-item-label) {
  display: none;
}

.risk-notice-inline-item :deep(.ant-form-item-control-input) {
  min-height: auto;
}

.risk-notice-inline-item :deep(.ant-form-item-explain) {
  font-size: 12px;
}
.risk-notice-upload :deep(.ant-upload-wrapper) {
  display: flex;
  align-items: center;
}

.risk-notice-upload :deep(.ant-upload-list) {
  padding-left: 8px;
  border: 1px solid rgba(222, 222, 222, 1);
  border-left: none;
}

.risk-notice-upload :deep(.ant-upload-list-item) {
  margin-top: 0;
}

.verify-time-custom-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
}

.print-price-custom-row {
  display: flex;
  align-items: center;
  margin-top: 8px;
}

.verify-time-radio-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.verify-time-radio-group :deep(.ant-radio-wrapper) {
  display: flex;
  align-items: center;
}

.sales-rule-inline-prefix {
  display: inline-block;
  margin-right: 4px;
  color: #555;
}

.sales-rule-line :deep(.ant-input-number) {
  vertical-align: middle;
}

.sales-rule-section-title {
  color: #555;
  font-family: 'PingFang SC';
  font-size: 14px;
  font-style: normal;
  font-weight: 600;
  line-height: 20px;
}

.verify-store-selector {
  margin-bottom: 4px;
}

.verify-store-field {
  display: inline-block;
  margin-top: 5px;
}

.verify-store-table-wrapper {
  border: 1px solid #e5e5e5;
  border-radius: 2px;
  overflow: hidden;
  width: 800px;
}

.verify-store-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  font-size: 12px;
}

.verify-store-table th,
.verify-store-table td {
  border-bottom: 1px solid #f0f0f0;
  padding: 8px 12px;
  vertical-align: top;
}

.verify-store-table th {
  background-color: #f7f9fc;
  font-weight: 500;
  color: #555;
}

.verify-store-col-name {
  width: 150px;
}

.verify-store-col-actions {
  width: 80px;
  text-align: center;
}

.verify-store-name {
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
}

.verify-store-actions {
  text-align: center;
}

.verify-station-cell {
  display: flex;
  align-items: center;
  gap: 4px;
}

.verify-station-fake-select {
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  max-width: 160px;
  padding: 4px 8px;
  border: 1px solid #d9d9d9;
  border-radius: 2px;
  cursor: pointer;
  background-color: #fff;
}

.verify-station-fake-select-arrow {
  margin-left: 8px;
  font-size: 10px;
  color: #999;
}

.verify-station-names {
  font-size: 12px;
  color: #666;
  max-height: 40px;
  overflow: hidden;
}

.verify-station-modal-loading {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 120px;
}

.verify-station-modal-body {
  max-height: 400px;
  overflow-y: auto;
}

.verify-station-modal-footer {
  position: absolute;
  bottom: 10px;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  margin-bottom: 8px;
}

.verify-station-footer-right {
  display: flex;
  align-items: center;
  gap: 4px;
}

.verify-station-batch-label {
  font-size: 12px;
  color: #595959;
}

.verify-station-batch-action {
  padding: 0;
}

/* 在“预订规则”步骤中给销售门店 / 核销门店加上必填星号标记 */
.sales-rule-section:first-of-type
  .sales-rule-line:first-of-type
  :deep(.ant-form-item-label > label)::before {
  content: '*';
  margin-inline-end: 4px;
  color: #ff4d4f;
  font-size: 14px;
  font-family: SimSun, sans-serif;
  line-height: 1;
  content: '*';
  margin-right: 4px;
}

.sales-rule-section:nth-of-type(2)
  .sales-rule-line:first-of-type
  :deep(.ant-form-item-label > label)::before {
  content: '*';
  margin-inline-end: 4px;
  color: #ff4d4f;
  font-size: 14px;
  font-family: SimSun, sans-serif;
  line-height: 1;
  content: '*';
  margin-right: 4px;
}
.align-center {
  display: flex;
  align-items: center;
}
.sales-rule-line-mt1 {
  :deep(.ant-form-item-control) {
    margin-top: 4px;
  }
}
</style>
<style>
.ant-form-item-explain-error {
  position: absolute;
  width: 300%;
}
</style>
