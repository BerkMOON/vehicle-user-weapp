import { View, Text, Picker } from '@tarojs/components'
import dayjs from 'dayjs'

type Props = {
  value: string
  onChange: (dateStr: string) => void
}

function formatToday() {
  return dayjs().format('YYYY-MM-DD')
}

/** 统一为接口所需 YYYY-MM-DD（兼容历史脏数据） */
export function normalizeToYMD(raw: unknown): string {
  if (raw == null || raw === '') return formatToday()
  const s = String(raw).trim()
  const matched = s.match(/(\d{4}-\d{2}-\d{2})/)
  if (matched) return matched[1]
  const d = dayjs(s)
  return d.isValid() ? d.format('YYYY-MM-DD') : formatToday()
}

function clampDateYMD(ymd: string, start: string, end: string) {
  const t = dayjs(ymd)
  const a = dayjs(start)
  const b = dayjs(end)
  if (!t.isValid()) return end
  if (t.isBefore(a)) return start
  if (t.isAfter(b)) return end
  return ymd
}

/**
 * 行车视频选日期：使用小程序原生日期 Picker（稳定、date_str 恒为 YYYY-MM-DD）
 * 不用 NutUI Calendar，避免部分基础库/机型白屏
 */
export function CycleDateCalendarPicker({ value, onChange }: Props) {
  const endDate = formatToday()
  const startDate = dayjs().subtract(365, 'day').format('YYYY-MM-DD')
  const normalized = value ? normalizeToYMD(value) : endDate
  const pickerValue = clampDateYMD(normalized, startDate, endDate)

  return (
    <Picker
      mode='date'
      value={pickerValue}
      start={startDate}
      end={endDate}
      onChange={e => {
        onChange(normalizeToYMD(e.detail.value))
      }}
    >
      <View className='picker-item'>
        <Text>{value ? normalizeToYMD(value) : '请选择日期'}</Text>
      </View>
    </Picker>
  )
}
