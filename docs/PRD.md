# PRD — iNK Fusion Breakdown Help Chat Agent (DRAFT v0.2)

**Owner:** Deshitha Rathnakumara, Director, iNK Fusion Printing Technology (Pvt) Ltd, Maharagama, Sri Lanka
**Status:** Draft for owner approval. This is a **TEST VERSION** (pilot), not the final public launch.
**Builder:** Claude Code
**Code repository:** GitHub, private repo `inkfusion-help-chat`
**Hosting:** Cloudflare
**Date:** 7 Nov 2026

### Changes from v0.1
- Hosting moved from Vercel to **Cloudflare**. Database and storage moved from Supabase to **Cloudflare D1, R2 and Vectorize**.
- Added **section 12.1, "Code & Deployment (GitHub + Cloudflare)"**.
- Admin login now uses **Cloudflare Access** instead of a home-made password.
- The WhatsApp alert now uses the **WhatsApp Business Cloud API** (confirmed).
- Added **Phase 0 (accounts & setup)** to the milestones.
- Added new open questions in section 15.

---

## 1. Problem

When a customer's printer or heat press breaks down, they phone Deshitha. He walks them through basic fixes by phone and only sends a technician if that doesn't work. Many of these calls are about the same simple problems, like a clogged head or software not opening. This takes up a lot of his time and leaves customers waiting.

## 2. Goal

Build a mobile-friendly **web chat agent** that walks customers through **basic, safe, self-fix steps** for common breakdowns. When the problem is beyond a basic fix, it hands the customer over to iNK Fusion: they can request a technician or call during business hours.

### Success metrics
- At least 40% of chats end with the customer confirming "fixed" and no call to iNK Fusion
- Fewer breakdown phone calls to Deshitha each week
- Every escalation reaches iNK Fusion with complete details: name, phone, machine, problem, photo

## 3. Users

- **Customers:** anyone who owns or uses these machines, mostly print shop owners and operators in Sri Lanka. They are usually on a phone, standing next to the machine, often stressed, and not technical. They use English, Sinhala, Singlish or Tamil.
- **Admin:** Deshitha, who reviews technician requests and maintains the fix guides.

Anyone can use the agent. There is no login and no customer check.

## 4. Scope (v1)

### 4.1 Machines covered
1. DTF printers (including the powder shaker/dryer unit)
2. Epson printers (ink-tank and sublimation-converted models)
3. Chinese large-format sublimation printers
4. Heat presses (flat, mug, cap, etc.)

### 4.2 Problems covered (starter list; Claude drafts, owner approves)
**Printers**
- Head clogging / missing nozzles (includes DTF white ink clogging)
- Lines or banding in prints
- Colours missing or wrong
- RIP or print software not working (won't open, licence/dongle not detected, printer not found). Software in use: **Maintop, PrintExp, RIIN, Wasatch SoftRIP, SAi Flexi (FlexiPRINT)**. The agent asks which software the customer uses before guiding.
- Printer not detected by the PC (USB/network)
- Film or paper feed problems
- Common error lights and codes (basic meaning plus safe actions only)
- DTF: powder not sticking, transfer peeling after pressing (process and settings issues)

**Heat presses**
- Not heating, or heating slowly
- Temperature not matching the setting
- Uneven pressure or uneven transfer
- Timer or alarm not working
- Transfer not sticking or fading (time, temperature and pressure settings)

### 4.3 Out of scope (v1)
- Payments, orders, quotations, spare-part sales
- Customer login or accounts
- Remote control of machines
- WhatsApp chat channel for customers (possible later phase; the owner's WhatsApp *alert* is in scope)
- Repairs that need opening the machine's electronics

## 5. Channel & Access

- iNK Fusion has **no website and no domain** today. For the test version, the agent is a **standalone support web page** on Cloudflare's free address (for example `inkfusion-help.<account>.workers.dev`). A custom domain can be added later in the Cloudflare dashboard **without code changes**.
- Customers open it from a **link** sent by iNK Fusion or a **QR sticker on the machine**.
- The QR link can carry the machine type so the chat starts in the right place, for example `?machine=dtf`, `?machine=epson`, `?machine=sublimation`, `?machine=heatpress`.
- **Mobile-first** design: big buttons, large text, works on slow mobile data.

## 6. Conversation Flow

1. **Greeting:** a short welcome and language detection. The agent replies in the customer's language (English / Sinhala / Singlish / Tamil) and switches if the customer switches.
2. **Identify the machine:** taken from the QR link, or asked with quick-pick buttons. Ask the model if the customer knows it (optional). Ask whether the machine is **under warranty** (Yes / No / Not sure), and save the answer with the chat.
3. **Identify the problem:** quick-pick buttons for common problems, plus free text. The customer can upload a photo of the print or the error screen.
4. **Safety check:** before any step, give a safety note where it applies, e.g. "Switch off and unplug first", or "Heat press is hot, wait until it cools".
5. **Guide step by step:** **one step per message**, kept short. Show a photo or video where one is available. After each step, ask "Did that work? ✅ Yes / ❌ No".
6. **Outcome:**
   - **Fixed:** a short tip to prevent the problem happening again, and a thank-you.
   - **Not fixed after the guided steps, or unsafe or advanced:** go to escalation (section 8).

### Message style rules
- Short, simple sentences. No long paragraphs.
- One instruction at a time.
- Match the customer's language.
- Friendly and calm.

## 7. Knowledge Base

The agent answers **only from approved iNK Fusion content**. It must not invent fixes.

### Sources
1. **PDF manuals:** printer, RIP software and heat press manuals and error-code sheets, uploaded by the owner through the admin page and stored in **Cloudflare R2**.
2. **Videos and photos:** iNK Fusion's own how-to videos and photos, e.g. nozzle check, head cleaning, capping station cleaning, heat press temperature check. Videos are hosted as **unlisted YouTube links** (recommended: free and fast on mobile data) or in R2. Photos are stored in R2.
3. **Fix guides drafted by Claude:** a structured starter library of problems and step-by-step fixes. **Each guide must be approved by Deshitha before it goes live.**

### Fix guide format (one per problem)
```yaml
id: dtf-head-clog
machine: dtf
problem: Head clogging / missing nozzles
safety: "Keep the printer ON for cleaning. Wear gloves."
steps:
  - text: "Print a nozzle check."
    media: nozzle-check.mp4
  - text: "If lines are missing, run 1 normal head cleaning."
  - text: "Print nozzle check again."
max_attempts_before_escalation: 3
escalate_if: ["No ink after 3 cleanings", "Ink leaking", "Head error code"]
prevention_tip: "Shake white ink daily and print a test every day."
status: approved   # draft | approved
```

**Where guides live:** the starter library is written as YAML files in the GitHub repo (`guides/`) and loaded into the **D1 database**. After that, the owner edits, adds and approves guides in the admin page, with no code change needed.

### Technical approach
- PDFs are split into sections, turned into search vectors with a multilingual embedding model (Cloudflare Workers AI), and stored in **Cloudflare Vectorize** for retrieval-augmented answers.
- Approved fix guides take priority over manual text.
- If no approved content matches, the agent says so and escalates. It does not guess.

## 8. Escalation

Escalation is offered when the steps fail, a safety or advanced issue comes up, or the customer asks for a person.

1. **Request a technician visit:** a short form in the chat collects:
   - Name, phone number, town/district
   - Machine type and model
   - Problem summary (auto-filled from the chat)
   - Photo or video upload (stored in a private R2 bucket)
   - The steps already tried (auto-attached)
   - Warranty status (from step 2)
   - Before the customer submits, the agent shows a short note: **"Technician visits are chargeable."** The customer confirms they understand. The agent does not quote a price.
2. **"Call iNK Fusion" button:** calls **076 868 0890 (+94768680890)**. It is shown **only during business hours, Mon–Sat 9:00 AM–6:00 PM (Asia/Colombo time)**. Outside those hours, and on Sundays, show "We're closed now. Request a technician and we'll contact you."

Each technician request is saved in the D1 database **and** sent as a **WhatsApp alert** to the owner at **+94768680890** (test version) through the **WhatsApp Business Cloud API (Meta)**, sent from the business number **076 187 0890 (+94761870890)**. The alert is short: customer name, phone, town, machine, warranty status, problem summary, a photo link, and a link to the full chat in the admin page. The alert number is a config setting (`ALERT_WHATSAPP_NUMBER`) so it can be changed without code changes. If the WhatsApp send fails, the request is still saved and is marked "alert failed" in the admin page.

## 9. Safety & Business Rules (must follow)

- **Never** tell customers to open electrical panels, touch mainboards or power supplies, or work on mains wiring. Escalate instead.
- **Never** suggest steps that could damage the print head or void the warranty, such as soaking the head or forcing parts. Escalate.
- Always include safety warnings for heat (heat press) and chemicals (ink, cleaning solution).
- **Never share supplier names' contact details or addresses.** The Audley brand name may appear (it is on the machines), but no supplier contact info. Do not mention Gaoshang.
- Do not give prices, quotes or warranty promises. Direct those to iNK Fusion.
- If the customer is angry or asks for a human, escalate straight away.

## 10. Admin (simple, v1)

- An admin page protected by **Cloudflare Access** (free; the owner logs in with an email one-time code, and only approved email addresses can enter; v1 allows **deshitharkumara@gmail.com** only). It:
  - Lists technician requests (date, customer, phone, machine, problem, photo, chat transcript) with status: New / Contacted / Done
  - Lists fix guides with Draft/Approved status, and lets the owner edit and approve them
  - Lets the owner upload PDF manuals and photos, and add video links
- Shows simple stats: chats per day, % fixed, % escalated, top problems.

## 11. Non-functional Requirements

- **Mobile-first**, loads fast on 3G/4G. Cloudflare serves the page from a location near Sri Lanka.
- **Cost control:** because anyone can use it, add:
  - rate limits per device/IP (Cloudflare rate limiting)
  - a **daily cap of USD 2** on AI calls; when the cap is reached, the agent shows the call / technician options instead
  - **Cloudflare Turnstile** (a free, invisible bot check) on the chat and the technician form
- **Privacy:** customer phone numbers and photos are stored privately (private R2 bucket, admin-only access). Chat logs and photos are deleted after **24 months** by a scheduled daily clean-up job. Show a short privacy note that says so.
- **Reliability:** if the AI service is down, show the "Call iNK Fusion" / "Request technician" options.
- **Easy updates:** the owner can add new manuals, videos and fix guides without changing code.
- **Secrets:** API keys are stored only as Cloudflare secrets, **never in GitHub**.

## 12. Tech Stack

| Part | Choice |
|---|---|
| Code repository | GitHub (private repo `inkfusion-help-chat`) |
| Web app (frontend + backend) | Next.js (React), deployed to **Cloudflare Workers** using the OpenNext Cloudflare adapter |
| AI chat | **Claude API (Anthropic)** with a strict system prompt and retrieval over the knowledge base. The model name is a config setting. |
| Database | **Cloudflare D1** (chats, technician requests, fix guides, stats) |
| File storage | **Cloudflare R2** (PDFs, photos, uploaded videos) |
| PDF search | **Cloudflare Vectorize** + Workers AI multilingual embeddings |
| Admin login | **Cloudflare Access** |
| Bot protection | **Cloudflare Turnstile** |
| Owner alert | **WhatsApp Business Cloud API** |
| Scheduled jobs | Cloudflare Cron Triggers (data clean-up) |
| QR codes | Generated in the admin page, one per machine type |

### 12.1 Code & Deployment (GitHub + Cloudflare)
- All code lives in the private GitHub repo. The `main` branch is the live version.
- The repo is connected to Cloudflare (Workers Builds). **Every push to `main` deploys automatically.**
- Changes are made on a separate branch and opened as a **pull request**. Cloudflare builds a **preview link** so the owner can test before merging.
- Secrets are set in the Cloudflare dashboard: `ANTHROPIC_API_KEY`, `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `TURNSTILE_SECRET`.
- Settings: `ALERT_WHATSAPP_NUMBER`, `BUSINESS_HOURS`, `DAILY_AI_CAP`, `CLAUDE_MODEL`.
- The repo includes a `README` with setup steps written for a non-technical owner.

## 13. Milestones

| Phase | Deliverable |
|---|---|
| 0 | Setup: GitHub repo (done), Cloudflare account, Anthropic API key, Meta WhatsApp Business setup, all owned by deshitharkumara@gmail.com |
| 1 | Claude drafts the fix-guide library → owner reviews and approves |
| 2 | Chat page on Cloudflare: language matching, machine/problem selection, step-by-step guidance from approved guides |
| 3 | PDF manual indexing + photo upload + video display |
| 4 | Escalation: technician request form, call button with business hours, WhatsApp alert |
| 5 | Admin page (Cloudflare Access) + stats + QR codes |
| 6 | Testing with real customer scenarios in all 4 languages → launch |

## 14. Acceptance Criteria (v1)

- A customer scanning a DTF QR code lands in the DTF flow on their phone.
- The agent replies in the language the customer writes in (tested in English, Sinhala, Singlish and Tamil).
- For "head clogging", the agent gives one step at a time from the approved guide and asks after each step whether it worked.
- After the set number of failed attempts, the agent offers a technician request and/or a call button.
- The call button appears only during business hours (Asia/Colombo).
- A technician request saves all details and reaches the owner on WhatsApp.
- The agent refuses unsafe repairs and never shares supplier contact details.
- If there's no approved content for a question, the agent escalates instead of guessing.
- A push to `main` on GitHub deploys to Cloudflare automatically, and no secret is stored in the repo.
- Only the owner's approved email can open the admin page.

## 15. Open Questions (owner to answer)

**Answered:**
- Business hours: Mon–Sat 9:00 AM–6:00 PM, closed Sunday
- Call button number: 076 868 0890
- Technician requests: WhatsApp alert via WhatsApp Business Cloud API
- Software: Maintop, PrintExp, RIIN, Wasatch SoftRIP, SAi Flexi
- WhatsApp alert number: 076 868 0890 (test version)
- Domain: none for now; use the free Cloudflare address
- Technician visits: chargeable; the agent informs the customer but gives no price
- Warranty: the agent asks for warranty status
- Code repo: GitHub (private). Hosting: Cloudflare. AI: Claude API

- Daily AI budget: **USD 2/day**. When it is reached, the agent shows only the call / technician options until the next day (Asia/Colombo).
- Admin email: **deshitharkumara@gmail.com**
- WhatsApp alert sender number: **076 187 0890 (+94761870890)**, registered on the WhatsApp Business Cloud API. Alerts go to 076 868 0890.
- Data retention: chat logs and photos are deleted after **24 months**.
- Account owner (Cloudflare, Anthropic, Meta): **deshitharkumara@gmail.com**

**No open questions.** Ready for owner approval.
