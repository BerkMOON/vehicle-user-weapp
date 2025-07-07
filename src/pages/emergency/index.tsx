import { View, Picker, ScrollView, Text, Image } from '@tarojs/components'  // 添加 Picker 导入
import { useEffect, useState } from 'react'
import './index.scss'
import { CloudAPI } from '@/request/cloudApi'
import { DeviceAPI } from '@/request/deviceApi'
import { EmergencyVideoInfo } from '@/request/cloudApi/typings'
import { DeviceInfo } from '@/request/deviceApi/typings'
import { Empty, Loading } from '@nutui/nutui-react-taro'
import emptyImg from '@/assets/empty.png'
import { useUserStore } from '@/store/user'
import NotLogin from '@/components/NotLogin'
import NotBind from '@/components/NotBind'
import { Del, PlayStart } from '@nutui/icons-react-taro'
import Taro from '@tarojs/taro'
import dayjs from 'dayjs'
import DefaultPng from '@/assets/default.png'

const ErrorDate = '1970';
export default function EmergencyVideo() {
  const { isLogin } = useUserStore()
  const [emergencyList, setEmergencyList] = useState<EmergencyVideoInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const [devices, setDevices] = useState<DeviceInfo[]>([])
  const [selectedDevice, setSelectedDevice] = useState<string>('')
  const [deviceLoading, setDeviceLoading] = useState(true)
  const [page, setPage] = useState(1)
  const pageSize = 15

  const fetchEmergencyVideos = async (pageNum: number) => {
    if (!hasMore && pageNum > 1) return
    if (!selectedDevice) return
    const deviceId = devices.find(device => device.sn === selectedDevice)?.device_id || ''
    setLoading(true)
    try {
      const res = await CloudAPI.getEmergencyVideos({
        page: pageNum,
        limit: pageSize,
        device_id: deviceId
      })

      const newMedias = res?.data?.record_list || []

      // 判断是否还有更多数据
      setHasMore(newMedias.length === pageSize)

      // 更新列表数据
      setEmergencyList(prev => pageNum === 1 ? newMedias : [...prev, ...newMedias])
    } catch (error) {
      console.error('获取紧急视频列表失败：', error)
    } finally {
      setLoading(false)
    }
  }

  // 获取设备列表
  const fetchDevices = async () => {
    try {
      setDeviceLoading(true)
      const res = await DeviceAPI.list()
      if (res?.data?.device_list) {
        setDevices(res.data.device_list)
        if (res.data.device_list.length > 0) {
          setSelectedDevice(res.data.device_list[0].sn)
        }
      }
      setDeviceLoading(false)
    } catch (error) {
      console.error('获取设备列表失败:', error)
      setDeviceLoading(false)
    }
  }

  useEffect(() => {
    fetchDevices()
  }, [])

  useEffect(() => {
    if (selectedDevice) {
      setPage(1)
      fetchEmergencyVideos(1)
    }
  }, [selectedDevice])

  const onScrollToLower = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1
      setPage(nextPage)
      fetchEmergencyVideos(nextPage)
    }
  }

  const deleteEmergencyVideo = async (videoId: number) => {
    try {
      const res = await Taro.showModal({
        title: '删除紧急视频',
        content: '确认删除该紧急视频吗？',
        confirmText: '删除',
        cancelText: '取消'
      })
      if (res.confirm) {
        await CloudAPI.delEmergencyVideo({
          device_id: devices.find(device => device.sn === selectedDevice)?.device_id || '',
          id: videoId
        })
        setEmergencyList(prev => prev.filter(video => video.id !== videoId))
        Taro.showToast({
          title: '删除成功',
          icon: 'success'
        })
      }
    } catch (error) {
      console.error('删除紧急视频失败:', error)
      Taro.showToast({
        title: '删除失败',
        icon: 'error'
      })
    }
  }

  if (!isLogin) {
    return <NotLogin></NotLogin>
  }

  if (devices.length === 0 && !deviceLoading) {
    return <NotBind></NotBind>
  }

  const selectedPreviewToPlay = (item) => {
    Taro.previewMedia({
      sources: emergencyList.map(item => {
        return {
          url: item.video_url || '',
          type: 'video'
        }
      }),
      current: emergencyList.indexOf(item)
    })
  }

  return (
    <View className='cloud-album'>
      <View className='filters'>
        <Picker
          mode='selector'
          range={devices.map(device => `设备：${device.sn}`)}
          value={devices.findIndex(device => device.sn === selectedDevice)}
          onChange={(e) => {
            const device = devices[e.detail.value]
            setSelectedDevice(device.sn)
          }}
        >
          <View className='picker-item'>
            <View className='device-sn'>
              {selectedDevice ? `设备：${selectedDevice}` : '请选择设备'}
            </View>
          </View>
        </Picker>
      </View>

      <ScrollView
        className='scroll-info'
        scrollY
        onScrollToLower={onScrollToLower}
      >
        <View className='scroll-content'>
          {
            emergencyList.length === 0 ? (
              !loading && <Empty
                className='empty'
                description='暂无紧急视频'
                image={emptyImg}
              />
            ) : (<>
              <View className="files-grid">
                {emergencyList.map((file, index) => (
                  <View
                    key={index}
                    className="file-item"
                  >
                    <View className="thumbnail-wrapper" onClick={() => {
                      selectedPreviewToPlay(file)
                    }}>
                      <View className="video-thumbnail">
                        <PlayStart size={30} style={{ zIndex: 1 }} />
                        <Image
                          src={DefaultPng}
                          className="thumbnail"
                          mode="aspectFill"
                        />
                      </View>
                    </View>
                    <View className="file-info">
                      <View className="info-row">
                        <Text className="label">日期:</Text>
                        <Text className="time">{dayjs(file.trigger_time).format('YYYY') === ErrorDate ? dayjs(file.create_time).format('YYYY-MM-DD') : dayjs(file.trigger_time).format('YYYY-MM-DD')}</Text>
                      </View>
                      <View className="info-row">
                        <Text className="label">时间:</Text>
                        <Text className="time">{dayjs(file.trigger_time || file.create_time).format('HH:mm:ss')}</Text>
                      </View>
                      <View className="info-row" style={{ justifyContent: 'space-between' }}>
                        <View>
                          <Text className="label">大小:</Text>
                          <Text className="size">2.9MB</Text>
                        </View>
                        <Del style={{
                          marginTop: '3px'
                        }} onClick={() => deleteEmergencyVideo(file.id as number)} size={12} />
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </>)
          }

          {loading && (
            <View className='loading'>
              <Loading type="spinner">加载中...</Loading>
            </View>
          )}

          {!hasMore && emergencyList.length > 0 && (
            <View className='no-more'>
              <Text>没有更多紧急视频了</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  )
}