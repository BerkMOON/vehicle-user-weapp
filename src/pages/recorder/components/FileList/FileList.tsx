import { View, Text, Image } from '@tarojs/components'
import { FileGroup, FileItem } from '../../types'
import './FileList.scss'
import { PlayStart } from '@nutui/icons-react-taro'
import { Empty } from '@nutui/nutui-react-taro'
import emptyImg from '@/assets/empty.png'

interface FileListProps {
  fileList: FileGroup[]
  onFileClick: (file: FileItem) => void
}

export const FileList: React.FC<FileListProps> = ({
  fileList,
  onFileClick
}) => {
  return (
    <View className="file-list">
      {fileList.length === 0 ? (
        <Empty description="暂无文件" image={emptyImg} />
      ) : (
        <>
          {
            fileList.map((group) => (
              <View key={group.date} className="file-group">
                <View className="date-header">
                  <Text className="date">{group.date}</Text>
                  <Text className="file-count">{group.files.length}个文件</Text>
                </View>
                <View className="files-grid">
                  {group.files.map((file) => (
                    <View
                      key={`${group.date}-${file.time}`}
                      className={`file-item ${file.selected ? 'selected' : ''}`}
                      onClick={() => {
                        onFileClick(file)
                      }}
                    >
                      <View className="thumbnail-wrapper">
                        {file.format.toLowerCase() === 'mp4' ? (
                          <View className="video-thumbnail">
                            <PlayStart size={30} style={{ zIndex: 1 }} />
                            <Image
                              src={file.thumbnail || ''}
                              className="thumbnail"
                              mode="aspectFill"
                            />
                          </View>
                        ) : (
                          <Image
                            src={file.url}
                            className="thumbnail"
                            mode="aspectFill"
                          />
                        )}
                      </View>
                      <View className="file-info">
                        <View className="info-row">
                          <Text className="label">时间:</Text>
                          <Text className="time">{file.time}</Text>
                        </View>
                        <View className="info-row">
                          <Text className="label">大小:</Text>
                          <Text className="size">{file.size}</Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            ))
          }
        </>
      )
      }
    </View>
  )
} 