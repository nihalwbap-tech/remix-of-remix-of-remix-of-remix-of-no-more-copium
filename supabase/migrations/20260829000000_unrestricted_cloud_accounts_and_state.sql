-- Unrestricted RLS policies for app_accounts, app_state, and chat tables
-- Guarantees cross-device client synchronization between client devices and Coach Hal

GRANT ALL ON public.app_accounts TO anon, authenticated, service_role;
GRANT ALL ON public.app_state TO anon, authenticated, service_role;
GRANT ALL ON public.chat_messages TO anon, authenticated, service_role;
GRANT ALL ON public.chat_threads TO anon, authenticated, service_role;

-- Allow public read/write to app_accounts
ALTER TABLE public.app_accounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public accounts access" ON public.app_accounts;
DROP POLICY IF EXISTS "Authenticated users can read their accounts" ON public.app_accounts;
DROP POLICY IF EXISTS "Coach can assign client programs" ON public.app_accounts;
DROP POLICY IF EXISTS "Prototype accounts are publicly readable" ON public.app_accounts;
DROP POLICY IF EXISTS "Prototype accounts are publicly creatable" ON public.app_accounts;
DROP POLICY IF EXISTS "Prototype client assignments are publicly editable" ON public.app_accounts;

CREATE POLICY "Public accounts access" ON public.app_accounts FOR ALL TO public USING (true) WITH CHECK (true);

-- Allow public read/write to app_state
ALTER TABLE public.app_state ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public state access" ON public.app_state;
DROP POLICY IF EXISTS "Coach manages app_state" ON public.app_state;
DROP POLICY IF EXISTS "Authenticated users can read app state" ON public.app_state;
DROP POLICY IF EXISTS "Coach can update app state" ON public.app_state;
DROP POLICY IF EXISTS "Prototype app state is publicly readable" ON public.app_state;
DROP POLICY IF EXISTS "Prototype app state is publicly editable" ON public.app_state;

CREATE POLICY "Public state access" ON public.app_state FOR ALL TO public USING (true) WITH CHECK (true);

-- Allow public read/write to chat
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public chat_messages access" ON public.chat_messages;
CREATE POLICY "Public chat_messages access" ON public.chat_messages FOR ALL TO public USING (true) WITH CHECK (true);

ALTER TABLE public.chat_threads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public chat_threads access" ON public.chat_threads;
CREATE POLICY "Public chat_threads access" ON public.chat_threads FOR ALL TO public USING (true) WITH CHECK (true);
