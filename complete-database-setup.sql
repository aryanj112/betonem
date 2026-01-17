-- BetOnEm Complete Database Setup
-- Run this ONCE when setting up a new Supabase project
-- This creates all tables, functions, indexes, and RLS policies

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- CREATE TABLES
-- ============================================================================

-- Users table (custom profile data)
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone_number text UNIQUE NOT NULL,
  username text UNIQUE NOT NULL,
  display_name text NOT NULL,
  venmo_username text,
  avatar_url text,
  created_at timestamptz DEFAULT NOW(),
  
  CONSTRAINT username_format CHECK (username ~ '^[a-z0-9_]{3,20}$'),
  CONSTRAINT display_name_length CHECK (char_length(display_name) BETWEEN 1 AND 50),
  CONSTRAINT venmo_format CHECK (venmo_username IS NULL OR venmo_username ~ '^@[a-zA-Z0-9_-]+$')
);

-- Groups table
CREATE TABLE IF NOT EXISTS public.groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  invite_code text UNIQUE NOT NULL,
  created_by uuid REFERENCES public.users(id) NOT NULL,
  created_at timestamptz DEFAULT NOW(),
  
  CONSTRAINT name_length CHECK (char_length(name) BETWEEN 1 AND 50),
  CONSTRAINT invite_code_format CHECK (invite_code ~ '^[A-Z0-9]{6}$')
);

-- Group members table
CREATE TABLE IF NOT EXISTS public.group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES public.groups(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  balance integer DEFAULT 1000 NOT NULL CHECK (balance >= 0),
  joined_at timestamptz DEFAULT NOW(),
  
  UNIQUE(group_id, user_id)
);

-- Markets (bets) table
CREATE TABLE IF NOT EXISTS public.markets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES public.groups(id) ON DELETE CASCADE NOT NULL,
  created_by uuid REFERENCES public.users(id) NOT NULL,
  
  title text NOT NULL,
  description text,
  
  lock_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  
  status text DEFAULT 'open' CHECK (status IN ('open', 'locked', 'resolved', 'cancelled')),
  outcome boolean, -- true = YES won, false = NO won, null = unresolved
  
  yes_pool integer DEFAULT 0 NOT NULL CHECK (yes_pool >= 0),
  no_pool integer DEFAULT 0 NOT NULL CHECK (no_pool >= 0),
  
  created_at timestamptz DEFAULT NOW(),
  resolved_at timestamptz,
  
  CONSTRAINT title_length CHECK (char_length(title) BETWEEN 1 AND 200),
  CONSTRAINT valid_times CHECK (end_time > lock_time),
  CONSTRAINT resolved_outcome CHECK (status != 'resolved' OR outcome IS NOT NULL)
);

-- Bets table
CREATE TABLE IF NOT EXISTS public.bets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id uuid REFERENCES public.markets(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  
  position boolean NOT NULL, -- true = YES, false = NO
  amount integer NOT NULL CHECK (amount > 0),
  
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW(),
  
  UNIQUE(market_id, user_id)
);

-- Comments table
CREATE TABLE IF NOT EXISTS public.comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id uuid REFERENCES public.markets(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.users(id) NOT NULL,
  
  content text,
  media_url text,
  media_type text CHECK (media_type IN ('image', 'video')),
  
  created_at timestamptz DEFAULT NOW(),
  
  CONSTRAINT comment_has_content CHECK (content IS NOT NULL OR media_url IS NOT NULL)
);

-- Evidence table
CREATE TABLE IF NOT EXISTS public.evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id uuid REFERENCES public.markets(id) ON DELETE CASCADE NOT NULL,
  submitted_by uuid REFERENCES public.users(id) NOT NULL,
  
  media_url text NOT NULL,
  media_type text NOT NULL CHECK (media_type IN ('image', 'video')),
  caption text,
  supports_outcome boolean NOT NULL, -- true = YES, false = NO
  
  created_at timestamptz DEFAULT NOW()
);

-- Evidence votes table
CREATE TABLE IF NOT EXISTS public.evidence_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evidence_id uuid REFERENCES public.evidence(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.users(id) NOT NULL,
  is_valid boolean NOT NULL,
  
  created_at timestamptz DEFAULT NOW(),
  UNIQUE(evidence_id, user_id)
);

-- Cancel votes table
CREATE TABLE IF NOT EXISTS public.cancel_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id uuid REFERENCES public.markets(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.users(id) NOT NULL,
  
  created_at timestamptz DEFAULT NOW(),
  UNIQUE(market_id, user_id)
);

-- ============================================================================
-- CREATE INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_users_phone ON public.users(phone_number);
CREATE INDEX IF NOT EXISTS idx_groups_invite_code ON public.groups(invite_code);
CREATE INDEX IF NOT EXISTS idx_group_members_user ON public.group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_group ON public.group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_markets_group ON public.markets(group_id);
CREATE INDEX IF NOT EXISTS idx_markets_status ON public.markets(status);
CREATE INDEX IF NOT EXISTS idx_markets_lock_time ON public.markets(lock_time);
CREATE INDEX IF NOT EXISTS idx_bets_market ON public.bets(market_id);
CREATE INDEX IF NOT EXISTS idx_bets_user ON public.bets(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_market ON public.comments(market_id);
CREATE INDEX IF NOT EXISTS idx_evidence_market ON public.evidence(market_id);

-- ============================================================================
-- CREATE FUNCTIONS
-- ============================================================================

-- Function to generate unique invite code
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  chars text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result text := '';
  i int;
  code_exists boolean;
BEGIN
  LOOP
    result := '';
    FOR i IN 1..6 LOOP
      result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;
    
    SELECT EXISTS(SELECT 1 FROM public.groups WHERE invite_code = result) INTO code_exists;
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION generate_invite_code() TO authenticated;
GRANT EXECUTE ON FUNCTION generate_invite_code() TO anon;

-- Helper function to check if user is in a group (avoids RLS recursion)
CREATE OR REPLACE FUNCTION is_group_member(p_group_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM group_members 
    WHERE group_id = p_group_id 
      AND user_id = p_user_id
  );
$$;

GRANT EXECUTE ON FUNCTION is_group_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION is_group_member(uuid, uuid) TO anon;

-- Function to auto-lock markets
CREATE OR REPLACE FUNCTION auto_lock_markets()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.markets
  SET status = 'locked'
  WHERE status = 'open' 
    AND lock_time <= NOW();
END;
$$;

-- ============================================================================
-- ENABLE RLS
-- ============================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.markets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cancel_votes ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- CREATE RLS POLICIES (Simple and permissive for hackathon)
-- ============================================================================

-- USERS POLICIES
CREATE POLICY "Anyone can view profiles"
  ON public.users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own profile"
  ON public.users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- GROUPS POLICIES
CREATE POLICY "Authenticated users can view groups"
  ON public.groups FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create groups"
  ON public.groups FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Creators can update groups"
  ON public.groups FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Creators can delete groups"
  ON public.groups FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- GROUP_MEMBERS POLICIES
CREATE POLICY "Authenticated users can view members"
  ON public.group_members FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can join groups"
  ON public.group_members FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own membership"
  ON public.group_members FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can leave groups"
  ON public.group_members FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- MARKETS POLICIES
CREATE POLICY "Authenticated users can view markets"
  ON public.markets FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Group members can create markets"
  ON public.markets FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = created_by 
    AND is_group_member(group_id, auth.uid())
  );

CREATE POLICY "Creators can update markets"
  ON public.markets FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Creators can delete markets"
  ON public.markets FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- BETS POLICIES
CREATE POLICY "Authenticated users can view bets"
  ON public.bets FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can place bets"
  ON public.bets FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bets"
  ON public.bets FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own bets"
  ON public.bets FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- COMMENTS POLICIES
CREATE POLICY "Authenticated users can view comments"
  ON public.comments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create comments"
  ON public.comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments"
  ON public.comments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
  ON public.comments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- EVIDENCE POLICIES
CREATE POLICY "Authenticated users can view evidence"
  ON public.evidence FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can submit evidence"
  ON public.evidence FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = submitted_by);

CREATE POLICY "Users can update own evidence"
  ON public.evidence FOR UPDATE
  TO authenticated
  USING (auth.uid() = submitted_by);

CREATE POLICY "Users can delete own evidence"
  ON public.evidence FOR DELETE
  TO authenticated
  USING (auth.uid() = submitted_by);

-- EVIDENCE_VOTES POLICIES
CREATE POLICY "Authenticated users can view votes"
  ON public.evidence_votes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can vote on evidence"
  ON public.evidence_votes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own votes"
  ON public.evidence_votes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own votes"
  ON public.evidence_votes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- CANCEL_VOTES POLICIES
CREATE POLICY "Authenticated users can view cancel votes"
  ON public.cancel_votes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can vote to cancel"
  ON public.cancel_votes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own cancel vote"
  ON public.cancel_votes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- DONE!
-- ============================================================================

SELECT '✅ Database setup complete! All tables, functions, and RLS policies created.' as result;

