# API reference

Base: `https://api.vitaqueen.com/api/v1`

Everything is JSON. Send `Accept-Language: fa | en | ar | ru`; the response
carries `Content-Language` and varies on it. A missing translation falls back to
English, then to any populated locale, so a field is never blank when *some*
translation exists.

Collections are wrapped in `data`. Field names are camelCase, matching
`apps/web/src/types/content.ts` — when a payload changes shape, change that file
in the same commit.

## Public

| Method | Path | Returns |
| --- | --- | --- |
| `GET` | `/products` | Published products, ordered |
| `GET` | `/products/{slug}` | One published product |
| `GET` | `/certificates` | Published **and currently valid** certificates |
| `GET` | `/water-analysis` | The most recent published analysis |
| `GET` | `/water-analyses` | Up to 24 published analyses |
| `GET` | `/source` | The source profile with its mineral signature |
| `GET` | `/production-stages` | The production line, ordered |
| `GET` | `/news?limit=` | Published articles (bodies omitted) |
| `GET` | `/news/{slug}` | One article, with its sanitised body |
| `GET` | `/pages/{slug}` | A CMS page (`privacy`, `terms`, `cookies`) |
| `GET` | `/distributors` | Published distributors |
| `POST` | `/contact` | Accepts an enquiry — `202`, body `{"status":"accepted"}` |

Reads are cacheable: `public, max-age=60, s-maxage=300,
stale-while-revalidate=600`. Limited to 120 requests per minute per IP; the
Next.js renderer presents `INTERNAL_API_TOKEN` as a bearer token and is exempt.

`POST /contact` is limited to 3 per minute and 30 per day per IP.

### Two behaviours worth knowing

**Expired certificates disappear.** `GET /certificates` filters on
`valid_until >= today`. An expired certificate on a public page is a claim the
factory can no longer support, so it stops being served rather than being
rendered with a warning.

**Drafts 404, they do not 403.** An unpublished product is indistinguishable
from one that never existed.

## Admin

All admin routes need `Authorization: Bearer <token>`, an active account and —
for super admin, admin and editor — a confirmed second factor.

### Auth

| Method | Path | Notes |
| --- | --- | --- |
| `POST` | `/admin/login` | `email`, `password`, optional `two_factor_code`, optional `device_name` |
| `POST` | `/admin/logout` | Revokes the current token only |
| `GET` | `/admin/me` | Current profile |

`POST /admin/login` returns:

- `200` with `{ token, expiresAt, user }`
- `409` with `{"status":"two_factor_required"}` — resend with `two_factor_code`
  (a TOTP code or a recovery code)
- `422` for any credential failure, with one message that does not distinguish
  wrong password from unknown account
- `429` once the limiter trips (5 per minute, keyed on email *and* IP)

### Two-factor

| Method | Path | Notes |
| --- | --- | --- |
| `POST` | `/admin/two-factor` | Returns `secret` and `otpauthUrl`; parked in the cache for 10 minutes |
| `POST` | `/admin/two-factor/confirm` | `code` — returns `recoveryCodes` **once** |
| `DELETE` | `/admin/two-factor` | Requires `password` |

### Content

Standard REST resources at `/admin/…`:
`products`, `certificates`, `water-analyses`, `news`, `pages`,
`production-stages`, `distributors`, `users`.

Plus:

| Method | Path | Notes |
| --- | --- | --- |
| `GET` | `/admin/dashboard` | Counts, certificates expiring within 90 days, recent activity |
| `GET`/`PUT` | `/admin/source` | The singleton source profile |
| `GET`/`POST` | `/admin/media` | List and upload (`multipart/form-data`: `file`, `category`, optional `alt`) |
| `DELETE` | `/admin/media/{media}` | Editor and above |
| `GET` | `/admin/contact-messages` | `?topic=`, `?unhandled=1` |
| `POST` | `/admin/contact-messages/{id}/handled` | Marks it handled |
| `GET` | `/admin/audit-logs` | `?action=`, `?resource_type=`, `?user_id=`, `?from=`, `?to=` — admin only |

### Translatable fields

Send an object keyed by locale. Validation rejects any key outside the four
supported locales, and the fallback locale is required on create:

```json
{
  "sku": "VQ-500",
  "volume_ml": 500,
  "name": {
    "fa": "ویتاکوئین ۵۰۰ میلی‌لیتر",
    "en": "VitaQueen 500 ml",
    "ar": "فيتاكوين 500 مل",
    "ru": "VitaQueen 500 мл"
  }
}
```

Reads return the resolved string for the requested locale, not the object.

### Water analysis values

Mineral keys must match the message catalogue
(`apps/web/messages/*.json` → `source.minerals.*`). The API never sends a
display label; the frontend translates the key. That is what keeps one analysis
readable in four languages without the laboratory typing anything four times.

```json
{
  "sampling_point": "Wellhead",
  "sampled_at": "2026-07-14",
  "laboratory": "…",
  "report_number": "…",
  "ph": 7.4,
  "tds": 342,
  "values": [
    { "key": "calcium", "value": 62, "unit": "mg/L", "method": "ISO 6058" },
    { "key": "nitrate", "value": 2.1, "unit": "mg/L", "limit_value": 50, "method": "ISO 10304-1" }
  ]
}
```

## Errors

| Status | Meaning |
| --- | --- |
| `401` | No token, or the token expired |
| `403` | Authenticated but not permitted, or 2FA not enrolled (`code: two_factor_required`) |
| `404` | Not found, or not published |
| `409` | A second factor is required to finish logging in |
| `422` | Validation failed — `errors` is keyed by field |
| `429` | Rate limited |
| `500` | `{"message":"Server error."}` and nothing else, whatever `APP_DEBUG` says |
