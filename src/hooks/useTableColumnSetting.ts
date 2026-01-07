import { computed, ref, watch } from 'vue'

export type ColumnSettingColumn<T = unknown> = {
  key: string
  dataIndex?: string | string[]
  title?: string
  /**
   * Whether the column should appear in the column-setting panel.
   * Defaults to true.
   */
  enableSetting?: boolean
  /**
   * When true, the column stays visible and the checkbox is disabled.
   */
  settingDisabled?: boolean
  /**
   * Hide the column by default until the user enables it.
   */
  defaultHidden?: boolean
  /**
   * Optional label shown inside the setting panel.
   */
  settingLabel?: string
} & Record<string, any>

export type ColumnSettingItem = {
  key: string
  label: string
  disabled: boolean
  defaultHidden: boolean
}

interface UseTableColumnSettingOptions<T> {
  columns: ColumnSettingColumn<T>[]
  storageKey?: string
}

const readStoredKeys = (storageKey?: string): string[] | null => {
  if (!storageKey || typeof window === 'undefined') {
    return null
  }

  try {
    const cached = window.localStorage.getItem(storageKey)
    if (!cached) {
      return null
    }
    const parsed = JSON.parse(cached)
    if (Array.isArray(parsed)) {
      return parsed.filter((item): item is string => typeof item === 'string')
    }
    return null
  } catch {
    return null
  }
}

const writeStoredKeys = (storageKey: string | undefined, keys: string[]) => {
  if (!storageKey || typeof window === 'undefined') {
    return
  }
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(keys))
  } catch {
    /* noop */
  }
}

const extractColumnKey = (column: ColumnSettingColumn<any>) => {
  if (column.key) {
    return String(column.key)
  }
  if (column.dataIndex) {
    return Array.isArray(column.dataIndex) ? column.dataIndex.join('.') : String(column.dataIndex)
  }
  throw new Error('Column key is required when using useTableColumnSetting.')
}

const getColumnLabel = (column: ColumnSettingColumn<any>) => {
  if (column.settingLabel) {
    return column.settingLabel
  }
  if (typeof column.title === 'string') {
    return column.title
  }
  return extractColumnKey(column)
}

export const useTableColumnSetting = <T = unknown>({
  columns,
  storageKey,
}: UseTableColumnSettingOptions<T>) => {
  const sourceColumns = ref<ColumnSettingColumn<T>[]>(columns)

  const candidateColumns = computed<ColumnSettingItem[]>(() =>
    sourceColumns.value
      .filter((column: ColumnSettingColumn<T>) => column.enableSetting !== false)
      .map((column: ColumnSettingColumn<T>) => ({
        key: extractColumnKey(column),
        label: getColumnLabel(column),
        disabled: Boolean(column.settingDisabled),
        defaultHidden: Boolean(column.defaultHidden),
      })),
  )

  const availableKeys = computed(() => candidateColumns.value.map((item: ColumnSettingItem) => item.key))
  const defaultVisibleKeys = computed(() => {
    const visible = candidateColumns.value
      .filter((item: ColumnSettingItem) => !item.defaultHidden)
      .map((item: ColumnSettingItem) => item.key)
    if (visible.length) {
      return visible
    }
    return availableKeys.value
  })

  const normalizeKeys = (keys: string[]) => {
    if (!availableKeys.value.length) {
      return []
    }
    const forcedKeys = candidateColumns.value
      .filter((item: ColumnSettingItem) => item.disabled)
      .map((item: ColumnSettingItem) => item.key)
    const filtered = keys.filter((key) => availableKeys.value.includes(key))
    const fallback = filtered.length ? filtered : defaultVisibleKeys.value
    return Array.from(new Set([...fallback, ...forcedKeys]))
  }

  const storedKeys = readStoredKeys(storageKey)
  const checkedKeys = ref<string[]>(normalizeKeys(storedKeys ?? defaultVisibleKeys.value))

  watch(candidateColumns, () => {
    checkedKeys.value = normalizeKeys(checkedKeys.value)
  })

  watch(
    checkedKeys,
    (value) => {
      writeStoredKeys(storageKey, value)
    },
    { deep: true },
  )

  const visibleColumns = computed(() =>
    sourceColumns.value.filter((column: ColumnSettingColumn<T>) => {
      if (column.enableSetting === false) {
        return true
      }
      const key = extractColumnKey(column)
      return checkedKeys.value.includes(key)
    }),
  )

  const columnSettingItems = computed(() =>
    candidateColumns.value.map(({ key, label, disabled, defaultHidden }: ColumnSettingItem) => ({
      key,
      label,
      disabled,
      defaultHidden,
    })),
  )

  const updateCheckedKeys = (keys: string[]) => {
    checkedKeys.value = normalizeKeys(keys)
  }

  const resetColumns = () => {
    checkedKeys.value = normalizeKeys(defaultVisibleKeys.value)
  }

  return {
    visibleColumns,
    columnSettingItems,
    checkedKeys,
    updateCheckedKeys,
    resetColumns,
  }
}

export type UseTableColumnSettingReturn = ReturnType<typeof useTableColumnSetting>
