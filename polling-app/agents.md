# GitHub Copilot Context: Polling App with QR Code Sharing
# Project: AI-Assisted Development with v0 Patterns

## Project Overview
Build a polling application where registered users can create polls with automatic QR code generation and shareable links. Voters can access polls via unique URLs and cast votes. Built with Next.js App Router, Supabase, and deployed on Vercel.

## Core Architecture (v0 Style)
- **Framework**: Next.js 14+ App Router (Server Components by default)
- **Database**: Supabase (Postgres with Row Level Security)
- **Auth**: Supabase Auth (email/password)
- **Styling**: Tailwind CSS + shadcn/ui components
- **QR Generation**: qrcode.react for client, qrcode for server
- **Deployment**: Vercel (edge functions, serverless)

## Database Schema (Supabase)
```sql
-- Polls table
create table polls (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  question text not null,
  created_at timestamptz default now()
);

-- Options table  
create table options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid references polls(id) on delete cascade,
  text text not null,
  position int not null
);

-- Votes table (prevents duplicates)
create table votes (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid references polls(id) on delete cascade,
  option_id uuid references options(id) on delete cascade,
  visitor_id text not null, -- cookie or user_id
  created_at timestamptz default now(),
  unique(poll_id, visitor_id)
);

-- Row Level Security
alter table polls enable row level security;
alter table options enable row level security;
alter table votes enable row level security;

-- Policies: creators can manage their polls, anyone can read/vote
create policy "owners manage polls" on polls using (auth.uid() = user_id);
create policy "anyone read polls" on polls for select using (true);
create policy "anyone read options" on options for select using (true);
create policy "anyone vote once" on votes for insert with check (true);

Route Structure (App Router)
Copy

app/
├── page.tsx                    # Landing page
├── auth/                       # Authentication pages
│   ├── login/page.tsx
│   └── register/page.tsx
├── polls/                      # Creator dashboard
│   ├── page.tsx               # List user's polls
│   ├── new/page.tsx           # Create new poll
│   └── [id]/page.tsx          # Poll results
├── vote/
│   └── [id]/page.tsx          # Public voting page
├── api/
│   ├── polls/route.ts         # POST: create poll
│   ├── polls/[id]/route.ts    # GET: poll details
│   └── polls/[id]/vote/route.ts # POST: cast vote

Component Patterns (v0 Style)

    Use Server Components by default
    Client components only when needed (interactivity, browser APIs)
    Extract UI into reusable components early
    Use shadcn/ui primitives consistently
    Implement loading.tsx and error.tsx for each route segment

Key Implementation Details
Supabase Client Setup
TypeScript
Copy

// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )
}

Vote Deduplication

    Use visitor_id cookie to track anonymous voters
    Use auth.uid() for authenticated users
    Database unique constraint prevents duplicates

QR Code Generation
TypeScript
Copy

// Server component generates QR as SVG
import QRCode from 'qrcode'

const shareLink = `${process.env.NEXT_PUBLIC_URL}/vote/${pollId}`
const qrSvg = await QRCode.toString(shareLink, { type: 'svg' })

Form Validation (zod + react-hook-form)
TypeScript
Copy

const createPollSchema = z.object({
  question: z.string().min(5).max(200),
  options: z.array(z.string().min(1).max(100)).min(2).max(10)
})

v0 Development Patterns to Follow
1. Mobile-First Design

    Start with mobile layout, enhance for larger screens
    Use responsive prefixes: md:, lg:, xl:
    Touch-friendly tap targets (min 44px)

2. Color System (3-5 colors max)
css
Copy

/* Primary brand color + 2-3 neutrals + 1 accent */
@theme inline {
  --color-primary: #3b82f6;
  --color-primary-foreground: #ffffff;
  --color-secondary: #f3f4f6;
  --color-muted: #9ca3af;
  --color-background: #ffffff;
  --color-foreground: #111827;
}

3. Typography (max 2 fonts)
TypeScript
Copy

// layout.tsx
import { Inter, Space_Grotesk } from 'next/font/google'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-space-grotesk' })

// Apply in globals.css
@theme inline {
  --font-sans: var(--font-inter);
  --font-display: var(--font-space-grotesk);
}

4. Layout Method Priority

    Flexbox for most layouts (flex items-center justify-between gap-4)
    CSS Grid only for complex 2D layouts
    Never floats or absolute positioning unless necessary

5. Component Structure
TypeScript
Copy

// Extract early, compose often
// components/poll-card.tsx
interface PollCardProps {
  poll: Poll
  onDelete: (id: string) => void
}

export function PollCard({ poll, onDelete }: PollCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{poll.question}</CardTitle>
      </CardHeader>
      <CardContent>
        {/* content */}
      </CardContent>
    </Card>
  )
}

6. Error Handling

    Use error boundaries and error.tsx files
    Provide meaningful error messages
    Include retry mechanisms for failed requests

7. Loading States

    Use loading.tsx for route segments
    Implement skeleton screens for better UX
    Show loading indicators for user actions

Testing Strategy

    Unit tests for utility functions
    Integration tests for API routes
    E2E tests for critical user flows (create → share → vote → view results)

Deployment Checklist

    [ ] Environment variables set in Vercel
    [ ] Supabase migrations run
    [ ] Database policies configured
    [ ] Edge config for rate limiting
    [ ] Analytics and monitoring enabled

Common Copilot Prompts for This Project

    "Create a shadcn/ui form for creating a poll with dynamic option fields"
    "Generate a server action to handle poll creation with validation"
    "Create a QR code component that displays the share link"
    "Implement vote results visualization with progress bars"
    "Add rate limiting to the vote API route"
    "Create a loading skeleton for the polls list"

Git Workflow

    Feature branches for new functionality
    Descriptive commit messages
    Keep PRs focused and small
    Test on preview deployments before merging

Copy


</CodeProject>

``` This agents.md file captures v0's development philosophy while being specifically tailored for GitHub Copilot usage. It includes the database schema, route structure, component patterns, and v0's design principles (mobile-first, limited colors/typography, flexbox-first layouts). You can keep this file open in your editor and Copilot will reference it for consistent patterns throughout your polling app development.```