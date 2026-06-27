'use client'
import { use, useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { League } from '@/lib/supabase/types'

const COLORS = ['#6C5CE7','#00B894','#FF6B35','#FDCB6E','#A29BFE','#E17055']
const MEDALS = ['🥇','🥈','🥉']

export default function LeagueDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const supabase = createClient()
  const [userId, setUserId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => { supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null)) }, [])

  const { data: league } = useQuery({
    queryKey: ['league', id], staleTime: 60_000,
    queryFn: async (): Promise<League> => {
      const { data } = await supabase.from('leagues').select('*').eq('id', id).single()
      return data!
    },
  })

  const { data: ranking = [], isLoading } = useQuery({
    queryKey: ['ranking', id], staleTime: 10_000, refetchInterval: 15_000,
    queryFn: async () => {
      const { data } = await supabase.from('portfolios')
        .select('id, user_id, roi_pct, total_value, profiles!inner(display_name, username)')
        .eq('league_id', id).order('roi_pct', { ascending: false })
      return (data ?? []).map((r, i) => {
        const p = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles as { display_name: string; username: string }
        return { rank: i + 1, user_id: r.user_id, name: p?.display_name ?? '', username: p?.username ?? '', roi: r.roi_pct, total: r.total_value }
      })
    },
  })

  const fmt = (n: number) => n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 })
  const myEntry = ranking.find(r => r.user_id === userId)

  function copy() {
    if (league) { navigator.clipboard.writeText(league.invite_code.toUpperCase()); setCopied(true); setTimeout(() => setCopied(false), 2000) }
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-5">
      {league && (
        <div className="bg-white rounded-card border border-gray-100 shadow-card p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full mb-2 ${league.status === 'active' ? 'bg-orange-bg text-orange' : 'bg-gray-100 text-gray-500'}`}>
                {league.status === 'active' ? '● En curso' : league.status}
              </span>
              <h1 className="text-xl font-bold text-gray-900">{league.name}</h1>
              {league.description && <p className="text-sm text-gray-400 mt-1">{league.description}</p>}
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400 mb-0.5">Prize Pool</p>
              <p className="text-2xl font-black text-purple tabular">{fmt(league.prize_pool)}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-gray-50">
            {[['Participantes', String(ranking.length)], ['Entrada', fmt(league.entry_fee)], ['Capital inicial', fmt(league.starting_cash)]].map(([l, v]) => (
              <div key={l} className="text-center"><p className="text-base font-bold text-gray-900">{v}</p><p className="text-[11px] text-gray-400">{l}</p></div>
            ))}
          </div>
        </div>
      )}
      {myEntry && (
        <div className="bg-purple-bg rounded-card border border-purple/20 px-5 py-4 flex items-center gap-4">
          <span className="text-2xl">{MEDALS[myEntry.rank - 1] ?? `#${myEntry.rank}`}</span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-purple">Tu posición actual</p>
            <p className="text-xs text-purple/60">{fmt(myEntry.total)}</p>
          </div>
          <span className={`text-lg font-bold tabular ${myEntry.roi >= 0 ? 'text-green' : 'text-red'}`}>{myEntry.roi >= 0 ? '+' : ''}{myEntry.roi.toFixed(2)}%</span>
        </div>
      )}
      <div className="bg-white rounded-card border border-gray-100 shadow-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[15px] font-semibold text-gray-900">Clasificación en tiempo real</h2>
          <span className="inline-flex items-center gap-1.5 bg-orange-bg text-orange rounded-full px-2.5 py-0.5 text-xs font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-orange animate-pulse" />Live
          </span>
        </div>
        {isLoading && Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-3.5 animate-pulse">
            <div className="w-6 h-6 bg-gray-100 rounded" /><div className="w-10 h-10 bg-gray-100 rounded-full" />
            <div className="flex-1 space-y-1.5"><div className="h-3.5 bg-gray-100 rounded w-32" /></div>
            <div className="h-3.5 bg-gray-100 rounded w-16" />
          </div>
        ))}
        {ranking.map((e, i) => {
          const isMe = e.user_id === userId
          return (
            <div key={e.user_id} className={`flex items-center gap-4 py-3.5 border-b border-gray-50 last:border-0 ${isMe ? 'rounded-btn bg-purple-bg -mx-5 px-5' : ''}`}>
              <div className="w-6 text-center text-sm">{MEDALS[i] ?? <span className="text-xs font-bold text-gray-300">{i + 1}</span>}</div>
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0" style={{ background: COLORS[i % COLORS.length] }}>
                {e.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{e.name}{isMe && <span className="ml-1.5 text-[10px] bg-purple text-white px-1.5 py-0.5 rounded-full">tú</span>}</p>
                <p className="text-xs text-gray-400">@{e.username}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-semibold text-gray-900 tabular">{fmt(e.total)}</p>
                <p className={`text-xs font-bold tabular ${e.roi >= 0 ? 'text-green' : 'text-red'}`}>{e.roi >= 0 ? '+' : ''}{e.roi.toFixed(2)}%</p>
              </div>
            </div>
          )
        })}
      </div>
      {league && (
        <div className="bg-white rounded-card border border-gray-100 shadow-card p-5">
          <h2 className="text-[15px] font-semibold text-gray-900 mb-3">Código de invitación</h2>
          <div className="flex items-center gap-3">
            <code className="flex-1 bg-page rounded-btn px-4 py-3 text-lg font-mono font-bold text-purple tracking-widest text-center">{league.invite_code.toUpperCase()}</code>
            <button onClick={copy} className="px-4 py-3 rounded-btn bg-purple text-white text-sm font-medium hover:bg-purple-dark transition-colors">{copied ? '¡Copiado!' : 'Copiar'}</button>
          </div>
        </div>
      )}
    </div>
  )
}
