<script lang="ts" setup>
import { ref, reactive } from 'vue'
import type { CascaderProps } from 'ant-design-vue/es/cascader'
import type { UploadFile } from 'ant-design-vue'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'

dayjs.locale('zh-cn')

const cascaderValue = ref<string[]>([])

const dateValue = ref<dayjs.Dayjs | null>(dayjs())
const range = ref<string[]>([])
const labelCol = { style: { width: '150px' } }
const wrapperCol = { span: 14 }
const radioValue = ref('apple')
const selectValue = ref<string | undefined>()

const files = ref<UploadFile[]>([])

const options = reactive<NonNullable<CascaderProps['options']>>([
  {
    value: 'zhejiang',
    label: 'Zhejiang',
    children: [
      {
        value: 'hangzhou',
        label: 'Hangzhou',
      },
    ],
  },
])

const checked = ref(false)
</script>

<template>
  <a-form
    :label-col="labelCol"
    :wrapper-col="wrapperCol"
    layout="horizontal"
    style="max-width: 600px"
  >
    <a-form-item label="复选框">
      <a-checkbox>checkbox</a-checkbox>
    </a-form-item>

    <a-form-item label="单选框">
      <a-radio-group v-model:value="radioValue">
        <a-radio value="apple">Apple</a-radio>
        <a-radio value="pear">Pear</a-radio>
      </a-radio-group>
    </a-form-item>

    <a-form-item label="输入框">
      <a-input placeholder="123" />
    </a-form-item>

    <a-form-item label="带后缀的输入框">
      <a-input>
        <template #addonAfter> 元 </template>
      </a-input>
    </a-form-item>

    <a-form-item label="下拉选择">
      <a-select v-model:value="selectValue" style="width: 216px" :virtual="false">
        <a-select-option value="demo">所有会场</a-select-option>
        <a-select-option value="Demo1">Demo1</a-select-option>
        <a-select-option value="Demo11">Demo11</a-select-option>
        <a-select-option value="Demo12">Demo12</a-select-option>
        <a-select-option value="Demo13">Demo13</a-select-option>
        <a-select-option value="Demo14">Demo14</a-select-option>
        <a-select-option value="Demo15">Demo15</a-select-option>
        <a-select-option value="Demo16">Demo16</a-select-option>
      </a-select>
    </a-form-item>

    <a-form-item label="级联选择">
      <a-cascader v-model:value="cascaderValue" :options="options" />
    </a-form-item>

    <a-form-item label="时间选择">
      <YDatePicker v-model:value="dateValue" style="width: 216px" />
    </a-form-item>

    <a-form-item label="时间范围选择">
      <YDatePickerRange
        v-model:value="range"
        :disabled="false"
        format="YYYY-MM-DD"
        style="width: 300px"
      />
    </a-form-item>

    <a-form-item label="文本框">
      <a-textarea :auto-size="{ minRows: 3, maxRows: 3 }" />
    </a-form-item>

    <a-form-item label="开关">
      <YSwitch v-model:checked="checked" />
    </a-form-item>

    <a-form-item label="上传">
      <YUpload v-model:fileList="files" action="/upload.do" :max-count="5" />
    </a-form-item>

    <a-form-item label="可拖拽改变顺序">
      <YUploadDraggable v-model:fileList="files" action="/upload.do" :max-count="5" />
    </a-form-item>

    <a-form-item label="按钮">
      <a-button>Button</a-button>
      <a-button type="primary">Button</a-button>
    </a-form-item>
  </a-form>
</template>
