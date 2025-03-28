import { useEffect, useState } from 'react'
import { View, Video } from '@tarojs/components'
import './index.scss'
import Taro from '@tarojs/taro'
import { Overlay, Loading } from '@nutui/nutui-react-taro'
import { Close } from '@nutui/icons-react-taro'

const VideoPlayer = ({ videoUrl, visible, setVisible }) => {
  const [localVideoUrl, setLocalVideoUrl] = useState('')
  const [lastVideoUrl, setLastVideoUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (videoUrl && visible && videoUrl !== lastVideoUrl) {
      setLocalVideoUrl('')
      setIsLoading(true)
      Taro.downloadFile({
        url: videoUrl,
        success: (res) => {
          if (res.statusCode === 200) {
            setLocalVideoUrl(res.tempFilePath)
            setLastVideoUrl(videoUrl)
          }
        },
        fail: (err) => {
          console.error('视频预加载失败:', err)
        },
        complete: () => {
          setIsLoading(false)
        }
      })
    }
  }, [visible, videoUrl])

  const onClose = () => {
    setVisible(false)
  }

  return (
    <Overlay visible={visible} closeOnOverlayClick={false}>
      <View className='video-player'>
        <View className='close-btn' onClick={onClose}>
          <Close></Close>
        </View>
        {isLoading ? (
          <View className='loading-wrapper'>
            <Loading type='spinner' color='#fff'>视频加载中...</Loading>
          </View>
        ) : (
          localVideoUrl && <Video
            src={localVideoUrl}
            autoplay
            controls
            showFullscreenBtn
            showPlayBtn
            showCenterPlayBtn
            enableProgressGesture
            className='video'
            direction={90}
          />
        )}
      </View>
    </Overlay>
  )
}

export default VideoPlayer