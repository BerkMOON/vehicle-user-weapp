import { View, Text, LivePlayer, Video } from '@tarojs/components'
import { useState, useEffect } from 'react'
import { handleRequest } from '@/request'
import { LiveAPI } from '@/request/liveApi'
import './index.scss'

interface PreviewInfo {
  bitrate: string
  fps: string
  height: string
  width: string
}

function Live() {
  const [streamUrl, setStreamUrl] = useState('')
  const [previewInfo, setPreviewInfo] = useState<PreviewInfo | null>(null)
  const [error, setError] = useState('')

  // 解析预览信息
  const parsePreviewInfo = (data: string) => {
    const bitrateMatch = data.match(/bitrate=(\d+)/)
    const fpsMatch = data.match(/fps=(\d+)/)
    const heightMatch = data.match(/h=(\d+)/)
    const widthMatch = data.match(/w=(\d+)/)

    if (bitrateMatch && fpsMatch && heightMatch) {
      return {
        bitrate: `${parseInt(bitrateMatch[1]) / 1000000}Mbps`,
        fps: `${fpsMatch[1]}fps`,
        height: heightMatch[1],
        width: widthMatch ? widthMatch[1] : '1920'
      }
    }
    return null
  }

  // 获取直播流信息
  const fetchStreamInfo = () => {
    handleRequest({
      url: LiveAPI.getPreviewInfo(),
      errorMsg: '获取预览信息失败',
      onSuccess: (data) => {
        // 设备IP为192.168.1.1
        const deviceIp = '192.168.1.1'
        const url = `rtsp://${deviceIp}/liveRTSP/av${data.match(/av=(\d+)/)[1]}`
        console.log(url, 'liveUrl')
        setStreamUrl(url)
        
        const info = parsePreviewInfo(data)
        if (info) {
          setPreviewInfo(info)
        }
      }
    })
  }

  // 处理播放状态变化
  const handleStateChange = (e) => {
    console.log('播放状态变化：', e.detail.code)
    switch (e.detail.code) {
      case 2106: // 开始播放
        setError('')
        break
      case -2301: // 网络断连
        setError('网络连接断开，请检查网络')
        break
      case -2302: // 获取视频数据超时
        setError('获取视频数据超时')
        break
      default:
        break
    }
  }

  // 处理播放错误
  const handleError = (e) => {
    console.error('播放错误：', e)
    setError('视频播放出错，请重试')
  }

  useEffect(() => {
    fetchStreamInfo()
  }, [])

  return (
    <View className="live-page">
      <View className="player-container">
        {streamUrl && (
          <LivePlayer
            src={streamUrl}
            mode="RTC"
            autoplay
            muted={false}
            objectFit="contain"
            onStateChange={handleStateChange}
            onError={handleError}
          />
          // <Video src={streamUrl} controls />
        )}
        {error && (
          <View className="error-tip">
            <Text>{error}</Text>
          </View>
        )}
      </View>

      {/* {previewInfo && (
        <View className="info-panel">
          <View className="info-item">
            <Text className="label">码率：</Text>
            <Text className="value">{previewInfo.bitrate}</Text>
          </View>
          <View className="info-item">
            <Text className="label">帧率：</Text>
            <Text className="value">{previewInfo.fps}</Text>
          </View>
          <View className="info-item">
            <Text className="label">分辨率：</Text>
            <Text className="value">{`${previewInfo.width}×${previewInfo.height}`}</Text>
          </View>
        </View>
      )} */}
    </View>
  )
}

export default Live 