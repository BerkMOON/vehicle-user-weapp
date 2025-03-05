export interface StorageInfo {
  total: string
  used: string
  free: string
  usedPercentage: number
}

export interface CameraStatus {
  mode: string
  record: string
  movieAudio: string
}

export interface PickInfo {
  value: string
  text: string
}

export const GSENSOR_LEVELS: PickInfo[] = [
  { value: 'OFF', text: '关闭' },
  { value: 'LEVEL0', text: '低' },
  { value: 'LEVEL2', text: '中' },
  { value: 'LEVEL4', text: '高' }
]

export const VIDEO_RESOLUTIONS: PickInfo[] = [
  { value: '1080P30', text: '1080P' },
  { value: '720P30', text: '720P' }
]

export const RECORDING_DURATIONS: PickInfo[] = [
  { value: '1MIN', text: '1分钟' },
  { value: '2MIN', text: '2分钟' },
  { value: '3MIN', text: '3分钟' }
] 

export const PARKING_MONITOR: PickInfo[] = [
  { value: 'ENABLE', text: '开启' },
  { value: 'DISABLE', text: '关闭' }
]