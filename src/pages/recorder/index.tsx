import { useState, useEffect } from 'react'
import { View, ScrollView, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Tabs } from '@nutui/nutui-react-taro'
import { FileList } from './components/FileList/FileList'
import { parseXML, formatFileSize, getThumbnailUrl } from '../../utils/utils'
import { TABS, PAGE_SIZE } from './constants'
import { FileGroup, FileItem } from './types'
import './index.scss'
import { BASE_URL } from '../../constants/constants'

function Recorder() {
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

  // 获取文件列表
  const fetchFileList = async (isRefresh = false) => {
    try {
      setLoading(true)
      const from = isRefresh ? 0 : pageFrom[activeTab]
      const res = await Taro.request({
        url: `${BASE_URL}/cgi-bin/Config.cgi?action=dir&property=${activeTab}&format=${activeTab === 'photo' ? 'all' : 'mp4'}&count=${PAGE_SIZE}&from=${from}`,
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

  // 处理文件点击
  const handleFileClick = (file: FileItem) => {
    if (file.format.toLowerCase() === 'mp4') {
      Taro.previewMedia({
        sources: [{
          url: file.url,
          type: 'video',
          poster: file.thumbnail,
        }]
      })

    } else {
      Taro.previewImage({
        urls: [file.url]
      })
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

  // 切换标签页时，如果该标签页没有数据才请求
  useEffect(() => {
    if (fileList[activeTab].length === 0) {
      fetchFileList(false)
    }
  }, [activeTab])

  return (
    <View className="recorder-page">
      <View className="header">
        <View className="right-buttons">
          <Text className="refresh-btn" onClick={handleRefresh}>刷新</Text>
        </View>
      </View>

      <Tabs value={activeTab} onChange={(value) => setActiveTab(value as string)}>
        {TABS.map(tab => (
          <Tabs.TabPane key={tab.type} value={tab.type} title={tab.title}>
            <ScrollView
              scrollY
              className="content-scroll"
              onScrollToLower={handleScrollToLower}
            >
              <FileList
                fileList={fileList[tab.type]}
                onFileClick={handleFileClick}
              />
              {loading && (
                <View className="loading-more">加载中...</View>
              )}
              {!loading && !hasMore[tab.type] && (
                <View className="no-more">没有更多数据了</View>
              )}
            </ScrollView>
          </Tabs.TabPane>
        ))}
      </Tabs>
    </View>
  )
}

export default Recorder 