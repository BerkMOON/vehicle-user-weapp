import Taro from "@tarojs/taro"
import { InstructionParams, InstructionResponse, LoginParams, SystemInfo, UserInfo } from "./typings"
import { ResponseInfoType } from "types/common"
import { getRequest, postRequest } from ".."

const prefix = TARO_APP_API_BASE_URL + '/api/consumer/wx'
const cloudPrefix = TARO_APP_API_BASE_URL + '/api/consumer/cloud'

export const UserAPI = {

  /**
   *  获取用户信息
   *  GET /api/consumer/wx/getSelfInfo
   */
  getUserInfo: () => getRequest<ResponseInfoType<UserInfo>>({
    url: `${prefix}/getSelfInfo`,
  }),

  /**
   *  微信小程序登录
   *  POST /api/consumer/wx/login
   */
  login: (params: LoginParams) => Taro.request<ResponseInfoType<null>>({
    url: `${prefix}/login`,
    method: 'POST',
    data: params,
  }),

  /**
   *  获取手机号
   *  POST /api/consumer/wx/getPhone
   */
  setPhone: (params: { code: string }) => postRequest<ResponseInfoType<null>>({
    url: `${prefix}/getPhone`,
    params: params,
  }),

  /**
   * 上传手机设备信息
   * POST /api/consumer/wx/setDeviceInfo
   */
  setDeviceInfo: (params: SystemInfo) => postRequest<ResponseInfoType<null>>({
    url: `${prefix}/setDeviceInfo`,
    params,
  }),

  /**
   * 获取用户说明
   * GET /api/consumer/cloud/static/getInstruction
   */
  getInstruction: (params: InstructionParams) => getRequest<ResponseInfoType<InstructionResponse>>({
    url: `${cloudPrefix}/static/getInstruction`,
    params,
  }),
} 