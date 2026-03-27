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
    pathname === '/api/planner';

  if (isProtected) {
    const cookie = request.headers.get('cookie') || '';
    if (!cookie.includes('dd_session=')) {
      return new Response('Unauthorized', { status: 401 });
    }
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
};
