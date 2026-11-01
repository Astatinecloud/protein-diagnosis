import { afterEach, describe, expect, it, vi } from 'vitest';
import { assetPath, routerBasename } from './paths';
import { imagePath } from './structures/structures';
import proteins from './data/proteins.json';
import { siteUrl, qrUrl, shareUrl } from './export/urls';

afterEach(() => vi.unstubAllEnvs());

it.each(proteins.proteins)('builds the current GitHub Pages share URL for $id', protein => {
  vi.stubEnv('BASE_URL', '/protein-diagnosis/');
  for (const configured of [undefined, '', ' \t ']) {
    vi.stubEnv('VITE_PUBLIC_SITE_URL', configured);
    const site = siteUrl(undefined, 'https://astatinecloud.github.io');
    expect(shareUrl(protein.id, site)).toBe(
      `https://astatinecloud.github.io/protein-diagnosis/?result=${protein.id}`,
    );
  }
});

describe.each(['/', '/protein-diagnosis/'])('base %s', base => {
  it('uses the base for public images and Molstar assets', () => {
    vi.stubEnv('BASE_URL', base);
    for (const path of ['structures/1gfl.jpeg', 'molstar/molstar.js', 'molstar/molstar.css']) {
      expect(assetPath(path)).toBe(base + path);
      expect(assetPath('/' + path)).toBe(base + path);
    }
    expect(imagePath(proteins.proteins[0])).toBe(base + 'structures/' + proteins.proteins[0].structure.pdbId.toLowerCase() + '.jpeg');
    expect(routerBasename()).toBe(base === '/' ? undefined : '/protein-diagnosis');
  });
  it('builds fallback top and result URLs from origin and base', () => {
    vi.stubEnv('BASE_URL', base);
    vi.stubEnv('VITE_PUBLIC_SITE_URL', '');
    expect(qrUrl()).toBe(window.location.origin + base);
    expect(shareUrl('gfp')).toBe(window.location.origin + base + '?result=gfp');
    expect(qrUrl('gfp')).toBe(window.location.origin + base + 'result/gfp');
    expect(siteUrl(' ', 'https://example.com')).toBe(('https://example.com' + base).replace(/\/+$/, ''));
  });
  it.each(['https://example.com/custom', 'https://example.com/custom/'])('honors configured site %s', configured => {
    const site = siteUrl(configured, 'https://ignored.com', base);
    vi.stubEnv('BASE_URL', base);
    vi.stubEnv('VITE_PUBLIC_SITE_URL', configured);
    expect(shareUrl('gfp')).toBe('https://example.com/custom/?result=gfp');
    expect(shareUrl('a/b &', configured + '//')).toBe('https://example.com/custom/?result=a%2Fb%20%26');
    expect(qrUrl(undefined, site)).toBe('https://example.com/custom/');
    expect(qrUrl('a/b', configured)).toBe('https://example.com/custom/result/a%2Fb');
  });
});
