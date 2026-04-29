export default function middleware(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // Always allow: root page, auth endpoint, and Vercel internals
  if (
    pathname === '/' ||
    pathname === '/index.html' ||
    pathname === '/api/auth' ||
    pathname.startsWith('/_vercel/')
  ) {
    return;
  }

  // Protect all source JS files and sensitive API routes
  const isProtected =
    (pathname.endsWith('.js') && !pathname.startsWith('/api/')) ||
    pathname === '/api/config' ||
    pathname === '/api/email' ||
    pathname === '/api/planner' ||
    pathname === '/api/send-traffic';

  if (isProtected) {
    const cookie = request.headers.get('cookie') || '';
    if (!/dd_session=[a-f0-9]{64}/.test(cookie)) {
      // Vendor confirmation pages are public — anyone with a valid
      // confirm token in the URL needs to load the app to render the
      // portal. The token itself gates what they can see (validated
      // in app.js). Allow .js + /api/config when the request comes
      // from a page with ?confirm= in its URL.
      const referer = request.headers.get('referer') || '';
      if (/[?&]confirm=/.test(referer) && (pathname.endsWith('.js') || pathname === '/api/config')) {
        return;
      }
      return new Response('Unauthorized', { status: 401 });
    }
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
};
