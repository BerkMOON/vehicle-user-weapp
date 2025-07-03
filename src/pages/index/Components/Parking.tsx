import { ArrowRight, Notice } from "@nutui/icons-react-taro"
import { View, Text } from "@tarojs/components"
import { useEffect, useState } from "react"
import './Parking.scss'
import { DeviceAPI } from "@/request/deviceApi"
import Taro from '@tarojs/taro'
import { ParkingInfo } from "@/request/deviceApi/typings"
import { Loading } from "@nutui/nutui-react-taro"

export const ParkingCard = (props: {
  deviceIds: string[]
}) => {
  const { deviceIds } = props
  const [warningInfo, setWarningInfo] = useState<ParkingInfo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (deviceIds.length === 0) {
      return
    }

    setLoading(true)

    // 创建所有设备的请求数组
    const requests = deviceIds.map(deviceId =>
      DeviceAPI.parkList({
        page: 1,
        limit: 10,
        device_id: deviceId
      })
    )

    // 并行请求所有设备的数据
    Promise.all(requests)
      .then(responses => {
        // 处理所有设备的响应
        const allWarnings = responses.reduce((acc, res) => {
          if (res?.data && res.data.record_list.length > 0) {
            // 获取当前设备的最新日期
            const firstDate = new Date(res.data.record_list[0].occur_time).toDateString()

            // 过滤出该设备同一天的数据
            const filteredList = res.data.record_list
              .filter(item => new Date(item.occur_time).toDateString() === firstDate)
              .slice(0, 3) // 每个设备最多显示3条
              .map(item => ({
                ...item,
                sn: res.data.sn,
                deviceId: res.data.device_id
              }))

            return [...acc, ...filteredList]
          }
          return acc
        }, [])

        // 按时间排序，最新的在前面
        const sortedWarnings = allWarnings.sort((a, b) =>
          new Date(b.occur_time).getTime() - new Date(a.occur_time).getTime()
        )

        // 只取最新的6条记录
        setWarningInfo(sortedWarnings.slice(0, 6))
        setLoading(false)
      })
      .catch(error => {
        console.error('获取停车监控数据失败：', error)
        setLoading(false)
      })
  }, [deviceIds])

  const handleViewMore = (id) => {
    // 跳转到详情页时，默认展示第一个设备的数据
    Taro.navigateTo({
      url: `/pages/parking-detail/index?deviceId=${id}`
    })
  }

  const handleLocation = (info) => {
    Taro.getLocation({
      type: 'gcj02', //返回可以用于wx.openLocation的经纬度
      success() {
        const latitude = Number(info?.lat || 0)
        const longitude = Number(info?.lng || 0)
        Taro.openLocation({
          latitude,
          longitude,
          scale: 18,
          name: '车辆位置',
        })
      }
    })
  }

  const warningInfoList = () => {
    // 获取所有不同的 SN
    const uniqueSns = [...new Set(warningInfo.map(item => item.sn))]

    return uniqueSns.length === 1 ? (
      // 只有一个设备时的渲染
      <>
        {warningInfo.map((item, index) => (
          <View className="device-item" key={index}>
            <View className="device-info">
              <View className="device-name">车辆在熄火后有晃动，请检查车辆是否剐蹭</View>
              <View className="device-time">{item.occur_time}</View>
              <View className="device-time">设备SN：{item.sn}</View>
              {
                Number(item.lat) && Number(item.lng) ? (
                  <View className='location' onClick={() => handleLocation(item)}>查看位置</View>
                ) : null
              }
            </View>
          </View>
        ))}
        <View className="more" onClick={() => handleViewMore(warningInfo[0].deviceId)}>
          查看详情 <ArrowRight size={14} />
        </View>
      </>
    ) : (
      // 多个设备时的渲染，按 SN 分组
      uniqueSns.map(sn => {
        return (
          <View key={sn} className="sn-group">
            <View className="sn-header">
              <Text className="sn-text">设备：{sn}</Text>
              <View className="sn-more" onClick={() => handleViewMore(warningInfo
                .filter(item => item.sn === sn)[0].deviceId)}>
                查看详情
              </View>
            </View>
            {warningInfo
              .filter(item => item.sn === sn)
              .map((item, index) => (
                <View className="device-item" key={index}>
                  <View className="device-info">
                    <View className="device-name">车辆在熄火后有晃动，请检查车辆是否剐蹭</View>
                    <View className="device-time">{item.occur_time}</View>
                    {
                      Number(item.lat) && Number(item.lng) ? (
                        <View className='location' onClick={() => handleLocation(item)}>查看位置</View>
                      ) : null
                    }
                  </View>
                </View>
              ))}
          </View>
        )
      })
    )
  }

  return (
    <View className="parking-card">
      <View className="device-section">
        <View className="section-header">
          <View className="title">
            <Notice />
            <Text className="title-text">停车监控告警</Text>
          </View>
        </View>
        {
          deviceIds.length > 0 ?
            warningInfo.length === 0 ? (
              <View className="empty-state"> {
                loading ? <Loading type="spinner">加载中</Loading> :
                  <Text>暂无停车监控告警</Text>
              }
              </View>
            ) :
              <View className="park-warning">
                {warningInfoList()}
              </View>
            : <View className="empty-state">
              <Text>未绑定设备，无停车告警</Text>
            </View>
        }
      </View>
    </View>
  )
}