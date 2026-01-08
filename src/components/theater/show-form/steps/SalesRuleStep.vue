<script setup lang="ts">
import { computed, ref } from 'vue'
import type { ShowFormSalesRule } from '../types'
import StoreSelectorModal from '@/components/store/StoreSelectorModal.vue'

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
</script>

<template>
  <div class="sales-rule-step">
    <!-- 下单规则 -->
    <div class="sales-rule-section">
      <a-typography-title :level="5" class="sales-rule-section-title">
        下单规则
      </a-typography-title>

      <a-form-item class="sales-rule-line" label="销售门店">
        <a-typography-link @click="storeSelectorVisible = true">
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
            <a-select
              v-model:value="salesRule.riskNoticeMode"
              style="width: 120px; margin-left: 8px"
              placeholder="请选择"
            >
              <a-select-option value="text">输入文本</a-select-option>
              <a-select-option value="file">上传文档</a-select-option>
            </a-select>

            <template v-if="salesRule.riskNoticeMode === 'file'">
              <span class="risk-notice-upload">
                <a-upload
                  v-model:file-list="riskNoticeFileList"
                  :before-upload="handleRiskNoticeBeforeUpload"
                  :max-count="1"
                >
                  <a-button type="default" style="height: 32px; margin-left: 8px">上传</a-button>
                </a-upload>
              </span>
            </template>
          </template>
        </div>

        <div
          v-if="
            salesRule.needRiskNotice &&
            (salesRule.riskNoticeMode === 'text' || !salesRule.riskNoticeMode)
          "
          class="risk-notice-text-wrapper"
        >
          <a-textarea
            v-model:value="salesRule.riskNoticeText"
            placeholder="请输入风险提示"
            :maxlength="500"
            show-count
            :auto-size="{ minRows: 4, maxRows: 4 }"
          />
        </div>
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

      <a-form-item v-if="salesRule.enableGroupTicket" class="sales-rule-line" label="最小起订量">
        <div class="sales-rule-control-column">
          <a-radio-group v-model:value="salesRule.groupMinOrderLimitType">
            <a-radio value="unlimited">不限年龄</a-radio>
            <a-radio value="at_least">
              <span class="sales-rule-inline-prefix">至少</span>
              <a-input-number
                v-model:value="salesRule.groupMinOrderQuantity"
                :min="1"
                :max="9999"
                style="width: 80px; margin: 0 4px"
              />
              张
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
            <span class="sales-rule-inline-prefix">下单后</span>
            <a-input-number
              v-model:value="salesRule.paymentLimitMinutesAfterOrder"
              :min="1"
              :max="600"
              style="width: 80px; margin: 0 4px"
            />
            分钟未付款自动取消订单
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
            <span class="sales-rule-inline-prefix">每个手机号/身份证最多购买</span>
            <a-input-number
              v-model:value="salesRule.purchaseLimitPerIdentity"
              :min="1"
              :max="99"
              style="width: 80px; margin: 0 4px"
            />
            张
          </a-radio>
          <a-radio value="unlimited">不限制</a-radio>
        </a-radio-group>
      </a-form-item>

      <a-form-item
        class="sales-rule-line"
        label="停售规则"
        :name="['salesRule', 'saleEndRuleType']"
        :rules="[{ required: true, message: '请选择停售规则' }]"
      >
        <div class="sales-rule-control-column">
          <a-radio-group v-model:value="salesRule.saleEndRuleType">
            <div class="sales-rule-inline-option">
              <a-radio value="before">
                可售至：开演前
                <a-input-number
                  v-model:value="salesRule.saleEndBeforeMinutes"
                  :min="0"
                  :max="1440"
                  style="width: 80px; margin: 0 4px"
                />
                分钟（含）
              </a-radio>
            </div>
            <div class="sales-rule-inline-option">
              <a-radio value="after">
                可售至：开演后
                <a-input-number
                  v-model:value="salesRule.saleEndAfterMinutes"
                  :min="0"
                  :max="1440"
                  style="width: 80px; margin: 0 4px"
                />
                分钟（含）
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
        <a-select v-model:value="salesRule.printTemplate" style="width: 200px" placeholder="请选择">
          <a-select-option value="default">默认</a-select-option>
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
          <a-input
            v-if="salesRule.printCopyType === 'custom'"
            v-model:value="salesRule.printCustomPrice"
            addon-before="¥"
            class="print-price-input"
            placeholder="请输入"
          />
        </div>
      </a-form-item>

      <a-form-item class="sales-rule-line" label="验票方式">
        <a-checkbox-group v-model:value="salesRule.verifyMethods">
          <a-checkbox value="order_qr">订单二维码</a-checkbox>
          <a-checkbox value="ticket_qr">票二维码</a-checkbox>
          <a-checkbox value="paper">票根</a-checkbox>
        </a-checkbox-group>
      </a-form-item>

      <a-form-item
        class="sales-rule-line"
        label="验票时限"
        :name="['salesRule', 'verifyTimeType']"
        :rules="[{ required: true, message: '请选择验票时限' }]"
      >
        <div class="sales-rule-control-column">
          <a-radio-group v-model:value="salesRule.verifyTimeType" class="verify-time-radio-group">
            <a-radio value="same_day">不限</a-radio>
            <a-radio value="custom">
              自定义：预订时间提前不超过
              <a-input-number
                v-model:value="salesRule.verifyTimeBeforeHours"
                :min="0"
                :max="168"
                style="width: 80px; margin: 0 4px"
              />
              小时
              <a-input-number
                v-model:value="salesRule.verifyTimeBeforeMinutes"
                :min="0"
                :max="59"
                style="width: 80px; margin: 0 4px"
              />
              分钟；预订时间推后不超过
              <a-input-number
                v-model:value="salesRule.verifyTimeAfterHours"
                :min="0"
                :max="168"
                style="width: 80px; margin: 0 4px"
              />
              小时
              <a-input-number
                v-model:value="salesRule.verifyTimeAfterMinutes"
                :min="0"
                :max="59"
                style="width: 80px; margin: 0 4px"
              />
              分钟
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
        v-if="salesRule.refundRuleType === 'conditional'"
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
        v-if="salesRule.refundRuleType === 'conditional' && salesRule.refundFeeType === 'need_fee'"
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
                <a-input-number
                  v-model:value="salesRule.refundFeeFixedAmount"
                  :min="0"
                  :precision="2"
                  style="width: 120px; margin: 0 8px"
                />
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
            截止检票时间
            <a-select v-model:value="rule.offsetDirection" style="width: 80px; margin: 0 4px">
              <a-select-option value="before">前</a-select-option>
              <a-select-option value="after">后</a-select-option>
            </a-select>
            <a-input-number
              v-model:value="rule.offsetDays"
              :min="0"
              :max="365"
              style="width: 80px; margin: 0 4px"
            />
            天的
            <a-time-picker
              v-model:value="rule.offsetTime"
              value-format="HH:mm"
              format="HH:mm"
              style="width: 120px; margin: 0 8px"
              placeholder="选择时间"
            />
            每张票实际售价收取
            <a-input-number
              v-model:value="rule.feeRate"
              :min="0"
              :precision="2"
              style="width: 120px; margin: 0 8px"
            />
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
        v-if="salesRule.refundRuleType === 'conditional'"
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
      </div>
    </div>
  <StoreSelectorModal
    v-model:open="storeSelectorVisible"
    :selectedIds="selectedStoreIds"
    @update:selectedIds="handleStoreIdsChange"
  />
</template>

<style scoped>
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
  margin-left: 4px;
  width: 160px;
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
  margin-bottom: 8px;
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
}

.risk-notice-text-wrapper {
  margin-top: 8px;
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
</style>
