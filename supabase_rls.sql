-- =============================================================
-- NEXOS — Row Level Security (RLS) para Supabase
-- Execute este script no SQL Editor do painel do Supabase:
-- https://supabase.com/dashboard → SQL Editor → New query
-- =============================================================

-- =====================
-- 1. Ativar RLS em todas as tabelas
-- =====================
ALTER TABLE gangs      ENABLE ROW LEVEL SECURITY;
ALTER TABLE suspects   ENABLE ROW LEVEL SECURITY;
ALTER TABLE crimes     ENABLE ROW LEVEL SECURITY;
ALTER TABLE users      ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles   ENABLE ROW LEVEL SECURITY;

-- =====================
-- 2. Remover políticas antigas (idempotente)
-- =====================
DROP POLICY IF EXISTS "nexos_anon_read_gangs"     ON gangs;
DROP POLICY IF EXISTS "nexos_anon_read_suspects"  ON suspects;
DROP POLICY IF EXISTS "nexos_anon_read_crimes"    ON crimes;
DROP POLICY IF EXISTS "nexos_anon_read_users"     ON users;
DROP POLICY IF EXISTS "nexos_anon_read_vehicles"  ON vehicles;

DROP POLICY IF EXISTS "nexos_anon_write_gangs"    ON gangs;
DROP POLICY IF EXISTS "nexos_anon_write_suspects" ON suspects;
DROP POLICY IF EXISTS "nexos_anon_write_crimes"   ON crimes;
DROP POLICY IF EXISTS "nexos_anon_write_users"    ON users;
DROP POLICY IF EXISTS "nexos_anon_write_vehicles" ON vehicles;

-- =====================
-- 3. Políticas de LEITURA
-- =====================
CREATE POLICY "nexos_anon_read_gangs"
  ON gangs FOR SELECT USING (true);

CREATE POLICY "nexos_anon_read_suspects"
  ON suspects FOR SELECT USING (true);

CREATE POLICY "nexos_anon_read_crimes"
  ON crimes FOR SELECT USING (true);

CREATE POLICY "nexos_anon_read_users"
  ON users FOR SELECT USING (true);

CREATE POLICY "nexos_anon_read_vehicles"
  ON vehicles FOR SELECT USING (true);

-- =====================
-- 4. Políticas de ESCRITA
-- =====================
CREATE POLICY "nexos_anon_write_gangs"
  ON gangs FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "nexos_anon_write_suspects"
  ON suspects FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "nexos_anon_write_crimes"
  ON crimes FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "nexos_anon_write_vehicles"
  ON vehicles FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "nexos_anon_write_users"
  ON users FOR ALL USING (true) WITH CHECK (true);

-- =====================
-- VERIFICAÇÃO FINAL
-- =====================
SELECT tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
