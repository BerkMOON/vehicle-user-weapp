import { View, Text } from '@tarojs/components'
import { useRouter } from '@tarojs/taro'
import { useState, useMemo } from 'react'
import { DeviceAPI } from '@/request/deviceApi'
import './index.scss'
import Taro from '@tarojs/taro'
import ScrollableList from '@/components/ScrollableList'
import dayjs from 'dayjs'

interface ParkingRecord {
  occur_time: string
  sn: string
  lat: string
  lng: string
}

interface GroupedRecords {
  [key: string]: ParkingRecord[]
}

function ParkingDetail() {
  const router = useRouter()
  const [records, setRecords] = useState<ParkingRecord[]>([])
  const limit = 10

  const groupedRecords = useMemo(() => {
    return records.reduce((acc: GroupedRecords, item) => {
      const date = dayjs(item.occur_time).format('YYYY-MM-DD')
      if (!acc[date]) {
        acc[date] = []
      }
      acc[date].push(item)
      return acc
    }, {})
  }, [records])

  const fetchData = async ({ page }: { page: number }) => {
    if (!router.params.deviceId) return []

    try {
      const res = await DeviceAPI.parkList({
        page,
        limit,
        device_id: router.params.deviceId
      })

      if (res?.data) {
        const newRecords = res.data.record_list.map((item: any) => ({
          ...item,
          sn: res.data.sn
        }))

        setRecords(prev => page === 1 ? newRecords : [...prev, ...newRecords])
        return newRecords
      }
      return []
    } catch (error) {
      console.error('获取数据失败：', error)
      Taro.showToast({
        title: '加载失败',
        icon: 'error'
      })
      return []
    }
  }

  const handleLocation = (info: ParkingRecord) => {
    Taro.getLocation({
      type: 'gcj02',
      success() {
        const latitude = Number(info?.lat || 0)
        const longitude = Number(info?.lng || 0)
        Taro.openLocation({
          latitude,
          longitude,
          scale: 18,
          name: '车辆位置',
        })
      }
    })
  }

  const renderItem = (record: ParkingRecord) => {
    const date = dayjs(record.occur_time).format('YYYY-MM-DD')
    const isFirstItemOfDate = groupedRecords[date].indexOf(record) === 0

    return (
      <>
        {isFirstItemOfDate && (
          <View className='date-header'>
            <Text className='date-text'>{date}</Text>
          </View>
        )}
        <View className='record-content'>
          <Text className='alert-text'>车辆在熄火后有晃动，请检查车辆是否剐蹭</Text>
          <View className='info-rows'>
            <View className='info-row'>
              <Text className='time'>告警时间：{record.occur_time.split(' ')[1]}</Text>
            </View>
            <View className='info-row'>
              <Text className='sn'>设备SN：{record.sn}</Text>
            </View>
            <View className='action-row'>
              {
                Number(record.lat) && Number(record.lng) ?
                  <Text className='location' onClick={() => handleLocation(record)}>查看位置</Text> : <Text className='location'>GPS信号不好，暂无位置</Text>
              }
            </View>
          </View>
        </View>
      </>
    )
  }

  return (
    <View className='parking-detail'>
      <ScrollableList<ParkingRecord>
        fetchData={fetchData}
        renderItem={renderItem}
        emptyText='暂无告警记录'
        pageSize={limit}
        className='parking-list'
      />
    </View>
  )
}

export default ParkingDetail