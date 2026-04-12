import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type RiskTier = 'conservative' | 'standard' | 'aggressive'
type ActiveTab = 'parlay' | 'bankroll' | 'fade' | 'live-props'

interface UserPreferences {
  favoriteTeams: string[]
  notificationsEnabled: boolean
}

interface AppState {
  activeTab: ActiveTab
  riskTier: RiskTier
  userPreferences: UserPreferences
  setActiveTab: (tab: ActiveTab) => void
  setRiskTier: (tier: RiskTier) => void
  setUserPreferences: (prefs: Partial<UserPreferences>) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      activeTab: 'parlay',
      riskTier: 'standard',
      userPreferences: { favoriteTeams: [], notificationsEnabled: false },
      setActiveTab: (tab) => set({ activeTab: tab }),
      setRiskTier: (tier) => set({ riskTier: tier }),
      setUserPreferences: (prefs) =>
        set((state) => ({
          userPreferences: { ...state.userPreferences, ...prefs }
        })),
    }),
    { name: 'trueline-app-store' }
  )
)