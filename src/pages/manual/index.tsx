import { View, Text } from '@tarojs/components'
import { Cell, CellGroup } from '@nutui/nutui-react-taro'
import './index.scss'

function Manual() {
  const manualSections = [
    {
      title: '绑定记录仪',
      content: [
        '1. 点击添加设备或者绑定设备',
        '2. 输入设备编号及用户信息',
        '3. 点击绑定',
        '4. 我的设备中会有设备信息',
      ]
    },
    {
      title: '连接记录仪',
      content: [
        '1. 语音说出"打开WiFi"，切换记录仪至WiFi模式',
        '2. 等待记录仪语音提示："WiFi模式切换成功"',
        '3. 打开手机WiFi设置',
        '4. 找到并连接名为"SG10_XXX"的WiFi',
        '5. 输入WiFi密码：12345678',
        '6. 等待WiFi连接成功'
      ]
    },
    {
      title: '查看记录仪视频',
      content: [
        '1. 确保WiFi已连接成功',
        '2. 在首页点击"查看"',
        '3. 可以查看历史视频和抓拍图片',
      ]
    },
    {
      title: '下载保存记录仪内容',
      content: [
        '1. 确保WiFi已连接成功',  
        '2. 在首页点击"记录仪查看"',
        '3. 长按图片或者视频进行保存',
        '4. 保存完成后可在手机相册中查看',
        '5. Ios系统无法连接下载时，请将进入设置 -> APP -> 微信 -> 本地网络设置，打开本地网络设置'
      ]
    },
    {
      title: '设置记录仪参数',
      content: [
        '1. 在首页点击"记录仪设置"',
        '2. 可设置录音开关',
        '3. 可调整存储空间设置',
        '4. 设置完成后自动保存'
      ]
    },
    {
      title: '常见问题',
      content: [
        '• 如果无法连接设备，请检查WiFi连接',
        '• Ios系统无法连接下载时，请将进入设置 -> APP -> 微信 -> 本地网络设置进行打开',
        '• 如遇其他问题，请联系客服'
      ]
    }
  ]

  return (
    <View className='manual-page'>
      <View className='manual-header'>
        <Text className='manual-title'>使用指南</Text>
      </View>

      <View className='manual-content'>
        {manualSections.map((section, index) => (
          <CellGroup key={index} title={section.title}>
            {section.content.map((item, idx) => (
              <Cell key={idx}>
                <Text>{item}</Text>
              </Cell>
            ))}
          </CellGroup>
        ))}
      </View>
    </View>
  )
}

export default Manual