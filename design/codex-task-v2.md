# Codex への依頼: 16タイプ診断（v2）の実装

診断アプリ「あなたはどのたんぱく質？」（Vite+React+TS、GitHub Pages）を、科学的4文字分類による16タイプ診断に移行する。

- 設計書: design/16-types-proposal.md（必ず全文を読むこと）
- 確定データ: design/proteins.json（version 2: proteins 16件＋retired 8件）
- design/ は編集しないこと。
- 新規12種類の構造画像は Claude が public/structures/ に取得済み（1smd 2d1s 1dgf 8ruc 1tqn 1vqq 3wu2 1a6m 1hcy 1bxw 1j4n 6vxx）。

## 実装内容

1. データ
   - src/data/proteins.json を design/proteins.json と完全一致させる。
   - types.ts の Protein 型を新形式に（typeCode と classificationNote を追加、profile を削除）。retired の型も追加。
   - 外れた8種類の画像（1bkv 6uui 3i40 8a2r 1jff 2mys 1tsr 1hzh）を public/structures から削除。
   - scripts/fetch-structures.mjs が新データでも動くこと。
2. 判定アルゴリズム（設計書4章）
   - 質問・配点・z 標準化は現行のまま。
   - 軸スコア d = [z.action - z.steady, z.guard - z.flexible, z.curious - z.harmony, z.support - z.express]。文字は [E/N, B/S, U/T, H/X]（正なら左）。
   - d の共分散行列 Σ を質問データから解析的に計算する（各質問の4択が等確率で、質問間は独立。質問ごとの共分散の和。z の線形変換を考慮）。
   - 依存なしの対称行列固有値分解（Jacobi 法など）で Σ^(-1/2) を求め、d' = Σ^(-1/2) d の符号でコードを決める。
   - Σ が特異（最小固有値が極小）なら単位行列を使う。全特性 z=0 なら (Σ answer_q * 4^q) mod 16 番目のたんぱく質。
   - コードと typeCode が一致するたんぱく質を返す。同じ回答なら必ず同じ結果。
   - 旧 profile とコサイン類似度のコードは削除。distribution（管理画面）も新判定で16種類。
3. 4文字の表示用定義を1か所に（例 src/domain/typeCode.ts）
   - 科学的意味: E 酵素（主な働きが化学反応の触媒）/ N 非酵素 / B 膜結合 / S 可溶性 / U 単量体 / T 多量体 / H ヒトももつ / X ヒトはもたない。
   - 性格のたとえ: E 自分から変化を起こす / N ぶれずに役目を果たす / B 境界で見極める・守る / S どこへでも溶け込む / U ひとりでやりきる / T 仲間と組む / H 身近な人を支える / X 個性で勝負する。
4. 画面
   - 結果ページと共有ページ（?result=）: 共通の ResultBody で、タイプ名の近くに4文字コードを大きく表示する。あわせて、4文字それぞれの科学的意味と性格のたとえの一覧、classificationNote（空でなければ）、次の注意書きを表示する。「4文字はたんぱく質の実際の性質による分類です。あなたの性格との結びつきはゲーム上のたとえで、科学的な性格検査ではありません。」
   - 結果画像 PNG（src/export/resultImage.ts）に4文字コードを追加（レイアウトを崩さない）。
   - 図鑑:
     - 4x4 の分類表を一覧の上に追加する。行は ES, EB, NS, NB、列は UH, UX, TH, TX。各マスにコードとたんぱく質名を表示し、クリックやタップで該当カードへスクロール。自分の結果のマスを強調する。
     - カードにコード、4つの性質ラベル、classificationNote を表示する。
     - 既存の「自分の結果を先頭・強調」「診断結果に戻る」は維持する。
     - 幅375pxで横スクロールしないこと（表は縮小やコンパクト表示で対応）。
   - 外れた8種類の旧URL
     - /result/<retiredId> と /result/<retiredId>/zukan では「（和名）は診断のリニューアルで入れ替わりました」と「トップへ」ボタンを表示する。
     - ?result=<retiredId> では同じ文言だけを表示する（ゲームへの導線なし）。
     - 未知IDは従来のエラー表示。
   - トップやヘッダーの数（16種類、16 PROTEINS）はデータから算出する既存の仕組みのまま。トップの文言は変更しない。
5. README.md: 「8問の4択から12種類」を実データ（9問・16種類）に修正し、4文字分類の説明を短く追記する（design/ 内の文書は編集しない）。
6. テスト（Vitest）
   - 16 個の typeCode が16通りを重複・欠落なく覆う。retired の id が proteins と重複しない。
   - 全 4^9 通りを列挙して16種類すべてに到達し、各 5%〜7.5% に収まる（verify-domain.mjs でも分布を出力）。同じ回答なら同じ結果。9問未満なら null。
   - 白色化の単体テスト: Σ の解析計算が全列挙の共分散と一致する。特異時の単位行列フォールバック。z が全0のときのフォールバック。
   - 16種類それぞれで、/result/<id>、/?result=<id>、図鑑カード、画像パス、QRリンク（shareUrl）が正しい。4文字の表示と注意書きがある。
   - retired 8件の旧URLの表示。未知ID。
   - 既存テスト（9問フロー、戻る、図鑑の並び、共有ページに再プレイ導線がない等）を新データに合わせて更新し、すべて通す。

## 制約

- ネットワーク不可。依存は追加しない。git commit しない。PowerShell では npm.cmd を使う。
- npm test / npm run lint / npm run build（BASE_PATH=/protein-diagnosis/ でも）/ node scripts/verify-domain.mjs がすべて通ること。
- デザイン（白背景・アクセントカラー・余白・ボタン形状）を踏襲し、不要な装飾やアニメーションは追加しない。
- 完了報告は日本語で、変更ファイル一覧・要点・テスト結果・分布出力を含める。
