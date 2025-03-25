export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/mine/index',
    'pages/recorder/index',
    'pages/video-player/index',
    'pages/downloads/index',
    'pages/settings/index',
    'pages/live/index',
    'pages/manual/index',
    'pages/coupons/index',
    'pages/coupons/detail/index',
    'pages/bind-car/index',
    'pages/cloud-album/index',  // 添加云相册页面
    'pages/terms/index',
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#fff',
    navigationBarTitleText: 'WeChat',
    navigationBarTextStyle: 'black',
  },
  tabBar: {
    custom: false,
    color: '#999999',
    selectedColor: '#2193B0',
    backgroundColor: '#ffffff',
    list: [
      {
        pagePath: 'pages/index/index',
        text: '首页',
        iconPath: './assets/tabbar/home.png',
        selectedIconPath: './assets/tabbar/home-active.png'
      },
      {
        pagePath: 'pages/cloud-album/index',
        text: '云相册',
        iconPath: './assets/tabbar/folder.png',
        selectedIconPath: './assets/tabbar/folder-active.png'
      },
      {
        pagePath: 'pages/mine/index',
        text: '我的',
        iconPath: './assets/tabbar/user.png',
        selectedIconPath: './assets/tabbar/user-active.png'
      }
    ]
  },
  permission: {
    'scope.userLocation': {
      desc: '你的位置信息将用于小程序位置接口的效果展示',
    },
    "scope.writePhotosAlbum": {
      "desc": "保存文件到相册"
    },
    "scope.camera": {
      "desc": "用于拍照识别文字"
    }
  },
})
