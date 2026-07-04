# IN2World

IN2World V1 is a shared transaction management MVP for partners and stakeholders. There are no role restrictions in this version: every user can view and manage people, categories, and transactions.

## Stack

- React + Vite + TypeScript
- Material UI
- Supabase
- React Hook Form + Zod validation

## Features

- Dashboard totals: Total Spent, Total Received, Total Capital Added, Net Position, Transaction Count
- Net Position: `Received + Capital Added - Spent`
- People: add, edit, archive, restore
- Categories: add, edit, archive, restore
- Transactions: create, edit, soft delete, restore
- Transaction types: create custom types while entering a transaction
- Search and filters across modules
- Responsive Material UI layout with sidebar navigation

## Environment

Create `.env` from `.env.example` and set:

```env
VITE_SUPABASE_URL=https://nrikujsuldevyexfsazq.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

The provided workspace already includes a local `.env` for development.

## Supabase Setup

Run the migration in `supabase/migrations/20260704143000_initial_schema.sql` using the Supabase SQL editor or the Supabase CLI:

```bash
supabase db push
```

The migration creates:

- `people`
- `categories`
- `transaction_types`
- `transactions`
- enums for payment mode
- indexes, updated-at triggers, and open RLS policies for the shared MVP

## Local Development

Install dependencies:

```bash
npm install
```

Start the app:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

## Notes

- Transactions are soft deleted with `deleted_at` and can be restored from the Transactions page.
- `transaction_date` is when the transaction was actually made and can be a past date.
- `created_at` is when the record was created in IN2World and is set automatically by Supabase.
- Custom transaction types include a dashboard effect: spent, received, capital added, or neutral.
- Archived people and categories are hidden from new transaction dropdowns but existing transaction history remains readable.
- V1 intentionally uses open Supabase RLS policies because the requested MVP has no role restrictions.
