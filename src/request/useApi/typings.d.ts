export interface LoginParams {
  code: string;
  nonce: string;
  timestamp: number;
  signature: string;
}

export interface UserInfo {
  open_id: string;
  phone: string;
  device_info: SystemInfo
}

export interface SystemInfo {
  brand?: string
  model?: string
  platform?: string
  system?: string
}

export interface InstructionParams {
  needSynopsisPdf: boolean,
  needSynopsisVideo: boolean
}

export enum FileType {
  SynopsisPdf = 'synopsis_pdf',
  SynopsisVideo = 'synopsis_video',
}

export interface InstructionResponse {
  item_list: {
    url: string;
    file_type: FileType;
  }[]
}