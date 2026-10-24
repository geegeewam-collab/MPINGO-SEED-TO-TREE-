import { NextResponse, type NextRequest } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';

// Landing point for links in Supabase emails (invitations and password resets).
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const next = searchParams.get('next') ?? '/dashboard';
  const safeNext = next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard';
  const supabase = await createClient();
  const tokenHash = searchParams.get('token_hash'), type = searchParams.get('type'), code = searchParams.get('code');
  let ok = false;
  if (tokenHash && type) ok = !(await supabase.auth.verifyOtp({ type: type as EmailOtpType, token_hash: tokenHash })).error;
  else if (code) ok = !(await supabase.auth.exchangeCodeForSession(code)).error;
  return NextResponse.redirect(new URL(ok ? safeNext : '/auth/forgot-password?expired=1', request.url));
}
