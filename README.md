# Wayfarer: Personalized Travel Itinerary Planner

AI-powered full-stack app that turns a destination, dates, budget and interests into an editable day-by-day itinerary.

| Layer | Tech | Hosting |
|-------|------|---------|
| Frontend | React 18 + Vite | Vercel |
| Backend | FastAPI (Python) | Render |
| Database and auth | Supabase (Postgres + Auth) | Supabase |
| Generative AI | Groq (Llama 3.3 70B) | Groq Cloud |
| Images | Unsplash API | Unsplash |

## Features

- Email/password sign-up and sign-in (Supabase Auth)
- Smart trip builder: destination, dates, budget, currency, group type and size, pace, stay level, interests, free-text notes
- AI itinerary with attractions, dining, accommodation and transport, with times, locations and costs
- Interactive itinerary: day tabs, edit any stop, add or remove stops, live budget tracker
- Regenerate a single day or the whole trip, with an optional instruction ("more street food")
- Dashboard with saved trips, cover photos and planned-budget stats
- Share a read-only link with travel companions (turn it off any time)

## Project structure

```
travel-itinerary-planner/
├── backend/
│   ├── app/
│   │   ├── main.py            FastAPI app, CORS, health check
│   │   ├── config.py          environment settings
│   │   ├── auth.py            verifies Supabase access tokens
│   │   ├── db.py              Supabase client (service role)
│   │   ├── schemas.py         request validation
│   │   ├── routers/trips.py   CRUD, generate, regenerate, share
│   │   └── services/
│   │       ├── ai.py          prompt engineering + Groq calls
│   │       └── images.py      Unsplash lookup
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/ (pages, components, lib, context, styles.css)
│   ├── package.json, vite.config.js, vercel.json
│   └── .env.example
├── supabase/schema.sql        table + row-level security
└── render.yaml                Render blueprint
```

## 1. Get your keys

1. **Supabase**: create a project. Open *SQL Editor* and run `supabase/schema.sql`. From *Project Settings > API* copy the Project URL, the `anon` key and the `service_role` key. For quick local testing, turn off *Authentication > Providers > Email > Confirm email*.
2. **Groq**: create an API key at console.groq.com.
3. **Unsplash**: create an app at unsplash.com/developers and copy the Access Key (optional; trips work without cover photos).

## 2. Run the backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate    # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env                                  # then fill in your keys
uvicorn app.main:app --reload --port 8000
```

Open http://localhost:8000/api/health to confirm each service is configured. Interactive API docs are at http://localhost:8000/docs.

## 3. Run the frontend

```bash
cd frontend
npm install
cp .env.example .env                                  # fill in Supabase URL, anon key, API URL
npm run dev
```

Open http://localhost:5173, create an account and plan a trip.

## 4. Deploy

**Backend on Render**: push the repo to GitHub, choose *New > Blueprint* and select the repo (it reads `render.yaml`), then fill in the environment variables. Set `CORS_ORIGINS` to your Vercel URL, for example `https://your-app.vercel.app`.

**Frontend on Vercel**: import the repo, set *Root Directory* to `frontend`, and add `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` and `VITE_API_URL` (your Render URL). `vercel.json` handles client-side routing.

In Supabase, add your Vercel URL under *Authentication > URL Configuration* so confirmation emails link back correctly.

## API reference

All `/api/trips` routes need `Authorization: Bearer <supabase access token>`.

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/health` | Service status |
| GET | `/api/trips` | List your trips |
| POST | `/api/trips/generate` | Generate and save a trip |
| GET | `/api/trips/{id}` | Get one trip |
| PUT | `/api/trips/{id}` | Save edits (`title`, `itinerary`) |
| DELETE | `/api/trips/{id}` | Delete a trip |
| POST | `/api/trips/{id}/regenerate` | Regenerate the whole itinerary |
| POST | `/api/trips/{id}/regenerate-day` | Regenerate one day |
| POST | `/api/trips/{id}/share` | Toggle the public read-only link |
| GET | `/api/shared/{token}` | Public shared trip (no auth) |

## Notes

- Free Render instances sleep when idle, so the first request can take about 30 seconds.
- The backend uses the Supabase service-role key, so never expose it to the frontend. Every query is filtered by the verified user id.
- To change the model, set `GROQ_MODEL` in the backend environment.
- Trips are limited to 14 days to keep AI responses reliable.
