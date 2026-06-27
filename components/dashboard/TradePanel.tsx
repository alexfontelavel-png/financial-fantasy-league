'use client'
import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { clsx } from 'clsx'
import type { Portfolio } from '@/lib/supabase/types'

interface Props { portfolio: Portfolio | null; leagueId: string | null; initialTicker?: string }

export function TradePanel({ portfolio, leagueId, initialTicker }: Props) {
  const qc = useQueryClient()
  const [type, setType] = useState<'buy' | 'sell'>('buy')
  const [ticker, setTicker] = useState(initialTicker ?? '')
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ ok: boolean; msg: string } | null>(null)

  useEffect(() => { if (initialTicker) setTicker(initialTicker) }, [initialTicker])

  const { data: quote } = useQuery({
    queryKey: ['quote', ticker], enabled: ticker.length >= 1, staleTime: 15_000, refetchInterval: 15_000,
    queryFn: async () => {
      const res = await fetch(`/api/market/quote?ticker=${ticker}`)
      if (!res.ok) return null
      return res.json() as Promise<{ price: number; changePercent: number }>
    },
  })

  const cash = portfolio?.cash_balance ?? 0
  const amt = parseFloat(amount) || 0
  const price = quote?.price ?? 0
  const shares = price > 0 ? (amt / price).toFixed(4) : '0'
  const canBuy = type === 'buy' ? amt <= cash : true
  const fmt = (n: number) => n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 })

  async function execute() {
    if (!portfolio || !ticker || amt <= 0) return
    setLoading(true)
    const res = await fetch('/api/trade', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ portfolioId: portfolio.id, ticker: ticker.toUpperCase(), type, amountEur: amt }),
    })
    const data = await res.json()
    setLoading(false)
    if (data.success) {
      setToast({ ok: true, msg: `${type === 'buy' ? 'Compra' : 'Venta'} ejecutada: ${data.shares?.toFixed(4)} acc. de ${ticker.toUpperCase()} a €${data.pricePerShare?.toFixed(2)}` })
      setAmount('')
      qc.invalidateQueries({ queryKey: ['portfolio', leagueId] })
      qc.invalidateQueries({ queryKey: ['positions'] })
    } else {
      setToast({ ok: false, msg: data.error ?? 'Error desconocido' })
    }
    setTimeout(() => setToast(null), 5000)
  }

  return (
    <div className="bg-white rounded-card border border-gray-100 shadow-card p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-semibold text-gray-900">Ejecutar orden</h2>
        <span className="text-xs text-gray-400 bg-page px-2.5 py-1 rounded-full">Cash: <strong className="text-gray-700">{fmt(cash)}</strong></span>
      </div>
      <div className="flex items-center gap-2 bg-page rounded-btn border border-gray-100 px-3 py-2.5 focus-within:border-purple focus-within:ring-1 focus-within:ring-purple transition-colors">
        <input value={ticker} onChange={e => setTicker(e.target.value.toUpperCase())} placeholder="AAPL, TSLA, NVDA..."
          className="bg-transparent text-sm font-mono font-bold text-gray-800 placeholder:text-gray-400 outline-none flex-1" />
        {quote && <span className="text-sm font-bold text-gray-900 tabular shrink-0">${price.toFixed(2)}</span>}
      </div>
      {quote && (
        <div className="flex items-center justify-between bg-page rounded-btn px-3 py-2">
          <span className="text-xs text-gray-400">{ticker.toUpperCase()}</span>
          <span className={clsx('text-xs font-semibold tabular', quote.changePercent >= 0 ? 'text-green' : 'text-red')}>
            {quote.changePercent >= 0 ? '+' : ''}{quote.changePercent.toFixed(2)}%
          </span>
        </div>
      )}
      <div className="grid grid-cols-2 gap-2">
        {(['buy', 'sell'] as const).map(t => (
          <button key={t} onClick={() => setType(t)}
            className={clsx('py-2 rounded-btn text-sm font-semibold transition-colors',
              type === t ? (t === 'buy' ? 'bg-purple text-white' : 'bg-red text-white') : 'bg-page text-gray-400 hover:text-gray-600'
            )}>
            {t === 'buy' ? 'Comprar' : 'Vender'}
          </button>
        ))}
      </div>
      <div className="bg-page rounded-btn border border-gray-100 focus-within:border-purple focus-within:ring-1 focus-within:ring-purple transition-colors px-4 py-3">
        <p className="text-[11px] text-gray-400 mb-1">Importe en euros</p>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-gray-300">€</span>
          <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" min="0" step="0.01"
            className="bg-transparent text-xl font-bold text-gray-900 outline-none flex-1 tabular placeholder:text-gray-200" />
        </div>
      </div>
      {amt > 0 && price > 0 && <p className="text-xs text-gray-400 -mt-2 px-1">≈ {shares} acciones de {ticker.toUpperCase()}</p>}
      {type === 'buy' && amt > 0 && !canBuy && <p className="text-xs text-red -mt-2 px-1">Saldo insuficiente ({fmt(cash)} disponible)</p>}
      <div className="flex gap-2">
        {[25, 50, 75, 100].map(pct => (
          <button key={pct} onClick={() => setAmount(((cash * pct) / 100).toFixed(2))}
            className="flex-1 text-xs py-1.5 rounded-full bg-page text-gray-400 hover:bg-purple-bg hover:text-purple transition-colors">
            {pct}%
          </button>
        ))}
      </div>
      <button onClick={execute} disabled={!ticker || amt <= 0 || !canBuy || !price || loading}
        className={clsx('w-full py-3 rounded-btn text-white text-sm font-semibold transition-colors disabled:opacity-40',
          type === 'buy' ? 'bg-purple hover:bg-purple-dark' : 'bg-red hover:opacity-90'
        )}>
        {loading ? 'Ejecutando...' : type === 'buy' ? 'Comprar acciones' : 'Vender acciones'}
      </button>
      {toast && (
        <div className={clsx('text-xs rounded-btn px-3 py-2.5 leading-snug', toast.ok ? 'bg-green-bg text-green' : 'bg-red-bg text-red')}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}
