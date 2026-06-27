'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setLoading(true)
    const supabase = createClient()
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    if (err) { setError(err.message); setLoading(false); return }
    router.push('/dashboard'); router.refresh()
  }

  return (
    <div className="bg-white rounded-card border border-gray-100 shadow-card p-6">
      <h1 className="text-xl font-bold text-gray-900 mb-1">Bienvenido de vuelta</h1>
      <p className="text-sm text-gray-400 mb-6">Inicia sesión para ver tu portfolio</p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1.5">Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com" required
            className="w-full bg-page rounded-btn border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-purple focus:ring-1 focus:ring-purple" />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1.5">Contraseña</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required
            className="w-full bg-page rounded-btn border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-purple focus:ring-1 focus:ring-purple" />
        </div>
        {error && <p className="text-sm text-red bg-red-bg rounded-btn px-3 py-2">{error}</p>}
        <button type="submit" disabled={loading}
          className="w-full py-3 bg-purple text-white rounded-btn font-semibold text-sm hover:bg-purple-dark transition-colors disabled:opacity-50">
          {loading ? 'Entrando...' : 'Iniciar sesión'}
        </button>
      </form>
      <div className="mt-5 pt-5 border-t border-gray-100 text-center">
        <p className="text-sm text-gray-400">¿No tienes cuenta?{' '}
          <Link href="/register" className="text-purple font-medium hover:underline">Regístrate gratis</Link>
        </p>
      </div>
    </div>
  )
}
