import { View, Text, ScrollView } from '@tarojs/components'
import { useEffect, useState } from 'react'
import './index.scss'

interface ScrollableListProps<T> {
  // 获取数据的函数
  fetchData: (params: { page: number }) => Promise<T[]>
  // 渲染列表项的函数
  renderItem: (item: T) => React.ReactNode
  // 空状态文本
  emptyText?: string
  // 每页数据量
  pageSize?: number
  // 是否自动加载第一页
  autoLoad?: boolean
  // 列表容器的类名
  className?: string
  // 列表容器的样式
  style?: React.CSSProperties
}

function ScrollableList<T>({
  fetchData,
  renderItem,
  emptyText = '暂无数据',
  pageSize = 20,
  autoLoad = true,
  className = '',
  style = {}
}: ScrollableListProps<T>) {
  const [list, setList] = useState<T[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  const loadData = async (pageNum: number) => {
    if (!hasMore && pageNum > 1) return
    
    setLoading(true)
    try {
      const data = await fetchData({ page: pageNum })
      
      // 判断是否还有更多数据
      setHasMore(data.length === pageSize)
      
      // 更新列表数据
      setList(prev => pageNum === 1 ? data : [...prev, ...data])
    } catch (error) {
      console.error('获取数据失败：', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (autoLoad) {
      loadData(1)
    }
  }, [])

  const handleScrollToLower = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1
      setPage(nextPage)
      loadData(nextPage)
    }
  }

  return (
    <ScrollView
      className={`scrollable-list ${className}`}
      style={style}
      scrollY
      onScrollToLower={handleScrollToLower}
    >
      {loading && page === 1 ? (
        <View className='loading'>
          <Text>加载中...</Text>
        </View>
      ) : list.length === 0 ? (
        <View className='empty-state'>
          <Text>{emptyText}</Text>
        </View>
      ) : (
        <View className='list-content'>
          {list.map((item, index) => (
            <View key={index} className='list-item'>
              {renderItem(item)}
            </View>
          ))}
          {loading && page > 1 && (
            <View className='loading-more'>
              <Text>加载更多...</Text>
            </View>
          )}
          {!hasMore && list.length > 0 && (
            <View className='no-more'>
              <Text>没有更多数据了</Text>
            </View>
          )}
        </View>
      )}
    </ScrollView>
  )
}

export default ScrollableList