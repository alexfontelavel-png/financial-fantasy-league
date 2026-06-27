'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) { setError('La contraseña debe tener al menos 8 caracteres'); return }
    setError(''); setLoading(true)
    const supabase = createClient()
    const { error: err } = await supabase.auth.signUp({ email, password, options: { data: { display_name: name } } })
    if (err) { setError(err.message); setLoading(false); return }
    router.push('/dashboard'); router.refresh()
  }

  return (
    <div className="bg-white rounded-card border border-gray-100 shadow-card p-6">
      <h1 className="text-xl font-bold text-gray-900 mb-1">Crea tu cuenta</h1>
      <p className="text-sm text-gray-400 mb-6">Únete y compite por el bote</p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {[
          { label: 'Nombre', value: name, set: setName, type: 'text', placeholder: 'Tu nombre' },
          { label: 'Email', value: email, set: setEmail, type: 'email', placeholder: 'tu@email.com' },
          { label: 'Contraseña', value: password, set: setPassword, type: 'password', placeholder: 'Mínimo 8 caracteres' },
        ].map(f => (
          <div key={f.label}>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">{f.label}</label>
            <input type={f.type} value={f.value} onChange={e => f.set(e.target.value)} placeholder={f.placeholder} required
              className="w-full bg-page rounded-btn border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-purple focus:ring-1 focus:ring-purple" />
          </div>
        ))}
        {error && <p className="text-sm text-red bg-red-bg rounded-btn px-3 py-2">{error}</p>}
        <button type="submit" disabled={loading}
          className="w-full py-3 bg-purple text-white rounded-btn font-semibold text-sm hover:bg-purple-dark transition-colors disabled:opacity-50">
          {loading ? 'Creando cuenta...' : 'Crear cuenta gratis'}
        </button>
      </form>
      <div className="mt-5 pt-5 border-t border-gray-100 text-center">
        <p className="text-sm text-gray-400">¿Ya tienes cuenta?{' '}
          <Link href="/login" className="text-purple font-medium hover:underline">Inicia sesión</Link>
        </p>
      </div>
    </div>
  )
}
