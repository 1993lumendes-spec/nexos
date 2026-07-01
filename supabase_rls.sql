-- =============================================================
-- NEXOS — Script Completo para Supabase
-- Cria tabelas, ativa RLS e atualiza a senha do administrador.
--
-- Execute no SQL Editor do painel do Supabase:
-- https://supabase.com/dashboard → SQL Editor → New query
-- Cole TUDO abaixo e clique em RUN.
-- =============================================================


-- =====================
-- PARTE 1: CRIAR AS TABELAS (se ainda não existirem)
-- =====================

CREATE TABLE IF NOT EXISTS gangs (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL DEFAULT '',
  "originCity"  TEXT NOT NULL DEFAULT '',
  color       TEXT NOT NULL DEFAULT '#888',
  description TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS suspects (
  id             TEXT PRIMARY KEY,
  name           TEXT NOT NULL DEFAULT '',
  rg             TEXT NOT NULL DEFAULT '',
  aliases        TEXT NOT NULL DEFAULT '',
  "primaryPhoto"   TEXT NOT NULL DEFAULT '',
  photos         JSONB NOT NULL DEFAULT '[]',
  "gangId"         TEXT NOT NULL DEFAULT '',
  "criminalRecord" TEXT NOT NULL DEFAULT '',
  status         TEXT NOT NULL DEFAULT 'investigating',
  "birthDate"      TEXT,
  "modusOperandi"  TEXT
);

CREATE TABLE IF NOT EXISTS crimes (
  id                  TEXT PRIMARY KEY,
  "crimeNumber"         TEXT,
  date                TEXT NOT NULL DEFAULT '',
  establishment       TEXT NOT NULL DEFAULT '',
  city                TEXT NOT NULL DEFAULT '',
  address             TEXT NOT NULL DEFAULT '',
  "gangId"              TEXT NOT NULL DEFAULT '',
  "suspectsInvolved"    JSONB NOT NULL DEFAULT '[]',
  "vehiclesInvolved"    JSONB NOT NULL DEFAULT '[]',
  description         TEXT NOT NULL DEFAULT '',
  coordinates         JSONB NOT NULL DEFAULT '[0,0]',
  "stolenValue"         NUMERIC
);

CREATE TABLE IF NOT EXISTS users (
  id               TEXT PRIMARY KEY,
  name             TEXT NOT NULL DEFAULT '',
  email            TEXT NOT NULL DEFAULT '',
  password         TEXT NOT NULL DEFAULT '',
  role             TEXT,
  "assignmentCity"   TEXT,
  "lastLogin"        TEXT NOT NULL DEFAULT '',
  status           TEXT NOT NULL DEFAULT 'inactive'
);

CREATE TABLE IF NOT EXISTS vehicles (
  id          TEXT PRIMARY KEY,
  plate       TEXT NOT NULL DEFAULT '',
  "brandModel"  TEXT NOT NULL DEFAULT '',
  color       TEXT NOT NULL DEFAULT '',
  "gangId"      TEXT NOT NULL DEFAULT '',
  "suspectId"   TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT ''
);


-- =====================
-- PARTE 2: ATIVAR ROW LEVEL SECURITY
-- =====================

ALTER TABLE gangs      ENABLE ROW LEVEL SECURITY;
ALTER TABLE suspects   ENABLE ROW LEVEL SECURITY;
ALTER TABLE crimes     ENABLE ROW LEVEL SECURITY;
ALTER TABLE users      ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles   ENABLE ROW LEVEL SECURITY;


-- =====================
-- PARTE 3: REMOVER POLÍTICAS ANTIGAS (idempotente)
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
-- PARTE 4: CRIAR POLÍTICAS DE ACESSO (anon key do frontend)
-- =====================

-- Leitura
CREATE POLICY "nexos_anon_read_gangs"     ON gangs     FOR SELECT USING (true);
CREATE POLICY "nexos_anon_read_suspects"  ON suspects  FOR SELECT USING (true);
CREATE POLICY "nexos_anon_read_crimes"    ON crimes    FOR SELECT USING (true);
CREATE POLICY "nexos_anon_read_users"     ON users     FOR SELECT USING (true);
CREATE POLICY "nexos_anon_read_vehicles"  ON vehicles  FOR SELECT USING (true);

-- Escrita
CREATE POLICY "nexos_anon_write_gangs"    ON gangs     FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "nexos_anon_write_suspects" ON suspects  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "nexos_anon_write_crimes"   ON crimes    FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "nexos_anon_write_users"    ON users     FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "nexos_anon_write_vehicles" ON vehicles  FOR ALL USING (true) WITH CHECK (true);


-- =====================
-- PARTE 5: ATUALIZAR SENHA DO ADMINISTRADOR
-- SHA-256 de: #Arla$15582#
-- =====================

UPDATE users
SET password = '48dcfa2ce11afb859ca0d7493c9f7d00e3db79023a17224433525b6cef91bfa7'
WHERE email = '1993lumendes@gmail.com';

-- Se o admin ainda não existir no banco, insere com a senha hashed
INSERT INTO users (id, name, email, password, role, "assignmentCity", "lastLogin", status)
VALUES (
  'user-admin',
  'Administrador Nexos',
  '1993lumendes@gmail.com',
  '48dcfa2ce11afb859ca0d7493c9f7d00e3db79023a17224433525b6cef91bfa7',
  'Administrador do Sistema',
  'Lajeado',
  'Nunca (Acesso Inicial)',
  'active'
)
ON CONFLICT (id) DO UPDATE
  SET password = EXCLUDED.password,
      status   = 'active';


-- =====================
-- VERIFICAÇÃO FINAL
-- =====================
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
SELECT email, status, LEFT(password, 20) || '...' AS password_preview FROM users;
SELECT tablename, policyname, cmd FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename;
