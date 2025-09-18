-- Create the database schema for the polling app
-- Run this SQL in your Supabase SQL Editor

-- Enable Row Level Security on auth.users (if not already enabled)
-- ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Create polls table
CREATE TABLE IF NOT EXISTS polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create options table  
CREATE TABLE IF NOT EXISTS options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID REFERENCES polls(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  position INT NOT NULL
);

-- Create votes table (prevents duplicates)
CREATE TABLE IF NOT EXISTS votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID REFERENCES polls(id) ON DELETE CASCADE,
  option_id UUID REFERENCES options(id) ON DELETE CASCADE,
  visitor_id TEXT NOT NULL, -- cookie or user_id
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(poll_id, visitor_id)
);

-- Enable Row Level Security
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE options ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Policies: creators can manage their polls, anyone can read/vote
CREATE POLICY "owners_manage_polls" ON polls 
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "anyone_read_polls" ON polls 
  FOR SELECT USING (true);

CREATE POLICY "anyone_read_options" ON options 
  FOR SELECT USING (true);

CREATE POLICY "anyone_vote_once" ON votes 
  FOR INSERT WITH CHECK (true);

CREATE POLICY "anyone_read_votes" ON votes 
  FOR SELECT USING (true);