-- Telegram integration tables
-- telegram_links: maps Telegram chat_id → Agent MOE user/workspace
-- telegram_sessions: ephemeral conversation state per chat

-- ============================================================================
-- telegram_links
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.telegram_links (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  workspace_id  UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  chat_id       BIGINT NOT NULL UNIQUE,
  username      TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  linked_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Webhook hot path: look up user by chat_id
CREATE INDEX idx_telegram_links_chat_id ON public.telegram_links(chat_id);

-- Outbound notifications: find chat_id for a user
CREATE INDEX idx_telegram_links_user_id ON public.telegram_links(user_id);

-- auto-update updated_at
CREATE TRIGGER set_telegram_links_updated_at
  BEFORE UPDATE ON public.telegram_links
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- telegram_sessions
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.telegram_sessions (
  chat_id       BIGINT PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  workspace_id  UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  state         JSONB NOT NULL DEFAULT '{}',
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER set_telegram_sessions_updated_at
  BEFORE UPDATE ON public.telegram_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- RLS (service-role only — webhook uses admin client)
-- ============================================================================
ALTER TABLE public.telegram_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_sessions ENABLE ROW LEVEL SECURITY;
