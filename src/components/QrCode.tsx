import { useEffect, useState } from 'react';
import { qrUrl } from '../export/urls';
import { Modal } from './Modal';

export function QrCode({ url = qrUrl() }: { url?: string }) {
  const [source, setSource] = useState('');
  const [error, setError] = useState(false);
  useEffect(() => {
    let active = true;
    setSource('');
    setError(false);
    import('qrcode').then(module => module.toDataURL(url, { width: 256, margin: 4 }))
      .then(value => { if (active) setSource(value); })
      .catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, [url]);
  return (
    <div className="qr">
      {source && <img src={source} alt="QRコード" width="256" height="256" />}
      {error && <p role="alert">QRコードを生成できませんでした。</p>}
      <a href={url}>{url}</a>
    </div>
  );
}

export function SiteQrButton() {
  const [open, setOpen] = useState(false);
  return (
    <div className="site-qr">
      <button onClick={() => setOpen(true)}>このサイトのQRコード</button>
      {open && <Modal title="このサイトのQRコード" close={() => setOpen(false)}><QrCode /></Modal>}
    </div>
  );
}
