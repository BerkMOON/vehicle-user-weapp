export interface FileItem {
  time: string
  size: string
  url: string
  selected?: boolean
  name: string
  format: string
  thumbnail?: string
}

export interface FileGroup {
  date: string
  files: FileItem[]
}

export interface DownloadItem extends FileItem {
  progress?: number
  tempFilePath?: string
  savedPath?: string
}

export interface Tab {
  title: string
  type: string
} 