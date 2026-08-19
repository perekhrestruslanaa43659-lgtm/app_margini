export type EventStatus = 'richiesta' | 'bozza' | 'confermato' | 'concluso' | 'annullato'
export type ItemType = 'costo' | 'ricavo'

export interface CompanySettings {
  id: number
  name: string | null
  legal_name: string | null
  address: string | null
  vat_number: string | null
  tax_code: string | null
  email: string | null
  phone: string | null
  iban: string | null
  bank_name: string | null
  payment_terms: string | null
  contract_terms: string | null
  updated_at: string
}

export type MenuSelectionType = 'a_scelta' | 'tutti_inclusi'

export interface MenuCategoryTemplate {
  id: string
  name: string
  selection_type: MenuSelectionType
  sort_order: number
  created_at: string
}

export interface EventMenuCategory {
  id: string
  event_id: string
  name: string
  selection_type: MenuSelectionType
  price_per_guest: number | null
  sort_order: number
}

export interface EventMenuItem {
  id: string
  category_id: string
  dish_name: string
  unit_price: number
  sort_order: number
}

export interface Event {
  id: string
  name: string
  client_name: string | null
  client_email: string | null
  client_phone: string | null
  event_date: string | null
  location: string | null
  guests_count: number | null
  status: EventStatus
  notes: string | null
  allergies: string | null
  special_requests: string | null
  budget_min: number | null
  budget_max: number | null
  deposit_date: string | null
  room_id: string | null
  created_at: string
}

export interface Room {
  id: string
  name: string
  location: string | null
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

export interface Ingredient {
  id: string
  name: string
  unit: string
  cost_per_unit: number
  supplier: string | null
  notes: string | null
  created_at: string
}

export interface RecipeItem {
  id: string
  dish_name: string
  ingredient_id: string
  quantity: number
  ingredient?: Ingredient
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
      company_settings: {
        Row: CompanySettings
        Insert: Partial<Omit<CompanySettings, 'updated_at'>>
        Update: Partial<Omit<CompanySettings, 'id' | 'updated_at'>>
        Relationships: []
      }
      rooms: {
        Row: Room
        Insert: Omit<Room, 'id' | 'created_at'>
        Update: Partial<Omit<Room, 'id' | 'created_at'>>
        Relationships: []
      }
      menu_category_templates: {
        Row: MenuCategoryTemplate
        Insert: Omit<MenuCategoryTemplate, 'id' | 'created_at'>
        Update: Partial<Omit<MenuCategoryTemplate, 'id' | 'created_at'>>
        Relationships: []
      }
      event_menu_categories: {
        Row: EventMenuCategory
        Insert: Omit<EventMenuCategory, 'id'>
        Update: Partial<Omit<EventMenuCategory, 'id'>>
        Relationships: []
      }
      event_menu_items: {
        Row: EventMenuItem
        Insert: Omit<EventMenuItem, 'id'>
        Update: Partial<Omit<EventMenuItem, 'id'>>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
