# Top Tier CMS

A production-oriented Next.js + Supabase sports-media website with:

- Public Top Tier homepage and article pages
- Muted looping YouTube hero
- Smooth, hover-pausing Top Tier X-network carousel
- Server-side ESPN upcoming-games feed
- Supabase email/password writer login
- Owner, editor and writer roles
- Article drafts, review status and publishing
- Cover-image uploads and inline JPG/PNG/WEBP/MP4 media
- Live article-card preview
- Owner-only writer account creation

## 1. Finish Supabase

Your existing project already contains `profiles`, `articles`, and `article_media`.

Open **Supabase → SQL Editor**, paste the complete contents of:

`supabase/migrations/001_top_tier_cms.sql`

Then click **Run**. This adds CMS fields, security policies and the two media buckets without recreating your existing tables.

## 2. Add environment variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

In Supabase, open **Project Settings → API Keys** and copy:

- Project URL
- Publishable key
- Service-role key (server secret)

Paste them into `.env.local`.

Never commit or publicly share `SUPABASE_SERVICE_ROLE_KEY`.

## 3. Install and preview

Requires Node.js 20.9 or newer.

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## 4. Sign in

Use the Auth user you created for `partners@ttmediaco.net`. The migration promotes that profile to `owner`.

- Site: `/`
- Writer login: `/login`
- CMS dashboard: `/dashboard`
- New article: `/dashboard/new`
- Create writer accounts: `/dashboard/writers`

## 5. Deploy on Vercel

1. Create a private GitHub repository and upload this project.
2. Import it into Vercel.
3. Add all three environment variables in Vercel Project Settings.
4. Deploy.
5. In Supabase Authentication URL Configuration, set your Site URL to the Vercel/custom-domain URL.

## Publishing workflow

1. A writer signs in.
2. They create an article, upload media, and save as Draft or Pending Review.
3. An editor/owner reviews it and changes status to Published.
4. Published articles appear automatically on the homepage and receive `/articles/<slug>` URLs.

## Important notes

- The ESPN feed is fetched by a Next.js server route to avoid browser CORS issues. It uses ESPN's unofficial site endpoint, so the route includes graceful error handling.
- X profile images are loaded through `unavatar.io`. If a profile cannot be resolved, the Top Tier logo appears as a fallback. For guaranteed exact avatars, upload approved profile images into the project or use an official X API plan.
- Standard Supabase uploads are most reliable for files under about 6 MB. The MP4 bucket allows larger files, but large production videos should later use resumable uploads.
