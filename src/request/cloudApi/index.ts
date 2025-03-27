import { ResponseInfoType } from "types/common"
import { getRequest } from ".."
import { PhotoInfo } from "./typings"

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
} 