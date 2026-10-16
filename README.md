# BidRadar

An AI agent that reads every new UK public tender each morning, scores it against a business's profile, and sends a shortlist with plain-English summaries and first-draft responses.

```
bidradar/
├── web/                 Next.js website, dashboard, sign-in, Stripe billing
├── agent/               Python FastAPI + LangGraph agent
├── supabase/schema.sql  Database tables and security rules
└── .github/workflows/   Free daily scheduler (GitHub Actions)
```

## How it works

```
GitHub Actions (06:00 weekdays)
        │  POST /jobs/daily
        ▼
Agent (FastAPI) ──► Find a Tender API (free, official UK data)
        │
        │  for each subscribed user, a LangGraph agent runs:
        │  prefilter → score → brief → draft → review ⟲ (one revision)
        ▼
Supabase (Postgres) ◄── Website (Next.js) ◄── Customer
                              │
                           Stripe
```

- **Prefilter** uses keywords, regions, value range and CPV codes to cut thousands of notices down to the best 25 per user, with no AI cost.
- **Score** asks a fast model for a 0–100 fit score, reasons, and risks. Below 65 is dropped.
- **Brief** writes a plain-English summary and requirements checklist.
- **Draft** writes a first-draft response for scores of 80 or more.
- **Review** checks each draft against the requirements and sends it back for one revision if anything is missing or invented.

Tender text is treated as untrusted data in every prompt, so instructions hidden inside a notice are ignored.

## Setup

You need free accounts on Supabase, Stripe, and Render (or Railway), plus an Anthropic API key or a local Ollama model.

### 1. Database (Supabase)

1. Create a project at supabase.com.
2. Open **SQL Editor**, paste in `supabase/schema.sql`, and run it.
3. In **Authentication → URL Configuration**, set the Site URL to your website address and add `https://YOUR-SITE/auth/callback` (and `http://localhost:3000/auth/callback`) to Redirect URLs.
4. Copy the project URL, anon key, and service role key from **Project Settings → API**.

### 2. Agent (Python)

```bash
cd agent
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env        # then fill in your values
uvicorn app.main:app --reload
```

Run the tests with `pytest`.

To trigger a run by hand:

```bash
curl -X POST -H "Authorization: Bearer YOUR_CRON_SECRET" http://localhost:8000/jobs/daily
```

**Running for free:** install [Ollama](https://ollama.com), run `ollama pull llama3.1`, `pip install langchain-ollama`, and set `LLM_MODEL=ollama:llama3.1` and `DRAFT_MODEL=ollama:llama3.1`. Quality is lower than hosted models, but it costs nothing while you build.

### 3. Website (Next.js)

```bash
cd web
npm install
cp .env.example .env.local   # then fill in your values
npm run dev
```

Open http://localhost:3000.

### 4. Payments (Stripe)

1. In Stripe (test mode), create a product called "BidRadar" with a recurring price of £49 per month. Copy the price ID into `STRIPE_PRICE_ID`.
2. Add a webhook endpoint at `https://YOUR-SITE/api/stripe/webhook` for these events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`. Copy its signing secret into `STRIPE_WEBHOOK_SECRET`.
3. To test webhooks locally, use the Stripe CLI: `stripe listen --forward-to localhost:3000/api/stripe/webhook`.
4. Turn on the customer portal in **Settings → Billing → Customer portal**.

## Deploy

- **Agent:** On Render, create a Web Service from this repo with root directory `agent`. It uses the Dockerfile. Add the variables from `agent/.env.example`.
- **Website:** On Vercel, import the repo with root directory `web` and add the variables from `web/.env.example`. Vercel's free Hobby plan is for non-commercial use, so move to Pro once you start charging customers.
- **Scheduler:** In GitHub, go to **Settings → Secrets and variables → Actions** and add `AGENT_URL` and `CRON_SECRET`. The workflow in `.github/workflows/daily-agent.yml` then runs every weekday at 06:00 UTC. You can also run it from the Actions tab.

## Costs

Everything runs on free tiers except AI usage. Because the prefilter only sends the best candidates to the model, scoring costs are small per user per day. Drafts use a stronger model and only run for strong fits. Check current pricing for whichever model you choose.

## Roadmap

- EU tenders (TED API) and UK Contracts Finder for lower-value notices
- Reading tender attachments (specifications, PDFs)
- Team seats and shared shortlists
- Bid deadline reminders

## Security notes

- Never commit `.env` or `.env.local`. They're in `.gitignore`.
- The service role key bypasses database security. It's only used by the agent and the Stripe webhook, never in the browser.
- Users can only read and edit their own data. Billing fields can't be changed from the browser.
- Run `npm audit` and keep Next.js and React up to date.

Tender data: Find a Tender Service, Cabinet Office, under the Open Government Licence v3.0.
