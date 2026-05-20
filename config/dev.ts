module.exports = {
  env: {
    NODE_ENV: '"development"'
  },
  defineConstants: {
    // TARO_APP_API_BASE_URL: '"http://121.41.14.63:8890"',
    TARO_APP_API_BASE_URL: '"https://eda-consumer.ai-kaka.com"',
    /** 行车视频 TS：HTTPS 下的播放器页；微信公众平台需将域名加入「业务域名」 */
    TARO_APP_WEBVIEW_PLAYER_URL: '"https://eda-web-view.ai-kaka.com"'
  },
  mini: {},
  h5: {}
}
