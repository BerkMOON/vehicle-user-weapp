module.exports = {
  env: {
    NODE_ENV: '"development"'
  },
  defineConstants: {
    TARO_APP_API_BASE_URL: '"http://47.121.134.143:8890"'
  },
  mini: {
    devServer: {
      proxy: {
        '/api': {
          target: 'http://47.121.134.143:8890',
          changeOrigin: true,
          pathRewrite: {
            // 将 /api 替换为空字符串，即去掉请求路径中的 /api
            '^/api': ''
          }
        }
      }
    }
  },
  h5: {}
}
