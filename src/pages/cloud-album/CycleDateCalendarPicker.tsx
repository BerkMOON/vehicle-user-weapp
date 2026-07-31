import { View, Text, Picker } from '@tarojs/components'
import dayjs from 'dayjs'

type Props = {
  value: string
  onChange: (dateStr: string) => void
}

function formatToday() {
  return dayjs().format('YYYY-MM-DD')
}

function formatYesterday() {
  return dayjs().subtract(1, 'day').format('YYYY-MM-DD')
}

/** 行车视频仅允许今天、昨天 */
export function getCycleVideoDateOptions() {
  const today = formatToday()
  const yesterday = formatYesterday()
  return [
    { label: `今天 (${today})`, value: today },
    { label: `昨天 (${yesterday})`, value: yesterday }
  ]
}

/** 统一为接口所需 YYYY-MM-DD，且限制在今天/昨天 */
export function normalizeToYMD(raw: unknown): string {
  const today = formatToday()
  const yesterday = formatYesterday()
  if (raw == null || raw === '') {
    return today
  }
  const s = String(raw).trim()
  const matched = s.match(/(\d{4}-\d{2}-\d{2})/)
  const ymd = matched ? matched[1] : (dayjs(s).isValid() ? dayjs(s).format('YYYY-MM-DD') : today)
  if (ymd === today || ymd === yesterday) {
    return ymd
  }
  return today
}

/**
 * 行车视频选日期：仅可选今天、昨天（近 24 小时录像）
 */
export function CycleDateCalendarPicker({ value, onChange }: Props) {
  const options = getCycleVideoDateOptions()
  const normalized = normalizeToYMD(value)
  const pickerIndex = Math.max(
    0,
    options.findIndex((o) => o.value === normalized)
  )

  return (
    <Picker
      mode='selector'
      range={options.map((o) => o.label)}
      value={pickerIndex}
      onChange={(e) => {
        const idx = Number(e.detail.value)
        onChange(options[idx]?.value ?? formatToday())
      }}
    >
      <View className='picker-item'>
        <Text>{options[pickerIndex]?.label ?? '请选择日期'}</Text>
      </View>
    </Picker>
  )
}
