'use client'
import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import type { League } from '@/lib/supabase/types'

export default function LeaguePage() {
  const supabase = createClient()
  const qc = useQueryClient()
  const [userId, setUserId] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [showJoin, setShowJoin] = useState(false)
  const [code, setCode] = useState('')
  const [form, setForm] = useState({ name: '', description: '', startDate: '', endDate: '', entryFee: '50', maxMembers: '20' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null)) }, [])

  const { data: leagues = [], isLoading } = useQuery({
    queryKey: ['leagues-list', userId], enabled: !!userId, staleTime: 30_000,
    queryFn: async () => {
      const { data } = await supabase.from('league_members')
        .select('leagues!inner(*)')
        .eq('user_id', userId!).in('status', ['active', 'invited', 'pending_payment'])
      return (data ?? []).map((r: { leagues: League }) => r.leagues)
    },
  })

  const fmt = (n: number) => n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 })

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      const { error: err } = await supabase.from('leagues').insert({
        name: form.name, description: form.description || null, creator_id: userId!,
        entry_fee: parseFloat(form.entryFee), max_members: parseInt(form.maxMembers),
        start_date: new Date(form.startDate).toISOString(), end_date: new Date(form.endDate).toISOString(), status: 'draft',
      })
      if (err) throw err
      setShowCreate(false); qc.invalidateQueries({ queryKey: ['leagues-list'] })
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Error') }
    setLoading(false)
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      const { data: league, error: le } = await supabase.from('leagues').select('id,status').eq('invite_code', code.trim().toLowerCase()).single()
      if (le || !league) throw new Error('Código inválido')
      if (league.status === 'closed') throw new Error('Liga finalizada')
      const { error: me } = await supabase.from('league_members').insert({ league_id: league.id, user_id: userId!, status: 'pending_payment' })
      if (me) throw new Error(me.code === '23505' ? 'Ya estás en esta liga' : me.message)
      setShowJoin(false); qc.invalidateQueries({ queryKey: ['leagues-list'] })
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Error') }
    setLoading(false)
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-bold text-gray-900">Ligas</h1><p className="text-sm text-gray-400 mt-0.5">Compite y gana el bote</p></div>
        <div className="flex gap-2">
          <button onClick={() => { setShowJoin(true); setShowCreate(false) }} className="px-3 py-2 rounded-btn border border-gray-200 text-sm font-medium text-gray-600 hover:border-purple hover:text-purple transition-colors">Unirse con código</button>
          <button onClick={() => { setShowCreate(true); setShowJoin(false) }} className="px-3 py-2 rounded-btn bg-purple text-white text-sm font-medium hover:bg-purple-dark transition-colors">+ Crear liga</button>
        </div>
      </div>
      {showJoin && (
        <div className="bg-white rounded-card border border-gray-100 shadow-card p-5">
          <h2 className="text-[15px] font-semibold text-gray-900 mb-4">Unirse con código</h2>
          <form onSubmit={handleJoin} className="flex flex-col gap-4">
            <input value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="ABC123"
              className="w-full bg-page rounded-btn border border-gray-200 px-4 py-3 text-xl font-mono font-bold text-center tracking-widest text-purple outline-none focus:border-purple" />
            {error && <p className="text-sm text-red bg-red-bg rounded-btn px-3 py-2">{error}</p>}
            <div className="flex gap-2">
              <button type="submit" disabled={loading} className="px-4 py-2 bg-purple text-white rounded-btn text-sm font-semibold disabled:opacity-50">{loading ? 'Uniéndome...' : 'Unirse · €50'}</button>
              <button type="button" onClick={() => setShowJoin(false)} className="px-4 py-2 text-gray-400 text-sm">Cancelar</button>
            </div>
          </form>
        </div>
      )}
      {showCreate && (
        <div className="bg-white rounded-card border border-gray-100 shadow-card p-5">
          <h2 className="text-[15px] font-semibold text-gray-900 mb-4">Nueva liga</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-xs font-medium text-gray-500 block mb-1">Nombre</label>
              <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Tech Bulls 2025" required className="w-full bg-page rounded-btn border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-purple" />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium text-gray-500 block mb-1">Descripción</label>
              <input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Opcional..." className="w-full bg-page rounded-btn border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-purple" />
            </div>
            {[['Fecha inicio', 'startDate', 'date'], ['Fecha cierre', 'endDate', 'date'], ['Entrada (€)', 'entryFee', 'number'], ['Máx. participantes', 'maxMembers', 'number']].map(([l, k, t]) => (
              <div key={k}>
                <label className="text-xs font-medium text-gray-500 block mb-1">{l}</label>
                <input type={t} value={(form as Record<string, string>)[k]} onChange={e => setForm(p => ({ ...p, [k]: e.target.value }))} required className="w-full bg-page rounded-btn border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-purple" />
              </div>
            ))}
            {error && <p className="col-span-2 text-sm text-red bg-red-bg rounded-btn px-3 py-2">{error}</p>}
            <div className="col-span-2 flex gap-2">
              <button type="submit" disabled={loading} className="px-4 py-2 bg-purple text-white rounded-btn text-sm font-semibold disabled:opacity-50">{loading ? 'Creando...' : 'Crear liga'}</button>
              <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 text-gray-400 text-sm">Cancelar</button>
            </div>
          </form>
        </div>
      )}
      {isLoading && <div className="h-24 bg-white rounded-card border border-gray-100 animate-pulse" />}
      {!isLoading && leagues.length === 0 && !showCreate && !showJoin && (
        <div className="bg-white rounded-card border border-gray-100 shadow-card p-12 text-center">
          <p className="font-semibold text-gray-900 mb-1">Sin ligas aún</p>
          <p className="text-sm text-gray-400 mb-5">Crea una liga y desafía a tus amigos.</p>
          <button onClick={() => setShowCreate(true)} className="px-4 py-2 bg-purple text-white rounded-btn text-sm font-semibold">+ Crear mi primera liga</button>
        </div>
      )}
      {leagues.map(l => (
        <Link key={l.id} href={`/league/${l.id}`} className="block bg-white rounded-card border border-gray-100 shadow-card p-5 hover:border-purple/40 hover:shadow-md transition-all group">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full mb-1 ${l.status === 'active' ? 'bg-orange-bg text-orange' : 'bg-gray-100 text-gray-500'}`}>
                {l.status === 'active' ? '● En curso' : l.status}
              </span>
              <h3 className="text-base font-bold text-gray-900 group-hover:text-purple transition-colors">{l.name}</h3>
              {l.description && <p className="text-xs text-gray-400 mt-0.5">{l.description}</p>}
            </div>
            <div className="text-right shrink-0">
              <p className="text-lg font-black text-purple tabular">{fmt(l.prize_pool)}</p>
              <p className="text-[11px] text-gray-400">prize pool</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <span>{fmt(l.entry_fee)}/entrada</span>
            <span>{fmt(l.starting_cash)} virtuales</span>
          </div>
        </Link>
      ))}
    </div>
  )
}
