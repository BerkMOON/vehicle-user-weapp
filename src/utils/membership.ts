import type { MembershipStatus } from '@/request/useApi/typings'

export type MembershipTier = 'none' | 'STANDARD' | 'PREMIUM' | 'ULTIMATE'

/** 首年赠送会员商品码 */
export const GIFT_MEMBERSHIP_PRODUCT_CODE = 'BASIC'

export const APP_DOWNLOAD_URL = 'https://eda-official.ai-kaka.com/download.html'

export function isGiftMembership(productCode?: string | null) {
  return String(productCode || '').toUpperCase() === GIFT_MEMBERSHIP_PRODUCT_CODE
}

/** 非会员或赠送会员可提示去 App 开通；已付费会员不强调开通 */
export function canPurchaseMembership(info: MembershipStatus | null) {
  if (!info?.is_active) return true
  return isGiftMembership(info.product_code)
}

export function resolveMembershipTier(productCode?: string | null): MembershipTier {
  const code = String(productCode || '').toUpperCase()
  if (code === 'BASIC') return 'STANDARD'
  if (code === 'STANDARD' || code === 'PREMIUM' || code === 'ULTIMATE') return code
  return 'none'
}

export function resolveCloudDaysByTier(tier: MembershipTier) {
  if (tier === 'ULTIMATE') return 30
  if (tier === 'PREMIUM') return 15
  if (tier === 'STANDARD') return 1
  return 0
}

export function resolveTierDisplayName(tier: MembershipTier) {
  if (tier === 'ULTIMATE') return '至尊会员'
  if (tier === 'PREMIUM') return '优享会员'
  if (tier === 'STANDARD') return '普通会员'
  return '非会员'
}

export function resolveMembershipDisplayName(productCode?: string | null) {
  if (isGiftMembership(productCode)) return '赠送会员'
  return resolveTierDisplayName(resolveMembershipTier(productCode))
}

export function formatCloudDaysLabel(days: number) {
  if (days <= 0) return '不可查看'
  if (days === 1) return '约 24 小时'
  return `${days} 天`
}

export function resolveCloudDaysFromStatus(info: MembershipStatus | null) {
  if (!info?.is_active) return 0
  const fromBenefits = info.benefits?.cycle_video_days
  if (typeof fromBenefits === 'number' && Number.isFinite(fromBenefits)) {
    return Math.max(0, Math.floor(fromBenefits))
  }
  return resolveCloudDaysByTier(resolveMembershipTier(info.product_code))
}

export function normalizeMembershipStatus(
  membership?: MembershipStatus | null,
  phone?: string
): MembershipStatus {
  if (!membership) {
    return {
      phone: phone || '',
      product_code: '',
      status: 2,
      is_active: false,
      benefits: {
        parking_photo: false,
        parking_monitor: false,
        cycle_video_days: 0
      }
    }
  }
  return {
    phone: membership.phone || phone || '',
    product_code: membership.product_code || '',
    product_name: membership.product_name,
    valid_from: membership.valid_from,
    valid_until: membership.valid_until,
    status: Number(membership.status) || (membership.is_active ? 1 : 2),
    is_active: !!membership.is_active,
    benefits: membership.benefits
  }
}

export function resolveLevelName(info: MembershipStatus | null) {
  if (!info?.is_active) return '非会员'
  if (isGiftMembership(info.product_code)) return '赠送会员'
  if (info.product_name) return info.product_name
  return resolveMembershipDisplayName(info.product_code) || '会员'
}

/** 行车视频可选日期：0 无；1=今天+昨天；>1=最近 N 自然日 */
export function getCycleVideoDateOptions(cloudDays = 1) {
  const n = Math.max(0, Math.floor(Number(cloudDays) || 0))
  if (n <= 0) {
    return [] as { label: string; value: string }[]
  }
  const count = n === 1 ? 2 : n
  const options: { label: string; value: string }[] = []
  for (let i = 0; i < count; i++) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const value = `${y}-${m}-${day}`
    let label = value
    if (i === 0) label = `今天 (${value})`
    else if (i === 1) label = `昨天 (${value})`
    options.push({ label, value })
  }
  return options
}

export function normalizeCycleDateYMD(raw: unknown, cloudDays = 1) {
  const options = getCycleVideoDateOptions(cloudDays)
  if (!options.length) return ''
  const today = options[0].value
  if (raw == null || raw === '') return today
  const matched = String(raw).trim().match(/(\d{4}-\d{2}-\d{2})/)
  const ymd = matched ? matched[1] : String(raw)
  if (options.some((o) => o.value === ymd)) return ymd
  return today
}
