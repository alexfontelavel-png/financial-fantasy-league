'use client'
import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

type Filter = 'all' | 'buy' | 'sell'

export default function HistoryPage() {
  const supabase = createClient()
  const [userId, setUserId] = useState<string | null>(null)
  const [filter, setFilter] = useState<Filter>('all')
  const [search, setSearch] = useState('')

  useEffect(() => { supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null)) }, [])

  const { data: txs = [], isLoading } = useQuery({
    queryKey: ['all-transactions', userId], enabled: !!userId, staleTime: 30_000,
    queryFn: async () => {
      const { data } = await supabase.from('transactions')
        .select('*, portfolios!inner(user_id)')
        .eq('portfolios.user_id', userId!)
        .order('executed_at', { ascending: false }).limit(100)
      return data ?? []
    },
  })

  type Tx = { id: string; type: string; ticker: string; company_name: string; shares: number; price_per_share: number; total_amount: number; executed_at: string }
  const filtered = txs.filter((tx: Tx) => (filter === 'all' || tx.type === filter) && (!search || tx.ticker.includes(search.toUpperCase()) || tx.company_name.toLowerCase().includes(search.toLowerCase())))
  const fmt = (n: number) => n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 })
  const bought = txs.filter((t: Tx) => t.type === 'buy').reduce((a: number, t: Tx) => a + Number(t.total_amount), 0)
  const sold   = txs.filter((t: Tx) => t.type === 'sell').reduce((a: number, t: Tx) => a + Number(t.total_amount), 0)

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-5">
      <div><h1 className="text-xl font-bold text-gray-900">Historial</h1><p className="text-sm text-gray-400 mt-0.5">Registro completo de operaciones</p></div>
      <div className="grid grid-cols-3 gap-3">
        {[['Operaciones', String(txs.length), ''], ['Total comprado', fmt(bought), 'text-red'], ['Total vendido', fmt(sold), 'text-green']].map(([l, v, c]) => (
          <div key={l} className="bg-white rounded-card border border-gray-100 shadow-card px-4 py-3">
            <p className="text-[11px] text-gray-400 mb-1">{l}</p>
            <p className={`text-base font-bold tabular ${c || 'text-gray-900'}`}>{v}</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-card border border-gray-100 shadow-card p-4 flex items-center gap-3 flex-wrap">
        <div className="flex gap-1">
          {(['all', 'buy', 'sell'] as Filter[]).map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === f ? 'bg-purple text-white' : 'text-gray-400 hover:text-gray-600 bg-page'}`}>
              {f === 'all' ? 'Todo' : f === 'buy' ? 'Compras' : 'Ventas'}
            </button>
          ))}
        </div>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Filtrar por ticker..."
          className="flex-1 bg-page rounded-btn border border-gray-100 px-3 py-1.5 text-xs text-gray-700 placeholder:text-gray-400 outline-none" />
      </div>
      <div className="bg-white rounded-card border border-gray-100 shadow-card overflow-hidden">
        {isLoading && Array.from({ length: 4 }).map((_, i) => <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-gray-50 animate-pulse"><div className="w-9 h-9 bg-gray-100 rounded-xl" /><div className="flex-1 h-3 bg-gray-100 rounded" /><div className="h-3 bg-gray-100 rounded w-20" /></div>)}
        {!isLoading && filtered.length === 0 && <p className="text-sm text-gray-400 py-10 text-center">Sin operaciones aún.</p>}
        {!isLoading && filtered.map((tx: Tx) => (
          <div key={tx.id} className="flex items-center gap-4 px-5 py-4 border-b border-gray-50 last:border-0">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold text-white shrink-0 ${tx.type === 'buy' ? 'bg-purple' : 'bg-red'}`}>{tx.type === 'buy' ? 'C' : 'V'}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">{tx.ticker} <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${tx.type === 'buy' ? 'bg-purple-bg text-purple' : 'bg-red-bg text-red'}`}>{tx.type === 'buy' ? 'Compra' : 'Venta'}</span></p>
              <p className="text-xs text-gray-400 mt-0.5">{Number(tx.shares).toFixed(4)} acc. · ${Number(tx.price_per_share).toFixed(2)}/acc.</p>
            </div>
            <div className="text-right shrink-0">
              <p className={`text-sm font-bold tabular ${tx.type === 'buy' ? 'text-red' : 'text-green'}`}>{tx.type === 'buy' ? '-' : '+'}{fmt(Number(tx.total_amount))}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">{new Date(tx.executed_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
