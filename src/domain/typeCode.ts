export const classificationDisclaimer = '4文字はたんぱく質の実際の性質による分類です。あなたの性格との結びつきはゲーム上のたとえで、科学的な性格検査ではありません。';
export const typeLetters = {
  E: ['酵素（主な働きが化学反応の触媒）', '自分から変化を起こす'],
  N: ['非酵素', 'ぶれずに役目を果たす'],
  B: ['膜結合', '境界で見極める・守る'],
  S: ['可溶性', 'どこへでも溶け込む'],
  U: ['単量体', 'ひとりでやりきる'],
  T: ['多量体', '仲間と組む'],
  H: ['ヒトももつ', '身近な人を支える'],
  X: ['ヒトはもたない', '個性で勝負する'],
} as const;
export const codeLabels = (code: string) => Array.from(code, letter => ({
  letter,
  science: typeLetters[letter as keyof typeof typeLetters][0],
  personality: typeLetters[letter as keyof typeof typeLetters][1],
}));
