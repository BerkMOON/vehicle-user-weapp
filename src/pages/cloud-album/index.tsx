import { View, Picker, ScrollView, Text, Image } from '@tarojs/components'  // 添加 Picker 导入
import { useEffect, useMemo, useRef, useState } from 'react'
import './index.scss'
import { CloudAPI } from '@/request/cloudApi'
import { DeviceAPI } from '@/request/deviceApi'
import { ItemList, Photos } from '@/request/cloudApi/typings'
import { DeviceInfo } from '@/request/deviceApi/typings'
import { Empty, Loading } from '@nutui/nutui-react-taro'
import emptyImg from '@/assets/empty.png'
import { useUserStore } from '@/store/user'
import NotLogin from '@/components/NotLogin'
import NotBind from '@/components/NotBind'
import { PlayStart, Del } from '@nutui/icons-react-taro'
import Taro, { useDidShow, useRouter } from '@tarojs/taro'
import { formatFileSize } from '@/utils/utils'
import DefaultPng from '@/assets/default.png'
import { CycleDateCalendarPicker, normalizeToYMD } from './CycleDateCalendarPicker'
import { CLOUD_ALBUM_PENDING_SN_STORAGE_KEY } from '@/constants/constants'

function formatYMD(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

type MediaItem = Photos & { first_frame_url?: string; video_path?: string }

const ALL_TYPE_OPTIONS = [
  { text: '行车视频', value: 'cycle_video' },
  { text: '停车拍照', value: 'shutdown' },
  { text: '照片', value: 'photos' },
  { text: '视频', value: 'videos' },
] as const

const isCloudDevice = (device?: DeviceInfo) => device?.is_cloud_ver === true

function mapCycleItemToMedia(item: ItemList, index: number): MediaItem {
  return {
    id: item.video_path || `cycle-${index}-${item.last_modified || ''}`,
    url: item.video_url || '',
    name: item.video_path || '',
    video_path: item.video_path,
    created_time: item.last_modified || '',
    size: item.size || 0,
    first_frame_url: item.first_frame_url
  }
}

export default function CloudAlbum() {
  const router = useRouter()
  const { isLogin } = useUserStore()
  const devicesRef = useRef<DeviceInfo[]>([])
  const [folders, setFolders] = useState<string[]>([])
  const [mediaList, setMediaList] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const [devices, setDevices] = useState<DeviceInfo[]>([])
  const [selectedDevice, setSelectedDevice] = useState<string>('')
  const [selectedType, setSelectedType] = useState<string>('cycle_video')
  const [selectedFolder, setSelectedFolder] = useState<string>('')
  const [nextToken, setNextToken] = useState('')
  const mediaListRef = useRef<MediaItem[]>([])
  const [deviceLoading, setDeviceLoading] = useState(true)
  const pageSize = 15

  const selectedDeviceInfo = useMemo(
    () => devices.find((d) => d.sn === selectedDevice),
    [devices, selectedDevice]
  )

  const typesOptions = useMemo(() => {
    if (isCloudDevice(selectedDeviceInfo)) {
      return [...ALL_TYPE_OPTIONS]
    }
    return ALL_TYPE_OPTIONS.filter((o) => o.value !== 'cycle_video')
  }, [selectedDeviceInfo])

  useEffect(() => {
    devicesRef.current = devices
  }, [devices])

  /** 从首页 switchTab 写入的待选 sn，命中列表则消费并返回 */
  const takePendingSnIfInList = (list: DeviceInfo[]): string => {
    try {
      const p = Taro.getStorageSync(CLOUD_ALBUM_PENDING_SN_STORAGE_KEY)
      if (typeof p !== 'string' || !p) return ''
      if (!list.some((d) => d.sn === p)) {
        Taro.removeStorageSync(CLOUD_ALBUM_PENDING_SN_STORAGE_KEY)
        return ''
      }
      Taro.removeStorageSync(CLOUD_ALBUM_PENDING_SN_STORAGE_KEY)
      return p
    } catch {
      return ''
    }
  }

  // 获取文件夹列表
  const fetchFolders = async () => {
    if (!selectedDevice || selectedType === 'cycle_video') return
    setLoading(true)
    try {
      const deviceId = devices.find(device => device.sn === selectedDevice)?.device_id
      const res = await CloudAPI.getCloudFolders({
        deviceId: `eda_hz_${deviceId}`,
        type: selectedType
      })
      setFolders(res?.data || [])
      setSelectedFolder(res?.data?.length ? res.data[0] : '')
      setMediaList([])
    } catch (error) {
      console.error('获取文件夹失败：', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    mediaListRef.current = mediaList
  }, [mediaList])

  const fetchMediaList = async (isForce = false) => {
    if (!selectedFolder) return
    if (!isForce && (!hasMore || loading)) return

    const deviceId = devices.find(device => device.sn === selectedDevice)?.device_id
    if (!deviceId) return

    setLoading(true)
    try {
      if (selectedType === 'cycle_video') {
        const prevList = isForce ? [] : mediaListRef.current
        const lastItem =
          !isForce && prevList.length > 0 ? prevList[prevList.length - 1] : null
        const markerPath =
          lastItem?.video_path || lastItem?.name || undefined

        const res = await CloudAPI.getCycleVideoList({
          date_str: normalizeToYMD(selectedFolder),
          device_id: deviceId,
          ...(markerPath ? { marker: markerPath } : {})
        })
        const rawList = res?.data?.item_list || []
        const newMedias = rawList.map((item, idx) => mapCycleItemToMedia(item, idx))
        setHasMore(!!res?.data?.has_next)
        setMediaList(prev => (isForce ? newMedias : [...prev, ...newMedias]))
      } else {
        const res = await CloudAPI.getCloudPhoto({
          nextToken: isForce ? '' : nextToken,
          limit: pageSize,
          deviceId: `eda_hz_${deviceId}`,
          type: selectedType,
          date: selectedFolder
        })

        const newMedias = res?.data?.photos || []
        setNextToken(res?.data?.next_token || '')
        setHasMore(!!res?.data?.next_token)
        setMediaList(prev => isForce ? newMedias : [...prev, ...newMedias])
      }
    } catch (error) {
      console.error('获取媒体列表失败：', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!selectedFolder) return
    setMediaList([])
    setNextToken('')
    setHasMore(true)
    fetchMediaList(true)
  }, [selectedFolder, selectedDevice, selectedType])

  // 获取设备列表
  const fetchDevices = async () => {
    try {
      setDeviceLoading(true)
      const res = await DeviceAPI.list()
      const list = res?.data?.device_list || []
      if (list.length) {
        setDevices(list)
        let preferSn = takePendingSnIfInList(list)
        if (!preferSn) {
          const rawSn = router.params.sn ?? router.params.deviceSn
          if (rawSn) {
            try {
              preferSn = decodeURIComponent(rawSn)
            } catch {
              preferSn = rawSn
            }
          }
        }
        const picked =
          preferSn && list.some((d) => d.sn === preferSn)
            ? preferSn
            : list[0].sn
        setSelectedDevice(picked)
        const pickedInfo = list.find((d) => d.sn === picked)
        if (!isCloudDevice(pickedInfo)) {
          setSelectedType((t) => (t === 'cycle_video' ? 'shutdown' : t))
        }
      } else {
        setDevices([])
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

  useDidShow(() => {
    const list = devicesRef.current
    if (!list.length) return
    const sn = takePendingSnIfInList(list)
    if (sn) setSelectedDevice(sn)
  })

  useEffect(() => {
    if (!selectedDevice) return
    if (!isCloudDevice(selectedDeviceInfo) && selectedType === 'cycle_video') {
      setSelectedType('shutdown')
      return
    }
    if (selectedType === 'cycle_video') {
      setSelectedFolder(formatYMD(new Date()))
      setMediaList([])
      setNextToken('')
      setHasMore(true)
      return
    }
    setSelectedFolder('')
    fetchFolders()
  }, [selectedDevice, selectedType, selectedDeviceInfo])

  const onScrollToLower = () => {
    if (hasMore && !loading && selectedFolder) {
      fetchMediaList()
    }
  }

  // 删除照片/视频
  const handleDelete = async (item: MediaItem) => {
    try {
      const res = await Taro.showModal({
        title: '确认删除',
        content: `确定要删除这个${selectedType === 'videos' || selectedType === 'cycle_video' ? '视频' : '照片'}吗？删除后无法恢复。`,
        confirmText: '确认删除',
        cancelText: '取消'
      })

      if (res.confirm) {
        try {
          // 从完整URL中提取路径部分
          const url = new URL(item.url)
          // 根据环境判断使用 test 或 prod
          const envPath = process.env.NODE_ENV === 'production' ? 'prod' : 'test'
          const pathMatch = url.pathname.match(new RegExp(`/${envPath}/cloud/.*$`))
          const path = pathMatch ? pathMatch[0].substring(1) : '' // 移除开头的斜杠

          await CloudAPI.delCloudObject({
            path,
            device_id: devices.find(device => device.sn === selectedDevice)?.device_id || ''
          })

          // 删除成功后从列表中移除该项
          setMediaList(prev => prev.filter(mediaItem => mediaItem.id !== item.id))

          Taro.showToast({
            title: '删除成功',
            icon: 'success'
          })
        } catch (error) {
          console.error('删除失败：', error)
          Taro.showToast({
            title: '删除失败',
            icon: 'error'
          })
        }
      }
    } catch (error) {
      console.error('显示确认对话框失败：', error)
    }
  }

  if (!isLogin) {
    return <NotLogin></NotLogin>
  }

  if (devices.length === 0 && !deviceLoading) {
    return <NotBind></NotBind>
  }

  if (deviceLoading) {
    return (
      <View className='cloud-album cloud-album--initial-loading'>
        <View className='initial-loading-wrap'>
          <Loading type="spinner">加载中...</Loading>
        </View>
      </View>
    )
  }

  const typePickerIndex = Math.max(
    0,
    typesOptions.findIndex(option => option.value === selectedType)
  )
  const devicePickerIndex = Math.max(
    0,
    devices.findIndex(device => device.sn === selectedDevice)
  )
  const folderRange = folders.length > 0 ? folders : ['暂无日期']
  const folderPickerIndex =
    folders.length > 0 ? Math.max(0, folders.indexOf(selectedFolder)) : 0

  /**
   * 行车视频：若配置了 TARO_APP_WEBVIEW_PLAYER_URL，优先走 web-view 嵌 H5 播放器（可播 TS）。
   * 否则尝试下载后 previewMedia，再退回原生 Video 页。
   */
  const openCycleVideoPreview = async (item: MediaItem) => {
    const url = item.url?.trim()
    if (!url) {
      Taro.showToast({ title: '无播放地址', icon: 'none' })
      return
    }

    if (TARO_APP_WEBVIEW_PLAYER_URL && TARO_APP_WEBVIEW_PLAYER_URL.trim()) {
      void Taro.navigateTo({
        url: `/pages/video-web-player/index?videoUrl=${encodeURIComponent(url)}`
      })
      return
    }
  }

  const selectedPreviewToPlay = (item: MediaItem) => {
    if (selectedType === 'cycle_video') {
      void openCycleVideoPreview(item)
      return
    }
    if (selectedType === 'videos') {
      Taro.previewMedia({
        sources: mediaList.map(f => ({
          url: f.url,
          type: 'video' as const
        })),
        current: mediaList.indexOf(item)
      })
    } else {
      Taro.previewImage({
        urls: mediaList.map(f => f.url),
        current: mediaList.indexOf(item)
      })
    }
  }

  return (
    <View className='cloud-album'>
      <View className={`filters${devices.length <= 1 ? ' filters--single-device' : ''}`}>
        {devices.length > 1 && (
          <Picker
            mode='selector'
            range={devices.map(device => `设备：${device.sn}`)}
            value={devicePickerIndex}
            onChange={(e) => {
              const device = devices[e.detail.value]
              setSelectedDevice(device.sn)
              if (!isCloudDevice(device)) {
                setSelectedType((t) => (t === 'cycle_video' ? 'shutdown' : t))
              }
            }}
          >
            <View className='picker-item'>
              <View className='device-sn'>
                {selectedDevice ? `设备：${selectedDevice.slice(-8)}` : '请选择设备'}
              </View>
            </View>
          </Picker>
        )}

        <Picker
          mode='selector'
          range={typesOptions.map(option => option.text)}
          value={typePickerIndex}
          onChange={(e) => {
            setSelectedType(typesOptions[e.detail.value].value)
          }}
        >
          <View className='picker-item'>
            {typesOptions.find(option => option.value === selectedType)?.text || '请选择类型'}
          </View>
        </Picker>

        {selectedType === 'cycle_video' ? (
          <CycleDateCalendarPicker value={selectedFolder} onChange={setSelectedFolder} />
        ) : (
          <Picker
            mode='selector'
            range={folderRange}
            value={folderPickerIndex}
            disabled={folders.length === 0}
            onChange={(e) => {
              setSelectedFolder(folders[e.detail.value])
            }}
          >
            <View className='picker-item'>
              {selectedFolder || (folders.length === 0 ? '暂无日期' : '请选择日期')}
            </View>
          </Picker>
        )}
      </View>

      <ScrollView
        className='scroll-info'
        scrollY
        onScrollToLower={onScrollToLower}
      >
        <View className='scroll-content'>
          {mediaList.length === 0 ? (
            !loading && <Empty
              className='empty'
              description={
                selectedType === 'cycle_video'
                  ? '暂无行车视频'
                  : `暂无${selectedType === 'videos' ? '视频' : '照片'}`
              }
              image={emptyImg}
            />
          ) : (
            <View className="files-grid">
              {mediaList.map((file) => (
                <View
                  key={`${file.id}-${file.created_time}`}
                  className="file-item"
                >
                  <View
                    className="thumbnail-wrapper"
                    onClick={() => {
                      selectedPreviewToPlay(file)
                    }}
                  >
                    {selectedType === 'videos' || selectedType === 'cycle_video' ? (
                      <View className="video-thumbnail">
                        <PlayStart size={30} style={{ zIndex: 1 }} />
                        <Image
                          src={file.first_frame_url || DefaultPng}
                          className="thumbnail"
                          mode="aspectFill"
                        />
                      </View>
                    ) : (
                      <Image
                        src={file.url}
                        className="thumbnail"
                        mode="aspectFill"
                      />
                    )}
                  </View>

                  <View className="file-info">
                    <View className="info-row">
                      <Text className="label">时间:</Text>
                      <Text className="time">{file.created_time?.split(' ')[1]}</Text>
                    </View>
                    <View className="info-row" style={{ justifyContent: 'space-between' }}>
                      <View>
                        <Text className="label">大小:</Text>
                        <Text className="size">{formatFileSize(file.size)}</Text>
                      </View>
                      {selectedType !== 'cycle_video' && (
                        <Del
                          style={{ marginTop: '3px' }}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(file)
                          }}
                          size={12}
                        />
                      )}
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}

          {loading && (
            <View className='loading'>
              <Loading type="spinner">加载中...</Loading>
            </View>
          )}

          {!hasMore && mediaList.length > 0 && (
            <View className='no-more'>
              {selectedType === 'videos' || selectedType === 'cycle_video' ? '没有更多视频了' : '没有更多照片了'}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  )
}