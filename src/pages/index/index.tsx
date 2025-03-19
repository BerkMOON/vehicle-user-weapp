import { Button, View } from '@tarojs/components'
import './index.scss'
import Taro from '@tarojs/taro'
import { useEffect, useState, useRef } from 'react'  // 添加 useRef
import { useUserStore } from '@/store/user'
import { useAuth } from '@/hooks/useAuth'
import { DeviceAPI } from '@/request/deviceApi'
import { DeviceInfo } from '@/request/deviceApi/typings.d'
import { Computer } from '@nutui/icons-react-taro'
import { SettingAPI } from '@/request/settingApi'
import { handleRequest } from '@/request'
import { Empty } from '@nutui/nutui-react-taro'
import emptyImg from '@/assets/empty.png'

function Index() {
  const { isLogin } = useUserStore()
  const { handleGetPhoneNumber } = useAuth()
  const [deviceList, setDeviceList] = useState<DeviceInfo[]>([])
  const [connectDeivce, setConnectDevice] = useState(null)
  const timerRef = useRef<any>(null)  // 使用 useRef 存储定时器

  const checkConnection = async () => {
    try {
      handleRequest({
        url: SettingAPI.getFirmwareVersion(),
        errorMsg: '',
        onSuccess: (data) => {
          const versionMatch = data.match(/FWversion=(\w+)/)
          setConnectDevice(versionMatch[1])
          if (timerRef.current) {
            clearInterval(timerRef.current)
            timerRef.current = null
          }
          Taro.showToast({
            title: '连接成功',
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
      await Taro.showModal({
        title: '连接设备',
        content: '请将手机连接到设备的 WiFi，WiFi 名称通常以 "SG10" 开头, 密码为12345678',
        confirmText: '去连接',
        cancelText: '取消'
      }).then(res => {
        if (res.confirm) {
          if (timerRef.current) {
            clearInterval(timerRef.current)
          }
          timerRef.current = setInterval(() => checkConnection(), 2000)
        }
      })
    } catch (error) {
      Taro.showToast({
        title: '操作取消',
        icon: 'none'
      })
    }
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [])

  const fetchDeviceList = async () => {
    try {
      const res = await DeviceAPI.list()
      if (res?.data?.device_list) {
        setDeviceList(res.data.device_list)
        // setDeviceList([{
        //   sn:'xxxx',
        //   device_id:'xxxx',
        //   vin:'xxxx',
        //   status: {
        //     code: 1,
        //     name: 'string',
        //   }
        // }])
      }
    } catch (error) {
      console.error('获取设备列表失败:', error)
    }
  }

  const getPhoneNumber = async (e) => {
    await handleGetPhoneNumber(e.detail.code)
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
            <Button
              className="login-btn"
              openType='getPhoneNumber'
              onGetPhoneNumber={getPhoneNumber}
            >
              登录获取手机号
            </Button>
          </View>
        ) : deviceList.length === 0 ? (
          <View className="empty-state">
            <Empty description="暂无设备" image={emptyImg}/>
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
                    connectDeivce && <View className="vin">固件版本号：{connectDeivce}</View>
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
    </View>
  )
}

export default Index
