# Codex への修正依頼（v2 レビュー指摘 #1）

Claude のレビューで見つかった問題。いずれも動作・デザインは変えずに直すこと。

1. 図鑑の分類表（src/pages/ZukanPage.tsx）
   - 左上の見出しセルが「??」になっている。文字化けか仮置きなので「分類」に変更する。
   - 行と列の記号の意味がわからない。表の caption（または表の直下）に凡例を1〜2行で追加する。
     - 行（1・2文字目）: E 酵素 / N 非酵素、B 膜結合 / S 可溶性
     - 列（3・4文字目）: U 単量体 / T 多量体、H ヒトももつ / X ヒトはもたない
     - 文言は src/domain/typeCode.ts の定義から組み立て、重複して書かない。
   - 表の JSX が1行に詰め込まれているので、別コンポーネント（例 ClassificationTable）に切り出して読みやすく整形する。
2. src/pages/ZukanPage.tsx の3行目付近、import 文の途中に BOM（U+FEFF）が入っている。ファイル内の BOM をすべて除去する。src 全体とテストで、ほかのファイルにも BOM がないか確認して除去する。
3. 可読性: 次のファイルは空白・改行・インデントを詰めた書き方になっている。既存コード（例 src/domain/scoring.ts）と同じスタイル（2スペースインデント、演算子の前後に空白、1行1文、意味のある改行）に整形する。ロジックは変えない。
   - src/domain/whitening.ts
   - src/domain/resultMapping.ts の mapResult 内のコード生成部分
   - src/components/Classification.tsx
   - src/components/RetiredResult.tsx
   - ResultPage / SharedResultPage / ZukanPage の retired 判定行（`candidate=>candidate.id===...` 等）と、二重スペース `id={proteinId}  />`
   - 今回追加したテストファイルも同様に整形する。
4. 120文字を超える行がないこと（JSON データを除く）。

## 制約
- ネットワーク不可。依存追加なし。git commit しない。design/ は編集しない。PowerShell では npm.cmd。
- npm test / npm run lint / npm run build（BASE_PATH=/protein-diagnosis/ でも）/ node scripts/verify-domain.mjs がすべて通ること。分布の数値が変わらないこと。
- 完了報告は日本語で、変更ファイルとテスト結果を含める。
