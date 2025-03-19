import { create } from 'zustand'
import Taro from '@tarojs/taro'

const STORAGE_KEY = 'USER_INFO'

interface UserInfo {
  phone: string
  openId: string
}

interface UserState {
  userInfo: UserInfo
  isLogin: boolean
  setUserInfo: (info: UserInfo) => void
  clearUserInfo: () => void
  initializeFromStorage: () => Promise<void>
  setLoginStatus: (status: boolean) => void  // 新增方法
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
  },
  isLogin: false,

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
        openId: ''
      },
      isLogin: false
    })
    Taro.removeStorage({ key: STORAGE_KEY })
  },

  setLoginStatus: (status) => {
    set((state) => ({
      isLogin: status,
      userInfo: {
        ...state.userInfo,
        isLogin: status
      }
    }))
  },
}))