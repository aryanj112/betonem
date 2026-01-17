-- ============================================================================
-- BetOnEm Database Migrations
-- Run this AFTER the initial complete-database-setup.sql
-- This applies all necessary updates to support the current app features
-- ============================================================================

-- ============================================================================
-- STEP 1: Update Balance System (Allow Negative Balances)
-- ============================================================================

-- Drop the old balance constraint that required >= 0
ALTER TABLE public.group_members 
  DROP CONSTRAINT IF EXISTS group_members_balance_check;

-- Update default balance to 0 instead of 1000
ALTER TABLE public.group_members 
  ALTER COLUMN balance SET DEFAULT 0;

-- Now balances can go negative (debt-based betting)
SELECT '✅ Step 1 Complete: Balance system updated (debt allowed)' as status;

-- ============================================================================
-- STEP 2: Simplify Betting System (Remove Time Restrictions)
-- ============================================================================

-- Make lock_time and end_time nullable and not used
ALTER TABLE public.markets 
  ALTER COLUMN lock_time DROP NOT NULL,
  ALTER COLUMN end_time DROP NOT NULL;

-- Remove time-based constraints
ALTER TABLE public.markets 
  DROP CONSTRAINT IF EXISTS valid_times;

-- Update status check to only allow open, resolved, cancelled (no "locked")
ALTER TABLE public.markets 
  DROP CONSTRAINT IF EXISTS markets_status_check;

ALTER TABLE public.markets 
  ADD CONSTRAINT markets_status_check 
  CHECK (status IN ('open', 'resolved', 'cancelled'));

-- Remove resolved_outcome constraint since we handle it differently now
ALTER TABLE public.markets 
  DROP CONSTRAINT IF EXISTS resolved_outcome;

-- Add a resolution note column (optional)
ALTER TABLE public.markets 
  ADD COLUMN IF NOT EXISTS resolution_note text;

-- Update existing markets to have nullable times
UPDATE public.markets 
SET lock_time = NULL, end_time = NULL 
WHERE status = 'open';

SELECT '✅ Step 2 Complete: Betting system simplified (no time restrictions)' as status;

-- ============================================================================
-- STEP 3: Fix Market Pools (Auto-calculate from Bets)
-- ============================================================================

-- Function to recalculate market pools
CREATE OR REPLACE FUNCTION recalculate_market_pools()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.markets m
  SET 
    yes_pool = COALESCE((
      SELECT SUM(amount)
      FROM public.bets
      WHERE market_id = m.id AND position = true
    ), 0),
    no_pool = COALESCE((
      SELECT SUM(amount)
      FROM public.bets
      WHERE market_id = m.id AND position = false
    ), 0);
END;
$$;

-- Run the recalculation to fix any existing data
SELECT recalculate_market_pools();

-- Create a trigger function to automatically update pools when bets change
CREATE OR REPLACE FUNCTION update_market_pools_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_market_id uuid;
BEGIN
  -- Determine which market to update
  IF TG_OP = 'DELETE' THEN
    v_market_id := OLD.market_id;
  ELSE
    v_market_id := NEW.market_id;
  END IF;

  -- Recalculate pools for this market
  UPDATE public.markets
  SET 
    yes_pool = COALESCE((
      SELECT SUM(amount)
      FROM public.bets
      WHERE market_id = v_market_id AND position = true
    ), 0),
    no_pool = COALESCE((
      SELECT SUM(amount)
      FROM public.bets
      WHERE market_id = v_market_id AND position = false
    ), 0)
  WHERE id = v_market_id;

  RETURN NULL;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_update_market_pools ON public.bets;

-- Create trigger on bets table
CREATE TRIGGER trigger_update_market_pools
AFTER INSERT OR UPDATE OR DELETE ON public.bets
FOR EACH ROW
EXECUTE FUNCTION update_market_pools_trigger();

SELECT '✅ Step 3 Complete: Market pools now auto-calculate via trigger' as status;

-- ============================================================================
-- STEP 4: Enable Multiple Bets Per User (Hedging Support)
-- ============================================================================

-- Drop the unique constraint that prevented multiple bets per user per market
ALTER TABLE public.bets 
  DROP CONSTRAINT IF EXISTS bets_market_id_user_id_key;

-- Remove UPDATE and DELETE policies (bets are now immutable)
DROP POLICY IF EXISTS "Users can update own bets" ON public.bets;
DROP POLICY IF EXISTS "Users can delete own bets" ON public.bets;

-- Keep only INSERT and SELECT policies (already exist from setup)

SELECT '✅ Step 4 Complete: Multiple bets per market enabled (hedging allowed)' as status;

-- ============================================================================
-- VERIFICATION: Show Updated Schema Status
-- ============================================================================

SELECT 
  '✅ All migrations complete!' as result,
  'Balance system: debt allowed' as feature_1,
  'Betting: continuous (no time locks)' as feature_2,
  'Market pools: auto-calculated' as feature_3,
  'Multiple bets: enabled (hedging)' as feature_4;

-- Show sample of current markets (for verification)
SELECT 
  m.id,
  m.title,
  m.status,
  m.yes_pool,
  m.no_pool,
  (m.yes_pool + m.no_pool) as total_pool,
  COUNT(b.id) as bet_count
FROM public.markets m
LEFT JOIN public.bets b ON b.market_id = m.id
GROUP BY m.id, m.title, m.status, m.yes_pool, m.no_pool
ORDER BY m.created_at DESC
LIMIT 5;

