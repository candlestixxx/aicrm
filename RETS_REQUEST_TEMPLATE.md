# MiMLS (Paragon) RETS Access — Request Template

Use this to request RETS data access from MiMLS tech support. A **broker** must
submit the request on behalf of the brokerage.

---

**Subject:** RETS Access Request — [Your Brokerage Name]

Hello,

I'd like to request **RETS (Real Estate Transaction Standard) data access** for
our brokerage, [Brokerage Name], for use with our internal CRM (AiCRM).

We need read-only access to listing data so we can keep our records current as
listing statuses change (Active, Pending, Expired, Canceled, Withdrawn, Sold,
etc.).

Could you please provide the following:

1. **RETS Login URL** (the dedicated RETS endpoint, not the web login page)
2. **RETS username**
3. **RETS User-Agent string** (if you assign one)
4. **RETS User-Agent password**
5. **RETS version** (e.g., RETS/1.7.2 or 1.8)
6. **Resource / Class / System names** for listing data — specifically:
   - Which resource/class holds the active listing records (e.g., `Property` / `RES`)
   - The field used to look up a listing (e.g., `MLNumber` or `ListingKey`)
   - The field(s) that hold the **listing status** (e.g., `Status`, `ListingStatus`, or `MlsStatus`)
7. Any **IP allow-listing** required — please let me know the IP(s) we need to
   provide so you can whitelist our server.
8. Whether authentication uses **Basic** or **Digest** User-Agent Authorization.

Please also let me know if there is an application form, data-licensing
agreement, or fee we need to complete.

Thank you,
[Your Name]
[Brokerage Name]
[Your Email]
[Your Phone]

---

## After they reply

Paste the values into your local `.env` (gitignored — never commit credentials):

```env
MLS_MIMLS_TYPE="rets"
MLS_MIMLS_API_URL="<RETS Login URL they provide>"
MLS_MIMLS_USERNAME="<RETS username>"
MLS_MIMLS_PASSWORD="<account password>"
MLS_MIMLS_UA="AiCRM/1.0"                 # or the UA string they assign
MLS_MIMLS_UA_PASSWORD="<RETS user-agent password>"
MLS_MIMLS_RETS_VERSION="RETS/1.7.2"
MLS_MIMLS_SEARCH_RESOURCE="Property"     # update to their resource name
MLS_MIMLS_SEARCH_CLASS="RES"             # update to their class name
MLS_MIMLS_SEARCH_QUERY_FIELD="MLNumber"  # update to their key field
MLS_MIMLS_STATUS_FIELD="Status"          # update to their status field
```

Then test the connection (authenticated):

```bash
curl -X POST http://localhost:3001/api/listings/sync \
  -H "Content-Type: application/json" \
  -d '{"testProvider":"mimls","mlsNumber":"<a real MLS number>"}'
```

If MiMLS says they use **Digest** (not Basic) User-Agent Authorization, note it
— the adapter's auth header is the one place that needs updating to digest.
