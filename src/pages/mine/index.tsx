import { View, Text, Image, Canvas } from '@tarojs/components'
import './index.scss'
import Taro from '@tarojs/taro'
import { ArrowSize8, Receipt, Voucher, QrCode, User } from '@nutui/icons-react-taro'
import { Avatar, Popup } from '@nutui/nutui-react-taro'
import { useState } from 'react'
import { useUserStore } from '@/store/user'
import drawQrcode from 'weapp-qrcode'
import { useRef } from 'react'

function Mine() {
  const { userInfo: { openId, phone } } = useUserStore()
  const [showQRCode, setShowQRCode] = useState(false)
  const componentRef = useRef()

  const handleGenerateQRCode = () => {
    setShowQRCode(true)
    setTimeout(() => {
      try {
        drawQrcode({
          canvasId: 'myQrcode',
          text: openId,
          width: 200,
          height: 200,
          foreground: '#000000',
          background: '#ffffff',
          padding: 10,
          _this: componentRef.current
        })
      } catch (error) {
        console.error('生成二维码失败', error)
      }
    }, 100)
  }

  return (
    <View className="mine-page" ref={componentRef}>
      {/* 用户信息 */}
      <View className="user-info">
        <Avatar
          className="avatar"
          icon={<User color="#333" />}
          background="#f0f0f0"
          size="large"
        />
        <View className="phone-number">
          {phone}
        </View>
      </View>

      {/* 我的车辆 */}
      {/* <View className="section-title">我的车辆</View>
      <View className="car-card">
        <View className="bind-car-btn" onClick={() => {
          Taro.navigateTo({
            url: '/pages/bind-car/index'
          })
        }}>+ 绑定车辆</View>
      </View> */}

      {/* 菜单列表 */}
      <View className="menu-list">
        <View className="menu-item"
          onClick={() => {
            Taro.navigateTo({
              url: '/pages/coupons/index'
            })
          }}
        >
          <View className="menu-item-left">
            <Voucher className="menu-icon" size={16} />
            <Text>优惠券</Text>
          </View>
          <Text className="arrow">
            <ArrowSize8 size={14} />
          </Text>
        </View>

        <View className="menu-item" onClick={handleGenerateQRCode}>
          <View className="menu-item-left">
            <QrCode className="menu-icon" size={16} />
            <Text>生成二维码</Text>
          </View>
          <Text className="arrow">
            <ArrowSize8 size={14} />
          </Text>
        </View>

        <View className="menu-item">
          <View className="menu-item-left">
            <Receipt className="menu-icon" size={16} />
            <Text>隐私政策</Text>
          </View>
          <Text className="arrow">
            <ArrowSize8 size={14} />
          </Text>
        </View>
      </View>

      <Popup
        visible={showQRCode}
        onClose={() => setShowQRCode(false)}
        style={{ padding: '30px' }}
        className='qrcode-popup'
      >
        <View className='qrcode-popup'>
          <Canvas
            className='qrcode'
            canvasId='myQrcode'
            style={{ width: '200px', height: '200px' }}
          />
          <Text className='qrcode-tip'>扫描二维码即可获取用户信息</Text>
        </View>
      </Popup>
    </View>
  )
}

export default Mine