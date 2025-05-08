import { CouponType } from "@/request/couponApi/typings.d"

export const BASE_URL = 'http://192.168.1.1'

export const COUPON_TYPES = [
  { label: '现金券', value: CouponType.Cash },
  { label: '保养券', value: CouponType.Maintenance },
  { label: '续保券', value: CouponType.Insurance },
  { label: '实物券', value: CouponType.Physical },
]

export const SuccessCode = 200

export const Car_Brand_Options = [
  { value: '奥迪', text: '奥迪' },
  { value: '红旗', text: '红旗' },
  { value: '林肯', text: '林肯' },
  { value: '路虎捷豹', text: '路虎捷豹' },
  { value: '丰田', text: '丰田' },
]

export const Car_Options = {
  '红旗': [
    { value: 'H5', text: 'H5' },
    { value: 'H6', text: 'H6' },
    { value: 'H9', text: 'H9' },
    { value: 'HS5', text: 'HS5' },
    { value: 'HS3', text: 'HS3' },
    { value: 'HS7', text: 'HS7' },
    { value: 'EH7', text: 'EH7' },
    { value: 'HQ9', text: 'HQ9' },
    { value: 'EH7', text: 'EH7' },
    { value: 'EQM5', text: 'EQM5' },
    { value: '天工05', text: '天工05' },
    { value: '天工06', text: '天工06' },
    { value: '天工08', text: '天工08' },
  ],
  '林肯': [
    { value: '林肯Z', text: '林肯Z' },
    { value: '航海家', text: '航海家' },
    { value: '领航员', text: '领航员' },
    { value: '飞行家', text: '飞行家' },
    { value: '冒险家', text: '冒险家' },
    { value: '大陆', text: '大陆' },
    { value: 'MKC', text: 'MKC' },
    { value: 'MKX', text: 'MKX' },
    { value: 'MKZ', text: 'MKZ' },
  ],
  '路虎捷豹': [
    { value: '揽胜', text: '揽胜' },
    { value: '卫士110', text: '卫士110' },
    { value: '卫士90', text: '卫士90' },
    { value: '卫士130', text: '卫士130' },
    { value: '揽运', text: '揽运' },
    { value: '发现', text: '发现' },
    { value: '星脉', text: '星脉' },
    { value: 'F-PACE', text: 'F-PACE' },
    { value: '发现运动', text: '发现运动' },
    { value: '极光', text: '极光' },
    { value: 'XEL', text: 'XEL' },
    { value: 'XFL', text: 'XFL' },
    { value: 'E-PACE', text: 'E-PACE' },
  ],
  '丰田': [
    { value: '凯美瑞', text: '凯美瑞' },
    { value: '汉兰达', text: '汉兰达' },
    { value: '塞那', text: '塞那' },
    { value: '威兰达', text: '威兰达' },
    { value: '锋兰达', text: '锋兰达' },
    { value: '威飒', text: '威飒' },
    { value: '雷凌', text: '雷凌' },
    { value: '铂智3X', text: '铂智3X' },
    { value: 'CBU', text: 'CBU' },
  ],
  '奥迪': [
    { value: 'Q2L', text: 'Q2L' },
    { value: 'Q3', text: 'Q3' },
    { value: 'Q4', text: 'Q4' },
    { value: 'Q5L', text: 'Q5L' },
    { value: 'Q7', text: 'Q7' },
    { value: 'Q8', text: 'Q8' },
    { value: 'A3L', text: 'A3L' },
    { value: 'A3S', text: 'A3S' },
    { value: 'A4L', text: 'A4L' },
    { value: 'A5', text: 'A5' },
    { value: 'A6L', text: 'A6L' },
    { value: 'A7', text: 'A7' },
    { value: 'A8', text: 'A8' },
  ]
}