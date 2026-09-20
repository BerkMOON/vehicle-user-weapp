import { create } from 'zustand'
import type { MembershipStatus } from '@/request/useApi/typings'
import {
  canPurchaseMembership,
  formatCloudDaysLabel,
  normalizeMembershipStatus,
  resolveCloudDaysFromStatus,
  resolveLevelName
} from '@/utils/membership'

interface MembershipState {
  ready: boolean
  info: MembershipStatus | null
  setFromSelfInfo: (membership?: MembershipStatus | null, phone?: string) => void
  clear: () => void
}

export const useMembershipStore = create<MembershipState>((set) => ({
  ready: false,
  info: null,

  setFromSelfInfo: (membership, phone) => {
    set({
      ready: true,
      info: normalizeMembershipStatus(membership, phone)
    })
  },

  clear: () => {
    set({ ready: false, info: null })
  }
}))

/** 派生字段：在组件里用 selector 或本函数读取 */
export function getMembershipView(state: MembershipState) {
  const info = state.info
  const cloudDays = resolveCloudDaysFromStatus(info)
  return {
    ready: state.ready,
    info,
    isActive: !!info?.is_active,
    levelName: resolveLevelName(info),
    cloudDays,
    canViewCycleVideo: cloudDays > 0,
    canPurchase: canPurchaseMembership(info),
    cloudDaysLabel: formatCloudDaysLabel(cloudDays)
  }
}
