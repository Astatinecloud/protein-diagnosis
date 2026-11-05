# Codex 実装・修正履歴

Codex への依頼はすべて Claude Code の Codex プラグイン（`codex:codex-rescue` → `codex-companion.mjs task`）経由で行った。
Claude は設計データ（`design/`）とドキュメント（`docs/`）のみを作成し、`src/` などの実装コードは Codex が作成・修正した。

| # | フェーズ | 依頼内容 | Codexの結果 | Claudeの検証 |
|---|---|---|---|---|
| 1 | Phase 2 | 基礎実装（構築・domain・4画面・構造画像取得スクリプト・テスト） | 実装完了。ただしCodexのサンドボックスはネットワーク不可のため npm install / 画像取得 / テストを実行できず | Claudeが npm install と画像取得を実行。テスト29件成功、分布は設計と一致。lint/build 失敗、依存の脆弱性、コードの可読性に問題 → 修正依頼 #2 |
| 2 | Phase 3 | 修正: (1) テストの型エラーで lint/build 失敗 (2) react-router 6 / vitest の既知脆弱性 (3) 1行に圧縮されたコードの整形と ResultPage の分割 3点とも修正。package.json の依存バージョンを更新（インストールはClaude） | Claudeが npm install 後に再検証: 脆弱性0件、テスト29件成功、lint/build 成功、120文字超の行なし、ブラウザで診断フロー回帰なし → 合格 |
| 3 | Phase 4 | 機能拡張（管理画面、Mol* 3D表示、PNG出力、QRコード、レスポンシブ、vercel.json、README、テスト） 8項目を実装。テスト38件・lint・build成功と報告 | Claudeが再実行して確認: テスト38件成功、lint/build成功、本番JSに管理画面の文字列なし、Mol*は遅延読み込み。ブラウザで3D表示・PNG(1080×1920)・QR・管理画面の全機能・壊れたlocalStorageからの復帰を確認。問題2件: ATP合成酵素の6ZPO画像が表面表示（Cartoonでない）、vercel.json等にBOM → 修正依頼 #4 |
| 4 | Phase 5 | 修正: (1) ATP合成酵素を1QO1に差し替え（設計データはClaudeが変更済み）(2) BOM除去 | 両方修正。テスト・lint・build成功と報告 | Claudeが1QO1画像を取得し再検証: データ一致、6ZPOの参照なし、BOMなし、テスト38件・lint・build成功。本番ビルドで /admin が「ページが見つかりません」、/result/atp-synthase に直接アクセスして1QO1画像を表示 → 合格 |
| 5 | Phase 6 | GitHub Pages（サブパス配信）対応: BASE_PATH による base 設定、Router の basename、静的ファイル参照を BASE_URL 基準に、QR用URLのサブパス対応、404.html / .nojekyll 生成、Pages 用 GitHub Actions、テスト追加 | 9項目を実装。テスト46件・lint・build（ルート／サブパス両方）成功と報告 | Claudeが再実行: テスト46件・lint成功、`BASE_PATH=/protein-diagnosis/` でビルドし GitHub Pages 相当のサーバ（サブパス＋404.html）で確認。結果URL直接アクセス、構造画像、QRのURL、8問→結果、Mol*（p53）表示、管理画面がビルドに含まれないことを確認 → 合格 |
| 6 | 運用 | ユーザー要望で Q3 を「受験で選ぶ私立大学は？」（早稲田／オックスフォード／MIT／延世）に変更。設計データは Claude が変更（配点の組み合わせは旧Q3と同じものを振り分け）、`src/data` への反映を依頼 | 反映完了。旧文言の参照なし。テスト46件・lint・build 成功と報告 | Claudeが再実行: データ完全一致、テスト46件・lint成功、全65,536通りの分布は変更前と同一（7.89〜8.77%） → 合格 |
| 7 | 総合修正 | 9問化（Q3のD→ハーバード、Q6をレポートの質問に差し替え、Q7のD→爆炎魔法使い、Q8に油そばを新設、旧Q8→Q9。旧スマホ質問は削除）、問数の直書き撤廃、タンパク質図鑑（`/result/:id/zukan`）。設計データ（配点・図鑑文章）は Claude が作成 | 実装完了。テスト51件・lint・build・verify-domain 成功 | Claudeが再実行: データ完全一致、テスト51件・lint成功、全262,144通りで全12種に到達（7.27〜8.82%、設計時のシミュレーションと一致）。ブラウザでスマホ幅・PC幅の9問フロー、戻るでの回答保持、図鑑（自分の結果が先頭・強調、1列/3列、横スクロールなし）、図鑑→結果へ戻っても回答保持を確認 → 合格（再修正なし） |
| 8 | 追加機能 | 結果QRを共有専用URL `/?result=<id>` に変更し、結果だけを表示する共有ページを追加（設問・再プレイ・図鑑・QR・ヘッダーのリンクなし、存在しないIDはエラー表示）。結果本文を ResultBody に共通化。PNG内とトップのQRはサイトURLのまま | 実装完了。テスト68件・lint・build・verify-domain 成功 | Claudeが再実行: テスト68件・lint成功。ブラウザでPCの結果ページのQRリンクが `/?result=gfp`、PC側の図鑑・再プレイボタンは維持。スマホ幅の共有ページで名称・画像・タイプ・機能・出典・3D/画像保存を表示し、ゲームへの導線なし・横スクロールなし。`?result=nope` でエラー表示 → 合格（再修正なし） |
| 9 | URL修正 | GitHubユーザー名変更（tomoalemon-cloud → Astatinecloud）で共有URL・QRに旧ドメインが残った。原因はワークフローがビルド時に VITE_PUBLIC_SITE_URL を固定していたこと（Claude調査）。設定を削除し実行時URLから生成する方式へ。トップの説明文を「あなたらしさ。」に変更 | 実装完了。テスト92件・lint・build・verify-domain 成功 | Claudeが差分確認・再実行: テスト92件・lint成功、公開サイトで新ドメインを確認 → 合格 |
| 10 | 16タイプ化 | 科学的4文字分類（E/N・B/S・U/T・H/X）による16タイプ診断へ移行。設計・16種類の選定と文章・PDB照合・構造画像の取得は Claude（`design/16-types-proposal.md`）。判定は4軸の ZCA 白色化、図鑑に4×4分類表、外れた8種類の旧URL案内、PNGに4文字を追加 | 1回目の依頼は転送時にシェルの引用符で失敗し Codex が起動しなかった（依頼文をファイル化して再依頼）。実装完了、テスト148件・lint・build・verify-domain 成功 | Claudeが再実行: データ一致、テスト148件・lint成功、分布は設計時の計算と完全一致（各5.90〜6.53%）。ブラウザで結果・共有ページ・図鑑・旧URL表示を確認。問題: 分類表の見出しが「??」・凡例なし、ファイル途中のBOM、詰め込まれたコード → 修正依頼 #11 |
| 11 | 修正 | 分類表の見出しと凡例、BOM除去、コード整形 | 修正完了、テスト148件成功。ただし120文字制限を docs にも適用し、Claude管理の docs/codex-history.md を HTML 表に書き換えた | Claudeが確認: 指摘3点は解消。docs の2ファイルは Claude が直前のコミットの状態に戻した。PNGが 1080×2264 に伸びる問題を発見 → 修正依頼 #12 |
| 12 | 修正 | 結果画像PNGを常に 1080×1920 に固定し、16種類すべてで重なり・はみ出しなし | 修正完了。16種類の描画領域を検査するテストを追加、テスト148件・lint・build 成功 | Claudeが再実行: テスト148件・lint成功、ブラウザでPBP2aのPNGが1080×1920で文字の重なりなし → 合格 |
| 13 | 差し替え | ユーザー要望で NBTX をスパイクたんぱく質（6VXX）から光捕集複合体LH2（1NKZ）に変更。設計データ・文章・PDB照合・画像取得は Claude、`spike` を retired に追加 | 反映完了。retired の件数の直書きを廃止し、画像一覧がデータと一致する検証を追加。テスト149件・lint・build・verify-domain 成功 | Claudeが再実行: データ完全一致、テスト149件・lint成功、分布は変更前と同一（LH2 6.12%）。ブラウザで LH2 の結果・図鑑の分類表・Mol* 3D（9組の輪）、`?result=spike` と `/result/spike/zukan` の入れ替え案内を確認 → 合格 |

## 環境上の注意

- Codex のサンドボックスからはネットワーク（npm レジストリ、RCSB）に接続できない。依存のインストールと構造画像のダウンロードは Claude が実行し、コードの変更は行っていない。
- Phase 4 の前に、設計書 1章で指定済みの `molstar`・`qrcode`・`@types/qrcode` を Claude が `npm install` で追加した（package.json の依存欄のみ変更）。
