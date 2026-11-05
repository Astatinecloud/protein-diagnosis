# 16タイプ診断 v2 実装・検証レポート

科学的4文字分類の16タイプへ移行しました。質問9問・選択肢・配点は変更していません。

## 変更ファイル

- `README.md`: 9問・16種類への訂正と4文字分類の説明。
- `src/data/proteins.json`: `design/proteins.json` とバイト単位で一致。
- `src/domain/types.ts`: 新Protein形式とRetiredProtein型。
- `src/domain/scoring.ts`: 旧コサイン類似度の削除。
- `src/domain/resultMapping.ts`: 白色化した4軸の符号による判定。
- `src/domain/whitening.ts`（新規）: 解析的共分散、Jacobi固有値分解、逆平方根、特異時の単位行列。
- `src/domain/typeCode.ts`（新規）: 科学的意味、性格のたとえ、注意書きの共通定義。
- `src/domain/distribution.ts`: 同じ白色化行列で全回答を集計。
- `src/components/Classification.tsx`（新規）: コード・意味・分類注記・注意書き。
- `src/components/RetiredResult.tsx`（新規）: 旧8件の案内。
- `src/components/ResultBody.tsx`: 結果と共有ページの共通分類表示。
- `src/pages/ResultPage.tsx`, `src/pages/SharedResultPage.tsx`, `src/pages/ZukanPage.tsx`: 旧URL対応。図鑑に分類表と分類表示を追加。
- `src/styles.css`: 既存色に合わせた分類表示、375pxを想定した表の固定レイアウト・折り返し。
- `src/export/resultImage.ts`: 4文字コード・意味・たとえ・注記・注意書き。分類文の長さからPNGの高さを計算して重なりを防止。
- `scripts/verify-domain.mjs`: 新判定と5%〜7.5%の範囲を検証。
- `src/domain/domain.test.ts`, `src/components/StructureViewer.test.tsx`: 新データへの更新。
- `src/domain/whitening.test.ts`, `src/domain/fetchStructures.test.ts`, `src/pages/Classification.test.tsx`,
   `src/export/resultImageClassification.test.ts`（新規）: 共分散・分類・旧URL・PNG・画像取得スクリプトのテスト。
- `public/structures/{1bkv,6uui,3i40,8a2r,1jff,2mys,1tsr,1hzh}.jpeg`: 旧8画像の削除。
- `docs/v2-verification.md`（本書）。

`design/`、質問データ、新規12種類の取得済み画像は本作業では編集していません。作業開始時点から存在するdesign/のGit差分は保持しています。依存追加・git commit・外部ネットワークアクセスは行っていません。

`scripts/fetch-structures.mjs` は新形式の `proteins` をそのまま処理できるため、実装変更は不要でした。16件のPDB・assembly・保存先を、ネットワークを使わないモックテストで確認しました。

## 検証結果

| 項目 | 結果 |
|---|---|
| `npm.cmd test` | 13ファイル、148テスト成功 |
| `npm.cmd run lint` | 成功 |
| `npm.cmd run build` | 成功 |
| `BASE_PATH=/protein-diagnosis/` のビルド | 成功 |
| `node scripts/verify-domain.mjs` | 成功、全262,144通りを集計 |
| `git diff --check` | 成功 |
| 共分散 | 全列挙した母共分散と解析式が一致。白色化後は単位行列 |
| フォールバック | 特異・極小固有値時の単位行列、全z=0時の回答符号化を確認 |
| URL・図鑑・PNG | 全16件の結果・共有・図鑑、コード・注記・注意書き、QRリンク、画像パスを検証 |
| 旧URL | 8件×結果・図鑑・共有の案内を確認。共有にはゲームへの導線なし |
| 既存フロー | 9問、回答変更、戻る、回答保持、図鑑の先頭・強調、共有の再プレイ非表示を含め成功 |

375pxでの実ブラウザ表示確認は、ローカルのブラウザ検証接続が利用できず未完了です。CSSでは表を幅100%の固定レイアウトにし、長い名称を折り返しています。PNGはCanvasの描画内容・座標をテストしており、
実画像の目視確認は行っていません。

ビルドはReact Routerの `use client` 指示に関する既存ライブラリの警告のみで成功しました。Nodeの分布検証にはTypeScript除去APIの実験的機能警告があります。

最終の `dist/` は `/protein-diagnosis/` 配信用ビルドです。`404.html` と `.nojekyll` も生成されます。

## 全回答の分布

全262,144通り。すべてのタイプに到達し、5.9032%〜6.5285%で指定の5%〜7.5%以内です。

| コード | ID | 件数 | 割合 |
|---|---|---:|---:|
| ESUH | amylase | 16,452 | 6.2759% |
| ESUX | luciferase | 16,316 | 6.2241% |
| ESTH | catalase | 15,710 | 5.9929% |
| ESTX | rubisco | 16,345 | 6.2351% |
| EBUH | cytochrome-p450 | 16,045 | 6.1207% |
| EBUX | pbp2a | 16,253 | 6.2000% |
| EBTH | atp-synthase | 16,685 | 6.3648% |
| EBTX | photosystem-ii | 16,619 | 6.3396% |
| NSUH | myoglobin | 16,443 | 6.2725% |
| NSUX | gfp | 15,475 | 5.9032% |
| NSTH | hemoglobin | 16,999 | 6.4846% |
| NSTX | hemocyanin | 16,532 | 6.3065% |
| NBUH | rhodopsin | 16,545 | 6.3114% |
| NBUX | ompa | 17,114 | 6.5285% |
| NBTH | aquaporin | 16,575 | 6.3229% |
| NBTX | lh2 | 16,036 | 6.1172% |
