# CURO MVP Features — Implementation Notes

This drop implements the three core MVP features from `CURO_PRD_v1.0.md`, plus a UI/UX refresh (dark mode, skeleton loading, accessible focus states).

## 1. Medical Record Uploads (US-P0x)

**Patient side** — *Records → Reports* tab: drag & drop or tap-to-browse uploader.

- Formats: PDF, JPG, PNG, HEIC, DOC, DOCX · max 10 MB · up to 5 files per batch
- Validation happens **twice**: client-side (instant feedback) and server-side (never trust the client)
- Server-side hardening:
  - Extension + MIME allow-list, plus **magic-byte sniffing** (a renamed `.exe` is rejected even with a spoofed MIME type)
  - Files stored outside the web root under random UUID names (`UPLOAD_DIR`, default `backend/uploads/`) — original names live only in the DB
  - Downloads are Bearer-authenticated and streamed with `Content-Disposition`; no static file serving
  - Strict ownership checks: patients see only their own files; doctors see files of patients they have appointments with
  - Soft delete (`is_deleted`) preserves the audit trail

**Doctor side** — the Consultation Workspace shows the patient's uploaded records with authenticated inline preview.

Endpoints: `POST /documents`, `GET /documents/mine`, `GET /documents/patient/:id`, `GET /documents/:id/download`, `DELETE /documents/:id`

## 2. AI Pre-Consult Summary (US-D03)

A ≤200-word briefing at the top of the Consultation Workspace, readable in ~20 seconds.

- **Two-tier engine**:
  1. **LLM tier** — any OpenAI-compatible API (`AI_API_KEY`, `AI_BASE_URL`, `AI_MODEL` in `.env`). Prompt includes intake form, allergies, past visits, past prescriptions, and uploaded record names.
  2. **Rule-based fallback** — if no key is configured, the model times out (`AI_TIMEOUT_MS`), or errors, a deterministic summary is built from structured records. The dashboard **never blocks** on AI (PRD AC6/AC5).
- Summaries are cached on the appointment row; `↻ Refresh` regenerates from latest data.
- Doctors can **edit** the summary — the edit is stored separately (`ai_summary_edited`), the AI original is preserved (AC4).
- Source footer ("Intake form, 2 uploaded documents…") for traceability (AC3).
- Allergy lines are highlighted; an allergy banner also appears in the workspace.

Endpoints: `GET /consultations/:id/summary[?refresh=1]`, `PUT /consultations/:id/summary`

## 3. Medicine Autocomplete (US-D04 AC2, BR-13)

Typing "Para" in the prescription builder suggests **Paracetamol** (and Dolo 650, etc.) with:

- An inline dosage-form illustration (tablet / capsule / syrup / injection / cream / drops / inhaler) — pure SVG, zero external image dependencies, offline-safe
- Generic name, dosage form, common strengths (first strength auto-fills the dose field)
- **Schedule H / H1 / X badges** with a warning banner for controlled substances
- Ranked matching (prefix > word-start > substring, brand and generic) with 150 ms debounce, full keyboard navigation, and free-text always allowed — the formulary assists, never blocks
- ~90-entry curated formulary (WHO-essential + common Indian brands) held in memory; swap for an RxNorm/Indian-drug-DB table post-MVP without touching the API contract

Endpoint: `GET /medicines/search?q=` (doctor-only)

## UI/UX refresh

- **Dark mode** (mandated by `Design.md`) — softened contrast, teal accent preserved; toggle in the sidebar, respects `prefers-color-scheme`, persisted in `localStorage`
- Skeleton shimmer loading states (`prefers-reduced-motion` respected)
- Button spinner loading states, visible focus rings, ARIA roles on the combobox/dropzone/alerts

## Configuration

```bash
# backend/.env
UPLOAD_DIR=uploads            # document storage directory
AI_API_KEY=                   # optional — leave empty for rule-based summaries
AI_BASE_URL=https://api.openai.com/v1
AI_MODEL=gpt-4o-mini
AI_TIMEOUT_MS=15000
```

Run `npm run db:migrate` to apply migration `005_preconsult_ai_and_documents.sql` (documents table + `ai_summary*` columns on appointments).
