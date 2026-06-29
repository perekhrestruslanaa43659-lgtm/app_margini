import { NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'

export interface Ingredient {
  codice: string
  prodotto: string
  pvMedio: number
  ub: string
  categoria: string
}

const SKIP_CATEGORIES = new Set([
  'ZZZ ARCHIVIO FOOD',
  'ZZZ ARCHIVIO BEVERAGE',
  'SML IN USO',
  'PACKAGING',
  'MERCHANDISING',
  'PROMO',
  'LOYALTY',
  'BEER TOUR',
  'SPILLATORI',
  'DAMIGIANE',
  'FUSTI',
  'CARAFFE',
  'DELIVERY',
  'COPERTI',
  'MENù DIPENDENTI BEVERAGE',
  'MENù DIPENDENTI FOOD',
  'MENU PRANZO',
  'MENU',
  'ZERO SCUSE',
  'MAXI BURGER',
  'MINI BURGER',
  'MINI BRACE',
  'BIRRE PLASTICA',
  'COLAZIONI',
  'PACKET SAN SIRO',
  'IMOLA GP FOOD',
  'GRIGLIA',
  'SALSE',
  'AH PERO\'',
  'BOTTIGLIE 🍾',
])

export async function GET() {
  const filePath = join(process.cwd(), 'public', 'data', 'varianti.csv')
  const raw = readFileSync(filePath, 'utf-8')
  const lines = raw.split('\n').map((l) => l.trim()).filter(Boolean)

  const ingredients: Ingredient[] = []
  const seen = new Set<string>()

  for (const line of lines) {
    const parts = line.split(';')
    if (parts.length < 7) continue

    const codice = parts[0].trim().replace(/^"/, '').replace(/"$/, '')
    const tipo = parts[1].trim().replace(/^"/, '').replace(/"$/, '')
    const prodotto = parts[2].trim().replace(/^"/, '').replace(/"$/, '')
    const categoria = parts[3].trim().replace(/^"/, '').replace(/"$/, '')
    const pvRaw = parts[4].trim().replace(/^"/, '').replace(/"$/, '')
    const ub = parts[6].trim().replace(/^"/, '').replace(/"$/, '')

    // skip header rows and non-product lines
    if (!codice || codice === 'MyBusiness' || codice.includes('Codice')) continue
    if (tipo !== 'Ricetta' && tipo !== 'Prodotto' && tipo !== 'Sotto ricetta') continue
    if (SKIP_CATEGORIES.has(categoria)) continue
    if (!prodotto || prodotto.startsWith('Testo')) continue

    const pvMedio = parseFloat(pvRaw.replace(',', '.')) || 0
    const key = prodotto.trim().toUpperCase()
    if (seen.has(key)) continue
    seen.add(key)

    ingredients.push({ codice, prodotto, pvMedio, ub: ub || 'pz', categoria })
  }

  ingredients.sort((a, b) => a.prodotto.localeCompare(b.prodotto, 'it'))

  return NextResponse.json(ingredients)
}
