// Vercel Edge middleware. Validates the dd_session cookie via HMAC so an
// attacker can't forge one by knowing the cookie name and shape.
const SESSION_RE = /dd_session=([^;]+)/;

function b64urlToBuffer(s) {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4));
  const b64 = (s + pad).replace(/-/g, '+').replace(/_/g, '/');
  // Web Crypto / atob are available in Edge runtime.
  const bin = atob(b64);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return buf;
}

function bufToB64url(buf) {
  let bin = '';
  const u = new Uint8Array(buf);
  for (let i = 0; i < u.length; i++) bin += String.fromCharCode(u[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function getSessionSecret() {
  const explicit = process.env.SESSION_SECRET;
  if (explicit) return explicit;
  const seed = (process.env.SYS_PASSWORD || '') + '|' + (process.env.ADMIN_PASSWORD || '');
  if (!seed || seed === '|') return null;
  const enc = new TextEncoder();
  const hash = await crypto.subtle.digest('SHA-256', enc.encode('dd:session:' + seed));
  // Hex encode to match api/auth.js fallback derivation
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function validateSession(token) {
  if (typeof token !== 'string') return false;
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  const [id, expiry, sig] = parts;
  if (!/^[A-Za-z0-9_-]+$/.test(id) || !/^[0-9]+$/.test(expiry) || !/^[A-Za-z0-9_-]+$/.test(sig)) return false;
  if (Number(expiry) < Date.now()) return false;
  const secret = await getSessionSecret();
  if (!secret) return false;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const expected = await crypto.subtle.sign('HMAC', key, enc.encode(id + '.' + expiry));
  return bufToB64url(expected) === sig;
}

export default async function middleware(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  if (
    pathname === '/' ||
    pathname === '/index.html' ||
    pathname === '/api/auth' ||
    pathname.startsWith('/_vercel/')
  ) {
    return;
  }

  const isProtected =
    (pathname.endsWith('.js') && !pathname.startsWith('/api/')) ||
    pathname === '/api/config' ||
    pathname === '/api/planner' ||
    pathname === '/api/send-traffic' ||
    pathname === '/api/db' ||
    pathname === '/api/migrate-snapshot' ||
    pathname === '/api/storage';

  if (isProtected) {
    const cookie = request.headers.get('cookie') || '';
    const match = cookie.match(SESSION_RE);
    const tokenRaw = match ? decodeURIComponent(match[1]) : '';
    const sessionOk = tokenRaw ? await validateSession(tokenRaw) : false;
    if (!sessionOk) {
      // Vendor confirmation pages are public — anyone with a valid confirm
      // token in the URL needs to load the app to render the portal. The
      // per-station token (validated client-side, soon server-side) gates
      // what they can see. Allow .js + /api/config when the request looks
      // like it's coming from a vendor-portal load: either ?confirm= in the
      // Referer (fragment-less URLs) or a dd_vendor=1 cookie (which the
      // loader sets when it detects ?confirm= in the URL search OR hash —
      // browsers strip fragments from Referer, so the cookie covers that
      // case).
      const referer = request.headers.get('referer') || '';
      const refererHasConfirm = /[?&]confirm=/.test(referer);
      const cookieHasVendor = /(?:^|;\s*)dd_vendor=1(?:;|$)/.test(cookie);
      if ((refererHasConfirm || cookieHasVendor) && (pathname.endsWith('.js') || pathname === '/api/config')) {
        return;
      }
      return new Response('Unauthorized', { status: 401 });
    }
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
};
