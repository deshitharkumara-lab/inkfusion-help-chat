# Setup guide — putting iNK Fusion Help online (Cloudflare)

This is written for a non-technical owner. Do the steps in order. Use **deshitharkumara@gmail.com** for every account.

Total time: about 30–45 minutes.

---

## Step 1 — Create a Cloudflare account (free)
1. Go to https://dash.cloudflare.com/sign-up and sign up with deshitharkumara@gmail.com.
2. Confirm your email.

## Step 2 — Create the database (D1)
1. In the Cloudflare dashboard, open **Storage & Databases → D1 SQL Database**.
2. Click **Create database**. Name: `inkfusion-help-db`. Click **Create**.
3. On the database page, copy the **Database ID** (a long code like `1a2b3c4d-...`).
4. **Send this Database ID to Claude.** Claude will put it in `wrangler.jsonc` and push it to GitHub. (It is not a secret.)

## Step 3 — Create the file storage (R2)
1. Open **Storage & Databases → R2 Object Storage**.
2. If asked, turn on R2. Cloudflare may ask for a card to activate R2. The free allowance (10 GB) is more than enough for this pilot.
3. Click **Create bucket**. Name: `inkfusion-help-files`. Click **Create bucket**.

## Step 4 — Connect GitHub and deploy
Do this **after** Claude has pushed the Database ID from Step 2.
1. Open **Workers & Pages → Create → Workers → Import a repository** (or "Connect to Git").
2. Connect your GitHub account and choose the repository **deshitharkumara-lab/inkfusion-help-chat**.
3. Settings:
   - **Project / Worker name:** `inkfusion-help` (must match exactly)
   - **Production branch:** `main`
   - **Build command:** leave empty
   - **Deploy command:** `npm run deploy`
4. Click **Save and Deploy**. Wait 2–3 minutes.
5. When it's done you'll see a link like `https://inkfusion-help.<your-name>.workers.dev`. That is your chat page.

> If the build log shows an error about **D1** or **permissions** while applying migrations: go to the Worker → **Settings → Build → API token**, edit the token, and add the permission **Account → D1 → Edit**. Then click **Retry deployment**.

From now on, **every change pushed to `main` on GitHub goes live automatically.**

## Step 5 — Set the admin password (required)
1. Open your Worker → **Settings → Variables and Secrets → Add**.
2. Type: **Secret**. Name: `ADMIN_PASSWORD`. Value: a strong password only you know.
3. Click **Deploy** / **Save**.
4. Open `https://inkfusion-help.<your-name>.workers.dev/admin.html` and log in.

## Step 6 — Turn on the AI (for typed questions and Sinhala/Tamil guides)
Without this, customers can still use all the buttons, but typed questions don't work and guides show in English.
1. Go to https://console.anthropic.com, sign in with deshitharkumara@gmail.com, and add billing.
2. **Important:** set a monthly spend limit in the console (for example USD 60). The app also stops itself at **USD 2 per day**.
3. Open **API Keys → Create key**. Copy the key.
4. In Cloudflare: Worker → **Settings → Variables and Secrets → Add** → Type **Secret**, Name `ANTHROPIC_API_KEY`, paste the key. Save.
5. Never paste this key in a chat, email or GitHub.

## Step 7 — Turn on WhatsApp alerts (can be done later)
Until this is done, technician requests are still saved in the admin page.
1. Go to https://developers.facebook.com → **My Apps → Create app → Business**, and add **WhatsApp**.
2. Register the **sender number 076 187 0890** in WhatsApp Manager. (Once registered there, it can't be used in the normal WhatsApp app.)
3. Create a **message template** (category: Utility), name `technician_request`, language English, body:
   `New technician request: {{1}}`
   Wait for Meta to approve it.
4. Create a **permanent access token** (System User in Business Settings, with `whatsapp_business_messaging` permission).
5. In Cloudflare → Worker → **Settings → Variables and Secrets**, add:
   - Secret `WHATSAPP_TOKEN` = the access token
   - Secret `WHATSAPP_PHONE_NUMBER_ID` = the Phone Number ID shown in WhatsApp Manager (not the phone number itself)
   - Text variable `WHATSAPP_TEMPLATE_NAME` = `technician_request`
6. Send a test technician request from the chat. The admin page shows "WhatsApp: sent" or the error.

## Step 8 (optional, recommended) — Extra lock on the admin page
1. Cloudflare dashboard → **Zero Trust** (free plan) → **Access → Applications → Add an application → Self-hosted**.
2. Domain: `inkfusion-help.<your-name>.workers.dev`, path: `admin.html`. Add a second one for path `api/admin/*`.
3. Policy: **Allow**, Include → **Emails** → `deshitharkumara@gmail.com`.
Now the admin page asks for an email code first, then your password.

---

## Settings you can change without code
Worker → **Settings → Variables and Secrets** (text variables). The defaults are in `wrangler.jsonc`.

| Name | What it does | Default |
|---|---|---|
| `CALL_NUMBER` / `CALL_NUMBER_DISPLAY` | Call button number | +94768680890 / 076 868 0890 |
| `ALERT_WHATSAPP_NUMBER` | Who gets the WhatsApp alert | 94768680890 |
| `BUSINESS_DAYS`, `BUSINESS_OPEN`, `BUSINESS_CLOSE` | When the call button shows (Sri Lanka time; 1=Mon … 6=Sat) | 1–6, 09:00–18:00 |
| `DAILY_AI_CAP_USD` | AI spending cap per day | 2 |
| `CLAUDE_MODEL` | AI model | claude-opus-5-5 |
| `RETENTION_MONTHS` | Delete chats and photos older than this | 24 |

> Note: variables set in the dashboard can be overwritten by `wrangler.jsonc` on the next deploy. For a permanent change, ask Claude to change `wrangler.jsonc`.

## QR stickers
Admin page → **QR codes** → **Print**. Each code opens the chat with the machine already chosen.
