# iNK Fusion Breakdown Help Chat Agent

A mobile-first web chat that walks iNK Fusion customers through safe, step-by-step fixes for DTF printers, Epson printers, large-format sublimation printers and heat presses, and hands them over to iNK Fusion (call button or technician request) when the fix is beyond a basic step.

- **Product requirements:** [docs/PRD.md](docs/PRD.md)
- **Going live on Cloudflare (step by step):** [SETUP.md](SETUP.md)
- **Fix guides (knowledge base):** [guides/](guides/README.md)

## What's in this version (pilot)
- **Customer chat** (`/`): language choice (English, සිංහල, தமிழ், Singlish), machine (or from the QR link, e.g. `/?machine=dtf`), model, warranty, problem buttons, safety note, one step per message with "Did that work?", prevention tip, photo upload.
- **Typed questions** answered by Claude **only from approved guides**, with the safety and business rules from the PRD. Translations of guides are cached so each is paid for once.
- **Escalation:** "Call iNK Fusion" button only Mon–Sat 9 AM–6 PM (Asia/Colombo); technician request form with the "visits are chargeable" confirmation; saved to the database and sent as a WhatsApp alert.
- **Admin page** (`/admin.html`): technician requests (New / Contacted / Done, transcript, photo), fix-guide editor with approve/draft, upload of guide `.yaml` files, upload of PDF manuals / photos / videos and video links, stats, printable QR codes.
- **Cost and safety controls:** USD 2/day AI cap, per-IP rate limits, private storage for customer photos and manuals, automatic deletion after 24 months.
- **Works without AI:** if the AI key is missing, the daily cap is reached or the AI is down, the buttons still work and the customer is offered the call / technician options.

Not yet built: searching inside uploaded PDF manuals (they are stored now; indexing is the next phase), Cloudflare Turnstile bot check.

## Tech
Cloudflare Workers (Hono) · D1 (database) · R2 (files) · Claude API · WhatsApp Business Cloud API. No build step for the web pages (plain HTML/CSS/JS in `public/`).

```
src/            server (API, AI, auth, WhatsApp, clean-up job)
public/         chat page and admin page
guides/         starter fix guides (YAML) — loaded into the database on first deploy
migrations/     database tables and the starter guide seed
scripts/        guides-to-sql.mjs (rebuilds the seed file from guides/)
```

## Run it on your computer (developers)
```bash
npm install
cp .dev.vars.example .dev.vars   # set ADMIN_PASSWORD, optionally ANTHROPIC_API_KEY
npm run dev                      # http://localhost:8787  and  /admin.html
```
`npm run typecheck` checks the server code.

## Knowledge base: where the truth lives
After the first deploy, **the database is the source of truth** for guides; edit and approve them in the admin page. The YAML files in `guides/` are the starter library. Re-uploading a YAML file in the admin page replaces that guide.
