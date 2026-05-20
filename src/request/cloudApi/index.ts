import { ResponseInfoType } from "types/common"
import { getRequest, postRequest } from ".."
import { CycleVideoListParmas, CycleVideoListResponse, DeviceConfigResponse, EmergencyVideoResponse, EmergencyVideosParmas, PhotoInfo, SendDeviceCommandParams } from "./typings"

const prefix = TARO_APP_API_BASE_URL + '/api/consumer/wx'
const deviceConsumerPrefix = TARO_APP_API_BASE_URL + '/api/consumer/device'

export const CloudAPI = {

  /**
   *  获取用户信息
   *  GET /api/consumer/wx/getSelfInfo
   *  接口ID：259941820
   *  接口地址：https://app.apifox.com/link/project/5846841/apis/api-259941820
   */
  getCloudPhoto: ({ nextToken, limit, deviceId, type, date }) => getRequest<ResponseInfoType<PhotoInfo>>({
    url: `${prefix}/getCloudPhotos`,
    params: {
      date,
      nextToken,
      limit,
      deviceId,
      type
    }
  }),

  /**
 *  获取用户信息
 *  GET /api/consumer/wx/getSelfInfo
 *  接口ID：259941820
 *  接口地址：https://app.apifox.com/link/project/5846841/apis/api-259941820
 */
  getCloudFolders: ({ deviceId, type }) => getRequest<ResponseInfoType<string[]>>({
    url: `${prefix}/getCloudFolders`,
    params: {
      deviceId,
      type
    }
  }),

  /**
   * 紧急视频列表
   * GET /api/consumer/wx/getEmergencyVideos
   * 接口ID：318308620
   * 接口地址：https://app.apifox.com/link/project/5846841/apis/api-318308620
   */
  getEmergencyVideos: (params: EmergencyVideosParmas) => getRequest<ResponseInfoType<EmergencyVideoResponse>>({
    url: `${prefix}/getEmergencyVideos`,
    params
  }),

  /**
   * 紧急视频删除
   * POST /api/consumer/wx/delEmergencyVideo
   * 接口ID：318309411
   * 接口地址：https://app.apifox.com/link/project/5846841/apis/api-318309411
   */
  delEmergencyVideo: ({ device_id, id }) => postRequest<ResponseInfoType<null>>({
    url: `${prefix}/delEmergencyVideo`,
    params: {
      device_id,
      id
    }
  }),

  /**
  oss文件删除
  POST /api/consumer/wx/delCloudObject
  接口ID：362456769
  接口地址：https://app.apifox.com/link/project/5846841/apis/api-362456769  
   */
  delCloudObject: ({ device_id, path }) => postRequest<ResponseInfoType<null>>({
    url: `${prefix}/delCloudObject`,
    params: {
      path,
      device_id
    }
  }),

  /**
   * 获取循环视频列表
  GET /api/consumer/wx/getCycleVideoList
  接口ID：455539886
  接口地址：https://app.apifox.com/link/project/5846841/apis/api-455539886
  */
  getCycleVideoList: (params: CycleVideoListParmas) => getRequest<ResponseInfoType<CycleVideoListResponse>>({
    url: `${prefix}/getCycleVideoList`,
    params
  }),

  /**
   * 设备指令下发
   * POST /api/consumer/device/command
   * 接口ID：458269286
   * 接口地址：https://app.apifox.com/link/project/5846841/apis/api-458269286
   */
  sendDeviceCommand: (params: SendDeviceCommandParams) =>
    postRequest<ResponseInfoType<null>>({
      url: `${deviceConsumerPrefix}/command`,
      params
    }),

  /**
   * 查询设备配置信息
   * GET /api/consumer/device/config
   * 接口ID：458271484
   * 接口地址：https://app.apifox.com/link/project/5846841/apis/api-458271484
  */
  getDeviceConfig: (params: { device_id: string }) =>
    getRequest<ResponseInfoType<DeviceConfigResponse>>({
      url: `${deviceConsumerPrefix}/config`,
      params
    }),
} 