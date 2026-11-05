# Codex への依頼: NBTX をスパイクたんぱく質から LH2 に差し替える

ユーザーの希望で、NBTX（非酵素・膜結合・多量体・ヒトはもたない）のたんぱく質を
スパイクたんぱく質（id `spike`, PDB 6VXX）から光捕集複合体LH2（id `lh2`, PDB 1NKZ）に差し替える。

- 確定データ: design/proteins.json（Claude が更新済み。proteins 16件、retired 9件で `spike` を追加）。design/ は編集しないこと。
- 構造画像 public/structures/1nkz.jpeg は Claude が RCSB から取得済み。

## 実装内容

1. src/data/proteins.json を design/proteins.json と完全一致させる。
2. 使われなくなった public/structures/6vxx.jpeg を削除する。
3. テストの retired 件数（src/domain/whitening.test.ts の `toHaveLength(8)` など）を、直書きせずデータに合わせる
   （例: 9件であること、または proteins と重複しないこと・画像がないことの検証で十分なら件数の直書きをやめる）。
   ほかに spike / 6VXX / 件数を直書きしているテストやコードがあれば同様に直す。
4. `/result/spike`、`/result/spike/zukan`、`/?result=spike` で「スパイクたんぱく質は診断のリニューアルで入れ替わりました」が出ることをテストで確認する
   （既存の retired テストがデータ駆動で全件を回しているならそれでよい）。
5. lh2 の結果ページ・共有ページ・図鑑カード・分類表のマス・PNG（1080×1920、重なりなし）が既存の16種類共通テストで通ること。
6. docs/v2-verification.md の分布表の spike 行を、`node scripts/verify-domain.mjs` の実際の出力に合わせて lh2 に更新する（分布の数値は変わらないはず）。

## 制約
- ネットワーク不可。依存追加なし。git commit しない。design/ と docs/codex-history.md・docs/verification-report.md は編集しない。PowerShell では npm.cmd。
- コードは既存の書き方（2スペースインデント、120文字以内）で。BOM を入れない。
- npm test / npm run lint / npm run build（BASE_PATH=/protein-diagnosis/ でも）/ node scripts/verify-domain.mjs がすべて通ること。
- 完了報告は日本語で、変更ファイルとテスト結果・分布出力を含める。
