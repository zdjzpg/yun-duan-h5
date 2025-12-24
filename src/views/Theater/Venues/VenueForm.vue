<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import {
  type VenueCapacityType,
  type VenueType,
} from '@/api/theaterVenue'

export interface VenueFormValues {
  name: string
  type?: VenueType
  scenicId?: string
  address?: string
  description?: string
  capacityType: VenueCapacityType
  totalCapacity?: number
  zones?: Array<{
    id?: string
    name: string
    capacity: number
    sort?: number
  }>
}

const props = defineProps<{
  initialValues?: Partial<VenueFormValues>
  isEdit?: boolean
}>()

const emit = defineEmits<{
  (e: 'submit', values: VenueFormValues): void
}>()

const formRef = ref()

const formState = ref<VenueFormValues>({
  name: '',
  type: undefined,
  scenicId: undefined,
  address: '',
  description: '',
  capacityType: 'free_seating',
  totalCapacity: undefined,
  zones: [],
})

const zones = ref<VenueFormValues['zones']>([])
const capacityType = ref<VenueCapacityType>('free_seating')

watch(
  () => props.initialValues,
  (val) => {
    if (!val) return
    formState.value = {
      ...formState.value,
      ...val,
      capacityType: (val.capacityType || 'free_seating') as VenueCapacityType,
    }
    zones.value = (val.zones || []).map((z: any, index: number) => ({
      ...z,
      sort: z.sort ?? index + 1,
    }))
    capacityType.value = formState.value.capacityType
  },
  { immediate: true },
)

onMounted(() => {
  if (props.initialValues) {
    zones.value = (props.initialValues.zones || []).map((z: any, index: number) => ({
      ...z,
      sort: z.sort ?? index + 1,
    }))
    capacityType.value = formState.value.capacityType
  }
})

watch(
  capacityType,
  (val) => {
    formState.value.capacityType = val
  },
)

const handleAddZone = () => {
  const current = zones.value || []
  const next = [
    ...current,
    {
      name: '',
      capacity: 0,
      sort: current.length + 1,
    },
  ]
  zones.value = next
  formState.value.zones = next
}

const handleDeleteZone = (index: number) => {
  const current = zones.value || []
  const next = current.filter((_: unknown, i: number) => i !== index)
  zones.value = next
  formState.value.zones = next
}

const handleZoneFieldChange = (
  index: number,
  field: 'name' | 'capacity',
  value: string | number,
) => {
  const current = zones.value || []
  const next = [...current]
  next[index] = {
    ...next[index],
    [field]: value,
  }
  zones.value = next
  formState.value.zones = next
}

const handleSubmit = async () => {
  if (!formRef.value) {
    return
  }
  await formRef.value.validate()

  if (formState.value.capacityType === 'zone_capacity') {
    const current = zones.value || []
    if (!current.length) {
      throw new Error('请至少添加一个座区')
    }
    const hasEmptyName = current.some((zone: any) => !zone.name || !zone.name.trim())
    if (hasEmptyName) {
      throw new Error('请填写所有座区的名称')
    }
    const hasInvalidCapacity = current.some(
      (zone: any) => !zone.capacity || zone.capacity <= 0,
    )
    if (hasInvalidCapacity) {
      throw new Error('请填写所有座区的容量，且必须大于 0')
    }
  }

  emit('submit', {
    ...formState.value,
    zones: zones.value,
  })
}

defineExpose<{
  submit: () => Promise<void>
}>({
  submit: handleSubmit,
})
</script>

<template>
  <a-form
    ref="formRef"
    :model="formState"
    layout="vertical"
  >
    <div style="margin-bottom: 24px">
      <a-typography-title :level="5" style="margin-bottom: 16px">基础信息</a-typography-title>

      <div class="venue-form__two-columns">
        <a-form-item
          label="场馆名称"
          name="name"
          :rules="[{ required: true, message: '请输入' }]"
        >
          <a-input v-model:value="formState.name" placeholder="请输入" :maxlength="50" />
        </a-form-item>

        <a-form-item label="场馆类型" name="type">
          <a-select
            v-model:value="formState.type"
            placeholder="请选择"
            allow-clear
          >
            <a-select-option value="indoor_theater">室内剧场</a-select-option>
            <a-select-option value="outdoor_scene">室外实景</a-select-option>
            <a-select-option value="multifunctional">多功能厅</a-select-option>
            <a-select-option value="other">其他</a-select-option>
          </a-select>
        </a-form-item>
      </div>

      <a-form-item label="场馆地址" name="address">
        <a-input v-model:value="formState.address" placeholder="请输入" :maxlength="200" />
      </a-form-item>

      <a-form-item label="场馆简介" name="description">
        <a-textarea
          v-model:value="formState.description"
          placeholder="简要描述场馆的特点、设施、适用场景等"
          :rows="4"
          :maxlength="500"
          show-count
        />
      </a-form-item>
    </div>

    <div style="margin-bottom: 24px">
      <a-typography-title :level="5" style="margin-bottom: 16px">容量配置</a-typography-title>

      <a-form-item
        label="容量类型"
        name="capacityType"
        :rules="[{ required: true, message: '请选择容量类型' }]"
      >
        <a-radio-group v-model:value="capacityType" :disabled="props.isEdit">
          <a-radio value="free_seating">自由站席</a-radio>
          <a-radio value="zone_capacity">按座区数量</a-radio>
        </a-radio-group>
      </a-form-item>

      <a-form-item
        v-if="capacityType === 'free_seating'"
        label="总容量"
        name="totalCapacity"
        :rules="[
          { required: true, message: '请输入总容量' },
          { type: 'number', min: 1, message: '总容量必须大于 0' },
        ]"
      >
        <a-input-number
          v-model:value="formState.totalCapacity"
          placeholder="请输入"
          :min="1"
          :max="999999"
          style="width: 100%"
        >
          <template #addonAfter>人</template>
        </a-input-number>
      </a-form-item>

      <div v-else-if="capacityType === 'zone_capacity'">
        <div class="venue-form__zone-header">
          <a-space>
            <a-typography-text type="secondary">
              已添加 {{ zones?.length || 0 }} 个座区
            </a-typography-text>
            <template v-if="zones && zones.length">
              <a-typography-text type="secondary">，总容量：</a-typography-text>
              <a-typography-text strong>
                {{
                  (zones || []).reduce(
                    (sum: number, z: any) => sum + (z.capacity || 0),
                    0,
                  )
                }}
                人
              </a-typography-text>
            </template>
          </a-space>
          <a-button type="dashed" @click="handleAddZone">
            添加座区
          </a-button>
        </div>

        <a-table
          v-if="zones && zones.length"
          :data-source="zones"
          :pagination="false"
          :row-key="(_: unknown, index: number) => String(index)"
          :scroll="{ y: 400 }"
        >
          <a-table-column
            key="name"
            title="* 座区名称"
            data-index="name"
            :width="'40%'"
          >
            <template #default="{ text, index }">
              <a-input
                :value="text"
                placeholder="请输入座区名称"
                :maxlength="20"
                @change="(e: any) => handleZoneFieldChange(index, 'name', e.target.value)"
              />
            </template>
          </a-table-column>

          <a-table-column
            key="capacity"
            title="* 容量（人）"
            data-index="capacity"
            :width="'40%'"
          >
            <template #default="{ text, index }">
              <a-input-number
                :value="text"
                placeholder="请输入容量"
                :min="1"
                :max="99999"
                style="width: 100%"
                @change="(val: number | null) => handleZoneFieldChange(index, 'capacity', val || 0)"
              />
            </template>
          </a-table-column>

          <a-table-column
            key="actions"
            title="操作"
            :width="80"
            align="right"
          >
            <template #default="{ index }">
              <a-popconfirm
                title="确认删除该座区吗？"
                ok-text="确认"
                cancel-text="取消"
                @confirm="() => handleDeleteZone(index)"
              >
                <a-button type="link" size="small">删除</a-button>
              </a-popconfirm>
            </template>
          </a-table-column>
        </a-table>

        <a-empty
          v-else
          description="暂无座区，请点击上方“添加座区”按钮添加"
        />
      </div>
    </div>
  </a-form>
</template>

<style scoped>
.venue-form__two-columns {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: 16px;
  row-gap: 0;
}

.venue-form__zone-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
</style>
