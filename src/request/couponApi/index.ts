import { ResponseInfoType } from "types/common"
import { getRequest } from ".."
import { CouponInfo, CouponInfoList, CouponParams } from "./typings"

const prefix = TARO_APP_API_BASE_URL + '/api/consumer/wx'

export const CouponAPI = {
  getCouponList: (params: CouponParams) => getRequest<ResponseInfoType<CouponInfoList>>({
    url: `${prefix}/getCouponList`,
    params
  }),

  getCouponDetail: (id: number) => getRequest<ResponseInfoType<CouponInfo>>({
    url: `${prefix}/getCouponDetail`,
    params: {
      id
    }
  })
} 