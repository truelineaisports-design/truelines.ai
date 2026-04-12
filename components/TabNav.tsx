'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { TrendingUp, DollarSign, Users, Zap } from 'lucide-react'

const tabs = [
  { name: 'Parlays', href: '/parlay', icon: TrendingUp },
  { name: 'Bankroll', href: '/bankroll', icon: DollarSign },
  { name: 'Fade Public', href: '/fade', icon: Users },
  { name: 'Live Props', href: '/live-props', icon: Zap },
]

export default function TabNav() {
  const pathname = usePathname()
  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
      backgroundColor: '#111118', borderTop: '1px solid #2a2a3a'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', height: '64px' }}>
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = pathname.startsWith(tab.href)
          return (
            <Link key={tab.href} href={tab.href} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: '4px', padding: '8px 12px', textDecoration: 'none',
              color: isActive ? '#00ff87' : '#6b7280',
              transition: 'color 0.2s'
            }}>
              <Icon size={22} />
              <span style={{ fontSize: '12px', fontWeight: 500 }}>{tab.name}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}