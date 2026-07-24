-- Create qaytnoma_items table
CREATE TABLE IF NOT EXISTS qaytnoma_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT,
    type TEXT NOT NULL CHECK (type IN ('text', 'image', 'datetime', 'todo', 'link')),
    image_url TEXT,
    color TEXT,
    icon TEXT,
    is_completed BOOLEAN DEFAULT false,
    target_time TIMESTAMP WITH TIME ZONE,
    sender TEXT DEFAULT 'Anonim',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE qaytnoma_items ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all actions for anonymous access (since we are using client publishable key without auth)
CREATE POLICY "Allow public full access" ON qaytnoma_items
    FOR ALL
    TO anon
    USING (true)
    WITH CHECK (true);
