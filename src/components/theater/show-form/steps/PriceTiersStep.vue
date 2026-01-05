<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { ShowFormPriceTier } from '../types'
import { fetchVenueDetail, type VenueCapacityType } from '@/api/theaterVenue'
import message from 'ant-design-vue/es/message'
import { useRouter } from 'vue-router'

const props = defineProps<{
  modelValue: ShowFormPriceTier[]
  venueId?: string
  showId?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: ShowFormPriceTier[]): void
}>()

const tiers = computed({
  get: () => props.modelValue,
  set: (val: ShowFormPriceTier[]) => emit('update:modelValue', val),
} as any)

const venueCapacityType = ref<VenueCapacityType | null>(null)
const zoneOptions = ref<Array<{ label: string; value: string }>>([])
const loadingVenue = ref(false)
const router = useRouter()

const loadVenueDetail = async (venueId?: string) => {
  if (!venueId) {
    venueCapacityType.value = null
    zoneOptions.value = []
    return
  }
  try {
    loadingVenue.value = true
    const detail = await fetchVenueDetail(venueId)
    venueCapacityType.value = detail.capacityType as VenueCapacityType
    if (detail.capacityType === 'zone_capacity' && detail.zones) {
      zoneOptions.value = detail.zones.map((z: any) => ({
        label: z.name,
        value: z.id,
      }))
    } else {
      zoneOptions.value = []
    }
  } catch (err) {
    console.error(err)
    message.error('获取场馆信息失败')
  } finally {
    loadingVenue.value = false
  }
}

watch(
  () => props.venueId,
  (id) => {
    loadVenueDetail(id)
  },
  { immediate: true },
)

const handleAdd = () => {
  const next: ShowFormPriceTier[] = [
    ...tiers.value,
    {
      name: '',
      price: 0,
      zoneIds: [],
      color: '#FFD700',
      remark: '',
    },
  ]
  tiers.value = next
}

const handleRemove = (index: number) => {
  const next = tiers.value.filter((_: ShowFormPriceTier, i: number) => i !== index)
  tiers.value = next
}

const configuredCount = computed(
  () => tiers.value.filter((t: ShowFormPriceTier) => (t.price ?? 0) > 0).length,
)

const handleEditPriceTiers = () => {
  router.push(`/dashboard/theater/shows/${props.showId ?? 'temp-show'}/seat-pricing`)
}
</script>

<template>
  <div>
    <a-alert style="margin-bottom: 12px" type="info" show-icon>
      <template #message>
        <span v-if="venueCapacityType === 'zone_capacity'">
          当前场馆为“按座区容量”模式，可将票档关联到不同座区。
        </span>
        <span v-else-if="venueCapacityType === 'precise_seat'">
          票档已继承场馆座区的名称和颜色，可在“票档配置”中为具体座位设置票价。
        </span>
        <span v-else>
          配置演出的票档和价格。
        </span>
      </template>
    </a-alert>

    <template v-if="venueCapacityType === 'precise_seat'">
      <div style="margin-bottom: 16px; display: flex; justify-content: space-between">
        <a-typography-text type="secondary">
          已配置 {{ configuredCount }} 个票档
        </a-typography-text>
        <a-button type="dashed" @click="handleEditPriceTiers">编辑票档</a-button>
      </div>

      <a-spin :spinning="loadingVenue">
        <a-table
          v-if="tiers.length"
          :data-source="tiers"
          :pagination="false"
          row-key="name"
        >
          <a-table-column
            key="name"
            data-index="name"
            title="票档名称"
            :width="'40%'"
          />
          <a-table-column key="price" title="票价（元）" :width="'30%'" align="right">
            <template #default="{ record }">
              ¥{{ (record.price ?? 0).toFixed(2) }}
            </template>
          </a-table-column>
          <a-table-column key="color" title="票档颜色" :width="'30%'" align="right">
            <template #default="{ record }">
              <a-space :size="8">
                <span>{{ record.color || '-' }}</span>
                <div
                  :style="{
                    width: '16px',
                    height: '16px',
                    borderRadius: '4px',
                    border: '1px solid #d9d9d9',
                    backgroundColor: record.color || '#f0f0f0',
                  }"
                />
              </a-space>
            </template>
          </a-table-column>
        </a-table>

        <a-empty
          v-else
          description="暂无票档配置，请点击“编辑票档”按钮进入座位图编辑器配置价格"
        />
      </a-spin>
    </template>

    <template v-else>
      <div style="margin-bottom: 16px; display: flex; justify-content: space-between">
        <a-typography-text type="secondary">
          已添加 {{ tiers.length }} 个票档
        </a-typography-text>
        <a-button type="dashed" @click="handleAdd">添加票档</a-button>
      </div>

      <a-spin :spinning="loadingVenue">
        <a-table
          v-if="tiers.length"
          :data-source="tiers"
          :pagination="false"
          :row-key="(_: any, index: number) => String(index)"
        >
          <a-table-column key="name" :width="'25%'">
            <template #title>
              <span style="color: #ff4d4f">*</span>
              <span style="margin-left: 4px">票档名称</span>
            </template>
            <template #default="{ index }">
              <a-form-item
                :name="['priceTiers', index, 'name']"
                :rules="[{ required: true, message: '请输入票档名称' }]"
                style="margin-bottom: 0"
              >
                <a-input
                  v-model:value="tiers[index].name"
                  placeholder="请输入票档名称"
                  :maxlength="20"
                />
              </a-form-item>
            </template>
          </a-table-column>

          <a-table-column key="price" :width="'20%'">
            <template #title>
              <span style="color: #ff4d4f">*</span>
              <span style="margin-left: 4px">票面价（元）</span>
            </template>
            <template #default="{ index }">
              <a-form-item
                :name="['priceTiers', index, 'price']"
                :rules="[
                  { required: true, message: '请输入票面价' },
                  { type: 'number', min: 0, max: 999999, message: '价格范围 0-999999' },
                ]"
                style="margin-bottom: 0"
              >
                <a-input-number
                  v-model:value="tiers[index].price"
                  :min="0"
                  :max="999999"
                  :precision="2"
                  placeholder="价格"
                  style="width: 100%"
                />
              </a-form-item>
            </template>
          </a-table-column>

          <a-table-column
            v-if="venueCapacityType === 'zone_capacity'"
            key="zoneIds"
            :width="'20%'"
          >
            <template #title>关联座区</template>
            <template #default="{ index }">
              <a-form-item :name="['priceTiers', index, 'zoneIds']" style="margin-bottom: 0">
                <a-select
                  v-model:value="tiers[index].zoneIds"
                  mode="multiple"
                  placeholder="请选择座区"
                  :options="zoneOptions"
                  style="width: 100%"
                />
              </a-form-item>
            </template>
          </a-table-column>

          <a-table-column key="color" :width="'15%'">
            <template #title>颜色</template>
            <template #default="{ index }">
              <a-form-item :name="['priceTiers', index, 'color']" style="margin-bottom: 0">
                <a-input v-model:value="tiers[index].color" placeholder="#FFD700" />
              </a-form-item>
            </template>
          </a-table-column>

          <a-table-column key="remark">
            <template #title>备注</template>
            <template #default="{ index }">
              <a-form-item
                :name="['priceTiers', index, 'remark']"
                :rules="[{ max: 50, message: '备注最多 50 个字' }]"
                style="margin-bottom: 0"
              >
                <a-input
                  v-model:value="tiers[index].remark"
                  placeholder="备注"
                  :maxlength="50"
                />
              </a-form-item>
            </template>
          </a-table-column>

          <a-table-column key="actions" :width="80" align="right">
            <template #title>操作</template>
            <template #default="{ index }">
              <a-popconfirm
                title="确认删除该票档吗？"
                ok-text="确认"
                cancel-text="取消"
                @confirm="() => handleRemove(index)"
              >
                <a-button type="link" size="small">删除</a-button>
              </a-popconfirm>
            </template>
          </a-table-column>
        </a-table>

        <a-empty v-else description="暂无票档，请点击上方“添加票档”按钮" />
      </a-spin>
    </template>
  </div>
</template>
