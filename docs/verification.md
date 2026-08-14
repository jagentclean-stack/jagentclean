# Verification Notes

## 2026-08-14 — Public services and pricing

The public `/services` page was visually checked after reconciling the `services` schema with the live database. The published CMS service cards now load successfully and retain the brand's white space, blue typography, and lime service-icon treatment. Price, promotion, and note areas remain intentionally absent until an administrator enters published pricing data in `/cms/prices`.

The database mismatch was resolved by adding the missing `promotion` column alongside the new `priceNote` column. The price API validation suite and production build completed successfully before this check.

## 2026-08-14 — CMS prices, employee accounts, and session safety

The authenticated CMS preview was checked at `/cms/prices` and `/cms/users`. Both screens use the intended deep-blue and lime-green visual language; protected data queries wait for the session before loading. Automated coverage now includes price validation, public pricing display states, employee-management RBAC, and password-hash exclusion from the current-user endpoint.

During this verification, `auth.me` was found to be returning a password hash. The endpoint now serializes an explicit public-session DTO instead, and a regression test confirms that both `passwordHash` and arbitrary internal fields are excluded.

## 2026-08-14 — Final public services review

The current `/services` production-style preview renders eight published service cards without client errors. The service hierarchy, brand colors, footer, and LINE quotation call-to-action remain intact after the pricing changes. No price rows are visible because no published price records have yet been entered; this is the intended empty-price presentation. The API has an explicit second published-only filter, backed by a regression test that proves unpublished services and their price data are excluded.
