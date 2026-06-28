export type EventStatus = 'bozza' | 'confermato' | 'concluso' | 'annullato'
export type ItemType = 'costo' | 'ricavo'

export interface Event {
  id: string
  name: string
  client_name: string | null
  event_date: string | null
  location: string | null
  guests_count: number | null
  status: EventStatus
  notes: string | null
  created_at: string
}

export interface EventItem {
  id: string
  event_id: string
  type: ItemType
  category: string | null
  name: string
  quantity: number
  unit_price: number
  vat_rate: number
  notes: string | null
}

export interface MarginScenario {
  id: string
  event_id: string
  name: string
  discount_pct: number
  notes: string | null
}

export interface ScenarioOverride {
  id: string
  scenario_id: string
  item_id: string
  quantity_override: number | null
  unit_price_override: number | null
}

export interface CatalogItem {
  id: string
  type: ItemType
  category: string | null
  name: string
  unit_price: number
  vat_rate: number
  notes: string | null
  created_at: string
}

export interface MarginSummary {
  totalRevenue: number
  totalCosts: number
  grossMargin: number
  marginPct: number
  revenuePerGuest: number
  costPerGuest: number
  marginPerGuest: number
  breakEvenGuests: number
}

export type Database = {
  public: {
    Tables: {
      events: {
        Row: Event
        Insert: Omit<Event, 'id' | 'created_at'>
        Update: Partial<Omit<Event, 'id' | 'created_at'>>
        Relationships: []
      }
      event_items: {
        Row: EventItem
        Insert: Omit<EventItem, 'id'>
        Update: Partial<Omit<EventItem, 'id'>>
        Relationships: []
      }
      margin_scenarios: {
        Row: MarginScenario
        Insert: Omit<MarginScenario, 'id'>
        Update: Partial<Omit<MarginScenario, 'id'>>
        Relationships: []
      }
      scenario_overrides: {
        Row: ScenarioOverride
        Insert: Omit<ScenarioOverride, 'id'>
        Update: Partial<Omit<ScenarioOverride, 'id'>>
        Relationships: []
      }
      catalog_items: {
        Row: CatalogItem
        Insert: Omit<CatalogItem, 'id' | 'created_at'>
        Update: Partial<Omit<CatalogItem, 'id' | 'created_at'>>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
