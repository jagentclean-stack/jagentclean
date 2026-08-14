# Verification Notes

## 2026-08-14 — Public services and pricing

The public `/services` page was visually checked after reconciling the `services` schema with the live database. The published CMS service cards now load successfully and retain the brand's white space, blue typography, and lime service-icon treatment. Price, promotion, and note areas remain intentionally absent until an administrator enters published pricing data in `/cms/prices`.

The database mismatch was resolved by adding the missing `promotion` column alongside the new `priceNote` column. The price API validation suite and production build completed successfully before this check.

## 2026-08-14 — CMS prices, employee accounts, and session safety

The authenticated CMS preview was checked at `/cms/prices` and `/cms/users`. Both screens use the intended deep-blue and lime-green visual language; protected data queries wait for the session before loading. Automated coverage now includes price validation, public pricing display states, employee-management RBAC, and password-hash exclusion from the current-user endpoint.

During this verification, `auth.me` was found to be returning a password hash. The endpoint now serializes an explicit public-session DTO instead, and a regression test confirms that both `passwordHash` and arbitrary internal fields are excluded.

## 2026-08-14 — Final public services review

The current `/services` production-style preview renders eight published service cards without client errors. The service hierarchy, brand colors, footer, and LINE quotation call-to-action remain intact after the pricing changes. No price rows are visible because no published price records have yet been entered; this is the intended empty-price presentation. The API has an explicit second published-only filter, backed by a regression test that proves unpublished services and their price data are excluded.

## 2026-08-14 — Published anonymous access check

The deployed `/cms` response returns a `noindex, nofollow` robots directive. An anonymous request to the deployed `auth.me` endpoint returns `null`; it contains no session DTO and no password hash. The published login page renders the intended allow-listed email selector and password field. A full authenticated CMS interaction check remains pending until an authorised administrator supplies the CMS password through the open login page.

## 2026-08-14 — Current service API re-check

The log review surfaced earlier service-query failures created before the missing `promotion` database column was reconciled. A fresh request to the current development server's `cms.publicContent.services` endpoint returns HTTP 200 with the published service collection, including nullable pricing fields. The historical 500 responses are therefore not an active regression.

## 2026-08-14 — Price management page tests

The CMS price-management page now has direct JSDOM coverage for access control and for changing the minimum price, per-unit price, and promotion message. Its missing React Hook import was corrected before the test was added. The complete suite currently passes 24 test files and 55 assertions, and the production build completes successfully.

## 2026-08-14 — Service management form

`/cms/services` was rebuilt around one controlled editing dialog, preventing duplicate forms from mounting when an administrator edits a service. The form now manages the description, cleaning process, icon and banner URLs, video URL, pricing, promotion, price note, SEO metadata, and publish state. Page tests cover access denial and a complete edit submission; the full suite passes 25 files / 57 tests and production build succeeds. Service-specific FAQ associations remain a separately scoped enhancement.
