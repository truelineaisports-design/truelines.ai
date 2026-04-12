import { UserButton } from '@clerk/nextjs'
import TabNav from '@/components/TabNav'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0f', color: '#ffffff' }}>
      <header style={{ 
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 40,
        backgroundColor: '#111118', borderBottom: '1px solid #2a2a3a',
        padding: '0 16px', height: '56px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <span style={{ color: '#00ff87', fontWeight: 'bold', fontSize: '18px' }}>TrueLinesAI</span>
<UserButton />      </header>
      <main style={{ paddingTop: '56px', paddingBottom: '96px', padding: '56px 16px 96px' }}>
        {children}
      </main>
      <TabNav />
    </div>
  )
}