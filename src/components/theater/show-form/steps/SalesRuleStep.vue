<script setup lang="ts">
import { computed } from 'vue'
import type { ShowFormSalesRule } from '../types'

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
</script>

<template>
  <div>
    <a-alert
      message="设置演出售卖时间、停售时间、退票规则等，这些规则会影响用户购票与退票。"
      type="info"
      show-icon
      style="margin-bottom: 16px"
    />

    <div style="margin-bottom: 24px">
      <a-typography-title :level="5" style="margin-bottom: 16px">
        开售 / 停售时间
      </a-typography-title>

      <a-form-item label="开售时间" required>
        <a-form-item
          :name="['salesRule', 'saleStartType']"
          :rules="[{ required: true }]"
          no-style
        >
          <a-radio-group v-model:value="salesRule.saleStartType">
            <a-radio value="immediate">立即开售</a-radio>
            <a-radio value="scheduled">定时开售</a-radio>
          </a-radio-group>
        </a-form-item>

        <a-form-item
          v-if="salesRule.saleStartType === 'scheduled'"
          :name="['salesRule', 'saleStartTime']"
          :rules="[{ required: true, message: '请选择开售时间' }]"
          no-style
        >
          <a-date-picker
            v-model:value="salesRule.saleStartTime"
            show-time
            value-format="YYYY-MM-DD HH:mm:ss"
            format="YYYY-MM-DD HH:mm"
            style="width: 260px; margin-top: 8px"
            placeholder="选择开售时间"
          />
        </a-form-item>
      </a-form-item>

      <a-form-item label="停售时间" required>
        <a-form-item
          :name="['salesRule', 'saleEndType']"
          :rules="[{ required: true }]"
          no-style
        >
          <a-radio-group v-model:value="salesRule.saleEndType">
            <a-radio value="before_show">开演前 X 分钟</a-radio>
            <a-radio value="scheduled">指定时间</a-radio>
          </a-radio-group>
        </a-form-item>

        <a-form-item
          v-if="salesRule.saleEndType === 'before_show'"
          :name="['salesRule', 'saleEndMinutesBeforeShow']"
          :rules="[{ required: true, message: '请输入停售时间' }]"
          no-style
        >
          <a-input-number
            v-model:value="salesRule.saleEndMinutesBeforeShow"
            :min="0"
            :max="1440"
            addon-after="分钟"
            style="width: 200px; margin-top: 8px"
            placeholder="开演前分钟数"
          />
        </a-form-item>

        <a-form-item
          v-if="salesRule.saleEndType === 'scheduled'"
          :name="['salesRule', 'saleEndTime']"
          :rules="[{ required: true, message: '请选择停售时间' }]"
          no-style
        >
          <a-date-picker
            v-model:value="salesRule.saleEndTime"
            show-time
            value-format="YYYY-MM-DD HH:mm:ss"
            format="YYYY-MM-DD HH:mm"
            style="width: 260px; margin-top: 8px"
            placeholder="选择停售时间"
          />
        </a-form-item>
      </a-form-item>
    </div>

    <div style="margin-bottom: 24px">
      <a-typography-title :level="5" style="margin-bottom: 16px">
        退票规则
      </a-typography-title>

      <a-form-item
        label="是否允许退票"
        :name="['salesRule', 'allowRefund']"
        value-prop-name="checked"
      >
        <a-switch
          v-model:checked="salesRule.allowRefund"
          checked-children="允许"
          un-checked-children="禁止"
        />
      </a-form-item>

      <template v-if="salesRule.allowRefund">
        <a-form-item label="退票截止时间" required>
          <a-form-item
            :name="['salesRule', 'refundDeadlineType']"
            :rules="[{ required: true }]"
            no-style
          >
            <a-radio-group v-model:value="salesRule.refundDeadlineType">
              <a-radio value="before_show">开演前 X 小时</a-radio>
              <a-radio value="scheduled">指定时间</a-radio>
            </a-radio-group>
          </a-form-item>

          <a-form-item
            v-if="salesRule.refundDeadlineType === 'before_show'"
            :name="['salesRule', 'refundDeadlineHoursBeforeShow']"
            :rules="[{ required: true, message: '请输入退票截止时间' }]"
            no-style
          >
            <a-input-number
              v-model:value="salesRule.refundDeadlineHoursBeforeShow"
              :min="0"
              :max="720"
              addon-after="小时"
              style="width: 200px; margin-top: 8px"
              placeholder="开演前小时数"
            />
          </a-form-item>

          <a-form-item
            v-if="salesRule.refundDeadlineType === 'scheduled'"
            :name="['salesRule', 'refundDeadlineTime']"
            :rules="[{ required: true, message: '请选择退票截止时间' }]"
            no-style
          >
            <a-date-picker
              v-model:value="salesRule.refundDeadlineTime"
              show-time
              value-format="YYYY-MM-DD HH:mm:ss"
              format="YYYY-MM-DD HH:mm"
              style="width: 260px; margin-top: 8px"
              placeholder="选择退票截止时间"
            />
          </a-form-item>
        </a-form-item>
      </template>
    </div>

    <div>
      <a-typography-title :level="5" style="margin-bottom: 16px">
        购买限制
      </a-typography-title>

      <a-form-item
        label="单笔订单最多购买数量"
        :name="['salesRule', 'maxPurchasePerOrder']"
        :rules="[
          { required: true, message: '请输入最多购买数量' },
          { type: 'number', min: 1, message: '至少允许购买 1 张' },
        ]"
      >
        <a-input-number
          v-model:value="salesRule.maxPurchasePerOrder"
          :min="1"
          :max="100"
          addon-after="张"
          style="width: 200px"
          placeholder="最多购买数量"
        />
      </a-form-item>
    </div>
  </div>
</template>
