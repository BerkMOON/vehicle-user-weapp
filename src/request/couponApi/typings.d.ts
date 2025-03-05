import { PageInfo } from "types/common"


export interface CouponParams {
  id?: number // 优惠券id
  batch_no?: string // 批次号
  status?: string // 状态
  openId?: string // 用户openid
  page?: number
  limit?: number
}

export interface CouponInfo {
  id: number // 优惠券id
  batch_no: string // 批次号
  openId: string // 用户openid
  status: {
    code: CouponStatus,
    name: string
  } // 状态
  type: CouponType // 优惠券类型
  rule: string // 规则
  valid_start: string // 有效期开始时间
  valid_end: string // 有效期结束时间
}

export interface CouponInfoList {
  list: CouponInfo[]
  meta: PageInfo
}

export enum CouponStatus {
  UNUSED = 2,
  USED = 3,
  EXPIRED = 4
}

export enum CouponBatchStatus {
  AUDITING = 1,
  AUDITED = 2,
  REJECTED = 3
}

export enum CouponType {
  Cash = 1,
  Maintenance = 2,
  Insurance = 3,
  Physical = 4
}