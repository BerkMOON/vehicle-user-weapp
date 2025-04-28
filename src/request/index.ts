import Taro from "@tarojs/taro"

interface RequestConfig {
  url: string
  successMsg?: string
  errorMsg?: string
  needErrorTip?: boolean
  onSuccess?: (data: any) => void
  onError?: (error: any) => void
}


// API 请求统一处理函数
export const handleRequest = async (config: RequestConfig) => {
  const { url, successMsg, errorMsg, onSuccess, onError, needErrorTip = true } = config
  try {
    const res = await Taro.request({
      url,
      method: 'GET'
    })

    if (res.statusCode === 200) {
      onSuccess?.(res.data)
      if (successMsg) {
        Taro.showToast({
          title: successMsg,
          icon: 'success'
        })
      }
    }
  } catch (error) {
    console.error(errorMsg, error)
    if (!needErrorTip) {
      Taro.showToast({
        title: errorMsg || '操作失败',
        icon: 'none'
      })
    }
    onError?.(error)
  }
}

export const getRequest = async <T>(config: any): Promise<T | null>  => {
  const { url, params } = config
  try {
    const cookie = Taro.getStorageSync('cookies')
    const res = await Taro.request({
      url,
      method: 'GET',
      data: params,
      header: {
        cookie: cookie || ''
      }
    })

    return res.data as T
  } catch (error) {
    Taro.showToast({
      title: '接口错误',
      icon: 'none'
    })
    return null
  }
}

export const postRequest = async <T>(config: any): Promise<T | null> => {
  const { url, params } = config
  try {
    const cookie = Taro.getStorageSync('cookies')
    const res = await Taro.request({
      url,
      method: 'POST',
      data: params,
      header: {
        cookie: cookie || ''
      }
    })
    return res.data as T
  } catch (error) {
    Taro.showToast({
      title: '接口错误',
      icon: 'none'
    })
    return null
  }
}