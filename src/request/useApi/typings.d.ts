export interface LoginParams {
  code: string;
  nonce: string;
  timestamp: number;
  signature: string;
}

/** getSelfInfo.membership.benefits */
export interface MembershipBenefits {
  parking_photo: boolean
  parking_monitor: boolean
  /** 0 无回看；1 滚动约 24 小时；>1 最近 N 个自然日 */
  cycle_video_days: number
}

export interface MembershipStatus {
  phone?: string
  product_code: string
  product_name?: string
  valid_from?: string
  valid_until?: string
  /** 1 有效，2 过期 */
  status: number
  is_active: boolean
  benefits?: MembershipBenefits
}

export interface UserInfo {
  open_id: string;
  phone: string;
  device_info: SystemInfo
  membership?: MembershipStatus | null
}

export interface SystemInfo {
  brand?: string
  model?: string
  platform?: string
  system?: string
}

export interface InstructionParams {
  needSynopsisPdf: boolean,
  needSynopsisVideo: boolean,
  system?: 'android' | 'ios' | 'huawei'
}

export enum FileType {
  SynopsisPdf = 'synopsis_pdf',
  SynopsisVideo = 'synopsis_video',
  instructionVideo = 'instruction_video',
}

export interface InstructionResponse {
  item_list: {
    url: string;
    file_type: FileType;
  }[]
}