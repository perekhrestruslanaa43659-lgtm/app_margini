---
name: doppio-malto-preventivo-style
description: Stile grafico "documento istituzionale" per preventivi evento formali di Doppio Malto — card bianche a bordo netto, tabella servizi, sezione menu dettagliata, clausole contrattuali, coordinate bancarie. Usa questo skill ogni volta che l'utente chiede un PREVENTIVO/OFFERTA formale da inviare al cliente (non un menu promozionale — per quello vedi SKILLS-STILE.md). Condivide la palette e i font di base con SKILLS-STILE.md ma con un registro più sobrio, tabellare, adatto a un documento contrattuale/commerciale con firma.
---

# Stile grafico Doppio Malto — "Preventivo Evento"

Documento commerciale formale (offerta/preventivo), non un materiale POP. Stesso mondo cromatico e tipografico di `SKILLS-STILE.md`, ma il registro cambia: niente badge ruotati stile adesivo, niente card con ombra piena "ritagliata". Qui la card è un contenitore pulito a bordo netto — il documento deve poter essere stampato, compilato a mano nei campi vuoti, e firmato.

## Quando usarlo vs SKILLS-STILE.md e SKILLS-UI.md

- **SKILLS-STILE.md** ("sticker & marker"): menu evento, volantini, proposte commerciali da mostrare/condividere — tono allegro, badge ruotati, ombra piena.
- **SKILLS-PREVENTIVO.md** (questo): preventivi/offerte formali con dati cliente, tabella costi, clausole contrattuali, spazio firma — tono sobrio, istituzionale, pensato anche per la stampa.
- **SKILLS-UI.md**: l'interfaccia web dell'app gestionale stessa (sidebar, pagine, componenti) — registro premium nero/bianco ispirato al sito ufficiale, non imparentato con nessuno dei due documenti PDF sopra.

Riconoscere quale serve dalla richiesta: se l'utente dice "preventivo", "offerta", "documento da far firmare al cliente" → questo skill. Se dice "menu", "proposta", "volantino evento" → SKILLS-STILE.md. Se parla dell'app/sidebar/pagine web → SKILLS-UI.md.

## Palette (stessi token di SKILLS-STILE.md)

```css
--mint:       #BFE0D2;  /* hero */
--cream:      #FBF6EC;  /* sfondo pagina */
--paper:      #FFFDF9;  /* sfondo card */
--ink:        #1C1B18;  /* testo, bordi */
--coral:      #E1543F;  /* titoli sezione principali (Dati Cliente, Riepilogo, clausole) */
--green:      #6FA84B;  /* titoli sezione secondari (Dettagli Evento, sottocategorie menu) */
--yellow:     #F0B429;  /* badge di stato, evidenziazione totale */
--muted:      #6B6558;  /* testo secondario, etichette campo */
```

Regola aggiuntiva rispetto allo skill sorella: qui **corallo e verde si alternano come colore-titolo di sezione**, non come accento dominante di un intero blocco — è una gerarchia editoriale (che tipo di sezione è), non decorativa.

## Tipografia

Stessa scelta di `SKILLS-STILE.md`: Archivo Black per il nome azienda/titoli display, Poppins per corpo e tabella, Kalam riservato a badge di stato ("PREVENTIVO EVENTO") e piccole pillole di nota — mai per testo lungo o clausole.

Le clausole contrattuali e i dati tabellari restano in Poppins regular/medium: qui la leggibilità legale conta più del carattere del brand.

## Struttura del documento

1. **Header**: hero mint con corda smussata (stesso pattern di SKILLS-STILE.md). A sinistra logo/nome azienda + tagline; a destra badge di stato ovale (es. "PREVENTIVO EVENTO"), una riga "Copia di cortesia / offerta commerciale", data offerta, numero preventivo.
2. **Card "Dati Cliente" + "Dettagli Evento"** (due colonne affiancate, stessa card o due card gemelle): ogni campo è un'etichetta bold seguita da una linea sottolineata vuota (per compilazione), non un valore già scritto — è un template.
3. **Card "Riepilogo Servizi e Costi"**: tabella a 4 colonne (Descrizione servizio / Min. garantito / Prezzo unit. / Importo totale). Header riga nero pieno, testo bianco/giallo maiuscolo. Righe separate da divisore tratteggiato verde (non grigio). Riga totale finale su sfondo giallo tenue, label in corallo bold, importo come linea da compilare.
4. **Card "Dettaglio Menu Incluso"**: per ogni portata (Starter/Main/Dessert/Bevanda) un titolo colore corallo bold; se la portata ha sottocategorie a scelta (es. Main → Pasta, Pizza, Burger), sottotitolo verde bold più piccolo, poi piatti in griglia 2 colonne con nome in bold seguito da descrizione ingredienti su stessa riga. Badge pillola piccola (bordo verde, sfondo tenue) per note tipo "patatine incluse" o "tutti i dolci in formato mini".
5. **Card "Clausole Contrattuali e Condizioni di Servizio"**: lista numerata, ogni voce con un titolo bold inline seguito dal testo della clausola. Titolo card in corallo.
6. **Card "Coordinate Bancarie per il Pagamento"**: stessa struttura a campi-linea di Dati Cliente (Intestatario/IBAN/Causale vuoti). Riga finale piccola, centrata, corsivo/muted: disclaimer "documento proforma, non valido ai fini fiscali".
7. **Pagina 2 — Card "Conferma e Presa Visione"**: testo di dichiarazione, poi due colonne di firma (Nome e Cognome/Ragione Sociale | Firma) e una riga Data, tutte come linee da compilare. Numero pagina centrato sotto la card.

## Componenti ricorrenti

**Card documento** — bordo nero ~2.5px, `border-radius` 20-24px, **nessuna ombra piena stile adesivo** (a differenza di SKILLS-STILE.md): al massimo un'ombra sobria o nessuna, perché il documento deve restare leggibile se stampato in bianco e nero.

**Campo da compilare** — etichetta bold su una riga, seguita da un `border-bottom` solido nero/ink che occupa lo spazio rimanente della riga (simula la linea di un modulo cartaceo). Mai un placeholder o un valore finto: la riga resta vuota finché non è compilata (a mano o via merge dati).

**Badge di stato ovale** — pillola con bordo, colore di sfondo legato allo stato (es. giallo per "in attesa", verde per "confermato"), testo bold maiuscolo piccolo, **senza rotazione** (a differenza dei tag "scritti a mano" dello skill sorella — qui deve leggersi come uno stato ufficiale, non un adesivo).

**Tabella servizi** — header a sfondo `--ink` pieno con testo `--yellow`/bianco maiuscolo; righe divise da `border-top: 1.5px dashed var(--green)` (non grigio — il tratteggio verde è la firma visiva di questo documento); riga totale evidenziata con sfondo giallo tenue e importo in corallo bold.

**Badge nota piccola** — pillola più piccola dei tag principali, bordo sottile colorato (verde o giallo), usata solo per annotazioni brevi legate a una voce menu (es. "🍟 patatine incluse con ogni burger"), non per etichette di sezione.

**Sezione menu a scelta** — quando una portata ha più opzioni (es. Main: Pasta / Pizza / Burger), ogni sottocategoria è un piccolo titolo verde bold, seguito dai piatti in griglia; ogni piatto è `**Nome piatto** — descrizione ingredienti` sulla stessa riga/paragrafo, non su righe separate.

## Cosa NON portare da SKILLS-STILE.md

- Niente badge prezzo a cerchio ruotato.
- Niente ombra piena "8px 8px 0 var(--ink)" sulle card: qui il documento deve restare sobrio e stampabile.
- Niente rotazione sui tag/pillole: tutto allineato, registro ufficiale.
- Il font Kalam va usato con parsimonia (solo badge di stato e piccole note), mai per titoli di sezione o corpo clausole.

## Dati sensibili — nota per l'implementazione, non per il visual

Questo documento porta IBAN, P.IVA, dati cliente. Quando lo si implementa come generatore reale (non come semplice riferimento di stile), l'IBAN e le coordinate bancarie aziendali vanno risolti **solo lato server** al momento della generazione del PDF — mai passati o editabili dal browser come testo in chiaro prima di quel punto. Vedi il pattern già in uso nell'app: `getCompanyInfo()` in `src/lib/company.ts`, chiamato solo da route API server-side.
