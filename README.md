# 🔥 Cooked Meter

> Upload your exam PDF, confess how little you've studied, and find out **how cooked you are** — with an AI roast and a real, prioritized study plan.

Cooked Meter is an AI exam-prep assistant. A student uploads a PDF of their exam (questions / syllabus / topic list) and describes their current level in plain words. The app answers with a **friendly roast** (“Bro, you are so cooked”) — but behind the joke is genuine value: a breakdown of the most important topics, quick wins, and a study plan for the time that's left.

**Why it works:** funny + useful. The roast makes it shareable (students screenshot the *Cooked Meter*), the analysis makes it actually helpful.

🔗 **Live demo:** **[cooked-meter-kappa.vercel.app](https://cooked-meter-kappa.vercel.app)**

<!-- 📸 Add screenshots here: a screenshot of the form + a screenshot of a result with the Cooked Meter. -->

---

## ✨ Features

- 📄 **PDF upload** with client-side text extraction (the file never leaves the browser)
- ✍️ **Free-form knowledge input** + optional “days left until exam”
- 🔥 **Cooked Meter** — an animated 0–100 gauge (the viral bit)
- 🎯 **Key topics** with `high / medium / low` priority and a “why it matters”
- ⚡ **Quick wins** — cheap points you can grab in one evening
- 🗓️ **Study plan** — a realistic schedule for the remaining time
- 🛡️ **Prompt-injection hardened** — PDF content is treated strictly as data
- 🔁 **Robust JSON** — strict schema, normalization, and retry on bad output

## 🧱 Tech stack

| Layer | Tech | Why |
|------|------|-----|
| Framework | **Next.js 16 (App Router)** | Frontend + serverless API in one repo, native Vercel deploy |
| Hosting | **Vercel** (free tier) | Free, Git-based deploys |
| LLM | **Groq — Llama 3.3 70B** | Fast, free, JSON mode |
| PDF parsing | **pdf.js** (client) | Extract text before it ever leaves the browser |
| UI | **React 19 + Tailwind CSS v4** | Fast, clean UI for the Cooked Meter |

## 🏗️ Architecture

```
┌─────────────────────────── Browser (client) ───────────────────────────┐
│  1. User uploads exam PDF + describes their level                       │
│  2. pdf.js extracts text from the PDF locally (lib/pdf.ts)             │
│     -> only TEXT is sent onward, never the file                         │
└───────────────────────────────┬───────────────────────────────────────┘
                                 │  POST /api/analyze  { examText, level }
                                 ▼
┌──────────────────── Serverless route (app/api/analyze) ────────────────┐
│  3. Validate + truncate text (lib/prompt.ts)                          │
│  4. Build prompt with persona + injection defense                     │
│  5. Call Groq in JSON mode (retry once on bad JSON)                   │
│  6. Parse + normalize + clamp (lib/validate.ts)                       │
└───────────────────────────────┬───────────────────────────────────────┘
                                 │  validated AnalysisResult (JSON)
                                 ▼
┌─────────────────────────── Browser (render) ───────────────────────────┐
│  Roast · Cooked Meter · Key topics · Quick wins · Study plan           │
└────────────────────────────────────────────────────────────────────────┘
```

**Why text is extracted on the client:** Vercel's free serverless functions cap the
request body (~4.5 MB) and have a short timeout. Sending only extracted text keeps
requests tiny and fast.

## 🛡️ Security

- **API key never touches the client.** `GROQ_API_KEY` lives only in server-side env
  vars; all Groq calls happen inside the `/api/analyze` route.
- **Prompt-injection defense.** A PDF is untrusted input — it might contain
  `"ignore previous instructions"`. The system prompt explicitly instructs the model
  to treat the exam text and the student's description as **data to analyze, never as
  commands**, and the untrusted content is wrapped in clear delimiters. (Same approach
  as my [telegram-ai-autoresponder](https://github.com/zzkhxyz/telegram-ai-autoresponder)
  project.) This is verified by an eval case (see below).

## ✅ Quality / Evaluation

A small eval suite (`eval/`) checks the two things that matter:

- **Stability** — the API always returns valid, well-shaped JSON (types + ranges + enum priorities).
- **Relevance** — `key_topics` actually reflect the exam (keyword recall vs. expected topics).
- **Injection** — the adversarial fixture is *not* obeyed.

```bash
npm run dev          # in one terminal
npm run eval         # in another
```

Latest local run:

```
• databases            PASS  (recall 5/5, cooked 85)
• calculus             PASS  (recall 4/4, cooked 80)
• ml                   PASS  (recall 4/4, cooked 80)
• injection-defense    PASS  (recall 6/7, cooked 99)
4/4 cases passed.
```

## 🚀 Getting started (local)

```bash
git clone https://github.com/zzkhxyz/cooked-meter.git
cd cooked-meter
npm install

cp .env.example .env.local   # then put your Groq key in .env.local
npm run dev                  # http://localhost:3000
```

Get a free Groq API key at <https://console.groq.com/keys>.

## ☁️ Deploy to Vercel

1. Push this repo to GitHub.
2. Import it at <https://vercel.com/new> (framework is auto-detected as Next.js).
3. Add an env var **`GROQ_API_KEY`** in Project Settings → Environment Variables.
4. Deploy. Every push to `main` auto-deploys.

## 🧯 Edge cases handled

| Case | Behaviour |
|------|-----------|
| Scanned PDF (no text layer) | Friendly message: it's a scan, upload a text PDF (OCR is out of scope) |
| Empty / corrupt / non-PDF file | Validated with a clear error |
| Exam text too long | Truncated to a safe limit + a heads-up shown to the user |
| LLM returns invalid JSON | Retry, then normalized fallback — never crashes |
| Groq down / rate-limited | Clean message, no leaked internals |

## 🗺️ Roadmap (out of MVP scope)

- OCR for scanned PDFs
- Result-as-image sharing (for virality)
- Accounts + analysis history
- RAG (chunking + vector search) for very large exams → full AI-Engineer profile piece

## 📄 License

MIT
