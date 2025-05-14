import { ResponseInfoType } from "types/common"
import { getRequest, postRequest } from ".."
import {
  BindParams,
  DeviceList,
  ParkingList
} from './typings.d'

const prefix = TARO_APP_API_BASE_URL + '/api/consumer/device'

export const DeviceAPI = {
  /**
   * 设备绑定
   * POST /api/consumer/device/bind
   * 接口ID：273550250
   * 接口地址：https://app.apifox.com/link/project/5846841/apis/api-273550250
   */
  bind: (params: BindParams) => postRequest<ResponseInfoType<null>>({
    url: `${prefix}/bind`,
    params
  }),

  /**
   * 绑定设备列表
   * GET /api/consumer/device/list
   * 接口ID：273624109
   * 接口地址：https://app.apifox.com/link/project/5846841/apis/api-273624109
   */
  list: () => getRequest<ResponseInfoType<DeviceList>>({
    url: `${prefix}/list`,
  }),

  /**
   * 设备解绑
   * POST /api/consumer/device/unbind
   * 接口ID：273625968
   * 接口地址：https://app.apifox.com/link/project/5846841/apis/api-273625968
   */
  unbind: (sn: string) => postRequest<ResponseInfoType<null>>({
    url: `${prefix}/unbind`,
    params: {
      sn
    }
  }),


  /**
   * 停车监控列表
   * GET  /api/consumer/device/listParkingMonitors
   * 接口ID：295241762
   * 接口地址：https://app.apifox.com/link/project/5846841/apis/api-295241762
   */

  parkList: (params) => getRequest<ResponseInfoType<ParkingList>>({
    url: `${prefix}/listParkingMonitors`,
    params
  })
}
