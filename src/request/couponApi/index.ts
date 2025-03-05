import { ResponseInfoType } from "types/common"
import { getRequest } from ".."
import { CouponInfoList, CouponParams } from "./typings"

const prefix = 'http://127.0.0.1:8990/api/consumer/wx'

export const CouponAPI = {
  getCouponList: (params: CouponParams) => getRequest<ResponseInfoType<CouponInfoList>>({
    url: `${prefix}/getCouponList`,
    params
  }),
} 