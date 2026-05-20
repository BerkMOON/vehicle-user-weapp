import { View, Text, Switch, Slider } from '@tarojs/components'
import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { Disk, Photograph, Power, Tips, Voice } from '@nutui/icons-react-taro'
// import { Picker } from '@nutui/nutui-react-taro'
import Taro, { useRouter } from '@tarojs/taro'
import './index.scss'
import { StorageInfo } from './constants'
import { parseStorageInfo } from '@/utils/utils'
import { handleRequest } from '@/request'
import { SettingAPI } from '@/request/settingApi'
import BublePop from '@/components/BublePop'
import { CloudAPI } from '@/request/cloudApi'
import type { DeviceConfigResponse } from '@/request/cloudApi/typings'
import { SuccessCode } from '@/constants/constants'
import { Loading } from '@nutui/nutui-react-taro'

function truthyOn(v: unknown): boolean {
  const s = String(v ?? '').toLowerCase()
  return (
    s === 'on' ||
    s === 'enable' ||
    s === 'enabled' ||
    s === '1' ||
    s === 'true' ||
    s === 'yes'
  )
}

/** 从 getDeviceConfig 的 data 上取 mtime（根或 config 嵌套），用于与下发前快照对比 */
function extractConfigMtime(data: unknown): string | null {
  if (data == null || typeof data !== 'object' || Array.isArray(data)) return null
  const root = data as Record<string, unknown>
  const read = (obj: Record<string, unknown>) => {
    const v = obj.mtime
    if (v !== undefined && v !== null && String(v) !== '') return String(v)
    return null
  }
  const fromRoot = read(root)
  if (fromRoot) return fromRoot
  const cfg = root.config
  if (cfg && typeof cfg === 'object' && !Array.isArray(cfg)) {
    return read(cfg as Record<string, unknown>)
  }
  return null
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

const CLOUD_CONFIG_POLL_INTERVAL_MS = 1200
const CLOUD_CONFIG_POLL_MAX_ATTEMPTS = 45

/** 与云端 on/off、ENABLE 等取值对齐到 Switch 使用的 ENABLE / DISABLE */
function toEnableDisable(v: unknown): 'ENABLE' | 'DISABLE' {
  return truthyOn(v) ? 'ENABLE' : 'DISABLE'
}

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

  const router = useRouter()
  const cloudDeviceId = useMemo(() => {
    const id = router.params.device_id
    if (!id) return ''
    try {
      return decodeURIComponent(id)
    } catch {
      return id
    }
  }, [router.params.device_id])
  const isCloudMode = router.params.cloud === '1' && !!cloudDeviceId
  const [cloudLoading, setCloudLoading] = useState(false)
  const cloudConfigPollCancelledRef = useRef(false)

  useEffect(() => {
    cloudConfigPollCancelledRef.current = false
    return () => {
      cloudConfigPollCancelledRef.current = true
    }
  }, [])

  const loadCloudDeviceConfig = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!cloudDeviceId) return
      if (!opts?.silent) setCloudLoading(true)
      try {
        const baselineRes = await CloudAPI.getDeviceConfig({
          device_id: cloudDeviceId
        })
        if (baselineRes?.response_status?.code !== SuccessCode) {
          Taro.showToast({
            title: baselineRes?.response_status?.msg || '获取配置失败',
            icon: 'none'
          })
          return
        }
        const baselineMtime = extractConfigMtime(baselineRes.data)

        const cmdRes = await CloudAPI.sendDeviceCommand({
          device_id: cloudDeviceId,
          cmd: 'get_device_status'
        })
        if (cmdRes?.response_status?.code !== SuccessCode) {
          Taro.showToast({
            title: cmdRes?.response_status?.msg || '同步设备状态失败',
            icon: 'none'
          })
          return
        }

        /**
         * 把「已确认 mtime 更新过」的那次 getDeviceConfig 的 data 写入页面状态。
         * 接口形态见 DeviceConfigResponse：业务字段在 config（PascalCase），与 WiFi 直连页的 Switch/Slider 取值对齐。
         */
        const applyCfg = (data: unknown) => {
          const payload = data as DeviceConfigResponse
          const cfg = payload.config
          if (!cfg) return

          const { ParkCapture, ParkingMonitor, MovieAudio, VolAdj, FirmwareVersion } = cfg

          if (ParkCapture != null && String(ParkCapture) !== '') {
            setParkingCapture(toEnableDisable(ParkCapture))
          }
          if (ParkingMonitor != null && String(ParkingMonitor) !== '') {
            setParkingMonitor(toEnableDisable(ParkingMonitor))
          }
          if (MovieAudio != null && String(MovieAudio) !== '') {
            // MovieAudio=ON 表示有声音；「静音录像」开关 checked=isMuted，故为关
            const audioOn = String(MovieAudio).toUpperCase() === 'ON'
            setIsMuted(!audioOn)
          }
          if (VolAdj != null) {
            const n =
              typeof VolAdj === 'number' ? VolAdj : parseInt(String(VolAdj), 10)
            if (!Number.isNaN(n)) setVolume(Math.min(10, Math.max(0, n)))
          }
          if (FirmwareVersion != null && String(FirmwareVersion) !== '') {
            setVersion(String(FirmwareVersion))
          }
        }

        let configPayload: unknown = null
        for (let attempt = 0; attempt < CLOUD_CONFIG_POLL_MAX_ATTEMPTS; attempt++) {
          if (cloudConfigPollCancelledRef.current) return
          const res = await CloudAPI.getDeviceConfig({ device_id: cloudDeviceId })
          if (res?.response_status?.code !== SuccessCode) {
            Taro.showToast({
              title: res?.response_status?.msg || '获取配置失败',
              icon: 'none'
            })
            return
          }
          const currentMtime = extractConfigMtime(res.data)
          const baseNorm = baselineMtime == null ? '' : String(baselineMtime)
          const curNorm = currentMtime == null ? '' : String(currentMtime)
          if (curNorm !== '' && curNorm !== baseNorm) {
            configPayload = res.data
            break
          }
          if (attempt < CLOUD_CONFIG_POLL_MAX_ATTEMPTS - 1) {
            await sleep(CLOUD_CONFIG_POLL_INTERVAL_MS)
          }
        }

        if (configPayload === null) {
          if (cloudConfigPollCancelledRef.current) return
          Taro.showToast({
            title: '等待配置更新超时，请确认记录仪已开机/通电后重试',
            icon: 'none'
          })
          return
        }

        if (cloudConfigPollCancelledRef.current) return

        applyCfg(configPayload)
      } catch (e) {
        console.error(e)
        Taro.showToast({ title: '获取设备配置失败', icon: 'none' })
      } finally {
        if (!opts?.silent) setCloudLoading(false)
      }
    },
    [cloudDeviceId]
  )

  const sendCloudCommand = useCallback(
    async (cmd: string, value?: string) => {
      if (!cloudDeviceId) return false
      const res = await CloudAPI.sendDeviceCommand({
        device_id: cloudDeviceId,
        cmd,
        value
      })
      if (res?.response_status?.code === SuccessCode) {
        await loadCloudDeviceConfig({ silent: true })
        return true
      }
      Taro.showToast({
        title: res?.response_status?.msg || '操作失败',
        icon: 'none'
      })
      return false
    },
    [cloudDeviceId, loadCloudDeviceConfig]
  )

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
    if (isCloudMode && cloudDeviceId) {
      if (!value) {
        const ok = await sendCloudCommand('movie_audio', 'on')
        if (ok) {
          Taro.showToast({ title: '已关闭静音', icon: 'success' })
        }
        return
      }
      try {
        const firstConfirm = await Taro.showModal({
          title: '重要提示',
          content:
            '开启静音录像会影响交警的责任区分和判断，可能导致事故责任认定困难。是否继续？',
          confirmText: '继续',
          cancelText: '取消',
          cancelColor: '#ff4d4f'
        })
        if (!firstConfirm.confirm) return
        const secondConfirm = await Taro.showModal({
          title: '再次确认',
          content:
            '开启静音录像还会影响事故救援，无法通过事故声音判断事故严重程度。确定要开启静音吗？',
          confirmText: '确定开启',
          cancelText: '取消',
          cancelColor: '#ff4d4f'
        })
        if (!secondConfirm.confirm) return
        const ok = await sendCloudCommand('movie_audio', 'off')
        if (ok) {
          Taro.showToast({ title: '已开启静音', icon: 'success' })
        }
      } catch (error) {
        console.error('显示确认弹窗失败:', error)
      }
      return
    }

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
    if (isCloudMode && cloudDeviceId) {
      const v = Math.min(10, Math.max(0, Math.round(Number(value))))
      void (async () => {
        const ok = await sendCloudCommand('volume', String(v))
        if (ok) {
          Taro.showToast({ title: '设置成功', icon: 'success' })
        }
      })()
      return
    }
    handleRequest({
      url: SettingAPI.setVolume(value),
      successMsg: '设置成功',
      errorMsg: '设置音量失败',
      onSuccess: () => setVolume(value)
    })
  }

  // 设置停车监控状态
  const handleParkingMonitorChange = (value: boolean) => {
    if (isCloudMode && cloudDeviceId) {
      void (async () => {
        const ok = await sendCloudCommand('parking_monitor', value ? 'on' : 'off')
        if (ok) {
          Taro.showToast({
            title: value ? '已开启停车监控' : '已关闭停车监控',
            icon: 'success'
          })
        }
      })()
      return
    }
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
    if (isCloudMode && cloudDeviceId) {
      void (async () => {
        const ok = await sendCloudCommand('park_capture', value ? 'on' : 'off')
        if (ok) {
          Taro.showToast({
            title: value ? '已开启停车拍照' : '已关闭停车拍照',
            icon: 'success'
          })
        }
      })()
      return
    }
    const parkingCaptureValue = value ? 'ENABLE' : 'DISABLE'
    handleRequest({
      url: SettingAPI.setParkingCapture(parkingCaptureValue),
      successMsg: value ? '已开启停车拍照' : '已关闭停车拍照',
      errorMsg: '切换停车拍照状态失败',
      onSuccess: () => setParkingCapture(parkingCaptureValue)
    })
  }

  useEffect(() => {
    if (isCloudMode && cloudDeviceId) {
      loadCloudDeviceConfig()
      return
    }
    fetchCameraInfo()
    fetchStorageInfo()
    fetchMenuInfo()
  }, [isCloudMode, cloudDeviceId, loadCloudDeviceConfig])

  if (isCloudMode && cloudLoading) {
    return (
      <View className="settings-page settings-page--cloud-loading">
        <Tips size={22} color="#d48806" className="settings-cloud-loading__icon" />
        <Loading type="spinner" className="settings-cloud-loading__spinner">
          同步中
        </Loading>
        <Text className="settings-cloud-loading__title">正在同步设备配置</Text>
        <Text className="settings-cloud-loading__hint">
          请保持记录仪开机或车辆通电。若设备未开机，云端无法下发指令，配置也不会更新，页面可能长时间停留在此处。
        </Text>
      </View>
    )
  }

  return (
    <View className="settings-page">

      {isCloudMode && (
        <View className="settings-cloud-tip">
          <Tips size={16} color="#d48806" />
          <Text className="settings-cloud-tip__text">
            云端设置需记录仪处于开机或车辆通电状态；关机时无法下发指令，配置也可能无法刷新。
          </Text>
        </View>
      )}

      {!isCloudMode && (
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
      )}

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

      {!isCloudMode && (
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
      )}


      <View className="section">
        <View className="section-header">
          <Power />
          <Text className="title">版本信息</Text>
        </View>
        <View className="version-item">
          <Text>当前固件版本</Text>
          <Text>{version}</Text>
        </View>
        {!isCloudMode && (
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
        )}
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