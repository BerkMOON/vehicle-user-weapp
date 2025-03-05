export interface LoginParams {
  code: string;
  nonce: string;
  timestamp: number;
  signature: string;
}

export interface UserInfo {
  open_id: string;
  phone: string;
}

