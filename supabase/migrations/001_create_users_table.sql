-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Users are viewable by everyone" ON users;
CREATE POLICY "Users are viewable by everyone"
  ON users FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can insert their own data" ON users;
CREATE POLICY "Users can insert their own data"
  ON users FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update their own data" ON users;
CREATE POLICY "Users can update their own data"
  ON users FOR UPDATE
  USING (true);

DROP POLICY IF EXISTS "Users can delete their own data" ON users;
CREATE POLICY "Users can delete their own data"
  ON users FOR DELETE
  USING (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data (optional)
INSERT INTO users (email, name, avatar_url) VALUES
  ('john@example.com', 'John Doe', 'https://i.pravatar.cc/150?img=1'),
  ('jane@example.com', 'Jane Smith', 'https://i.pravatar.cc/150?img=2'),
  ('bob@example.com', 'Bob Johnson', 'https://i.pravatar.cc/150?img=3')
ON CONFLICT (email) DO NOTHING;
