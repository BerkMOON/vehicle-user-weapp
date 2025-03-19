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
      // 选择图片
      const { tempFilePaths } = await Taro.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['camera', 'album']
      })

      // 调用OCR识别
      //@ts-ignore
      const result = await Taro.serviceMarket.invokeService({
        service: 'wx79ac3de8be320b71', // 通用印刷体识别
        api: 'OcrAllInOne',
        data: {
          //@ts-ignore
          img_url: new Taro.serviceMarket.CDN({
            type: 'filePath',
            filePath: tempFilePaths[0],
          }),
          data_type: 3,
          ocr_type: 3
        }
      })

      // 解析结果并填充表单
      if (result?.data?.driving_res?.vin?.text) {
        const text = result?.data?.driving_res?.vin?.text
        console.log('识别结果：', text)
        form.setFieldsValue({
          vin: text
        })
      } else {
        Taro.showToast({
          title: '未识别到有效信息',
          icon: 'none'
        })
      }
    } catch (error) {
      console.error('识别失败error.message：', error.message)
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
        scanType: ['qrCode']
      })

      if (res.result) {
        console.log('扫描结果：', res.result)
        form.setFieldsValue({
          sn: res.result
        })
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
            />
          </Form.Item>
          <Scan onClick={handleOCR} />
        </View>

        {/* <Form.Item
          label="手机号码"
          name="phoneNumber"
          required
          rules={[
            { required: true, message: '请输入手机号码' },
            { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码' }
          ]}
        >
          <Input
            className="form-input"
            placeholder="请输入手机号码"
            type="number"
          />
        </Form.Item> */}

        <View className="form-actions">
          {
            !phone ? <Button block color="#4e54c8" openType='getPhoneNumber' onGetPhoneNumber={getPhoneNumber}>
              登录获取手机号
            </Button> : <Button block color="#4e54c8" formType="submit">
              绑定
            </Button>
          }
        </View>
      </Form>
    </View>
  )
}

export default BindCar