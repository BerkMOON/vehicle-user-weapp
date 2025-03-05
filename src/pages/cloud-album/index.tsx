import { View, Image } from '@tarojs/components'
import { useEffect, useState } from 'react'
import { useReachBottom } from '@tarojs/taro'
import './index.less'
import { CloudAPI } from '@/request/cloudApi'
import { Photos } from '@/request/cloudApi/typings'

export default function CloudAlbum() {
  const [photos, setPhotos] = useState<Photos[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const pageSize = 15

  const fetchPhotos = async (currentPage: number) => {
    if (!hasMore || loading) return

    setLoading(true)
    try {
      const res = await CloudAPI.getCloudPhoto({
        page: currentPage,
        limit: pageSize,
      })

      const newPhotos = res?.data.photos || []
      if (newPhotos.length < pageSize) {
        setHasMore(false)
      }

      setPhotos(prev => currentPage === 1 ? newPhotos : [...prev, ...newPhotos])
      setPage(currentPage)
    } catch (error) {
      console.error('获取照片失败：', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPhotos(1)
  }, [])

  // 监听滚动到底部
  useReachBottom(() => {
    if (hasMore && !loading) {
      fetchPhotos(page + 1)
    }
  })

  return (
    <View className='cloud-album'>
      <View className='photo-grid'>
        {photos.map(photo => (
          <View key={photo.id} className='photo-item'>
            <Image
              mode='aspectFill'
              src={photo.url}
              className='photo-image'
            />
          </View>
        ))}
      </View>

      {loading && (
        <View className='loading'>加载中...</View>
      )}

      {!hasMore && photos.length > 0 && (
        <View className='no-more'>没有更多照片了</View>
      )}
    </View>
  )
}