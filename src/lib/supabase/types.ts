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

export const ALLERGENS = [
  { key: 'glutine',       label: 'Glutine',               emoji: '🌾' },
  { key: 'crostacei',    label: 'Crostacei',             emoji: '🦞' },
  { key: 'uova',         label: 'Uova',                  emoji: '🥚' },
  { key: 'pesce',        label: 'Pesce',                 emoji: '🐟' },
  { key: 'arachidi',     label: 'Arachidi',              emoji: '🥜' },
  { key: 'soia',         label: 'Soia',                  emoji: '🫘' },
  { key: 'latte',        label: 'Latte/Lattosio',        emoji: '🥛' },
  { key: 'frutta_guscio',label: 'Frutta a guscio',       emoji: '🌰' },
  { key: 'sedano',       label: 'Sedano',                emoji: '🌿' },
  { key: 'senape',       label: 'Senape',                emoji: '🌱' },
  { key: 'sesamo',       label: 'Sesamo',                emoji: '🫙' },
  { key: 'anidride',     label: 'Solfiti/Anidride',      emoji: '🍷' },
  { key: 'lupini',       label: 'Lupini',                emoji: '🌼' },
  { key: 'molluschi',    label: 'Molluschi',             emoji: '🦑' },
] as const

export type AllergenKey = typeof ALLERGENS[number]['key']

export interface DishAllergen {
  id: string
  dish_name: string
  category: string | null
  glutine: boolean
  crostacei: boolean
  uova: boolean
  pesce: boolean
  arachidi: boolean
  soia: boolean
  latte: boolean
  frutta_guscio: boolean
  sedano: boolean
  senape: boolean
  sesamo: boolean
  anidride: boolean
  lupini: boolean
  molluschi: boolean
  note_allergeni: string | null
  updated_at: string
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
