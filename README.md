# KasKu Frontend

KasKu is a bilingual personal finance app built with Next.js. It provides a mobile-first interface for tracking accounts, transactions, monthly spending, and reports. The Laravel API is maintained in a separate repository/project.

## Features

- Dashboard with account balances, monthly cash flow, and recent activity
- Cash, bank, e-wallet, and other accounts
- Income, expense, and transfer transactions
- Categories and monthly budgets
- Monthly reports with expense breakdowns and CSV export
- English and Indonesian interface
- Mobile-first navigation and layouts

## Requirements

- Node.js 20.9 or later
- npm
- A running KasKu Laravel API (see the backend README)

## Local setup

Install dependencies:

```bash
npm install
```

Create `.env.local` in the project root and point the server-side API proxy to the Laravel API:

```env
API_BASE_URL=http://127.0.0.1:8000/api
```

`API_BASE_URL` is optional when the API is available at the default URL above. `NEXT_PUBLIC_API_URL` is also supported as a fallback. Restart the dev server after changing environment variables.

Start the frontend:

```bash
npm run dev
```

Open [http://localhost:3001](http://localhost:3001).

To run the frontend in Docker instead, use:

```bash
docker compose up
```

The Compose service expects the Laravel API on the host at `http://localhost:8000`. Set `API_BASE_URL` or `NEXT_PUBLIC_API_URL` in `.env` to override the defaults.

## Other commands

```bash
npm run lint
npm run build
npm run start
```

`npm run dev:webpack` starts the development server with Webpack instead of Turbopack.

## API connection

The browser calls Next.js route handlers under `app/api`. Those handlers proxy requests to Laravel and forward the user's Sanctum bearer token. This keeps the Laravel base URL server-side and lets the frontend and API use different local ports.

For local development, start Laravel at `http://127.0.0.1:8000` before using the app. Registration and login are handled by Laravel; the frontend stores the returned token in the browser session.

## Project structure

```text
app/                 Next.js pages and API proxy routes
components/           App shell and feature views
i18n/                 Locale routing configuration
lib/                  API proxy, formatting, and shared helpers
messages/             English and Indonesian translations
```

## Deployment notes

Set `API_BASE_URL` in the hosting environment to the deployed Laravel API URL, including its `/api` prefix. Keep API credentials and server configuration out of `NEXT_PUBLIC_*` variables unless they are intended to be exposed to browsers.
