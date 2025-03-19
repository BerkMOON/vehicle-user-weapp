import { View, Text, Button } from '@tarojs/components'
import { DownloadItem } from '../../types'
import './DownloadList.scss'
import Taro from '@tarojs/taro'
import { Empty, NoticeBar } from '@nutui/nutui-react-taro'
import emptyImg from '@/assets/empty.png'

interface DownloadListProps {
  downloadList: DownloadItem[]
  onCancel: (item: DownloadItem) => void
}

export const DownloadList: React.FC<DownloadListProps> = ({ downloadList, onCancel }) => {

  const handleDownload = (item: DownloadItem) => {
    try {
      item.format === 'mp4' ? Taro.saveVideoToPhotosAlbum({
        filePath: item.savedPath || '',
      }) : Taro.saveImageToPhotosAlbum({
        filePath: item.savedPath || '',
      })
      Taro.showToast({
        title: '保存成功',
        icon: 'none',
      })
    } catch (error) {
      Taro.showToast({
        title: '保存失败',
        icon: 'none',
      })
    }
  }

  return (
    <>
      <NoticeBar className='notice-bar' content={'请在下载时保持wifi连接，在保存到手机相册前, 关闭wifi, 连接流量, 以保持能力可用'} scrollable={true} />
      <View className="download-list">
        {downloadList.length === 0 ? (
          <Empty description="暂无下载内容" image={emptyImg} />
        ) : (
          downloadList.map(item => (
            <View key={item.name} className="download-item">
              <View className="file-info">
                <Text className="name">{item.name.split('/').pop()}</Text>
                <Text className="size">{item.size}</Text>
              </View>
              <View className="progress-bar">
                <View
                  className="progress-inner"
                  style={{ width: `${item.progress}%` }}
                />
              </View>
              <View className="status-row">
                <Text className={`status ${item.status}`}>
                  {(item.status === 'downloading' || item.status === 'paused') && `${item.progress}%`}
                  {item.status === 'success' && '已完成'}
                  {item.status === 'failed' && '下载失败'}
                </Text>
                {item.status === 'downloading' && (
                  <Button
                    className="cancel-btn"
                    onClick={() => onCancel(item)}
                  >
                    取消
                  </Button>
                )}
                {item.tempFilePath && (
                  <Button className="saved-path" onClick={() => handleDownload(item)}>
                    保存到手机相册
                  </Button>
                )}
              </View>
            </View>
          ))
        )}
      </View>
    </>
  )
} 