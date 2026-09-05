-- Sostituisce lo schema "menu a categoria singola" (event_menu_categories/items,
-- una sola fascia di prezzo) con lo stesso formato MealSection[] JSONB gia' usato da
-- proposal_templates.sections: il tab "Menu" della scheda evento ora usa lo stesso
-- builder di /proposte (piu' fasce di prezzo, gruppi con tag, condivisione piatti).
--
-- event_menu_categories/event_menu_items e menu_category_templates NON vengono
-- droppate qui: restano finche' tutto il codice che le legge (eventMenu.ts,
-- events/[id]/export/route.ts, QuotePdfDocument.tsx, il tab Menu stesso) e' stato
-- aggiornato e verificato. Un secondo script le rimuovera' a refactor concluso.
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS menu_sections JSONB NOT NULL DEFAULT '[]'::jsonb;
