import React, { useEffect, useState } from 'react'
import { View, Video } from '@tarojs/components'
import { useRouter } from '@tarojs/taro'
import './index.scss'

function VideoPlayer() {
  const router = useRouter()
  const [videoUrl, setVideoUrl] = useState('')

  useEffect(() => {
    const { videoUrl } = router.params
    if (videoUrl) {
      setVideoUrl(decodeURIComponent(videoUrl))
    }
  }, [router.params])

  return (
    <View className='video-player'>
      <Video
        src={videoUrl}
        autoplay
        controls
        showFullscreenBtn
        showPlayBtn
        showCenterPlayBtn
        enableProgressGesture
        className='video'
        direction={90}
      />
    </View>
  )
}

export default VideoPlayer 