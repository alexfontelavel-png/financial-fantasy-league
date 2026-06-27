'use client'
import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts'

const DATA: Record<string, { months: string[]; profits: number[]; losses: number[] }> = {
  '1M': { months: ['S1','S2','S3','S4'], profits: [1200,2100,800,3200], losses: [-400,-900,-1100,-600] },
  '3M': { months: ['Abr','May','Jun'], profits: [4200,3800,5100], losses: [-2200,-1100,-900] },
  '6M': { months: ['Ene','Feb','Mar','Abr','May','Jun'], profits: [2100,3400,1800,4200,3800,5100], losses: [-900,-1200,-800,-2200,-1100,-900] },
  '1A': { months: ['Jul','Ago','Sep','Oct','Nov','Dic','Ene','Feb','Mar','Abr','May','Jun'], profits: [1800,2200,3100,1500,4000,3200,2100,3400,1800,4200,3800,5100], losses: [-600,-1100,-800,-1800,-500,-1400,-900,-1200,-800,-2200,-1100,-900] },
}

export function PnLChart() {
  const [period, setPeriod] = useState('6M')
  const d = DATA[period]!
  const data = d.months.map((m, i) => ({ month: m, profit: d.profits[i]!, loss: d.losses[i]! }))
  const tp = d.profits.reduce((a, b) => a + b, 0)
  const tl = d.losses.reduce((a, b) => a + b, 0)
  const fmt = (n: number) => `${n >= 0 ? '+' : '-'}€${Math.abs(n).toLocaleString('es-ES')}`

  return (
    <div className="bg-white rounded-card border border-gray-100 shadow-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-[15px] font-semibold text-gray-900">Profit &amp; Loss</h2>
          <div className="flex gap-4 mt-1">
            {[['#6C5CE7','Profit'],['#EEEDF8','Loss']].map(([c,l]) => (
              <span key={l} className="flex items-center gap-1.5 text-xs text-gray-400">
                <span className="w-2 h-2 rounded-full inline-block border border-gray-200" style={{ background: c }} />{l}
              </span>
            ))}
          </div>
        </div>
        <div className="flex gap-1">
          {['1M','3M','6M','1A'].map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${period === p ? 'bg-purple text-white' : 'text-gray-400 hover:text-gray-600'}`}>{p}</button>
          ))}
        </div>
      </div>
      <div style={{ height: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barCategoryGap="30%" barGap={3} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9CA3AF' }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} tickFormatter={v => `${v >= 0 ? '+' : '-'}${Math.abs(v / 1000).toFixed(0)}k`} />
            <ReferenceLine y={0} stroke="#E5E7EB" />
            <Tooltip formatter={(v: number, n: string) => [`${v >= 0 ? '+' : ''}€${Math.abs(v).toLocaleString('es-ES')}`, n === 'profit' ? 'Profit' : 'Loss']} />
            <Bar dataKey="profit" radius={[4,4,0,0]} maxBarSize={24}>{data.map((_,i) => <Cell key={i} fill="#6C5CE7" />)}</Bar>
            <Bar dataKey="loss" radius={[4,4,0,0]} maxBarSize={24}>{data.map((_,i) => <Cell key={i} fill="#EEEDF8" />)}</Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-2 gap-3 mt-4">
        <div className="bg-page rounded-btn px-4 py-3">
          <p className="text-[11px] text-gray-400 mb-0.5">Total Profit</p>
          <p className="text-[15px] font-bold text-green tabular">{fmt(tp)}</p>
        </div>
        <div className="bg-page rounded-btn px-4 py-3">
          <p className="text-[11px] text-gray-400 mb-0.5">Total Loss</p>
          <p className="text-[15px] font-bold text-red tabular">{fmt(tl)}</p>
        </div>
      </div>
    </div>
  )
}
