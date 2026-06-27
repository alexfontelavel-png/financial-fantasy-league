'use client'
import type { Position } from '@/lib/supabase/types'

const LOGO_COLORS: Record<string, { bg: string; color: string }> = {
  AAPL: { bg: '#F0F0F5', color: '#1a1a2e' }, META: { bg: '#E8F4FF', color: '#0081FB' },
  NVDA: { bg: '#F0F9E0', color: '#76B900' }, TSLA: { bg: '#FFF0F0', color: '#CC0000' },
  AMZN: { bg: '#FFF8EC', color: '#FF9900' }, GOOGL: { bg: '#E8F4FF', color: '#4285F4' },
  MSFT: { bg: '#E8F4FF', color: '#00A4EF' },
}

export function TopAssets({ positions, isLoading, onSelectTicker }: {
  positions: Position[]; isLoading: boolean; onSelectTicker: (t: string) => void
}) {
  const fmt = (n: number) => n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 })
  const sorted = [...positions].sort((a, b) => b.current_value - a.current_value)
  const style = (t: string) => LOGO_COLORS[t] ?? { bg: '#F0EEFF', color: '#6C5CE7' }

  return (
    <div className="bg-white rounded-card border border-gray-100 shadow-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[15px] font-semibold text-gray-900">Top Assets</h2>
        <span className="inline-flex items-center gap-1.5 bg-orange-bg text-orange rounded-full px-2.5 py-0.5 text-xs font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-orange animate-pulse" />LIVE · Polygon
        </span>
      </div>
      {isLoading && Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 py-3 animate-pulse">
          <div className="w-9 h-9 rounded-xl bg-gray-100" />
          <div className="flex-1 space-y-1.5"><div className="h-3 bg-gray-100 rounded w-24" /><div className="h-2.5 bg-gray-100 rounded w-14" /></div>
          <div className="h-3 bg-gray-100 rounded w-20" />
        </div>
      ))}
      {!isLoading && sorted.length === 0 && (
        <p className="text-sm text-gray-400 py-6 text-center">Sin posiciones. Ve a Mercado para comprar tus primeras acciones.</p>
      )}
      {!isLoading && sorted.map(pos => {
        const s = style(pos.ticker)
        const isPos = pos.unrealized_pnl_pct >= 0
        return (
          <button key={pos.ticker} onClick={() => onSelectTicker(pos.ticker)}
            className="w-full flex items-center gap-3 py-3 border-b border-gray-50 last:border-0 hover:bg-page -mx-5 px-5 transition-colors text-left">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0" style={s}>
              {pos.ticker.slice(0, 2)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-gray-900 truncate">{pos.company_name}</p>
              <p className="text-[11px] text-gray-400">{pos.ticker} · {pos.shares.toFixed(2)} acc.</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[13px] font-semibold text-gray-900 tabular">{fmt(pos.current_value)}</p>
              <p className={`text-[11px] font-semibold tabular ${isPos ? 'text-green' : 'text-red'}`}>{isPos ? '+' : ''}{pos.unrealized_pnl_pct.toFixed(2)}%</p>
            </div>
          </button>
        )
      })}
    </div>
  )
}
