# Brew Bari (ব্রিউ বাড়ি)

A high-performance QR-menu and table-service web application for a modern coffee & juice shop in Chattogram, Bangladesh.

Built as a live sales demo supporting 3 product tiers:
- **P1 (Menu Only)**: Digital QR menu, bilingual EN/বাংলা, live offers, search & allergen filter.
- **P2 (Table Service)**: Per-table QR codes, cart & options customization, realtime "Call Waiter" alerts to staff counter.
- **P3 (Full Service)**: "Place Order", bill calculation with VAT, private feedback with Google review prompt, and table closing.

## Architecture & Tech Stack

- **Framework**: Next.js 16 (App Router, React 19, TypeScript strict)
- **Styling**: Tailwind CSS v4 + shadcn/ui primitives
- **Typography**: Plus Jakarta Sans (Latin) + Hind Siliguri (Bangla)
- **Backend**: Supabase (Postgres, RLS on all tables, Auth, Realtime, Storage)
- **Testing**: Vitest + Testing Library + jsdom; Playwright E2E
- **Documentation**: See [.agent/agent.md](.agent/agent.md) for full architecture and specifications.

## Getting Started

1. Copy `.env.example` to `.env.local` and configure your Supabase URL & anon key:
   ```bash
   cp .env.example .env.local
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Run verification checks:
   ```bash
   npm run typecheck
   npm run lint
   npm run test
   npm run test:e2e
   ```
