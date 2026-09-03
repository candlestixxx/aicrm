# Short-Term TODOs (Phase 3)

- [ ] Modify `prisma/schema.prisma` to include multi-tenant models (`Tenant`, `Brokerage`, `AgentProfile`).
- [ ] Modify `prisma/schema.prisma` to include contact models (`Contact`, `Tag`, `ContactTag`, `MlsData`).
- [ ] Run `npx prisma generate` to validate the new schema.
- [ ] Create `src/app/api/contacts/route.ts` with basic GET/POST REST logic, ensuring tenant data isolation.
- [ ] Implement Smart Filter segment logic in the API.
- [ ] Create `src/lib/agents/enrichment.ts` with the background web-scrubbing logic.
- [ ] Create `src/components/ContactManager.tsx` UI for viewing, tagging, and filtering leads.
- [ ] Embed the `ContactManager` into `src/app/page.tsx` for easy frontend testing.
- [ ] Complete frontend visual verification using Playwright.