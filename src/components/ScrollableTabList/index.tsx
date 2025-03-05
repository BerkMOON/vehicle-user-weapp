import { ScrollView, View } from '@tarojs/components'
import { Empty, Skeleton, Tabs } from '@nutui/nutui-react-taro'
import { forwardRef, useEffect, useImperativeHandle, useState } from 'react'
import './index.scss'

export interface TabItem {
  title: string
  value: string
}

interface ScrollableTabListProps<T> {
  tabs: TabItem[]
  activeTab: string
  onTabChange: (value: string) => void
  fetchData: (params: { status: string; page: number; isLoadMore?: boolean }) => Promise<T[]>
  renderItem: (item: T) => JSX.Element
  emptyText?: string
  pageSize?: number
  autoLoad?: boolean
  className?: string
}

const ScrollableTabList = forwardRef(<T,>(props: ScrollableTabListProps<T>, ref) => {
  const {
    tabs,
    activeTab,
    onTabChange,
    fetchData,
    renderItem,
    emptyText = '暂无数据',
    pageSize = 10,
    autoLoad = true,
    className = ''
  } = props
  const [loading, setLoading] = useState(false)
  const [isSkeletonShow, setIsSkeletonShow] = useState(true)
  const [dataMap, setDataMap] = useState<Record<string, T[]>>({})
  const [pagesMap, setPagesMap] = useState<Record<string, number>>({})
  const [hasMoreMap, setHasMoreMap] = useState<Record<string, boolean>>(
    tabs.reduce((acc, tab) => ({ ...acc, [tab.value]: true }), {})
  )

  const handleFetch = async (status: string, isLoadMore = false) => {
    if (loading || (isLoadMore && !hasMoreMap[status])) return
    setLoading(true)
    try {
      const currentPage = isLoadMore ? (pagesMap[status] || 1) : 1
      const list = await fetchData({ status, page: currentPage, isLoadMore })

      if (list.length < pageSize) {
        setHasMoreMap(prev => ({ ...prev, [status]: false }))
      }
      setDataMap(prev => ({
        ...prev,
        [status]: isLoadMore ? [...(prev[status] || []), ...list] : list
      }))
      setPagesMap(prev => ({
        ...prev,
        [status]: isLoadMore ? currentPage + 1 : 2
      }))
    } catch (error) {
      console.error('加载数据失败：', error)
    } finally {
      setLoading(false)
      setIsSkeletonShow(false)
    }
  }

  const handleTabChange = (value: string) => {
    onTabChange(value)
    if (!dataMap[value]) {
      setIsSkeletonShow(true)
      handleFetch(value)
    }
  }

  const onScrollToLower = () => {
    if (!hasMoreMap[activeTab] || loading) return
    handleFetch(activeTab, true)
  }

  useEffect(() => {
    if (autoLoad) {
      handleFetch(activeTab)
    }
  }, [])

  // 添加刷新方法
  const refresh = () => {
    setDataMap({})
    setPagesMap({})
    setHasMoreMap(
      tabs.reduce((acc, tab) => ({ ...acc, [tab.value]: true }), {})
    )
    handleFetch(activeTab)
  }

  // 暴露刷新方法
  useImperativeHandle(ref, () => ({
    refresh
  }))

  return (
    <Tabs value={activeTab} onChange={handleTabChange} className={className}>
      {tabs.map(tab => (
        <Tabs.TabPane key={tab.value} title={tab.title} value={tab.value}>
          <ScrollView
            scrollY
            className='scrollable-tab-list'
            onScrollToLower={onScrollToLower}
          >
            <View className='scroll-view-content'>
              <Skeleton rows={10} title animated visible={!isSkeletonShow}>
                {dataMap[activeTab]?.length === 0 ? (
                  <Empty description={emptyText} />
                ) : (
                  <>
                    {dataMap[activeTab]?.map(renderItem)}
                    {loading && <View className="loading">加载中...</View>}
                    {!hasMoreMap[activeTab] && <View className="no-more">没有更多了</View>}
                  </>
                )}
              </Skeleton>
            </View>
          </ScrollView>
        </Tabs.TabPane>
      ))}
    </Tabs>
  )
})

export default ScrollableTabList