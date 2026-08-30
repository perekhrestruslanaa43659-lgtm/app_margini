'use client'

import { useEffect, useState, useMemo } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Download, FileSpreadsheet, FileCheck, Plus, Trash2, Mail, MessageCircle, CalendarDays, Zap, AlertTriangle, EyeOff, ListChecks, Pencil, X, Check, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import type { Event, EventItem, MarginScenario, ScenarioOverride, EventStatus, CatalogItem, ItemType, Room, EventMenuCategory, EventMenuItem, MenuCategoryTemplate, MenuSelectionType } from '@/lib/supabase/types'
import { computeMargin, formatCurrency } from '@/lib/margin'
import { formatTimeRange } from '@/lib/timeOverlap'
import { MarginBadge } from '@/components/ui/MarginBadge'
import { MarginSummaryPanel } from '@/components/events/MarginSummaryPanel'
import { ItemsTable } from '@/components/events/ItemsTable'
import { CatalogImportModal } from '@/components/events/CatalogImportModal'
import { EmailModal } from '@/components/events/EmailModal'
import { SetupBanner } from '@/components/ui/SetupBanner'
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts'

type Tab = 'preventivo' | 'menu' | 'scenari' | 'export' | 'note'
type MenuPhase = 'categorie' | 'piatti' | 'margini'

interface DraftItem extends Omit<EventItem, 'id' | 'event_id'> {
  _key: string
  id?: string
}

const STATUS_OPTIONS: EventStatus[] = ['richiesta', 'bozza', 'confermato', 'concluso', 'annullato']

const MISSING_FIELDS: { key: keyof Event | '__items'; label: string; type: 'text' | 'email' | 'tel' | 'date' | 'number' }[] = [
  { key: 'client_name', label: 'Nome cliente', type: 'text' },
  { key: 'client_email', label: 'Email cliente', type: 'email' },
  { key: 'event_date', label: 'Data evento', type: 'date' },
  { key: 'location', label: 'Location', type: 'text' },
  { key: 'guests_count', label: 'Numero ospiti', type: 'number' },
]

// Campi di fatturazione: non bloccano la generazione del preventivo come i MISSING_FIELDS
// (non sempre servono, es. cliente privato senza P.IVA), ma se mancano il PDF li mostra vuoti.
const BILLING_FIELDS: { key: 'client_address' | 'client_vat_number' | 'client_sdi_code'; label: string }[] = [
  { key: 'client_address', label: 'Indirizzo cliente' },
  { key: 'client_vat_number', label: 'P. IVA' },
  { key: 'client_sdi_code', label: 'Codice SDI' },
]

function EventDetailPageInner() {
  const { id } = useParams<{ id: string }>()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = createClient() as any
  const [tab, setTab] = useState<Tab>('preventivo')
  const [event, setEvent] = useState<Event | null>(null)
  const [items, setItems] = useState<DraftItem[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [scenarios, setScenarios] = useState<MarginScenario[]>([])
  const [overrides, setOverrides] = useState<ScenarioOverride[]>([])
  const [editingScenario, setEditingScenario] = useState<string | null>(null)
  const [exportScenarioId, setExportScenarioId] = useState<string>('')
  const [editingHeader, setEditingHeader] = useState(false)
  const [headerDraft, setHeaderDraft] = useState({
    name: '', client_name: '', client_email: '', client_phone: '',
    client_address: '', client_vat_number: '', client_sdi_code: '',
    event_date: '', event_start_time: '', event_end_time: '', location: '', guests_count: '',
  })
  const [savingHeader, setSavingHeader] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [savingNote, setSavingNote] = useState(false)
  const [loading, setLoading] = useState(true)
  const [catalogModal, setCatalogModal] = useState<{ open: boolean; type: ItemType }>({ open: false, type: 'ricavo' })
  const [savingScenario, setSavingScenario] = useState(false)
  const [calcingCosts, setCalcingCosts] = useState(false)
  const [emailModalOpen, setEmailModalOpen] = useState(false)
  const [generatingQuote, setGeneratingQuote] = useState(false)
  const [quoteError, setQuoteError] = useState<string | null>(null)
  const [missingDraft, setMissingDraft] = useState<Record<string, string>>({})
  const [savingMissing, setSavingMissing] = useState(false)
  const [menuPhase, setMenuPhase] = useState<MenuPhase>('categorie')
  const [menuCategories, setMenuCategories] = useState<EventMenuCategory[]>([])
  const [menuItems, setMenuItems] = useState<EventMenuItem[]>([])
  const [categoryTemplates, setCategoryTemplates] = useState<MenuCategoryTemplate[]>([])
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false)
  const [selectedTemplates, setSelectedTemplates] = useState<Set<string>>(new Set())
  const [savingCategory, setSavingCategory] = useState(false)
  const [dishModal, setDishModal] = useState<{ open: boolean; categoryId: string | null }>({ open: false, categoryId: null })
  const [foodCostByDish, setFoodCostByDish] = useState<Record<string, number>>({})

  async function fetchAll() {
    setLoading(true)
    const [{ data: ev }, { data: it }, { data: sc }, { data: rm }, { data: mc }, { data: tpl }] = await Promise.all([
      sb.from('events').select('*').eq('id', id).single(),
      sb.from('event_items').select('*').eq('event_id', id),
      sb.from('margin_scenarios').select('*').eq('event_id', id),
      sb.from('rooms').select('*').order('name'),
      sb.from('event_menu_categories').select('*').eq('event_id', id).order('sort_order'),
      sb.from('menu_category_templates').select('*').order('sort_order'),
    ])
    const evTyped = ev as unknown as Event | null
    const itTyped = (it ?? []) as unknown as EventItem[]
    const scTyped = (sc ?? []) as unknown as MarginScenario[]
    const rmTyped = (rm ?? []) as unknown as Room[]
    const mcTyped = (mc ?? []) as unknown as EventMenuCategory[]
    const tplTyped = (tpl ?? []) as unknown as MenuCategoryTemplate[]
    if (evTyped) { setEvent(evTyped); setNoteText(evTyped.notes ?? '') }
    setItems(itTyped.map((i) => ({ ...i, _key: i.id })))
    setScenarios(scTyped)
    setRooms(rmTyped)
    setMenuCategories(mcTyped)
    setCategoryTemplates(tplTyped)

    if (scTyped.length > 0) {
      const { data: ov } = await sb
        .from('scenario_overrides')
        .select('*')
        .in('scenario_id', scTyped.map((s) => s.id))
      setOverrides((ov ?? []) as unknown as ScenarioOverride[])
    } else {
      setOverrides([])
    }

    if (mcTyped.length > 0) {
      const { data: mi } = await sb
        .from('event_menu_items')
        .select('*')
        .in('category_id', mcTyped.map((c) => c.id))
        .order('sort_order')
      const miTyped = (mi ?? []) as unknown as EventMenuItem[]
      setMenuItems(miTyped)

      if (miTyped.length > 0) {
        const dishNames = Array.from(new Set(miTyped.map((m) => m.dish_name)))
        const { data: recipeLines } = await sb
          .from('recipe_items')
          .select('dish_name, quantity, ingredient:ingredients(cost_per_unit)')
          .in('dish_name', dishNames)
        const costByDish: Record<string, number> = {}
        for (const r of (recipeLines ?? []) as { dish_name: string; quantity: number; ingredient: { cost_per_unit: number } | null }[]) {
          costByDish[r.dish_name] = (costByDish[r.dish_name] ?? 0) + r.quantity * (r.ingredient?.cost_per_unit ?? 0)
        }
        setFoodCostByDish(costByDish)
      } else {
        setFoodCostByDish({})
      }
    } else {
      setMenuItems([])
      setFoodCostByDish({})
    }

    setLoading(false)
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchAll() }, [id])

  const revenues = useMemo(() => items.filter((i) => i.type === 'ricavo'), [items])
  const costs = useMemo(() => items.filter((i) => i.type === 'costo'), [items])
  const summary = useMemo(
    () => computeMargin(items as unknown as EventItem[], event?.guests_count ?? 1),
    [items, event]
  )

  const missingFields = useMemo(() => {
    if (!event) return []
    const fields = MISSING_FIELDS.filter(({ key }) => {
      if (key === '__items') return false
      const v = event[key]
      return v === null || v === undefined || v === ''
    })
    if (revenues.filter((r) => r.name.trim()).length === 0) {
      fields.push({ key: '__items', label: 'Voci di preventivo (nessuna inserita)', type: 'text' })
    }
    return fields
  }, [event, revenues])

  const availableRooms = useMemo(() => {
    if (!event?.location) return rooms
    const loc = event.location.trim().toLowerCase()
    if (!loc) return rooms
    const matches = rooms.filter((r) => {
      const rLoc = (r.location ?? '').trim().toLowerCase()
      return rLoc && (rLoc.includes(loc) || loc.includes(rLoc))
    })
    return matches.length > 0 ? matches : rooms
  }, [rooms, event])

  async function saveMissingField(key: keyof Event, type: string) {
    const raw = missingDraft[key]
    if (!raw) return
    setSavingMissing(true)
    const value = type === 'number' ? Number(raw) : raw
    await sb.from('events').update({ [key]: value }).eq('id', id)
    setEvent((e) => e ? { ...e, [key]: value } : e)
    setMissingDraft((d) => { const next = { ...d }; delete next[key]; return next })
    setSavingMissing(false)
  }

  async function updateStatus(status: EventStatus) {
    await sb.from('events').update({ status }).eq('id', id)
    setEvent((e) => e ? { ...e, status } : e)
  }

  async function updateDepositDate(value: string) {
    const depositDate = value || null
    await sb.from('events').update({ deposit_date: depositDate }).eq('id', id)
    setEvent((e) => e ? { ...e, deposit_date: depositDate } : e)
  }

  async function updateRoom(value: string) {
    const roomId = value || null
    await sb.from('events').update({ room_id: roomId }).eq('id', id)
    setEvent((e) => e ? { ...e, room_id: roomId } : e)
  }

  function openHeaderEdit() {
    if (!event) return
    setHeaderDraft({
      name: event.name ?? '',
      client_name: event.client_name ?? '',
      client_email: event.client_email ?? '',
      client_phone: event.client_phone ?? '',
      client_address: event.client_address ?? '',
      client_vat_number: event.client_vat_number ?? '',
      client_sdi_code: event.client_sdi_code ?? '',
      event_date: event.event_date ?? '',
      event_start_time: event.event_start_time ?? '',
      event_end_time: event.event_end_time ?? '',
      location: event.location ?? '',
      guests_count: event.guests_count != null ? String(event.guests_count) : '',
    })
    setEditingHeader(true)
  }

  async function saveHeader() {
    if (!headerDraft.name.trim()) return
    setSavingHeader(true)
    const patch = {
      name: headerDraft.name.trim(),
      client_name: headerDraft.client_name.trim() || null,
      client_email: headerDraft.client_email.trim() || null,
      client_phone: headerDraft.client_phone.trim() || null,
      client_address: headerDraft.client_address.trim() || null,
      client_vat_number: headerDraft.client_vat_number.trim() || null,
      client_sdi_code: headerDraft.client_sdi_code.trim() || null,
      event_date: headerDraft.event_date || null,
      event_start_time: headerDraft.event_start_time || null,
      event_end_time: headerDraft.event_end_time || null,
      location: headerDraft.location.trim() || null,
      guests_count: headerDraft.guests_count ? Number(headerDraft.guests_count) : null,
    }
    await sb.from('events').update(patch).eq('id', id)
    setEvent((e) => e ? { ...e, ...patch } : e)
    setSavingHeader(false)
    setEditingHeader(false)
  }

  async function saveItems() {
    await sb.from('event_items').delete().eq('event_id', id)
    const validItems = items.filter((it) => it.name.trim())
    if (validItems.length > 0) {
      await sb.from('event_items').insert(
        validItems.map((it) => ({
          event_id: id,
          type: it.type,
          category: it.category,
          name: it.name,
          quantity: it.quantity,
          unit_price: it.unit_price,
          vat_rate: it.vat_rate,
          notes: it.notes,
        }))
      )
    }
    fetchAll()
  }

  async function saveNote() {
    setSavingNote(true)
    await sb.from('events').update({ notes: noteText }).eq('id', id)
    setSavingNote(false)
  }

  async function addMenuCategory() {
    setSavingCategory(true)
    const { data } = await sb
      .from('event_menu_categories')
      .insert({
        event_id: id,
        name: '',
        selection_type: 'a_scelta' as MenuSelectionType,
        price_per_guest: null,
        sort_order: menuCategories.length,
      })
      .select()
      .single()
    if (data) setMenuCategories((prev) => [...prev, data as unknown as EventMenuCategory])
    setSavingCategory(false)
  }

  async function updateMenuCategory(catId: string, field: 'name' | 'selection_type' | 'price_per_guest', value: unknown) {
    await sb.from('event_menu_categories').update({ [field]: value }).eq('id', catId)
    setMenuCategories((prev) => prev.map((c) => c.id === catId ? { ...c, [field]: value } : c))
  }

  async function deleteMenuCategory(catId: string) {
    await sb.from('event_menu_categories').delete().eq('id', catId)
    setMenuCategories((prev) => prev.filter((c) => c.id !== catId))
    setMenuItems((prev) => prev.filter((i) => i.category_id !== catId))
  }

  function toggleTemplateSelection(templateId: string) {
    setSelectedTemplates((prev) => {
      const next = new Set(prev)
      if (next.has(templateId)) { next.delete(templateId) } else { next.add(templateId) }
      return next
    })
  }

  async function importSelectedTemplates() {
    const toImport = categoryTemplates.filter((t) => selectedTemplates.has(t.id))
    if (toImport.length === 0) return
    setSavingCategory(true)
    const rows = toImport.map((t, i) => ({
      event_id: id,
      name: t.name,
      selection_type: t.selection_type,
      price_per_guest: null,
      sort_order: menuCategories.length + i,
    }))
    const { data } = await sb.from('event_menu_categories').insert(rows).select()
    if (data) setMenuCategories((prev) => [...prev, ...(data as unknown as EventMenuCategory[])])
    setSelectedTemplates(new Set())
    setTemplatePickerOpen(false)
    setSavingCategory(false)
  }

  async function addMenuItems(categoryId: string, catalogItems: CatalogItem[]) {
    if (catalogItems.length === 0) return
    const existingCount = menuItems.filter((i) => i.category_id === categoryId).length
    const rows = catalogItems.map((it, i) => ({
      category_id: categoryId,
      dish_name: it.name,
      unit_price: it.unit_price,
      sort_order: existingCount + i,
    }))
    const { data } = await sb.from('event_menu_items').insert(rows).select()
    if (data) {
      const newItems = data as unknown as EventMenuItem[]
      setMenuItems((prev) => [...prev, ...newItems])
      const dishNames = newItems.map((m) => m.dish_name)
      const { data: recipeLines } = await sb
        .from('recipe_items')
        .select('dish_name, quantity, ingredient:ingredients(cost_per_unit)')
        .in('dish_name', dishNames)
      const costByDish: Record<string, number> = {}
      for (const r of (recipeLines ?? []) as { dish_name: string; quantity: number; ingredient: { cost_per_unit: number } | null }[]) {
        costByDish[r.dish_name] = (costByDish[r.dish_name] ?? 0) + r.quantity * (r.ingredient?.cost_per_unit ?? 0)
      }
      setFoodCostByDish((prev) => ({ ...prev, ...costByDish }))
    }
  }

  async function removeMenuItem(itemId: string) {
    await sb.from('event_menu_items').delete().eq('id', itemId)
    setMenuItems((prev) => prev.filter((i) => i.id !== itemId))
  }

  function menuItemsFor(categoryId: string) {
    return menuItems.filter((i) => i.category_id === categoryId)
  }

  const menuMargins = useMemo(() => {
    const guests = event?.guests_count ?? 1
    const perCategory = menuCategories.map((cat) => {
      const items = menuItemsFor(cat.id)
      const foodCosts = items.map((it) => foodCostByDish[it.dish_name] ?? 0)
      const costPerGuest = cat.selection_type === 'a_scelta'
        ? (foodCosts.length > 0 ? Math.max(...foodCosts) : 0)
        : foodCosts.reduce((a, b) => a + b, 0)
      const revenuePerGuest = cat.selection_type === 'a_scelta'
        ? (cat.price_per_guest ?? 0)
        : items.reduce((sum, it) => sum + it.unit_price, 0)
      const marginPerGuest = revenuePerGuest - costPerGuest
      const marginPct = revenuePerGuest > 0 ? (marginPerGuest / revenuePerGuest) * 100 : 0
      return {
        category: cat,
        costPerGuest,
        revenuePerGuest,
        marginPerGuest,
        marginPct,
        costTotal: costPerGuest * guests,
        revenueTotal: revenuePerGuest * guests,
        marginTotal: marginPerGuest * guests,
      }
    })
    const totalRevenuePerGuest = perCategory.reduce((sum, c) => sum + c.revenuePerGuest, 0)
    const totalCostPerGuest = perCategory.reduce((sum, c) => sum + c.costPerGuest, 0)
    const totalMarginPerGuest = totalRevenuePerGuest - totalCostPerGuest
    const totalMarginPct = totalRevenuePerGuest > 0 ? (totalMarginPerGuest / totalRevenuePerGuest) * 100 : 0
    return {
      perCategory,
      totalRevenuePerGuest,
      totalCostPerGuest,
      totalMarginPerGuest,
      totalMarginPct,
      totalRevenue: totalRevenuePerGuest * guests,
      totalCost: totalCostPerGuest * guests,
      totalMargin: totalMarginPerGuest * guests,
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menuCategories, menuItems, foodCostByDish, event])

  async function autoAddCost(dishName: string, quantity: number) {
    const { data: recipeLines } = await sb
      .from('recipe_items')
      .select('quantity, ingredient:ingredients(cost_per_unit)')
      .eq('dish_name', dishName)

    const foodCost = recipeLines && recipeLines.length > 0
      ? recipeLines.reduce((sum: number, r: { quantity: number; ingredient: { cost_per_unit: number } | null }) =>
          sum + r.quantity * (r.ingredient?.cost_per_unit ?? 0), 0)
      : 0

    setItems((prev) => {
      const existingCost = prev.find((c) => c.type === 'costo' && c.name === dishName)
      if (existingCost) {
        return prev.map((c) => c.type === 'costo' && c.name === dishName
          ? { ...c, quantity, unit_price: foodCost }
          : c)
      }
      const newCost: DraftItem = {
        _key: Math.random().toString(36).slice(2),
        type: 'costo',
        category: 'Food',
        name: dishName,
        quantity,
        unit_price: foodCost,
        vat_rate: 10,
        notes: foodCost > 0 ? 'Food cost da distinta base' : 'Inserire costo manualmente',
      }
      const filtered = prev.filter((c) => !(c.type === 'costo' && c.name.trim() === ''))
      return [...filtered, newCost]
    })
  }

  async function calcAllFoodCosts() {
    const revs = items.filter((i) => i.type === 'ricavo' && i.name.trim())
    if (revs.length === 0) return
    setCalcingCosts(true)
    const dishNames = revs.map((r) => r.name)
    const { data } = await sb
      .from('recipe_items')
      .select('dish_name, quantity, ingredient:ingredients(cost_per_unit)')
      .in('dish_name', dishNames)

    const costByDish: Record<string, number> = {}
    for (const r of (data ?? []) as { dish_name: string; quantity: number; ingredient: { cost_per_unit: number } | null }[]) {
      costByDish[r.dish_name] = (costByDish[r.dish_name] ?? 0) + r.quantity * (r.ingredient?.cost_per_unit ?? 0)
    }

    const newCosts: DraftItem[] = revs.map((r) => ({
      _key: Math.random().toString(36).slice(2),
      type: 'costo' as ItemType,
      category: 'Food',
      name: r.name,
      quantity: r.quantity,
      unit_price: costByDish[r.name] ?? 0,
      vat_rate: 10,
      notes: costByDish[r.name] ? 'Food cost da distinta base' : 'Inserire costo manualmente',
    }))

    setItems((prev) => [...prev.filter((i) => i.type === 'ricavo'), ...newCosts])
    setCalcingCosts(false)
  }

  function handleRevenueChange(updated: DraftItem[]) {
    setItems((prev) => {
      const currentCosts = prev.filter((i) => i.type === 'costo')
      const syncedCosts = currentCosts.map((c) => {
        const matchingRev = updated.find((r) => r.name === c.name)
        return matchingRev ? { ...c, quantity: matchingRev.quantity } : c
      })
      return [...updated, ...syncedCosts]
    })
  }

  function handleCostChange(updated: DraftItem[]) {
    setItems((prev) => [...prev.filter((i) => i.type === 'ricavo'), ...updated])
  }

  function importCatalog(type: ItemType, catalogItems: CatalogItem[]) {
    const mapped: DraftItem[] = catalogItems.map((it) => ({
      _key: Math.random().toString(36).slice(2),
      type,
      category: it.category,
      name: it.name,
      quantity: 1,
      unit_price: it.unit_price,
      vat_rate: it.vat_rate,
      notes: it.notes,
    }))
    if (type === 'ricavo') {
      setItems((prev) => [...mapped, ...prev.filter((i) => i.type === 'costo')])
    } else {
      setItems((prev) => [...prev.filter((i) => i.type === 'ricavo'), ...mapped])
    }
  }

  async function addScenario() {
    setSavingScenario(true)
    await sb.from('margin_scenarios').insert({
      event_id: id,
      name: `Scenario ${scenarios.length + 1}`,
      discount_pct: 0,
      notes: null,
    })
    setSavingScenario(false)
    fetchAll()
  }

  async function updateScenario(scId: string, field: 'name' | 'discount_pct' | 'notes', value: unknown) {
    await sb.from('margin_scenarios').update({ [field]: value }).eq('id', scId)
    setScenarios((prev) => prev.map((s) => s.id === scId ? { ...s, [field]: value } : s))
  }

  async function deleteScenario(scId: string) {
    await sb.from('margin_scenarios').delete().eq('id', scId)
    setScenarios((prev) => prev.filter((s) => s.id !== scId))
    setOverrides((prev) => prev.filter((o) => o.scenario_id !== scId))
  }

  function overridesFor(scId: string) {
    return overrides.filter((o) => o.scenario_id === scId)
  }

  async function setItemOverride(scId: string, itemId: string, field: 'quantity_override' | 'unit_price_override', raw: string) {
    const value = raw === '' ? null : parseFloat(raw)
    const existing = overrides.find((o) => o.scenario_id === scId && o.item_id === itemId)

    if (existing) {
      const otherField = field === 'quantity_override' ? 'unit_price_override' : 'quantity_override'
      if (value === null && existing[otherField] === null) {
        await sb.from('scenario_overrides').delete().eq('id', existing.id)
        setOverrides((prev) => prev.filter((o) => o.id !== existing.id))
        return
      }
      await sb.from('scenario_overrides').update({ [field]: value }).eq('id', existing.id)
      setOverrides((prev) => prev.map((o) => o.id === existing.id ? { ...o, [field]: value } : o))
      return
    }

    if (value === null) return
    const { data } = await sb
      .from('scenario_overrides')
      .insert({ scenario_id: scId, item_id: itemId, quantity_override: null, unit_price_override: null, [field]: value })
      .select()
      .single()
    if (data) setOverrides((prev) => [...prev, data as unknown as ScenarioOverride])
  }

  async function clearItemOverride(scId: string, itemId: string) {
    const existing = overrides.find((o) => o.scenario_id === scId && o.item_id === itemId)
    if (!existing) return
    await sb.from('scenario_overrides').delete().eq('id', existing.id)
    setOverrides((prev) => prev.filter((o) => o.id !== existing.id))
  }

  const scenarioChartData = useMemo(() =>
    scenarios.map((sc) => {
      const scOverrides = overrides.filter((o) => o.scenario_id === sc.id)
      const s = computeMargin(items as unknown as EventItem[], event?.guests_count ?? 1, sc.discount_pct, scOverrides)
      return { name: sc.name, Ricavi: Math.round(s.totalRevenue), Costi: Math.round(s.totalCosts), Margine: Math.round(s.grossMargin) }
    }),
    [scenarios, items, event, overrides]
  )

  function exportPDF() {
    const scenarioParam = exportScenarioId ? `&scenario=${exportScenarioId}` : ''
    window.open(`/events/${id}/export?format=pdf${scenarioParam}`, '_blank')
  }

  function exportExcel() {
    const scenarioParam = exportScenarioId ? `&scenario=${exportScenarioId}` : ''
    window.open(`/events/${id}/export?format=excel${scenarioParam}`, '_blank')
  }

  function downloadBase64Pdf(base64: string, filename: string) {
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))
    const blob = new Blob([bytes], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  // Genera il preventivo PDF formale (e il menu allegato, se l'evento ha voci menu)
  // precompilando tutto dai dati gia' salvati sull'evento — senza ridigitarli a mano
  // nel form separato /proposte/preventivo.
  async function generateQuotePdf() {
    setQuoteError(null)
    setGeneratingQuote(true)
    try {
      const res = await fetch(`/api/events/${id}/quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.error || 'Errore nella generazione del preventivo')
      }
      const data = await res.json() as {
        quote: { base64: string; filename: string }
        menu: { base64: string; filename: string } | null
      }
      downloadBase64Pdf(data.quote.base64, data.quote.filename)
      if (data.menu) downloadBase64Pdf(data.menu.base64, data.menu.filename)
    } catch (err) {
      setQuoteError(err instanceof Error ? err.message : 'Errore nella generazione del preventivo')
    } finally {
      setGeneratingQuote(false)
    }
  }

  function buildMessageText() {
    const date = event?.event_date ? new Date(event.event_date).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'
    const guests = event?.guests_count ? `${event.guests_count} ospiti` : ''
    const location = event?.location ? `\n📍 ${event.location}` : ''
    const totale = summary.totalRevenue > 0 ? `\n💰 Totale preventivo: ${formatCurrency(summary.totalRevenue)}` : ''
    return `Gentile ${event?.client_name || 'Cliente'},\n\nle confermiamo i dettagli del suo evento:\n\n📅 ${event?.name}\n🗓 ${date}${guests ? ` · ${guests}` : ''}${location}${totale}\n\nSiamo a disposizione per qualsiasi informazione.\n\nCordiali saluti,\nDoppio Malto`
  }

  function sendEmail() {
    setEmailModalOpen(true)
  }

  function sendWhatsApp() {
    const text = encodeURIComponent(buildMessageText())
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

  if (loading) return <div className="card text-center text-slate-400 py-16">Caricamento...</div>
  if (!event) return <div className="card text-center text-slate-400 py-16">Evento non trovato</div>

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-4 mb-6">
        <div className="flex-1">
          <Link href="/events" className="text-sm text-slate-400 hover:text-slate-600 flex items-center gap-1 mb-3">
            <ArrowLeft size={14} /> Lista eventi
          </Link>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-dm-wood/20 rounded-xl flex items-center justify-center shrink-0">
              <CalendarDays className="text-dm-wood" size={18} />
            </div>
            {!editingHeader && <h1 className="text-xl font-bold text-dm-ink">{event.name}</h1>}
            {missingFields.length > 0 && !editingHeader && (
              <button
                type="button"
                onClick={() => setTab('export')}
                className="flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-100 hover:bg-amber-200 px-2.5 py-1 rounded-full transition-colors"
                title="Ci sono dati mancanti nel preventivo"
              >
                <AlertTriangle size={12} /> {missingFields.length} dati mancanti
              </button>
            )}
            {!editingHeader && (
              <button
                type="button"
                onClick={openHeaderEdit}
                className="flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-dm-maroon border border-slate-200 hover:border-dm-maroon/40 px-2.5 py-1 rounded-full transition-colors"
              >
                <Pencil size={11} /> Modifica
              </button>
            )}
          </div>

          {editingHeader ? (
            <div className="bg-white border border-dm-ink/10 rounded-xl p-4 mt-1 space-y-3">
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="label">Nome prenotazione *</label>
                  <input
                    className="input py-1.5 text-sm"
                    value={headerDraft.name}
                    onChange={(e) => setHeaderDraft((d) => ({ ...d, name: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="label">Nome cliente</label>
                  <input
                    className="input py-1.5 text-sm"
                    value={headerDraft.client_name}
                    onChange={(e) => setHeaderDraft((d) => ({ ...d, client_name: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="label">Email cliente</label>
                  <input
                    type="email"
                    className="input py-1.5 text-sm"
                    value={headerDraft.client_email}
                    onChange={(e) => setHeaderDraft((d) => ({ ...d, client_email: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="label">Telefono cliente</label>
                  <input
                    type="tel"
                    className="input py-1.5 text-sm"
                    value={headerDraft.client_phone}
                    onChange={(e) => setHeaderDraft((d) => ({ ...d, client_phone: e.target.value }))}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="label">Indirizzo cliente</label>
                  <input
                    className="input py-1.5 text-sm"
                    placeholder="Per il preventivo PDF"
                    value={headerDraft.client_address}
                    onChange={(e) => setHeaderDraft((d) => ({ ...d, client_address: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="label">P. IVA</label>
                  <input
                    className="input py-1.5 text-sm"
                    placeholder="Per il preventivo PDF"
                    value={headerDraft.client_vat_number}
                    onChange={(e) => setHeaderDraft((d) => ({ ...d, client_vat_number: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="label">Codice SDI</label>
                  <input
                    className="input py-1.5 text-sm"
                    placeholder="Per il preventivo PDF"
                    value={headerDraft.client_sdi_code}
                    onChange={(e) => setHeaderDraft((d) => ({ ...d, client_sdi_code: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="label">Data evento</label>
                  <input
                    type="date"
                    className="input py-1.5 text-sm"
                    value={headerDraft.event_date}
                    onChange={(e) => setHeaderDraft((d) => ({ ...d, event_date: e.target.value }))}
                  />
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="label">Ora inizio</label>
                    <input
                      type="time"
                      className="input py-1.5 text-sm"
                      value={headerDraft.event_start_time}
                      onChange={(e) => setHeaderDraft((d) => ({ ...d, event_start_time: e.target.value }))}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="label">Ora fine</label>
                    <input
                      type="time"
                      className="input py-1.5 text-sm"
                      value={headerDraft.event_end_time}
                      onChange={(e) => setHeaderDraft((d) => ({ ...d, event_end_time: e.target.value }))}
                    />
                  </div>
                </div>
                <div>
                  <label className="label">Location</label>
                  <input
                    className="input py-1.5 text-sm"
                    value={headerDraft.location}
                    onChange={(e) => setHeaderDraft((d) => ({ ...d, location: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="label">Numero ospiti</label>
                  <input
                    type="number"
                    min="0"
                    className="input py-1.5 text-sm"
                    value={headerDraft.guests_count}
                    onChange={(e) => setHeaderDraft((d) => ({ ...d, guests_count: e.target.value }))}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setEditingHeader(false)}
                  className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-dm-ink px-3 py-1.5 rounded-lg transition-colors"
                >
                  <X size={14} /> Annulla
                </button>
                <button
                  type="button"
                  onClick={saveHeader}
                  disabled={savingHeader || !headerDraft.name.trim()}
                  className="flex items-center gap-1.5 text-sm font-medium bg-dm-yellow hover:bg-dm-yellow-dark text-dm-ink px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40"
                >
                  <Check size={14} /> {savingHeader ? 'Salvataggio...' : 'Salva'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-slate-500">
              {event.client_name && <span>{event.client_name}</span>}
              {event.client_email && <a href={`mailto:${event.client_email}`} className="text-dm-maroon hover:underline">· {event.client_email}</a>}
              {event.client_phone && <a href={`tel:${event.client_phone}`} className="hover:underline">· {event.client_phone}</a>}
              {event.event_date && <span>· {event.event_date}</span>}
              {(event.event_start_time || event.event_end_time) && (
                <span>· {formatTimeRange(event.event_start_time, event.event_end_time)}</span>
              )}
              {event.location && <span>· {event.location}</span>}
              {event.guests_count && <span>· {event.guests_count} ospiti</span>}
              {(event.budget_min || event.budget_max) && (
                <span>· Budget {event.budget_min ? formatCurrency(event.budget_min) : '—'} – {event.budget_max ? formatCurrency(event.budget_max) : '—'}</span>
              )}
            </div>
          )}
          <div className="flex flex-wrap items-end gap-4 mt-3">
            <div>
              <label className="label">Data acconto</label>
              <input
                type="date"
                className="input py-1.5 text-sm w-40"
                value={event.deposit_date ?? ''}
                onChange={(e) => updateDepositDate(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Saletta / tavolo</label>
              {availableRooms.length > 0 ? (
                <select
                  className="input py-1.5 text-sm w-48"
                  value={event.room_id ?? ''}
                  onChange={(e) => updateRoom(e.target.value)}
                >
                  <option value="">Nessuna</option>
                  {availableRooms.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}{r.location ? ` (${r.location})` : ''}</option>
                  ))}
                </select>
              ) : (
                <p className="text-xs text-slate-400">
                  Nessuna saletta configurata. <Link href="/settings" className="text-dm-maroon hover:underline">Aggiungila in Impostazioni</Link>
                </p>
              )}
            </div>
          </div>
          {(event.allergies || event.special_requests) && (
            <div className="flex flex-col gap-1 mt-2 text-sm">
              {event.allergies && (
                <p className="text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 inline-block w-fit">
                  ⚠ Allergie: {event.allergies}
                </p>
              )}
              {event.special_requests && (
                <p className="text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 inline-block w-fit">
                  📝 Richieste particolari: {event.special_requests}
                </p>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select
            className="input w-36"
            value={event.status}
            onChange={(e) => updateStatus(e.target.value as EventStatus)}
          >
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
          <button
            onClick={sendEmail}
            title="Invia email al cliente"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-dm-wood/10 hover:border-dm-wood hover:text-dm-wood text-sm font-medium transition-colors"
          >
            <Mail size={15} /> Email
          </button>
          <button
            onClick={sendWhatsApp}
            title="Invia WhatsApp al cliente"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 text-sm font-medium transition-colors"
          >
            <MessageCircle size={15} /> WhatsApp
          </button>
          <MarginBadge pct={summary.marginPct} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main */}
        <div className="lg:col-span-2">
          {/* Tabs */}
          <div className="flex gap-1 mb-4 bg-white rounded-xl p-1 border border-slate-100 w-fit">
            {(['preventivo', 'menu', 'scenari', 'export', 'note'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize
                  ${tab === t ? 'bg-dm-yellow text-dm-ink' : 'text-slate-500 hover:text-dm-ink'}`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Tab: Preventivo */}
          {tab === 'preventivo' && (
            <div className="card">
              <ItemsTable
                type="ricavo"
                items={revenues as DraftItem[]}
                onChange={handleRevenueChange as (items: DraftItem[]) => void}
                onImportFromCatalog={() => setCatalogModal({ open: true, type: 'ricavo' })}
                onProductSelected={(n, qty) => autoAddCost(n, qty)}
              />
              {/* Auto food cost button */}
              {revenues.some((r) => r.name.trim()) && (
                <div className="mb-3 flex items-center gap-3 bg-dm-wood/10 border border-dm-wood/30 rounded-xl px-4 py-2.5">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-dm-wood">Calcola food cost dalla distinta base</p>
                    <p className="text-[11px] text-dm-wood/80 mt-0.5">Sostituisce i costi attuali con quelli calcolati dagli ingredienti</p>
                  </div>
                  <button
                    type="button"
                    onClick={calcAllFoodCosts}
                    disabled={calcingCosts}
                    className="flex items-center gap-1.5 bg-dm-yellow hover:bg-dm-yellow-dark text-dm-ink font-display font-semibold uppercase tracking-wide text-xs px-3 py-1.5 rounded-lg transition-colors shrink-0"
                  >
                    <Zap size={13} />
                    {calcingCosts ? 'Calcolo...' : 'Calcola costi'}
                  </button>
                </div>
              )}
              <ItemsTable
                type="costo"
                items={costs as DraftItem[]}
                onChange={handleCostChange as (items: DraftItem[]) => void}
                onImportFromCatalog={() => setCatalogModal({ open: true, type: 'costo' })}
              />
              <div className="flex justify-end mt-4">
                <button className="btn-primary" onClick={saveItems}>Salva voci</button>
              </div>
            </div>
          )}

          {/* Tab: Menu */}
          {tab === 'menu' && (
            <div className="card">
              <div className="flex items-center gap-1 mb-5 bg-slate-50 rounded-xl p-1 border border-slate-100 w-fit">
                {([
                  { key: 'categorie', label: '1. Categorie' },
                  { key: 'piatti', label: '2. Piatti' },
                  { key: 'margini', label: '3. Margini' },
                ] as { key: MenuPhase; label: string }[]).map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setMenuPhase(key)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors
                      ${menuPhase === key ? 'bg-dm-yellow text-dm-ink' : 'text-slate-500 hover:text-dm-ink'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Fase 1: Categorie */}
              {menuPhase === 'categorie' && (
                <div>
                  {menuCategories.length === 0 ? (
                    <p className="text-sm text-slate-400 py-4 text-center">Nessuna categoria menu. Aggiungine una o carica da template.</p>
                  ) : (
                    <div className="space-y-2 mb-4">
                      {menuCategories.map((cat) => (
                        <div key={cat.id} className="flex flex-col sm:flex-row gap-2 items-start sm:items-center border border-slate-100 rounded-xl p-3">
                          <input
                            className="input py-1.5 text-sm flex-1"
                            placeholder="Nome categoria"
                            value={cat.name}
                            onChange={(e) => setMenuCategories((prev) => prev.map((c) => c.id === cat.id ? { ...c, name: e.target.value } : c))}
                            onBlur={(e) => updateMenuCategory(cat.id, 'name', e.target.value)}
                          />
                          <select
                            className="input py-1.5 text-sm w-40"
                            value={cat.selection_type}
                            onChange={(e) => updateMenuCategory(cat.id, 'selection_type', e.target.value as MenuSelectionType)}
                          >
                            <option value="a_scelta">A scelta</option>
                            <option value="tutti_inclusi">Tutti inclusi</option>
                          </select>
                          {cat.selection_type === 'a_scelta' && (
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                step="any"
                                className="input py-1.5 text-sm w-28 text-right"
                                placeholder="€/persona"
                                value={cat.price_per_guest ?? ''}
                                onChange={(e) => setMenuCategories((prev) => prev.map((c) => c.id === cat.id ? { ...c, price_per_guest: e.target.value === '' ? null : parseFloat(e.target.value) } : c))}
                                onBlur={(e) => updateMenuCategory(cat.id, 'price_per_guest', e.target.value === '' ? null : parseFloat(e.target.value))}
                              />
                              <span className="text-xs text-slate-400">/pers.</span>
                            </div>
                          )}
                          <button className="text-slate-300 hover:text-red-500 transition-colors shrink-0" onClick={() => deleteMenuCategory(cat.id)}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <button className="btn-secondary flex items-center gap-1.5 text-xs py-1.5" onClick={addMenuCategory} disabled={savingCategory}>
                      <Plus size={13} /> Aggiungi categoria
                    </button>
                    <button
                      className="flex items-center gap-1.5 text-xs py-1.5 px-3 rounded-lg border border-dm-wood/30 text-dm-wood hover:bg-dm-wood/10 transition-colors font-medium"
                      onClick={() => setTemplatePickerOpen(true)}
                    >
                      <ListChecks size={13} /> Carica da template
                    </button>
                  </div>

                  {templatePickerOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 flex flex-col max-h-[80vh]">
                        <div className="flex items-center justify-between p-4 border-b border-slate-100">
                          <h2 className="font-semibold text-dm-ink">Carica categorie da template</h2>
                          <button onClick={() => setTemplatePickerOpen(false)} className="text-slate-400 hover:text-dm-ink/80">✕</button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-1">
                          {categoryTemplates.length === 0 ? (
                            <p className="text-center text-slate-400 text-sm py-8">
                              Nessun template. Configurali in <Link href="/settings" className="text-dm-maroon hover:underline">Impostazioni</Link>.
                            </p>
                          ) : (
                            categoryTemplates.map((t) => (
                              <label key={t.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={selectedTemplates.has(t.id)}
                                  onChange={() => toggleTemplateSelection(t.id)}
                                  className="rounded"
                                />
                                <span className="text-sm font-medium text-dm-ink/80 flex-1">{t.name}</span>
                                <span className="badge bg-dm-cream text-dm-ink/70">{t.selection_type === 'a_scelta' ? 'A scelta' : 'Tutti inclusi'}</span>
                              </label>
                            ))
                          )}
                        </div>
                        <div className="p-4 border-t border-slate-100 flex justify-end gap-3">
                          <button className="btn-secondary" onClick={() => { setTemplatePickerOpen(false); setSelectedTemplates(new Set()) }}>Annulla</button>
                          <button className="btn-primary" onClick={importSelectedTemplates} disabled={selectedTemplates.size === 0 || savingCategory}>
                            Carica {selectedTemplates.size > 0 ? `(${selectedTemplates.size})` : ''}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Fase 2: Piatti per categoria */}
              {menuPhase === 'piatti' && (
                <div>
                  {menuCategories.length === 0 ? (
                    <p className="text-sm text-slate-400 py-4 text-center">Crea prima le categorie nella fase 1.</p>
                  ) : (
                    <div className="space-y-4">
                      {menuCategories.map((cat) => (
                        <div key={cat.id} className="border border-slate-100 rounded-xl p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-dm-ink/80">{cat.name || 'Categoria senza nome'}</span>
                              <span className="badge bg-dm-cream text-dm-ink/70">{cat.selection_type === 'a_scelta' ? 'A scelta' : 'Tutti inclusi'}</span>
                            </div>
                            <button
                              className="flex items-center gap-1.5 text-xs py-1 px-2.5 rounded-lg bg-dm-yellow hover:bg-dm-yellow-dark text-dm-ink font-medium transition-colors"
                              onClick={() => setDishModal({ open: true, categoryId: cat.id })}
                            >
                              <Plus size={13} /> Aggiungi piatto
                            </button>
                          </div>
                          {menuItemsFor(cat.id).length === 0 ? (
                            <p className="text-xs text-slate-400 py-2 text-center">Nessun piatto in questa categoria.</p>
                          ) : (
                            <div className="space-y-1">
                              {menuItemsFor(cat.id).map((it) => (
                                <div key={it.id} className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-lg px-3 py-1.5">
                                  <span className="text-sm text-dm-ink/80 flex-1">{it.dish_name}</span>
                                  {cat.selection_type === 'tutti_inclusi' && (
                                    <span className="text-sm text-slate-600">{formatCurrency(it.unit_price)}</span>
                                  )}
                                  <button className="text-slate-300 hover:text-red-500 transition-colors shrink-0" onClick={() => removeMenuItem(it.id)}>
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Fase 3: Margini (solo interno) */}
              {menuPhase === 'margini' && (
                <div>
                  <div className="flex items-center gap-2 bg-dm-maroon/10 border border-dm-maroon/20 rounded-xl px-3.5 py-2.5 mb-4">
                    <EyeOff size={14} className="text-dm-maroon shrink-0" />
                    <p className="text-xs text-dm-maroon font-medium">Vista solo interna: questi dati non compaiono mai nel PDF cliente.</p>
                  </div>

                  {menuCategories.length === 0 ? (
                    <p className="text-sm text-slate-400 py-4 text-center">Nessuna categoria menu configurata.</p>
                  ) : (
                    <>
                      <div className="space-y-2 mb-4">
                        {menuMargins.perCategory.map(({ category, costPerGuest, revenuePerGuest, marginPerGuest, marginPct }) => (
                          <div key={category.id} className="flex items-center gap-3 border border-slate-100 rounded-xl px-3.5 py-2.5">
                            <span className="text-sm font-medium text-dm-ink/80 flex-1">{category.name || 'Categoria senza nome'}</span>
                            <span className="text-xs text-slate-400">Costo {formatCurrency(costPerGuest)}/pers.</span>
                            <span className="text-xs text-slate-400">Ricavo {formatCurrency(revenuePerGuest)}/pers.</span>
                            <span className="text-xs font-medium text-dm-ink/70">Margine {formatCurrency(marginPerGuest)}/pers.</span>
                            <MarginBadge pct={marginPct} />
                          </div>
                        ))}
                      </div>

                      <div className="border-t border-slate-100 pt-4">
                        <div className="flex items-center gap-3 bg-dm-cream/60 rounded-xl px-3.5 py-3">
                          <span className="text-sm font-semibold text-dm-ink flex-1">Totale menu ({event.guests_count ?? 1} ospiti)</span>
                          <span className="text-xs text-slate-500">Costo {formatCurrency(menuMargins.totalCost)}</span>
                          <span className="text-xs text-slate-500">Ricavo {formatCurrency(menuMargins.totalRevenue)}</span>
                          <span className="text-sm font-semibold text-dm-ink">Margine {formatCurrency(menuMargins.totalMargin)}</span>
                          <MarginBadge pct={menuMargins.totalMarginPct} />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Tab: Scenari */}
          {tab === 'scenari' && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-dm-ink/80">Scenari di prezzo</h2>
                <button className="btn-secondary flex items-center gap-1.5 text-xs py-1.5" onClick={addScenario} disabled={savingScenario}>
                  <Plus size={13} /> Aggiungi scenario
                </button>
              </div>

              {scenarios.length === 0 ? (
                <p className="text-sm text-slate-400 py-4 text-center">Nessuno scenario. Aggiungine uno con il pulsante in alto.</p>
              ) : (
                <>
                  {/* Editable scenario list */}
                  <div className="space-y-2 mb-6">
                    {scenarios.map((sc) => {
                      const scOverrides = overridesFor(sc.id)
                      const isEditing = editingScenario === sc.id
                      return (
                        <div key={sc.id} className="border border-slate-100 rounded-xl overflow-hidden">
                          <div className="p-3 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                            <input
                              className="input py-1 text-xs font-medium sm:w-40"
                              value={sc.name}
                              onChange={(e) => updateScenario(sc.id, 'name', e.target.value)}
                              onBlur={(e) => sb.from('margin_scenarios').update({ name: e.target.value }).eq('id', sc.id)}
                            />
                            <div className="flex items-center gap-2">
                              <label className="text-xs text-slate-400 whitespace-nowrap">Sconto</label>
                              <input
                                type="number"
                                min="0"
                                max="100"
                                className="input py-1 text-xs w-20 text-right"
                                value={sc.discount_pct}
                                onChange={(e) => updateScenario(sc.id, 'discount_pct', parseFloat(e.target.value) || 0)}
                              />
                              <span className="text-xs text-slate-400">%</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setEditingScenario(isEditing ? null : sc.id)}
                              className={`text-xs font-medium px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap
                                ${isEditing ? 'bg-dm-yellow text-dm-ink' : 'bg-dm-cream text-dm-ink/70 hover:bg-dm-yellow/40'}`}
                            >
                              {scOverrides.length > 0 ? `Voci modificate (${scOverrides.length})` : 'Modifica voci'}
                            </button>
                            <div className="flex-1">
                              {(() => {
                                const s = computeMargin(items as unknown as EventItem[], event?.guests_count ?? 1, sc.discount_pct, scOverrides)
                                return <MarginBadge pct={s.marginPct} />
                              })()}
                            </div>
                            <button className="text-slate-300 hover:text-red-500 transition-colors" onClick={() => deleteScenario(sc.id)}>
                              <Trash2 size={14} />
                            </button>
                          </div>

                          {isEditing && (
                            <div className="border-t border-slate-100 bg-slate-50 p-3 space-y-1.5">
                              <p className="text-[11px] text-slate-400 mb-2">
                                Modifica quantità o prezzo solo per questo scenario. Le voci originali del preventivo non vengono toccate.
                              </p>
                              {items.filter((it) => it.name.trim() && it.id).map((it) => {
                                const ov = scOverrides.find((o) => o.item_id === it.id)
                                const hasOverride = !!ov && (ov.quantity_override !== null || ov.unit_price_override !== null)
                                return (
                                  <div key={it._key} className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 ${hasOverride ? 'bg-dm-yellow/15 border border-dm-yellow/40' : 'bg-white border border-slate-100'}`}>
                                    <span className={`text-xs flex-1 truncate ${it.type === 'ricavo' ? 'text-emerald-700' : 'text-red-500'}`}>{it.name}</span>
                                    <input
                                      type="number"
                                      step="any"
                                      className="input py-1 text-xs w-20 text-right"
                                      placeholder={String(it.quantity)}
                                      value={ov?.quantity_override ?? ''}
                                      onChange={(e) => setItemOverride(sc.id, it.id!, 'quantity_override', e.target.value)}
                                    />
                                    <span className="text-[10px] text-slate-300">×</span>
                                    <input
                                      type="number"
                                      step="any"
                                      className="input py-1 text-xs w-24 text-right"
                                      placeholder={String(it.unit_price)}
                                      value={ov?.unit_price_override ?? ''}
                                      onChange={(e) => setItemOverride(sc.id, it.id!, 'unit_price_override', e.target.value)}
                                    />
                                    {hasOverride && (
                                      <button
                                        type="button"
                                        onClick={() => clearItemOverride(sc.id, it.id!)}
                                        className="text-slate-300 hover:text-red-500 transition-colors shrink-0"
                                        title="Ripristina valore originale"
                                      >
                                        <Trash2 size={12} />
                                      </button>
                                    )}
                                  </div>
                                )
                              })}
                              {items.filter((it) => it.name.trim() && it.id).length === 0 && (
                                <p className="text-xs text-slate-400 text-center py-3">Salva prima le voci di preventivo per poterle modificare qui.</p>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {/* Comparison table */}
                  <div className="overflow-x-auto mb-6">
                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Confronto</h3>
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                          <th className="text-left px-3 py-2 font-medium text-slate-500">Scenario</th>
                          <th className="text-right px-3 py-2 font-medium text-slate-500">Sconto</th>
                          <th className="text-right px-3 py-2 font-medium text-slate-500">Ricavi</th>
                          <th className="text-right px-3 py-2 font-medium text-slate-500">Costi</th>
                          <th className="text-right px-3 py-2 font-medium text-slate-500">Margine</th>
                          <th className="text-right px-3 py-2 font-medium text-slate-500">%</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {scenarios.map((sc) => {
                          const s = computeMargin(items as unknown as EventItem[], event?.guests_count ?? 1, sc.discount_pct, overridesFor(sc.id))
                          return (
                            <tr key={sc.id}>
                              <td className="px-3 py-2 font-medium text-dm-ink/80">{sc.name}</td>
                              <td className="px-3 py-2 text-right text-slate-500">{sc.discount_pct}%</td>
                              <td className="px-3 py-2 text-right text-emerald-600">{formatCurrency(s.totalRevenue)}</td>
                              <td className="px-3 py-2 text-right text-red-500">{formatCurrency(s.totalCosts)}</td>
                              <td className="px-3 py-2 text-right font-medium">{formatCurrency(s.grossMargin)}</td>
                              <td className="px-3 py-2 text-right"><MarginBadge pct={s.marginPct} /></td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>

                  {scenarioChartData.length > 0 && (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={scenarioChartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `€${(v/1000).toFixed(0)}k`} />
                          <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                          <Legend />
                          <Bar dataKey="Ricavi" fill="#10b981" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="Costi" fill="#ef4444" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="Margine" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Tab: Export */}
          {tab === 'export' && (
            <div className="card">
              <h2 className="font-semibold text-dm-ink/80 mb-1">Preventivo cliente</h2>
              <p className="text-xs text-slate-400 mb-4">
                Il documento formale da inviare al cliente (dati cliente, clausole contrattuali, spazio firma) — diverso dall&apos;export interno qui sotto, che è per uso aziendale.
              </p>
              <div className="mb-6 flex items-center gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={generateQuotePdf}
                  disabled={generatingQuote}
                  className="flex items-center gap-2 text-sm font-medium bg-dm-yellow hover:bg-dm-yellow-dark text-dm-ink px-4 py-2 rounded-xl transition-colors disabled:opacity-40"
                >
                  {generatingQuote ? <Loader2 size={15} className="animate-spin" /> : <FileCheck size={15} />}
                  {generatingQuote ? 'Generazione in corso...' : 'Genera preventivo PDF'}
                </button>
                {menuCategories.length === 0 && (
                  <p className="text-xs text-slate-400">Nessun piatto nel tab &quot;Menu&quot;: verrà generato solo il preventivo, senza menu allegato.</p>
                )}
              </div>
              {quoteError && <p className="text-sm text-red-600 mb-4">{quoteError}</p>}
              {event && BILLING_FIELDS.some(({ key }) => !event[key]) && (
                <p className="text-xs text-slate-400 mb-4">
                  Dati di fatturazione non compilati ({BILLING_FIELDS.filter(({ key }) => !event[key]).map((f) => f.label).join(', ')}): il PDF li mostrerà vuoti.{' '}
                  <button type="button" className="text-dm-maroon hover:underline" onClick={openHeaderEdit}>Compilali ora</button>
                </p>
              )}

              <h2 className="font-semibold text-dm-ink/80 mb-6">Esporta preventivo</h2>

              {missingFields.length > 0 && (
                <div className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={18} />
                    <div>
                      <p className="text-sm font-semibold text-amber-800">Dati mancanti nel preventivo</p>
                      <p className="text-xs text-amber-700 mt-0.5">
                        Alcune informazioni non sono state compilate. Il PDF verrà comunque generato, ma è consigliato completarle prima dell&apos;invio al cliente.
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {missingFields.map(({ key, label, type }) => (
                      key === '__items' ? (
                        <div key={key} className="flex items-center justify-between gap-3 bg-white rounded-xl px-3 py-2 border border-amber-200">
                          <span className="text-xs text-amber-800">{label}</span>
                          <button
                            type="button"
                            className="text-xs font-medium text-dm-maroon hover:underline shrink-0"
                            onClick={() => setTab('preventivo')}
                          >
                            Vai al preventivo →
                          </button>
                        </div>
                      ) : (
                        <div key={key} className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 border border-amber-200">
                          <span className="text-xs text-amber-800 w-32 shrink-0">{label}</span>
                          <input
                            type={type}
                            className="flex-1 text-xs border border-amber-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-400"
                            placeholder={label}
                            value={missingDraft[key] ?? ''}
                            onChange={(e) => setMissingDraft((d) => ({ ...d, [key]: e.target.value }))}
                          />
                          <button
                            type="button"
                            disabled={!missingDraft[key] || savingMissing}
                            onClick={() => saveMissingField(key, type)}
                            className="text-xs font-medium bg-dm-yellow hover:bg-dm-yellow-dark text-dm-ink px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40 shrink-0"
                          >
                            Salva
                          </button>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              )}

              {scenarios.length > 0 && (
                <div className="mb-5">
                  <label className="label">Scenario da esportare</label>
                  <select
                    className="input"
                    value={exportScenarioId}
                    onChange={(e) => setExportScenarioId(e.target.value)}
                  >
                    <option value="">Prezzi base (nessuno sconto)</option>
                    {scenarios.map((sc) => (
                      <option key={sc.id} value={sc.id}>{sc.name} ({sc.discount_pct}% sconto)</option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Il PDF e l&apos;Excel useranno i prezzi di questo scenario invece di quelli base del preventivo.
                  </p>
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="border-2 border-slate-100 rounded-2xl p-6 text-center hover:border-dm-maroon/40 transition-colors">
                  <div className="w-12 h-12 bg-dm-maroon/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Download className="text-dm-maroon" size={24} />
                  </div>
                  <h3 className="font-semibold text-dm-ink/80 mb-1">PDF Preventivo</h3>
                  <p className="text-xs text-slate-400 mb-4">Layout professionale con logo DM</p>
                  <button className="btn-primary w-full" onClick={exportPDF}>
                    Scarica PDF
                  </button>
                </div>
                <div className="border-2 border-slate-100 rounded-2xl p-6 text-center hover:border-emerald-300 transition-colors">
                  <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <FileSpreadsheet className="text-emerald-500" size={24} />
                  </div>
                  <h3 className="font-semibold text-dm-ink/80 mb-1">Excel</h3>
                  <p className="text-xs text-slate-400 mb-4">4 fogli con formule native</p>
                  <button className="btn-primary w-full bg-emerald-600 hover:bg-emerald-700" onClick={exportExcel}>
                    Scarica Excel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tab: Note */}
          {tab === 'note' && (
            <div className="card">
              <h2 className="font-semibold text-dm-ink/80 mb-4">Note interne</h2>
              <textarea
                className="input min-h-48"
                placeholder="Note libere sull'evento..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
              />
              <div className="flex justify-end mt-3">
                <button className="btn-primary" onClick={saveNote} disabled={savingNote}>
                  {savingNote ? 'Salvataggio...' : 'Salva note'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <MarginSummaryPanel summary={summary} guestsCount={event.guests_count ?? undefined} />
        </div>
      </div>

      <CatalogImportModal
        open={catalogModal.open}
        type={catalogModal.type}
        onImport={(items) => importCatalog(catalogModal.type, items)}
        onClose={() => setCatalogModal((p) => ({ ...p, open: false }))}
      />

      <CatalogImportModal
        open={dishModal.open}
        type="ricavo"
        onImport={(items) => { if (dishModal.categoryId) addMenuItems(dishModal.categoryId, items) }}
        onClose={() => setDishModal({ open: false, categoryId: null })}
      />

      <EmailModal
        open={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
        eventName={event.name}
        clientName={event.client_name ?? null}
        clientEmail={event.client_email ?? null}
        eventDate={event.event_date ?? null}
        location={event.location ?? null}
        guestsCount={event.guests_count ?? null}
        totalRevenue={summary.totalRevenue}
        menuItems={revenues.map((r) => r.name).filter(Boolean)}
      />
    </div>
  )
}

export default function EventDetailPage() {
  if (!isSupabaseConfigured()) return <SetupBanner />
  return <EventDetailPageInner />
}
