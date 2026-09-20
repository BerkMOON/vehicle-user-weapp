import { useEffect } from 'react'
import { useUserStore } from '@/store/user'
import { useMembershipStore } from '@/store/membership'
import { UserAPI } from '@/request/useApi'
import { generateNonce, generateSignature, getSecondTimestamp } from '@/utils/utils'
import Taro from '@tarojs/taro'
import { SuccessCode } from '@/constants/constants'

let isInitialized = false
let isLoginRetrying = false  // 添加重试标记

export const useAuth = () => {
  const { setUserInfo, setLoginStatus, userInfo } = useUserStore()
  const setMembershipFromSelfInfo = useMembershipStore((s) => s.setFromSelfInfo)
  const clearMembership = useMembershipStore((s) => s.clear)

  const handleWxLogin = async () => {
    if (isLoginRetrying) return
    try {
      isLoginRetrying = true
      setLoginStatus('pending')
      const { code } = await Taro.login()
      const nonce = generateNonce()
      const timestamp = getSecondTimestamp()
      const signature = await generateSignature({ code, nonce, timestamp })

      const response = await UserAPI.login({
        code,
        nonce,
        signature,
        timestamp,
      })
      if (response?.data.response_status.code !== SuccessCode) {
        setLoginStatus('error')
        Taro.showToast({
          title: '登录失败，请稍后重试',
          icon: 'none'
        })
        return
      }

      if (response?.header['Set-Cookie']) {
        Taro.setStorageSync('cookies', response?.header['Set-Cookie'])
      }
      // 先释放标记，否则 checkLoginStatus 会因 isLoginRetrying 直接 return
      isLoginRetrying = false
      await checkLoginStatus()
    } catch (error) {
      setLoginStatus('error')
      console.error('登录失败：', error)
      Taro.showToast({
        title: '登录失败，请稍后重试',
        icon: 'none'
      })
    } finally {
      isLoginRetrying = false
    }
  }

  const checkLoginStatus = async () => {
    if (isLoginRetrying) return
    try {
      const response = await UserAPI.getUserInfo()
      if (response?.response_status.code === SuccessCode) {
        const info = response.data
        setUserInfo({
          phone: info?.phone,
          openId: info?.open_id,
          deviceInfo: info?.device_info
        })
        setMembershipFromSelfInfo(info?.membership, info?.phone)
        setLoginStatus('success')
      } else {
        clearMembership()
        await handleWxLogin()
      }
    } catch (error) {
      console.error('获取用户信息失败：', error)
      clearMembership()
      await handleWxLogin()
    }
  }

  const handleGetPhoneNumber = async (code: string) => {
    await UserAPI.setPhone({ code })
    await checkLoginStatus()
  }

  const handleSetDeviceInfo = async () => {
    const { platform, system, brand, model } = Taro.getDeviceInfo()
    if (!userInfo?.deviceInfo || (userInfo.deviceInfo?.model !== model)) {
      await UserAPI.setDeviceInfo({
        platform,
        system,
        brand,
        model
      })
    }
  }

  useEffect(() => {
    if (!isInitialized) {
      checkLoginStatus()
      isInitialized = true
    }
  }, [])

  return {
    handleGetPhoneNumber,
    handleSetDeviceInfo
  }
}