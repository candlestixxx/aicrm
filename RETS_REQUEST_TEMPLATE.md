# MiMLS (Paragon) Data Access — Request Template

Use this to request MLS data access from MiMLS tech support. A **broker** must
submit the request on behalf of the brokerage.

> **Prefer the RESO Web API.** RETS is being retired in favor of the RESO Web
> API (a standard REST/JSON API). AiCRM supports both, but RESO is the
> future-proof choice. If MiMLS only offers RETS, the fallback section at the
> bottom covers it.

---

**Subject:** MLS Data Access Request (RESO Web API) — [Your Brokerage Name]

Hello,

I'd like to request **MLS data access** for our brokerage, [Brokerage Name],
for use with our internal CRM (AiCRM). We'd prefer the **RESO Web API** for
future compatibility (RETS is acceptable if that's all you currently offer).

We need read-only access to listing data so we can keep our records current as
listing statuses change (Active, Pending, Expired, Canceled, Withdrawn, Sold,
etc.).

Could you please provide the following:

1. **RESO Web API base URL** (e.g. `https://api.mimls.example.com`)
2. **Authentication details** — an OAuth2 client ID/secret or an API key
   (Bearer token)
3. **Resource/endpoint** for active listings (usually `/Property`)
4. The **field name for the MLS number** (e.g. `ListingKey` or `ListingNumber`)
5. The **field name(s) for listing status** (e.g. `StandardStatus` or
   `MlsStatus`)
6. Any **IP allow-listing** required — the IP(s) we should provide so you can
   whitelist our server

If you only offer legacy RETS, please instead provide:

- RETS Login URL, RETS username, RETS user-agent string + user-agent password,
  RETS version, and the Resource/Class/field names (e.g. `Property` / `RES` /
  `MLNumber` / `Status`).

Please also let me know if there is an application form, data-licensing
agreement, or fee we need to complete.

Thank you,
[Your Name]
[Brokerage Name]
[Your Email]
[Your Phone]

---

## After they reply — RESO Web API (preferred)

Paste into your local `.env` (gitignored — never commit credentials):

```env
MLS_MIMLS_TYPE="http"
MLS_MIMLS_API_URL="<RESO Web API base URL>"
MLS_MIMLS_API_KEY="<OAuth2 token / API key>"
MLS_MIMLS_LOOKUP_PATH="/Property?$filter=ListingKey eq '{mls}'&$top=1"
```

## After they reply — legacy RETS (fallback)

```env
MLS_MIMLS_TYPE="rets"
MLS_MIMLS_API_URL="<RETS Login URL>"
MLS_MIMLS_USERNAME="<RETS username>"
MLS_MIMLS_PASSWORD="<account password>"
MLS_MIMLS_UA="AiCRM/1.0"
MLS_MIMLS_UA_PASSWORD="<RETS user-agent password>"
MLS_MIMLS_RETS_VERSION="RETS/1.7.2"
MLS_MIMLS_SEARCH_RESOURCE="Property"
MLS_MIMLS_SEARCH_CLASS="RES"
MLS_MIMLS_SEARCH_QUERY_FIELD="MLNumber"
MLS_MIMLS_STATUS_FIELD="Status"
```

Then test the connection (authenticated):

```bash
curl -X POST http://localhost:3001/api/listings/sync \
  -H "Content-Type: application/json" \
  -d '{"testProvider":"mimls","mlsNumber":"<a real MLS number>"}'
```
