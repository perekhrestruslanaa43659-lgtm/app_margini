/* Bot Calendario: pannello laterale di Excel per CALENDARIO EVENTI DUOMO.
 *
 * Moduli per aggiungere, modificare, spostare e cancellare eventi nel foglio
 * "programmazione eventi 2026". Tutto avviene dentro Excel tramite Office.js.
 * L'unica richiesta di rete va all'AI locale (Ollama su questo stesso PC) e
 * contiene solo la frase scritta dall'utente, mai il contenuto del calendario:
 * l'AI compila un modulo, l'utente lo controlla e conferma l'anteprima.
 */

const SHEET_NAME = 'programmazione eventi 2026'
const HEADER_ROW = 5
const FIRST_DATA_ROW = 7
const OLLAMA_URL = 'http://127.0.0.1:11434'
const MODEL_KEY = 'dm-bot-calendario-modello'
const DEFAULT_MODEL = 'qwen2.5:3b'

let undoStack = []
let busy = false

const $ = (id) => document.getElementById(id)

// ---------- avvio ----------

Office.onReady((info) => {
  if (info.host !== Office.HostType.Excel) {
    setMsg('Questo pannello funziona solo dentro Excel.', true)
    return
  }
  $('date').value = new Date().toISOString().slice(0, 10)
  $('show').onclick = () => guard(() => showDate($('date').value))
  $('date').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('show').click() })
  $('search').onclick = () => guard(() => search($('q').value))
  $('q').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('search').click() })
  $('undo').onclick = () => guard(undoLast)
  $('askGo').onclick = () => guard(() => askAI($('ask').value))
  $('ask').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); $('askGo').click() }
  })
  checkAI()
})

async function guard(fn) {
  if (busy) return
  busy = true
  setButtons()
  setMsg('')
  try {
    await fn()
  } catch (err) {
    setMsg(err.message || String(err), true)
  } finally {
    busy = false
    setButtons()
  }
}

function setButtons() {
  $('show').disabled = busy
  $('search').disabled = busy
  $('askGo').disabled = busy
  $('undo').disabled = busy || undoStack.length === 0
}

function setMsg(text, isError) {
  $('msg').textContent = text
  $('msg').className = isError ? 'error' : ''
}

function el(tag, attrs, ...children) {
  const node = document.createElement(tag)
  for (const [k, v] of Object.entries(attrs || {})) {
    if (k === 'onclick') node.onclick = v
    else if (k === 'className') node.className = v
    else node.setAttribute(k, v)
  }
  for (const c of children) if (c != null) node.append(c)
  return node
}

function panel(...children) {
  $('panel').replaceChildren(...children)
  $('panel').scrollIntoView({ block: 'start' })
}

// ---------- utilità foglio ----------

function colLetter(n) {
  let s = ''
  while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26) }
  return s
}

function norm(v) {
  return String(v == null ? '' : v).replace(/\s+/g, ' ').trim().toLowerCase()
}

function serialToISO(v) {
  if (typeof v !== 'number' || v < 20000 || v > 80000) return null
  return new Date(Math.round((Math.floor(v) - 25569) * 86400000)).toISOString().slice(0, 10)
}

function textToISO(t) {
  const m = String(t || '').match(/(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})/)
  if (!m) return null
  const y = m[3].length === 2 ? '20' + m[3] : m[3]
  return `${y}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`
}

function formatDate(iso) {
  const [y, m, d] = iso.split('-')
  const day = new Date(Date.UTC(+y, +m - 1, +d)).toLocaleDateString('it-IT', { weekday: 'long', timeZone: 'UTC' })
  return `${day} ${d}/${m}/${y}`
}

// Tipo di campo dal nome dell'intestazione: le sale sono flag (casella),
// tutto il resto è testo libero così non si perde mai il valore esistente.
function fieldKind(name) {
  return name.includes('sala') ? 'flag' : 'text'
}

// Carica l'intervallo usato del foglio calendario e ne ricava la struttura
// (colonna data e blocchi evento), come fa SyncBot.bas.
async function loadGrid(ctx) {
  const sheet = ctx.workbook.worksheets.getItemOrNullObject(SHEET_NAME)
  await ctx.sync()
  if (sheet.isNullObject) throw new Error(`Non trovo il foglio "${SHEET_NAME}": apri il pannello sul file del calendario.`)

  const used = sheet.getUsedRange()
  used.load('values,text,rowIndex,columnIndex,rowCount,columnCount')
  await ctx.sync()

  const r0 = used.rowIndex + 1
  const c0 = used.columnIndex + 1
  const lastRow = r0 + used.rowCount - 1
  const lastCol = c0 + used.columnCount - 1
  const inside = (r, c) => r >= r0 && c >= c0 && r <= lastRow && c <= lastCol
  const val = (r, c) => inside(r, c) ? used.values[r - r0][c - c0] : ''
  const txt = (r, c) => inside(r, c) ? String(used.text[r - r0][c - c0]) : ''

  const headers = {}
  for (let c = 1; c <= lastCol; c++) headers[c] = norm(txt(HEADER_ROW, c))
  let dateCol = 1
  for (let c = 1; c <= lastCol; c++) if (headers[c] === 'data') { dateCol = c; break }

  const starts = []
  for (let c = 1; c <= lastCol; c++) if (headers[c] === 'cliente') starts.push(c)
  if (!starts.length) throw new Error(`Non trovo nessuna colonna "cliente" in riga ${HEADER_ROW}.`)

  const blocks = starts.map((start, i) => {
    const end = i + 1 < starts.length ? starts[i + 1] - 1 : lastCol
    const fields = []
    for (let c = start; c <= end; c++) {
      if (headers[c]) fields.push({ col: c, name: headers[c], kind: fieldKind(headers[c]) })
    }
    return { start, end, fields }
  })

  const rowDate = (r) => serialToISO(val(r, dateCol)) || textToISO(txt(r, dateCol))
  const findRow = (iso) => {
    for (let r = FIRST_DATA_ROW; r <= lastRow; r++) if (rowDate(r) === iso) return r
    return null
  }
  const blockEmpty = (r, b) => blocks[b].fields.every((f) => txt(r, f.col).trim() === '')

  // Il segno usato per le sale ("x", "X", "si"...): il più frequente nel foglio.
  const counts = {}
  for (const b of blocks) for (const f of b.fields) if (f.kind === 'flag') {
    for (let r = FIRST_DATA_ROW; r <= lastRow; r++) {
      const t = txt(r, f.col).trim()
      if (t) counts[t] = (counts[t] || 0) + 1
    }
  }
  const flagMark = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0] || 'x'

  return { sheet, val, txt, headers, dateCol, blocks, rowDate, findRow, blockEmpty, flagMark, lastRow }
}

// ---------- vista di una data ----------

async function showDate(iso) {
  if (!iso) throw new Error('Scegli una data.')
  $('date').value = iso
  const view = await Excel.run(async (ctx) => {
    const g = await loadGrid(ctx)
    const r = g.findRow(iso)
    if (!r) return null
    return {
      r,
      blocks: g.blocks.map((b, i) => ({
        index: i,
        empty: g.blockEmpty(r, i),
        values: b.fields.map((f) => ({ name: f.name, text: g.txt(r, f.col).trim() })),
      })),
    }
  })
  if (!view) throw new Error(`La data ${iso} non c'è nel calendario.`)

  const cards = view.blocks.map((b) => {
    const title = `Blocco ${b.index + 1}`
    if (b.empty) {
      return el('div', { className: 'card free' },
        el('h3', {}, `${title}: libero`),
        el('div', { className: 'actions' },
          el('button', { className: 'primary small', onclick: () => guard(() => openForm(iso, b.index, true)) }, 'Nuovo evento qui')))
    }
    const kv = el('dl', { className: 'kv' })
    for (const v of b.values) if (v.text) kv.append(el('dt', {}, v.name), el('dd', {}, v.text))
    return el('div', { className: 'card' },
      el('h3', {}, title),
      kv,
      el('div', { className: 'actions' },
        el('button', { className: 'small', onclick: () => guard(() => openForm(iso, b.index, false)) }, 'Modifica'),
        el('button', { className: 'small', onclick: () => guard(() => openMove(iso, b.index)) }, 'Sposta'),
        el('button', { className: 'small danger', onclick: () => guard(() => confirmDelete(iso, b.index)) }, 'Cancella')))
  })
  panel(el('h2', {}, formatDate(iso) + ` (riga ${view.r})`), ...cards)
}

// ---------- ricerca ----------

async function search(text) {
  const q = norm(text)
  if (!q) throw new Error('Scrivi cosa cercare.')
  const hits = await Excel.run(async (ctx) => {
    const g = await loadGrid(ctx)
    const out = []
    for (let r = FIRST_DATA_ROW; r <= g.lastRow && out.length < 50; r++) {
      g.blocks.forEach((b, i) => {
        if (b.fields.some((f) => norm(g.txt(r, f.col)).includes(q))) {
          out.push({ iso: g.rowDate(r), block: i, cliente: g.txt(r, b.start).trim() })
        }
      })
    }
    return out
  })
  if (!hits.length) { panel(el('p', {}, `Nessun risultato per "${text}".`)); return }
  panel(
    el('h2', {}, `${hits.length} risultat${hits.length === 1 ? 'o' : 'i'} per "${text}"`),
    ...hits.map((h) => el('button', {
      className: 'result',
      onclick: () => h.iso && guard(() => showDate(h.iso)),
    }, `${h.iso ? formatDate(h.iso) : 'senza data'} · Blocco ${h.block + 1} · ${h.cliente || '(senza cliente)'}`)))
}

// ---------- nuovo / modifica ----------

// prefill (dall'AI): { testi: { "chiave": valore }, sala: "sala verde" | "" }.
// Le chiavi si abbinano ai campi per parola contenuta nell'intestazione.
async function openForm(iso, block, isNew, prefill) {
  const data = await Excel.run(async (ctx) => {
    const g = await loadGrid(ctx)
    const r = g.findRow(iso)
    if (!r) throw new Error(`La data ${iso} non c'è nel calendario.`)
    if (isNew && !g.blockEmpty(r, block)) throw new Error('Nel frattempo questo blocco è stato occupato: ricarica la data.')
    return {
      r,
      flagMark: g.flagMark,
      fields: g.blocks[block].fields.map((f) => ({ ...f, addr: colLetter(f.col) + r, text: g.txt(r, f.col).trim() })),
    }
  })

  const inputs = []
  const textFields = []
  const flags = el('div', { className: 'checks' })
  for (const f of data.fields) {
    if (f.kind === 'flag') {
      const box = el('input', { type: 'checkbox' })
      box.checked = f.text !== ''
      if (prefill && prefill.sala) box.checked = f.name.includes(norm(prefill.sala).replace('sala ', ''))
      inputs.push({ f, get: () => box.checked })
      flags.append(el('label', {}, box, ' ' + f.name))
    } else {
      const input = el('input', { type: 'text', placeholder: placeholderFor(f.name) })
      input.value = f.text
      const suggested = prefill && prefillFor(f.name, prefill.testi)
      if (suggested) { input.value = suggested; input.style.borderColor = 'var(--accent)' }
      inputs.push({ f, get: () => input.value.trim() })
      textFields.push(el('div', { className: 'field' }, el('label', {}, f.name), input))
    }
  }

  const save = () => guard(async () => {
    const changes = []
    for (const { f, get } of inputs) {
      const now = get()
      if (f.kind === 'flag') {
        const was = f.text !== ''
        if (now !== was) changes.push({ addr: f.addr, label: f.name, oldText: f.text, newValue: now ? data.flagMark : '' })
      } else if (now !== f.text) {
        changes.push({ addr: f.addr, label: f.name, oldText: f.text, newValue: now })
      }
    }
    const cliente = inputs.find((i) => i.f.name === 'cliente')
    if (isNew && cliente && !cliente.get()) throw new Error('Scrivi almeno il nome del cliente.')
    if (!changes.length) throw new Error('Non hai cambiato niente.')
    const title = `${isNew ? 'Nuovo evento' : 'Modifica'}: ${formatDate(iso)}, blocco ${block + 1}`
    await previewAndApply(title, changes, () => showDate(iso))
  })

  panel(el('div', { className: 'card' },
    el('h2', {}, `${isNew ? 'Nuovo evento' : 'Modifica evento'}: ${formatDate(iso)}, blocco ${block + 1}`),
    ...textFields,
    flags,
    el('div', { className: 'actions' },
      el('button', { className: 'primary', onclick: save }, 'Vedi anteprima'),
      el('button', { onclick: () => guard(() => showDate(iso)) }, 'Indietro'))))
}

function placeholderFor(name) {
  if (name.includes('orario')) return 'es. 20:30'
  if (name.includes('pax')) return 'es. 30'
  if (name.includes('mail')) return 'es. nome@azienda.it'
  return ''
}

// ---------- sposta ----------

async function openMove(iso, block, targetIso) {
  const dateInput = el('input', { type: 'date' })
  dateInput.value = targetIso || iso
  const blockSelect = el('select', {},
    el('option', { value: 'auto' }, 'Primo blocco libero'),
    el('option', { value: '0' }, 'Blocco 1'),
    el('option', { value: '1' }, 'Blocco 2'))

  const go = () => guard(async () => {
    const target = dateInput.value
    if (!target) throw new Error('Scegli la nuova data.')
    const plan = await Excel.run(async (ctx) => {
      const g = await loadGrid(ctx)
      const r1 = g.findRow(iso)
      const r2 = g.findRow(target)
      if (!r2) throw new Error(`La data ${target} non c'è nel calendario.`)
      let b2 = blockSelect.value === 'auto'
        ? g.blocks.findIndex((_, i) => g.blockEmpty(r2, i) && !(r2 === r1 && i === block))
        : Number(blockSelect.value)
      if (b2 < 0 || b2 >= g.blocks.length) throw new Error(`Il ${formatDate(target)} non ha blocchi liberi.`)
      if (r2 === r1 && b2 === block) throw new Error('È la stessa posizione di partenza.')
      if (!g.blockEmpty(r2, b2)) throw new Error(`Il blocco ${b2 + 1} del ${formatDate(target)} è già occupato.`)

      const changes = []
      for (const f of g.blocks[block].fields) {
        const t = g.txt(r1, f.col).trim()
        if (!t) continue
        const dest = g.blocks[b2].fields.find((x) => x.name === f.name)
        if (!dest) throw new Error(`Il blocco ${b2 + 1} non ha la colonna "${f.name}".`)
        changes.push({ addr: colLetter(dest.col) + r2, label: `${f.name} (nuova data)`, oldText: '', newValue: t, copyFrom: colLetter(f.col) + r1 })
      }
      for (const f of g.blocks[block].fields) {
        const t = g.txt(r1, f.col).trim()
        if (t) changes.push({ addr: colLetter(f.col) + r1, label: `${f.name} (vecchia data)`, oldText: t, newValue: '' })
      }
      return { changes, b2 }
    })
    await previewAndApply(`Sposta: ${formatDate(iso)} blocco ${block + 1} → ${formatDate(target)} blocco ${plan.b2 + 1}`,
      plan.changes, () => showDate(target))
  })

  panel(el('div', { className: 'card' },
    el('h2', {}, `Sposta evento del ${formatDate(iso)}, blocco ${block + 1}`),
    el('div', { className: 'field' }, el('label', {}, 'Nuova data'), dateInput),
    el('div', { className: 'field' }, el('label', {}, 'Blocco'), blockSelect),
    el('div', { className: 'actions' },
      el('button', { className: 'primary', onclick: go }, 'Vedi anteprima'),
      el('button', { onclick: () => guard(() => showDate(iso)) }, 'Indietro'))))
}

// ---------- cancella ----------

async function confirmDelete(iso, block) {
  const changes = await Excel.run(async (ctx) => {
    const g = await loadGrid(ctx)
    const r = g.findRow(iso)
    return g.blocks[block].fields
      .map((f) => ({ addr: colLetter(f.col) + r, label: f.name, oldText: g.txt(r, f.col).trim(), newValue: '' }))
      .filter((c) => c.oldText !== '')
  })
  await previewAndApply(`Cancella evento: ${formatDate(iso)}, blocco ${block + 1}`, changes, () => showDate(iso))
}

// ---------- richiesta in linguaggio naturale (AI locale) ----------

const AI_FIELDS = ['email', 'orario', 'pax', 'budget', 'fee', 'caparra', 'servizio', 'menu']
// Parola dell'intestazione del foglio che corrisponde a ogni campo dell'AI.
const AI_FIELD_HEADER = { cliente: 'cliente', email: 'mail', orario: 'orario', pax: 'pax', budget: 'bdgt', fee: 'fee', caparra: 'caparra', servizio: 'modalit', menu: 'menu' }

const AI_SCHEMA = {
  type: 'object',
  properties: {
    azione: { type: 'string', enum: ['nuovo', 'modifica', 'sposta', 'cancella', 'mostra', 'cerca'] },
    data: { type: 'string' },
    nuova_data: { type: 'string' },
    cliente: { type: 'string' },
    sala: { type: 'string', enum: ['', 'verde', 'circolo', 'vip'] },
    ...Object.fromEntries(AI_FIELDS.map((f) => [f, { type: 'string' }])),
  },
  required: ['azione'],
}

function aiSystemPrompt() {
  const today = new Date()
  const iso = today.toISOString().slice(0, 10)
  const day = today.toLocaleDateString('it-IT', { weekday: 'long' })
  return `Estrai i dati da una richiesta per il calendario eventi di un ristorante.
Oggi è ${day} ${iso}. Date in formato AAAA-MM-GG, anno ${iso.slice(0, 4)} se non detto (se la data è già passata, l'anno dopo).
Campi: azione (nuovo=aggiungere/mettere un evento, modifica=cambiare dati, sposta=cambiare data, cancella, mostra=vedere una data, cerca=trovare un cliente), data (data dell'evento; per sposta è la data di partenza), nuova_data (solo per sposta), cliente (nome del cliente), sala (verde/circolo/vip), email, orario (HH:MM), pax (numero persone), budget, fee, caparra, servizio (modalità di servizio), menu.
Scrivi solo i campi detti esplicitamente nella richiesta. Non inventare.

Esempio: "aggiungi Neri il 5/12 alle 13, 20 persone, sala vip, menu 30"
{"azione":"nuovo","data":"2026-12-05","cliente":"Neri","sala":"vip","orario":"13:00","pax":"20","menu":"30"}`
}

function getModel() {
  try { return localStorage.getItem(MODEL_KEY) || DEFAULT_MODEL } catch (e) { return DEFAULT_MODEL }
}

async function checkAI() {
  try {
    const res = await fetch(OLLAMA_URL + '/api/tags')
    const data = await res.json()
    const names = (data.models || []).map((m) => m.name)
    if (!names.includes(getModel())) {
      $('aiStatus').textContent = `AI locale attiva, ma manca il modello ${getModel()}: in un terminale esegui "ollama pull ${getModel()}".`
      return
    }
    $('aiStatus').textContent = 'AI locale pronta.'
    // Carica il modello in memoria adesso, così la prima richiesta è più veloce.
    fetch(OLLAMA_URL + '/api/generate', { method: 'POST', body: JSON.stringify({ model: getModel(), keep_alive: '30m' }) }).catch(() => {})
  } catch (e) {
    $('aiStatus').textContent = 'AI locale non attiva su questo PC: avvia Ollama, oppure usa data e ricerca qui sotto.'
  }
}

async function callAI(text) {
  let res
  try {
    res = await fetch(OLLAMA_URL + '/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        model: getModel(),
        stream: false,
        format: AI_SCHEMA,
        keep_alive: '30m',
        options: { temperature: 0, num_ctx: 2048 },
        messages: [{ role: 'system', content: aiSystemPrompt() }, { role: 'user', content: text }],
      }),
    })
  } catch (e) {
    throw new Error('Non riesco a contattare l\'AI locale (Ollama). Controlla che sia avviata su questo PC, oppure usa data e ricerca qui sotto.')
  }
  if (!res.ok) throw new Error('L\'AI locale ha risposto con un errore (' + res.status + ').')
  const data = await res.json()
  try { return JSON.parse(data.message.content) } catch (e) { throw new Error('Non ho capito la richiesta: prova a riformularla.') }
}

// Tiene solo i valori che compaiono davvero nella frase: i modelli piccoli a
// volte inventano (es. un orario preso da una data, la sala dal nome Verdi).
function sanitizeAI(raw, text) {
  const t = norm(text)
  const digits = (v) => (String(v).match(/\d+/g) || [])
  const hasNumbers = (v) => digits(v).length > 0 && digits(v).every((d) => new RegExp(`(^|\\D)${d}(\\D|$)`).test(t))
  const isoOk = (v) => /^\d{4}-\d{2}-\d{2}$/.test(v || '')

  const out = { azione: actionFromKeywords(t) || raw.azione, data: isoOk(raw.data) ? raw.data : '', nuova_data: isoOk(raw.nuova_data) ? raw.nuova_data : '', testi: {}, sala: '' }

  const cliente = String(raw.cliente || '').trim()
  out.cliente = cliente && t.includes(norm(cliente)) ? cliente : ''

  if (raw.sala && new RegExp(`\\b${raw.sala}\\b`).test(t)) out.sala = 'sala ' + raw.sala

  for (const f of AI_FIELDS) {
    const v = String(raw[f] || '').trim()
    if (!v) continue
    let ok
    if (f === 'email') ok = t.includes(norm(v))
    else if (f === 'orario') {
      const m = v.match(/^(\d{1,2})[:.](\d{2})$/)
      ok = !!m && (t.includes(`${+m[1]}:${m[2]}`) || t.includes(`${+m[1]}.${m[2]}`) || (m[2] === '00' && new RegExp(`\\balle (ore )?${+m[1]}\\b`).test(t)))
    } else if (['pax', 'budget', 'fee', 'caparra', 'menu'].includes(f)) ok = hasNumbers(v) || t.includes(norm(v))
    else ok = t.includes(norm(v))
    if (ok) out.testi[f] = v
  }
  // "menu 35" scambiato per budget: se la frase parla di menu e non di budget, sposta il valore.
  if (out.testi.budget && !out.testi.menu && /\bmen[uù]\b/.test(t) && !/\b(budget|bdgt)\b/.test(t)) {
    out.testi.menu = out.testi.budget
    delete out.testi.budget
  }
  return out
}

// Se la frase contiene parole chiave di una sola azione, vale quella: è più
// affidabile del modello piccolo. Altrimenti decide l'AI.
const ACTION_KEYWORDS = {
  sposta: /\b(sposta|sposto|spostare|anticipa|posticipa|rimanda)\b/,
  cancella: /\b(cancella|cancellare|elimina|eliminare|togli|annulla l'evento|disdici|disdetta)\b/,
  mostra: /\b(cosa c'è|cosa c'e|che c'è|che eventi|mostra|mostrami|fammi vedere|com'è messo|libero|liberi|disponibil)/,
  cerca: /\b(cerca|trova|quando (ha|è|viene)|dov'è)\b/,
  nuovo: /\b(metti|mettere|aggiungi|aggiungere|inserisci|prenota|prenotazione|nuovo evento|segna)\b/,
  modifica: /\b(cambia|cambiare|modifica|modificare|aggiorna|correggi)\b/,
}

function actionFromKeywords(t) {
  const hits = Object.keys(ACTION_KEYWORDS).filter((a) => ACTION_KEYWORDS[a].test(t))
  return hits.length === 1 ? hits[0] : ''
}

function prefillFor(fieldName, testi) {
  if (!testi) return ''
  for (const [k, v] of Object.entries(testi)) if (fieldName.includes(AI_FIELD_HEADER[k])) return v
  return ''
}

// Trova il blocco di un cliente in una data; se data o cliente mancano,
// prova con la ricerca sul foglio. Restituisce { iso, block } oppure null.
async function locateEvent(iso, cliente) {
  return Excel.run(async (ctx) => {
    const g = await loadGrid(ctx)
    const q = norm(cliente)
    const candidates = []
    for (let r = FIRST_DATA_ROW; r <= g.lastRow; r++) {
      const d = g.rowDate(r)
      if (iso && d !== iso) continue
      g.blocks.forEach((b, i) => {
        if (g.blockEmpty(r, i)) return
        if (!q || norm(g.txt(r, b.start)).includes(q)) candidates.push({ iso: d, block: i })
      })
    }
    return candidates
  })
}

async function askAI(text) {
  text = text.trim()
  if (!text) throw new Error('Scrivi la richiesta.')
  $('aiStatus').textContent = 'Sto leggendo la richiesta… (con l\'AI locale può volerci qualche secondo)'
  const started = Date.now()
  let req
  try {
    req = sanitizeAI(await callAI(text), text)
  } finally {
    $('aiStatus').textContent = `AI locale pronta. Ultima risposta in ${Math.round((Date.now() - started) / 1000)} s.`
  }

  const { azione, data, nuova_data, cliente } = req
  if (azione === 'mostra') {
    if (!data) throw new Error('Non ho capito la data: scegli la data qui sotto.')
    return showDate(data)
  }
  if (azione === 'cerca') {
    if (!cliente) throw new Error('Non ho capito chi cercare: usa la ricerca qui sotto.')
    $('q').value = cliente
    return search(cliente)
  }
  if (azione === 'nuovo') {
    if (!data) throw new Error('Non ho capito la data dell\'evento: scrivila, es. "il 12/11".')
    const free = await Excel.run(async (ctx) => {
      const g = await loadGrid(ctx)
      const r = g.findRow(data)
      if (!r) throw new Error(`La data ${data} non c'è nel calendario.`)
      return g.blocks.findIndex((_, i) => g.blockEmpty(r, i))
    })
    if (free < 0) {
      await showDate(data)
      throw new Error(`Il ${formatDate(data)} è già pieno: entrambi i blocchi sono occupati.`)
    }
    $('date').value = data
    return openForm(data, free, true, { testi: { ...req.testi, cliente }, sala: req.sala })
  }

  // modifica / sposta / cancella: prima si trova l'evento.
  if (!data && !cliente) throw new Error('Dimmi la data o il cliente dell\'evento.')
  const found = await locateEvent(data, cliente)
  if (found.length === 0) {
    if (data) await showDate(data)
    throw new Error(`Non trovo l'evento${cliente ? ' di ' + cliente : ''}${data ? ' il ' + formatDate(data) : ''}.`)
  }
  if (found.length > 1) {
    if (data) await showDate(data)
    else { $('q').value = cliente; await search(cliente) }
    throw new Error('Ho trovato più eventi: scegli quello giusto qui sotto.')
  }
  const { iso, block } = found[0]
  $('date').value = iso
  if (azione === 'modifica') return openForm(iso, block, false, { testi: req.testi, sala: req.sala })
  if (azione === 'sposta') return openMove(iso, block, nuova_data)
  if (azione === 'cancella') return confirmDelete(iso, block)
  throw new Error('Non ho capito cosa fare: prova a riformulare.')
}

// ---------- anteprima, scrittura, annulla ----------

// Converte il testo del modulo nel tipo giusto per Excel. Gli orari si
// riconoscono solo nella colonna "orario", così un importo come 20.50 resta
// un numero.
function convertValue(s, fieldName) {
  if (s === '') return { v: '' }
  if (fieldName.includes('orario') && /^\d{1,2}[:.]\d{2}$/.test(s)) {
    const [h, m] = s.split(/[:.]/).map(Number)
    if (h < 24 && m < 60) return { v: (h * 60 + m) / 1440, fmt: 'hh:mm' }
  }
  // I numeri che iniziano con 0 (telefoni) restano testo per non perdere lo zero.
  if (/^-?\d+([.,]\d+)?$/.test(s) && !/^0\d/.test(s)) return { v: parseFloat(s.replace(',', '.')) }
  return { v: s }
}

function previewAndApply(title, changes, after) {
  const list = el('ul', {}, ...changes.map((c) => el('li', {},
    `${c.label} [${c.addr}]: `,
    el('span', { className: 'old' }, c.oldText || '(vuoto)'),
    ' → ',
    c.newValue === '' ? '(vuoto)' : c.newValue)))

  const confirm = async () => {
    await applyChanges(title, changes)
    setMsg('Fatto. Puoi annullare con "Annulla ultima".')
    await after()
  }
  panel(el('div', { className: 'card preview' },
    el('h2', {}, title),
    el('p', { className: 'hint' }, 'Controlla e conferma:'),
    list,
    el('div', { className: 'actions' },
      el('button', { className: 'primary', onclick: () => guard(confirm) }, 'Conferma'),
      el('button', { onclick: () => guard(after) }, 'Annulla'))))
}

async function applyChanges(title, changes) {
  await Excel.run(async (ctx) => {
    const sheet = ctx.workbook.worksheets.getItem(SHEET_NAME)
    const targets = changes.map((c) => {
      const range = sheet.getRange(c.addr)
      range.load('formulas,numberFormat')
      const source = c.copyFrom ? sheet.getRange(c.copyFrom) : null
      if (source) source.load('formulas,numberFormat')
      return { c, range, source }
    })
    await ctx.sync()

    const before = targets.map(({ c, range }) => ({ addr: c.addr, formula: range.formulas[0][0], format: range.numberFormat[0][0] }))

    for (const { c, range, source } of targets) {
      if (source) {
        // Spostamento: copia il valore originale con il suo formato.
        range.formulas = source.formulas
        range.numberFormat = source.numberFormat
      } else {
        const cv = convertValue(c.newValue, c.label)
        range.values = [[cv.v]]
        if (cv.fmt && range.numberFormat[0][0] === 'General') range.numberFormat = [[cv.fmt]]
      }
    }
    await ctx.sync()
    undoStack.push({ title, before })
  })
}

async function undoLast() {
  const last = undoStack[undoStack.length - 1]
  if (!last) return
  await Excel.run(async (ctx) => {
    const sheet = ctx.workbook.worksheets.getItem(SHEET_NAME)
    for (const b of last.before) {
      const range = sheet.getRange(b.addr)
      range.formulas = [[b.formula]]
      range.numberFormat = [[b.format]]
    }
    await ctx.sync()
  })
  undoStack.pop()
  setMsg(`Annullato: ${last.title}.`)
  const iso = $('date').value
  if (iso) await showDate(iso)
}
