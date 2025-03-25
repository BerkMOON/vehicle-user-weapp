import { useEffect } from 'react'
import { useUserStore } from '@/store/user'
import { UserAPI } from '@/request/useApi'
import { generateNonce, generateSignature, getSecondTimestamp } from '@/utils/utils'
import Taro from '@tarojs/taro'

let isInitialized = false
let isLoginRetrying = false  // 添加重试标记

export const useAuth = () => {
  const { setLoginStatus, setUserInfo } = useUserStore()

  const handleWxLogin = async () => {
    if (isLoginRetrying) return  // 如果正在重试则直接返回
    try {
      isLoginRetrying = true  // 设置重试标记
      const { code } = await Taro.login()
      const nonce = await generateNonce() as string
      const timestamp = getSecondTimestamp()
      const signature = await generateSignature({ code, nonce, timestamp })

      const response = await UserAPI.login({
        code,
        nonce,
        signature,
        timestamp,
      })

      if (response?.header['Set-Cookie']) {
        Taro.setStorageSync('cookies', response?.header['Set-Cookie'])
      }
      isLoginRetrying = false  // 重置重试标记
      await checkLoginStatus()
    } catch (error) {
      isLoginRetrying = false  // 重置重试标记
      console.error('登录失败：', error)
      Taro.showToast({
        title: '登录失败，请稍后重试',
        icon: 'none'
      })
    }
  }

  const checkLoginStatus = async () => {
    if (isLoginRetrying) return  // 如果正在重试则直接返回
    Taro.showLoading({
      title: '检查登录中',
    })
    try {
      const response = await UserAPI.getUserInfo()
      if (response) {
        const userInfo = response.data
        setLoginStatus(!!userInfo.phone)
        setUserInfo({
          phone: userInfo.phone,
          openId: userInfo.open_id
        })
        Taro.hideLoading()
      }
    } catch (error) {
      console.error('获取用户信息失败：', error)
      await handleWxLogin()
      Taro.hideLoading()
    }
  }

  const handleGetPhoneNumber = async (code: string) => {
    await UserAPI.setPhone({ code })
    await checkLoginStatus()
  }

  useEffect(() => {
    if (!isInitialized) {
      checkLoginStatus()
      isInitialized = true
    }
  }, [])

  return {
    handleGetPhoneNumber
  }
}