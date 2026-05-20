import { Button, View, Image } from '@tarojs/components'
import './index.scss'
import Taro from '@tarojs/taro'
import { CLOUD_ALBUM_PENDING_SN_STORAGE_KEY } from '@/constants/constants'
import { useEffect, useState, useRef } from 'react'  // 添加 useRef
import { useUserStore } from '@/store/user'
import { DeviceAPI } from '@/request/deviceApi'
import { DeviceInfo } from '@/request/deviceApi/typings.d'
import { Computer, PlayStart } from '@nutui/icons-react-taro'
import { SettingAPI } from '@/request/settingApi'
import { handleRequest } from '@/request'
import { Dialog, Loading } from '@nutui/nutui-react-taro'
import NotLogin from '@/components/NotLogin'
import NotBind from '@/components/NotBind'
import { useAuth } from '@/hooks/useAuth'
import { ParkingCard } from './Components/Parking'
import { UserAPI } from '@/request/useApi'
import postImg from '@/assets/post.jpg'

function Index() {
  const { isLogin, loginStatus } = useUserStore()
  const { handleSetDeviceInfo } = useAuth()
  const [deviceList, setDeviceList] = useState<DeviceInfo[]>([])
  const [connectDeivce, setConnectDevice] = useState<{
    sn: string,
    version: string,
    loading: boolean
  }>({
    sn: '',
    version: '',
    loading: false
  })
  const timerRef = useRef<any>(null)  // 使用 useRef 存储定时器
  const [loading, setLoading] = useState(true)
  // const [showTour, setShowTour] = useState(false)

  const deviceInfo = Taro.getDeviceInfo()

  // Tour引导步骤配置 - 根据当前状态动态生成
  // const getTourSteps = () => {
  //   const steps: Array<{
  //     content: string;
  //     target: string;
  //     popoverOffset?: number[];
  //     arrowOffset?: number;
  //     location?: string
  //   }> = []

  //   // 如果有设备，添加查看设备步骤
  //   if (deviceList.length > 0) {
  //     steps.push({
  //       content: '连接设备后，点击这里可以查看设备录制的视频和照片',
  //       target: 'view-device-btn',
  //       popoverOffset: [260, 8],
  //       arrowOffset: -260,
  //     })
  //   }

  //   // 添加视频教程步骤
  //   steps.push({
  //     content: '点击这里可以学习如何连接设备的详细视频教程',
  //     target: 'video-tutorial-btn',
  //     popoverOffset: [-120, 8],
  //     arrowOffset: 120,
  //     location: 'top-start',
  //   })

  //   // 如果有设备，添加添加设备步骤
  //   if (deviceList.length > 0) {
  //     steps.push({
  //       content: '点击这里可以添加新设备，绑定您的行车记录仪',
  //       target: 'add-device-btn',
  //       popoverOffset: [0, 8],
  //     })
  //   }

  //   return steps
  // }

  // const closeTour = () => {
  //   setShowTour(false)
  //   // 保存用户已完成引导的状态
  //   Taro.setStorageSync('hasCompletedTour', true)
  // }

  // const startTour = () => {
  //   setShowTour(true)
  // }

  const checkConnection = async (sn: string) => {
    try {
      handleRequest({
        url: SettingAPI.getFirmwareVersion(),
        errorMsg: '',
        needErrorTip: false,
        onSuccess: (data) => {
          const versionMatch = data.match(/Camera\.Menu\.FWversion=(.+)/)
          setConnectDevice({
            sn,
            loading: false,
            version: versionMatch[1] || '',
          })
          if (timerRef.current) {
            clearInterval(timerRef.current)
            timerRef.current = null
          }
          Taro.showToast({
            title: '设备已连接',
            icon: 'success'
          })
        }
      })
    } catch (error) {
      console.log('等待设备连接...')
    }
  }

  const handleConnect = async (sn: string) => {
    if (connectDeivce.loading || connectDeivce.sn === sn) {
      // 如果正在连接，点击则取消连接
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      setConnectDevice({
        sn: '',
        version: '',
        loading: false
      })
      return
    }

    try {
      if (deviceInfo.brand === 'HUAWEI') {
        Taro.showModal({
          title: '华为手机专属提示',
          content: '华为手机暂时无法在微信小程序内连接设备。\n\n请使用浏览器版本：\n1. 点击确定复制网址\n2. 打开手机浏览器\n3. 粘贴网址访问\n\n功能完全一样，操作更流畅！',
          showCancel: false,
          success: (res) => {
            if (res.confirm) {
              Taro.setClipboardData({
                data: 'http://eda-mini-program.ai-kaka.com/',
                success: () => {
                  Taro.showToast({
                    title: '网址已复制，请打开浏览器粘贴',
                    icon: 'success',
                    duration: 3000
                  })
                }
              })
            }
          }
        })
        return
      }
      Dialog.open('open_wifi', {
        title: '连接设备WiFi',
        onConfirm: () => {
          setConnectDevice({
            sn,
            version: '',
            loading: true
          })
          loopRequest(sn)
          connectWifi()
          Dialog.close('open_wifi')
        },
        onCancel: () => {
          Dialog.close('open_wifi')
        },
      })
    } catch (error) {
      Taro.showToast({
        title: '操作取消',
        icon: 'none'
      })
    }
  }

  const loopRequest = async (sn) => {
    // 是目标设备的 WiFi，开始轮询
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
    timerRef.current = setInterval(() => checkConnection(sn), 1000)
  }

  const connectWifi = () => {
    Taro.startWifi({
      success: function () {
        if (deviceInfo.platform === 'android') {
          Taro.connectWifi({
            SSID: 'SG10_XXX',
            password: '12345678',
            maunal: true,
          })
        }
      },
      fail: function () {
        Taro.showToast({
          title: '开启 WiFi 失败',
          icon: 'none'
        })
      }
    })
  }

  useEffect(() => {
    return () => {
      // 组件卸载时移除监听
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  const fetchDeviceList = async () => {
    try {
      setLoading(true)
      const res = await DeviceAPI.list()
      if (res?.data?.device_list) {
        setDeviceList(res.data.device_list)
      }
      setLoading(false)
      handleSetDeviceInfo()
    } catch (error) {
      console.error('获取设备列表失败:', error)
      setLoading(false)
    }
  }

  const copyUrl = () => {
    Taro.setClipboardData({
      data: 'http://eda-mini-program.ai-kaka.com/',
      success: () => {
        Taro.showToast({
          title: '网址已复制',
          icon: 'success',
          duration: 3000
        })
      }
    })
  }

  useEffect(() => {
    // 只有当登录状态为 success 时才获取设备列表
    if (isLogin && loginStatus === 'success') {
      fetchDeviceList()
    }
  }, [isLogin, loginStatus])  // 添加 loginStatus 作为依赖

  const handleUnbind = async (sn: string) => {
    try {
      const res = await DeviceAPI.unbind(sn)
      if (res?.response_status?.code === 200) {
        Taro.showToast({
          title: '解绑成功',
          icon: 'success'
        })
        fetchDeviceList()
      } else {
        Taro.showToast({
          title: res?.response_status?.msg || '解绑失败',
          icon: 'error'
        })
      }
    } catch (error) {
      Taro.showToast({
        title: '解绑失败',
        icon: 'error'
      })
    }
  }

  const isCloudDevice = (d: DeviceInfo) => d.is_cloud_ver === true

  const isWifiConnectedToDevice = (d: DeviceInfo) =>
    connectDeivce?.sn === d.sn && !!connectDeivce.version

  const canOperateWithoutWifi = (d: DeviceInfo) =>
    isCloudDevice(d) || isWifiConnectedToDevice(d)

  const openDeviceView = (d: DeviceInfo) => {
    if (isCloudDevice(d)) {
      if (isWifiConnectedToDevice(d)) {
        void Taro.navigateTo({ url: '/pages/recorder/index' })
        return
      }
      try {
        Taro.setStorageSync(CLOUD_ALBUM_PENDING_SN_STORAGE_KEY, d.sn)
      } catch {
        /* ignore */
      }
      void Taro.switchTab({ url: '/pages/cloud-album/index' })
      return
    }
    void Taro.navigateTo({ url: '/pages/recorder/index' })
  }

  const openDeviceSettings = (d: DeviceInfo) => {
    if (isCloudDevice(d)) {
      if (isWifiConnectedToDevice(d)) {
        void Taro.navigateTo({ url: '/pages/settings/index' })
        return
      }
      void Taro.navigateTo({
        url: `/pages/settings/index?cloud=1&device_id=${encodeURIComponent(d.device_id)}`
      })
      return
    }
    void Taro.navigateTo({ url: '/pages/settings/index' })
  }

  const previewVideo = async () => {
    Taro.showLoading({
      title: '加载中',
    })

    const system = deviceInfo.brand === 'HUAWEI' ? 'huawei' : deviceInfo.platform === 'android' ? 'android'
      : 'ios';

    try {
      const res = await UserAPI.getInstruction({
        needSynopsisPdf: false,
        needSynopsisVideo: false,
        system,
      })

      const videoItem = res?.data.item_list?.[0];

      if (videoItem) {
        Taro.hideLoading()
        Taro.previewMedia({
          sources: [{
            url: videoItem.url,
            type: 'video',
          }]
        })
      } else {
        Taro.hideLoading()
        Taro.showToast({
          title: '未找到视频文件',
          icon: 'none',
        })
      }
    } catch (error) {
      Taro.hideLoading()
      Taro.showToast({
        title: '获取视频失败，请重试',
        icon: 'none',
      })
      console.error('获取指令失败', error)
      return
    }
  };

  return (
    <View className="page">
      <View className='header'></View>
      <View className="device-section">
        <View className="section-header">
          <View className="title">
            <Computer color='#2193b0' style={{ marginRight: '5px' }} />我的设备
          </View>
          {isLogin && deviceList.length > 0 && (
            <Button
              id="add-device-btn"
              className="add-btn"
              onClick={() => Taro.navigateTo({ url: '/pages/bind-car/index' })}
            >
              添加设备
            </Button>
          )}
        </View>

        {!isLogin ? (
          <NotLogin></NotLogin>
        ) : deviceList.length === 0 ? (
          <View className="empty-state">
            {
              loading ? (
                <Loading type="spinner">加载中</Loading>
              ) :
                <NotBind></NotBind>
            }
          </View>
        ) : (
          <View className="device-list">
            {deviceList.map(device => (
              <View key={device.device_id} className="device-item">
                <View className="device-info">
                  <View className="device-id">设备号：{device.sn}</View>
                  <View className="vin">车架号：{device.vin}</View>
                  {isCloudDevice(device) && (
                    <>
                      <View className="vin">
                        云端设备：不连 WiFi 也可通过网络查看云相册、云端设置
                      </View>
                    </>
                  )}
                  {
                    connectDeivce?.sn === device.sn && connectDeivce.version && <View className="vin">
                      <View> 固件版本号：</View>
                      <View>{connectDeivce?.version}</View>
                    </View>
                  }
                  <View className="connect-status">
                    <Button
                      className="connect-btn"
                      onClick={() => handleConnect(device.sn)}
                      loading={connectDeivce?.loading && connectDeivce?.sn === device.sn}
                    >
                      {connectDeivce?.sn === device.sn ? '取消连接' : '连接设备'}
                    </Button>
                  </View>
                </View>
                <View className="device-actions">
                  <Button
                    id="view-device-btn"
                    className="action-btn"
                    onClick={() => openDeviceView(device)}
                    disabled={!canOperateWithoutWifi(device)}
                  >
                    查看
                  </Button>
                  <Button
                    className="action-btn"
                    onClick={() => openDeviceSettings(device)}
                    disabled={!canOperateWithoutWifi(device)}
                  >
                    设置
                  </Button>
                  <Button
                    className="unbind-btn"
                    onClick={() => {
                      Taro.showModal({
                        title: '提示',
                        content: '确定要解绑该设备吗？',
                        success: (res) => {
                          if (res.confirm) {
                            handleUnbind(device.sn)
                          }
                        }
                      })
                    }}
                  >
                    解绑
                  </Button>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      <ParkingCard deviceIds={deviceList.map(list => list.device_id)}></ParkingCard>

      <View
        id="video-tutorial-btn"
        className="video-card"
        onClick={previewVideo}
      >
        <View className="video-thumbnail">
          <Image
            src={postImg}
            className="thumbnail-image"
            mode="aspectFill"
          />
          <View className="play-overlay">
            <PlayStart size={40} color="#fff" />
          </View>
        </View>
        <View className="video-info">
          <View className="video-title">连接设备视频</View>
          <View className="video-desc">快速学习如何连接设备</View>
        </View>
      </View>

      <View
        id="manual-btn"
        className="manual-card"
        onClick={() => Taro.navigateTo({ url: '/pages/manual/index' })}
      >
        <View className="manual-title">使用手册</View>
        <View className="manual-desc">了解记录仪使用方法</View>
      </View>

      {
        deviceInfo.brand == 'HUAWEI' ?
          <View
            className="huawei-notice-card"
            onClick={copyUrl}
          >
            <View className="huawei-notice-title">🔧 华为用户专用通道</View>
            <View className="huawei-notice-desc">点击复制网址，用浏览器打开，去进行设备连接，连接后调整设备设置及查看下载设备视频</View>
            <View className="huawei-notice-tip">📱 推荐使用华为浏览器或Chrome</View>
          </View> :
          <View
            className="manual-card"
            onClick={copyUrl}
          >
            <View className="manual-title">部分手机连接设备失败看这里</View>
            <View className="manual-desc">
              <View>无法连接点击这里，复制链接，之后在浏览器打开即可</View>
              <View>部分手机因为手机系统问题，无法连接设备，需要在浏览器打开链接进行后在网页操作</View>
            </View>
          </View>
      }

      <Dialog id="open_wifi">
        <>
          {
            deviceInfo.platform === 'ios' &&
            <View className="dialog-info">
              {`Ios系统连接前，请进入设置 -> APP -> 微信 -> 本地网络设置，打开本地网络设置`}
            </View>
          }
          <View className="dialog-title">
            请按照以下步骤操作：
          </View>
          <View className="dialog-title">
            1. 语音说出"打开WiFi"，切换记录仪至WiFi模式
          </View>
          <View className="dialog-title">
            2. 等待记录仪语音提示："WiFi模式切换成功"
          </View>
          <View className="dialog-content">
            3.打开手机WiFi设置
          </View>
          <View className="dialog-content">
            4.找到并连接名为"SG10_XXX"的WiFi
          </View>
          <View className="dialog-content">
            5.输入WiFi密码：12345678
          </View>
          <View className="dialog-content">
            6.等待WiFi连接成功
          </View>
          <View className="dialog-content">
            7.返回小程序
          </View>
        </>
      </Dialog>

      {/* Tour引导组件 */}
      {/* <Tour
        visible={showTour}
        onClose={closeTour}
        list={getTourSteps()}
        location="bottom-end"
        maskWidth={50}
        maskHeight={50}
        offset={[0, 0]}
      /> */}

      {/* 手动启动引导的按钮 */}
      {/* {isLogin && (
        <View className="tour-trigger">
          <Button
            className="tour-btn"
            onClick={startTour}
          >
            📖 功能引导
          </Button>
        </View>
      )} */}
    </View>
  )
}

export default Index
