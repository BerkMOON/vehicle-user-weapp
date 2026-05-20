/// <reference types="@tarojs/taro" />

declare module '*.png';
declare module '*.gif';
declare module '*.jpg';
declare module '*.jpeg';
declare module '*.svg';
declare module '*.css';
declare module '*.less';
declare module '*.scss';
declare module '*.sass';
declare module '*.styl';
declare const TARO_APP_API_BASE_URL: string;
/** 业务域名下 H5 播放器页完整 URL（不含查询参数），留空表示未启用 web-view 播放 */
declare const TARO_APP_WEBVIEW_PLAYER_URL: string;

declare namespace NodeJS {
  interface ProcessEnv {
    TARO_ENV: 'weapp' | 'swan' | 'alipay' | 'h5' | 'rn' | 'tt' | 'quickapp' | 'qq' | 'jd'
  }
}


