# Hub → Brevo Email Templates — State of Play (2026-05-01)

**Audience:** John, pre-walkthrough review before firing the remaining 19.
**Scope:** B2C orchestration emails #1–#4 only. (Dossier, magic-link, and
operational emails are separate flows and not covered here.)

---

## ⚠️ Honest read first — read this before the rest

The Hub does **not** store the rendered subject lines or HTML bodies for
emails #1–#4. Those live **in the Brevo dashboard** under template IDs 1, 2,
3, 4. The Hub's `brevo_templates` table only stores:

- the template **key** (`b2c_email_1` … `b2c_email_4`)
- the Brevo **template ID** (the integer Brevo uses to look up the actual
  subject/HTML)
- the **sender name + email** and **reply-to**
- the merge **params** the Hub passes in (rendered into Brevo merge tags
  like `{{ params.first_name }}`)

What appears in `EmailPreviewDialog.tsx` (the 200-character preview the
operator sees before clicking "Confirm and Send") is a **stub written into
the Hub UI for operator confidence** — it is NOT pulled from Brevo, and may
drift from what's actually rendered on send. To audit the final copy, log
into Brevo → Templates → IDs 1–4. I'd recommend doing that before May 8.

---

## Registry (live values from `brevo_templates`, 2026-05-01)

| Template Key  | Brevo Template ID | Sender                                         | Reply-to     |
| ------------- | ----------------- | ---------------------------------------------- | ------------ |
| `b2c_email_1` | 1                 | John Fingleton, Be Hospitality Solutions       | john@be.ie   |
| `b2c_email_2` | 2                 | John Fingleton, Be Hospitality Solutions       | john@be.ie   |
| `b2c_email_3` | 3                 | John at Be Connect                             | john@be.ie   |
| `b2c_email_4` | 4                 | John at Be Connect                             | john@be.ie   |

All sent from `john@be.ie` via Brevo SMTP (`smtp-relay.mailin.fr`).

---

## Email #1 — Archetype Reveal (`b2c_email_1`)

**Operator-facing preview (from `EmailPreviewDialog.tsx`, NOT Brevo):**
- Subject stub: `{first_name}, your DNA is in`
- Body stub (first 200 chars):
  > Hi {first_name},
  >
  > Your Hospitality DNA result is ready: {archetype}. Here's what that means
  > for your next move…

**Merge params the Hub passes to Brevo:**
- `first_name` — derived from `candidates.full_name` (first whitespace-split
  token) or local-part of email if name missing
- `archetype` — from `prescreening_data.archetype_type` →
  `prescreening_data.tribe_viral_archetype` → fallback string
  `"Hospitality DNA Profile"`

**Auto-fire trigger (production path):**
- Inbound webhook `dna-reveal-email-captured` from the DNA app, fired when
  a candidate reveals their email at the DNA paywall.
- Gate: `candidates.communication_status === 'auto_b2c_active'`. Anything
  else (`manual_review`, `paused`, `complete`) → logged as
  `email_skipped_status`, no send.
- No recency gate. First touch in the funnel.

**Manual-fire path:** Career Agent Controls → "Send Email #1". Bypasses
the auto_b2c_active gate; operator-confirmed dialog. Logged as
`email_sent_manual` with `operator_user_id`.

---

## Email #2 — Welcome to Concierge (`b2c_email_2`)

**Operator-facing preview (stub, NOT Brevo):**
- Subject stub: `{first_name}, welcome to your Concierge`
- Body stub (first 200 chars):
  > Hi {first_name},
  >
  > Great to see you've stepped into the Concierge. This is where your
  > placement journey takes shape…

**Merge params:**
- `first_name` — same derivation as Email #1

**Auto-fire trigger:**
- Inbound webhook `concierge-arrival` from `connect.be.ie`, fired when the
  candidate arrives in the concierge portal post-DNA.
- Gate: `communication_status === 'auto_b2c_active'`.
- **Recency gate (Board directive, 29 Apr 2026):** Suppress Email #2 if
  Email #1 fired less than **20 minutes** ago. Rationale: a candidate who
  reveals email at DNA paywall and immediately clicks through to /concierge
  is already in the app — a second welcome 60 seconds later is noise.
  Email #2 becomes a re-engagement trigger for candidates who arrive at
  /concierge after wandering off.
  - Logged as `email_skipped_recency` with `minutes_since_step_1` payload.
  - If no Step 1 row exists (e.g., magic-link arrival), recency gate is
    bypassed and Email #2 fires.

**Manual-fire path:** Same Career Agent Controls pattern as Email #1.

---

## Email #3 — Profile Taking Shape (`b2c_email_3`)

**Operator-facing preview (stub, NOT Brevo):**
- Subject stub: `{first_name}, your profile is taking shape`
- Body stub (first 200 chars):
  > Hi {first_name},
  >
  > You're well on your way. Here's what you've completed and what's left to
  > land your placement…

**Merge params:**
- `first_name`
- `completed_steps` — bullet-list string built from the inbound payload's
  `completed_steps[]` array (e.g. `• Resume uploaded\n• Video intro\n…`)
- `outstanding_steps` — bullet-list string built from `outstanding_steps[]`

**Auto-fire trigger:**
- Inbound webhook `profile-taking-shape` from `connect.be.ie`, fired when
  the candidate's portal profile reaches a milestone of completeness
  (definition of "milestone" lives in the portal, not the Hub).
- Gate: `communication_status === 'auto_b2c_active'`.
- No recency gate.

**Manual-fire path:** Career Agent Controls. Note: when fired manually from
the Hub, `completed_steps` / `outstanding_steps` will be empty — the manual
path doesn't construct those lists, so the email may render with empty
bullets. **This is a known limitation if Email #3 is manually fired for the
historical 19.** Worth deciding whether to fix or skip Email #3 in manual
walkthroughs.

---

## Email #4 — Profile Ready (`b2c_email_4`)

**Operator-facing preview (stub, NOT Brevo):**
- Subject stub: `{first_name}, your profile is ready`
- Body stub (first 200 chars):
  > Hi {first_name},
  >
  > Your profile is complete. We're now matching you to the right hospitality
  > teams…

**Merge params:**
- `first_name`

**Auto-fire trigger:**
- **None currently.** No inbound webhook exists for "profile complete".
- Email #4 is **manual-fire only** today, via Career Agent Controls →
  "Send Email #4". The manual call passes `force: true` to bypass any
  recency or duplicate-send guards.

**Future:** When the portal defines "complete", we'll wire a
`profile-ready` webhook mirroring the Email #1–#3 pattern. Until then,
Email #4 is operator judgment.

---

## Gate values reference

`candidates.communication_status` is constrained by CHECK to one of:
- `auto_b2c_active` — auto-fires emails 1, 2, 3 on inbound webhook (gate open)
- `manual_review` — auto-fires suppressed (gate closed); manual fires still work
- `paused` — auto-fires suppressed (gate closed); manual fires still work
- `complete` — auto-fires suppressed (gate closed); manual fires still work

Note: there is no literal `auto_send` value in the schema. The
user-facing concept "auto_send" maps to `auto_b2c_active` in the database.

---

## Verification audit-log events

Every send (manual or auto) writes one or two rows to `audit_log`:
- `email_sent` — written by the Brevo helper on a 2xx from Brevo, includes
  `brevo_message_id` and `template_key`
- `email_sent_manual` — written by `fire-email-N` endpoints on operator
  fires, includes `operator_user_id` and `ok` / `error` fields
- `email_skipped_status` — auto-path skipped because gate was closed
- `email_skipped_recency` — Email #2 suppressed by 20-minute gate
- `email_failed` — Brevo returned non-2xx or threw; sanitised reason logged

To audit any candidate's email history:
```sql
SELECT created_at, event_type, payload->>'email_number' AS n,
       payload->>'brevo_message_id' AS msg_id,
       payload->>'reason' AS reason
FROM audit_log
WHERE payload->>'candidate_id' = '<candidate_uuid>'
  AND event_type LIKE 'email_%'
ORDER BY created_at DESC;
```

---

## Sophie smoke test record (this session)

- Candidate: Sophie Ruddy (`ad13b39f-6e5b-45d0-a7e8-ec73a6551bd2`)
- Endpoint: `fire-email-1` (manual)
- Brevo message ID: `<202605011149.24552751486@smtp-relay.mailin.fr>`
- Brevo accepted: 200 OK
- Audit-log: `email_sent` + `email_sent_manual` both written at
  2026-05-01 11:49:43 UTC
- Step log written: `65e34d78-ad10-43ca-999b-cf0222928e0d`

Brevo accepting (200) confirms handoff. Final delivery to
`sophieruddy10@gmail.com` is in Brevo's hands — to confirm inbox arrival
vs. bounce/spam, check Brevo dashboard → Statistics → Email events,
filter by recipient `sophieruddy10@gmail.com` or message ID above.
