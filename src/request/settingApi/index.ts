import { getRequestUrl } from "@/utils/utils";

export const SettingAPI = {
  // 获取存储信息
  getStorageInfo: () => getRequestUrl({
    action: 'get',
    property: 'Camera.Menu.CardInfo.*',
  }),

  // 获取相机状态
  getCameraInfo: () => getRequestUrl({
    action: 'get',
    property: 'Camera.Preview.MJPEG.status.*',
  }),

  // 获取设备信息
  getMenuInfo: () => getRequestUrl({
    action: 'get',
    property: 'Camera.Menu.*',
  }),

  // 设置录像状态
  setRecording: (value: boolean) => getRequestUrl({
    action: 'set',
    property: 'Video',
    value: value ? 'record' : 'stop'
  }),

  // 设置静音状态
  setMute: (value: boolean) => getRequestUrl({
    action: 'set',
    property: 'MovieAudio',
    value: !value ? 'ON' : 'OFF'
  }),

  // 格式化存储
  formatStorage: () => getRequestUrl({
    action: 'set',
    property: 'SD0',
    value: 'format'
  }),

  // 恢复出厂设置
  factoryReset: () => getRequestUrl({
    action: 'set',
    property: 'FactoryReset',
    value: 'reset'
  }),

  // 拍照
  takePhoto: () => getRequestUrl({
    action: 'set',
    property: 'Video',
    value: 'capture'
  }),

  // 设置碰撞灵敏度
  setGSensorLevel: (value: string) => getRequestUrl({
    action: 'set',
    property: 'GSensor',
    value
  }),

  // 设置视频分辨率
  setVideoResolution: (value: string) => getRequestUrl({
    action: 'set',
    property: 'Videores',
    value
  }),

  // 设置扬声器音量
  setVolume: (value: number) => getRequestUrl({
    action: 'set',
    property: 'Camera.Menu.VolAdj',
    value: value.toString()
  }),

  // 获取录像时长
  getRecordingDuration: () => getRequestUrl({
    action: 'get',
    property: 'LoopingVideo'
  }),

  // 设置录像时长
  setRecordingDuration: (value: string) => getRequestUrl({
    action: 'set',
    property: 'LoopingVideo',
    value
  }),

  // 设置停车监控
  setParkingMonitor: (value: string) => getRequestUrl({
    action: 'set',
    property: 'ParkingMonitor',
    value
  }),

  // 设置停车拍照
  setParkingCapture: (value: string) => getRequestUrl({
    action: 'set',
    property: 'ParkCapture',
    value: value
  }),

  // 设置摄像头翻转状态
  setFlipSenor: (value: string) => getRequestUrl({
    action: 'set',
    property: 'Camera.Menu.Flip.Senor',
    value
  }),

  // 获取固件版本
  getFirmwareVersion: () => getRequestUrl({
    action: 'get',
    property: 'Camera.Menu.FWversion'
  }),
} 