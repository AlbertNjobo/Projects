# GitHub Copilot Context: Modern Web App with Authentication & Database
# Project Template: Full-Stack App with Next.js, Supabase & shadcn/ui

## Project Overview
Build a modern full-stack web application with user authentication, database integration, and beautiful UI components. This template provides a complete foundation for apps like polling systems, task managers, content platforms, or any CRUD application.

## Core Architecture Stack
- **Framework**: Next.js 14+ App Router (Server Components by default)
- **Database**: Supabase (PostgreSQL with Row Level Security)
- **Authentication**: Supabase Auth (email/password)
- **Styling**: Tailwind CSS + shadcn/ui components
- **Forms**: React Hook Form + Zod validation
- **Deployment**: Vercel (edge functions, serverless)
- **Type Safety**: TypeScript throughout

## Database Design Patterns (Supabase)
```sql
-- Standard user-owned resource pattern
create table resources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  content text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Related data pattern
create table resource_items (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid references resources(id) on delete cascade,
  content text not null,
  position int not null,
  created_at timestamptz default now()
);

-- Activity/interaction tracking pattern
create table interactions (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid references resources(id) on delete cascade,
  user_identifier text not null, -- user_id or session_id
  interaction_type text not null,
  created_at timestamptz default now(),
  unique(resource_id, user_identifier) -- prevent duplicates where needed
);

-- Row Level Security (RLS) patterns
alter table resources enable row level security;
alter table resource_items enable row level security;
alter table interactions enable row level security;

-- Policy patterns
create policy "owners_manage_resources" on resources 
  using (auth.uid() = user_id);
create policy "public_read_resources" on resources 
  for select using (true);
create policy "public_read_items" on resource_items 
  for select using (true);
create policy "public_interactions" on interactions 
  for insert with check (true);
```

## App Router Structure (Next.js 14)
```
app/
├── page.tsx                    # Landing page with features showcase
├── layout.tsx                  # Root layout with fonts and metadata
├── globals.css                 # Global styles with shadcn/ui variables
├── auth/                       # Authentication pages
│   ├── login/page.tsx         # Login form with validation
│   └── register/page.tsx      # Registration form with confirmation
├── dashboard/                  # Protected user dashboard
│   ├── page.tsx              # List user's resources
│   ├── new/page.tsx          # Create new resource
│   └── [id]/page.tsx         # Resource details/edit
├── public/                    # Public access pages
│   └── [id]/page.tsx         # Public resource view
├── api/                       # API routes
│   ├── resources/route.ts    # POST: create resource
│   ├── resources/[id]/route.ts # GET/PUT/DELETE: resource CRUD
│   └── resources/[id]/action/route.ts # POST: specific actions
```

## Component Architecture (shadcn/ui)

### Essential UI Components Setup
1. **Button** - Primary actions, variants (default, outline, ghost)
2. **Card** - Content containers with header, content, footer
3. **Input** - Form inputs with validation states
4. **Label** - Accessible form labels
5. **Form** - React Hook Form integration with validation

### Component Patterns
```typescript
// Server Component by default
export default async function ResourcePage() {
  const supabase = createClient()
  const { data } = await supabase.from('resources').select()
  return <ResourceList resources={data} />
}

// Client Component when needed
'use client'
export function ResourceForm() {
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { title: '', content: '' }
  })
  // Form logic...
}

// Reusable UI components
interface ResourceCardProps {
  resource: Resource
  onAction: (id: string) => void
}
export function ResourceCard({ resource, onAction }: ResourceCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle>{resource.title}</CardTitle>
      </CardHeader>
      <CardContent>{resource.content}</CardContent>
    </Card>
  )
}
```

## Supabase Integration Patterns

### Client Configuration
```typescript
// lib/supabase/client.ts - Browser-side client
import { createBrowserClient } from '@supabase/ssr'
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// lib/supabase/server.ts - Server-side client
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
export function createClient() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
        set: (name: string, value: string, options: Record<string, unknown>) => {
          cookieStore.set({ name, value, ...options })
        },
        remove: (name: string, options: Record<string, unknown>) => {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )
}
```

### Authentication Patterns
```typescript
// Protected page pattern
export default async function ProtectedPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }
  
  // Protected content...
}

// Client-side auth form pattern
async function handleAuth(data: FormData) {
  const { createClient } = await import('@/lib/supabase/client')
  const supabase = createClient()
  
  const { error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  })
  
  if (error) throw error
  router.push('/dashboard')
}
```

## Form Validation Patterns (Zod + React Hook Form)
```typescript
// Schema definition
const resourceSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  content: z.string().min(10, 'Content must be at least 10 characters'),
  items: z.array(z.object({
    text: z.string().min(1, 'Item cannot be empty')
  })).min(2, 'At least 2 items required').max(10, 'Maximum 10 items')
})

// Form implementation
const form = useForm<FormData>({
  resolver: zodResolver(resourceSchema),
  defaultValues: {
    title: '',
    content: '',
    items: [{ text: '' }, { text: '' }]
  }
})

// Dynamic field arrays
const { fields, append, remove } = useFieldArray({
  control: form.control,
  name: "items"
})
```

## Styling System (Tailwind + shadcn/ui)

### Color System (CSS Variables)
```css
/* globals.css - shadcn/ui CSS variables */
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 221.2 83.2% 53.3%;
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96%;
  --secondary-foreground: 222.2 84% 4.9%;
  --muted: 210 40% 96%;
  --muted-foreground: 215.4 16.3% 46.9%;
  --accent: 210 40% 96%;
  --accent-foreground: 222.2 84% 4.9%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 210 40% 98%;
  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;
  --ring: 221.2 83.2% 53.3%;
  --radius: 0.5rem;
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

### Design Principles
1. **Mobile-First**: Start with mobile, enhance for larger screens
2. **Limited Palette**: 3-5 main colors maximum
3. **Consistent Spacing**: Use Tailwind's spacing scale
4. **Typography Scale**: Maximum 2 font families
5. **Component Consistency**: Reuse shadcn/ui patterns

## Environment Configuration
```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_URL=http://localhost:3000
```

## Development Workflow

### Build Steps
1. **Project Setup**: Next.js + TypeScript + Tailwind
2. **shadcn/ui Installation**: Components + CSS variables
3. **Supabase Setup**: Database + Auth + RLS policies
4. **Authentication Pages**: Login/register with validation
5. **Protected Routes**: Dashboard with CRUD operations
6. **Public Pages**: Shareable content views

### Key Development Patterns
- **Server Components First**: Use 'use client' only when needed
- **Progressive Enhancement**: Start with basic functionality
- **Type Safety**: TypeScript interfaces for all data
- **Error Boundaries**: Graceful error handling
- **Loading States**: Skeleton screens and loading indicators

## Testing Strategy
- **Unit Tests**: Utility functions and components
- **Integration Tests**: API routes and database operations
- **E2E Tests**: Critical user flows (auth → create → share → view)

## Deployment Checklist
- [ ] Environment variables configured in Vercel
- [ ] Database migrations applied in Supabase
- [ ] RLS policies tested and working
- [ ] Authentication flow tested
- [ ] Error pages (404, 500) implemented
- [ ] SEO metadata configured

## Common Copilot Prompts for This Template
- "Create a shadcn/ui form for [resource] with dynamic field arrays"
- "Generate a server action to handle [resource] creation with validation"
- "Create a protected dashboard page that lists user's [resources]"
- "Implement a public sharing page for [resource] with SEO metadata"
- "Add real-time updates using Supabase subscriptions"
- "Create loading skeletons for the [resource] list page"

## Extension Ideas
- **Real-time Updates**: Supabase subscriptions for live data
- **File Uploads**: Supabase Storage integration
- **Email Notifications**: Resend or SendGrid integration
- **Analytics**: Vercel Analytics or Plausible
- **Search**: Full-text search with PostgreSQL
- **Caching**: React Query or SWR for client-side caching

---

This template provides a solid foundation for building modern full-stack applications with authentication, database integration, and beautiful UI. Adapt the resource patterns to your specific use case (polls, tasks, posts, etc.).