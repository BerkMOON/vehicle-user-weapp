import { View, Text, WebView } from '@tarojs/components'
import { useRouter } from '@tarojs/taro'
import { useEffect, useMemo, useState } from 'react'
import './index.scss'

/** 与 packages/ts-webview-player 约定：查询参数 `url` 或 `src`（encodeURIComponent） */
const DEFAULT_PLAYER_BASE = 'https://eda-web-view.ai-kaka.com'

function normalizePlayerBase(raw: string): string {
  return raw.trim().replace(/\/+$/, '')
}

/** 路由上的 videoUrl 可能已由框架解码一层，失败时退回原串 */
function parseVideoUrlParam(raw: string | undefined): string {
  if (!raw) return ''
  try {
    return decodeURIComponent(raw)
  } catch {
    return raw
  }
}

/**
 * 使用微信 web-view 嵌套业务域名下的 H5 页面播放 TS 等格式。
 * 基址来自 TARO_APP_WEBVIEW_PLAYER_URL（config/dev|prod.ts），未配置时用 DEFAULT_PLAYER_BASE。
 */
export default function VideoWebPlayer() {
  const router = useRouter()
  const [webviewSrc, setWebviewSrc] = useState('')

  const playerBase = useMemo(() => {
    const fromEnv =
      typeof TARO_APP_WEBVIEW_PLAYER_URL !== 'undefined'
        ? TARO_APP_WEBVIEW_PLAYER_URL.trim()
        : ''
    return normalizePlayerBase(fromEnv || DEFAULT_PLAYER_BASE)
  }, [])

  useEffect(() => {
    const raw = router.params.videoUrl
    if (!raw) return
    const videoUrl = parseVideoUrlParam(raw)
    if (!videoUrl) return
    const sep = playerBase.includes('?') ? '&' : '?'
    setWebviewSrc(`${playerBase}${sep}url=${encodeURIComponent(videoUrl)}`)
  }, [playerBase, router.params.videoUrl])

  if (!router.params.videoUrl) {
    return (
      <View className='video-web-player video-web-player--empty'>
        <Text className='video-web-player__hint'>缺少参数 videoUrl</Text>
      </View>
    )
  }

  if (!webviewSrc) {
    return (
      <View className='video-web-player video-web-player--empty'>
        <Text className='video-web-player__hint'>加载中…</Text>
      </View>
    )
  }

  return (
    <View className='video-web-player'>
      <WebView src={webviewSrc} />
    </View>
  )
}
