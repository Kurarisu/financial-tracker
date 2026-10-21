# Financial Tracker Frontend Plan

## Goal
Build a responsive frontend that helps users understand their finances, record income and expenses, and review transactions. The implementation will follow the design and API contract to be provided later.

## Current State
- The project uses Next.js App Router, React, TypeScript, and Tailwind CSS.
- The current page is still the default Next.js starter.
- `design.md` and `api-docs.md` have been reviewed as part of Phase 1; remaining API contract gaps are listed under Pending Decisions.
- Use mock data during UI prototyping when useful, keeping it separate from presentation components so it can be replaced by API data.

## Proposed Folder Structure

Keep the frontend in the repository root because this repository is already a Next.js application. Do not add a nested `frontend/` directory unless the project is later reorganized as a monorepo.

```text
app/
	(auth)/
		login/page.tsx
		register/page.tsx
	(app)/
		layout.tsx
		page.tsx                     # Dashboard
		transactions/
			page.tsx
			new/page.tsx
			[id]/edit/page.tsx
		accounts/page.tsx
		categories/page.tsx
		reports/page.tsx
	globals.css
	layout.tsx
	providers.tsx                  # Redux provider
components/
	layout/                         # App shell, navigation, headers
	shared/                         # Reusable domain-agnostic components
	ui/                             # shadcn/ui components
features/
	auth/
		api/
		components/
		slice.ts
		types.ts
	dashboard/
		api/
		components/
		types.ts
	transactions/
		api/
		components/
		types.ts
	accounts/
		api/
		components/
		types.ts
	categories/
		api/
		components/
		types.ts
	reports/
		api/
		components/
		types.ts
lib/
	api/                             # Shared API client and error handling
	format/                          # Currency and date formatters
store/
	index.ts                         # Redux store configuration
	hooks.ts                         # Typed Redux hooks
public/
```

- Keep route files focused on page composition; place domain UI and API operations in the matching `features/` folder.
- Put reusable, domain-agnostic UI in `components/shared/`; shadcn/ui primitives belong in `components/ui/`.
- Keep shared API configuration and formatting helpers in `lib/`.
- Add Redux slices only for shared client state; keep short-lived form and component state local.
- Add tests alongside the feature or component they cover when a test setup is available.

## MVP Scope
- **Authentication:** sign in, registration, Sanctum bearer-token session, and protected routes.
- **Dashboard:** total balance, current-month cashflow, accounts, recent transactions, and trend chart.
- **Transactions:** list, filters, pagination, create, edit, and delete flows supported by the API.
- **Accounts:** account balances, create/edit, archive, and balance reconciliation.
- **Categories:** income/expense categories and user-managed category flows.
- **Reports:** monthly summary, category/account breakdowns, cashflow trend, and CSV export.
- **Navigation and layout:** responsive desktop/mobile navigation and clear loading, empty, error, and success states.

Budgets, recurring transactions, multiple currencies, notifications, and bank synchronization are out of scope for the MVP, as specified in `design.md`.

## Implementation Phases

### 1. Gather requirements and references — Complete
- [x] Reviewed `design.md` for required routes, page behavior, responsive rules, accessibility, and visual direction.
- [x] Reviewed `api-docs.md` for the base URL, Sanctum bearer authentication, endpoint coverage, response envelope, and error format.
- [x] Confirmed Indonesian-language UI, IDR currency formatting, and `YYYY-MM-DD` transaction dates that must not shift across time zones.
- [x] Recorded the MVP scope and excluded features from the design and API docs.
- [x] Identified remaining API contract gaps and recorded them below; these do not block the UI foundation.

**Deliverable:** implementation scope and frontend/API baseline are documented. Phase 2 can proceed; resolve the listed API gaps before integrating the affected flows.

### 2. Build the UI foundation — Complete
- [x] Replace the starter content with the application shell and primary navigation.
- [x] Apply color tokens, typography, spacing, and base components according to the provided design.
- [x] Ensure the layout works on desktop and mobile and supports keyboard navigation and accessible labels.
- [x] Add route scaffolds for the documented navigation destinations without inventing financial data.

**Deliverable:** shared page structure and visual language are ready for the MVP features.

### 3. Implement MVP screens with mock data
- Build the dashboard and transaction list.
- Build the add/edit transaction form with basic input validation.
- Add the agreed categories and filters.
- Provide loading, empty, error, and success states.
- Keep data access in a separate layer so the mock source can be replaced with the API.

**Deliverable:** core flows ready for review before connecting the backend.

### 4. Integrate the API
- Map UI models to the API schemas and document any required transformations.
- Implement data reads and mutations using the available endpoints.
- Handle authentication, server-side validation, pagination, and network errors according to the contract.
- Remove mock data from connected flows without changing the agreed UI behavior.

**Deliverable:** MVP features use backend data.

### 5. Verify and finalize
- Test the dashboard, filters, add/edit transaction flows, and empty/error states.
- Verify the UI at desktop and mobile viewport sizes.
- Run lint and build; fix findings related to the changes.

**Deliverable:** frontend ready for review and use in the target environment.

## MVP Acceptance Criteria
- Users can view a financial summary and recent transactions.
- Users can view, filter, add, and edit transactions according to API capabilities.
- Data and monetary values use the agreed formats.
- The layout remains readable and usable on desktop and mobile.
- Loading, empty, error, and success states are handled clearly.
- No financial data is hard-coded in production flows after API integration is complete.

## Pending Decisions
- Confirm the time zone for timestamp values; preserve date-only transaction values as `YYYY-MM-DD`.
- Document exact success response and validation schemas for account, category, and transaction create/update/delete/detail endpoints.
- Document the transaction-list pagination response shape and supported sort/default page-size behavior.
- Define the CSV export endpoint and document its response headers and filename behavior.
- Revisit scope only if requirements change; budgets, recurring transactions, multiple currencies, notifications, and bank synchronization are currently out of scope.
