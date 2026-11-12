// FITS proxy: lets the Sky View open FITS files from servers that do not send CORS headers.
// GET /api/fits?url=https://host/path/image.fits
// Only public http(s) hosts are allowed (no localhost / private networks), redirects are
// re-checked, and files above MAX_BYTES are refused.

import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_BYTES = 100 * 1024 * 1024;   // fits in a 300 s serverless function on Vercel Hobby
const MAX_REDIRECTS = 3;

function isPrivateAddress(addr) {
  if (isIP(addr) === 4) {
    const [a, b] = addr.split('.').map(Number);
    return a === 0 || a === 10 || a === 127 || (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 198 && (b === 18 || b === 19)) || a >= 224;
  }
  const v = addr.toLowerCase();
  if (v.startsWith('::ffff:')) return isPrivateAddress(v.slice(7));
  return v === '::' || v === '::1' || v.startsWith('fc') || v.startsWith('fd') || v.startsWith('fe8') || v.startsWith('fe9') || v.startsWith('fea') || v.startsWith('feb') || v.startsWith('ff');
}

async function checkUrl(raw) {
  let u;
  try { u = new URL(raw); } catch { return 'Not a valid URL.'; }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return 'Only http and https URLs are supported.';
  if (u.username || u.password) return 'URLs with credentials are not supported.';
  const host = u.hostname.replace(/^\[|\]$/g, '');
  let addrs;
  try { addrs = isIP(host) ? [{ address: host }] : await lookup(host, { all: true }); } catch { return 'Could not find that host.'; }
  if (!addrs.length || addrs.some((a) => isPrivateAddress(a.address))) return 'That host is not allowed.';
  return null;
}

const fail = (status, message) => new Response(message, { status, headers: { 'content-type': 'text/plain; charset=utf-8' } });

export async function GET(req) {
  let target = new URL(req.url).searchParams.get('url');
  if (!target) return fail(400, 'Missing url parameter.');

  let res;
  for (let hop = 0; ; hop++) {
    const problem = await checkUrl(target);
    if (problem) return fail(400, problem);
    try {
      res = await fetch(target, { redirect: 'manual', headers: { accept: 'application/fits, */*' }, signal: AbortSignal.timeout(60000) });
    } catch {
      return fail(502, 'Could not reach that server.');
    }
    if (res.status >= 300 && res.status < 400 && res.headers.get('location')) {
      if (hop >= MAX_REDIRECTS) return fail(502, 'Too many redirects.');
      target = new URL(res.headers.get('location'), target).toString();
      continue;
    }
    break;
  }

  if (!res.ok || !res.body) return fail(502, `The server answered ${res.status}.`);
  const len = Number(res.headers.get('content-length') || 0);
  if (len > MAX_BYTES) return fail(413, 'File is too large (limit 100 MB).');

  // Stream through, stopping if the file turns out larger than the limit.
  let seen = 0;
  const limited = res.body.pipeThrough(new TransformStream({
    transform(chunk, ctrl) {
      seen += chunk.byteLength;
      if (seen > MAX_BYTES) ctrl.error(new Error('File too large'));
      else ctrl.enqueue(chunk);
    },
  }));

  const headers = { 'content-type': 'application/fits', 'cache-control': 'public, max-age=3600' };
  if (len) headers['content-length'] = String(len);
  return new Response(limited, { status: 200, headers });
}
