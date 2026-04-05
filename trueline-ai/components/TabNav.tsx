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
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden
      bg-gray-900 border-t border-gray-800">
      <div className="flex items-center justify-around h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = pathname.startsWith(tab.href)
          return (
            <Link key={tab.href} href={tab.href}
              className={`flex flex-col items-center gap-1 px-3 py-2
                transition-colors duration-200
                ${isActive ? "text-blue-400" : "text-gray-500 hover:text-gray-300"}`}
            >
              <Icon size={22} />
              <span className="text-xs font-medium">{tab.name}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}