import { create } from 'zustand'
import Taro from '@tarojs/taro'
import { SystemInfo } from '@/request/useApi/typings'

const STORAGE_KEY = 'USER_INFO'

interface UserInfo {
  phone: string
  openId: string
  deviceInfo?: SystemInfo
}

interface UserState {
  userInfo: UserInfo
  isLogin: boolean
  loginStatus: 'pending' | 'success' | 'error'
  setUserInfo: (info: UserInfo) => void
  setLoginStatus: (status: 'pending' |'success' | 'error') => void
  clearUserInfo: () => void
  initializeFromStorage: () => Promise<void>
}

// 从存储中读取数据
const loadFromStorage = async (): Promise<UserInfo | null> => {
  try {
    const storage = await Taro.getStorage({ key: STORAGE_KEY })
    return storage.data
  } catch {
    return null
  }
}

// 保存数据到存储
const saveToStorage = async (userInfo: UserInfo) => {
  await Taro.setStorage({
    key: STORAGE_KEY,
    data: userInfo
  })
}

export const useUserStore = create<UserState>((set) => ({
  userInfo: {
    phone: '',
    openId: '',
    deviceInfo: undefined
  },
  isLogin: false,
  loginStatus: 'pending',

  initializeFromStorage: async () => {
    const savedUserInfo = await loadFromStorage()
    if (savedUserInfo) {
      set({ 
        userInfo: savedUserInfo,
        isLogin: !!savedUserInfo.phone
      })
    }
  },

  setUserInfo: (info) => {
    set({ 
      userInfo: info,
      isLogin: !!info.phone
    })
    saveToStorage(info)
  },

  clearUserInfo: () => {
    set({ 
      userInfo: {
        phone: '',
        openId: '',
      },
      isLogin: false
    })
    Taro.removeStorage({ key: STORAGE_KEY })
  },

  setLoginStatus: (status) => set({ loginStatus: status }),
}))