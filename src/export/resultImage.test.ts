import { expect, it } from 'vitest';
import { limitLines, wrapText } from './resultImage';
import { qrUrl, siteUrl } from './urls';

const measure = (text: string) => Array.from(text).length;

it('wraps Japanese characters, newlines and surrogate pairs', () => {
  expect(wrapText('あいうえお', 2, measure)).toEqual(['あい', 'うえ', 'お']);
  expect(wrapText('あ\nいう', 2, measure)).toEqual(['あ', 'いう']);
  expect(wrapText('😀あい', 2, measure)).toEqual(['😀あ', 'い']);
  expect(wrapText('', 2, measure)).toEqual([]);
});

it('keeps closing punctuation off the beginning and opening brackets off the end', () => {
  expect(wrapText('あい。うえ」、お', 2, measure)).toEqual(['あい。', 'うえ」、', 'お']);
  expect(wrapText('あ「いう', 2, measure)).toEqual(['あ', '「い', 'う']);
});

it('truncates with a fitting ellipsis only when necessary', () => {
  expect(limitLines(['あいう', 'えおか', 'きく'], 2, 3, measure)).toEqual(['あいう', 'えお…']);
  expect(limitLines(['あい'], 2, 3, measure)).toEqual(['あい']);
});

it('builds top and result URLs with a configured site or origin fallback', () => {
  expect(siteUrl(' https://example.com/path/// ', 'http://localhost')).toBe('https://example.com/path');
  expect(siteUrl('', 'http://localhost:5173')).toBe('http://localhost:5173');
  expect(qrUrl(undefined, 'https://example.com')).toBe('https://example.com/');
  expect(qrUrl('gfp', 'https://example.com')).toBe('https://example.com/result/gfp');
});
