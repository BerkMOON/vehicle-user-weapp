import { BASE_URL } from "@/constants/constants"
import Taro from "@tarojs/taro"
import CryptoJS from 'crypto-js'

export const parseXML = (xmlString: string) => {
  const files: Array<{
    name: string
    size: string
    time: string
    format: string
  }> = []

  const fileRegex = /<file>([\s\S]*?)<\/file>/g
  const nameRegex = /<name>(.*?)<\/name>/
  const sizeRegex = /<size>(.*?)<\/size>/
  const timeRegex = /<time>(.*?)<\/time>/
  const formatRegex = /<format>(.*?)<\/format>/

  let match
  while ((match = fileRegex.exec(xmlString)) !== null) {
    const fileContent = match[1]
    const name = nameRegex.exec(fileContent)?.[1] || ''
    const size = sizeRegex.exec(fileContent)?.[1] || '0'
    const time = timeRegex.exec(fileContent)?.[1] || ''
    const format = formatRegex.exec(fileContent)?.[1] || ''

    files.push({ name, size, time, format })
  }

  return files
}

export const formatFileSize = (sizeInBytes: number) => {
  const mbSize = sizeInBytes / (1024 * 1024)
  if (mbSize < 1) { // 小于1MB (约102KB)
    return `${(sizeInBytes / 1024).toFixed(0)} KB`
  }
  return `${mbSize.toFixed(0)} MB`
} 

// 新增：处理缩略图 URL
export const getThumbnailUrl = (filePath: string) => {
  // 如果不是 mp4 文件，直接返回原始路径
  if (!filePath.toLowerCase().endsWith('.mp4')) {
    return `${BASE_URL}${filePath}`
  }

  // 处理 mp4 文件的缩略图
  const lastSlashIndex = filePath.lastIndexOf('/')
  if (lastSlashIndex === -1) return `${BASE_URL}${filePath}`

  const path = filePath.substring(0, lastSlashIndex)
  const filename = filePath.substring(lastSlashIndex + 1)
  const thumbnailName = filename.replace(/\.mp4$/i, '.jpg')

  return `${BASE_URL}${path}/.${thumbnailName}`
}

export const getRequestUrl = ( { action, property, value }: {action: string, property: string, value?: string} ) => {
  return `${BASE_URL}/cgi-bin/Config.cgi?action=${action}&property=${property}${value ? `&value=${value}` : ''}`
}

// 解析存储信息
export const parseStorageInfo = (data: string) => {
  const totalMatch = data.match(/LifeTimeTotal=(\d+\.?\d*)G/)
  const remainMatch = data.match(/RemainLifeTime=(\d+\.?\d*)G/)

  if (totalMatch && remainMatch) {
    const total = parseFloat(totalMatch[1])
    const free = parseFloat(remainMatch[1])
    const used = total - free
    const usedPercentage = Math.round((used / total) * 100)

    return {
      total: `${total.toFixed(1)}GB`,
      used: `${used.toFixed(1)}GB`,
      free: `${free.toFixed(1)}GB`,
      usedPercentage
    }
  }
  return null
}

// 简单的哈希函数
export const simpleHash = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

// 基础nonce生成
export const generateBasicNonce = () => {
  const timestamp = getSecondTimestamp();
  const random = Math.random().toString(36).substr(2, 8);
  return `${timestamp}_${random}`;
}

export const generateNonce = () => {
  const { platform, brand, model } = Taro.getDeviceInfo()
  const timestamp = getSecondTimestamp();
  const random = Math.random().toString(36).substr(2, 8);
  const deviceInfo = `${platform}_${brand}_${model}`.replace(/\s+/g, '');
  const hash = simpleHash(deviceInfo);
  const nonce = `${timestamp}_${hash}_${random}`;
  return nonce;
}

export const generateSignature = ({
  code,
  nonce,
  timestamp,
}) => {
  const message = `timestamp:${timestamp}-code:${code}-nonce:${nonce}`;
  const secretKey = '2*K4OWnF(D'; // 密钥
  const hmac = CryptoJS.HmacSHA256(message, secretKey);
  return hmac.toString(CryptoJS.enc.Hex);
}

export const getSecondTimestamp = () => {
  return Math.floor(Date.now() / 1000)
}