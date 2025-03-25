import { Button, View } from '@tarojs/components'
import './index.scss'
import Taro from '@tarojs/taro'
import { useEffect, useState, useRef } from 'react'  // 添加 useRef
import { useUserStore } from '@/store/user'
import { DeviceAPI } from '@/request/deviceApi'
import { DeviceInfo } from '@/request/deviceApi/typings.d'
import { Computer } from '@nutui/icons-react-taro'
import { SettingAPI } from '@/request/settingApi'
import { handleRequest } from '@/request'
import { Dialog, Empty } from '@nutui/nutui-react-taro'
import emptyImg from '@/assets/empty.png'
import LoginPopup from '@/components/LoginPopup'

function Index() {
  const { isLogin } = useUserStore()
  const [deviceList, setDeviceList] = useState<DeviceInfo[]>([])
  const [connectDeivce, setConnectDevice] = useState(null)
  const timerRef = useRef<any>(null)  // 使用 useRef 存储定时器
  const [showLogin, setShowLogin] = useState(false)

  const checkConnection = async () => {
    try {
      handleRequest({
        url: SettingAPI.getFirmwareVersion(),
        errorMsg: '',
        onSuccess: (data) => {
          const versionMatch = data.match(/Camera\.Menu\.FWversion=(.+)/)
          setConnectDevice(versionMatch[1])
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

  const handleConnect = async () => {
    try {
      Dialog.open('open_wifi', {
        title: '连接设备WiFi',
        onConfirm: () => {
          const deviceInfo = Taro.getDeviceInfo()
          if(deviceInfo.platform === 'android') {
            connectWifi()
          }
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

  const connectWifi = () => {
    Taro.startWifi({
      success: function () {
        Taro.connectWifi({
          SSID: 'SG10_XXX',
          password: '12345678',
          maunal: true,
        })
      },
      fail: function () {
        Taro.showToast({
          title: '开启 WiFi 失败',
          icon: 'none'
        })
      }
    })
  }

  // 添加 WiFi 状态监听
  useEffect(() => {
    // 监听 WiFi 状态变化
    Taro.onWifiConnected(function (res) {
      if (res.wifi && res.wifi.SSID.startsWith('SG10')) {
        // 是目标设备的 WiFi，开始轮询
        if (timerRef.current) {
          clearInterval(timerRef.current)
        }
        timerRef.current = setInterval(() => checkConnection(), 2000)
      }
      if (!res.wifi || !res.wifi.SSID.startsWith('SG10')) {
        // WiFi 断开或连接到其他网络，清除轮询
        if (timerRef.current) {
          clearInterval(timerRef.current)
          timerRef.current = null
        }
        setConnectDevice(null)
      }
    })

    return () => {
      // 组件卸载时移除监听
      Taro.offWifiConnected()
    }
  }, [])

  const fetchDeviceList = async () => {
    try {
      const res = await DeviceAPI.list()
      if (res?.data?.device_list) {
        setDeviceList(res.data.device_list)
      }
    } catch (error) {
      console.error('获取设备列表失败:', error)
    }
  }


  useEffect(() => {
    if (isLogin) {
      fetchDeviceList()
    }
  }, [isLogin])

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

  return (
    <View className="page">
      <View className='header'></View>
      <View className="device-section">
        <View className="section-header">
          <View className="title">
            <Computer style={{ marginRight: '5px' }} />我的设备
          </View>
          {isLogin && deviceList.length > 0 && (
            <Button
              className="add-btn"
              onClick={() => Taro.navigateTo({ url: '/pages/bind-car/index' })}
            >
              添加设备
            </Button>
          )}
        </View>

        {!isLogin ? (
          <View className="empty-state">
            <Empty description="暂无您的设备信息，请登录查看" image={emptyImg} />
            <Button
              className="login-btn"
              onClick={() => setShowLogin(true)}
            >
              立即登录
            </Button>
          </View>
        ) : deviceList.length === 0 ? (
          <View className="empty-state">
            <Empty description="暂无设备" image={emptyImg} />
            <Button
              className="bind-btn"
              onClick={() => Taro.navigateTo({ url: '/pages/bind-car/index' })}
            >
              绑定设备
            </Button>
          </View>
        ) : (
          <View className="device-list">
            {deviceList.map(device => (
              <View key={device.device_id} className="device-item">
                <View className="device-info">
                  <View className="device-id">设备号：{device.sn}</View>
                  <View className="vin">车架号：{device.vin}</View>
                  {
                    connectDeivce && <View className="vin">
                      <View> 固件版本号：</View>
                      <View>{connectDeivce}</View>
                    </View>
                  }
                  <View className="connect-status">
                    {connectDeivce ? (
                      <View className="connected">已连接</View>
                    ) : (
                      <Button
                        className="connect-btn"
                        onClick={() => handleConnect()}
                      >
                        连接设备
                      </Button>
                    )}
                  </View>
                </View>
                <View className="device-actions">
                  <Button
                    className="action-btn"
                    onClick={() => Taro.navigateTo({ url: '/pages/recorder/index' })}
                    disabled={!connectDeivce}  // 添加设备连接状态判断
                  >
                    查看
                  </Button>
                  <Button
                    className="action-btn"
                    onClick={() => Taro.navigateTo({ url: '/pages/settings/index' })}
                    disabled={!connectDeivce}  // 添加设备连接状态判断
                  >
                    设置
                  </Button>
                  <Button
                    className="action-btn"
                    onClick={() => Taro.navigateTo({ url: '/pages/downloads/index' })}
                  >
                    下载
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

      <View
        className="manual-card"
        onClick={() => Taro.navigateTo({ url: '/pages/manual/index' })}
      >
        <View className="manual-title">使用手册</View>
        <View className="manual-desc">了解记录仪使用方法</View>
      </View>

      <LoginPopup
        visible={showLogin}
        onClose={() => setShowLogin(false)}
      />

      <Dialog id="open_wifi">
        <>
          <View className="dialog-content">
            1.打开手机WiFi设置
          </View>
          <View className="dialog-content">
            2.找到并连接名为"SG10_XXX"的WiFi
          </View>
          <View className="dialog-content">
            3.输入WiFi密码：12345678
          </View>
          <View className="dialog-content">
            4.等待WiFi连接成功
          </View>
          <View className="dialog-content">
            5.返回小程序
          </View>
        </>
      </Dialog>
    </View>
  )
}

export default Index
