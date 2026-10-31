# あなたはどのたんぱく質？

早稲田祭向けの診断Webアプリです。8問の4択から12種類のたんぱく質タイプを表示します。
React / TypeScript / Vite で動く静的サイトで、回答はメモリ内だけに保持します。

## セットアップ

Node.js 24 / npm 11 を使用します。

```sh
npm install
node scripts/fetch-structures.mjs
npm run dev
```

構造画像の初回取得にはネットワークが必要です。画像は `public/structures/` に保存され、
通常の結果表示とPNG保存ではローカル画像だけを使います。
`predev` / `prebuild` がインストール済みMol*のJSとCSSを `public/molstar/` にコピーします。
3D表示はボタンを押したときに初めて読み込み、構造データはRCSBから取得します。

```sh
npm test
npm run lint
npm run build
npm run preview
```

## 質問の編集と公開

管理画面は `npm run dev`（ローカル）で使います。`/admin` を開き、質問文、選択肢、特性スコア、
順序を編集できます。保存前に検証し、保存先はブラウザーのlocalStorageです。
プレビューと全65,536通りの分布で編集結果を確認できます。
公開には「JSONエクスポート」で取得した `questions.json` で `src/data/questions.json` を置き換え、
テストとビルドを実行して再デプロイしてください。ブラウザーでの保存だけでは公開データは変わりません。

`.env.example` を参照し、必要なら `.env.local` に `VITE_PUBLIC_SITE_URL` を設定します。
未設定なら現在のオリジンを使います。QRには個人情報や回答を含めません。
`VITE_ENABLE_ADMIN=true` は管理画面を明示的に含めるための開発向け設定で、認証ではありません。
通常の本番では false または未設定にし、管理画面のコード自体を除外します。

## Vercelへの公開手順

1. ソースをGitリポジトリーに保存し、Vercelで新規プロジェクトとしてインポートします。
2. FrameworkをVite、Build Commandを `npm run build`、Output Directoryを `dist` にします。
3. 必要なら環境変数 `VITE_PUBLIC_SITE_URL` に公開URLを設定します。
4. `VITE_ENABLE_ADMIN` は false または未設定にします。
5. デプロイ後、`/quiz` と `/result/gfp` の直接アクセスと再読み込みを確認します。

`vercel.json` はSPAの画面URLをindex.htmlにリライトし、structures、molstar、assetsは静的ファイルとして扱います。
この実装作業ではデプロイしていません。

## データ出典とクレジット

質問・たんぱく質データは `design/` の確定データを使用しています。
構造データ・構造画像は [RCSB PDB](https://www.rcsb.org/) のCC0データです。
利用時はPDB ID、各構造の原著論文、RCSB PDBおよび描画ソフトの出典表示が推奨されています。
結果画面・PNGにPDB IDと画像クレジットを表示しています。

- Mol*: Sehnal et al. (2021), Nucleic Acids Research, DOI: [10.1093/nar/gkab314](https://doi.org/10.1093/nar/gkab314)
- RCSB PDB: Berman et al. (2000), Nucleic Acids Research, DOI: [10.1093/nar/28.1.235](https://doi.org/10.1093/nar/28.1.235)

この診断は、たんぱく質の働きを性格にたとえて楽しむエンターテインメントです。
科学的な性格検査ではありません。

## GitHub Pages deployment

1. Place this app at the repository root. In Settings > Pages > Source, select **GitHub Actions**.
2. Push to main or run the Deploy GitHub Pages workflow manually. It sets BASE_PATH and VITE_PUBLIC_SITE_URL for the repository subpath.
3. Check /<repo>/result/gfp directly, including images and QR links. The build generates 404.html and an empty .nojekyll. Direct routes render the SPA with GitHub Pages' HTTP 404 status.

BASE_PATH defaults to /; a trailing slash is optional. VITE_PUBLIC_SITE_URL accepts a subpath with or without a trailing slash; its fallback is the current origin + BASE_URL. Leave BASE_PATH unset for Vercel root hosting. The production admin exclusion remains unchanged.
