import { Button, View } from '@tarojs/components'
import { Empty } from '@nutui/nutui-react-taro'
import emptyImg from '@/assets/empty.png'
import './index.scss'
import Taro from '@tarojs/taro'

function NotBind() {

  return (
    <View className="empty-state">
      <Empty description="暂无设备" image={emptyImg} />
      <Button
        className="bind-btn"
        onClick={() => Taro.navigateTo({ url: '/pages/bind-car/index' })}
      >
        绑定设备
      </Button>
    </View>
  )
}

export default NotBind