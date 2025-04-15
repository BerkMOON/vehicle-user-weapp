import { View } from '@tarojs/components'
import { useState } from 'react'
import './index.scss'
import { Tips } from '@nutui/icons-react-taro'

interface BublePopProps {
  content: string | React.ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
  children?: React.ReactNode
}

function BublePop({ content, position = 'top', children }: BublePopProps) {
  const [showPopover, setShowPopover] = useState(false)

  return (
    <View className='bubble-container'>
      <View 
        className='bubble-trigger'
        onClick={() => setShowPopover(!showPopover)}
      >
        {children || <Tips />}
      </View>
      {showPopover && (
        <View className={`bubble-content bubble-${position}`}>
          {content}
          <View className={`bubble-arrow bubble-arrow-${position}`} />
        </View>
      )}
    </View>
  )
}

export default BublePop