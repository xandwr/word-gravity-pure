-- Supabase Database Setup for Word Gravity
-- Run this in your Supabase SQL Editor

-- ============================================
-- 1. Create Tables
-- ============================================

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scores table
CREATE TABLE IF NOT EXISTS scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  mode TEXT NOT NULL DEFAULT 'endless',
  score INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster score queries
CREATE INDEX IF NOT EXISTS idx_scores_user_id ON scores(user_id);
CREATE INDEX IF NOT EXISTS idx_scores_mode_score ON scores(mode, score DESC);
CREATE INDEX IF NOT EXISTS idx_scores_created_at ON scores(created_at DESC);

-- ============================================
-- 2. Enable Row Level Security
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. RLS Policies for Profiles
-- ============================================

-- Allow users to read all profiles (for leaderboard display)
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles
  FOR SELECT
  USING (true);

-- Allow users to insert their own profile
CREATE POLICY "Users can insert their own profile"
  ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================
-- 4. RLS Policies for Scores
-- ============================================

-- Allow users to read all scores (for leaderboard)
CREATE POLICY "Scores are viewable by everyone"
  ON scores
  FOR SELECT
  USING (true);

-- Allow authenticated users to insert their own scores
CREATE POLICY "Users can insert their own scores"
  ON scores
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Optionally: Allow users to delete their own scores
CREATE POLICY "Users can delete their own scores"
  ON scores
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 5. Functions & Triggers
-- ============================================

-- Function to automatically create a profile when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (
    new.id,
    COALESCE(
      new.raw_user_meta_data->>'username',
      split_part(new.email, '@', 1)
    )
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function when a new user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 6. Grant Permissions
-- ============================================

-- Grant access to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON scores TO authenticated;

-- Grant access to anon users (for public leaderboard viewing)
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON profiles TO anon;
GRANT SELECT ON scores TO anon;

-- ============================================
-- 7. Leaderboard View
-- ============================================

-- Create a view for the global leaderboard with user rankings
CREATE OR REPLACE VIEW leaderboard_global AS
WITH ranked_scores AS (
  SELECT
    s.id,
    s.user_id,
    s.score,
    s.created_at,
    p.username,
    ROW_NUMBER() OVER (
      PARTITION BY s.user_id
      ORDER BY s.score DESC, s.created_at ASC
    ) as user_rank,
    DENSE_RANK() OVER (
      ORDER BY s.score DESC, s.created_at ASC
    ) as global_rank
  FROM scores s
  JOIN profiles p ON s.user_id = p.id
  WHERE s.mode = 'endless'
)
SELECT
  id,
  user_id,
  username,
  score,
  created_at,
  global_rank as rank
FROM ranked_scores
WHERE user_rank = 1  -- Only keep each user's best score
ORDER BY score DESC, created_at ASC
LIMIT 100;

-- Grant access to the view
GRANT SELECT ON leaderboard_global TO authenticated;
GRANT SELECT ON leaderboard_global TO anon;

-- ============================================
-- 8. Helper Functions
-- ============================================

-- Function to get user's best score and rank
CREATE OR REPLACE FUNCTION get_user_leaderboard_position(user_uuid UUID)
RETURNS TABLE (
  rank BIGINT,
  score INTEGER,
  total_players BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH user_best_scores AS (
    SELECT
      s.user_id,
      MAX(s.score) as best_score,
      MIN(s.created_at) FILTER (WHERE s.score = MAX(s.score)) as first_best_at
    FROM scores s
    WHERE s.mode = 'endless'
    GROUP BY s.user_id
  ),
  ranked_users AS (
    SELECT
      ubs.user_id,
      ubs.best_score,
      DENSE_RANK() OVER (ORDER BY ubs.best_score DESC, ubs.first_best_at ASC) as user_rank
    FROM user_best_scores ubs
  )
  SELECT
    ru.user_rank,
    ru.best_score,
    (SELECT COUNT(DISTINCT user_id) FROM scores WHERE mode = 'endless') as total
  FROM ranked_users ru
  WHERE ru.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_user_leaderboard_position(UUID) TO authenticated;

-- ============================================
-- Notes:
-- ============================================
-- 1. Run this script in your Supabase SQL Editor
-- 2. The trigger will automatically create profiles when users sign up
-- 3. RLS policies ensure users can only modify their own data
-- 4. Everyone can view profiles and scores (for leaderboard)
-- 5. The leaderboard_global view shows top 100 players by their best score
-- 6. Use get_user_leaderboard_position(user_id) to get a specific user's rank
-- 7. You may need to manually create the first few profiles if users already exist
