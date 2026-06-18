-- Shared Notes feature – run this in Supabase SQL editor

CREATE TABLE IF NOT EXISTS note_notebooks (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notes (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notebook_id      UUID NOT NULL REFERENCES note_notebooks(id) ON DELETE CASCADE,
  title            TEXT NOT NULL DEFAULT 'Nová poznámka',
  content          TEXT DEFAULT '',
  updated_by       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by_name  TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE notes;
ALTER PUBLICATION supabase_realtime ADD TABLE note_notebooks;

-- RLS: only authenticated users (admins) can access
ALTER TABLE note_notebooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes           ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_read_notebooks"   ON note_notebooks FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_insert_notebooks" ON note_notebooks FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_update_notebooks" ON note_notebooks FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_delete_notebooks" ON note_notebooks FOR DELETE USING (auth.uid() IS NOT NULL);

CREATE POLICY "auth_read_notes"   ON notes FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_insert_notes" ON notes FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_update_notes" ON notes FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_delete_notes" ON notes FOR DELETE USING (auth.uid() IS NOT NULL);
