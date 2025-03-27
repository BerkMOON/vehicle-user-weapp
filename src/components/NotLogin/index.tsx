import { View, Button } from '@tarojs/components'
import { Empty } from '@nutui/nutui-react-taro'
import { useState } from 'react'
import emptyImg from '@/assets/empty.png'
import './index.scss'
import LoginPopup from '../LoginPopup'

function NotLogin() {
  const [showLogin, setShowLogin] = useState(false)

  return (
    <>
      <View className="empty-state">
        <Empty description="暂无您的设备信息，请登录查看" image={emptyImg} />
        <Button
          className="login-btn"
          onClick={() => setShowLogin(true)}
        >
          立即登录
        </Button>
      </View>
      <LoginPopup
        visible={showLogin}
        onClose={() => setShowLogin(false)}
      />
    </>
  )
}

export default NotLogin