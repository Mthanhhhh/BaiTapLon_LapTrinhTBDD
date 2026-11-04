/** Resize only documented public image CDNs. Originals and signed URLs remain untouched. */
export function imageDeliveryUrl(source: string, requestedWidth?: number): string {
  if (!requestedWidth || !Number.isFinite(requestedWidth)) return source;
  try {
    const url = new URL(source);
    if (url.protocol !== 'https:') return source;
    if (/\.(svg|gif)(?:$|[?#])/i.test(source) || url.searchParams.has('signature') || url.searchParams.has('token')) return source;
    const width = Math.max(64, Math.min(1600, Math.round(requestedWidth / 64) * 64));
    if (url.hostname === 'res.cloudinary.com' && url.pathname.includes('/image/upload/') && !url.pathname.includes('/s--')) {
      // Do not change already transformed URLs: a later transform may override requested sizing.
      const tail = url.pathname.split('/image/upload/')[1];
      if (!/^(v\d+\/)?[^,]+$/.test(tail) || /^(?:c_|w_|h_|f_|q_|t_)/.test(tail)) return source;
      url.pathname = url.pathname.replace('/image/upload/', `/image/upload/f_auto,q_auto,c_limit,w_${width}/`);
      return url.toString();
    }
    if (url.hostname === 'cdn.shopify.com' && /^\/s\/files\//.test(url.pathname)) {
      const existing = Number(url.searchParams.get('width'));
      url.searchParams.set('width', String(existing > 0 ? Math.min(existing, width) : width));
      return url.toString();
    }
  } catch { /* Invalid/non-public image sources retain existing fallback behavior. */ }
  return source;
}
