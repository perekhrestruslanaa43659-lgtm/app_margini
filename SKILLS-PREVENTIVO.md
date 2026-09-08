---
name: doppio-malto-preventivo-style
description: Stile grafico "documento istituzionale" per preventivi evento formali di Doppio Malto — sezioni con barra verticale ambra, tabella servizi a intestazione nera, riga totale su sfondo pesca, clausole contrattuali, coordinate bancarie. Usa questo skill ogni volta che l'utente chiede un PREVENTIVO/OFFERTA formale da inviare al cliente (non un menu promozionale — per quello vedi SKILLS-STILE.md). Registro sobrio/business, distinto dalla palette POP di SKILLS-STILE.md.
---

# Stile grafico Doppio Malto — "Preventivo Evento"

Documento commerciale formale (offerta/preventivo), non un materiale POP. A differenza di `SKILLS-STILE.md` (registro "sticker & marker": giallo pieno, badge ruotati, ombra piena stile adesivo), questo documento usa un registro **sobrio e istituzionale**: niente sfondo colorato pieno, niente bordi spessi arrotondati, niente ombra offset. Deve poter essere stampato in bianco e nero, compilato a mano nei campi vuoti, e firmato.

## Quando usarlo vs SKILLS-STILE.md e SKILLS-UI.md

- **SKILLS-STILE.md** ("sticker & marker"): menu evento, volantini, proposte commerciali da mostrare/condividere — tono allegro, sfondo giallo pieno, badge prezzo a cerchio, ombra offset stile adesivo.
- **SKILLS-PREVENTIVO.md** (questo): preventivi/offerte formali con dati cliente, tabella costi, clausole contrattuali, spazio firma — tono sobrio, business, pensato anche per la stampa.
- **SKILLS-UI.md**: l'interfaccia web dell'app gestionale stessa (sidebar, pagine, componenti) — registro premium nero/bianco ispirato al sito ufficiale, non imparentato con nessuno dei due documenti PDF sopra.

Riconoscere quale serve dalla richiesta: se l'utente dice "preventivo", "offerta", "documento da far firmare al cliente" → questo skill. Se dice "menu", "proposta", "volantino evento" → SKILLS-STILE.md. Se parla dell'app/sidebar/pagine web → SKILLS-UI.md.

## Palette

```css
--ink:          #1A1A1A;  /* testo, bordi, intestazione tabella, barra sezione */
--accent:       #C67C2E;  /* barra verticale titoli sezione, bordo riga totale */
--accent-dark:  #A85C1A;  /* label e importo della riga totale */
--peach:        #FBEEE0;  /* sfondo riga totale */
--gray:         #666666;  /* testo secondario, etichette, note corsive */
--line:         #D9D9D9;  /* divisori riga tabella */
```

Un solo colore d'accento (ambra), niente alternanza corallo/verde: qui la gerarchia visiva viene dalla tipografia (maiuscolo, bold, dimensione) e dalla barra verticale, non dal colore del titolo.

## Tipografia

Poppins per tutto il documento (corpo, tabella, clausole, titoli). Nessun font "a mano" (Caveat/Kalam) — è un documento business, non promozionale. I titoli di sezione sono Poppins bold maiuscolo con letter-spacing leggero.

## Struttura del documento

1. **Header**: a sinistra il logo aziendale (immagine, via `logoSrc`); a destra allineato "PREVENTIVO EVENTO" (titolo bold), una riga "Copia di cortesia" sotto, poi data offerta e numero preventivo. Riga separatrice nera sottile sotto l'intero header.
2. **Sezione "Dati Cliente" + "Dettagli Evento"** (due colonne affiancate): ogni campo è un'etichetta bold seguita da una linea sottolineata (border-bottom nero) — vuota se il dato non è compilato, altrimenti il valore stesso sulla riga.
3. **Sezione "Riepilogo Servizi e Costi"**: tabella a 4 colonne (Descrizione servizio / Min. garantito / Prezzo unit. / Importo totale). Intestazione a sfondo nero pieno con testo bianco maiuscolo. Righe separate da bordo sottile grigio chiaro (`--line`), non tratteggiato. Riga totale finale su sfondo pesca (`--peach`) con bordo sinistro spesso ambra (`border-left: 4px`), label e importo in ambra scuro bold.
4. **Sezione "Clausole Contrattuali e Condizioni di Servizio"**: lista numerata automaticamente (1., 2., ...), ogni voce con un titolo bold inline seguito dal testo della clausola in nero normale.
5. **Sezione "Coordinate Bancarie per il Pagamento"**: stessa struttura a campi-linea di Dati Cliente (Intestatario/IBAN/Causale). Riga finale piccola, corsivo grigio: disclaimer "documento proforma, non valido ai fini fiscali".
6. **Pagina 2 — Sezione "Conferma e Presa Visione"**: testo di dichiarazione, poi due colonne di firma (Nome e Cognome/Ragione Sociale | Firma) e una riga Data, tutte come linee da compilare. Numero pagina centrato in fondo.

## Componenti ricorrenti

**Titolo di sezione** — barra verticale ambra (`width: 3-4px`, altezza ~12-15px) seguita dal testo bold maiuscolo con letter-spacing. Niente card bordata attorno alla sezione: le sezioni sono separate solo da spaziatura verticale, non da un contenitore visibile.

**Campo da compilare** — etichetta bold seguita da un valore sulla stessa riga (se presente) o da un `border-bottom` nero che occupa lo spazio rimanente (se vuoto, da compilare a mano).

**Tabella servizi** — intestazione a sfondo `--ink` pieno con testo bianco maiuscolo piccolo; righe divise da un bordo sottile grigio (`--line`), non tratteggiato e non colorato; riga totale con sfondo `--peach` e bordo sinistro spesso ambra, label/importo in `--accent-dark` bold.

## Cosa NON portare da SKILLS-STILE.md

- Niente sfondo giallo pieno né card bordate spesse.
- Niente ombra offset "8px 8px 0" sulle sezioni: qui il documento deve restare sobrio e stampabile.
- Niente badge prezzo a cerchio, niente rotazione su tag/pillole.
- Niente font "a mano" (Caveat) per titoli o corpo — solo Poppins.
- Niente alternanza corallo/verde per i titoli di sezione: un solo accento (ambra).

## Dati sensibili — nota per l'implementazione, non per il visual

Questo documento porta IBAN, P.IVA, dati cliente. L'IBAN e le coordinate bancarie aziendali vanno risolti **solo lato server** al momento della generazione del PDF — mai passati o editabili dal browser come testo in chiaro prima di quel punto. Vedi il pattern già in uso nell'app: `getCompanyInfo()` in `src/lib/company.ts`, chiamato solo da route API server-side.

## Implementazione

Componente: `src/lib/pdf/ProposalQuotePdfDocument.tsx` (react-pdf). Non esiste equivalente HTML/Jinja2 separato nel progetto — quella variante (script Python/Playwright) è solo un riferimento di stile esterno usato per allineare la palette di questo componente, non è integrata nella build Next.js.
