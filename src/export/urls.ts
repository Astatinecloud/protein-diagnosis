export function siteUrl(configured = import.meta.env.VITE_PUBLIC_SITE_URL, origin = window.location.origin, base = import.meta.env.BASE_URL) {
  return (configured?.trim() || origin + base).replace(/\/+$/, '');
}

export function qrUrl(proteinId?: string, site = siteUrl()) {
  const root = site.replace(/\/+$/, '');
  return proteinId ? root + '/result/' + encodeURIComponent(proteinId) : root + '/';
}
