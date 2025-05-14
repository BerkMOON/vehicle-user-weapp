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