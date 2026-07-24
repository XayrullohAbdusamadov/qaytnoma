-- Ulashish (Share) tizimi uchun jadval
CREATE TABLE IF NOT EXISTS shared_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL CHECK (type IN ('text', 'image', 'link')),
    title TEXT NOT NULL,
    content TEXT,
    image_url TEXT,
    sender TEXT NOT NULL DEFAULT 'Anonim',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS yoqish
ALTER TABLE shared_items ENABLE ROW LEVEL SECURITY;

-- Anonim foydalanuvchilarga to'liq kirish
CREATE POLICY "Allow public full access on shared_items" ON shared_items
    FOR ALL
    TO anon
    USING (true)
    WITH CHECK (true);
