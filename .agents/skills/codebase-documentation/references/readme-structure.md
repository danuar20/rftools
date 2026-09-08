# README skeleton for a FastAPI service (copy + trim)

Use this as a starting shape when documenting a Python/FastAPI project. Remove
sections that don't apply; keep the "verify it boots" discipline from the skill.

```
# <PROJECT NAME> — <one-line purpose>

<2-3 sentence architecture flow: client -> service -> DB / external auth>

## Struktur Direktori
<tree with one-line notes per important file; derive from search_files, not memory>

## Requirements
- Python version, DB, external services (FreeRADIUS, etc.), key libs

## Instalasi
<venv create once, activate, pip install / install script>

## Environment (.env) — opsional tapi disarankan
<list vars: DATABASE_URL, SECRET_KEY, etc. Note safe defaults vs production>

## Menjalankan
### Dev / test lokal
<uvicorn --reload on 127.0.0.1>
### Production (systemd / container)
<unit file, who runs it, EnvironmentFile, enable --now, status>

## Endpoint & Halaman
| Method | Path | Fungsi |
<enumerate from actual routers — GET/POST, real paths, what they do>

## Alur Bisnis (if multi-step)
<numbered flow user -> payment -> redeem -> external auth>

## Model Data
<tables/columns/states from ORM models; note which tables are read-only external>

## Deploy ke <target> (MikroTik / server / etc.)
<exact commands, sudo separated out>

## Konfigurasi <external system>
<client config snippets>

## Gotchas  (HONEST — real weaknesses, not praise)
- weak default SECRET_KEY -> override in prod
- schema/tables auto-created on import -> DB must be reachable at boot
- known ambiguous matching (e.g. payment matched by amount not FK)
- orphan processes that lock ports (kill -9)
- no seed for admin/user -> manual insert
```

Tips:
- Prefix confirmed-working claims with what you actually ran (e.g.
  "verified: /api/health -> 200, connected:true").
- Keep code, paths, and commands literal; use the user's casual language only
  for surrounding prose.
