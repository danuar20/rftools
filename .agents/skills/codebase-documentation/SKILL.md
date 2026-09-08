---
name: codebase-documentation
description: Update or write README/docs for a codebase so they match the ACTUAL code, not a stale doc. Use when asked to "update README", "document this project", "sync docs with code", or when docs are clearly out of date. Covers FastAPI/Python services but applies to any runnable project. Embeds the verify-before-claiming technique.
---

# Codebase Documentation (sync docs to real code)

When a user says "update the README" or "the docs are wrong", the existing
README is usually a LIE about the current shape of the project. Never rewrite
docs from the old doc. Re-derive structure from the live source, then verify
the thing actually runs before you claim it works.

## When to load this
- "update README.md", "tolong update readme", "sync docs with code"
- "document this project / module", "the README is outdated"
- Writing a fresh README for a project that already has source

## Workflow (do all of these)
1. **Inventory the real tree first.** Use `search_files` (target=files) for
   `*.py`, `*.html`, `*.sh`, `*.service`, `*.conf`, `*.yaml`, `*.env*` —
   NOT `ls`, and NOT by trusting the README's listed files. The stale README
   often names files that no longer exist and omits whole packages.
2. **Read the actual source**, not the old doc. For a service, read:
   - entrypoint (`main.py` / `app.py`) — what routers/middleware mount
   - config / settings (DB URL, secrets, env overrides)
   - every router/module to enumerate real endpoints & routes
   - models / ORM — real tables, columns, states/enums
   - deployment artifacts (`*.service`, nginx conf, install/run scripts)
3. **Verify it boots before documenting "it works".** Start the app
   (background terminal) and hit a health endpoint / a page. Only write
   "verified running, health = 200" if you saw real output. Kill the process
   after. Example for FastAPI:
   ```
   source venv/bin/activate
   python -m uvicorn app.main:app --host 127.0.0.1 --port 8055 &
   sleep 4
   curl -s http://127.0.0.1:8055/api/health
   kill %1
   ```
4. **Document from code.** Build endpoint tables, model/table lists, and
   run/deploy steps from what you actually read. Match the user's preferred
   language/tone (this user: casual Indonesian for prose, but code/paths stay
   literal).
5. **Be honest about weaknesses — do NOT polish them away.** If the code has
   real flaws (ambiguous FK matching, hardcoded/weak secrets, missing seed
   data, schema created on import so DB must be up first), document them under
   a "Gotchas" section. This is more useful than a doc that implies perfection.
6. **Cover deployment truthfully**: `.env`/env vars, systemd unit (who runs
   it, `EnvironmentFile`), reverse proxy, and any schema/table auto-creation
   that happens on startup.

## Pitfalls
- Trusting the stale README's file list / structure. The project may have
  become a package (`app/`) when the doc says a single `app.py`.
- Claiming "it runs" without starting it. A doc that says verified-but-untested
  is a lie waiting to be caught.
- Hiding code smells to make the README look clean. The user benefits from
  knowing `SECRET_KEY` is weak or payments match by `amount`, not `package_id`.
- Forgetting the deployment glue (systemd, nginx, env file, FTP upload scripts)
  that the README must explain for the thing to actually be usable.
- Writing docs the user can't act on: include exact commands they run as root
  (sudo) separately — the agent terminal often can't sudo.

## References
- `references/readme-structure.md` — reusable README skeleton for a FastAPI
  service (sections: architecture diagram, dir structure, install, env, run
  dev/prod, endpoint table, data model, deploy, gotchas).
