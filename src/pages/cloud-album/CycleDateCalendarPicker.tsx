import { View, Text, Picker } from '@tarojs/components'
import { getCycleVideoDateOptions, normalizeCycleDateYMD } from '@/utils/membership'

type Props = {
  value: string
  cloudDays: number
  onChange: (dateStr: string) => void
}

/**
 * 行车视频选日期：可选范围由会员权益 cycle_video_days 决定
 */
export function CycleDateCalendarPicker({ value, cloudDays, onChange }: Props) {
  const options = getCycleVideoDateOptions(cloudDays)
  if (!options.length) {
    return (
      <View className='picker-item picker-item--disabled'>
        <Text>暂无可用日期</Text>
      </View>
    )
  }

  const normalized = normalizeCycleDateYMD(value, cloudDays)
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
        onChange(options[idx]?.value ?? options[0].value)
      }}
    >
      <View className='picker-item'>
        <Text>{options[pickerIndex]?.label ?? '请选择日期'}</Text>
      </View>
    </Picker>
  )
}

export { getCycleVideoDateOptions, normalizeCycleDateYMD }
