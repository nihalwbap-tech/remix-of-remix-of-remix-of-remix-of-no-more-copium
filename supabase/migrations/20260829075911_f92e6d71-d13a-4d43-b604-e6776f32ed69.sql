-- ============================================================================
-- NO MORE COPIUM — PURE CLOUD REBUILD MASTER MIGRATION
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. APP ACCOUNTS TABLE (Clients & Coach Hal)
CREATE TABLE IF NOT EXISTS public.app_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  username text NOT NULL,
  password text NOT NULL,
  role text NOT NULL CHECK (role IN ('coach', 'client', 'payment_manager')) DEFAULT 'client',
  is_preview boolean NOT NULL DEFAULT false,
  onboarding_step integer NOT NULL DEFAULT 5,
  onboarding_completed_at timestamptz,
  assigned_program_id text,
  approved_at timestamptz DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS app_accounts_username_lower_idx 
  ON public.app_accounts (lower(trim(username)));

-- 2. ACCESS CODES VOUCHER TABLE
CREATE TABLE IF NOT EXISTS public.access_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  code_prefix text NOT NULL,
  note text,
  is_used boolean NOT NULL DEFAULT false,
  used_by_username text,
  used_at timestamptz,
  expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. GLOBAL APP STATE (Programs, Workouts, Exercises, Guides Library)
CREATE TABLE IF NOT EXISTS public.app_state (
  id text PRIMARY KEY,
  programs jsonb NOT NULL DEFAULT '[]'::jsonb,
  workouts jsonb NOT NULL DEFAULT '[]'::jsonb,
  exercises jsonb NOT NULL DEFAULT '[]'::jsonb,
  guides jsonb NOT NULL DEFAULT '[]'::jsonb,
  weight_units jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 4. WORKOUT SESSIONS (Client workout logging)
CREATE TABLE IF NOT EXISTS public.workout_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  program_id text NOT NULL,
  workout_id text NOT NULL,
  workout_name text NOT NULL,
  completed_at timestamptz NOT NULL DEFAULT now(),
  duration_seconds integer NOT NULL DEFAULT 0,
  exercise_logs jsonb NOT NULL DEFAULT '[]'::jsonb,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 5. CLIENT GUIDES PROGRESS
CREATE TABLE IF NOT EXISTS public.client_guides_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  guide_id text NOT NULL,
  completed_module_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  last_read_module_id text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT client_guide_unique UNIQUE (client_id, guide_id)
);

-- 6. CHAT THREADS & MESSAGES
CREATE TABLE IF NOT EXISTS public.chat_threads (
  id text PRIMARY KEY,
  client_id text NOT NULL,
  coach_id text NOT NULL,
  last_message_body text,
  last_message_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id text PRIMARY KEY,
  thread_id text NOT NULL,
  sender_account_id text NOT NULL,
  body text NOT NULL,
  attachments jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 7. PROGRESS PICTURES
CREATE TABLE IF NOT EXISTS public.progress_picture_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  taken_at date NOT NULL DEFAULT CURRENT_DATE,
  streak_count integer NOT NULL DEFAULT 1,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.progress_pictures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid NOT NULL,
  pose text NOT NULL,
  image_url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- SEED COACH HAL & INITIAL GLOBAL STATE
-- ============================================================================

INSERT INTO public.app_accounts (
  id, name, username, password, role, is_preview, onboarding_step, approved_at, created_at
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Hal',
  'coach',
  'Uh1jLLxT0Hvd_LVF0P6T9kMcDphG_4QD',
  'coach',
  false,
  0,
  now(),
  now()
) ON CONFLICT (id) DO UPDATE SET
  name = 'Hal',
  username = 'coach',
  password = 'Uh1jLLxT0Hvd_LVF0P6T9kMcDphG_4QD';

INSERT INTO public.app_state (id, programs, workouts, exercises, guides, updated_at)
VALUES ('global', '[]'::jsonb, '[]'::jsonb, '[]'::jsonb, '[]'::jsonb, now())
ON CONFLICT (id) DO NOTHING;

-- Seed default initial access codes for coach testing
INSERT INTO public.access_codes (id, code, code_prefix, note, is_used, created_at)
VALUES 
  ('00000000-0000-0000-0000-000000000010', 'NMC-7F2K-Q9Z4', '7F2K', 'Starter Master Voucher 1', false, now()),
  ('00000000-0000-0000-0000-000000000011', 'NMC-M8XT-2P4V', 'M8XT', 'Starter Master Voucher 2', false, now()),
  ('00000000-0000-0000-0000-000000000012', 'NMC-L9W3-K5B8', 'L9W3', 'Starter Master Voucher 3', false, now())
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- PERMISSIVE SECURITY POLICIES & PERMISSIONS
-- ============================================================================

GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

ALTER TABLE public.app_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_guides_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress_picture_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress_pictures ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public accounts access" ON public.app_accounts;
CREATE POLICY "Public accounts access" ON public.app_accounts FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access_codes access" ON public.access_codes;
CREATE POLICY "Public access_codes access" ON public.access_codes FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public app_state access" ON public.app_state;
CREATE POLICY "Public app_state access" ON public.app_state FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public workout_sessions access" ON public.workout_sessions;
CREATE POLICY "Public workout_sessions access" ON public.workout_sessions FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public client_guides_progress access" ON public.client_guides_progress;
CREATE POLICY "Public client_guides_progress access" ON public.client_guides_progress FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public chat_threads access" ON public.chat_threads;
CREATE POLICY "Public chat_threads access" ON public.chat_threads FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public chat_messages access" ON public.chat_messages;
CREATE POLICY "Public chat_messages access" ON public.chat_messages FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public progress_picture_batches access" ON public.progress_picture_batches;
CREATE POLICY "Public progress_picture_batches access" ON public.progress_picture_batches FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public progress_pictures access" ON public.progress_pictures;
CREATE POLICY "Public progress_pictures access" ON public.progress_pictures FOR ALL TO public USING (true) WITH CHECK (true);

-- ============================================================================
-- SECURITY DEFINER RPCs (Guaranteed Execution Engine)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.register_client_account_v2(
  p_id text,
  p_name text,
  p_username text,
  p_password text,
  p_access_code text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_clean_code text;
  v_clean_user text;
  v_account_id uuid;
BEGIN
  v_clean_code := upper(replace(replace(p_access_code, '-', ''), ' ', ''));
  v_clean_user := lower(trim(p_username));

  -- 1. Validate username uniqueness
  IF EXISTS (SELECT 1 FROM public.app_accounts WHERE lower(trim(username)) = v_clean_user) THEN
    RAISE EXCEPTION 'That username is already taken. Please choose another username.';
  END IF;

  -- 2. Burn access code if valid
  UPDATE public.access_codes
  SET is_used = true,
      used_by_username = v_clean_user,
      used_at = now()
  WHERE is_used = false
    AND (
      upper(replace(replace(code, '-', ''), ' ', '')) = v_clean_code
      OR code_prefix = substring(v_clean_code from 1 for 4)
    );

  -- 3. Parse UUID
  BEGIN
    v_account_id := p_id::uuid;
  EXCEPTION WHEN OTHERS THEN
    v_account_id := gen_random_uuid();
  END;

  -- 4. Insert into app_accounts
  INSERT INTO public.app_accounts (
    id, name, username, password, role, is_preview, onboarding_step, approved_at, created_at, updated_at
  ) VALUES (
    v_account_id, p_name, v_clean_user, p_password, 'client', false, 5, now(), now(), now()
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    username = EXCLUDED.username,
    password = EXCLUDED.password,
    approved_at = now(),
    updated_at = now();

  RETURN jsonb_build_object(
    'ok', true,
    'id', v_account_id::text,
    'name', p_name,
    'username', v_clean_user,
    'role', 'client',
    'approvedAt', now()::text
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.register_client_account_v2(text, text, text, text, text) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.get_all_client_accounts_v2()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_res jsonb;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', a.id::text,
      'name', a.name,
      'username', a.username,
      'password', a.password,
      'role', a.role,
      'approvedAt', a.approved_at::text,
      'assignedProgramId', a.assigned_program_id,
      'createdAt', a.created_at::text
    )
  ) INTO v_res
  FROM public.app_accounts a
  WHERE a.role = 'client'
  ORDER BY a.created_at DESC;

  RETURN COALESCE(v_res, '[]'::jsonb);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_all_client_accounts_v2() TO anon, authenticated, service_role;