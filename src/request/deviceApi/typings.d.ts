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