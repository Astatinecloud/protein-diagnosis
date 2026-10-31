export function assetPath(path: string, base = import.meta.env.BASE_URL): string {
  return base.replace(/\/+$/, '') + '/' + path.replace(/^\/+/, '');
}

export function routerBasename(base = import.meta.env.BASE_URL): string | undefined {
  return base.replace(/\/+$/, '') || undefined;
}
