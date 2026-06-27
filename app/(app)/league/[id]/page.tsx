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
        .select('user_id, roi_pct, total_value')
        .eq('league_id', id).order('roi_pct', { ascending: false })
      return (data ?? []).map((r, i) => ({
        rank: i + 1,
        user_id: r.user_id,
        name: r.user_id.slice(0, 8),
        username: r.user_id.slice(0, 8),
        roi: r.roi_pct,
        total: r.total_value
      }))
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
              {league.description && <p className="text-sm text-gray-400
