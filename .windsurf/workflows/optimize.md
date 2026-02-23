---
description: Improve performance, fix slow loading or optimize API calls
---

You are optimizing ArchonPro for better performance.

## Optimization process

### 1. Identify the bottleneck
- Slow page load → check API response time and component rendering
- Too many requests → check if data can be cached or combined
- Large bundle → check for unused imports or heavy libraries

### 2. API & Database optimizations
- Use `select()` in Supabase to fetch only needed columns
- Add pagination to list endpoints (limit + offset)
- Add proper indexes to frequently queried columns in Prisma schema
- Combine multiple API calls into one where possible

### 3. React/Next.js optimizations
- Use `React.memo()` for components that don't need to re-render
- Use `useMemo` and `useCallback` for expensive calculations
- Ensure Server Components are used where possible (no `'use client'` unless needed)
- Use Next.js Image component for images (`<Image>` from next/image)
- Add `loading="lazy"` for below-the-fold content

### 4. Caching
- Add `cache: 'force-cache'` or `revalidate` to stable API routes
- Use TanStack Query (`useQuery`) with appropriate `staleTime` for client fetches

### 5. Validate improvements
```bash
bun run build
```
Check bundle sizes in `.next/` output. Report before/after improvement.
