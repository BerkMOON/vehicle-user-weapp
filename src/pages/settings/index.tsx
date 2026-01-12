import { View, Text, Switch, Slider } from '@tarojs/components'
import { useState, useEffect } from 'react'
import { Disk, Photograph, Power, Tips, Voice } from '@nutui/icons-react-taro'
// import { Picker } from '@nutui/nutui-react-taro'
import Taro from '@tarojs/taro'
import './index.scss'
import { StorageInfo } from './constants'
import { parseStorageInfo } from '@/utils/utils'
import { handleRequest } from '@/request'
import { SettingAPI } from '@/request/settingApi'
import BublePop from '@/components/BublePop'

function Settings() {
  // const [isRecording, setIsRecording] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null)
  const [isFormatting, setIsFormatting] = useState(false)
  const [volume, setVolume] = useState(5)
  // const [recordingDuration, setRecordingDuration] = useState('1MIN')
  // const [durationPickerVisible, setDurationPickerVisible] = useState(false)
  const [parkingMonitor, setParkingMonitor] = useState('DISABLE')
  const [parkingCapture, setParkingCapture] = useState('DISABLE')
  const [version, setVersion] = useState('')
  const [hasShownMuteTip, setHasShownMuteTip] = useState(false)

  // 获取存储信息
  const fetchStorageInfo = () => {
    handleRequest({
      url: SettingAPI.getStorageInfo(),
      errorMsg: '获取存储信息失败',
      onSuccess: (data) => {
        const storageData = parseStorageInfo(data)
        if (storageData) {
          setStorageInfo(storageData)
        } else {
          throw new Error('解析存储信息失败')
        }
      }
    })
  }

  // 提示关闭静音
  const showMuteTip = async () => {
    if (hasShownMuteTip) return

    try {
      const res = await Taro.showModal({
        title: '提示',
        content: '检测到记录仪视频是静音，会影响交警的责任区分和判断，可能导致事故责任认定困难，是否要关闭静音能力？',
        confirmText: '关闭静音',
        cancelText: '稍后',
        confirmColor: '#2193b0'
      })

      if (res.confirm) {
        // 用户点击确认，关闭静音
        handleRequest({
          url: SettingAPI.setMute(false),
          successMsg: '已关闭静音',
          errorMsg: '关闭静音失败',
          onSuccess: () => setIsMuted(false)
        })
      }

      setHasShownMuteTip(true)
    } catch (error) {
      console.error('显示静音提示失败:', error)
    }
  }

  // 获取相机状态
  const fetchCameraInfo = () => {
    handleRequest({
      url: SettingAPI.getCameraInfo(),
      errorMsg: '获取相机信息失败',
      onSuccess: (data) => {
        // const recordMatch = data.match(/record=(\w+)/)
        const audioMatch = data.match(/MovieAudio=(\w+)/)
        // if (recordMatch) {
        // setIsRecording(recordMatch[1] === 'Recording')
        const newIsMuted = audioMatch[1] !== 'ON'
        setIsMuted(newIsMuted)

        // 如果检测到静音状态，显示提示
        if (newIsMuted && !hasShownMuteTip) {
          // 延迟显示，确保状态已更新
          setTimeout(() => {
            showMuteTip()
          }, 500)
        }
        // }
      }
    })
  }

  // 获取设备信息
  const fetchMenuInfo = () => {
    handleRequest({
      url: SettingAPI.getMenuInfo(),
      errorMsg: '获取设备信息失败',
      onSuccess: (data) => {
        const volumeMatch = data.match(/VolAdj=(\d+)/)
        // const loopingVideoMatch = data.match(/LoopingVideo=(\w+)/)
        const parkingMonitorMatch = data.match(/ParkingMonitor=(\w+)/)
        const versionMatch = data.match(/FWversion=(\w+)/)
        const isParkingCaptureMatch = data.match(/ParkCapture=(\w+)/)
        if (versionMatch) {
          setVersion(versionMatch[1])
        }
        if (parkingMonitorMatch) {
          setParkingMonitor(parkingMonitorMatch[1])
        }
        // if (loopingVideoMatch) {
        //   setRecordingDuration(loopingVideoMatch[1])
        // }
        if (volumeMatch) {
          setVolume(parseInt(volumeMatch[1], 10))
        }
        if (isParkingCaptureMatch) {
          setParkingCapture(isParkingCaptureMatch[1])
        }
      }
    })
  }

  // 切换录像状态
  // const handleRecordingToggle = (value: boolean) => {
  //   handleRequest({
  //     url: SettingAPI.setRecording(),
  //     successMsg: value ? '已开启录像' : '已关闭录像',
  //     errorMsg: '切换录像状态失败',
  //     onSuccess: () => setIsRecording(value)
  //   })
  // }

  // 切换静音状态
  const handleMuteToggle = async (value: boolean) => {
    // 如果要关闭静音，直接执行
    if (!value) {
      handleRequest({
        url: SettingAPI.setMute(false),
        successMsg: '已关闭静音',
        errorMsg: '切换静音状态失败',
        onSuccess: () => setIsMuted(false)
      })
      return
    }

    // 如果要打开静音，需要两次确认
    try {
      // 第一次警告：影响交警责任区分和判断
      const firstConfirm = await Taro.showModal({
        title: '重要提示',
        content: '开启静音录像会影响交警的责任区分和判断，可能导致事故责任认定困难。是否继续？',
        confirmText: '继续',
        cancelText: '取消',
        cancelColor: '#ff4d4f'
      })

      if (!firstConfirm.confirm) {
        // 用户取消，不执行任何操作
        return
      }

      // 第二次警告：影响事故救援
      const secondConfirm = await Taro.showModal({
        title: '再次确认',
        content: '开启静音录像还会影响事故救援，无法通过事故声音判断事故严重程度。确定要开启静音吗？',
        confirmText: '确定开启',
        cancelText: '取消',
        cancelColor: '#ff4d4f'
      })

      if (!secondConfirm.confirm) {
        // 用户取消，不执行任何操作
        return
      }

      // 两次都确认，执行开启静音
      handleRequest({
        url: SettingAPI.setMute(true),
        successMsg: '已开启静音',
        errorMsg: '开启静音失败',
        onSuccess: () => setIsMuted(true)
      })
    } catch (error) {
      console.error('显示确认弹窗失败:', error)
    }
  }

  // 格式化存储
  const handleFormat = async () => {
    try {
      setIsFormatting(true)
      const modalRes = await Taro.showModal({
        title: '警告',
        content: '格式化将删除所有数据，是否继续？',
        confirmColor: '#ff4d4f',
      })

      if (modalRes.cancel) return

      await handleRequest({
        url: SettingAPI.formatStorage(),
        successMsg: '格式化成功, 等待语音提醒',
        errorMsg: '格式化失败'
      })

      setStorageInfo({
        total: storageInfo?.total || '',
        used: '0',
        free: storageInfo?.total || '',
        usedPercentage: 0,
      })

    } finally {
      setIsFormatting(false)
    }
  }

  // 恢复出厂设置
  const handleFactoryReset = async () => {

    try {
      setIsFormatting(true)
      const modalRes = await Taro.showModal({
        title: '警告',
        content: '恢复出厂设置需要拔出TF卡，是否已经拔出',
        confirmColor: '#ff4d4f',
      })

      if (modalRes.cancel) return

      await handleRequest({
        url: SettingAPI.formatStorage(),
        successMsg: '恢复出厂设置成功, 等待语音提醒',
        errorMsg: '恢复出厂设置失败'
      })
    } finally {
      setIsFormatting(false)
    }
  }

  // 拍照
  const handleTakePhoto = () => {
    handleRequest({
      url: SettingAPI.takePhoto(),
      successMsg: '拍照成功',
      errorMsg: '拍照失败'
    })
  }

  // 设置录像时长
  // const handleDurationChange = (values: string[]) => {
  //   handleRequest({
  //     url: SettingAPI.setRecordingDuration(values[0]),
  //     successMsg: '设置成功',
  //     errorMsg: '设置录像时长失败',
  //     onSuccess: () => setRecordingDuration(values[0])
  //   })
  // }

  // 设置扬声器音量
  const handleVolumeChange = (value: number) => {
    handleRequest({
      url: SettingAPI.setVolume(value),
      successMsg: '设置成功',
      errorMsg: '设置音量失败',
      onSuccess: () => setVolume(value)
    })
  }

  // 设置停车监控状态
  const handleParkingMonitorChange = (value: boolean) => {
    const parkingMonitorValue = value ? 'ENABLE' : 'DISABLE'
    handleRequest({
      url: SettingAPI.setParkingMonitor(parkingMonitorValue),
      successMsg: value ? '已开启停车监控' : '已关闭停车监控',
      errorMsg: '切换停车监控状态失败',
      onSuccess: () => setParkingMonitor(parkingMonitorValue)
    })
  }

  // 设置停车拍照
  const handleParkingCaptureToggle = (value: boolean) => {
    const parkingCaptureValue = value ? 'ENABLE' : 'DISABLE'
    handleRequest({
      url: SettingAPI.setParkingCapture(parkingCaptureValue),
      successMsg: value ? '已开启停车拍照' : '已关闭停车拍照',
      errorMsg: '切换停车拍照状态失败',
      onSuccess: () => setParkingCapture(parkingCaptureValue)
    })
  }

  useEffect(() => {
    fetchCameraInfo()
    fetchStorageInfo()
    fetchMenuInfo()
  }, [])

  return (
    <View className="settings-page">

      <View className="section">
        <View className="section-header">
          <Photograph />
          <Text className="title">拍照</Text>
        </View>
        <View className="setting-item">
          <Text>拍照</Text>
          <Text className="take-photo-btn" onClick={handleTakePhoto}>
            拍照
          </Text>
        </View>
      </View>

      <View className="section">
        <View className="section-header">
          <Power />
          <Text className="title">设备设置</Text>
        </View>
        <View className="setting-item">
          <BublePop content="开启后，车辆停车时会设备会拍摄一张照片，可在云相册中查看" position='right' >
            <Text>停车拍照 <Tips className='custom-icon' size={15} /></Text>
          </BublePop>
          <Switch
            checked={parkingCapture === 'ENABLE'}
            onChange={(e) => handleParkingCaptureToggle(e.detail.value)}
          />
        </View>
        <View className="setting-item">
          <BublePop content="开启后，当检测到碰撞或震动时，设备会记录停车过程中的异常情况" position='right' >
            <Text>停车监控 <Tips className='custom-icon' size={15} /></Text>
          </BublePop>
          <Switch
            checked={parkingMonitor === 'ENABLE'}
            onChange={(e) => handleParkingMonitorChange(e.detail.value)}
          />
        </View>
        <View className="setting-item">
          <Text>静音录像</Text>
          <Switch
            checked={isMuted}
            onChange={(e) => handleMuteToggle(e.detail.value)}
          />
        </View>
      </View>

      {/* <View className="section">
        <View className="section-header">
          <Power />
          <Text className="title">录像设置</Text>
        </View>
        <View className="setting-item">
          <Text>录像状态</Text>
          <Switch
            checked={isRecording}
            onChange={(e) => handleRecordingToggle(e.detail.value)}
          />
        </View>
        <View className="setting-item">
          <Text>自动保存时长</Text>
          <View onClick={() => setDurationPickerVisible(true)}>
            {RECORDING_DURATIONS.find(duration => duration.value === recordingDuration)?.text}
          </View>
        </View>
      </View> */}

      <View className="section">
        <View className="section-header">
          <Voice />
          <Text className="title">音量设置</Text>
        </View>
        <View className="setting-item">
          <Text>扬声器音量</Text>
          <Text className="volume-value">{volume}</Text>
        </View>
        <Slider
          value={volume}
          min={0}
          max={10}
          step={1}
          blockSize={20}
          showValue
          onChange={(e) => handleVolumeChange(e.detail.value)}
        />
      </View>

      <View className="section">
        <View className="section-header">
          <Disk />
          <Text className="title">存储管理</Text>
        </View>
        {storageInfo && (
          <>
            <View className="storage-info">
              <View className="progress-bar">
                <View
                  className="progress-inner"
                  style={{ width: `${storageInfo.usedPercentage}%` }}
                />
              </View>
              <View className="storage-details">
                <Text>总容量: {storageInfo.total}</Text>
                <Text>已用: {storageInfo.used}</Text>
                <Text>可用: {storageInfo.free}</Text>
              </View>
            </View>
            <View className="setting-item">
              <Text>格式化存储</Text>
              <Text
                className={`format-btn ${isFormatting ? 'disabled' : ''}`}
                onClick={handleFormat}
              >
                {isFormatting ? '格式化中...' : '格式化'}
              </Text>
            </View>
          </>
        )}
      </View>


      <View className="section">
        <View className="section-header">
          <Power />
          <Text className="title">版本信息</Text>
        </View>
        <View className="setting-item">
          <Text>当前固件版本</Text>
          <Text>{version}</Text>
        </View>
        <View className="setting-item">
          <BublePop content="恢复出厂设置，需先拔出TF卡" position='right' >
            <Text>恢复出厂设置 <Tips className='custom-icon' size={15} /></Text>
          </BublePop>
          <Text
            className={`format-btn ${isFormatting ? 'disabled' : ''}`}
            onClick={handleFactoryReset}
          >
            {isFormatting ? '恢复出厂设置...' : '恢复出厂设置'}
          </Text>
        </View>
      </View>

      {/* <Picker
        title="请选择录像时长"
        visible={durationPickerVisible}
        value={[recordingDuration]}
        options={RECORDING_DURATIONS}
        onConfirm={(_, values) => handleDurationChange(values as string[])}
        onClose={() => setDurationPickerVisible(false)}
      /> */}
    </View>
  )
}

export default Settings 