import { NextResponse } from 'next/server'
import { CATALOG } from '@/lib/catalog'

export type { Ingredient } from '@/lib/catalog'

export async function GET() {
  return NextResponse.json(CATALOG)
}
