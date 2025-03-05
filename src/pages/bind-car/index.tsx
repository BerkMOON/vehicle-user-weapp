import { View } from '@tarojs/components'
import { Form, Input, Button } from '@nutui/nutui-react-taro'
import { Scan } from '@nutui/icons-react-taro'
import './index.scss'
import Taro from '@tarojs/taro'

function BindCar() {
  const [form] = Form.useForm()

  // 处理图像识别
  const handleOCR = async (fieldName: string) => {
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
          // img_url: tempFilePaths[0],
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
          [fieldName]: text
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

  const onSubmit = (values) => {
    console.log('form values:', values)
    // TODO: 调用绑定车辆接口
    Taro.showToast({
      title: '绑定成功',
      icon: 'success',
      duration: 2000
    }).then(() => {
      // 返回上一页
      setTimeout(() => {
        Taro.navigateBack()
      }, 2000)
    })
  }

  return (
    <View className="bind-car-page">
      <Form form={form} onFinish={onSubmit} divider>
        <Form.Item
          label="车牌号码"
          name="plateNumber"
          required
          rules={[{ required: true, message: '请输入车牌号码' }]}
        >
          <Input
            className="form-input"
            placeholder="请输入车牌号码"
            type="text"
          />
        </Form.Item>

        <Form.Item
          label="记录仪SIN号"
          name="sinNumber"
          required
          rules={[{ required: true, message: '请输入记录仪SIN号' }]}
        >
          <View className="input-with-actions">
            <Input
              className="form-input"
              placeholder="请输入记录仪SIN号"
              type="text"
            />
            <Button
              className="action-button"
              type="primary"
              onClick={() => handleOCR('sinNumber')}
            >
              <Scan />
            </Button>
          </View>
        </Form.Item>

        <Form.Item
          label="车架号"
          name="vinNumber"
          required
          rules={[{ required: true, message: '请输入车架号' }]}
        >
          <View className="input-with-actions">
            <Input
              className="form-input"
              placeholder="请输入车架号"
              type="text"
            />
            <Scan onClick={() => handleOCR('vinNumber')} />
          </View>
        </Form.Item>

        <Form.Item
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
        </Form.Item>

        <Form.Item
          label="车主姓名"
          name="ownerName"
          required
          rules={[{ required: true, message: '请输入车主姓名' }]}
        >
          <Input
            className="form-input"
            placeholder="请输入车主姓名"
            type="text"
          />
        </Form.Item>

        <View className="form-actions">
          <Button block type="primary" formType="submit">
            提交
          </Button>
        </View>
      </Form>
    </View>
  )
}

export default BindCar