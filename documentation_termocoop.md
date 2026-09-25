# Documentazione progetto — Piattaforma CRM Termocoop ↔ Relatia

> File di contesto per Cursor. Leggilo per intero prima di generare codice.
> Nella stessa cartella trovi anche la **documentazione ufficiale di Relatia** (`relatia-docs/` o simile): usala come fonte autorevole per gli endpoint API. Questo file spiega **cosa costruire**, **come collegarsi a Relatia** e **con quale identità visiva**.

---

## 1. Scopo del progetto

Costruire una **piattaforma web interna** per il team Termocoop che si collega al CRM **Relatia** e mostra i deal delle pipeline in modo ordinato e leggibile, con particolare attenzione ai deal che cambiano fase (stage).

Sostituisce un'idea precedente (esportazione automatica su Google Sheet, un foglio per pipeline) che è stata abbandonata: il dominio Google Workspace dell'azienda blocca l'accesso anonimo alle Web App di Apps Script, rendendo quella via impraticabile. La piattaforma dedicata dà controllo totale e nessun vincolo esterno.

**Utenti**: team interno Termocoop (uso non pubblico).
**Job principale della piattaforma**: vedere a colpo d'occhio, per ogni pipeline, i deal e i loro dati chiave, e monitorare i passaggi di fase.

---

## 2. Vincolo architetturale fondamentale (leggere per primo)

**Il frontend HTML/JS NON deve mai chiamare l'API di Relatia direttamente.** Due ragioni non negoziabili:

1. **Sicurezza del token** — il token API di Relatia dà accesso completo al CRM. Se sta nel codice client (HTML/JS), è leggibile da chiunque apra gli strumenti sviluppatore. Il token deve vivere **solo lato server**, in una variabile d'ambiente.
2. **CORS** — l'API di Relatia con ogni probabilità non abilita le chiamate cross-origin dal browser: le richieste dirette dal frontend verrebbero bloccate.

**Soluzione**: un **backend** (server) che:
- custodisce il token in `.env`,
- espone endpoint interni che il frontend può chiamare,
- inoltra le richieste a Relatia aggiungendo l'autenticazione,
- riceve i webhook di Relatia.

Il frontend parla **solo** con questo backend, mai con Relatia.

---

## 3. Stack tecnologico consigliato

**Next.js (App Router) + TypeScript.** Motivi:
- Frontend (React) e backend (API routes) nello stesso progetto → un solo repo, un solo deploy, ideale per Cursor.
- Le API routes girano lato server: il token Relatia resta al sicuro.
- Ottimo supporto a fetch server-side, caching e revalidation.

Librerie suggerite:
- **UI**: Tailwind CSS (per applicare facilmente il design system della sezione 8).
- **Fetch/stato**: TanStack Query (React Query) per il fetch lato client verso il nostro backend.
- **Tabelle**: TanStack Table (le viste pipeline sono principalmente tabellari).
- **Icone**: lucide-react.
- **Auth interna** (vedi §10): opzione semplice con un gate a credenziale, oppure NextAuth (Credentials provider).

Se preferisci un backend separato (es. Express) va bene lo stesso, ma tieni i due mondi separati e il token solo lato server.

---

## 4. Variabili d'ambiente (`.env.local`)

```
# --- Relatia ---
RELATIA_API_BASE_URL=   # base URL dell'API Relatia per il tenant termocoop (confermare dalla doc Relatia)
RELATIA_API_TOKEN=      # token API Relatia (MAI esporre al client)
RELATIA_TENANT=termocoop

# --- Webhook in ingresso ---
RELATIA_WEBHOOK_SECRET= # stringa condivisa per validare i webhook in arrivo (vedi §6.3)

# --- Auth piattaforma (se si usa un gate) ---
AUTH_SECRET=
```

Nota: tutte le variabili senza prefisso `NEXT_PUBLIC_` restano lato server. **Non** usare `NEXT_PUBLIC_` per il token Relatia.

---

## 5. Integrazione Relatia — Autenticazione API

- **Header di autenticazione**: `Authorization: Token <RELATIA_API_TOKEN>`
  ⚠️ È `Token`, **non** `Bearer`.
- **Validare il token / prefisso richiesto**: `GET /api/me/` risponde correttamente solo se il token è valido e attivo. Usalo come health-check.
- **Base URL**: da confermare nella documentazione Relatia in cartella. Gli endpoint noti hanno forma `<base>/api/...`.

### Gotchas API Relatia (verificati sul campo)

- **Aggiornare un contatto**: `PATCH /api/contacts/{id}/` con l'header `Token`. **Evitare** l'endpoint custom `/api/contacts/{id}/update/`: richiede un prefisso di token diverso e si comporta in modo incoerente.
- **Scrivere custom field**: usare la chiave `custom_values_create` (NON `custom_values`):
  ```json
  { "custom_values_create": [ { "custom_field": "<uuid>", "value_text": "<valore>" } ] }
  ```
- **Elenco sorgenti contatto**: `GET /api/contact-sources/?page_size=100` **senza** filtro `search`, altrimenti non restituisce tutte le sorgenti.
- **Campo "source"**: in scrittura richiede un **ID numerico**, non una stringa (risolvibile via l'API contact-sources).
- **Regole di routing di Relatia**: vengono valutate alla **creazione** del contatto, **prima** che i custom field (`custom_values_create`) siano collegati. Condizioni di routing basate su custom field falliscono. (Rilevante solo se in futuro la piattaforma scrive su Relatia.)

### Endpoint di LETTURA da confermare dalla doc Relatia

La piattaforma è principalmente in **lettura**. Servono gli endpoint per:
- elenco pipeline (e relativi stage),
- elenco deal per pipeline / per stage,
- dettaglio deal,
- dettaglio contatto collegato al deal.

Questi endpoint **non li conosciamo con certezza**: prendili dalla documentazione Relatia nella cartella. Struttura probabile `<base>/api/deals/`, `<base>/api/pipelines/` — **verificare**. Non inventare endpoint.

---

## 6. Integrazione Relatia — Webhook in ingresso (tracciamento passaggi di fase)

Questo è il pezzo **già testato e funzionante**. Relatia, tramite la sezione automazioni, invia una POST HTTP quando un deal cambia fase.

- **Trigger Relatia**: automazione per-pipeline, tipo evento `deal_stage_changed`.
- **Metodo**: `POST`, `Content-Type: application/json`.
- **User-Agent osservato**: `CRM-Webhook/1.0`.
- **IP sorgente osservato**: `91.98.126.23` (utile per un'eventuale allowlist).
- **Endpoint da esporre nella piattaforma**: es. `POST /api/webhook/relatia`.

### Validazione del webhook

Relatia non firma le richieste. Proteggere l'endpoint con un segreto condiviso, es. un parametro nell'URL configurato lato Relatia (`/api/webhook/relatia?secret=<RELATIA_WEBHOOK_SECRET>`) e/o l'allowlist dell'IP sorgente. Rifiutare le richieste senza segreto valido.

### Struttura completa del payload (reale, valori d'esempio)

```json
{
  "trigger": {
    "id": "9476ca07-0101-4376-9325-ec32bc65d3d9",
    "type": "deal_stage_changed",
    "name": "Foglio Sheet - Albano Comparatore",
    "timestamp": "2026-09-18T09:06:03.985731+00:00"
  },
  "contact": {
    "id": "857e65b0-b084-4805-ae83-2fa9c079d965",
    "email": "esempio@dominio.it",
    "phone": "3400000000",
    "first_name": "Nome",
    "last_name": "Cognome",
    "full_name": "Nome Cognome",
    "company": "",
    "source": {
      "id": "10",
      "name": "Uffico Tecnico - Termocoop",
      "key": "ufficio-tecnico-termocoop"
    },
    "source_details": {},
    "lead_score": 10,
    "assigned_to": null,
    "created_at": "2026-09-10T09:30:45.601572+00:00",
    "updated_at": "2026-09-10T09:30:45.601583+00:00"
  },
  "custom_fields": {
    "Indirizzo": "Via Esempio 1",
    "cap": "Albano Laziale - 00041",
    "tip_ric": "Fotovoltaico residenziale",
    "orario_di_ricontatto": "ora",
    "provenienza_lead": "Comparatore"
  },
  "context": {
    "timestamp": "2026-09-18T09:06:04.001450+00:00",
    "trigger_id": "9476ca07-0101-4376-9325-ec32bc65d3d9"
  },
  "deal": {
    "id": "0df6a0ec-f47c-4d98-b254-0e7d2a1f53a9",
    "name": "Nome Cognome - Albano comparatore (€5,000)",
    "value": 5000,
    "status": "open",
    "pipeline": {
      "id": "a66f724f-bda8-4c28-8df4-729de0cb5f85",
      "name": "Albano comparatore",
      "type": "deal"
    },
    "current_stage": {
      "id": "b3ac0a82-8838-4ba2-840b-82c3dc4147df",
      "name": "Accettato",
      "key": "accettato_comparatorealbano",
      "probability": 0
    },
    "assigned_to": null,
    "created_at": "2026-09-10T09:30:45.787933+00:00",
    "updated_at": "2026-09-18T09:06:03.929264+00:00"
  },
  "stage_change": {
    "from": { "id": "01d91f10-...", "name": "Eseguito Sopralluogo", "key": "eseguito_comparatorealbano" },
    "to":   { "id": "b3ac0a82-...", "name": "Accettato",           "key": "accettato_comparatorealbano" }
  }
}
```

### Mapping campi (payload → dati mostrati in piattaforma)

| Campo piattaforma      | Percorso nel payload                | Esempio                         |
|------------------------|-------------------------------------|---------------------------------|
| Nome e cognome         | `contact.full_name`                 | Nome Cognome                    |
| Telefono               | `contact.phone`                     | 3400000000                      |
| E-mail                 | `contact.email`                     | esempio@dominio.it              |
| Indirizzo              | `custom_fields.Indirizzo`           | Via Esempio 1                   |
| CAP                    | `custom_fields.cap`                 | Albano Laziale - 00041          |
| Tipologia Richiesta    | `custom_fields.tip_ric`             | Fotovoltaico residenziale       |
| **Sorgente** (DA CONFERMARE) | `contact.source.name` **oppure** `custom_fields.provenienza_lead` | "Uffico Tecnico - Termocoop" / "Comparatore" |
| Stage (fase attuale)   | `deal.current_stage.name`           | Accettato                       |
| Fase precedente        | `stage_change.from.name`            | Eseguito Sopralluogo            |
| Valore                 | `deal.value`                        | 5000                            |
| Pipeline               | `deal.pipeline.name`                | Albano comparatore              |
| ID deal / contatto     | `deal.id` / `contact.id`            | (UUID, per link e deduplica)    |

**Nota importante sui custom field**: nel **webhook** le chiavi dei custom field sono etichette leggibili (`Indirizzo`, `cap`, `tip_ric`, `provenienza_lead`, `orario_di_ricontatto`). Attenzione: alcune chiavi hanno la maiuscola (`Indirizzo`) e potrebbero avere spazi. Nell'**API REST** invece i custom field si indirizzano tramite **UUID** (`custom_field: <uuid>`), non tramite etichetta. Sono due rappresentazioni diverse: non confonderle.

---

## 7. Modello dati e pagine della piattaforma

### Flusso dati (due modalità, complementari)

1. **Lettura live (pull)** — il frontend chiede al backend → il backend interroga l'API Relatia → mostra lo stato attuale di pipeline e deal. È il cuore della piattaforma.
2. **Eventi (push)** — il webhook `deal_stage_changed` arriva al backend → viene salvato → alimenta un feed "movimenti recenti" e le notifiche in tempo reale. Riusa il webhook già funzionante.

Per gli eventi serve una **persistenza**. Per MVP va bene una soluzione leggera: SQLite (file, zero config, adatto al self-host) oppure Postgres gestito (Supabase/Neon) se la piattaforma è hostata in cloud. Tabella minima `stage_events` con: `deal_id`, `pipeline_name`, `stage_from`, `stage_to`, `full_name`, `phone`, `email`, `indirizzo`, `cap`, `tipologia`, `sorgente`, `value`, `received_at`, più il payload grezzo (`raw_json`) per sicurezza.

### Pagine

- **Login** (se si sceglie il gate): accesso team interno.
- **Dashboard / Overview**: le pipeline (fino a 25) come elenco/griglia, con per ciascuna il numero di deal e il valore totale. Punto d'ingresso.
- **Dettaglio pipeline**: tabella dei deal di quella pipeline con i campi del mapping (§6). Idealmente filtrabile per stage e ordinabile per valore/data. Ogni riga apre il dettaglio.
- **Dettaglio deal**: tutti i campi + link "Apri in Relatia".
- **Movimenti recenti** (da eventi webhook): feed cronologico "Deal X spostato da *Fase A* a *Fase B*", filtrabile per pipeline.

### Struttura endpoint backend (proxy)

- `GET /api/pipelines` → elenco pipeline (proxy verso Relatia).
- `GET /api/pipelines/[id]/deals` → deal di una pipeline (proxy).
- `GET /api/deals/[id]` → dettaglio deal (proxy).
- `POST /api/webhook/relatia` → ricezione eventi stage change (salva su DB).
- `GET /api/events` → movimenti recenti (dal DB).
- `GET /api/health` → chiama `GET /api/me/` di Relatia per verificare il token.

---

## 8. Design system (basato sul sito reale termocoop.com)

Token estratti dal sito ufficiale (Elementor global styles). Usarli come base.

### Colori

```
--brand-orange:  #DF652D;  /* accento primario del brand: azioni principali, nav attiva, evidenze */
--brand-crimson: #BF2F49;  /* secondario/attenzione: stati critici, deal "persi" */
--brand-green:   #39B54A;  /* successo: deal "vinti"/"accettati", badge positivi */
--ink:           #313131;  /* titoli e testo forte */
--slate:         #54595F;  /* testo secondario */
--muted:         #7A7A7A;  /* testo attenuato, meta */
--border:        #E3E7EA;  /* linee, bordi tabella (derivato da #C2CBD2 schiarito) */
--surface:       #FFFFFF;  /* card, tabelle, pannelli */
--canvas:        #F7F8F9;  /* sfondo pagina */
```

Uso semantico consigliato per una piattaforma CRM: **verde** = stage positivi (Accettato/Vinto), **crimson** = negativi (Perso/Annullato), **arancione** = azioni e stato attivo/neutro. L'arancione del brand va speso su pochi elementi (CTA, voce di menu attiva, KPI in evidenza), non ovunque.

### Tipografia

- **Roboto** — font principale: UI, corpo, tabelle e la maggior parte dei titoli. È il font del sito.
- **Roboto Slab** — opzionale, per i titoli grandi di sezione (richiama i sottotitoli del sito). Da usare con parsimonia.
- Entrambi da Google Fonts. Fallback: `Roboto, Arial, sans-serif` e `"Roboto Slab", Georgia, serif`.

### Principi di design (per non generare una UI "template")

- Layout dashboard classico e funzionale: **sidebar** con l'elenco pipeline + area contenuto con **tabelle dati** leggibili. La densità e la chiarezza dei dati vengono prima della decorazione.
- Evitare il look "AI generico": niente sfondo crema + serif, niente card tutte identiche con la stessa ombra morbida ovunque, niente etichette in MAIUSCOLETTO spaziato sopra ogni titolo, niente frecce "→" appese a ogni link. Sfondo chiaro neutro (`--canvas`), superfici bianche, l'arancione del brand come unico accento forte.
- Bordi sottili (`--border`) e gerarchia tipografica per separare le sezioni, non ombre pesanti.
- Stati di deal comunicati con colore + etichetta testuale (mai solo colore, per accessibilità).
- Motion solo per azioni dell'utente (apertura pannelli, conferme). Niente animazioni d'ingresso su ogni sezione.
- Qualità di base: responsive fino a mobile, focus da tastiera visibile, contrasti accessibili, `prefers-reduced-motion` rispettato.
- Copy in **italiano**, tono conciso e concreto. Nominare le cose come le capisce il team ("Sorgente", "Tipologia richiesta"), non con termini di sistema. Gli stati vuoti sono un invito all'azione, gli errori spiegano cosa fare.

---

## 9. Piano di build per Cursor (a fasi)

**Fase 0 — Setup**
- Progetto Next.js + TypeScript + Tailwind. Applicare i token del §8 (config Tailwind + font Google).
- `.env.local` con le variabili del §4.
- Endpoint `GET /api/health` che chiama `GET /api/me/` di Relatia e conferma il token.

**Fase 1 — Proxy in lettura**
- Implementare `GET /api/pipelines` e `GET /api/pipelines/[id]/deals` come proxy server-side verso Relatia (endpoint reali dalla doc Relatia in cartella).
- Dashboard con l'elenco pipeline e dettaglio pipeline con tabella deal (campi del mapping §6).

**Fase 2 — Webhook eventi**
- `POST /api/webhook/relatia` con validazione del segreto; salvataggio su DB (`stage_events`).
- Pagina "Movimenti recenti" che legge dal DB.
- In Relatia: puntare l'automazione webhook all'URL della piattaforma (vedi §10, decisione n8n).

**Fase 3 — Rifiniture**
- Filtri/ordinamento tabelle, dettaglio deal con link a Relatia, auth interna, stati vuoti/errore, responsive.

---

## 10. Decisioni da confermare (con Noemi)

1. **Campo "Sorgente"**: `contact.source.name` ("Uffico Tecnico - Termocoop") oppure `custom_fields.provenienza_lead` ("Comparatore")? → default provvisorio nel codice: `provenienza_lead`, facilmente cambiabile.
2. **Modello dati**: solo lettura live da Relatia, oppure anche cattura eventi via webhook + DB? → default consigliato: entrambi (live come core, webhook per il feed movimenti).
3. **n8n in mezzo?** Relatia può puntare il webhook **direttamente** alla piattaforma (`/api/webhook/relatia`), oppure restare **Relatia → n8n → piattaforma**. → default consigliato: diretto (un hop in meno). Tenere n8n solo se serve per altri effetti collaterali.
4. **Autenticazione piattaforma**: gate a credenziale condivisa (rapido) o login per utente (NextAuth)? → default: gate semplice per MVP.
5. **Hosting**: self-host sul server aziendale (come n8n su `automations.wolfoncloud.com`) o cloud (Vercel)? → influenza la scelta del DB (SQLite self-host vs Postgres gestito).
6. **Base URL ed endpoint di lettura di Relatia**: da estrarre dalla documentazione Relatia in cartella.

---

## 11. Sicurezza (promemoria)

- Token Relatia **solo lato server**, mai in variabili `NEXT_PUBLIC_` né nel bundle client.
- Webhook protetto da segreto condiviso (+ eventuale allowlist IP `91.98.126.23`).
- Se un token compare in chat/log durante lo sviluppo, **rigenerarlo** e conservarlo solo in `.env` / secret manager.
- Nessun dato personale dei lead in log pubblici o in commit.

---

## 12. Appendice — Cosa è già stato verificato

- ✅ **Relatia → webhook**: l'automazione per-pipeline con evento `deal_stage_changed` invia correttamente la POST (testata in produzione sulla pipeline "Albano comparatore").
- ✅ **Payload completo**: contiene già tutti i dati necessari (contatto + custom field + deal + stage change). Non serve una chiamata GET aggiuntiva al contatto per i campi del mapping §6.
- ❌ **Google Sheets via Apps Script**: scartato. Il dominio Workspace `reddoak.com` blocca l'accesso anonimo alle Web App → la piattaforma dedicata è la soluzione scelta.
