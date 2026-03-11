/*
  # Create browser persistence tables for OS simulator

  1. New Tables
    - `browser_history` - Store visited URLs and page titles
    - `browser_bookmarks` - Store user bookmarks
    - `browser_sessions` - Store tab sessions and state
  
  2. Security
    - Enable RLS on all tables
    - Users can only access their own data
    - Bookmarks are user-specific
  
  3. Notes
    - history entries include timestamps for sorting
    - bookmarks support custom names and categories
    - sessions preserve tab state across page reloads
*/

CREATE TABLE IF NOT EXISTS browser_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  url text NOT NULL,
  title text NOT NULL,
  visited_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS browser_bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  url text NOT NULL,
  icon text DEFAULT '🌐',
  category text DEFAULT 'general',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS browser_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  session_data jsonb NOT NULL,
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE browser_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE browser_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE browser_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own history"
  ON browser_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own history"
  ON browser_history FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own history"
  ON browser_history FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own bookmarks"
  ON browser_bookmarks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own bookmarks"
  ON browser_bookmarks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bookmarks"
  ON browser_bookmarks FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own bookmarks"
  ON browser_bookmarks FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own sessions"
  ON browser_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own sessions"
  ON browser_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
  ON browser_sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_browser_history_user_id ON browser_history(user_id);
CREATE INDEX idx_browser_history_visited_at ON browser_history(visited_at DESC);
CREATE INDEX idx_browser_bookmarks_user_id ON browser_bookmarks(user_id);
CREATE INDEX idx_browser_sessions_user_id ON browser_sessions(user_id);
