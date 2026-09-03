# Internal System Memory & Architectural Observations

## Architectural Observations
*   **Framework:** Next.js 16 (App Router), TypeScript, TailwindCSS.
*   **Database:** PostgreSQL managed via Prisma ORM v7.
*   **Prisma v7 Specifics:** The `url` property is no longer supported in `prisma/schema.prisma`. Connections must use driver adapters (e.g., `@prisma/adapter-pg` with `pg` module) in the application runtime.
*   **Security:** A Bring-Your-Own-Key (BYOK) architecture is enforced. API Keys are stored in the database, symmetrically encrypted (`aes-256-gcm` using `crypto.scryptSync`). No secrets or `.env` files are tracked in version control.

## Design Preferences
*   **Autonomy:** Execute workflows autonomously without unnecessary user confirmation pauses.
*   **Documentation Standards:** Maintain a universal standard across files, referencing a global master if needed. Update version strings in a centralized text file (like `VERSION.md`), not hardcoded in logic.
*   **UI Quality:** Robust coverage in the UI with explicit forms, clear labels, and tooltips.
*   **Commenting:** Comment in-depth on the *why*, structural side effects, and alternate methods attempted. Avoid commenting self-explanatory lines. Combine redundant code paths.

## Codebase Traits
*   `src/lib/encryption.ts`: Houses the symmetric AES-256-GCM encryption/decryption utilities.
*   `src/app/api/vault/route.ts`: Manages secure key storage (GET/POST/DELETE).
*   `src/app/api/router/route.ts`: HyperNexus Router for Tier 1 (fast/cheap) and Tier 2 (frontier reasoning) LLM delegation based on task complexity keyword heuristics.
*   `src/components/ModelManager.tsx`: The primary UI for vault configuration and Tier routing education.