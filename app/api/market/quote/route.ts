import { NextRequest, NextResponse } from 'next/server'
import { getSnapshot } from '@/lib/polygon'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const ticker = req.nextUrl.searchParams.get('ticker') ?? ''
  if (!ticker) return NextResponse.json({ error: 'ticker requerido' }, { status: 400 })
  try {
    const quote = await getSnapshot(ticker.toUpperCase())
    return NextResponse.json(quote)
  } catch {
    return NextResponse.json({ error: 'Error obteniendo cotización' }, { status: 500 })
  }
}
