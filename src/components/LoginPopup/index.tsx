import { View, Text, Button } from '@tarojs/components'
import { Popup, Checkbox } from '@nutui/nutui-react-taro'
import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import Taro from '@tarojs/taro'
import './index.scss'

interface LoginPopupProps {
  visible: boolean
  onClose: () => void
}

function LoginPopup({ visible, onClose }: LoginPopupProps) {
  const { handleGetPhoneNumber } = useAuth()
  const [isAgree, setIsAgree] = useState(false)

  const getPhoneNumber = async (e) => {
    await handleGetPhoneNumber(e.detail.code)
    onClose()
  }

  return (
    <Popup
      visible={visible}
      onClose={onClose}
      position='bottom'
    >
      <View className='login-popup'>
        <View className='popup-header'>
          <View className='close' onClick={onClose}>×</View>
        </View>
        
        <View className='popup-content'>
          <Button
            className='login-btn'
            {...{ openType: isAgree ? 'getPhoneNumber' : undefined }}
            onGetPhoneNumber={getPhoneNumber}
            onClick={() => {
              if (!isAgree) {
                Taro.showToast({
                  title: '请先阅读并同意相关协议',
                  icon: 'none'
                })
              }
            }}
          >
            微信一键登录
          </Button>
          
          <View className='agreement'>
            <Checkbox 
              checked={isAgree}
              onChange={(val) => setIsAgree(val)}
            >
              <Text className='agreement-text'>
                我已阅读并同意
                <Text 
                  className='link'
                  onClick={(e) => {
                    e.stopPropagation()
                    Taro.navigateTo({ url: '/pages/terms/index?terms=term' })
                  }}
                >
                  《用户服务协议》
                </Text>
                和
                <Text 
                  className='link'
                  onClick={(e) => {
                    e.stopPropagation()
                    Taro.navigateTo({ url: '/pages/terms/index?terms=privacy' })
                  }}
                >
                  《隐私政策》
                </Text>
              </Text>
            </Checkbox>
          </View>
        </View>
      </View>
    </Popup>
  )
}

export default LoginPopup