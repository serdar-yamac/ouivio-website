# Ouivio Website

Interactive Next.js product workspace for planning weddings, managing budgets and guests, and discovering suitable vendors.

## Development

```bash
npm install
npm run dev
```

The production build is verified with `npm run build`.

## Supabase and authentication

The dashboard requires the configured Supabase project and an authenticated user:

1. Create a Supabase project.
2. Run `supabase/migrations/001_initial_schema.sql` in the Supabase SQL editor or through the Supabase CLI.
3. Copy `.env.example` to `.env.local` and set the project URL and publishable key.
4. Add the local and deployed dashboard URLs to the Supabase Auth redirect allow list.
5. Register through `/login`; after confirmation, Ouivio creates the user's first wedding workspace and owner membership.

Never commit `.env.local` or service-role keys.
