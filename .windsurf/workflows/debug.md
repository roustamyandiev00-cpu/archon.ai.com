---
description: Debug a page that shows an error, crashes or loads nothing
---

You are debugging ArchonPro — a Dutch Next.js SaaS platform.

## Debugging process

### Step 1: Identify the symptom
- "Kon X niet laden" → API error or database problem
- White screen / crash → component error, missing import, or null reference
- 401/403 → authentication/RLS issue in Supabase
- 500 error → server-side code crash

### Step 2: Check the API route
Look at `src/app/api/[route]/route.ts`:
- Does the route exist?
- Is the Supabase query correct?
- Is error handling in place?
- Test it manually: `curl http://localhost:3000/api/[route]`

### Step 3: Check the component
Look at `src/components/pages/[X]Page.tsx`:
- Is there a try/catch around the fetch?
- Is there a null/undefined check on the data?
- Is there a proper loading and error state?

### Step 4: Check environment variables
Verify `.env.local` has:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`  
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL`

### Step 5: Check Supabase RLS
If getting permission errors:
- Go to Supabase Dashboard → Table Editor → RLS policies
- Ensure policies allow authenticated users to read/write

### Step 6: Fix and confirm
After fixing, run:
```bash
bun run typecheck
```

Tell me exactly what the root cause was and what you fixed.
