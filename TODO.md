# TODO — Immediate Next Actions

## Repository Sync Session (2026-08-05)
- [x] Fetch all remote branches — new commit on `jules` branch detected
- [x] Forward merge: jules (Next.js 16 scaffold) → main ✅
- [x] Reverse merge: main → jules (fast-forward catch-up) ✅
- [x] Resolve `.gitignore` merge conflict
- [x] No upstream fork; no submodules
- [x] Bump version to 0.2.0
- [x] Update CHANGELOG, ROADMAP, TODO, STRUCTURE, HANDOFF
- [x] Build verification (`npm run build`)
- [ ] Push to `origin/main` (both main and jules)

## Next Development Actions (Priority Order)
- [ ] `npm install` and verify dev server (`npm run dev`)
- [ ] Set up PostgreSQL database and run `npx prisma migrate dev`
- [ ] Expand Prisma schema with multi-tenant models (Agent, Team, Brokerage, Contact, Lead, Pipeline)
- [ ] Wire ModelManager UI to `/api/vault` endpoints
- [ ] Implement tiered routing logic in `/api/router`
- [ ] Add authentication (NextAuth.js or similar)
- [ ] Build Smart Contact Management pages
- [ ] Create CSV import/export tools
- [ ] Write unit tests for `encryption.ts` and API routes

## Cleanup
- [ ] Push jules branch to remote (caught up with main)
- [ ] Consider deleting stale remote branches after verification
