---
name: doppio-malto-menu-style
description: Stile grafico "sticker & marker" per menu evento, volantini e proposte commerciali di Doppio Malto — sfondo giallo pieno, card con bordo nero spesso e ombra piena "ritagliata", badge prezzo a cerchio sovrapposto, tag scritti a mano. Usa questo skill ogni volta che l'utente chiede un MENU/PROPOSTA/VOLANTINO da mostrare o condividere (non un preventivo formale da firmare — per quello vedi SKILLS-PREVENTIVO.md). Condivide la palette e i font di base con SKILLS-PREVENTIVO.md ma con un registro più allegro, da materiale POP.
---

# Stile grafico Doppio Malto — "Menu Evento"

Materiale commerciale/POP (menu evento, proposta, volantino), non un documento contrattuale. Stesso mondo cromatico e tipografico di `SKILLS-PREVENTIVO.md`, ma il registro cambia: qui la card ha un bordo nero spesso con ombra piena "ritagliata" (effetto sticker/fumetto), badge prezzo a cerchio che sporge dall'angolo della card, tag e accenti scritti a mano — pensato per essere mostrato o condiviso, non compilato a mano né firmato.

## Quando usarlo vs SKILLS-PREVENTIVO.md

- **SKILLS-STILE.md** (questo, "sticker & marker"): menu evento, volantini, proposte commerciali da mostrare/condividere — tono allegro, badge a cerchio, ombra piena.
- **SKILLS-PREVENTIVO.md**: preventivi/offerte formali con dati cliente, tabella costi, clausole contrattuali, spazio firma — tono sobrio, istituzionale, pensato anche per la stampa.

Riconoscere quale serve dalla richiesta: se l'utente dice "menu", "proposta", "volantino evento" → questo skill. Se dice "preventivo", "offerta", "documento da far firmare al cliente" → SKILLS-PREVENTIVO.md.

## Palette

```css
--yellow: #F4D000;  /* sfondo pagina (hero + corpo) */
--ink:    #1C1B18;  /* testo, bordi, footer */
--coral:  #E1543F;  /* fascia "Preferito", accenti, parola evidenziata nel titolo */
--green:  #4E9A4A;  /* fascia "Classico" */
--blue:   #58C6DE;  /* fascia "Generoso", tag piatto */
--cream:  #FFFDF9;  /* sfondo card, testo su footer nero */
```

Le tre fasce di prezzo (quando la proposta ne ha più di una) si alternano sempre in questo ordine cromatico: **1ª = verde, 2ª = corallo, 3ª = blu**. Con una sola fascia o due, la card resta centrata e più larga anziché schiacciata in una griglia a 3 colonne.

## Tipografia

- **Archivo Black** — titoli display: logo/nome azienda in pillola nera, titolo principale ("PROPOSTE EVENTI DI GRUPPO"), nome fascia sul badge prezzo, titolo "Servizi aggiuntivi".
- **Caveat** (peso 600/700) — accenti "scritti a mano": eyebrow sotto il logo, nome della fascia sulla card, la nota/domanda della fascia (es. "Bevanda a scelta?"), i tag piccoli sui gruppi di piatti (es. "per 2 persone").
- **Poppins** — corpo testo: nome e descrizione dei piatti, etichette di sezione, note footer. Mai per titoli display o per gli accenti scritti a mano.

I font non sono di sistema: nel PDF (`react-pdf`) vanno registrati esplicitamente via `Font.register` con URL diretti ai file `.ttf` di Google Fonts (non `.woff2` — non supportato). Verificare sempre che l'URL risolva con HTTP 200 prima di usarlo: gli URL di Google Fonts includono un hash di versione che cambia nel tempo, quindi un URL copiato da una vecchia sessione può essere già scaduto — va rigenerato interrogando `https://fonts.googleapis.com/css2?family=...` e prendendo gli URL `.ttf` correnti dalla risposta.

## Struttura del documento

1. **Hero**: nessuna banda colorata — il giallo è lo sfondo dell'intera pagina. Al centro: pillola nera "DOPPIO MALTO" (logo testuale, nessuna immagine), sotto l'eyebrow Caveat ("Birrificio con cucina"), poi il titolo Archivo Black con la parola chiave evidenziata in corallo (es. "PROPOSTE **EVENTI** DI GRUPPO"), infine il sottotitolo in Poppins bold.
2. **Per ogni momento/sezione** (es. Pranzo, Cena, Aperitivo): un tag Caveat con l'orario dentro una pillola a bordo nero, il titolo della sezione in Archivo Black, una riga di descrizione breve.
3. **Fasce di prezzo affiancate** (1, 2 o 3 a seconda di quante ne ha la sezione): ogni fascia è una card color crema, bordo nero 2-3px, `border-radius` ampio, **ombra piena "8px 8px 0 var(--ink)"** (niente sfumature, blur o trasparenza — l'ombra è un blocco di colore netto traslato in basso a destra). In alto a sinistra, sovrapposto al bordo della card, un badge circolare bordo nero con lo stesso trattamento ombra: prezzo in Archivo Black bianco, "EURO" sotto in piccolo.
4. **Dentro ogni card**: nome fascia in Caveat colorato secondo il tier (verde/corallo/blu), eventuale nota in Caveat corallo, poi i gruppi di piatti — ciascuno con etichetta di sezione in Poppins bold maiuscolo (+ "(a scelta)" in grigio se è un gruppo a media), tag opzionale in Caveat su sfondo blu tenue, poi i piatti: nome in Poppins bold, descrizione sotto in Poppins regular grigio scuro.
5. **Card "Servizi aggiuntivi"** (se presenti extra): bordo tratteggiato nero, titolo Archivo Black maiuscolo, righe descrizione/prezzo in Poppins.
6. **Footer**: fascia nera a piena larghezza con angoli arrotondati in alto, pillola logo invertita (crema su nero) e riga di testo piccola grigio chiaro ("Prezzi IVA inclusa · doppiomalto.com").

## Componenti ricorrenti

**Card fascia di prezzo** — bordo nero ~2.5-3px, `border-radius` 18-22px, ombra piena netta (`8px 8px 0 var(--ink)` in CSS, replicata come `boxShadow`-simulato in react-pdf con un secondo `View` traslato o bordo doppio, dato che react-pdf non supporta `box-shadow` nativo). Questo è l'elemento che distingue di più questo stile da `SKILLS-PREVENTIVO.md`, dove le card sono piatte senza ombra.

**Badge prezzo a cerchio** — cerchio bordo nero, colore di sfondo legato al tier (verde/corallo/blu), sovrapposto in alto a sinistra della card così da "bucare" il bordo superiore, numero grande in Archivo Black bianco + "EURO" piccolo sotto. Ruotato leggermente o dritto a seconda del materiale (nel menu evento resta dritto, non ruotato).

**Tag scritto a mano** — piccola pillola Caveat bold, bordo nero sottile, sfondo colorato (blu chiaro per un gruppo piatti, crema per l'orario in hero), usata per note brevi legate a un gruppo di piatti (es. "ogni 2 persone") o all'orario della sezione.

**Nota fascia** — riga in Caveat corallo sotto il nome della fascia, per note come "Bevanda a scelta — acqua inclusa": è una domanda/promessa scritta a mano, non un'etichetta tecnica.

## Cosa NON portare da SKILLS-PREVENTIVO.md

- Niente campi-linea da compilare: qui i valori sono sempre già scritti (è un documento da mostrare, non da firmare).
- Niente tabella a righe con header nero pieno stile "riepilogo costi": i piatti si presentano come lista card-based, non tabellare.
- Niente clausole numerate o coordinate bancarie.
- L'ombra piena e il badge a cerchio **vanno tenuti**, sono la firma visiva di questo documento — è l'opposto della regola in `SKILLS-PREVENTIVO.md`, che le vieta esplicitamente.

## Implementazione attuale

Questo stile governa due file paralleli che devono restare sincronizzati:

- `src/lib/pdf/ProposalMenuPdfDocument.tsx` — il PDF generato via `@react-pdf/renderer`, allegato al preventivo formale (route `src/app/api/proposte/menu/route.ts`).
- `src/lib/proposalHtml.ts` (`buildProposalHtml`) — l'anteprima HTML aperta nel browser dalla pagina del configuratore (`src/app/(app)/proposte/page.tsx`, pulsante "Anteprima proposta").

Entrambi leggono la stessa struttura dati dinamica (`MealSection[]` → `PricePlan[]` → `PlanGroup[]`) definita in `proposalHtml.ts`: il contenuto (quante sezioni, quante fasce, quanti gruppi di piatti) è deciso dal configuratore, non è fisso. Un template di riferimento fornito dallo studio con un numero fisso di sezioni/piatti va quindi tradotto in questo stile mantenendo la struttura dati generica, non copiato 1:1 come markup statico.
