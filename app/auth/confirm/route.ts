import { handleAuthCallback } from '@/lib/supabase/auth-callback';

export async function GET(request: Request) {
  return handleAuthCallback(request);
}
