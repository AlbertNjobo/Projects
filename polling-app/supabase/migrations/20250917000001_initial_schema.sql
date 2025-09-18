-- Create polls table
create table polls (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  question text not null,
  created_at timestamptz default now()
);

-- Create options table  
create table options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid references polls(id) on delete cascade,
  text text not null,
  position int not null
);

-- Create votes table (prevents duplicates)
create table votes (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid references polls(id) on delete cascade,
  option_id uuid references options(id) on delete cascade,
  visitor_id text not null, -- cookie or user_id
  created_at timestamptz default now(),
  unique(poll_id, visitor_id)
);

-- Enable Row Level Security
alter table polls enable row level security;
alter table options enable row level security;
alter table votes enable row level security;

-- Policies: creators can manage their polls, anyone can read/vote
create policy "owners manage polls" on polls 
  for all using (auth.uid() = user_id);

create policy "anyone read polls" on polls 
  for select using (true);

create policy "owners manage options" on options 
  for all using (
    exists (
      select 1 from polls 
      where polls.id = options.poll_id 
      and polls.user_id = auth.uid()
    )
  );

create policy "anyone read options" on options 
  for select using (true);

create policy "anyone vote once" on votes 
  for insert with check (true);

create policy "anyone read votes" on votes 
  for select using (true);

-- Create indexes for better performance
create index polls_user_id_idx on polls(user_id);
create index polls_created_at_idx on polls(created_at desc);
create index options_poll_id_idx on options(poll_id);
create index votes_poll_id_idx on votes(poll_id);
create index votes_option_id_idx on votes(option_id);
create index votes_visitor_id_idx on votes(visitor_id);