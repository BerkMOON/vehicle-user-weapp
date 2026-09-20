import { View, Text, Canvas } from '@tarojs/components'
import './index.scss'
import Taro from '@tarojs/taro'
import { ArrowSize8, Receipt, User, ArrowExchange, Video } from '@nutui/icons-react-taro'
import { Avatar, Popup, Button } from '@nutui/nutui-react-taro'
import { useMemo, useState } from 'react'
import { useUserStore } from '@/store/user'
import { useMembershipStore } from '@/store/membership'
import {
  canPurchaseMembership,
  formatCloudDaysLabel,
  resolveCloudDaysFromStatus,
  resolveLevelName
} from '@/utils/membership'
import { useRef } from 'react'
import AppPromoBanner from '@/components/AppPromoBanner'
import { promptDownloadApp } from '@/utils/appPromo'
import { useAuth } from '@/hooks/useAuth'  // 添加这行导入
import { UserAPI } from '@/request/useApi'
import { FileType } from '@/request/useApi/typings.d'

function Mine() {
  const { userInfo: { phone } } = useUserStore()
  const membershipReady = useMembershipStore((s) => s.ready)
  const membershipInfo = useMembershipStore((s) => s.info)
  const membership = useMemo(() => {
    const cloudDays = resolveCloudDaysFromStatus(membershipInfo)
    return {
      ready: membershipReady,
      levelName: resolveLevelName(membershipInfo),
      cloudDaysLabel: formatCloudDaysLabel(cloudDays),
      canPurchase: canPurchaseMembership(membershipInfo),
      cloudDays
    }
  }, [membershipReady, membershipInfo])
  const { handleGetPhoneNumber } = useAuth()  // 添加这行
  const [showQRCode, setShowQRCode] = useState(false)
  const componentRef = useRef()

  const getPhoneNumber = async (e) => {
    await handleGetPhoneNumber(e.detail.code)
  }

  const previewPDF = async () => {
    Taro.showLoading({
      title: '加载中',
    })

    try {
      const res = await UserAPI.getInstruction({
        needSynopsisPdf: true,
        needSynopsisVideo: false,
      })

      const pdfItem = res?.data.item_list.find(item => item.file_type === FileType.SynopsisPdf)

      if (pdfItem) {
        Taro.downloadFile({
          url: pdfItem.url,
          success: (res) => {
            Taro.hideLoading()
            Taro.openDocument({
              filePath: res.tempFilePath,
              fileType: 'pdf',
            });
          },
          fail: (err) => {
            Taro.hideLoading()
            console.error('下载失败', err)
          },
        });
      } else {
        Taro.hideLoading()
        Taro.showToast({
          title: '未找到PDF文件',
          icon: 'none',
        })
      }
    } catch (error) {
      Taro.hideLoading()
      Taro.showToast({
        title: '获取PDF失败，请重试',
        icon: 'none',
      })
      console.error('获取指令失败', error)
      return
    }
  };

  const previewVideo = async () => {
    Taro.showLoading({
      title: '加载中',
    })
    try {
      const res = await UserAPI.getInstruction({
        needSynopsisPdf: false,
        needSynopsisVideo: true,
      })

      const videoItem = res?.data.item_list.find(item => item.file_type === FileType.SynopsisVideo)

      if (videoItem) {
        Taro.hideLoading()
        Taro.previewMedia({
          sources: [{
            url: videoItem.url,
            type: 'video',
          }]
        })
      } else {
        Taro.hideLoading()
        Taro.showToast({
          title: '未找到视频文件',
          icon: 'none',
        })
      }
    } catch (error) {
      Taro.hideLoading()
      Taro.showToast({
        title: '获取视频失败，请重试',
        icon: 'none',
      })
      console.error('获取指令失败', error)
      return
    }
  };

  return (
    <View className="mine-page" ref={componentRef}>
      <View className='header'></View>
      {/* 用户信息 */}
      <View className="user-info">
        <View className="phone-info">
          <Avatar
            className="avatar"
            icon={<User color="#333" />}
            background="#f0f0f0"
            size="large"
          />
          <View className="user-meta">
            <View className="phone-number">
              {phone ? phone : '未登录'}
            </View>
            {phone && membership.ready && (
              <View
                className="member-status"
                onClick={() => {
                  promptDownloadApp({
                    title: membership.levelName,
                    content: `行车视频云回看：${membership.cloudDaysLabel}\n\n开通/续费请使用易达安 App。`
                  })
                }}
              >
                {membership.levelName} · 行车视频{membership.cloudDaysLabel}
              </View>
            )}
          </View>
        </View>
        <Button
          className="switch-account"
          openType='getPhoneNumber'
          onGetPhoneNumber={getPhoneNumber}
          icon={<ArrowExchange size={14} />}
        >
          <Text>{phone ? '切换账号' : '立即登录'}</Text>
        </Button>
      </View>

      <AppPromoBanner compact />

      <View className="section-title">使用说明</View>

      <View className="menu-list">
        <View className="menu-item"
          onClick={previewPDF}
        >
          <View className="menu-item-left">
            <Receipt className="menu-icon" size={16} />
            <Text>使用手册</Text>
          </View>
          <Text className="arrow">
            <ArrowSize8 size={14} />
          </Text>
        </View>

        <View className="menu-item" onClick={previewVideo}>
          <View className="menu-item-left">
            <Video className="menu-icon" size={16} />
            <Text>使用视频</Text>
          </View>
          <Text className="arrow">
            <ArrowSize8 size={14} />
          </Text>
        </View>
      </View>

      <View className="section-title">隐私政策</View>
      {/* 菜单列表 */}
      <View className="menu-list">
        <View className="menu-item" onClick={() => {
          Taro.navigateTo({ url: '/pages/terms/index?terms=privacy' })
        }}>
          <View className="menu-item-left">
            <Receipt className="menu-icon" size={16} />
            <Text>隐私协议</Text>
          </View>
          <Text className="arrow">
            <ArrowSize8 size={14} />
          </Text>
        </View>

        <View className="menu-item" onClick={() => {
          Taro.navigateTo({ url: '/pages/terms/index?terms=trem', })
        }}>
          <View className="menu-item-left">
            <Receipt className="menu-icon" size={16} />
            <Text>用户协议</Text>
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