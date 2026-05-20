import { PageInfo, Pagination } from "types/common";

export interface Photos {
  id: string;
  url: string;
  name: string;
  created_time: string
  size: number;
}

export interface PhotoInfo {
  photos: Photos[];
  next_token: string;
}

export interface EmergencyVideosParmas extends Pagination {
  device_id: string;
}

export interface EmergencyVideoInfo {
  create_time?: string;
  device_id?: string;
  id?: number;
  status?: {
    code: string;
    name: string;
  };
  trigger_time?: string;
  video_url?: string;
}

export interface EmergencyVideoResponse {
  record_list: EmergencyVideoInfo[]
  meta: PageInfo
}

export interface CycleVideoListParmas {
  date_str: string;
  device_id: string;
  marker?: string;
}

export interface CycleVideoListResponse {
  date_str?: string;
  device_id?: string;
  has_next?: boolean;
  item_list?: ItemList[];
  limit?: number;
  marker?: string;
}
export interface ItemList {
  first_frame_url?: string;
  last_modified?: string;
  size?: number;
  video_path?: string;
  video_url?: string;
}

/** 设备指令下发 POST /api/consumer/wx/sendDeviceCommand */
export interface SendDeviceCommandParams {
  device_id: string;
  /**
   * 停车拍照 park_capture，value on/off
   * 停车监控 parking_monitor，value on/off
   * 静音视频 movie_audio，value on/off
   * 扬声器音量 volume，value 0-10
   * 查询设备配置 get_device_status
   */
  cmd: string;
  /** 随 cmd 变化，见上 */
  value?: string;
}

export interface DeviceConfigResponse {
  config?: DeviceConfig;
  device_id?: string;
  mtime?: string;
}

export interface DeviceConfig {
  FirmwareVersion?: string;
  MovieAudio?: string;
  ParkCapture?: string;
  ParkingMonitor?: string;
  VolAdj?: number;
}