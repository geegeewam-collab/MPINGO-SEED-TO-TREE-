import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// Keeps signed-in sessions alive. Supabase sign-in tokens expire after a short time (an hour by default).
// Pages run on the server and cannot save a refreshed token, so this runs first on every page request:
// it refreshes the token if needed and saves the new one in the browser cookie. It never blocks or redirects anyone;
// the pages themselves still decide who may see what.
export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  // Visitors without a sign-in cookie (the public) skip the check, so public pages stay fast.
  const signedIn = request.cookies.getAll().some((c) => c.name.startsWith('sb-') && c.name.includes('-auth-token'));
  if (!url || !key || !signedIn) return NextResponse.next();

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() { return request.cookies.getAll(); },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  try {
    await supabase.auth.getUser(); // validates the session and refreshes it when it has expired
  } catch {
    // If Supabase cannot be reached, carry on. The page will ask the person to sign in again if it has to.
  }
  return response;
}

export const config = {
  // Everything except static files, images, the service worker and the app manifest.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'],
};
