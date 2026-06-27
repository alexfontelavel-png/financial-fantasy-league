'use client'
import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { PnLChart } from '@/components/dashboard/PnLChart'
import { TopAssets } from '@/components/dashboard/TopAssets'
import { TradePanel } from '@/components/dashboard/TradePanel'
import { MiniRanking } from '@/components/dashboard/MiniRanking'
import type { League, Portfolio, Position } from '@/lib/supabase/types'

function KpiCard({ label, value, sub, subGreen }: { label: string; value: string; sub?: string; subGreen?: boolean }) {
  return (
    <div className="bg-white rounded-card border border-gray-100 shadow-card px-5 py-4">
      <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-[22px] font-bold text-gray-900 tabular">{value}</p>
      {sub && <p className={`text-[11px] mt-1 ${subGreen ? 'text-green' : 'text-gray-400'}`}>{sub}</p>}
    </div>
  )
}

export default function DashboardPage() {
  const supabase = createClient()
  const [leagueId, setLeagueId] = useState<string | null>(null)
  const [focusTicker, setFocusTicker] = useState<string | undefined>()
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null))
  }, [])

  const { data: leagues = [] } = useQuery({
    queryKey: ['my-leagues', userId], enabled: !!userId,
    queryFn: async (): Promise<League[]> => {
      const { data } = await supabase.from('league_members')
        .select('leagues!inner(*)')
        .eq('user_id', userId!).eq('status', 'active').eq('leagues.status', 'active')
      return (data ?? []).map((r: { leagues: League }) => r.leagues)
    },
  })

  useEffect(() => { if (leagues.length > 0 && !leagueId) setLeagueId(leagues[0]?.id ?? null) }, [leagues, leagueId])

  const league = leagues.find(l => l.id === leagueId) ?? null

  const { data: portfolio } = useQuery({
    queryKey: ['portfolio', leagueId, userId], enabled: !!leagueId && !!userId,
    queryFn: async (): Promise<Portfolio | null> => {
      const { data } = await supabase.from('portfolios').select('*').eq('league_id', leagueId!).eq('user_id', userId!).single()
      return data
    },
  })

  const { data: positions = [], isLoading: posLoading } = useQuery({
    queryKey: ['positions', portfolio?.id], enabled: !!portfolio?.id,
    queryFn: async (): Promise<Position[]> => {
      const { data } = await supabase.from('positions').select('*').eq('portfolio_id', portfolio!.id).order('current_value', { ascending: false })
      return data ?? []
    },
  })

  const fmt = (n: number) => n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 })
  const tv  = portfolio?.total_value ?? (league?.starting_cash ?? 100000)
  const cb  = portfolio?.cash_balance ?? (league?.starting_cash ?? 100000)
  const sc  = league?.starting_cash ?? 100000
  const roi = portfolio?.roi_pct ?? 0
  const pnl = tv - sc

  return (
    <div className="flex flex-col gap-5">
      {leagues.length > 1 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-400">Liga activa:</span>
          {leagues.map(l => (
            <button key={l.id} onClick={() => setLeagueId(l.id)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${leagueId === l.id ? 'bg-purple text-white' : 'bg-white text-gray-500 border border-gray-100 hover:border-purple hover:text-purple'}`}>
              {l.name}
            </button>
          ))}
        </div>
      )}
      {leagues.length === 0 && (
        <div className="bg-white rounded-card border border-gray-100 shadow-card p-10 text-center">
          <p className="font-semibold text-gray-900 mb-1">Sin ligas activas</p>
          <p className="text-sm text-gray-400 mb-4">Crea una liga o únete con un código de invitación.</p>
          <a href="/league" className="inline-flex px-4 py-2 rounded-btn bg-purple text-white text-sm font-medium">Ir a Ligas</a>
        </div>
      )}
      {league && (
        <>
          <div className="grid grid-cols-3 gap-3">
            <KpiCard label="Valor del portfolio" value={fmt(tv)} sub={`${roi >= 0 ? '+' : ''}${roi.toFixed(2)}% ROI`} subGreen={roi >= 0} />
            <KpiCard label="P&L total" value={(pnl >= 0 ? '+' : '') + fmt(pnl)} sub={`desde inicio · ${fmt(sc)}`} subGreen={pnl >= 0} />
            <KpiCard label="Cash disponible" value={fmt(cb)} sub={portfolio ? `${fmt(portfolio.invested_value)} invertido` : 'Sin posiciones'} />
          </div>
          <div className="grid grid-cols-[1fr_320px] gap-5 items-start">
            <div className="flex flex-col gap-5">
              <PnLChart />
              <TopAssets positions={positions} isLoading={posLoading} onSelectTicker={setFocusTicker} />
            </div>
            <div className="flex flex-col gap-4">
              <div className="rounded-card p-5" style={{ background: '#6C5CE7' }}>
                <p className="text-[11px] font-medium uppercase tracking-wide mb-1" style={{ color: 'rgba(255,255,255,.6)' }}>Prize Pool · {league.name}</p>
                <p className="text-[28px] font-black text-white tabular">{fmt(league.prize_pool)}</p>
                <div className="flex justify-between mt-3">
                  <p className="text-[11px]" style={{ color: 'rgba(255,255,255,.5)' }}>{Math.round(league.prize_pool / league.entry_fee)} participantes · {fmt(league.entry_fee)}/entrada</p>
                  <a href={`/league/${league.id}`} className="text-[11px] font-semibold" style={{ color: 'rgba(255,255,255,.8)' }}>Ver ranking →</a>
                </div>
                <div className="mt-3 h-1 rounded-full" style={{ background: 'rgba(255,255,255,.2)' }}>
                  <div className="h-1 rounded-full" style={{ background: '#FF6B35', width: '60%' }} />
                </div>
              </div>
              <TradePanel portfolio={portfolio ?? null} leagueId={leagueId} initialTicker={focusTicker} />
              <MiniRanking leagueId={leagueId} myUserId={userId} />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
