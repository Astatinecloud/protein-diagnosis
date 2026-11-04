import { afterEach, expect, it, vi } from 'vitest';
import data from '../data/proteins.json';
import { createResultImage } from './resultImage';
import { imagePath } from '../structures/structures';
import { classificationDisclaimer, codeLabels } from '../domain/typeCode';

vi.mock('qrcode', () => ({ toDataURL: vi.fn().mockResolvedValue('data:image/png;base64,qr') }));

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it.each(data.proteins)('exports $typeCode at 1080×1920 without overlapping content', async (protein) => {
  const sources: string[] = [];
  vi.stubGlobal('Image', class {
    width = 400;
    height = 400;
    onload?: () => void;
    set src(value: string) {
      sources.push(value);
      queueMicrotask(() => this.onload?.());
    }
  });
  Object.defineProperty(document, 'fonts', { configurable: true, value: { ready: Promise.resolve() } });
  const drawn: {
    text: string;
    x: number;
    y: number;
    width: number;
    height: number;
  }[] = [];
  const context = {
    font: '',
    textBaseline: '',
    fillRect: vi.fn(),
    drawImage: vi.fn(),
    measureText: (value: string) => ({
      width: Array.from(value).length * Number(context.font.match(/(\d+)px/)![1]),
    }),
    fillText: (text: string, x: number, y: number) => drawn.push({
      text, x, y, width: context.measureText(text).width,
      height: Number(context.font.match(/(\d+)px/)![1]) * 1.5,
    }),
  };
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context as never);
  vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(function (this: HTMLCanvasElement, callback) {
    expect(this.width).toBe(1080);
    expect(this.height).toBe(1920);
    callback(new Blob(['png'], { type: 'image/png' }));
  });
  const blob = await createResultImage(protein);
  expect(blob.type).toBe('image/png');
  expect(sources[0]).toBe(imagePath(protein));
  const code = drawn.find(item => item.text === protein.typeCode)!;
  const name = drawn.find(item => item.text.startsWith(protein.nameJa))!;
  expect(code).toBeTruthy();
  expect(name.y - code.y).toBeGreaterThanOrEqual(50);
  expect(context.textBaseline).toBe('top');
  const regions = [
    ...drawn,
    ...context.drawImage.mock.calls.map(([, x, y, width, height]) => ({ x, y, width, height })),
  ];
  for (const [index, region] of regions.entries()) {
    expect(region.x).toBeGreaterThanOrEqual(0);
    expect(region.y).toBeGreaterThanOrEqual(0);
    expect(region.x + region.width).toBeLessThanOrEqual(1080);
    expect(region.y + region.height).toBeLessThanOrEqual(1920);
    for (const other of regions.slice(index + 1)) {
      expect(region.x + region.width <= other.x || other.x + other.width <= region.x ||
        region.y + region.height <= other.y || other.y + other.height <= region.y).toBe(true);
    }
  }
  const allText = drawn.map(item => item.text).join('');
  expect(allText).toContain(classificationDisclaimer);
  for (const label of codeLabels(protein.typeCode)) {
    expect(allText).toContain(label.science.replace(/（.*）/u, ''));
  }
  if (protein.classificationNote)
    expect(allText).not.toContain(protein.classificationNote);
});
