import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Topbar } from '@/components/layout/Topbar'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return (
    <div className="min-h-screen bg-page">
      <Topbar />
      <main className="max-w-7xl mx-auto px-6 py-6">{children}</main>
    </div>
  )
}
