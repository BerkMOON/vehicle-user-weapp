import { CouponType } from "@/request/couponApi/typings.d"

export const BASE_URL = 'http://192.168.1.1'
export const REQUEST_URL = 'https://eda-mini.ai-kaka.com'

export const COUPON_TYPES = [
  { label: '现金券', value: CouponType.Cash },
  { label: '保养券', value: CouponType.Maintenance },
  { label: '续保券', value: CouponType.Insurance },
  { label: '实物券', value: CouponType.Physical },
]