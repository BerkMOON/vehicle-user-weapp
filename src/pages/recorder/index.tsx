import { useState, useEffect } from 'react'
import { View, ScrollView, Text, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Tabs } from '@nutui/nutui-react-taro'
import { FileList } from './components/FileList/FileList'
import { DownloadList } from './components/DownloadList/DownloadList'
import { parseXML, formatFileSize, getThumbnailUrl } from '../../utils/utils'
import { TABS, PAGE_SIZE } from './constants'
import { FileGroup, FileItem, DownloadItem } from './types'
import './index.scss'
import { BASE_URL } from '../../constants/constants'
import { useDownloadStore } from '@/store/download'

function Recorder() {
  const {
    downloadList,
    downloadTasks,
    addDownloadItem,
    updateDownloadProgress,
    updateDownloadStatus,
    setDownloadTask,
    updateTempFilePath,
    removeDownloadTask,
    removeDownloadItem,
    updateSavedPath,
  } = useDownloadStore()

  const [activeTab, setActiveTab] = useState('photo')
  const [fileList, setFileList] = useState<{
    photo: FileGroup[],
    Event: FileGroup[],
    DCIM: FileGroup[],
    download: FileGroup[],
  }>({
    photo: [],
    Event: [],
    DCIM: [],
    download: []
  })
  const [pageFrom, setPageFrom] = useState<{
    photo: number,
    Event: number,
    DCIM: number,
    download: number,
  }>({
    photo: 0,
    Event: 0,
    DCIM: 0,
    download: 0
  })
  const [hasMore, setHasMore] = useState<{
    photo: boolean,
    Event: boolean,
    DCIM: boolean,
    download: boolean,
  }>({
    photo: true,
    Event: true,
    DCIM: true,
    download: true
  })
  const [loading, setLoading] = useState(false)
  const [isSelectMode, setIsSelectMode] = useState(false)

  // 获取文件列表
  const fetchFileList = async (isRefresh = false) => {
    try {
      setLoading(true)
      const from = isRefresh ? 0 : pageFrom[activeTab]
      const res = await Taro.request({
        url: `${BASE_URL}/cgi-bin/Config.cgi?action=dir&property=${activeTab}&format=${activeTab === 'photo' ? 'all': 'mp4'}&count=${PAGE_SIZE}&from=${from}`,
        method: 'GET',
      })

      if (res.statusCode === 200) {
        const files = parseXML(res.data)
        setHasMore(prev => ({
          ...prev,
          [activeTab]: files.length === PAGE_SIZE
        }))

        const groupedFiles: { [key: string]: FileItem[] } = {}

        if (!isRefresh) {
          fileList[activeTab].forEach(group => {
            groupedFiles[group.date] = [...group.files]
          })
        }

        files.forEach(file => {
          const [date, time] = file.time.split(' ')
          const sizeInBytes = parseInt(file.size)

          const fileItem: FileItem = {
            time,
            size: formatFileSize(sizeInBytes),
            url: `${BASE_URL}${file.name}`,
            thumbnail: getThumbnailUrl(file.name),
            selected: false,
            name: file.name,
            format: file.format
          }

          if (!groupedFiles[date]) {
            groupedFiles[date] = []
          }
          groupedFiles[date].push(fileItem)
        })

        const formattedData: FileGroup[] = Object.entries(groupedFiles).map(([date, files]) => ({
          date,
          files
        }))

        formattedData.sort((a, b) => b.date.localeCompare(a.date))

        setFileList(prev => ({
          ...prev,
          [activeTab]: isRefresh ? formattedData : [...formattedData]
        }))

        setPageFrom(prev => ({
          ...prev,
          [activeTab]: from + PAGE_SIZE
        }))
      }
    } catch (error) {
      console.error('获取文件列表错误:', error)
      Taro.showToast({
        title: '网络错误，请重试',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }

  // 获取选中的文件
  const getSelectedFiles = () => {
    const selected: FileItem[] = []
    fileList[activeTab].forEach(group => {
      group.files.forEach(file => {
        if (file.selected) {
          selected.push(file)
        }
      })
    })
    return selected
  }

  // 处理文件选择
  const handleFileSelect = (groupIndex: number, fileIndex: number) => {
    if (!isSelectMode) return

    const newList = [...fileList[activeTab]]
    newList[groupIndex].files[fileIndex].selected = !newList[groupIndex].files[fileIndex].selected
    setFileList(prev => ({
      ...prev,
      [activeTab]: newList
    }))
  }

  // 处理文件点击
  const handleFileClick = (file: FileItem) => {
    if (isSelectMode) return

    if (file.format.toLowerCase() === 'mp4') {
      Taro.navigateTo({
        url: `/pages/video-player/index?videoUrl=${file.url}`
      })
    }
  }

  // 处理下载
  const handleDownload = async () => {
    const selectedFiles = getSelectedFiles()
    if (selectedFiles.length === 0) {
      Taro.showToast({
        title: '请选择要保存的文件',
        icon: 'none'
      })
      return
    }

    // 添加文件到下载列表
    selectedFiles.forEach(file => {
      const downloadItem = {
        ...file,
        progress: 0,
        status: 'downloading' as const
      }
      addDownloadItem(downloadItem)
      startDownload(downloadItem)
    })

    setActiveTab('download')
    setIsSelectMode(false)
  }

  // 开始下载单个文件
  const startDownload = (file: DownloadItem) => {
    const downloadTask = Taro.downloadFile({
      url: `${BASE_URL}${file.name}`,
    })

    setDownloadTask(file.name, downloadTask)

    downloadTask.progress(res => {
      updateDownloadProgress(file.name, res.progress)
    })

    downloadTask.then(async res => {
      if (res.statusCode === 200) {
        // 保存临时文件路径
        updateTempFilePath(file.name, res.tempFilePath)

        try {
          // 保存文件到本地
          const saveRes = await Taro.saveFile({
            tempFilePath: res.tempFilePath
          })

          // 更新最终保存路径
          updateSavedPath(file.name, (saveRes as Taro.saveFile.SuccessCallbackResult).savedFilePath)
          updateDownloadStatus(file.name, 'success')
        } catch (error) {
          console.error('保存文件错误:', error)
          updateDownloadStatus(file.name, 'failed')
        }

        removeDownloadTask(file.name)
      }
    }).catch(error => {
      console.error('下载错误:', error)
      updateDownloadStatus(file.name, 'failed')
      removeDownloadTask(file.name)
    })
  }

  const handleCancelDownload = (item) => {
    const task = downloadTasks[item.name]
    if (task) {
      task.abort()
      removeDownloadItem(item.name)
      removeDownloadTask(item.name)
    }
  }

  // 处理滚动到底部
  const handleScrollToLower = () => {
    if (!loading && hasMore[activeTab]) {
      fetchFileList(false)
    }
  }

  // 处理刷新
  const handleRefresh = () => {
    setPageFrom(prev => ({
      ...prev,
      [activeTab]: 0
    }))
    setHasMore(prev => ({
      ...prev,
      [activeTab]: true
    }))
    fetchFileList(true)
  }

  // 处理选择模式切换
  const handleSelectClick = () => {
    setIsSelectMode(!isSelectMode)
    if (isSelectMode) {
      const resetList = fileList[activeTab].map(group => ({
        ...group,
        files: group.files.map(file => ({ ...file, selected: false }))
      }))
      setFileList(prev => ({
        ...prev,
        [activeTab]: resetList
      }))
    }
  }

  // 检查已保存文件是否仍然存在
  useEffect(() => {
    const checkSavedFiles = async () => {
      const completedDownloads = downloadList.filter(
        item => item.status === 'success' && item.savedPath
      )

      for (const item of completedDownloads) {
        try {
          await Taro.getSavedFileInfo({
            filePath: item.savedPath!
          })
        } catch {
          // 如果文件不存在，从列表中移除
          removeDownloadItem(item.name)
        }
      }
    }

    checkSavedFiles()
  }, [])

  // 切换标签页时，如果该标签页没有数据才请求
  useEffect(() => {
    if (fileList[activeTab].length === 0 && activeTab !== 'download') {
      fetchFileList(false)
    }
  }, [activeTab])

  return (
    <View className="recorder-page">
      <View className="header">
        <View className="right-buttons">
          <Text className="refresh-btn" onClick={handleRefresh}>刷新</Text>
          <Text className="select-btn" onClick={handleSelectClick}>
            {isSelectMode ? '完成' : '选择'}
          </Text>
        </View>
      </View>

      <Tabs value={activeTab} onChange={(value) => setActiveTab(value as string)}>
        {TABS.map(tab => (
          <Tabs.TabPane key={tab.type} value={tab.type} title={tab.title}>
            {tab.type === 'download' ? (
              <DownloadList
                downloadList={downloadList}
                onCancel={handleCancelDownload}
              />
            ) : (
              <ScrollView
                scrollY
                className={`content-scroll ${isSelectMode ? 'has-bottom-bar' : ''}`}
                onScrollToLower={handleScrollToLower}
              >
                <FileList
                  fileList={fileList[tab.type]}
                  isSelectMode={isSelectMode}
                  onFileSelect={handleFileSelect}
                  onFileClick={handleFileClick}
                />
                {loading && (
                  <View className="loading-more">加载中...</View>
                )}
                {!loading && !hasMore[tab.type] && (
                  <View className="no-more">没有更多数据了</View>
                )}
              </ScrollView>
            )}
          </Tabs.TabPane>
        ))}
      </Tabs>

      {isSelectMode && (
        <View className="bottom-action-bar">
          <Text className="selected-count">
            已选择 {getSelectedFiles().length} 个文件
          </Text>
          <View className="action-buttons">
            <Button
              className="download-btn"
              onClick={handleDownload}
            >
              下载内容
            </Button>
          </View>
        </View>
      )}
    </View>
  )
}

export default Recorder 