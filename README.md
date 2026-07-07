# GrowEasy AI-Powered CSV Importer

An intelligent, AI-powered CSV importer built for GrowEasy CRM. It ingests messy, unstructured, and differently formatted CSV files from various sources (Facebook, Google Ads, Excel, custom spreadsheets) and correctly maps them to structured CRM records using an LLM.

## Tech Stack

**Frontend:** Next.js (App Router), React, Redux Toolkit, Framer Motion, Tailwind CSS-like custom design system (Dark mode, Glassmorphism).
**Backend:** Node.js, Express, PapaParse (for CSV parsing), Multer.
**AI Integration:** Google Gemini (1.5 Flash) via `@google/generative-ai` with structured JSON schema (`responseSchema`) and Zod validation.
**Caching & Rate Limiting:** Redis (ioredis), Express-Rate-Limit.
**Infrastructure:** Nginx Reverse Proxy, Docker, Docker Compose.

## Features

- **Intelligent Field Mapping**: Automatically maps any column name to CRM fields using AI (e.g. "Mobile Number" to `mobile_without_country_code`).
- **Batch Processing**: Uses a scalable batch processing strategy with exponential backoff and retries to avoid API rate limits and ensure robust extraction.
- **Structured JSON output**: Leverages Gemini's exact structured JSON generation constraint (no prompt hacking) to guarantee 100% valid parsing.
- **Zod Validation**: An extra layer of validation on top of AI output to maintain data integrity.
- **High-Performance UI**: Responsive design with Framer Motion animations, virtualized table rendering (for handling large files smoothly), and a sleek modern aesthetic.
- **Robustness**: Redis-backed rate limiter, duplicate caching (prevents AI re-processing the same file in a row), and extensive error handling.

## Requirements

- Node.js (v18+)
- Docker and Docker Compose (recommended for easy setup)
- Google Gemini API Key

## Setup & Running

### Using Docker Compose (Recommended)

1. Rename the `.env.example` in `backend` to `.env`.
2. Open `backend/.env` and add your Gemini API Key (`GEMINI_API_KEY`).
3. Run the complete stack (Backend, Frontend, Redis, Nginx):

```bash
docker-compose up --build
```
4. Access the application:
   - Frontend app: `http://localhost`
   - Backend API: `http://localhost/api/v1`

### Running Locally without Docker

**1. Setup Redis (Optional but recommended)**
Make sure you have a Redis instance running locally, or change `REDIS_URL` in `backend/.env` if hosted remotely. It has graceful degradation if Redis is not available, but rate limiting and caching will fall back to in-memory.

**2. Setup Backend**
```bash
cd backend
npm install
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY
npm run dev
```

**3. Setup Frontend**
```bash
cd frontend
npm install
cp .env.local.example .env.local # Or create one with NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
npm run dev
```

The frontend will be running on `http://localhost:3000` and backend on `http://localhost:5000`.

## Architecture Details

- **Two-Stage AI Extraction**:
  1. **Schema Discovery**: Evaluates headers and 3 sample rows once per upload to generate a field mapping (saves tokens).
  2. **Batch Records Extraction**: Uses the discovered mapping and handles edge cases/ambiguities by passing data in small batches of 25 to the LLM.
- **Normalization Strategy**: After extraction, strict normalizer sanitizes emails, dates, and phone numbers before displaying.
- **Nginx Proxy**: Ensures a single port for the client, while distributing traffic properly to the frontend and backend with timeouts optimized for AI tasks.

## Author

Built for the GrowEasy Assignment. Applied position: **Full-Time**.
