'use client'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

const COLORS = ['#6C5CE7','#00B894','#FF6B35','#FDCB6E','#A29BFE']

export function MiniRanking({ leagueId, myUserId }: { leagueId: string | null; myUserId: string | null }) {
  const supabase = createClient()
  const { data = [], isLoading } = useQuery({
    queryKey: ['mini-ranking', leagueId], enabled: !!leagueId, staleTime: 20_000, refetchInterval: 30_000,
    queryFn: async () => {
      const { data } = await supabase.from('portfolios')
        .select('id, user_id, roi_pct, total_value, profiles!inner(display_name)')
        .eq('league_id', leagueId!).order('roi_pct', { ascending: false }).limit(5)
      return (data ?? []).map((r, i) => {
        const p = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles as { display_name: string }
        return { rank: i + 1, user_id: r.user_id, name: p?.display_name ?? '', roi: r.roi_pct }
      })
    },
  })

  return (
    <div className="bg-white rounded-card border border-gray-100 shadow-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[15px] font-semibold text-gray-900">Ranking liga</h2>
        {leagueId && <Link href={`/league/${leagueId}`} className="text-xs text-purple hover:underline">Ver todo</Link>}
      </div>
      {isLoading && Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 py-2.5 animate-pulse">
          <div className="w-5 h-4 bg-gray-100 rounded" /><div className="w-8 h-8 rounded-full bg-gray-100" />
          <div className="flex-1 h-3 bg-gray-100 rounded" /><div className="h-3 bg-gray-100 rounded w-12" />
        </div>
      ))}
      {!isLoading && data.map((e, i) => {
        const isMe = e.user_id === myUserId
        return (
          <div key={e.user_id} className={`flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0 ${isMe ? 'rounded-btn bg-purple-bg -mx-5 px-5' : ''}`}>
            <span className={`w-5 text-center text-xs font-bold ${i < 3 ? 'text-orange' : 'text-gray-300'}`}>{i + 1}</span>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0" style={{ background: COLORS[i % COLORS.length] }}>
              {e.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <p className="flex-1 text-[13px] font-medium text-gray-900 truncate">
              {e.name}{isMe && <span className="ml-1.5 text-[10px] bg-purple text-white px-1.5 py-0.5 rounded-full">tú</span>}
            </p>
            <span className={`text-[13px] font-bold tabular ${e.roi >= 0 ? 'text-green' : 'text-red'}`}>{e.roi >= 0 ? '+' : ''}{e.roi.toFixed(1)}%</span>
          </div>
        )
      })}
    </div>
  )
}
