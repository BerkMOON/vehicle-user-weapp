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