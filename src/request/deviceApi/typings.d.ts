import { PageInfo } from "types/common";

export interface BindParams {
  sn: string;
  vin: string;
}

export interface DeviceInfo {
  device_id: string;
  sn: string;
  vin: string;
  phone: string;
  /** 云端能力：为 true 时可不连 WiFi 用云相册/云端设置；连上记录仪 WiFi 后仍可走本机查看与完整设置 */
  is_cloud_ver?: boolean;
  status: {
    code: number;
    name: string;
  }
}

export interface DeviceList {
  device_list: DeviceInfo[];
  meta: PageInfo
}

export interface ParkingList {
  meta: PageInfo;
  sn: string;
  device_id: string;
  record_list: ParkingInfo[];
}

export interface ParkingInfo {
  occur_time: string;
  lng: number;
  lat: number;
  sn?: string;
  deviceId?: string;
}