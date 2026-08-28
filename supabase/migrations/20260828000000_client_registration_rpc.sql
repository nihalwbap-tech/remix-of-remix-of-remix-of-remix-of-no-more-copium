-- Security Definer RPCs for client registration & multi-device sync
CREATE OR REPLACE FUNCTION public.register_client_account_v1(
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
AS 1550
DECLARE
  v_code_rec record;
  v_clean_code text;
  v_clean_user text;
  v_account_id uuid;
BEGIN
  v_clean_code := upper(replace(replace(p_access_code, '-', ''), ' ', ''));
  v_clean_user := lower(trim(p_username));

  -- 1. Validate username uniqueness
  IF EXISTS (SELECT 1 FROM public.app_accounts WHERE lower(username) = v_clean_user) THEN
    RAISE EXCEPTION 'That username is already taken. Please choose another username.';
  END IF;

  -- 2. Validate and burn access code
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'access_codes') THEN
    SELECT * INTO v_code_rec FROM public.access_codes
    WHERE code_prefix = substring(v_clean_code from 1 for 4)
      AND (revoked_at IS NULL AND used_at IS NULL)
    LIMIT 1;

    IF v_code_rec.id IS NOT NULL THEN
      UPDATE public.access_codes
      SET used_at = now(), redeemed_at = now()
      WHERE id = v_code_rec.id;
    END IF;
  END IF;

  -- 3. Insert into app_accounts
  BEGIN
    v_account_id := p_id::uuid;
  EXCEPTION WHEN OTHERS THEN
    v_account_id := gen_random_uuid();
  END;

  INSERT INTO public.app_accounts (
    id,
    name,
    username,
    role,
    is_preview,
    onboarding_step,
    approved_at,
    created_at
  )
  VALUES (
    v_account_id,
    p_name,
    v_clean_user,
    'client',
    false,
    5,
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE
  SET name = EXCLUDED.name,
      username = EXCLUDED.username,
      approved_at = now();

  -- 4. Store credentials in app_state vault so Coach can look up passwords
  PERFORM 1 FROM public.app_state WHERE id = 'cloud_accounts_vault';
  IF NOT FOUND THEN
    INSERT INTO public.app_state (id, programs, updated_at)
    VALUES ('cloud_accounts_vault', jsonb_build_array(
      jsonb_build_object(
        'id', v_account_id::text,
        'name', p_name,
        'username', v_clean_user,
        'password', p_password,
        'role', 'client',
        'createdAt', now()::text,
        'approvedAt', now()::text
      )
    ), now());
  ELSE
    UPDATE public.app_state
    SET programs = jsonb_set(
      COALESCE(programs, '[]'::jsonb),
      '{999999}',
      jsonb_build_object(
        'id', v_account_id::text,
        'name', p_name,
        'username', v_clean_user,
        'password', p_password,
        'role', 'client',
        'createdAt', now()::text,
        'approvedAt', now()::text
      ),
      true
    ),
    updated_at = now()
    WHERE id = 'cloud_accounts_vault';
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'id', v_account_id::text,
    'name', p_name,
    'username', v_clean_user,
    'role', 'client',
    'approvedAt', now()::text
  );
END;
1550;

GRANT EXECUTE ON FUNCTION public.register_client_account_v1(text, text, text, text, text) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.get_all_client_accounts_v1()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS 1550
DECLARE
  v_res jsonb;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', a.id::text,
      'name', a.name,
      'username', a.username,
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
1550;

GRANT EXECUTE ON FUNCTION public.get_all_client_accounts_v1() TO anon, authenticated, service_role;
