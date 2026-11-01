import { lazy, Suspense, useEffect, useState } from 'react';
import type { Protein } from '../domain/types';
import { shareUrl } from '../export/urls';
import { QrCode } from './QrCode';
import { Modal } from './Modal';

const StructureViewer = lazy(() => import('./StructureViewer'));

export function ResultActions({ protein, mode = 'play' }: { protein: Protein; mode?: 'play' | 'shared' }) {
  const [viewer, setViewer] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [image, setImage] = useState('');
  useEffect(() => () => { if (image) URL.revokeObjectURL(image); }, [image]);

  async function save() {
    setBusy(true);
    setError('');
    try {
      const { createResultImage } = await import('../export/resultImage');
      const blob = await createResultImage(protein);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      // Safari may silently ignore download; keep a visible image as a reliable fallback.
      setImage(url);
      if ('download' in anchor && !/iPad|iPhone|iPod/.test(navigator.userAgent)) {
        anchor.href = url;
        anchor.download = `${protein.id}-result.png`;
        document.body.append(anchor);
        try { anchor.click(); } finally { anchor.remove(); }
      }
    } catch {
      setError('結果画像を作成できませんでした。画像の読み込みを確認して、もう一度お試しください。');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="result-actions">
      <div className="actions">
        <button onClick={() => setViewer(true)}>立体構造を動かしてみる</button>
        <button onClick={save} disabled={busy}>{busy ? '画像を作成中…' : '結果画像を保存'}</button>
      </div>
      {error && <p role="alert">{error}</p>}
      {mode === 'play' && <>
        <h2>この結果をスマホで見る</h2>
        <p>QRコードを読み取ると、この診断結果だけをスマホで見られます。</p>
        <QrCode url={shareUrl(protein.id)} />
      </>}
      {viewer && <Suspense fallback={<p role="status">読み込み中…</p>}>
        <StructureViewer protein={protein} close={() => setViewer(false)} />
      </Suspense>}
      {image && <Modal title="結果画像" close={() => setImage('')}>
        <p>ダウンロードされない場合は、画像を長押しで保存してください。</p>
        <img className="export-preview" src={image} alt={`${protein.nameJa}の診断結果画像`} />
        <a className="button" href={image} download={`${protein.id}-result.png`}>PNGをダウンロード</a>
      </Modal>}
    </section>
  );
}
