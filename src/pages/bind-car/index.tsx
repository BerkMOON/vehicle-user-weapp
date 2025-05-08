import { View } from '@tarojs/components'
import { Form, Input, Button, Cell, Picker } from '@nutui/nutui-react-taro'
import { ArrowRight, Scan } from '@nutui/icons-react-taro'
import './index.scss'
import Taro, { useRouter } from '@tarojs/taro'
import { DeviceAPI } from '@/request/deviceApi'
import { Car_Brand_Options, Car_Options, SuccessCode } from '@/constants/constants'
import { useUserStore } from '@/store/user'
import { useEffect, useState } from 'react'
import LoginPopup from '@/components/LoginPopup'

function BindCar() {
  const router = useRouter()
  const [form] = Form.useForm()

  const { userInfo: { phone } } = useUserStore()
  const [showLogin, setShowLogin] = useState(false)
  const [carModel, setCarModel] = useState([])
  const car = Form.useWatch('car', form)

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

    const { car, car_model, ...parmas } = values
    const res = await DeviceAPI.bind({
      ...parmas,
      brand: car?.[0],
      car_model: car_model?.[0]
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

        <Form.Item
          label="手机号"
          name="phone"
          rules={[{ pattern: /^1\d{10}$/, message: '请输入正确的手机号' }]}
        >
          <Input
            className="form-input"
            placeholder="请输入手机号"
            type="text"
            clearable
          />
        </Form.Item>

        <Form.Item
          disabled
          label="车辆品牌"
          name="car"
          trigger="onConfirm"
          getValueFromEvent={(...args) => {
            // 当品牌改变时，重置车型选择
            setCarModel([])  // 重置状态
            form.resetFields(['car_model'])  // 使用 resetFields 替代 setFieldsValue
            return args[1]
          }}
          onClick={(_, ref: any) => {
            ref.open()
          }}
        >
          <Picker options={[Car_Brand_Options]}>
            {(value: any) => {
              return (
                <Cell
                  style={{
                    padding: 0,
                    //@ts-ignore
                    '--nutui-cell-divider-border-bottom': '0',
                  }}
                  className="nutui-cell--clickable"
                  title={
                    value.length
                      ? Car_Brand_Options.filter((po) => po.value === value[0])[0]
                        ?.text
                      : '请选择车辆品牌'
                  }
                  extra={<ArrowRight />}
                  align="center"
                />
              )
            }}
          </Picker>
        </Form.Item>

        <Form.Item
          label="车辆型号"
          name="car_model"
          trigger="onConfirm"
          getValueFromEvent={(...args) => {
            const selectedValue = args[1]
            setCarModel(selectedValue)  // 更新状态
            return selectedValue
          }}
          onClick={(_, ref: any) => {
            if (!car) {
              Taro.showToast({
                title: '请先选择车辆品牌',
                icon: 'none'
              })
              return
            }
            ref.open()
          }}
        >
          <Picker
            value={carModel}
            options={[Car_Options[car]]}>
            {(value: any) => {
              const displayValue = value.length ? value[0] : ''
              const options = Car_Options[car] || []
              const selectedOption = options.find((po) => po.value === displayValue)
              
              return (
                <Cell
                  style={{
                    padding: 0,
                    //@ts-ignore
                    '--nutui-cell-divider-border-bottom': '0',
                  }}
                  className="nutui-cell--clickable"
                  title={selectedOption?.text || '请选择车辆型号'}
                  extra={<ArrowRight />}
                  align="center"
                />
              )
            }}
          </Picker>
        </Form.Item>

        <View className="form-actions">
          {
            !phone ? <Button block color="#2193B0" onClick={() => setShowLogin(true)}>
              立即登录
            </Button> : <Button block color="#2193B0" formType="submit">
              绑定
            </Button>
          }
        </View>

        <LoginPopup
          visible={showLogin}
          onClose={() => setShowLogin(false)}
        />
      </Form>
    </View>
  )
}

export default BindCar