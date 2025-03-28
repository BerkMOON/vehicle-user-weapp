import { View, Picker, ScrollView } from '@tarojs/components'  // 添加 Picker 导入
import { useEffect, useState } from 'react'
import './index.scss'
import { CloudAPI } from '@/request/cloudApi'
import { DeviceAPI } from '@/request/deviceApi'
import { Photos } from '@/request/cloudApi/typings'
import { DeviceInfo } from '@/request/deviceApi/typings'
import { Empty, Grid, Loading, Image, ImagePreview } from '@nutui/nutui-react-taro'
import emptyImg from '@/assets/empty.png'
import { useUserStore } from '@/store/user'
import NotLogin from '@/components/NotLogin'
import NotBind from '@/components/NotBind'
import VideoPlayer from '@/components/VideoPlayer'
import { PlayStart } from '@nutui/icons-react-taro'


export default function CloudAlbum() {
  const { isLogin } = useUserStore()
  const [folders, setFolders] = useState<string[]>([])
  const [mediaList, setMediaList] = useState<Photos[]>([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const [devices, setDevices] = useState<DeviceInfo[]>([])
  const [selectedDevice, setSelectedDevice] = useState<string>('')
  const [selectedType, setSelectedType] = useState<string>('shutdown')
  const [selectedFolder, setSelectedFolder] = useState<string>('')
  const [nextToken, setNextToken] = useState('')
  const [deviceLoading, setDeviceLoading] = useState(true)
  const [showPreview, setShowPreview] = useState(false)
  const [previewPhotos, setPreviewPhotos] = useState<any[]>([])
  const [previewVideos, setPreviewVideos] = useState<string>('')
  const [showVideo, setShowVideo] = useState(false)
  const [typesOptions] = useState([
    { text: '停车拍照', value: 'shutdown' },
    { text: '照片', value: 'photos' },
    { text: '视频', value: 'videos' },
  ])
  const pageSize = 15

  // 获取文件夹列表
  const fetchFolders = async () => {
    if (!selectedDevice) return
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

  const fetchMediaList = async (isForce = false) => {
    if (!selectedFolder) return
    if (!isForce && (!hasMore || loading)) return

    const deviceId = devices.find(device => device.sn === selectedDevice)?.device_id
    setLoading(true)
    try {
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
    } catch (error) {
      console.error('获取媒体列表失败：', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (selectedFolder) {
      setMediaList([])
      setNextToken('')
      setHasMore(true)
      fetchMediaList(true)
    }
  }, [selectedFolder])

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
      setSelectedFolder('')
      fetchFolders()
    }
  }, [selectedDevice, selectedType])

  const onScrollToLower = () => {
    if (hasMore && !loading && selectedFolder) {
      fetchMediaList()
    }
  }

  if (!isLogin) {
    return <NotLogin></NotLogin>
  }

  if (devices.length === 0 && !deviceLoading) {
    return <NotBind></NotBind>
  }

  const selectedPreviewToPlay = (item) => {
    if (selectedType === 'videos') {
      setPreviewPhotos([])
      setPreviewVideos(item.url)
      setShowVideo(true)
    } else {
      setPreviewVideos('')
      setPreviewPhotos([
        { src: item.url }
      ])
      setShowPreview(true)
    }
  }

  return (
    <View className='cloud-album'>
      <View className='filters'>
        <Picker
          mode='selector'
          range={devices.map(device => `设备：${device.sn}`)}  // 只显示后8位
          value={devices.findIndex(device => device.sn === selectedDevice)}
          onChange={(e) => {
            const device = devices[e.detail.value]
            setSelectedDevice(device.sn)
          }}
        >
          <View className='picker-item'>
            <View className='device-sn'>
              {selectedDevice ? `设备：${selectedDevice.slice(-8)}` : '请选择设备'}
            </View>
          </View>
        </Picker>

        <Picker
          mode='selector'
          range={typesOptions.map(option => option.text)}
          value={typesOptions.findIndex(option => option.value === selectedType)}
          onChange={(e) => {
            setSelectedType(typesOptions[e.detail.value].value)
          }}
        >
          <View className='picker-item'>
            {typesOptions.find(option => option.value === selectedType)?.text || '请选择类型'}
          </View>
        </Picker>

        <Picker
          mode='selector'
          range={folders}
          value={folders.indexOf(selectedFolder)}
          onChange={(e) => {
            setSelectedFolder(folders[e.detail.value])
          }}
        >
          <View className='picker-item'>
            {selectedFolder || '请选择日期'}
          </View>
        </Picker>
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
              description={`暂无${selectedType === 'videos' ? '视频' : '照片'}`}
              image={emptyImg}
            />
          ) : (
            <View className='photo-grid'>
              <Grid columns={3}>
                {mediaList.map(item => (
                  <Grid.Item
                    text={`拍摄时间:${item.created_time?.split(' ')[1]}` || ''}
                    key={item.id}
                    onClick={() => selectedPreviewToPlay(item)}>
                    {selectedType === 'videos' ? (
                      <Image
                        src={item.url}
                        loading={<PlayStart />}
                        error={<PlayStart />}
                        className='photo-image'
                      />
                    ) : (
                      <Image
                        src={item.url}
                        className='photo-image'
                      />
                    )}
                  </Grid.Item>
                ))}
              </Grid>
              <ImagePreview
                autoPlay={false}
                images={previewPhotos}
                visible={showPreview}
                closeIcon
                closeIconPosition="bottom"
                onClose={() => setShowPreview(false)}
              />
            </View>
          )}

          {loading && (
            <View className='loading'>
              <Loading type="spinner">加载中...</Loading>
            </View>
          )}

          {!hasMore && mediaList.length > 0 && (
            <View className='no-more'>
              {selectedType === 'videos' ? '没有更多视频了' : '没有更多照片了'}
            </View>
          )}
        </View>
      </ScrollView>

      <VideoPlayer visible={showVideo} setVisible={setShowVideo} videoUrl={previewVideos}></VideoPlayer>
    </View>
  )
}