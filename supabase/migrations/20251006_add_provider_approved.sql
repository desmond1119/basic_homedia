-- Add approved status for admin moderation
ALTER TABLE public.app_users
ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS idx_app_users_approved ON public.app_users(is_approved) WHERE role = 'provider';

COMMENT ON COLUMN public.app_users.is_approved IS 'Admin approval status for provider profiles';
