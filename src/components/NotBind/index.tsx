import { Button, View } from '@tarojs/components'
import { Empty } from '@nutui/nutui-react-taro'
import emptyImg from '@/assets/empty.png'
import './index.scss'
import Taro from '@tarojs/taro'
import LoginPopup from '../LoginPopup'
import { useState } from 'react'

function NotBind(props: {
  isLogin?: boolean,
}) {
  const { isLogin = true } = props
  const [showLogin, setShowLogin] = useState(false)
  return (
    <View className="empty-state">
      <Empty description="暂无设备" image={emptyImg} />
      <Button
        className="bind-btn"
        onClick={() => {
          if (!isLogin) {
            setShowLogin(true)
            return
          } else {
            Taro.navigateTo({ url: '/pages/bind-car/index' })
          }
        }}
      >
        绑定设备
      </Button>
      <LoginPopup
        visible={showLogin}
        onClose={() => setShowLogin(false)}
      />
    </View>
  )
}

export default NotBind