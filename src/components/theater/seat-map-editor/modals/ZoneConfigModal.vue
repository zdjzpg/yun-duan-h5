<script setup lang="ts">
import { ref, watch } from 'vue'
import { ZONE_PRESET_COLORS } from '../utils/constants'
import type { Zone } from '../types.simplified'

const props = defineProps<{
  visible: boolean
  zone?: Zone
  venueId: string
  floorId: string
  existingZones: Zone[]
}>()

const emit = defineEmits<{
  (e: 'ok', values: { name: string; shortName?: string; color: string; order: number }): void
  (e: 'cancel'): void
}>()

const formRef = ref()
const selectedColor = ref<string>(ZONE_PRESET_COLORS[0])

const formState = ref({
  name: '',
  shortName: '',
  color: ZONE_PRESET_COLORS[0],
  order: 1,
})

watch(
  () => props.visible,
  (visible) => {
    if (!visible) return

    let values
    if (props.zone) {
      values = {
        name: props.zone.name || '',
        shortName: props.zone.shortName || '',
        color: props.zone.color || ZONE_PRESET_COLORS[0],
        order: props.zone.order || 1,
      }
    } else {
      const nextOrder =
        props.existingZones.length > 0
          ? Math.max(...props.existingZones.map((z: Zone) => z.order)) + 1
          : 1
      values = {
        name: '',
        shortName: '',
        color: ZONE_PRESET_COLORS[0],
        order: nextOrder,
      }
    }

    formState.value = values
    selectedColor.value = values.color

    const form = formRef.value as any
    form?.clearValidate?.()
  },
)

const handleOk = async () => {
  const form = formRef.value as any
  if (!form) return

  try {
    await form.validate()
    const values = formState.value

    const isDuplicate = props.existingZones.some(
      (z: Zone) => z.name === values.name && z.id !== props.zone?.id,
    )
    if (isDuplicate) {
      form.setFields?.([
        {
          name: 'name',
          errors: ['该楼层已存在同名座区'],
        },
      ])
      return
    }

    emit('ok', {
      name: values.name,
      shortName: values.shortName || undefined,
      color: selectedColor.value,
      order: values.order,
    })
  } catch (error) {
    console.error('表单校验失败:', error)
  }
}

const handleCancel = () => {
  emit('cancel')
}
</script>

<template>
  <a-modal
    :title="zone ? '编辑座区配置' : '新建座区配置'"
    :open="visible"
    width="500"
    centered
    @ok="handleOk"
    @cancel="handleCancel"
  >
    <a-form
      ref="formRef"
      layout="vertical"
      :model="formState"
      style="margin-top: 16px"
    >
      <a-form-item
        label="座区名称"
        name="name"
        :rules="[
          { required: true, message: '请输入座区名称' },
          { max: 20, message: '座区名称不能超过 20 个字' },
        ]"
        tooltip="例如：VIP区、A区、B区、池座、楼座"
      >
        <a-input
          v-model:value="formState.name"
          placeholder="请输入座区名称"
          :maxlength="20"
          show-count
        />
      </a-form-item>

      <a-form-item
        label="简称（可选）"
        name="shortName"
        :rules="[{ max: 5, message: '简称不能超过 5 个字' }]"
        tooltip="用于在座位标签上显示，例如：V、A、B"
      >
        <a-input
          v-model:value="formState.shortName"
          placeholder="如：V、A、B"
          :maxlength="5"
        />
      </a-form-item>

      <a-form-item
        label="座区颜色"
        name="color"
        tooltip="座位将在座区视图中显示为此颜色"
      >
        <a-space
          direction="vertical"
          style="width: 100%"
        >
          <a-space wrap>
            <div
              v-for="color in ZONE_PRESET_COLORS"
              :key="color"
              :style="{
                width: '32px',
                height: '32px',
                backgroundColor: color,
                border: selectedColor === color ? '3px solid #1890ff' : '1px solid #d9d9d9',
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }"
              :title="color"
              @click="
                () => {
                  selectedColor = color
                  formState.color = color
                }
              "
            />
          </a-space>
        </a-space>
      </a-form-item>

      <a-form-item
        label="显示顺序"
        name="order"
        :rules="[
          { required: true, message: '请输入显示顺序' },
          { type: 'number', min: 1, message: '显示顺序必须大于 0' },
        ]"
        tooltip="数字越小越靠前，用于列表排序"
      >
        <a-input-number
          v-model:value="formState.order"
          placeholder="1"
          style="width: 100%"
          :min="1"
          :precision="0"
        />
      </a-form-item>
    </a-form>

    <div
      style="
        margin-top: 16px;
        padding: 12px;
        background: #f0f5ff;
        border: 1px solid #adc6ff;
        border-radius: 4px;
      "
    >
      <a-typography-text type="secondary" style="font-size: 12px">
        提示：座区是配置数据，不包含几何位置。座区的边界由包含的座位动态决定。创建座区后，可以在右侧面板中批量分配座位到该座区。
      </a-typography-text>
    </div>
  </a-modal>
</template>
