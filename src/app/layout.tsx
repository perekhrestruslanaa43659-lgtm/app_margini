import type { Metadata } from 'next'
import './globals.css'
import { Sidebar } from '@/components/layout/Sidebar'

export const metadata: Metadata = {
  title: 'Event & Margin Manager – Doppio Malto',
  description: 'Gestione eventi e calcolatrice margini per Doppio Malto',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body className="min-h-screen bg-slate-100">
        {children}
      </body>
    </html>
  )
}
