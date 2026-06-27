export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; username: string; display_name: string; avatar_url: string | null; bio: string | null; created_at: string; updated_at: string }
        Insert: { id: string; username: string; display_name: string; avatar_url?: string | null }
        Update: { username?: string; display_name?: string; avatar_url?: string | null }
      }
      leagues: {
        Row: { id: string; name: string; description: string | null; creator_id: string; entry_fee: number; prize_pool: number; starting_cash: number; max_members: number; status: 'draft' | 'active' | 'closed' | 'cancelled'; start_date: string; end_date: string; invite_code: string; winner_id: string | null; created_at: string; updated_at: string }
        Insert: { id?: string; name: string; description?: string | null; creator_id: string; entry_fee?: number; prize_pool?: number; starting_cash?: number; max_members?: number; status?: 'draft' | 'active' | 'closed' | 'cancelled'; start_date: string; end_date: string }
        Update: { name?: string; description?: string | null; status?: 'draft' | 'active' | 'closed' | 'cancelled'; winner_id?: string | null }
      }
      league_members: {
        Row: { id: string; league_id: string; user_id: string; status: 'invited' | 'pending_payment' | 'active' | 'disqualified'; payment_id: string | null; payment_status: 'pending' | 'completed' | 'refunded' | 'failed' | null; invited_by: string | null; joined_at: string | null; created_at: string }
        Insert: { id?: string; league_id: string; user_id: string; status?: 'invited' | 'pending_payment' | 'active' | 'disqualified'; payment_id?: string | null }
        Update: { status?: 'invited' | 'pending_payment' | 'active' | 'disqualified'; payment_id?: string | null; payment_status?: 'pending' | 'completed' | 'refunded' | 'failed' | null; joined_at?: string | null }
      }
      portfolios: {
        Row: { id: string; league_id: string; user_id: string; cash_balance: number; total_value: number; invested_value: number; roi_pct: number; last_updated_at: string; created_at: string }
        Insert: { id?: string; league_id: string; user_id: string; cash_balance?: number; total_value?: number; invested_value?: number; roi_pct?: number }
        Update: { cash_balance?: number; total_value?: number; invested_value?: number; roi_pct?: number }
      }
      positions: {
        Row: { id: string; portfolio_id: string; ticker: string; company_name: string; shares: number; avg_buy_price: number; current_price: number; current_value: number; cost_basis: number; unrealized_pnl: number; unrealized_pnl_pct: number; last_price_update: string; created_at: string; updated_at: string }
        Insert: { id?: string; portfolio_id: string; ticker: string; company_name: string; shares: number; avg_buy_price: number; current_price: number }
        Update: { shares?: number; avg_buy_price?: number; current_price?: number }
      }
      transactions: {
        Row: { id: string; portfolio_id: string; ticker: string; company_name: string; type: 'buy' | 'sell'; shares: number; price_per_share: number; total_amount: number; cash_before: number; cash_after: number; polygon_snapshot: Json | null; executed_at: string }
        Insert: { id?: string; portfolio_id: string; ticker: string; company_name: string; type: 'buy' | 'sell'; shares: number; price_per_share: number; cash_before: number; cash_after: number; polygon_snapshot?: Json | null }
        Update: never
      }
      price_cache: {
        Row: { ticker: string; price: number; open: number | null; high: number | null; low: number | null; volume: number | null; change_pct: number | null; market_status: string | null; fetched_at: string }
        Insert: { ticker: string; price: number; open?: number | null; high?: number | null; low?: number | null; volume?: number | null; change_pct?: number | null; market_status?: string | null }
        Update: { price?: number; open?: number | null; change_pct?: number | null; fetched_at?: string }
      }
    }
    Functions: {
      recalculate_portfolio_roi: { Args: { p_portfolio_id: string }; Returns: void }
      confirm_league_payment: { Args: { p_league_id: string; p_user_id: string; p_payment_id: string }; Returns: void }
    }
    Enums: {}
  }
}

export type Profile      = Database['public']['Tables']['profiles']['Row']
export type League       = Database['public']['Tables']['leagues']['Row']
export type LeagueMember = Database['public']['Tables']['league_members']['Row']
export type Portfolio    = Database['public']['Tables']['portfolios']['Row']
export type Position     = Database['public']['Tables']['positions']['Row']
export type Transaction  = Database['public']['Tables']['transactions']['Row']
export type PriceCache   = Database['public']['Tables']['price_cache']['Row']

export type RankingEntry = {
  rank: number; user_id: string; username: string; display_name: string
  avatar_url: string | null; roi_pct: number; total_value: number; portfolio_id: string
}
