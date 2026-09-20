import { View, Text } from '@tarojs/components'
import { APP_PROMO_DESC, APP_PROMO_TITLE, promptDownloadApp } from '@/utils/appPromo'
import './index.scss'

type Props = {
  /** compact：我的页等窄条；默认首页大卡 */
  compact?: boolean
}

export default function AppPromoBanner({ compact = false }: Props) {
  return (
    <View
      className={`app-promo${compact ? ' app-promo--compact' : ''}`}
      onClick={() => promptDownloadApp()}
    >
      <View className='app-promo__body'>
        <Text className='app-promo__badge'>新</Text>
        <View className='app-promo__text'>
          <Text className='app-promo__title'>{APP_PROMO_TITLE}</Text>
          {!compact && <Text className='app-promo__desc'>{APP_PROMO_DESC}</Text>}
          {compact && (
            <Text className='app-promo__desc'>兼容更好 · 连接更稳 · iOS 看视频更方便</Text>
          )}
        </View>
      </View>
      <View className='app-promo__action'>去下载</View>
    </View>
  )
}
