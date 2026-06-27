const BASE = 'https://api.polygon.io'

export interface TickerQuote {
  ticker: string; price: number; open: number; high: number; low: number
  volume: number; change: number; changePercent: number; marketStatus: string
}

export interface SearchResult {
  ticker: string; name: string; primaryExchange: string; type: string
}

async function polygonFetch<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${BASE}${path}`)
  url.searchParams.set('apiKey', process.env.POLYGON_API_KEY ?? '')
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  const res = await fetch(url.toString(), { next: { revalidate: 30 } })
  if (!res.ok) throw new Error(`Polygon ${res.status}`)
  return res.json()
}

export async function getSnapshot(ticker: string): Promise<TickerQuote> {
  const data = await polygonFetch<{ ticker: { ticker: string; todaysChangePerc: number; todaysChange: number; day: { o: number; h: number; l: number; c: number; v: number }; min: { c: number } } }>(
    `/v2/snapshot/locale/us/markets/stocks/tickers/${ticker.toUpperCase()}`
  )
  const s = data.ticker
  return {
    ticker: s.ticker, price: s.min?.c ?? s.day?.c ?? 0,
    open: s.day?.o ?? 0, high: s.day?.h ?? 0, low: s.day?.l ?? 0,
    volume: s.day?.v ?? 0, change: s.todaysChange ?? 0,
    changePercent: s.todaysChangePerc ?? 0, marketStatus: 'open',
  }
}

export async function searchTickers(query: string): Promise<SearchResult[]> {
  const data = await polygonFetch<{ results: Array<{ ticker: string; name: string; primary_exchange: string; type: string }> }>(
    `/v3/reference/tickers`,
    { search: query, active: 'true', market: 'stocks', limit: '8' }
  )
  return (data.results ?? []).map(r => ({ ticker: r.ticker, name: r.name, primaryExchange: r.primary_exchange, type: r.type }))
}
