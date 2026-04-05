import { UserButton } from '@clerk/nextjs'
import TabNav from '@/components/TabNav'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="fixed top-0 left-0 right-0 z-40 bg-gray-900
        border-b border-gray-800 px-4 h-14
        flex items-center justify-between">
        <span className="text-blue-400 font-bold text-lg">TrueLinesAI</span>
        <UserButton afterSignOutUrl="/sign-in" />
      </header>
      <main className="pt-14 pb-20 md:pb-4 px-4">
        {children}
      </main>
      <TabNav />
    </div>
  )
}