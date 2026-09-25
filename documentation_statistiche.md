# Addendum — Statistiche & performance (Termocoop CRM)

> Da leggere insieme a `documentation.md`. Definisce la sezione analitica della piattaforma: misurare le performance di conversione di ogni pipeline e, dentro ogni pipeline, di ogni sorgente. Tutto calcolabile **da lettura live di Relatia**, senza database (il DB servirà solo per i trend nel tempo — vedi §9).

---

## 1. Scopo

La piattaforma deve rispondere a: *"quanto converte ogni pipeline (store), e quale sorgente rende di più dentro ciascuna?"*

Due livelli di statistiche:
- **Livello 1 — per pipeline**: confronto delle performance tra le pipeline.
- **Livello 2 — per sorgente dentro la pipeline**: spaccatura interna per capire quale fonte converte meglio in quella specifica pipeline.

---

## 2. Struttura dati: Bacino → Pipeline → Sorgente

Lo schema aziendale è a tre livelli. I **bacini** (territori) sono: **Roma, Albano, Pisa, CDL**. Sotto ogni bacino le stesse linee di pipeline, ciascuna con le proprie sorgenti:

| Pipeline (linea) | Sorgenti tipiche |
|---|---|
| Store Eni | RM Casilina, RM Prenestina, RM Albano, PI Pisa, PI Cascina, PG CDL, Sito Termocoop (variano per bacino) |
| Plenitude | Ufficio Tecnico - Termocoop |
| Comparatore | Ufficio Tecnico - Termocoop |
| Berry *(vedi §9 punto 3)* | Automatico |
| Enel | Ufficio Tecnico - SEI |
| Store Enel | RM Primavalle, Sito SEI (variano per bacino) |

**Mapping verso Relatia**: le pipeline reali in Relatia si chiamano `{Bacino} {Linea}` (es. "Albano comparatore", "CDL Enel"). Quindi:
- **Bacino** = primo token del nome pipeline (Albano / CDL / Pisa / Roma).
- **Linea** = resto del nome (Comparatore, Enel, Plenitude, Store Enel, Store Eni, Tecnico).

Cursor deve ricavare bacino e linea **parsando `deal.pipeline.name`** (o il nome pipeline dall'endpoint pipelines), con un fallback se il formato non combacia.

---

## 3. Campo "Sorgente" per le statistiche

**La sorgente è `contact.source`** (stringa), NON `provenienza_lead`.

Motivo: nel deal di test la pipeline era "Albano comparatore" e `contact.source` = "Ufficio Tecnico - Termocoop", che nello schema aziendale è esattamente una **SORGENTE** sotto la pipeline Comparatore. Invece `provenienza_lead` = "Comparatore" duplica il nome della pipeline, quindi non è la dimensione giusta.

**Vantaggio tecnico**: `contact.source` è già presente nel contatto annidato della **lista deal** (`GET /api/deals/?pipeline=`), insieme a `current_stage_name` e `value`. Quindi **tutte le statistiche (livello 1 e 2) si calcolano da un'unica passata paginata sulla lista deal della pipeline** — niente chiamate per-deal (no N+1), niente `complete-info`, niente database.

---

## 4. Definizione di "convertito"

Un deal è **convertito** se il suo stage attuale è **"Accettato"** oppure **"Accettato convertito"** (entrambi indicano che il cliente ha accettato la proposta commerciale).

Implementazione robusta: considerare convertito ogni deal il cui `current_stage_name`, normalizzato (trim + minuscolo), **inizia con "accettato"**. In alternativa, tenere un elenco configurabile in una costante:
```ts
const CONVERTED_STAGE_NAMES = ["Accettato", "Accettato convertito"];
```
Cursor deve **verificare i nomi reali degli stage** via `GET /api/pipelines/{id}/` (stages annidati) e allineare la costante, perché ogni pipeline può nominare gli stage in modo leggermente diverso.

**Mix prodotto** (metrica secondaria): tra i convertiti, la distinzione tra "Accettato" e "Accettato convertito" indica *quale prodotto è stato venduto* (partner es. Plenitude vs prodotto interno). Va mostrata come split dei convertiti per stato di accettazione. L'etichetta di quale corrisponde a "interno" vs "partner" la definisce l'utente (DA CONFERMARE).

---

## 5. Metriche da calcolare

**Per pipeline (livello 1):**
- Totale deal e valore totale della pipeline
- Distribuzione dei deal per stage (conteggio per ogni fase del funnel)
- N° convertiti e loro valore totale
- **Tasso di conversione** = convertiti / totale deal della pipeline *(denominatore: vedi §9 punto 2)*
- Valore medio per deal convertito
- Mix prodotto (Accettato vs Accettato convertito) tra i convertiti

**Confronto tra pipeline:**
- Classifica per tasso di conversione e per valore convertito
- Aggregati per **bacino** e per **linea**

**Per sorgente dentro la pipeline (livello 2):**
- Per ogni valore di `contact.source`: n° deal, n° convertiti, valore convertito, tasso di conversione
- Ordinamento per performance (quale sorgente converte di più in quella pipeline)

---

## 6. Endpoint backend da costruire (proxy + calcolo lato server)

Il calcolo va fatto **lato server** (API routes), leggendo Relatia col token e restituendo al frontend solo gli aggregati (mai i dati grezzi dei contatti più del necessario).

- `GET /api/stats/pipelines` → per ogni pipeline: KPI di testata (totale, convertiti, valore convertito, tasso). Alimenta la pagina di overview e le classifiche/aggregati per bacino e linea.
- `GET /api/stats/pipelines/[id]` → statistiche complete di una pipeline: distribuzione per stage, KPI, mix prodotto, e **breakdown per sorgente**.

Entrambi calcolano scorrendo **tutte le pagine** di `GET /api/deals/?pipeline=[id]` (paginazione DRF già gestita in Fase 1) e aggregando in memoria su `current_stage_name`, `value`, `contact.source`.

---

## 7. UI

- **Pagina "Statistiche"** (nuova voce in sidebar): overview con i KPI complessivi, classifica delle pipeline per tasso di conversione e per valore, con toggle per aggregare **per bacino** e **per linea**.
- **Statistiche di pipeline**: pannello dedicato (nuova tab `/pipelines/[id]/stats` o sezione nella pagina pipeline) con il funnel per stage, i KPI, il mix prodotto e la **tabella per sorgente**.
- **Grafici**: barre per la distribuzione per stage e per il confronto tra sorgenti; numeri grandi per i KPI. Rispettare il design system §8 di `documentation.md` (arancione brand per gli accenti, verde = convertito, tabelle pulite, niente look "template AI"). Colore + etichetta testuale sempre insieme (accessibilità).

---

## 8. Performance & caching (importante)

Calcolare le statistiche significa scaricare tutti i deal di una o più pipeline: molto più pesante della semplice Fase 1. Regole:
- **Cache lato server** dei risultati aggregati (es. `unstable_cache` / route segment con `revalidate` di 5–10 minuti), così non si ricalcola a ogni apertura di pagina.
- Overview su 24 pipeline: calcolare con cache e, se serve, in parallelo con un limite di concorrenza; mostrare uno stato di caricamento progressivo.
- Non esporre al client i dati grezzi dei contatti: il frontend riceve solo gli aggregati.

---

## 9. Decisioni adottate (DA CONFERMARE con l'utente)

1. **Sorgente = `contact.source`** (default adottato; evidenza forte ma basata su un solo deal di test).
2. **Denominatore del tasso di conversione = tutti i deal della pipeline** (default). Alternativa possibile: escludere uno stage iniziale.
3. **"Berry"**: presente nello schema come pipeline, ma in Relatia le pipeline reali hanno **"Tecnico"** (nessuna "Berry" nella dashboard). Da chiarire se Berry corrisponde a Tecnico o è altro. Per ora Cursor mappa sulle pipeline reali di Relatia (via `GET /api/pipelines/`), non sui nomi dello schema.
4. **Etichette mix prodotto** (quale tra Accettato / Accettato convertito è "interno" vs "partner"): da definire.

---

## 10. Fase successiva (trend nel tempo)

Le metriche sopra sono uno **snapshot** dello stato attuale. Per l'andamento nel tempo (conversioni per mese, trend, velocità tra le fasi) servirà la **Fase 2**: webhook `deal_stage_changed` → salvataggio eventi su database (su Vercel: Postgres gestito, non SQLite). Le variabili `RELATIA_WEBHOOK_SECRET` e `AUTH_SECRET` sono già configurate su Vercel. Non è un prerequisito per le statistiche snapshot di questo addendum.
