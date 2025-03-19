import { View, Text } from '@tarojs/components'
import { useState } from 'react'
import Taro from '@tarojs/taro'
import { CouponAPI } from '@/request/couponApi'
import { CouponInfo, CouponStatus, CouponType } from '@/request/couponApi/typings.d'
import { COUPON_TYPES } from '@/constants/constants'
import ScrollableTabList from '@/components/ScrollableTabList'
import './index.scss'

const tabs = [
  { title: '可使用', value: '1' },
  { title: '已使用', value: '2' },
]

function Coupons() {
  const [activeTab, setActiveTab] = useState('1')

  const fetchData = async ({ status, page }: { status: string; page: number }) => {
    const res = await CouponAPI.getCouponList({
      status,
      page,
      limit: 10
    })
    return res?.data?.list || []
  }

  const getRuleContent = (coupon: CouponInfo) => {
    try {
      const rule = JSON.parse(coupon.rule)
      switch (coupon.type) {
        case CouponType.Cash:
          return {
            amount: `¥${rule.cash}`,
            desc: '现金券'
          }
        case CouponType.Maintenance:
          return {
            amount: '保养券',
            desc: rule.maintenance
          }
        case CouponType.Insurance:
          return {
            amount: '续保券',
            desc: rule.insurance
          }
        case CouponType.Physical:
          return {
            amount: '实物券',
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

  const renderItem = (coupon: CouponInfo) => {
    const ruleContent = getRuleContent(coupon)

    return (
      <View
        key={coupon.id}
        className={`coupon-item ${coupon.status.code === CouponStatus.USED ? 'used' : ''}`}
        onClick={() => {
          Taro.navigateTo({
            url: `/pages/coupons/detail/index?id=${coupon.id}`
          })
        }}
      >
        <View className="coupon-left">
          <Text className="amount">{ruleContent.amount}</Text>
          {coupon.type === CouponType.Cash && (
            <Text className="type">
              {COUPON_TYPES.find(t => t.value === coupon.type)?.label}
            </Text>
          )}
        </View>
        <View className="coupon-right">
          <View className="content">
            <Text className="desc">{ruleContent.desc}</Text>
            <Text className="date">开始时间：{coupon.valid_start}</Text>
            <Text className="date">结束时间：{coupon.valid_end}</Text>
          </View>
          {coupon.status.code === CouponStatus.USED && (
            <View className="status-tag">已使用</View>
          )}
        </View>
      </View>
    )
  }

  return (
    <View className="coupons-page">
      <ScrollableTabList
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        fetchData={({ status, page }) => fetchData({
          status: status === '1' ? String(CouponStatus.UNUSED) : String(CouponStatus.USED),
          page
        })}
        renderItem={renderItem}
        emptyText={activeTab === '1' ? '暂无可用优惠券' : '暂无已使用的优惠券'}
        className="fixed-tabs"
        autoLoad
      />
    </View>
  )
}

export default Coupons