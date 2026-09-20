import Taro from '@tarojs/taro'
import { APP_DOWNLOAD_URL } from '@/utils/membership'

export const APP_PROMO_TITLE = '易达安 App 已上线'
export const APP_PROMO_DESC =
  '推荐下载 App 使用：设备兼容更好，连接更稳定，iOS 观看行车视频也更流畅。部分手机在小程序内连接设备失败时，用 App 可避免兼容问题。'

/** 引导下载 App：弹窗说明 + 复制官网下载链接 */
export function promptDownloadApp(options?: { title?: string; content?: string }) {
  Taro.showModal({
    title: options?.title || APP_PROMO_TITLE,
    content:
      options?.content ||
      `${APP_PROMO_DESC}\n\n点击「复制链接」后，用手机浏览器打开即可下载。`,
    confirmText: '复制链接',
    cancelText: '稍后再说',
    success: (res) => {
      if (!res.confirm) return
      Taro.setClipboardData({
        data: APP_DOWNLOAD_URL,
        success: () => {
          Taro.showToast({
            title: '链接已复制，请用浏览器打开',
            icon: 'none',
            duration: 2500
          })
        }
      })
    }
  })
}
