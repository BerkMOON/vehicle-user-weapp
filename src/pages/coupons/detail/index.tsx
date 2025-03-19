import { View, Text, Canvas } from '@tarojs/components'
import { useRouter } from '@tarojs/taro'
import { useEffect, useRef, useState } from 'react'
import Taro from '@tarojs/taro'
import { CouponAPI } from '@/request/couponApi'
import { CouponInfo, CouponType } from '@/request/couponApi/typings.d'
import { COUPON_TYPES } from '@/constants/constants'
import { QrCode } from '@nutui/icons-react-taro'  // 添加图标导入
import drawQrcode from 'weapp-qrcode'
import './index.scss'
import { Skeleton } from '@nutui/nutui-react-taro'

function CouponDetail() {
  const router = useRouter()
  const { id } = router.params
  const [couponDetail, setCouponDetail] = useState<CouponInfo>()
  const [loading, setLoading] = useState(false)
  const componentRef = useRef()

  const getRuleContent = (detail: CouponInfo) => {
    try {
      const rule = JSON.parse(detail.rule)
      switch (detail.type) {
        case CouponType.Cash:
          return {
            amount: `${rule.cash}`,
            desc: `可抵扣现金${rule.cash}元`
          }
        case CouponType.Maintenance:
          return {
            amount: '保养',
            desc: rule.maintenance
          }
        case CouponType.Insurance:
          return {
            amount: '续保',
            desc: rule.insurance
          }
        case CouponType.Physical:
          return {
            amount: '实物',
            desc: rule.physical
          }
        default:
          return {
            amount: '-',
            desc: '未知类型'
          }
      }
    } catch (error) {
      return {
        amount: '-',
        desc: '规则解析失败'
      }
    }
  }

  const fetchDetail = async () => {
    if (!id) return
    setLoading(true)
    try {
      const res = await CouponAPI.getCouponDetail(Number(id))
      if (res?.data) {
        setCouponDetail(res.data)
      }
    } catch (error) {
      Taro.showToast({
        title: '获取详情失败',
        icon: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDetail()
    drawQrcode({
      canvasId: 'myQrcode',
      text: id,
      width: 200,
      height: 200,
      foreground: '#000000',
      background: '#ffffff',
      padding: 10,
      _this: componentRef.current
    })
  }, [id])

  if (!couponDetail) return null

  const ruleContent = getRuleContent(couponDetail)

  return (
    <View className='coupon-detail'>
      <View className='detail-card'>
        <View className='amount-section'>
          {couponDetail.type === CouponType.Cash &&
            <>
              <Text className='currency'>¥</Text>
              <Text className='amount'>{ruleContent.amount}</Text>
            </>}
        </View>
        <View className='info-section'>
          <Text className='type'>
            {COUPON_TYPES.find(t => t.value === couponDetail.type)?.label}
          </Text>
          <Text className='status'>
            状态：{couponDetail.status.name}
          </Text>
        </View>
      </View>

      <View className='rules-card'>
        <Skeleton rows={4} title animated visible={!loading}>
          <View className='card-title'>使用说明</View>
          <View className='rule-items'>
            <View className='rule-item'>
              <Text className='label'>实际使用信息：</Text>
              <Text className='value'>{ruleContent.desc}</Text>
            </View>
            <View className='rule-item'>
              <Text className='label'>有效期：</Text>
              <Text className='value'>{couponDetail.valid_start} 至 {couponDetail.valid_end}</Text>
            </View>
            <View className='qrcode-section'>
              <View className='qrcode-title'>
                <QrCode />
                <Text>优惠券二维码</Text>
              </View>
              <Canvas
                className='qrcode'
                canvasId='myQrcode'
                style={{ width: '200px', height: '200px' }}
              />
            </View>
          </View>
        </Skeleton>
      </View>
    </View>
  )
}

export default CouponDetail