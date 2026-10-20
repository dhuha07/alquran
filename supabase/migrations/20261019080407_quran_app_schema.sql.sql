/*
# Quran & Murojaah App - Core Schema

## Overview
Single-tenant (no auth) persistence layer for a Quran reading + memorization app.
The app stores bookmarks, memorization progress (murojaah), review scheduling,
mistake tracking, and per-user settings locally via the anon key client.

## Tables
1. `bookmarks` - saved ayahs with a note and folder label
2. `murojaah_progress` - memorization state per ayah (memorized/needs_review/not_memorized),
   last-reviewed timestamp, next-review timestamp (spaced repetition), review count,
   and a mistake counter
3. `murojaah_mistakes` - individual mistake records per ayah for self-testing review
4. `app_settings` - single-row key/value store for theme, font size, selected qari, etc.

## Security
- No auth: RLS enabled on every table, policies scoped to `anon, authenticated` since
  the anon-key client must read/write its own data.
- All CRUD permitted for the local app; this is a personal-device data store.
*/

CREATE TABLE IF NOT EXISTS bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  surah_number integer NOT NULL,
  ayah_number integer NOT NULL,
  note text,
  folder text DEFAULT 'default',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_bookmarks" ON bookmarks;
CREATE POLICY "anon_select_bookmarks" ON bookmarks FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_bookmarks" ON bookmarks;
CREATE POLICY "anon_insert_bookmarks" ON bookmarks FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_bookmarks" ON bookmarks;
CREATE POLICY "anon_update_bookmarks" ON bookmarks FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_bookmarks" ON bookmarks;
CREATE POLICY "anon_delete_bookmarks" ON bookmarks FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_bookmarks_surah_ayah ON bookmarks (surah_number, ayah_number);

CREATE TABLE IF NOT EXISTS murojaah_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  surah_number integer NOT NULL,
  ayah_number integer NOT NULL,
  status text NOT NULL DEFAULT 'not_memorized' CHECK (status IN ('not_memorized','needs_review','memorized')),
  review_count integer NOT NULL DEFAULT 0,
  mistake_count integer NOT NULL DEFAULT 0,
  last_reviewed_at timestamptz,
  next_review_at timestamptz,
  interval_days integer NOT NULL DEFAULT 1,
  ease_factor real NOT NULL DEFAULT 2.5,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (surah_number, ayah_number)
);

ALTER TABLE murojaah_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_murojaah" ON murojaah_progress;
CREATE POLICY "anon_select_murojaah" ON murojaah_progress FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_murojaah" ON murojaah_progress;
CREATE POLICY "anon_insert_murojaah" ON murojaah_progress FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_murojaah" ON murojaah_progress;
CREATE POLICY "anon_update_murojaah" ON murojaah_progress FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_murojaah" ON murojaah_progress;
CREATE POLICY "anon_delete_murojaah" ON murojaah_progress FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_murojaah_status ON murojaah_progress (status);
CREATE INDEX IF NOT EXISTS idx_murojaah_next_review ON murojaah_progress (next_review_at);

CREATE TABLE IF NOT EXISTS murojaah_mistakes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  surah_number integer NOT NULL,
  ayah_number integer NOT NULL,
  note text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE murojaah_mistakes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_mistakes" ON murojaah_mistakes;
CREATE POLICY "anon_select_mistakes" ON murojaah_mistakes FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_mistakes" ON murojaah_mistakes;
CREATE POLICY "anon_insert_mistakes" ON murojaah_mistakes FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_mistakes" ON murojaah_mistakes;
CREATE POLICY "anon_delete_mistakes" ON murojaah_mistakes FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_mistakes_surah_ayah ON murojaah_mistakes (surah_number, ayah_number);

CREATE TABLE IF NOT EXISTS app_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_settings" ON app_settings;
CREATE POLICY "anon_select_settings" ON app_settings FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_settings" ON app_settings;
CREATE POLICY "anon_insert_settings" ON app_settings FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_settings" ON app_settings;
CREATE POLICY "anon_update_settings" ON app_settings FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_settings" ON app_settings;
CREATE POLICY "anon_delete_settings" ON app_settings FOR DELETE
  TO anon, authenticated USING (true);
