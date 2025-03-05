import { Button, View } from '@tarojs/components'
import { Grid, GridItem, Tour } from "@nutui/nutui-react-taro"
import './index.scss'
import Taro from '@tarojs/taro'
import { useEffect, useState } from 'react'
import { useUserStore } from '@/store/user'
import { useAuth } from '@/hooks/useAuth'

function Index() {
  const [showTour, setShowTour] = useState(false)
  const { isLogin } = useUserStore()
  const { handleGetPhoneNumber } = useAuth()

  const steps = [
    {
      content: '查看记录仪内容，回放视频，查看图片',
      target: 'target1',
      popoverOffset: [140, 12],
      arrowOffset: -165,
    },
    {
      content: '设置记录仪参数，包括分辨率，音量等',
      target: 'target2',
      popoverOffset: [40, 12],
      arrowOffset: -65,
    },
    {
      content: '记录仪下载的文件，包括视频，图片',
      target: 'target3',
      popoverOffset: [140, 12],
      arrowOffset: -165,
    },
    {
      content: '使用手册，了解记录仪使用方法',
      target: 'target4',
      popoverOffset: [40, 12],
      arrowOffset: -65,
    },
  ]

  const closeTour = () => {
    setShowTour(false)
    // 设置标记，表示用户已经看过引导
    Taro.setStorageSync('hasSeenTour', 'true')
  }

  useEffect(() => {
    // 检查用户是否看过引导
    const hasSeenTour = Taro.getStorageSync('hasSeenTour')
    if (!hasSeenTour) {
      setShowTour(true)
    }
  }, [])


  const getPhoneNumber = async (e) => {
    await handleGetPhoneNumber(e.detail.code)
  }


  return (
    <View className="page">
      {/* 顶部栏 */}
      <View className="header">
        {/* <View className="service-btn">联系客服</View> */}
      </View>

      {/* 绑定车辆卡片 */}
      <View className="car-card">
        {
          !isLogin && <Button className="bind-car-btn" openType='getPhoneNumber' onGetPhoneNumber={getPhoneNumber}>
            登录获取手机号
          </Button>
        }
      </View>

      {/* 功能菜单 */}
      <Grid columns={2}>
        <GridItem id="target1" text="记录仪查看"
          onClick={() => {
            Taro.navigateTo({
              url: '/pages/recorder/index'
            })
          }} />
        <GridItem id="target2" text="记录仪设置"
          onClick={() => {
            Taro.navigateTo({
              url: '/pages/settings/index'
            })
          }}
        />
        <GridItem id="target3" text="记录仪下载"
          onClick={() => {
            Taro.navigateTo({
              url: '/pages/downloads/index'
            })
          }} />
        <GridItem id="target4" text="使用手册"
          onClick={() => {
            Taro.navigateTo({
              url: '/pages/manual/index'
            })
          }}
        />
      </Grid>

      <Tour
        visible={showTour}
        onClose={closeTour}
        list={steps}
        type="step"
        location="bottom-end"
        offset={[0, 10]}
        maskWidth={80}
        maskHeight={40}
      />
    </View>
  )
}

export default Index
