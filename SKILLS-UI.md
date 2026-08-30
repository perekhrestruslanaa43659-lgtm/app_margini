---
name: doppio-malto-ui-style
description: Stile grafico "premium nero/bianco" per l'interfaccia web dell'app gestionale (Event Manager) — sidebar nera pulita, sfondo chiaro, accenti gialli usati con parsimonia, tipografia sans-serif condensata, card a bordo sottile senza ombra pesante. Ispirato al sito ufficiale doppiomalto.co.uk, non ai documenti PDF. Usa questo skill ogni volta che l'utente chiede modifiche visive all'APP WEB (sidebar, pagine, componenti, bottoni) — per i documenti stampabili (menu/preventivo) vedi SKILLS-STILE.md e SKILLS-PREVENTIVO.md, che seguono un registro completamente diverso.
---

# Stile grafico Doppio Malto — "UI Gestionale" (Event Manager)

Interfaccia web di lavoro quotidiano per lo staff (catalogo, eventi, proposte, margini), non un materiale da mostrare al cliente. Il registro è premium e sobrio, ispirato al sito ufficiale del brand (doppiomalto.co.uk): nero/bianco ad alto contrasto, tipografia pulita, zero decorazione "sticker". È l'opposto del tono POP di `SKILLS-STILE.md`.

## Quando usarlo vs gli altri skill di stile

- **SKILLS-UI.md** (questo): qualunque pagina/componente dell'app gestionale — sidebar, tabelle, form, dashboard, modali.
- **SKILLS-STILE.md**: menu evento, volantini, proposte commerciali generate come PDF/HTML — tono POP, badge ruotati, ombra piena.
- **SKILLS-PREVENTIVO.md**: preventivi/offerte formali PDF — tono istituzionale, campi da compilare, clausole.

Questi tre mondi condividono il brand ma **non condividono palette né registro**: non portare accenti gialli pieni o font manoscritti (Caveat) nell'UI, e non portare bordi sottili/nero-su-bianco nei PDF promozionali.

## Palette

```css
--dm-ink:         #14140F;  /* sidebar, testo principale, bottone primario */
--dm-maroon:       #14140F;  /* alias storico: accento cliccabile (hover/focus/link) — stesso valore di ink, non più un rosso */
--dm-maroon-dark:  #2A2A22;  /* hover del bottone primario */
--dm-yellow:       #F5C518;  /* UNICO colore vivo: stato attivo in sidebar, CTA, focus ring */
--dm-yellow-dark:  #D9A800;
--dm-cream:        #FAFAF7;  /* sfondo pagina */
--dm-line:         #E4E2DA;  /* bordi card, separatori, chip inattivi */
--dm-wood:         #7A7A6E;  /* testo muted, icone secondarie, badge neutri */
```

Regola cardine: **il giallo è scarso**. Non colorare card, sfondi ampi o bottoni secondari di giallo — è riservato allo stato "questo è attivo/selezionato" o alla CTA primaria più importante della pagina. Se una pagina ha bisogno di distinguere N categorie/stati diversi, non inventare N colori pastello: usa il nome/etichetta più un badge neutro (`bg-dm-cream text-dm-wood`), oppure — solo per stati semantici reali (margine buono/cattivo, ricavi/costi in un grafico) — colori semantici standard (verde/rosso), mai come decorazione.

## Tipografia

- **Oswald** (peso 500–700) — titoli pagina (`h1`–`h4`), logo testuale in sidebar, `.font-display`. Condensato, maiuscolo con tracking leggero per il logo, non per i titoli di contenuto.
- **Inter** (peso 400–700) — tutto il resto: corpo, nav, bottoni, input, tabelle.
- Niente Caveat, niente Archivo Black, niente font manoscritto: quelli restano dentro i PDF (`SKILLS-STILE.md`).

## Struttura e componenti

**Sidebar**: sfondo `--dm-ink` pieno, nessun bordo. Logo in alto: nome brand in Oswald maiuscolo (no badge/icona quadrata "DM" — il vero logo Doppio Malto è orizzontale e su sfondo bianco, non entra in un badge compatto; se serve un'immagine, usarla per intero in un header più alto, non ritagliata). Voci nav: testo bianco 55% opacità di default, bianco pieno su hover, **stato attivo = sfondo giallo 10% + testo giallo pieno + bordo sinistro giallo 2px** (`shadow-[inset_2px_0_0_...]`), mai sfondo giallo pieno.

**Card** (`.card` in `globals.css`): sfondo bianco, `border border-dm-line`, `rounded-xl`, **nessuna ombra** (niente `shadow-sm`, niente ombra "sticker"). Il bordo sottile è l'unico modo in cui una card si stacca dallo sfondo crema della pagina.

**Bottoni**:
- `.btn-primary`: sfondo `--dm-ink`, testo bianco, `rounded-lg`, hover `--dm-maroon-dark`. Non maiuscolo, non bold pesante — un semplice `font-medium`.
- `.btn-secondary`: sfondo bianco, bordo `--dm-line`, testo ink.
- `.btn-danger`: rosso semantico standard (`bg-red-600`), non riciclato dal vecchio maroon — deve leggersi come "azione distruttiva" a colpo d'occhio, cosa che un nero pieno non comunica.

**Input**: bordo `--dm-line`, focus ring giallo (`focus:ring-dm-yellow`) — è uno dei pochi punti dove il giallo compare, ed è intenzionale (segnala il campo attivo).

**Liste raggruppate per categoria** (es. Catalogo Voci): righe bianche uniformi con separatore di bordo, **non** una tavolozza di colori diversi per categoria. La categoria si riconosce dal nome e da un badge conteggio neutro (`bg-dm-cream text-dm-wood`), non dal colore di sfondo della riga — con 10+ categorie, colori diversi generano rumore visivo invece di aiutare la scansione.

**Dashboard / KPI card**: qui un bordo colorato sottile (giallo/verde/viola/blu) per distinguere poche metriche chiave (3-4) è accettabile e già in uso — è diverso dal caso "23 categorie del catalogo": poche card con bordo colorato leggibile a colpo d'occhio, non decine di righe con sfondo pieno.

**Badge di stato** (bozza/confermato/concluso/annullato): colore semantico tenue (sfondo pastello 10-20%, testo pieno), coerente con `StatusBadge.tsx` esistente — questi restano colorati perché comunicano uno stato reale, non sono decorazione.

## Cosa NON portare da SKILLS-STILE.md

- Niente sfondo giallo pieno su pagine o hero.
- Niente ombra "8px 8px 0 var(--ink)" sulle card.
- Niente badge prezzo a cerchio, niente tag ruotati.
- Niente Caveat/Archivo Black nell'interfaccia.
- Niente tavolozza multicolore per elenchi con molte voci (categorie, righe tabella) — il colore in UI è riservato a stato/gerarchia, non a decorazione.

## Dove vive

`src/app/globals.css` (variabili colore + classi `.card`/`.btn-*`/`.input` condivise), `tailwind.config.ts` (token `dm.*`), `src/components/layout/Sidebar.tsx`. Cambiare questi tre file aggiorna l'intera app: la maggior parte delle pagine eredita lo stile dalle classi condivise senza bisogno di modifiche pagina per pagina — verificare comunque ogni pagina che usi colori hardcoded locali (come succedeva in `catalog/page.tsx` prima di questo restyle) invece delle classi/token condivisi.
