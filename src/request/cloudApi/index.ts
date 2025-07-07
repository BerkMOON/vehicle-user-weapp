import { ResponseInfoType } from "types/common"
import { getRequest, postRequest } from ".."
import { EmergencyVideoResponse, EmergencyVideosParmas, PhotoInfo } from "./typings"

const prefix = TARO_APP_API_BASE_URL + '/api/consumer/wx'

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
} 