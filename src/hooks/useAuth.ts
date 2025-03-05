import { useEffect } from 'react'
import { useUserStore } from '@/store/user'
import { UserAPI } from '@/request/useApi'
import { generateNonce, generateSignature, getSecondTimestamp } from '@/utils/utils'
import Taro from '@tarojs/taro'

let isInitialized = false

export const useAuth = () => {
  const { setLoginStatus, setUserInfo } = useUserStore()

  const handleWxLogin = async () => {
    try {
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
    } catch (error) {
      console.error('登录失败：', error)
    }
  }

  const checkLoginStatus = async () => {
    try {
      const response = await UserAPI.getUserInfo()
      if (response) {
        const userInfo = response.data
        setLoginStatus(!!userInfo.phone)
        setUserInfo({
          phone: userInfo.phone,
          openId: userInfo.open_id
        })
      }
    } catch {
      handleWxLogin()
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