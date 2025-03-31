import { useEffect } from 'react'
import { useUserStore } from '@/store/user'
import { UserAPI } from '@/request/useApi'
import { generateNonce, generateSignature, getSecondTimestamp } from '@/utils/utils'
import Taro from '@tarojs/taro'

let isInitialized = false
let isLoginRetrying = false  // 添加重试标记

export const useAuth = () => {
  const { setUserInfo, setLoginStatus } = useUserStore()  // 添加 setLoginStatus

  const handleWxLogin = async () => {
    if (isLoginRetrying) return
    try {
      isLoginRetrying = true
      setLoginStatus('pending')  // 设置登录状态为处理中
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
      isLoginRetrying = false
      await checkLoginStatus()
    } catch (error) {
      isLoginRetrying = false
      setLoginStatus('error')  // 设置登录状态为错误
      console.error('登录失败：', error)
      Taro.showToast({
        title: '登录失败，请稍后重试',
        icon: 'none'
      })
    }
  }

  const checkLoginStatus = async () => {
    if (isLoginRetrying) return
    try {
      const response = await UserAPI.getUserInfo()
      if (response) {
        const userInfo = response.data
        setUserInfo({
          phone: userInfo.phone,
          openId: userInfo.open_id
        })
        setLoginStatus('success')  // 设置登录状态为成功
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