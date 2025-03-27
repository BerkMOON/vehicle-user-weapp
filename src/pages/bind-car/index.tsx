import { View } from '@tarojs/components'
import { Form, Input, Button } from '@nutui/nutui-react-taro'
import { Scan } from '@nutui/icons-react-taro'
import './index.scss'
import Taro, { useRouter } from '@tarojs/taro'
import { DeviceAPI } from '@/request/deviceApi'
import { SuccessCode } from '@/constants/constants'
import { useUserStore } from '@/store/user'
import { useAuth } from '@/hooks/useAuth'
import { useEffect } from 'react'

function BindCar() {
  const router = useRouter()
  const [form] = Form.useForm()

  const { userInfo: { phone } } = useUserStore()
  const { handleGetPhoneNumber } = useAuth()

  const getPhoneNumber = async (e) => {
    await handleGetPhoneNumber(e.detail.code)
  }

  useEffect(() => {
    // 处理页面参数
    if (router.params.sn) {
      form.setFieldsValue({
        sn: router.params.sn
      })
    }
  }, [router.params.sn])

  // 处理图像识别
  const handleOCR = async () => {
    try {
      // 先让用户选择识别类型
      const { tapIndex } = await Taro.showActionSheet({
        itemList: ['识别行驶证', '识别其他']
      })

      // 选择图片
      const { tempFilePaths } = await Taro.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['camera', 'album']
      })

      Taro.showLoading({
        title: '识别中...',
      })

      // 调用OCR识别
      //@ts-ignore
      const result = await Taro.serviceMarket.invokeService({
        service: 'wx79ac3de8be320b71',
        api: 'OcrAllInOne',
        data: {
          //@ts-ignore
          img_url: new Taro.serviceMarket.CDN({
            type: 'filePath',
            filePath: tempFilePaths[0],
          }),
          data_type: 3,
          ocr_type: tapIndex === 0 ? 3 : 8  // 根据选择设置不同的识别类型
        }
      })

      let vinNumber = ''
      if (tapIndex === 0) {
        // 驾驶证识别结果处理
        vinNumber = result?.data?.driving_res?.vin?.text
      } else {
        // 车架号铭牌识别结果处理
        const items = result?.data?.ocr_comm_res?.items || []
        const vinItem = items.find(item => item.text.startsWith('L'))
        vinNumber = vinItem?.text
      }

      if (vinNumber) {
        console.log('识别结果：', vinNumber)
        form.setFieldsValue({
          vin: vinNumber
        })
        form.validateFields(['vin'])
        Taro.hideLoading()
      } else {
        Taro.hideLoading()
        Taro.showToast({
          title: '未识别到有效信息',
          icon: 'none'
        })
      }
    } catch (error) {
      console.error('识别失败error.message：', error.message)
      Taro.hideLoading()
      Taro.showToast({
        title: '识别失败',
        icon: 'error'
      })
    }
  }

  const handleScan = async () => {
    try {
      const res = await Taro.scanCode({
        onlyFromCamera: false,
        scanType: ['qrCode', 'barCode']
      })

      if (res.result) {
        console.log('扫描结果：', res.result)
        form.setFieldsValue({
          sn: res.result
        })
        form.validateFields(['sn'])
      } else {
        Taro.showToast({
          title: '未获取到用户信息',
          icon: 'none'
        })
      }
    } catch (error) {
      console.error('扫码失败：', error)
      Taro.showToast({
        title: '扫码失败',
        icon: 'error'
      })
    }
  }

  const onSubmit = async (values) => {
    const res = await DeviceAPI.bind({
      ...values
    })

    if (res?.response_status.code === SuccessCode) {
      Taro.showToast({
        title: '绑定成功',
        icon: 'success',
        duration: 1000
      }).then(() => {
        // 返回上一页
        setTimeout(() => {
          Taro.reLaunch({
            url: '/pages/index/index'
          })
        }, 1000)
      })
    } else {
      Taro.showToast({
        title: res?.response_status?.msg || '绑定失败',
        icon: 'error'
      })
    }
  }

  return (
    <View className="bind-car-page">
      <Form form={form} onFinish={onSubmit} divider>
        <View className="input-with-actions">
          <Form.Item
            label="记录仪SIN号"
            name="sn"
            required
            rules={[{ required: true, message: '请输入记录仪SIN号' }]}
          >
            <Input
              className="form-input"
              placeholder="请输入记录仪SIN号"
              type="text"
              clearable
            />
          </Form.Item>
          <Scan onClick={handleScan} />
        </View>

        <View className="input-with-actions">
          <Form.Item
            label="车架号"
            name="vin"
            required
            rules={[{ required: true, message: '请输入车架号' }]}
          >
            <Input
              className="form-input"
              placeholder="请输入车架号"
              type="text"
              clearable
            />
          </Form.Item>
          <Scan onClick={handleOCR} />
        </View>

        <View className="form-actions">
          {
            !phone ? <Button block color="#2193B0" openType='getPhoneNumber' onGetPhoneNumber={getPhoneNumber}>
              登录获取手机号
            </Button> : <Button block color="#2193B0" formType="submit">
              绑定
            </Button>
          }
        </View>
      </Form>
    </View>
  )
}

export default BindCar