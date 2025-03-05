import { create } from 'zustand'
import { DownloadItem } from '@/pages/recorder/types'
import Taro from '@tarojs/taro'

const STORAGE_KEY = 'DOWNLOAD_HISTORY'

interface DownloadState {
  downloadList: DownloadItem[]
  downloadTasks: { [key: string]: Taro.DownloadTask }
  addDownloadItem: (item: DownloadItem) => void
  updateDownloadProgress: (name: string, progress: number) => void
  updateDownloadStatus: (name: string, status: DownloadItem['status']) => void
  updateTempFilePath: (name: string, tempFilePath: string) => void
  updateSavedPath: (name: string, savedPath: string) => void
  setDownloadTask: (name: string, task: Taro.DownloadTask) => void
  removeDownloadTask: (name: string) => void
  removeDownloadItem: (name: string) => void
  initializeFromStorage: () => Promise<void>  // 新增
}

// 从存储中读取数据
const loadFromStorage = async (): Promise<DownloadItem[]> => {
  try {
    const storage = await Taro.getStorage({ key: STORAGE_KEY })
    return storage.data || []
  } catch {
    return []
  }
}

// 保存数据到存储
const saveToStorage = async (downloadList: DownloadItem[]) => {
  // 只保存已完成的下载记录
  const completedDownloads = downloadList.filter(
    item => item.status === 'success' && item.savedPath
  )
  await Taro.setStorage({
    key: STORAGE_KEY,
    data: completedDownloads
  })
}

export const useDownloadStore = create<DownloadState>((set, get) => ({
  downloadList: [],
  downloadTasks: {},

  // 初始化方法
  initializeFromStorage: async () => {
    const savedDownloads = await loadFromStorage()
    set({ downloadList: savedDownloads })
  },

  addDownloadItem: (item) => set((state) => {
    const newList = [...state.downloadList, item]
    return { downloadList: newList }
  }),

  updateDownloadProgress: (name, progress) => set((state) => {
    const newList = state.downloadList.map(item =>
      item.name === name ? { ...item, progress } : item
    )
    return { downloadList: newList }
  }),

  updateDownloadStatus: (name, status) => set((state) => {
    const newList = state.downloadList.map(item =>
      item.name === name ? { ...item, status } : item
    )
    saveToStorage(newList) // 状态更新时保存
    return { downloadList: newList }
  }),

  updateTempFilePath: (name, tempFilePath) => set((state) => {
    const newList = state.downloadList.map(item =>
      item.name === name ? { ...item, tempFilePath } : item
    )
    return { downloadList: newList }
  }),

  updateSavedPath: (name, savedPath) => set((state) => {
    const newList = state.downloadList.map(item =>
      item.name === name ? { ...item, savedPath } : item
    )
    saveToStorage(newList) // 保存路径更新时保存
    return { downloadList: newList }
  }),

  setDownloadTask: (name, task) => set((state) => ({
    downloadTasks: { ...state.downloadTasks, [name]: task }
  })),

  removeDownloadTask: (name) => set((state) => {
    const newTasks = { ...state.downloadTasks }
    delete newTasks[name]
    return { downloadTasks: newTasks }
  }),

  removeDownloadItem: (name) => set((state) => {
    const newList = state.downloadList.filter(item => item.name !== name)
    saveToStorage(newList) // 删除项目时保存
    return { downloadList: newList }
  })
}))