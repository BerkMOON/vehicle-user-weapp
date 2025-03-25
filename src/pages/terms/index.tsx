import { View, Text } from '@tarojs/components'
import { useRouter } from '@tarojs/taro'
import { termsContent, privacyContent } from '@/constants/agreement'
import { useEffect, useState } from 'react'
import './index.scss'

function Terms() {
  const router = useRouter()
  const [content, setContent] = useState('')

  useEffect(() => {
    setContent(router.params.terms === 'term' ? termsContent : privacyContent)
  }, [router.params.terms])

  return (
    <View className='terms-page'>
      <View className='content'>
        <Text>{content}</Text>
      </View>
    </View>
  )
}

export default Terms