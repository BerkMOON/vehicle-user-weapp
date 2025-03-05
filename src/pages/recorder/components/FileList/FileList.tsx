import { View, Text, Image } from '@tarojs/components'
import { FileGroup, FileItem } from '../../types'
import './FileList.scss'
import { PlayStart } from '@nutui/icons-react-taro'

interface FileListProps {
  fileList: FileGroup[]
  isSelectMode: boolean
  onFileSelect: (groupIndex: number, fileIndex: number) => void
  onFileClick: (file: FileItem) => void
}

export const FileList: React.FC<FileListProps> = ({
  fileList,
  isSelectMode,
  onFileSelect,
  onFileClick
}) => {
  return (
    <View className="file-list">
      {
        fileList.map((group, groupIndex) => (
          <View key={group.date} className="file-group">
            <View className="date-header">
              <Text className="date">{group.date}</Text>
              <Text className="file-count">{group.files.length}个文件</Text>
            </View>
            <View className="files-grid">
              {group.files.map((file, fileIndex) => (
                <View
                  key={`${group.date}-${file.time}`}
                  className={`file-item ${file.selected ? 'selected' : ''}`}
                  onClick={() => {
                    if (isSelectMode) {
                      onFileSelect(groupIndex, fileIndex)
                    } else {
                      onFileClick(file)
                    }
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
                    {isSelectMode && (
                      <View className={`select-indicator ${file.selected ? 'selected' : ''}`}>
                        {file.selected ? '✓' : ''}
                      </View>
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
    </View>
  )
} 