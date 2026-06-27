import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getSnapshot } from '@/lib/polygon'
import type { Database } from '@/lib/supabase/types'

export async function POST(req: NextRequest) {
  const cookieStore = cookies()
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (n) => cookieStore.get(n)?.value, set: () => {}, remove: () => {} } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { portfolioId, ticker, type, amountEur } = await req.json()
  if (!portfolioId || !ticker || !type || !amountEur) return NextResponse.json({ error: 'Faltan campos' }, { status: 400 })

  const { data: portfolio } = await supabase.from('portfolios').select('*').eq('id', portfolioId).eq('user_id', user.id).single()
  if (!portfolio) return NextResponse.json({ error: 'Portfolio no encontrado' }, { status: 403 })

  let quote
  try { quote = await getSnapshot(ticker.toUpperCase()) } catch { return NextResponse.json({ error: `No se pudo obtener precio de ${ticker}` }, { status: 400 }) }

  const price = quote.price
  const shares = amountEur / price
  const cashBefore = portfolio.cash_balance

  if (type === 'buy' && amountEur > cashBefore) return NextResponse.json({ error: `Saldo insuficiente. Tienes €${cashBefore.toFixed(2)}` }, { status: 400 })

  if (type === 'sell') {
    const { data: pos } = await supabase.from('positions').select('shares').eq('portfolio_id', portfolioId).eq('ticker', ticker.toUpperCase()).single()
    if (!pos || pos.shares < shares) return NextResponse.json({ error: `No tienes suficientes acciones de ${ticker}` }, { status: 400 })
  }

  const cashAfter = type === 'buy' ? cashBefore - amountEur : cashBefore + amountEur

  const { data: tx } = await supabase.from('transactions').insert({
    portfolio_id: portfolioId, ticker: ticker.toUpperCase(), company_name: ticker.toUpperCase(),
    type, shares, price_per_share: price, cash_before: cashBefore, cash_after: cashAfter,
  }).select('id').single()

  await supabase.from('portfolios').update({ cash_balance: cashAfter }).eq('id', portfolioId)

  if (type === 'buy') {
    const { data: existing } = await supabase.from('positions').select('shares, avg_buy_price').eq('portfolio_id', portfolioId).eq('ticker', ticker.toUpperCase()).single()
    if (existing) {
      const totalShares = existing.shares + shares
      const newAvg = (existing.shares * existing.avg_buy_price + shares * price) / totalShares
      await supabase.from('positions').update({ shares: totalShares, avg_buy_price: newAvg, current_price: price }).eq('portfolio_id', portfolioId).eq('ticker', ticker.toUpperCase())
    } else {
      await supabase.from('positions').insert({ portfolio_id: portfolioId, ticker: ticker.toUpperCase(), company_name: ticker.toUpperCase(), shares, avg_buy_price: price, current_price: price })
    }
  } else {
    const { data: pos } = await supabase.from('positions').select('shares').eq('portfolio_id', portfolioId).eq('ticker', ticker.toUpperCase()).single()
    if (pos) {
      const remaining = pos.shares - shares
      if (remaining <= 0.0001) await supabase.from('positions').delete().eq('portfolio_id', portfolioId).eq('ticker', ticker.toUpperCase())
      else await supabase.from('positions').update({ shares: remaining, current_price: price }).eq('portfolio_id', portfolioId).eq('ticker', ticker.toUpperCase())
    }
  }

  await supabase.rpc('recalculate_portfolio_roi', { p_portfolio_id: portfolioId })
  return NextResponse.json({ success: true, transactionId: tx?.id, shares, pricePerShare: price, totalAmount: amountEur, cashBefore, cashAfter })
}
