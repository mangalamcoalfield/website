# Regulations hub — how to keep it fresh

The regulations library and the DGMS Circular Finder are **data-driven** (Supabase +
static rebuild). New DGMS circulars, notifications and gazette amendments come out
every few weeks. This is the runbook to fold them in. Budget ~20–30 min.

A **biweekly Windows reminder** ("Mangalam — refresh regulations") is scheduled to
pop this up. It does **not** run anything automatically — updates need your command
because they involve fetching from DGMS + re-seeding + a deploy. To change/stop it:
`schtasks /Change /TN "Mangalam-RegsUpdate" /DISABLE` (or `/Delete`).

---

## A. Refresh the source archive  (folder: `C:\Users\Mangalam\Mining Regulation`)

```powershell
cd "C:\Users\Mangalam\Mining Regulation"
# 1. Pull anything new from the DGMS site into the archive
powershell -ExecutionPolicy Bypass -File tools\download_archive.ps1
# 2. OCR + catalogue only the newly-added PDFs
python tools\catalog_new.py
python tools\ocr_all.py           # OCRs any image-only PDFs so they're searchable
# 3. Rebuild the buried-circular index (feeds the Circular Finder)
python tools\build_circular_index.py
python tools\gen_index.py          # refreshes INDEX.md + MANIFEST.csv
```

Check `UPDATE_LOG.md` / `git status` in that folder to see what changed.

## B. Fold the new docs into the website catalogue  (assisted)

The **Circular Finder** index is fully scripted — regenerate it directly:

```powershell
cd "C:\Users\Mangalam\Mangalam_Website"
python tools\build_circular_index_json.py   # CIRCULAR_INDEX.csv -> src/data/circular-index.json
```

The **document catalogue** (`regulations-full-seed.json`) needs a clean title, a
plain-language summary, a category, and an accurate `status`/`status_note` per new
doc — that's judgement, not a pure script. Easiest: open this repo in Claude Code and
say *"fold the new docs listed in `Mining Regulation\UPDATE_LOG.md` into
`regulations-full-seed.json`, then regenerate `supabase/regulations_full_seed.sql`."*
Always re-read `Mining Regulation\INDEX.md` → **"Supersessions & Draft-watch"** so a
newly-superseded instrument gets `status: superseded` + a `status_note`.

## C. Apply to Supabase + upload new PDFs

```powershell
npx supabase db query --linked -f supabase\regulations_full_seed.sql
node tools\upload_regs.mjs           # uploads any new PDFs to Hostinger + patches download_url
```

## D. Deploy

```powershell
git add -A && git commit -m "Regs refresh: <n> new docs (<date>)" && git push origin main
```
Vercel auto-deploys `main`. Verify at https://mangalamcoal.com/regulations.

---

## Monthly (2 min): National Coal Index — coking sub-index

The Learn page tracker shows the **coking-coal sub-index** of the NCI. Each month the
Ministry of Coal releases a new value at
<https://coal.gov.in/nominated-authority/national-coal-index> (an Office Memorandum
PDF). Read the "Coking" row of the "NCI for different Sectors/Sub-Sectors" table and
insert it:

```powershell
npx supabase db query --linked "insert into nci_history (month,value,sub_index,source_url,published) values ('YYYY-MM', <coking value>, 'Coking coal · NCI sub-index','https://coal.gov.in/nominated-authority/national-coal-index', true);"
```
(Latest seeded: May 2026 = 156.43, Apr 2026 = 157.11.)

---

## Troubleshooting — Hostinger FTPS uploads

All site media (regulation PDFs, press clippings, the drone video) lives on
`docs.mangalamcoal.com` and is uploaded over **explicit FTPS** (port 21, AUTH TLS).
Creds: `.hostinger.env` (gitignored). HTTP *serving* of docs and FTPS *uploading* are
independent — serving can be perfectly fine while uploads fail.

### Symptom: every upload fails with `504`

```
> AUTH SSL
< 504 Command not implemented for that parameter
> AUTH TLS
< 504 Command not implemented for that parameter
```

`504` here is an **FTP reply code** ("command not implemented for that parameter"),
*not* an HTTP gateway timeout. curl surfaces it via `%{http_code}`, which makes it
look like a network problem. It means the server refused to start TLS.

### Diagnose first (no credentials sent)

Ask the server what it supports — `FEAT` needs no login:

```powershell
python - <<'PY'
import socket
s=socket.create_connection(("ftp.docs.mangalamcoal.com",21),timeout=12); s.settimeout(8)
print(s.recv(512).decode()); s.sendall(b"FEAT\r\n")
import time; time.sleep(1); print(s.recv(2048).decode()); s.sendall(b"QUIT\r\n")
PY
```

* **`AUTH TLS` IS listed** → the server *does* support FTPS, so the `504` is a
  **transient Hostinger-side fault**. Nothing to fix on our end: wait and retry.
  (Seen 2026-07-13: failed solidly for hours — 40 retry rounds — then recovered on
  its own by 2026-07-16 with no config change.)
* **`AUTH TLS` NOT listed** → TLS really is off on the account. Raise it with
  Hostinger support; do not work around it.

### Rules

* **Never fall back to plaintext FTP.** It sends the password in the clear. If FTPS
  is down, either wait, or host the file elsewhere temporarily.
* If a deadline forces a workaround, put the asset in `public/media/...` (served by
  Vercel, same-origin) and **switch it back to docs once FTPS recovers** so media
  stays in one place and the repo stays light.
* Verify after uploading — check both HTTP status *and* that the byte size matches
  the local file:

```bash
curl -s -o /dev/null -w "%{http_code} %{size_download}\n" "https://docs.mangalamcoal.com/media/press/<file>.jpg"
```
