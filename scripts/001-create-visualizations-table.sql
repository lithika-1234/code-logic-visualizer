-- Create visualizations table to save user code visualizations
CREATE TABLE IF NOT EXISTS visualizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  code TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'python',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE visualizations ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own visualizations
CREATE POLICY "Users can view their own visualizations" 
  ON visualizations FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own visualizations" 
  ON visualizations FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own visualizations" 
  ON visualizations FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own visualizations" 
  ON visualizations FOR DELETE 
  USING (auth.uid() = user_id);

-- Index for faster queries by user
CREATE INDEX IF NOT EXISTS idx_visualizations_user_id ON visualizations(user_id);
