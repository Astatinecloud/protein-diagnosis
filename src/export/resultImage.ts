import type { Protein } from '../domain/types';
import { classificationDisclaimer, codeLabels } from '../domain/typeCode';
import { imageCredit, imagePath } from '../structures/structures';
import { disclaimer } from '../components/Shared';
import { qrUrl } from './urls';

const prohibitedStart = new Set(Array.from('。、」）』】！？'));
const prohibitedEnd = new Set(Array.from('「（『【'));

export function wrapText(text: string, width: number, measure: (text: string) => number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const character of text) {
    if (character === '\n') {
      lines.push(line);
      line = '';
    } else if (line && measure(line + character) > width && !prohibitedStart.has(character)) {
      const last = Array.from(line).at(-1) ?? '';
      if (prohibitedEnd.has(last)) {
        lines.push(line.slice(0, -last.length));
        line = last + character;
      } else {
        lines.push(line);
        line = character;
      }
    } else {
      line += character;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export function limitLines(lines: string[], maximum: number, width: number, measure: (text: string) => number) {
  if (lines.length <= maximum) return lines;
  const result = lines.slice(0, maximum);
  let last = Array.from(result[maximum - 1]);
  while (last.length && measure(last.join('') + '…') > width) last = last.slice(0, -1);
  result[maximum - 1] = last.join('') + '…';
  return result;
}

function loadImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('画像を読み込めませんでした。'));
    image.src = source;
  });
}

export async function createResultImage(protein: Protein): Promise<Blob> {
  await document.fonts.ready;
  const { toDataURL } = await import('qrcode');
  const [structure, qr] = await Promise.all([
    loadImage(imagePath(protein)),
    toDataURL(qrUrl(), { width: 240, margin: 4 }).then(loadImage),
  ]);
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1920;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('画像を作成できませんでした。');
  const ctx = context;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 1080, canvas.height);
  ctx.textBaseline = 'top';

  function text(value: string, y: number, size: number, max: number, color = '#1f2a37', bold = false) {
    ctx.font = `${bold ? '700' : '400'} ${size}px "Noto Sans JP", sans-serif`;
    ctx.fillStyle = color;
    const measure = (line: string) => ctx.measureText(line).width;
    const lines = limitLines(wrapText(value, 936 - size * 2, measure), max, 936 - size * 2, measure);
    lines.forEach((line, index) => ctx.fillText(line, 72, y + index * size * 1.5));
  }

  text('あなたはどのたんぱく質？', 48, 38, 1, '#0f9b8e', true);
  text(`${protein.typeName}タイプ！`, 115, 54, 2, '#0f9b8e', true);
  text(protein.typeCode, 285, 36, 1, '#0f9b8e', true);
  text(`${protein.nameJa} / ${protein.nameEn}`, 355, 29, 2);
  const scale = Math.min(880 / structure.width, 440 / structure.height);
  const width = structure.width * scale;
  const height = structure.height * scale;
  ctx.drawImage(structure, (1080 - width) / 2, 450 + (440 - height) / 2, width, height);
  text(protein.catchCopy, 920, 34, 2, '#6b619f', true);
  text('あなたの特徴 — たとえるなら…', 1035, 28, 1, '#0f9b8e', true);
  text(protein.personality, 1085, 29, 4);
  text('豆知識', 1275, 28, 1, '#0f9b8e', true);
  text(protein.funFact, 1325, 27, 3);
  const science = codeLabels(protein.typeCode).map(label => label.science.replace(/（.*）/u, '')).join('・');
  text(`${protein.typeCode}＝${science}`, 1465, 24, 1);
  text(classificationDisclaimer, 1510, 20, 3);
  ctx.drawImage(qr, 72, 1620, 180, 180);
  ctx.font = '700 30px "Noto Sans JP", sans-serif';
  ctx.fillStyle = '#0f9b8e';
  ctx.fillText('QRで診断してみよう', 300, 1685);
  text(imageCredit(protein), 1810, 16, 3);
  text(disclaimer, 1890, 14, 1);
  return new Promise((resolve, reject) => canvas.toBlob(blob => {
    if (blob) resolve(blob);
    else reject(new Error('PNGを作成できませんでした。'));
  }, 'image/png'));
}
