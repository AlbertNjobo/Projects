# Polling App with QR Code Sharing

A modern polling application built with Next.js 14, Supabase, and automatic QR code generation for easy poll sharing.

## Features

- 🗳️ Create engaging polls with multiple choice options
- 📱 Automatic QR code generation for instant poll access
- 📊 Real-time poll results with beautiful visualizations
- 🔐 User authentication with Supabase Auth
- 🎨 Modern, responsive design with Tailwind CSS
- ⚡ Built with Next.js 14 App Router for optimal performance

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: Supabase (PostgreSQL with Row Level Security)
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS + Custom Design System
- **QR Codes**: qrcode.react (client) + qrcode (server)
- **Deployment**: Vercel (recommended)

## Quick Start

1. **Clone and Install Dependencies**
   ```bash
   git clone <repository-url>
   cd polling-app
   npm install
   ```

2. **Environment Setup**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your Supabase credentials
   ```

3. **Database Setup**
   - Create a new Supabase project
   - Run the migration file in `supabase/migrations/20250917000001_initial_schema.sql`
   - Or use Supabase CLI: `supabase db reset`

4. **Start Development Server**
   ```bash
   npm run dev
   ```

Visit `http://localhost:3000` to see your application!

## Project Structure

```
app/
├── page.tsx                    # Landing page
├── layout.tsx                  # Root layout with fonts and metadata
├── globals.css                 # Global styles and CSS variables
├── auth/                       # Authentication pages
│   ├── login/page.tsx
│   └── register/page.tsx
├── polls/                      # Creator dashboard
│   ├── page.tsx               # List user's polls
│   ├── new/page.tsx           # Create new poll
│   └── [id]/page.tsx          # Poll results
├── vote/
│   └── [id]/page.tsx          # Public voting page
└── api/
    ├── polls/route.ts         # POST: create poll
    ├── polls/[id]/route.ts    # GET: poll details
    └── polls/[id]/vote/route.ts # POST: cast vote

lib/
├── supabase/
│   ├── server.ts              # Server-side Supabase client
│   └── client.ts              # Client-side Supabase client

types/
└── index.ts                   # TypeScript type definitions

components/                    # Reusable UI components (to be added)
```

## Database Schema

The application uses a simple but effective schema:

- **polls**: Store poll questions and metadata
- **options**: Store poll answer choices
- **votes**: Track votes with duplicate prevention

Row Level Security (RLS) is enabled to ensure users can only manage their own polls while allowing public voting.

## Development Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript compiler
- `npm run format` - Format code with Prettier

## Next Steps

1. Set up your Supabase project and configure environment variables
2. Create authentication pages with proper form validation
3. Build the poll creation interface with dynamic option fields
4. Implement QR code generation and sharing features
5. Add real-time poll results with progress bars
6. Deploy to Vercel with environment variables

## Contributing

This project follows v0's development patterns:
- Mobile-first responsive design
- Limited color palette (3-5 colors)
- Flexbox-first layouts
- Server Components by default
- TypeScript for type safety

---

Built with ❤️ using Next.js, Supabase, and modern web technologies.