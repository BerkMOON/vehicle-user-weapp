# 易达安用户小程序文档

## 项目功能

### Index
首页用于设备管理与设备连接入口，围绕“查看设备状态、连接设备、进入设备功能页”展开。

#### 主要功能
- 登录态判断：未登录显示 `NotLogin` 组件。
- 设备绑定态判断：已登录但无设备时显示 `NotBind` 组件。
- 设备列表展示：展示设备号（`sn`）与车架号（`vin`）。
- 设备连接流程：
  - 点击“连接设备”后弹出操作指引。
  - 启动 WiFi 连接流程（Android 端会调用系统连接 WiFi）。
  - 轮询设备固件接口，拿到版本号后视为连接成功。
- 功能入口控制：
  - “查看”（`/pages/recorder/index`）和“设置”（`/pages/settings/index`）仅在设备连接成功后可点击。
  - 支持“解绑”设备（带确认弹窗）。
- 辅助功能：
  - 添加设备入口（`/pages/bind-car/index`）。
  - 教程视频预览（根据设备系统类型获取视频资源）。
  - 使用手册入口（`/pages/manual/index`）。
  - 华为及部分机型兼容提示：复制 H5 地址到剪贴板，引导浏览器访问。
  - 停车卡片展示：通过设备 ID 列表渲染 `ParkingCard`。

#### 接口说明
1. `DeviceAPI.list()`
   - 用途：获取用户绑定的设备列表。
   - 调用时机：页面初始化且登录成功后调用；解绑成功后再次调用刷新。
   - 关键返回：`data.device_list`（用于渲染设备列表与后续子组件入参）。

2. `DeviceAPI.unbind(sn)`
   - 用途：解绑指定设备。
   - 调用时机：用户点击“解绑”并在弹窗确认后调用。
   - 结果处理：成功后 toast 提示并重新拉取设备列表；失败提示错误信息。

3. `SettingAPI.getFirmwareVersion()`（通过 `handleRequest` 调用）
   - 用途：检测当前是否已连接到设备 WiFi，并读取固件版本。
   - 调用时机：用户开始连接后，前端每秒轮询一次，直到返回版本信息。
   - 关键逻辑：解析返回文本中的 `Camera.Menu.FWversion=xxx`，解析成功即标记连接成功并停止轮询。

4. `UserAPI.getInstruction({ needSynopsisPdf, needSynopsisVideo, system })`
   - 用途：获取连接设备教程资源（视频）。
   - 调用时机：用户点击“连接设备视频”卡片时调用。
   - 参数说明：`system` 根据终端判断为 `huawei` / `android` / `ios`。
   - 结果处理：拿到 `item_list[0].url` 后调用 `Taro.previewMedia` 播放。

5. `useAuth().handleSetDeviceInfo()`
   - 用途：同步或刷新全局设备信息（业务钩子）。
   - 调用时机：设备列表拉取完成后调用，用于全局状态联动。

### Cloud Album
云相册页用于查看和管理设备上传到云端的照片/视频，支持按设备、类型、日期筛选，并支持分页加载与删除。

#### 主要功能
- 登录态与绑定态判断：未登录显示 `NotLogin`，无设备时显示 `NotBind`。
- 筛选能力：
  - 设备筛选：默认选择设备列表第一台设备。
  - 类型筛选：支持 `停车拍照(shutdown)`、`照片(photos)`、`视频(videos)`。
  - 日期筛选：根据设备与类型动态拉取可选日期文件夹。
- 媒体列表展示：
  - 图片显示缩略图并支持 `previewImage` 预览。
  - 视频使用默认封面图并支持 `previewMedia` 播放。
  - 展示拍摄时间与文件大小（通过 `formatFileSize` 格式化）。
- 分页加载：
  - 首次/切换筛选时强制刷新列表。
  - 滚动到底部按 `next_token` 继续加载。
- 删除媒体：
  - 删除前二次确认。
  - 删除成功后本地列表同步移除并提示。
  - 删除路径会根据环境自动匹配 `test` 或 `prod` 前缀。

#### 接口说明
1. `DeviceAPI.list()`
   - 用途：获取用户设备列表，供设备筛选器使用。
   - 调用时机：页面初始化时调用一次。
   - 关键处理：若有设备，自动选中第一台设备并触发后续目录拉取。

2. `CloudAPI.getCloudFolders({ deviceId, type })`
   - 用途：获取指定设备、指定媒体类型下的日期文件夹列表。
   - 调用时机：`selectedDevice` 或 `selectedType` 变化时调用。
   - 参数说明：`deviceId` 使用 `eda_hz_${device_id}` 形式，`type` 对应筛选类型值。

3. `CloudAPI.getCloudPhoto({ nextToken, limit, deviceId, type, date })`
   - 用途：获取云端媒体列表（支持分页）。
   - 调用时机：
     - 选择日期后强制刷新调用（`isForce=true`）。
     - 列表滚动到底部且 `hasMore=true` 时继续调用。
   - 关键返回：
     - `data.photos`：当前批次媒体数据。
     - `data.next_token`：下一页游标，用于判断是否还有更多数据。

4. `CloudAPI.delCloudObject({ path, device_id })`
   - 用途：删除指定云端媒体对象。
   - 调用时机：用户点击删除并在确认弹窗中确认后调用。
   - 参数说明：
     - `path` 从媒体 URL 的 pathname 中提取，环境为测试时匹配 `/test/cloud/...`，生产时匹配 `/prod/cloud/...`，最终去掉开头 `/`。
     - `device_id` 取当前选中设备的 `device_id`。
   - 结果处理：成功后更新本地 `mediaList` 并提示“删除成功”。

### Recorder
记录仪页用于查看设备本地文件（图片/事件视频/普通视频）并支持刷新、分页加载、预览与下载后播放。

#### 主要功能
- 标签分类浏览：`photo`、`Event`、`DCIM`（以及本地下载分组占位）。
- 文件列表拉取：按分页参数请求设备 CGI 目录接口，并按日期分组展示。
- 多媒体预览：
  - 图片使用 `previewImage` 预览。
  - Android 端视频可直接 `previewMedia` 播放远程地址。
  - iOS 端视频先下载再播放（带下载进度与速度展示）。
- 列表刷新与上拉加载：支持手动刷新和滚动触底继续拉取。

#### 接口说明
1. `Taro.request({ url: ${BASE_URL}/cgi-bin/Config.cgi?... })`
   - 用途：从设备 CGI 接口拉取指定目录文件列表。
   - 调用时机：首次进入标签页、刷新、触底加载更多时。
   - 关键参数：`property`（标签类型）、`count`（每页数量）、`from`（偏移量）。

2. `Taro.downloadFile({ url })`
   - 用途：下载视频到临时文件（主要用于 iOS 播放前下载）。
   - 调用时机：点击视频且当前平台不适合直接流式预览时。
   - 结果处理：下载完成后用临时路径调用 `previewMedia` 播放。

### Settings
设置页用于管理记录仪参数，包括静音、音量、停车功能、拍照、存储与版本相关操作。

#### 主要功能
- 初始化读取设备状态：进入页面后读取存储、相机状态、菜单信息。
- 静音录像开关：
  - 关闭静音可直接执行。
  - 开启静音需要两次确认，强调事故责任判定与救援风险。
- 停车功能设置：支持停车监控、停车拍照开关。
- 音量设置：滑块调整扬声器音量（0-10）。
- 存储管理：展示容量占用并支持格式化。
- 版本信息：展示固件版本并提供恢复出厂设置入口。
- 设备拍照：远程触发设备拍照。

#### 接口说明
1. `SettingAPI.getStorageInfo()`
   - 用途：获取 TF 卡存储信息。
   - 调用时机：页面初始化时调用。
   - 结果处理：解析后渲染总量/已用/可用与进度条。

2. `SettingAPI.getCameraInfo()`
   - 用途：获取录音相关状态（如 `MovieAudio`）。
   - 调用时机：页面初始化时调用。
   - 结果处理：同步静音状态，若检测到静音可弹风险提示。

3. `SettingAPI.getMenuInfo()`
   - 用途：获取菜单配置（音量、停车监控、停车拍照、固件版本等）。
   - 调用时机：页面初始化时调用。

4. `SettingAPI.setMute(boolean)`
   - 用途：切换静音录像状态。
   - 调用时机：用户切换“静音录像”开关时调用。

5. `SettingAPI.setVolume(value)`
   - 用途：设置扬声器音量。
   - 调用时机：用户拖动音量滑块时调用。

6. `SettingAPI.setParkingMonitor('ENABLE'|'DISABLE')`
   - 用途：切换停车监控状态。
   - 调用时机：用户切换停车监控开关时调用。

7. `SettingAPI.setParkingCapture('ENABLE'|'DISABLE')`
   - 用途：切换停车拍照状态。
   - 调用时机：用户切换停车拍照开关时调用。

8. `SettingAPI.takePhoto()`
   - 用途：远程触发设备拍照。
   - 调用时机：点击“拍照”按钮时调用。

9. `SettingAPI.formatStorage()`
   - 用途：格式化存储（当前代码中也复用于“恢复出厂设置”按钮）。
   - 调用时机：确认格式化或恢复出厂设置后调用。

### Emergency
紧急视频页用于按设备查看云端紧急视频记录，支持分页播放与删除。

#### 主要功能
- 登录态与绑定态判断：未登录展示 `NotLogin`，无设备展示 `NotBind`。
- 设备筛选：默认选中第一台设备。
- 列表分页：按页码加载紧急视频，滚动触底继续请求。
- 视频预览：点击卡片使用 `previewMedia` 播放。
- 删除能力：支持删除单条紧急视频并本地同步更新。

#### 接口说明
1. `DeviceAPI.list()`
   - 用途：获取设备列表供筛选使用。
   - 调用时机：页面初始化时调用。

2. `CloudAPI.getEmergencyVideos({ page, limit, device_id })`
   - 用途：获取指定设备的紧急视频列表。
   - 调用时机：设备切换后加载第一页，触底时加载下一页。
   - 关键返回：`data.record_list`。

3. `CloudAPI.delEmergencyVideo({ device_id, id })`
   - 用途：删除指定紧急视频。
   - 调用时机：用户确认删除后调用。

### Bind Car
绑定设备页用于录入设备与车辆信息并完成设备绑定，支持扫码与 OCR 辅助填充。

#### 主要功能
- 支持路由参数回填：可通过 `sn` 参数预填设备号。
- 设备号录入：手输或扫码填充 `sn`。
- 车架号录入：手输或通过 OCR 识别填充 `vin`（支持行驶证/其他识别模式）。
- 车辆品牌与车型联动选择：先选品牌再选车型。
- 登录态控制：未登录展示登录弹窗，登录后可提交绑定。
- 绑定成功后重启到首页。

#### 接口说明
1. `DeviceAPI.bind({ sn, vin, phone, brand, car_model })`
   - 用途：提交设备绑定请求。
   - 调用时机：表单校验通过后提交。
   - 结果处理：成功提示后 `reLaunch` 到首页，失败显示后端返回信息。

2. `Taro.serviceMarket.invokeService({ service: 'wx79ac3de8be320b71', api: 'OcrAllInOne' })`
   - 用途：调用微信服务市场 OCR 能力识别车架号信息。
   - 调用时机：用户点击 OCR 图标并选图后调用。

### Mine
我的页用于账号展示与登录切换，同时提供使用手册/视频及协议入口。

#### 主要功能
- 展示当前手机号，支持微信手机号授权登录或切换账号。
- 使用说明入口：
  - 在线获取并打开 PDF 使用手册。
  - 在线获取并播放使用视频。
- 协议入口：跳转隐私协议与用户协议页面。

#### 接口说明
1. `useAuth().handleGetPhoneNumber(code)`
   - 用途：处理微信手机号授权换取登录态。
   - 调用时机：点击“立即登录/切换账号”并拿到 `code` 后调用。

2. `UserAPI.getInstruction({ needSynopsisPdf, needSynopsisVideo })`
   - 用途：获取手册 PDF 或教程视频资源。
   - 调用时机：点击“使用手册”或“使用视频”时调用。
   - 结果处理：PDF 下载后 `openDocument`，视频通过 `previewMedia` 播放。

### Manual
使用手册页为静态内容页，按主题分组展示绑定、连接、查看、下载、设置及常见问题说明。

#### 主要功能
- 使用 `CellGroup` + `Cell` 渲染多分组图文步骤说明。
- 不依赖后端接口，纯前端静态说明。

#### 接口说明
- 无业务接口调用。

### Parking Detail
停车告警明细页用于分页查看停车震动告警记录，并支持地图定位查看。

#### 主要功能
- 基于 `deviceId` 拉取停车告警记录并分页展示。
- 按日期分组展示告警时间与设备 SN。
- 有经纬度时可点击“查看位置”打开地图。

#### 接口说明
1. `DeviceAPI.parkList({ page, limit, device_id })`
   - 用途：获取停车告警记录列表。
   - 调用时机：`ScrollableList` 初始化和分页加载时调用。
   - 关键返回：`data.record_list` 与 `data.sn`。

### Coupons
优惠券页用于按状态分页查看优惠券列表，并进入详情页查看二维码与使用信息。

#### 主要功能
- Tab 分类：可使用 / 已使用。
- 分页列表：通过 `ScrollableTabList` 自动加载。
- 规则解析：解析 `rule` JSON 后展示券面信息（现金/保养/续保/实物）。
- 详情跳转：点击优惠券进入详情页。

#### 接口说明
1. `CouponAPI.getCouponList({ status, page, limit })`
   - 用途：获取优惠券列表。
   - 调用时机：切换状态 Tab 或分页加载时调用。

### Coupon Detail
优惠券详情页用于展示单券状态、规则、有效期，并生成二维码供核销使用。

#### 主要功能
- 根据路由参数 `id` 拉取单券详情。
- 解析规则并渲染券面信息。
- 基于 `id` 在 Canvas 生成二维码。

#### 接口说明
1. `CouponAPI.getCouponDetail(id)`
   - 用途：获取指定优惠券详情。
   - 调用时机：页面初始化时调用。

### Terms
协议页用于展示隐私协议或用户协议内容。

#### 主要功能
- 根据路由参数 `terms` 切换渲染内容（协议文本常量）。

#### 接口说明
- 无业务接口调用。

### Video Player
视频播放器页用于接收路由中的视频地址并全屏播放。

#### 主要功能
- 从路由参数读取并解码 `videoUrl`。
- 使用 `Video` 组件自动播放并启用进度拖动与全屏按钮。

#### 接口说明
- 无业务接口调用。

## 云相册存储配额与 VIP 方案（新增）

### 目标与背景
- 现状：云相册为免费无限存储，随着用户增长带来持续且不可控的云存储成本。
- 目标：
  - 为普通用户提供基础免费容量 `5GB`。
  - 提供 `VIP` 订阅方案，购买后可获得更高存储空间。
  - 在不影响现有浏览体验的前提下，新增容量可视化与超限拦截能力。

### 业务规则
#### 用户等级
- `FREE`：默认等级，存储总额 `5GB`。
- `VIP`：付费等级，存储总额按套餐配置（如 `20GB/100GB`，以运营配置为准）。

#### 容量计算口径
- 计费对象：云相册中的图片、视频、停车拍照、紧急视频等云端对象。
- 统计口径：按对象原始大小（Byte）累加，后端统一统计，前端仅展示。
- 删除行为：用户删除文件后，`used_bytes` 实时或准实时减少（建议分钟级以内完成）。

#### 上传与超限策略
- 当 `used_bytes + new_file_size > total_bytes` 时，允许本次上传成功，但系统自动删除“最老历史数据”直至容量回到阈值内。
- 淘汰范围：用户云端历史记录仪数据（图片/视频/停车拍照/紧急视频等），按时间从旧到新清理。
- 清理目标：至少释放 `used_bytes + new_file_size - total_bytes` 对应空间；若最后一条数据大于缺口，按整条对象删除。
- 当用户 VIP 到期且当前已用容量大于免费额度：
- 不禁止新增上传。
- 每次新增上传后执行自动淘汰，优先删除最老数据，保证“新数据优先保留”。

### 前端展示与交互（Cloud Album）
#### 页面新增展示
- 在云相册页顶部增加“存储容量卡片”：
  - 当前套餐：免费版 / VIP。
  - 已用/总量：如 `3.2GB / 5GB`。
  - 使用率进度条：`used_bytes / total_bytes`。
  - 状态提示：当使用率达到阈值时展示提醒（如 `80%`、`100%`）。

#### 超限提示文案
- 接近上限（>=80%）：`存储空间即将用完，建议及时清理或开通VIP。`
- 达到上限（>=100%）：`存储空间已满，暂时无法继续上传，请清理文件或开通VIP。`

#### 购买入口
- 在容量卡片提供“开通 VIP / 续费 VIP”按钮。
- 点击后跳转会员页（可新建 `/pages/vip/index`，或先跳 H5）。

### 接口改造建议
#### 1) 新增容量信息接口
- `UserAPI.getStorageQuota()`
- 用途：获取用户容量信息和会员状态。
- 建议返回：

```json
{
  "response_status": { "code": 200, "msg": "success" },
  "data": {
    "plan_type": "FREE",
    "plan_name": "免费版",
    "total_bytes": 5368709120,
    "used_bytes": 1288490188,
    "available_bytes": 4080218932,
    "usage_ratio": 0.24,
    "vip_expire_at": null
  }
}
```

#### 2) 上传相关接口统一返回容量校验错误
- 场景：云相册上传、停车拍照入云、紧急视频入云等写入云端的动作。
- 建议错误码：
- `CLOUD_STORAGE_RECYCLED`：上传成功，但触发了历史数据自动回收（建议用于前端提示）。
- `CLOUD_STORAGE_RECYCLE_FAILED`：上传或回收流程异常（需要告警与重试）。

#### 3) 新增会员套餐接口
- `UserAPI.getVipPlans()`
  - 用途：获取 VIP 套餐及可用容量配置。
- `UserAPI.createVipOrder(plan_id)`
  - 用途：创建会员订单并拉起支付。
- `UserAPI.getVipOrderStatus(order_id)`
  - 用途：轮询/查询支付结果，支付成功后刷新容量信息。

### 数据模型建议（后端）
- `user_storage_quota`
  - `user_id`
  - `plan_type` (`FREE`/`VIP`)
  - `total_bytes`
  - `used_bytes`
  - `vip_expire_at`
  - `updated_at`
- `vip_plan`
  - `plan_id`
  - `plan_name`
  - `duration_days`
  - `total_bytes`
  - `price`
  - `status`

### 运营与风控建议
- 新用户默认发放 `5GB` 免费容量（可运营配置）。
- VIP 到期后采用“新写入优先 + 历史自动淘汰”策略，降低存储上限失控风险。
- 容量统计建议每日全量校验 + 实时增量更新，避免统计漂移。
- 对异常高频上传账号做限流/告警，防止滥用。

### 验收标准（第一阶段）
- 免费用户总容量固定 `5GB`，可正确展示已用与剩余空间。
- 当容量满时，入云动作仍可成功，且系统自动清理最老历史数据到阈值内。
- 开通 VIP 后容量立即更新，上传恢复可用。
- VIP 到期后按规则降级，仍可新增上传；上传后按“最老优先”自动淘汰历史数据。

### 自动淘汰流程图（服务端）
```mermaid
flowchart TD
  A[上传请求到达] --> B[鉴权 + 参数校验]
  B --> C[读取用户配额 total_bytes/used_bytes]
  C --> D[预留上传空间并落库对象元数据为PENDING]
  D --> E[上传对象到对象存储]
  E --> F{上传是否成功}
  F -- 否 --> G[回滚预留空间 + 标记FAILED + 返回失败]
  F -- 是 --> H[标记对象ACTIVE并累计used_bytes]
  H --> I{used_bytes > total_bytes?}
  I -- 否 --> J[返回上传成功]
  I -- 是 --> K[按create_time升序查询可淘汰历史对象]
  K --> L[循环删除最老对象并累计释放空间]
  L --> M{used_bytes <= total_bytes?}
  M -- 否 --> L
  M -- 是 --> N[更新配额快照 + 记录回收日志]
  N --> O[返回上传成功(含recycled=true)]
```

### 并发安全伪代码（建议实现）
```text
function uploadWithAutoRecycle(userId, fileMeta, fileStream):
    # 1) 锁住用户配额，避免并发上传导致超删/漏删
    lockKey = "quota:user:" + userId
    acquireDistributedLock(lockKey, ttl=10s)

    try:
        quota = quotaRepo.getForUpdate(userId)   # SELECT ... FOR UPDATE
        if quota is null:
            quota = quotaRepo.initFreeQuota(userId, totalBytes=5GB)

        # 2) 先创建对象记录(PENDING)，防止上传成功但无元数据
        obj = objectRepo.create({
            userId: userId,
            sizeBytes: fileMeta.sizeBytes,
            status: "PENDING",
            mediaType: fileMeta.mediaType,
            createdAt: now()
        })

        # 3) 上传对象到存储
        putResult = storage.putObject(obj.id, fileStream)
        if !putResult.success:
            objectRepo.updateStatus(obj.id, "FAILED")
            return error("UPLOAD_FAILED")

        # 4) 上传成功，转为ACTIVE并增加已用容量
        objectRepo.updateStatus(obj.id, "ACTIVE")
        quota.usedBytes += obj.sizeBytes
        quotaRepo.save(quota)

        recycledBytes = 0
        recycledObjectIds = []

        # 5) 超额则自动淘汰(最老优先，不淘汰本次新上传对象)
        if quota.usedBytes > quota.totalBytes:
            needFree = quota.usedBytes - quota.totalBytes

            oldObjects = objectRepo.listRecyclableByOldest(
                userId=userId,
                excludeObjectId=obj.id,
                statuses=["ACTIVE"]
            )

            for oldObj in oldObjects:
                # 5.1 先删存储，再改状态，确保不会出现“状态删了但对象还在”
                delOk = storage.deleteObject(oldObj.id)
                if !delOk:
                    recycleLogRepo.create({
                        userId: userId,
                        objectId: oldObj.id,
                        action: "DELETE_FAILED",
                        reason: "STORAGE_DELETE_ERROR"
                    })
                    continue

                objectRepo.updateStatus(oldObj.id, "RECYCLED")
                quota.usedBytes -= oldObj.sizeBytes
                recycledBytes += oldObj.sizeBytes
                recycledObjectIds.append(oldObj.id)

                if quota.usedBytes <= quota.totalBytes:
                    break

            quotaRepo.save(quota)

        # 6) 记录审计日志，便于追查“为什么某文件被自动删除”
        recycleLogRepo.create({
            userId: userId,
            objectId: obj.id,
            action: "UPLOAD_SUCCESS",
            usedBytesAfter: quota.usedBytes,
            totalBytes: quota.totalBytes,
            recycledBytes: recycledBytes,
            recycledObjectIds: recycledObjectIds
        })

        return success({
            objectId: obj.id,
            recycled: recycledBytes > 0,
            recycledBytes: recycledBytes,
            usedBytes: quota.usedBytes,
            totalBytes: quota.totalBytes
        })

    finally:
        releaseDistributedLock(lockKey)
```

### 关键实现细节（避免线上坑）
- 并发控制：必须“用户维度串行化”处理上传+回收，推荐分布式锁 + 数据库行锁双保险。
- 排序依据：统一用对象创建时间 `created_at`（服务端写入时间），不要用客户端时间。
- 回收排除项：禁止回收本次刚上传成功的对象，避免“上传即被删”。
- 状态机建议：`PENDING -> ACTIVE -> RECYCLED/DELETED`，失败为 `FAILED`，便于可观测。
- 幂等处理：上传接口增加 `request_id`，重复请求直接返回首次结果，避免重复扣减/重复回收。
- 异常兜底：当删除存储失败时，不要先扣 `used_bytes`；应记录失败任务并异步重试。
- 可观测性：输出指标 `recycle_count`、`recycle_bytes`、`recycle_fail_count`、`quota_overflow_count`。

