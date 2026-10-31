# 「あなたはどのたんぱく質？」設計書（Claude作成）

早稲田祭向けの診断Webアプリ。8問の4択に答えると、12種類のたんぱく質のどれに近いかを診断する。
設計・検証はClaude、実装・修正・テスト実行はCodexが担当する。

- 質問データ（確定版）: `design/questions.json`
- たんぱく質データ（確定版）: `design/proteins.json`

この2ファイルの文言・数値は Claude が設計・検証済み。実装時は **内容を変えずに** `src/data/` へコピーして使うこと。

---

## 1. 技術構成

| 項目 | 採用 |
|---|---|
| ビルド | Vite + React 18 + TypeScript（strict） |
| ルーティング | react-router-dom（BrowserRouter） |
| スタイル | 素のCSS（CSS変数 + CSS Modules または単一の `styles.css`）。Tailwindは使わない |
| テスト | Vitest + @testing-library/react + jsdom |
| QRコード | `qrcode` |
| PNG出力 | Canvas 2D API で直接描画（html2canvas等は使わない） |
| 3D表示 | `molstar`（**動的importで遅延読み込み**し、初期バンドルに含めない） |
| ホスティング | Vercel（静的サイト、SPAリライト） |

依存は上記に限定する。バックエンドなし。Node 24 / npm 11 で動くこと（このPCにPythonは無い）。

## 2. ディレクトリ構成

```
src/
  data/questions.json        design/questions.json のコピー（初期設定）
  data/proteins.json         design/proteins.json のコピー
  domain/traits.ts           特性8種の定義（キー・日本語ラベル）
  domain/types.ts            Question / Option / Protein などの型
  domain/validation.ts       質問データの検証（エラー一覧を返す。例外を投げない）
  domain/scoring.ts          回答→特性ベクトル、正規化
  domain/resultMapping.ts    特性ベクトル→たんぱく質の判定
  domain/distribution.ts     65,536通りの全列挙と分布集計
  structures/structures.ts   構造画像パス・RCSB URL・出典文字列の生成
  state/questionStore.ts     有効な質問セットの取得（初期設定 or localStorage）
  admin/                     管理画面（/admin）
  components/                画面・部品
  pages/ TopPage, QuizPage, DiagnosingPage(演出), ResultPage, NotFoundPage
public/structures/<pdbid>.jpeg  構造画像（ローカル保存）
scripts/fetch-structures.mjs    構造画像の取得スクリプト
```

## 3. 特性（trait）

8種。キーは英語、表示は日本語。

| key | 表示名 |
|---|---|
| action | 行動力 |
| harmony | 協調性 |
| support | 支援性 |
| steady | 安定性 |
| flexible | 柔軟性 |
| express | 発信力 |
| curious | 探究心 |
| guard | 守備力 |

## 4. 診断アルゴリズム（厳守）

質問セット Q（8問×4択）、各選択肢の `scores`（特性→数値。未記載は0）、各たんぱく質の `profile`（8特性の数値）を使う。

1. **生スコア** `u[d]` = 選んだ8つの選択肢の `scores[d]` の合計。
2. **期待値と標準偏差**（質問セットから毎回計算。回答の一様ランダムを仮定）
   - `mu[d] = Σ_q mean_{o∈q}(score_o[d])`
   - `sd[d] = sqrt( Σ_q var_{o∈q}(score_o[d]) )`（母分散。4択の平均からの二乗偏差の平均）
   - `sd[d] === 0` のときは `1` とみなす（ゼロ除算防止）。
3. **正規化** `z[d] = (u[d] - mu[d]) / sd[d]`
4. **類似度** 各たんぱく質 j について コサイン類似度 `cos(z, profile_j)`。
5. **判定** 類似度が最大のたんぱく質。差が `1e-9` 以内の同点は `proteins.json` の並び順で先のものを採用（決定的）。
6. **退化ケース** `|z| === 0`（全特性が期待値ちょうど）の場合は、回答インデックス列から決定的に選ぶ:
   `index = (Σ_q answer_q × 4^q) mod 12` 番目のたんぱく質。
7. **不正値の扱い**: スコアが数値でない／NaN／Infinity の場合は 0 として扱う。未知の特性キーは無視。計算全体が例外を投げないこと。

この方式は質問文や点数を編集しても「平均的な回答者からのずれ」で比較するため、特定の特性が多く出る質問セットでも偏りにくい。

**設計時の検証結果**（Claudeが確認済み）: 初期データで全65,536通りを列挙すると各たんぱく質 7.89%〜8.77%（理想 8.33%）。全12種に到達可能。実装後、テストで同じ分布になることを確認する。

| id | 割合 |
|---|---|
| hemoglobin | 8.70% |
| collagen | 8.76% |
| keratin | 7.97% |
| insulin | 7.89% |
| actin | 8.61% |
| tubulin | 8.58% |
| gfp | 8.71% |
| myosin | 7.89% |
| p53 | 8.07% |
| igg | 7.89% |
| atp-synthase | 8.77% |
| rhodopsin | 8.16% |

## 5. 質問データの検証（validation.ts）

`validateQuestionSet(data: unknown): { ok: boolean; errors: string[]; value?: QuestionSet }`

- 質問はちょうど8問。各質問の選択肢はちょうど4つ。
- 質問文・選択肢ラベルは空白以外の文字を含む。長さ上限: 質問文 80文字、選択肢 40文字。
- id は質問・選択肢で一意。
- scores の値は有限の数値で -5〜5 の範囲。未知の特性キーはエラー。
- 全選択肢で scores がすべて0（または空）の質問はエラー（診断に寄与しないため）。
- エラーメッセージは日本語で、どの質問・選択肢かがわかる形（例: 「Q3 の選択肢C: スコア “guard” が範囲外です（9）」）。

## 6. 画面仕様

### 共通デザイン

- 白基調。アクセント: 青緑 `#0f9b8e`、淡い紫 `#8b7fd6`。本文 `#1f2a37`。背景 `#ffffff` / セクション `#f5f8fa`。
- 日本語フォント: Google Fonts の "Noto Sans JP"（400/700）、フォールバックにシステムフォント。
- 角丸 12〜16px、余白多め。コミック風・デフォルメのマスコットは使わない。
- 装飾は「アミノ酸の鎖（点を線でつないだもの）」や「らせん」をSVGで控えめに描く。
- アニメーションは 200〜400ms 程度。`prefers-reduced-motion: reduce` のときは無効化。
- スマホ幅 360px で横スクロールなし。ボタンの高さは最低 48px。

### STEP1 トップ（`/`）

- タイトル「あなたはどのたんぱく質？」
- サブタイトル「8つの質問から、あなたのたんぱく質タイプを診断！」
- 説明1〜2行と、所要時間の目安「約1〜2分」。
- 「診断スタート」ボタン → `/quiz`
- 小さな注記:「この診断は、たんぱく質の働きを性格にたとえて楽しむエンターテインメントです。科学的な性格検査ではありません。」
- 「このサイトのQRコード」ボタン → サイトURLのQRをモーダル表示（ブース掲示用）。

### STEP2 質問（`/quiz`）

- 1画面1問。上部に「Q3 / 8」と進捗バー。
- 選択肢は A〜D のラベル付き大ボタン（縦並び）。
- 選択すると選択状態を一瞬表示（約250ms）してから次の問題へスライド遷移。
- 「戻る」ボタンで前の問題へ。前に選んだ選択肢がハイライトされており、別の選択肢を押すと回答が上書きされる。
- 8問すべて回答した時点で `/diagnosing` 演出へ。**8問未回答のまま結果へ進む手段はない**（URLを直接開いても、回答が揃っていなければ `/quiz` に戻す）。
- 回答状態はメモリ（React state / context）で保持。ページ再読み込みで回答が消えるのは可。

### STEP3 診断中演出

- 約1.5秒。アミノ酸の鎖が折りたたまれていくような簡単なSVG/CSSアニメーションと「あなたのたんぱく質を解析中…」。
- 完了後 `/result/<proteinId>` へ `replace` で遷移（戻るボタンで演出に戻らない）。

### STEP4 結果（`/result/:proteinId`）

URLにはたんぱく質IDのみを含める（回答や個人情報は含めない）。他端末で開いても同じ結果ページが表示される。未知のIDは「結果が見つかりません」とトップへのリンク。

表示順:
1. 「あなたは」＋大きく「◯◯タイプ！」（typeName）
2. たんぱく質名（日本語・英語）
3. 構造画像（大きく、画面の主役。フェードイン＋わずかなスケール）
4. キャッチコピー
5. 「あなたの特徴」（personality）— 見出しに「たとえるなら…」と添え、擬人化パートだと明示
6. 長所・弱点（2カラム、スマホは縦積み）
7. 「本物の◯◯はこんなたんぱく質」（biology）＋「豆知識」（funFact）— 科学パートは背景色を変えて擬人化パートと明確に区別
8. 構造データ: PDB ID（RCSBへのリンク）、説明、生物種、手法、分解能、「実験で決定された構造」の表示、注記（note）、引用（citation）、画像クレジット
9. 「立体構造を動かしてみる」ボタン（3Dビューワー）
10. 「結果画像を保存」ボタン（PNG）
11. この結果ページのQRコード
12. 「もう一度診断する」→ 回答をリセットして `/`
13. フッターに免責注記（トップと同じ文）

**友達との相性診断機能は作らない。**

### 構造画像

- 出典: RCSB PDB の構造画像 `https://cdn.rcsb.org/images/structures/<id[1..2]>/<id>/<id>_assembly-<assemblyId>.jpeg`（小文字ID。例: 4hhb → `hh/4hhb/4hhb_assembly-1.jpeg`）。Mol*で描画された、生物学的集合体のカートゥーン表示画像。
- `scripts/fetch-structures.mjs` でダウンロードして `public/structures/<pdbid小文字>.jpeg` に保存し、**アプリはローカルの画像のみを読む**（実行時にcdn.rcsb.orgへアクセスしない。PNG出力でcanvasが汚染されないため）。
- 利用条件: RCSB PDBのデータと構造画像は CC0。ただし出典表示が推奨されているので、結果画面に次を表示する:
  「構造画像: RCSB PDB (RCSB.org) — PDB ID <ID>（<citation>）。Mol* (Sehnal et al., 2021) で描画。」
- AI生成画像や架空の構造は使わない。

### 3Dビューワー

- 「立体構造を動かしてみる」を押したときに初めて `molstar` を動的importし、モーダル（全画面に近い）内に表示。
- 読み込むデータ: `https://models.rcsb.org/<id小文字>.bcif`（BinaryCIF）。可能なら構造画像と同じ生物学的集合体（assemblyId）を表示。
- 回転・拡大縮小ができること。閉じるボタンあり。
- 読み込み失敗時やWebGL非対応時は、エラーメッセージと「RCSB PDBで見る」リンク（`https://www.rcsb.org/3d-view/<ID>/<assemblyId>` と `https://www.rcsb.org/structure/<ID>`）を表示。モーダル内には常にこのリンクも置く。

### 結果画像（PNG）

- 1080×1920 の縦長。Canvas 2D で描画し `<proteinId>-result.png` としてダウンロード。
- 含める内容: タイトル「あなたはどのたんぱく質？」、「◯◯タイプ！」、たんぱく質名（日英）、構造画像（大きく）、キャッチコピー、性格の説明（personality、長ければ省略記号付きで最大4行）、豆知識（funFact、最大3行）、サイトのQRコード（トップURL）と「QRで診断してみよう」、PDB IDと画像クレジット、免責の一文。
- 日本語の折り返しは文字単位で canvas 幅に収める処理を実装（禁則処理は簡易でよい：行頭の「。、」」）」を前行に送る）。
- フォント読み込み完了（`document.fonts.ready`）を待ってから描画。
- iOS Safari ではダウンロード属性が効かない場合があるため、失敗時は画像を新しいタブ／モーダルで表示し「長押しで保存」と案内する。

### QRコード

- 公開URLは環境変数 `VITE_PUBLIC_SITE_URL` を優先し、未設定なら `window.location.origin`。
- 結果画面のQR: `<site>/result/<proteinId>`。トップのQR・PNG内のQR: `<site>/`。

### 管理画面（`/admin`）

**本番ビルドでは含めない。** `import.meta.env.DEV || import.meta.env.VITE_ENABLE_ADMIN === 'true'` のときだけ `/admin` ルートを登録し、管理画面のコードは動的importにする。それ以外では `/admin` は NotFound。URLを隠すことを認証とはみなさないため、公開サイトには管理機能そのものを載せない設計とする。READMEに「管理画面は `npm run dev`（ローカル）で使う」と明記。

機能:
- 質問一覧（8問）。各質問の質問文、4つの選択肢ラベル、選択肢ごとの8特性スコア（数値入力。-5〜5）を編集。
- 質問の並び替え（上へ／下へボタン。ドラッグは不要）。
- 「保存」: 検証が通ったときだけ localStorage（キー `protein-quiz.questions.v1`）に保存。検証エラーは一覧表示し、保存しない。
- 「変更を取り消す」: 最後に保存した状態に戻す。
- 「初期設定に戻す」: 確認ダイアログの後、localStorageを削除して `src/data/questions.json` の内容に戻す。
- 「JSONエクスポート」: 現在の編集内容を `questions.json` としてダウンロード。
- 「JSONインポート」: ファイルを読み込み、検証してから編集中データに反映（保存は別操作）。不正なJSONはエラー表示。
- 「プレビュー」: 編集中データで診断画面を試せる（`/quiz?preview=1` など、管理画面が有効なビルドのみ）。
- 「結果分布を確認」: 編集中データで65,536通りを列挙し、12種の割合を表で表示。到達不能（0%）は赤、4%未満・16%超は黄色で警告。
- 「変更を反映するには、エクスポートしたJSONで `src/data/questions.json` を置き換えて再デプロイ」と画面に説明を表示。

**質問データの読み込み元**: 管理画面が有効なビルドでは localStorage の保存データ（検証が通る場合のみ）→ なければ初期設定。管理画面が無効な本番ビルドでは常に `src/data/questions.json`。localStorage のデータが壊れていても例外で落ちず、初期設定にフォールバックする。

## 7. テスト要件（Vitest）

最低限、以下を自動テストにする。

- scoring / resultMapping
  - 同じ回答 → 同じ結果（決定性）
  - 回答を1問変えると生スコアが再計算される
  - NaN・文字列・Infinity のスコア、未知キーで例外を投げない
  - sd=0 の特性があっても動く
  - 8問未満の回答では結果関数が `null`（またはエラー値）を返す
- distribution
  - 初期データで65,536通りを列挙し、全12種が到達可能、かつ各割合が 4%〜16% の範囲
  - 設計書の表と一致（各値 ±0.01%）
- validation
  - 初期データが ok、7問・選択肢3つ・空文字・範囲外・未知キー・重複IDでエラー
- questionStore
  - 壊れたlocalStorageデータで初期設定にフォールバック
- UI（testing-library）
  - 8問表示され、戻る・回答変更ができ、8問回答で結果に到達する
  - `/result/gfp` を直接開くと GFP の結果が表示される
  - 結果ページに「相性」という語を含む機能が存在しない

`npm test` で全テストが通ること。`npm run build` と `npm run lint`（tsc --noEmit で可）も通ること。

## 8. デプロイ（Phase 6）

- `vercel.json` に SPA リライト（すべてのパスを `/index.html` に。ただし `/structures/*` などの静的ファイルはそのまま）。
- 再読み込み・結果URLの直接アクセスで404にならないこと。
- 実際のデプロイ（`vercel` コマンド）はユーザーの許可を得てから行う。

## 9. 開発フェーズ

- Phase 2（基礎）: プロジェクト構築、データ取り込み、domain一式、トップ・質問・演出・基本的な結果画面（テキストと構造画像）、構造画像の取得、テスト。
- Phase 4（拡張）: 管理画面、Mol* 3D表示、PNG出力、QRコード、レスポンシブ仕上げ、Vercel設定、README。
