import { getRequestUrl } from "@/utils/utils";

export const LiveAPI = {
  // 获取存储信息
  getPreviewInfo: () => getRequestUrl({
    action: 'get',
    property: 'Camera.Preview.*',
  }),
} 