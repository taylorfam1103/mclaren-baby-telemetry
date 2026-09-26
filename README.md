# Mclaren Baby Telemetry

A mobile-first newborn tracker with a papaya / anthracite / teal motorsport UI.

## What is already built
- Feed logging with 15/30/45/60/90 mL presets
- Breast milk vs formula
- Wet / dirty / both diapers
- One-tap sleep start/stop
- Pump logging by left/right side
- Live "time ago" telemetry
- Today's feed volume + diaper counts
- Unified race-log timeline
- LocalStorage demo mode when Supabase env vars are missing
- Supabase schema for synced family data

## Run locally
```bash
npm install
npm run dev
```

Without Supabase variables, the app automatically runs in demo mode using localStorage.

## Connect Supabase
1. Create a Supabase project.
2. Open SQL Editor and run `supabase/schema.sql`.
3. In Table Editor > `babies`, copy Mclaren's UUID.
4. Create `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_BABY_ID=the-baby-uuid
```
5. Restart the dev server.

## Deploy to Vercel
1. Put this folder in a GitHub repo.
2. Import the repo into Vercel.
3. Add the three environment variables above in Vercel Project Settings > Environment Variables.
4. Deploy.

## Important before making the URL public
The included SQL policies are intentionally permissive so the MVP is fast to test. Add Supabase Auth and household-scoped RLS before sharing the URL outside the family.

## Suggested next upgrade
- Dad / Mom login
- Edit/delete mistaken logs
- Pediatrician summary view
- 24-hour feeding chart
- Pump inventory / fridge stash
- Home-screen PWA icon + manifest
- Bottle timer and next-feed reminder
