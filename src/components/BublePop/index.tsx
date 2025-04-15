import { useState } from 'react'
import './index.scss'
import { Popover } from '@nutui/nutui-react-taro'

interface BublePopProps {
  content: string
  position?: 'top' | 'bottom' | 'left' | 'right'
  children?: React.ReactNode
}

function BublePop({ content, position = 'top', children }: BublePopProps) {
  const [showPopover, setShowPopover] = useState(false)

  return (
    <>
      <Popover
        className="buble"
        visible={showPopover}
        location={position}
        list={[
          {
            key: 'key1',
            name: content,
          },
        ]}
        onClick={() => {
          showPopover ? setShowPopover(false) : setShowPopover(true)
        }}
      >
        {children}
      </Popover>
    </>
  )
}

export default BublePop