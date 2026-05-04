import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const FEED_PASSWORD = process.env.LATELY_FEED_PASSWORD;
const PASSWORD_COOKIE = 'lately_feed_auth';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const { pathname } = req.nextUrl;

  // Skip API routes, static files, login page
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/login') ||
    pathname === '/feed.xml'
  ) {
    return res;
  }

  // Feed password gate (if set)
  if (FEED_PASSWORD) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => req.cookies.getAll(),
          setAll: () => {},
        },
      }
    );
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const isOwner = !!session;
    const hasPasswordCookie =
      req.cookies.get(PASSWORD_COOKIE)?.value === FEED_PASSWORD;

    if (!isOwner && !hasPasswordCookie) {
      const loginUrl = req.nextUrl.clone();
      loginUrl.pathname = '/login';
      loginUrl.searchParams.set('gate', '1');
      return NextResponse.redirect(loginUrl);
    }
  }

  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
