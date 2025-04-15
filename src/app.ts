import { useDidShow, useDidHide } from '@tarojs/taro'
// 全局样式
import './app.scss'
import { useUserStore } from './store/user'
import { useAuth } from './hooks/useAuth'

function App(props) {
  // 可以使用所有的 React Hooks
  // 使用 useEffect 来控制 useAuth 的初始化时机
  useAuth()
  // 对应 onShow
  useDidShow(() => {
    useUserStore.getState().initializeFromStorage()
  })

  // 对应 onHide
  useDidHide(() => {})

  return props.children
}

export default App
