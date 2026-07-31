import { ResponseInfoType } from "types/common"
import { getRequest, postRequest } from ".."
import { CycleVideoListParmas, CycleVideoListResponse, DeviceConfigResponse, EmergencyVideoResponse, EmergencyVideosParmas, PhotoInfo, SendDeviceCommandParams } from "./typings"

const prefix = TARO_APP_API_BASE_URL + '/api/consumer/cloud'
const deviceConsumerPrefix = TARO_APP_API_BASE_URL + '/api/consumer/device'

export const CloudAPI = {

  /**
   *  获取云相册照片
   *  GET /api/consumer/cloud/getCloudPhotos
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
   *  获取云相册文件夹
   *  GET /api/consumer/cloud/getCloudFolders
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
   * GET /api/consumer/cloud/getEmergencyVideos
   */
  getEmergencyVideos: (params: EmergencyVideosParmas) => getRequest<ResponseInfoType<EmergencyVideoResponse>>({
    url: `${prefix}/getEmergencyVideos`,
    params
  }),

  /**
   * 紧急视频删除
   * POST /api/consumer/cloud/delEmergencyVideo
   */
  delEmergencyVideo: ({ device_id, id }) => postRequest<ResponseInfoType<null>>({
    url: `${prefix}/delEmergencyVideo`,
    params: {
      device_id,
      id
    }
  }),

  /**
   * oss文件删除
   * POST /api/consumer/cloud/delCloudObject
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
   * GET /api/consumer/cloud/getCycleVideoList
   */
  getCycleVideoList: (params: CycleVideoListParmas) => getRequest<ResponseInfoType<CycleVideoListResponse>>({
    url: `${prefix}/getCycleVideoList`,
    params
  }),

  /**
   * 设备指令下发
   * POST /api/consumer/device/command
   */
  sendDeviceCommand: (params: SendDeviceCommandParams) =>
    postRequest<ResponseInfoType<null>>({
      url: `${deviceConsumerPrefix}/command`,
      params
    }),

  /**
   * 查询设备配置信息
   * GET /api/consumer/device/config
   */
  getDeviceConfig: (params: { device_id: string }) =>
    getRequest<ResponseInfoType<DeviceConfigResponse>>({
      url: `${deviceConsumerPrefix}/config`,
      params
    }),
}
