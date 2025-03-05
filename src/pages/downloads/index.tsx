import { View } from '@tarojs/components'
import { useDownloadStore } from '@/store/download'
import { DownloadList } from '../recorder/components/DownloadList/DownloadList'
import './index.scss'

function Downloads() {
  const { 
    downloadList, 
    downloadTasks,
    removeDownloadTask,
    removeDownloadItem
  } = useDownloadStore()


  const handleCancelDownload = (item) => {
    const task = downloadTasks[item.name]
    if (task) {
      task.abort()
      removeDownloadItem(item.name)
      removeDownloadTask(item.name)
    }
  }

  return (
    <View className="downloads-page">
      <DownloadList
        downloadList={downloadList}
        onCancel={handleCancelDownload}
      />
    </View>
  )
}

export default Downloads 