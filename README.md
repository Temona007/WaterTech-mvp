# ✈ FlightSavvy MVP

A full-stack flight search platform built with React, Node.js, Express, and Supabase. Integrates the Amadeus API for real-time flight pricing with mock data fallback.

## Tech Stack

- **Frontend**: React 18, Vite, CSS (aviation theme)
- **Backend**: Node.js, Express
- **Database**: Supabase for search analytics
- **Flight search**: Amadeus Flight Offers Search
- **Airport autocomplete**: Amadeus API or Local OpenFlights DB (6k+ airports, no API calls)

## Project Structure

```
flight-data-app/
├── backend/           # Express API server
│   ├── routes/        # API routes
│   ├── services/      # Amadeus, analytics
│   └── server.js
├── frontend/          # React + Vite app
│   └── src/
│       ├── components/
│       └── api/
├── supabase/
│   └── schema.sql     # DB schema for searches
└── README.md
```

## Setup

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your Amadeus and Supabase credentials
```

### 2. Supabase

1. Create a project 
2. Create the `searches` table either:
   - **Option A:** Run `npm run db:setup` (add `DATABASE_URL` to `.env` from Dashboard > Settings > Database > Connection string)
   - **Option B:** Run `supabase/schema.sql` in the Dashboard SQL Editor
3. **Existing deployments:** Run `npm run db:migrate` (needs `DATABASE_URL`) or paste each file in `supabase/migrations/` into the Supabase SQL Editor (001, 002, 003)
4. Copy `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (service_role secret, not anon) to `.env`

**Important:** The frontend must NOT connect directly to Supabase. All database access goes through the backend using `SUPABASE_SERVICE_ROLE_KEY` only.

### 3. Amadeus API

1. Register at [developers.amadeus.com](https://developers.amadeus.com)
2. Get API Key and API Secret
3. Add to `.env` as `AMADEUS_API_KEY` and `AMADEUS_API_SECRET`

### 4. Mock Data

To use mock data (no API key needed), set in `.env`:

```
USE_MOCK_DATA=true
```

### 5. Frontend

```bash
cd frontend
npm install
```

## Run

**Terminal 1 – Backend:**

```bash
cd backend && npm start
```

Backend: http://localhost:3000

**Terminal 2 – Frontend:**

```bash
cd frontend && npm run dev
```

Frontend: http://localhost:5173

The Vite dev server proxies `/api` to the backend, so API calls work without CORS issues.

## Features

- **Search**: Origin, destination (autocomplete from 6k+ airports), dates, passengers, cabin class
- **Round-trip / One-way**
- **Flexible dates** (±3 days via Amadeus)
- **Filters**: Stops (non-stop, 1, 2+), airlines, price range (slider)
- **Analytics**: Each search logged to Supabase `searches` table
- **Mock fallback**: Works without Amadeus credentials
- **Local airports**: Run `npm run build:airports` in backend to refresh airport data from OpenFlights

## Database Schema (searches)

The `public.searches` table logs flight search analytics. RLS is enabled; only the backend (using `SUPABASE_SERVICE_ROLE_KEY`) can access it.

| Column         | Type        | Description                                      |
|----------------|-------------|--------------------------------------------------|
| id             | UUID        | Primary key (auto-generated)                      |
| origin         | TEXT        | IATA airport code (e.g. JFK, LAX)                |
| destination    | TEXT        | IATA airport code                                |
| departure_date | DATE        | Outbound date                                    |
| return_date    | DATE        | Return date (nullable for one-way)                |
| trip_type      | TEXT        | `oneway` or `return`                             |
| passengers     | INTEGER     | Passenger count (default 1)                       |
| cabin_class    | TEXT        | Cabin class if used (e.g. ECONOMY, BUSINESS)      |
| filters_used   | JSONB       | `{ stops, airlines[], price_min, price_max, sort_option }` — tracked when user clicks filters |
| results_count  | INTEGER     | Number of flight results returned                |
| response_time_ms | INTEGER   | Search response time in milliseconds             |
| cache_status   | TEXT        | `hit` or `miss`                                  |
| api_provider   | TEXT        | `Amadeus` or `Mock`                              |
| error_code     | TEXT        | Error code if search failed (nullable)           |
| error_message  | TEXT        | Sanitized error message if failed (nullable)     |
| created_at     | TIMESTAMPTZ | When the search was logged (server time)         |

**Analytics notes:** No personal user data. Backend writes only (service role). Frontend never writes to DB.

### How to validate logs

1. **Run a search** in the app (local or production).
2. **In Supabase Dashboard** → Table Editor → `searches` — new rows should appear.
3. **Example queries** (Supabase SQL Editor):

```sql
-- Recent searches with analytics
SELECT origin, destination, departure_date, results_count, response_time_ms, cache_status, api_provider, created_at
FROM public.searches
ORDER BY created_at DESC
LIMIT 20;

-- Cache hit rate (last 100 searches)
SELECT cache_status, COUNT(*) 
FROM public.searches 
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY cache_status;

-- Failed searches (for debugging)
SELECT origin, destination, error_code, error_message, created_at
FROM public.searches
WHERE error_code IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;
```

4. **Test locally:** `npm run db:test` in backend to verify Supabase connection.

### Production (Vercel) → Supabase

Records from production (Vercel URLs) appear in Supabase with no special config. The frontend calls your backend API; the backend (with `SUPABASE_SERVICE_ROLE_KEY`) writes to Supabase. CORS allows `*.vercel.app` origins. Ensure `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set in your Vercel backend env vars.

**If no records appear:** Check backend logs for `[Analytics] Failed to log search`. Verify Supabase env vars in Vercel → Settings → Environment Variables.

## Environment Variables

| Variable            | Description                    |
|---------------------|--------------------------------|
| AMADEUS_API_KEY     | Amadeus API key                |
| AMADEUS_API_SECRET  | Amadeus API secret             |
| SUPABASE_URL               | Supabase project URL           |
| SUPABASE_SERVICE_ROLE_KEY  | Supabase service_role key (backend-only) |
| USE_MOCK_DATA       | `true` to use mock data        |
| PORT                | Backend port (default 3000)    |
| FRONTEND_URL        | Production frontend URL for CORS (e.g. Vercel) |

## Deploy to Vercel

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for step-by-step Vercel deployment instructions.
