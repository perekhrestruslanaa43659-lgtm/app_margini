-- Da eseguire SOLO dopo aver eseguito add_event_menu_sections.sql e aver verificato
-- che il tab "Menu" della scheda evento funzioni con il nuovo builder (stesso di
-- /proposte). Nessun file del codice legge piu' queste tabelle: eventMenu.ts,
-- events/[id]/export/route.ts, QuotePdfDocument.tsx e settings/page.tsx sono stati
-- tutti aggiornati per usare events.menu_sections / proposal_templates.
DROP TABLE IF EXISTS event_menu_items;
DROP TABLE IF EXISTS event_menu_categories;
DROP TABLE IF EXISTS menu_category_templates;
