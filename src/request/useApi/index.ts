import Taro from "@tarojs/taro"
import { LoginParams, SystemInfo, UserInfo } from "./typings"
import { ResponseInfoType } from "types/common"
import { getRequest, postRequest } from ".."

const prefix = TARO_APP_API_BASE_URL + '/api/consumer/wx'

export const UserAPI = {

  /**
   *  获取用户信息
   *  GET /api/consumer/wx/getSelfInfo
   *  接口ID：259941820
   *  接口地址：https://app.apifox.com/link/project/5846841/apis/api-259941820
   */
  getUserInfo: () => getRequest<ResponseInfoType<UserInfo>>({
    url: `${prefix}/getSelfInfo`,
  }),

  /**
   *  微信小程序登录
   *  POST /api/consumer/wx/login
   *  接口ID：259924536
   *  接口地址：https://app.apifox.com/link/project/5846841/apis/api-259924536
  */
  login: (params: LoginParams) => Taro.request<ResponseInfoType<null>>({
    url: `${prefix}/login`,
    method: 'POST',
    data: params,
  }),

  /**
   *  获取手机号
   *  POST /api/consumer/wx/getPhone
   *  接口ID：259939104
   *  接口地址：https://app.apifox.com/link/project/5846841/apis/api-259939104
   */
  setPhone: (params: { code: string }) => postRequest<ResponseInfoType<null>>({
    url: `${prefix}/getPhone`,
    params: params,
  }),

  /**
   * 上传手机设备信息
   * POST /api/consumer/wx/setDeviceInfo
   * 接口ID：289237686
   * 接口地址：https://app.apifox.com/link/project/5846841/apis/api-289237686
   * */
  setDeviceInfo: (params: SystemInfo) => postRequest<ResponseInfoType<null>>({
    url: `${prefix}/setDeviceInfo`,
    params,
  }),
} 