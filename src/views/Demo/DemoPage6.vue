<template>
  <div class="coupon-basic-setting">
    <div class="coupon-basic-setting__title">基础设置</div>

    <a-form :label-col="labelCol" :wrapper-col="wrapperCol" layout="horizontal" autocomplete="off">
      <!-- 券名称 -->
      <a-form-item label="券名称：" required>
        <a-input v-model:value="form.name" placeholder="请输入券名称" style="width: 320px" />
      </a-form-item>

      <!-- 适用门店 -->
      <a-form-item label="适用门店：" required>
        <a-space>
          <a-typography-link>选择门店</a-typography-link>
          <span class="field-tip">（仅示例，不真正选择）</span>
        </a-space>
      </a-form-item>

      <!-- 券类型 -->
      <a-form-item label="券类型：" required>
        <a-select v-model:value="form.type" placeholder="请选择券类型" style="width: 200px">
          <a-select-option value="cash">抵现券</a-select-option>
          <a-select-option value="discount">折扣券</a-select-option>
        </a-select>
      </a-form-item>

      <!-- 抵现金额 -->
      <a-form-item label="抵现金额：" required>
        <a-space align="center">
          <a-select v-model:value="form.limitType" style="width: 96px">
            <a-select-option value="none">无门槛</a-select-option>
            <a-select-option value="full">满额可用</a-select-option>
          </a-select>
          <span>可抵扣</span>
          <a-input-number
            v-model:value="form.amount"
            :min="0"
            :precision="2"
            style="width: 120px"
          />
          <span>元</span>
        </a-space>
      </a-form-item>

      <!-- 获取方式 -->
      <a-form-item label="获取方式：" required>
        <a-radio-group v-model:value="form.obtainType">
          <a-radio value="free">免费领取</a-radio>
          <a-radio value="activity">活动赠送或第三方渠道</a-radio>
          <a-radio value="sale">定价售卖</a-radio>
        </a-radio-group>
      </a-form-item>

      <!-- 领取日期 -->
      <a-form-item label="领取日期：" required>
        <a-space align="center">
          <YDatePickerRange
            v-model:value="form.receiveRange"
            style="width: 360px"
            format="YYYY-MM-DD"
          />
          <a-typography-link>
            更多时间设置
            <DownOutlined style="font-size: 12px; margin-left: 4px" />
          </a-typography-link>
        </a-space>
      </a-form-item>

      <!-- 使用日期 -->
      <a-form-item label="使用日期：" required>
        <a-space direction="vertical" style="width: 100%">
          <a-radio-group v-model:value="form.useDateMode">
            <a-radio value="fixed">固定日期</a-radio>
            <a-radio value="relative">相对有效期</a-radio>
          </a-radio-group>

          <a-space v-if="form.useDateMode === 'fixed'" align="center">
            <YDatePickerRange
              v-model:value="form.useRange"
              style="width: 360px"
              format="YYYY-MM-DD"
            />
            <a-typography-link>
              更多时间设置
              <DownOutlined style="font-size: 12px; margin-left: 4px" />
            </a-typography-link>
          </a-space>

          <div v-else class="relative-days">
            自领取之日起
            <a-input-number
              v-model:value="form.validDays"
              :min="1"
              :precision="0"
              style="width: 80px"
            />
            天内有效
          </div>
        </a-space>
      </a-form-item>

      <!-- 参与的商品 -->
      <a-form-item label="参与的商品：" required>
        <a-radio-group v-model:value="form.skuScope" class="sku-scope-group">
          <a-radio value="all">全店所有商品</a-radio>
          <a-radio value="tag">标签所属商品</a-radio>
          <a-radio value="category">分类所属商品</a-radio>
          <a-radio value="指定商品">
            指定商品
            <QuestionCircleOutlined style="margin-left: 4px; color: #999" />
          </a-radio>
          <a-radio value="brand">
            指定品牌
            <QuestionCircleOutlined style="margin-left: 4px; color: #999" />
          </a-radio>
        </a-radio-group>
      </a-form-item>

      <!-- 底部“不参与的商品 展开” -->
      <a-form-item :colon="false" label=" ">
        不参与的商品<a-typography-link type="secondary"> 展开</a-typography-link>
      </a-form-item>
    </a-form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { DownOutlined, QuestionCircleOutlined } from '@ant-design/icons-vue'
import dayjs, { type Dayjs } from 'dayjs'

const labelCol = { style: { width: '100px' } }
const wrapperCol = { span: 14 }

interface FormModel {
  name: string
  type: string | undefined
  limitType: 'none' | 'full'
  amount: number | null
  obtainType: 'free' | 'activity' | 'sale'
  receiveRange: [Dayjs | null, Dayjs | null] | null
  useDateMode: 'fixed' | 'relative'
  useRange: [Dayjs | null, Dayjs | null] | null
  validDays: number
  skuScope: string
}

const form = ref<FormModel>({
  name: '',
  type: 'cash',
  limitType: 'none',
  amount: null,
  obtainType: 'free',
  receiveRange: [dayjs(), dayjs().add(7, 'day')],
  useDateMode: 'fixed',
  useRange: [dayjs(), dayjs().add(30, 'day')],
  validDays: 7,
  skuScope: 'all',
})
</script>

<style scoped lang="less">
.coupon-basic-setting {
  padding: 16px 24px;
  background: #fff;
}

.coupon-basic-setting__title {
  font-size: 14px;
  font-weight: 500;
  padding-bottom: 8px;
  margin-bottom: 16px;
  border-bottom: 1px solid #e5e5e5;
}

.field-tip {
  color: #999;
}

.relative-days {
  color: #333;
}

.sku-scope-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
</style>
