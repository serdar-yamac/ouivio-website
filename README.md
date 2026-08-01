# Ouivio Website

Interactive Next.js product workspace for planning weddings, managing budgets and guests, and discovering suitable vendors.

## Development

```bash
npm install
npm run dev
```

The production build is verified with `npm run build`.

## Supabase foundation

The dashboard continues to work locally without external credentials. To prepare cloud persistence:

1. Create a Supabase project.
2. Run `supabase/migrations/001_initial_schema.sql` in the Supabase SQL editor or through the Supabase CLI.
3. Copy `.env.example` to `.env.local` and set the project URL and anonymous key.
4. Add Supabase Auth before enabling cloud writes. The database policies intentionally require an authenticated wedding member.

Never commit `.env.local` or service-role keys.
