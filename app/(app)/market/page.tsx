'use client'
import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { TradePanel } from '@/components/dashboard/TradePanel'
import type { Portfolio, League } from '@/lib/supabase/types'

const POPULAR = ['AAPL','TSLA','NVDA','META','MSFT','AMZN','GOOGL','AMD']

export default function MarketPage() {
  const supabase = createClient()
  const [search, setSearch] = useState('')
  const [ticker, setTicker] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => { supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null)) }, [])

  const { data: portfolioData } = useQuery({
    queryKey: ['active-portfolio', userId], enabled: !!userId, staleTime: 60_000,
    queryFn: async (): Promise<{ portfolio: Portfolio; league: League } | null> => {
      const { data } = await supabase.from('league_members')
        .select('leagues!inner(id,name,status,starting_cash,end_date), portfolios!left(*)')
        .eq('user_id', userId!).eq('status', 'active').eq('leagues.status', 'active').limit(1).single()
      if (!data) return null
      const r = data as { leagues: League; portfolios: Portfolio[] | null }
      const portfolio = Array.isArray(r.portfolios) ? r.portfolios[0] : null
      return portfolio ? { portfolio, league: r.leagues } : null
    },
  })

  const { data: quote, isLoading: quoteLoading } = useQuery({
    queryKey: ['quote', ticker], enabled: !!ticker, staleTime: 15_000, refetchInterval: 15_000,
    queryFn: async () => {
      const res = await fetch(`/api/market/quote?ticker=${ticker}`)
      if (!res.ok) return null
      return res.json() as Promise<{ ticker: string; price: number; open: number; high: number; low: number; volume: number; changePercent: number; change: number }>
    },
  })

  const { data: results = [] } = useQuery({
    queryKey: ['search', search], enabled: search.length >= 1, staleTime: 60_000,
    queryFn: async () => {
      const res = await fetch(`/api/market/search?q=${encodeURIComponent(search)}`)
      return res.json() as Promise<Array<{ ticker: string; name: string; primaryExchange: string }>>
    },
  })

  const fmtN = (n: number) => n.toLocaleString('es-ES', { minimumFractionDigits: 2 })
  const fmtV = (n: number) => n >= 1e6 ? `${(n / 1e6).toFixed(2)}M` : n >= 1000 ? `${(n / 1000).toFixed(0)}K` : String(n)

  return (
    <div className="flex flex-col gap-5">
      <div><h1 className="text-xl font-bold text-gray-900">Mercado</h1><p className="text-sm text-gray-400 mt-0.5">Cotizaciones en tiempo real vía Polygon.io</p></div>
      <div className="bg-white rounded-card border border-gray-100 shadow-card p-5">
        <div className="relative">
          <div className="flex items-center gap-3 bg-page rounded-btn border border-gray-100 px-4 py-3 focus-within:border-purple focus-within:ring-1 focus-within:ring-purple transition-colors">
            <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar empresa o ticker..."
              className="flex-1 bg-transparent text-sm text-gray-800 placeholder:text-gray-400 outline-none" />
          </div>
          {results.length > 0 && (
            <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white rounded-card border border-gray-100 shadow-md overflow-hidden">
              {results.slice(0, 6).map(r => (
                <button key={r.ticker} onMouseDown={() => { setTicker(r.ticker); setSearch(`${r.ticker} — ${r.name}`) }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-page text-left border-b border-gray-50 last:border-0">
                  <div className="w-8 h-8 rounded-lg bg-purple-bg flex items-center justify-center text-[11px] font-bold text-purple shrink-0">{r.ticker.slice(0, 2)}</div>
                  <div className="flex-1 min-w-0"><p className="text-xs font-semibold text-gray-900">{r.ticker}</p><p className="text-[11px] text-gray-400 truncate">{r.name}</p></div>
                  <span className="text-[10px] text-gray-300">{r.primaryExchange}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        {!ticker && (
          <div className="mt-4"><p className="text-xs text-gray-400 mb-2">Más buscados</p>
            <div className="flex flex-wrap gap-2">
              {POPULAR.map(t => <button key={t} onClick={() => { setTicker(t); setSearch(t) }} className="px-3 py-1.5 rounded-full bg-page text-sm font-mono font-medium text-gray-600 hover:bg-purple-bg hover:text-purple transition-colors border border-gray-100">{t}</button>)}
            </div>
          </div>
        )}
      </div>
      {ticker && (
        <div className="grid grid-cols-[1fr_320px] gap-5 items-start">
          <div className="bg-white rounded-card border border-gray-100 shadow-card p-5">
            {quoteLoading && <div className="animate-pulse space-y-3"><div className="h-8 bg-gray-100 rounded w-32" /><div className="h-6 bg-gray-100 rounded w-24" /></div>}
            {quote && (
              <>
                <div className="flex items-start justify-between gap-4 mb-5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-purple-bg flex items-center justify-center text-base font-black text-purple">{ticker.slice(0, 2)}</div>
                    <div><h2 className="text-lg font-bold text-gray-900">{ticker}</h2><p className="text-xs text-gray-400">Datos vía Polygon.io</p></div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-gray-900 tabular">${fmtN(quote.price)}</p>
                    <p className={`text-sm font-semibold tabular ${quote.changePercent >= 0 ? 'text-green' : 'text-red'}`}>{quote.changePercent >= 0 ? '+' : ''}{quote.changePercent.toFixed(2)}%</p>
                  </div>
                </div>
                <div className="divide-y divide-gray-50">
                  {[['Apertura', `$${fmtN(quote.open)}`], ['Máximo', `$${fmtN(quote.high)}`], ['Mínimo', `$${fmtN(quote.low)}`], ['Variación', `${quote.change >= 0 ? '+' : ''}$${Math.abs(quote.change).toFixed(2)}`], ['Volumen', fmtV(quote.volume)]].map(([l, v]) => (
                    <div key={l} className="flex justify-between py-2.5 text-sm"><span className="text-gray-400">{l}</span><span className="font-semibold text-gray-900">{v}</span></div>
                  ))}
                </div>
              </>
            )}
          </div>
          <TradePanel portfolio={portfolioData?.portfolio ?? null} leagueId={portfolioData?.league.id ?? null} initialTicker={ticker} />
        </div>
      )}
    </div>
  )
}
