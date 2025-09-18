# Copilot Setup Steps: Modern Full-Stack Web App Template
# Next.js 14 + Supabase + shadcn/ui Foundation

## Project Overview
This setup creates a complete foundation for modern web applications with authentication, database integration, and beautiful UI components. Perfect for polling apps, task managers, content platforms, or any CRUD application.

## Prerequisites
- Node.js 18+ installed
- Git configured
- Supabase account (free tier available)
- Vercel account for deployment (optional)

## Step 1: Initialize Next.js Project

### 1.1 Create Project Structure
```bash
# Create new Next.js project with TypeScript and Tailwind
npx create-next-app@latest my-app --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*"
cd my-app

# Initialize git repository
git init
git add .
git commit -m "Initial Next.js setup"
```

### 1.2 Install Additional Dependencies
```bash
# Core dependencies
npm install @supabase/supabase-js @supabase/ssr

# Form handling and validation
npm install react-hook-form @hookform/resolvers zod

# UI components (we'll configure shadcn/ui next)
npm install class-variance-authority clsx tailwind-merge
npm install lucide-react @radix-ui/react-slot

# Development dependencies
npm install -D @types/node
```

## Step 2: Configure shadcn/ui

### 2.1 Initialize shadcn/ui
```bash
# Initialize shadcn/ui configuration
npx shadcn-ui@latest init

# Select these options:
# - TypeScript: Yes
# - Style: Default
# - Base color: Slate
# - Global CSS file: app/globals.css
# - CSS variables: Yes
# - Tailwind config: tailwind.config.js
# - Import alias: @/components, @/lib
```

### 2.2 Install Essential UI Components
```bash
# Install core components needed for most apps
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add input
npx shadcn-ui@latest add label
npx shadcn-ui@latest add form
```

### 2.3 Create Components Configuration
```bash
# Verify components.json was created correctly
cat components.json
```

## Step 3: Set Up Project Structure

### 3.1 Create Core Directories
```bash
# Create essential directories
mkdir -p lib/supabase
mkdir -p types
mkdir -p app/auth/login
mkdir -p app/auth/register
mkdir -p app/dashboard
mkdir -p app/api
```

### 3.2 Create Type Definitions
```bash
# Create types/index.ts
cat > types/index.ts << 'EOF'
export interface User {
  id: string
  email: string
  created_at: string
}

export interface Resource {
  id: string
  user_id: string
  title: string
  content?: string
  created_at: string
  updated_at: string
}

export interface ResourceItem {
  id: string
  resource_id: string
  content: string
  position: number
  created_at: string
}

// Database types (update based on your schema)
export type Database = {
  public: {
    Tables: {
      resources: {
        Row: Resource
        Insert: Omit<Resource, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Resource, 'id' | 'user_id' | 'created_at'>>
      }
      resource_items: {
        Row: ResourceItem
        Insert: Omit<ResourceItem, 'id' | 'created_at'>
        Update: Partial<Omit<ResourceItem, 'id' | 'resource_id' | 'created_at'>>
      }
    }
  }
}
EOF
```

### 3.3 Create Utility Functions
```bash
# Create lib/utils.ts (if not already created by shadcn/ui)
cat > lib/utils.ts << 'EOF'
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
EOF
```

## Step 4: Configure Supabase

### 4.1 Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Create new organization (if needed)
4. Create new project with:
   - Name: your-app-name
   - Database password: generate strong password
   - Region: closest to your users
5. Wait for project to be created

### 4.2 Create Supabase Client Files
```bash
# Create server-side Supabase client
cat > lib/supabase/server.ts << 'EOF'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/types'

export function createClient() {
  const cookieStore = cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // Server component
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // Server component
          }
        },
      },
    }
  )
}
EOF

# Create client-side Supabase client
cat > lib/supabase/client.ts << 'EOF'
import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
EOF
```

### 4.3 Set Up Environment Variables
```bash
# Create .env.local file
cat > .env.local << 'EOF'
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_URL=http://localhost:3000
EOF

# Add to .gitignore
echo ".env.local" >> .gitignore
```

## Step 5: Create Database Schema

### 5.1 Create SQL Migration File
```bash
# Create setup-database.sql
cat > setup-database.sql << 'EOF'
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create resources table (main user-owned content)
create table public.resources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  content text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Create resource_items table (related data)
create table public.resource_items (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid references public.resources(id) on delete cascade not null,
  content text not null,
  position integer not null,
  created_at timestamptz default now() not null
);

-- Create interactions table (user activity tracking)
create table public.interactions (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid references public.resources(id) on delete cascade not null,
  user_identifier text not null,
  interaction_type text not null,
  created_at timestamptz default now() not null,
  unique(resource_id, user_identifier)
);

-- Enable Row Level Security
alter table public.resources enable row level security;
alter table public.resource_items enable row level security;
alter table public.interactions enable row level security;

-- Create policies for resources
create policy "Users can manage own resources"
  on public.resources
  for all
  using (auth.uid() = user_id);

create policy "Anyone can view resources"
  on public.resources
  for select
  using (true);

-- Create policies for resource_items
create policy "Anyone can view resource items"
  on public.resource_items
  for select
  using (true);

create policy "Users can manage items for own resources"
  on public.resource_items
  for all
  using (
    exists (
      select 1 from public.resources
      where id = resource_items.resource_id
      and user_id = auth.uid()
    )
  );

-- Create policies for interactions
create policy "Anyone can create interactions"
  on public.interactions
  for insert
  with check (true);

create policy "Anyone can view interactions"
  on public.interactions
  for select
  using (true);

-- Create indexes for performance
create index idx_resources_user_id on public.resources(user_id);
create index idx_resources_created_at on public.resources(created_at desc);
create index idx_resource_items_resource_id on public.resource_items(resource_id);
create index idx_resource_items_position on public.resource_items(resource_id, position);
create index idx_interactions_resource_id on public.interactions(resource_id);

-- Create updated_at trigger function
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create trigger for resources updated_at
create trigger handle_resources_updated_at
  before update on public.resources
  for each row
  execute function public.handle_updated_at();
EOF
```

### 5.2 Apply Database Schema
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `setup-database.sql`
4. Click "Run" to execute the schema

## Step 6: Create Core App Pages

### 6.1 Update Root Layout
```bash
# Update app/layout.tsx
cat > app/layout.tsx << 'EOF'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'My App',
  description: 'A modern web application built with Next.js and Supabase',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <main className="min-h-screen bg-background">
          {children}
        </main>
      </body>
    </html>
  )
}
EOF
```

### 6.2 Create Landing Page
```bash
# Update app/page.tsx
cat > app/page.tsx << 'EOF'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-16">
      {/* Hero Section */}
      <div className="text-center space-y-6 mb-16">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
          Build Something Amazing
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          A modern web application template with authentication, database integration, and beautiful UI components.
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-3 gap-8 mb-16">
        <Card>
          <CardHeader>
            <CardTitle>🔐 Authentication</CardTitle>
            <CardDescription>
              Secure user authentication with Supabase Auth
            </CardDescription>
          </CardHeader>
          <CardContent>
            Built-in login, registration, and session management
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>🗄️ Database</CardTitle>
            <CardDescription>
              PostgreSQL database with Row Level Security
            </CardDescription>
          </CardHeader>
          <CardContent>
            Real-time data synchronization and secure access controls
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>🎨 Beautiful UI</CardTitle>
            <CardDescription>
              Modern design with shadcn/ui components
            </CardDescription>
          </CardHeader>
          <CardContent>
            Responsive design with accessible components and dark mode support
          </CardContent>
        </Card>
      </div>

      {/* CTA Section */}
      <div className="text-center space-y-6">
        <h2 className="text-3xl font-bold">Ready to get started?</h2>
        <div className="flex gap-4 justify-center">
          <Button asChild size="lg">
            <Link href="/auth/register">Get Started</Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="/auth/login">Sign In</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
EOF
```

### 6.3 Create Authentication Pages
```bash
# Create login page
cat > app/auth/login/page.tsx << 'EOF'
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      router.push('/dashboard')
      router.refresh()
    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container flex items-center justify-center min-h-screen py-16">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign In</CardTitle>
          <CardDescription>
            Enter your email and password to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
          
          <div className="mt-4 text-center text-sm">
            Don't have an account?{' '}
            <Link href="/auth/register" className="text-primary hover:underline">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
EOF

# Create register page
cat > app/auth/register/page.tsx << 'EOF'
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setIsLoading(false)
      return
    }

    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()

      const { error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) throw error

      setSuccess(true)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="container flex items-center justify-center min-h-screen py-16">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Check your email</CardTitle>
            <CardDescription>
              We've sent you a confirmation link to complete your registration.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/auth/login">Back to Sign In</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container flex items-center justify-center min-h-screen py-16">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create Account</CardTitle>
          <CardDescription>
            Enter your information to create a new account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>
          
          <div className="mt-4 text-center text-sm">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
EOF
```

### 6.4 Create Dashboard Pages
```bash
# Create dashboard directory and main page
mkdir -p app/dashboard/new

cat > app/dashboard/page.tsx << 'EOF'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default async function DashboardPage() {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }

  const { data: resources } = await supabase
    .from('resources')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user.email}</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/new">Create New</Link>
        </Button>
      </div>

      {resources?.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No resources yet</CardTitle>
            <CardDescription>
              Get started by creating your first resource.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/dashboard/new">Create Your First Resource</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {resources?.map((resource) => (
            <Card key={resource.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="line-clamp-2">{resource.title}</CardTitle>
                <CardDescription>
                  Created {new Date(resource.created_at).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {resource.content && (
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                    {resource.content}
                  </p>
                )}
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/dashboard/${resource.id}`}>View Details</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
EOF

# Create new resource page
cat > app/dashboard/new/page.tsx << 'EOF'
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function NewResourcePage() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()

      const { data, error } = await supabase
        .from('resources')
        .insert([
          {
            title,
            content: content || null,
          },
        ])
        .select()
        .single()

      if (error) throw error

      router.push(`/dashboard/${data.id}`)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Link href="/dashboard" className="text-sm text-muted-foreground hover:underline">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold mt-2">Create New Resource</h1>
          <p className="text-muted-foreground">
            Fill out the form below to create a new resource.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Resource Details</CardTitle>
            <CardDescription>
              Enter the basic information for your new resource.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter resource title"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Enter resource content (optional)"
                  className="min-h-32 w-full px-3 py-2 border border-input bg-background rounded-md"
                />
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Creating...' : 'Create Resource'}
                </Button>
                <Button type="button" variant="outline" asChild>
                  <Link href="/dashboard">Cancel</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
EOF
```

## Step 7: Final Configuration

### 7.1 Update Package.json Scripts
```bash
# Add any additional scripts if needed
npm run build
```

### 7.2 Test the Application
```bash
# Start development server
npm run dev

# Open browser to http://localhost:3000
```

### 7.3 Update Environment Variables
1. Go to your Supabase project settings
2. Copy the Project URL and anon public key
3. Update `.env.local` with your actual values:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

## Step 8: Git and Deployment

### 8.1 Commit Initial Setup
```bash
# Add all files
git add .
git commit -m "Complete initial app setup with authentication and dashboard"

# Create repository on GitHub and push
git remote add origin https://github.com/yourusername/your-app.git
git branch -M main
git push -u origin main
```

### 8.2 Deploy to Vercel
1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy the application

## Next Steps: Customization

### Adapt for Your Use Case
1. **Update Database Schema**: Modify `setup-database.sql` for your specific data model
2. **Customize Types**: Update `types/index.ts` with your data structures
3. **Add Features**: Create additional pages and components as needed
4. **Styling**: Customize the color scheme and typography in `globals.css`

### Common Extensions
- Add file upload with Supabase Storage
- Implement real-time features with Supabase subscriptions
- Add email notifications
- Include search functionality
- Add analytics and monitoring

## Troubleshooting

### Common Issues
1. **Supabase connection errors**: Check environment variables
2. **Authentication not working**: Verify RLS policies
3. **Build errors**: Ensure all dependencies are installed
4. **Type errors**: Check TypeScript configuration

### Useful Commands
```bash
# Reset node_modules
rm -rf node_modules package-lock.json
npm install

# Check for type errors
npm run build

# View Supabase logs
npx supabase logs --project-ref your-project-ref
```

---

This setup provides a complete foundation for modern web applications. Customize the resource patterns to match your specific use case!