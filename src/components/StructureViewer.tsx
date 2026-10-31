import { useEffect, useRef, useState } from 'react';
import type { Protein } from '../domain/types';
import { rcsbUrl } from '../structures/structures';
import { Modal } from './Modal';
import { assetPath } from '../paths';
import type { PluginUIContext } from 'molstar/lib/mol-plugin-ui/context';

interface Viewer {
  plugin: PluginUIContext;
  dispose: () => void;
}

declare global {
  interface Window {
    molstar?: { Viewer: { create: (element: HTMLElement, options: object) => Promise<Viewer> } };
  }
}

let loading: Promise<void> | undefined;
function loadMolstar() {
  if (window.molstar) return Promise.resolve();
  if (!loading) {
    loading = new Promise<void>((resolve, reject) => {
      const style = document.createElement('link');
      style.rel = 'stylesheet';
      style.href = assetPath('molstar/molstar.css');
      document.head.append(style);
      const script = document.createElement('script');
      script.src = assetPath('molstar/molstar.js');
      script.onload = () => resolve();
      script.onerror = () => { script.remove(); style.remove(); reject(new Error('Mol* load failed')); };
      document.head.append(script);
    }).catch(error => { loading = undefined; throw error; });
  }
  return loading;
}

export default function StructureViewer({ protein, close }: { protein: Protein; close: () => void }) {
  const host = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState('立体構造を読み込み中…');
  const [error, setError] = useState(false);
  useEffect(() => {
    let cancelled = false;
    let viewer: Viewer | undefined;
    async function initialize() {
      try {
        const canvas = document.createElement('canvas');
        if (!canvas.getContext('webgl2') && !canvas.getContext('webgl')) throw new Error('No WebGL');
        await loadMolstar();
        if (cancelled || !host.current || !window.molstar) return;
        viewer = await window.molstar.Viewer.create(host.current, {
          layoutIsExpanded: false,
          layoutShowControls: false,
          layoutShowSequence: false,
          layoutShowLog: false,
          layoutShowLeftPanel: false,
          viewportShowExpand: false,
          viewportShowSelectionMode: false,
          viewportShowAnimation: false,
        });
        if (cancelled) { viewer.dispose(); return; }
        const plugin = viewer.plugin;
        await plugin.initialized;
        const data = await plugin.builders.data.download({
          url: `https://models.rcsb.org/${protein.structure.pdbId.toLowerCase()}.bcif`,
          isBinary: true,
        }, { state: { isGhost: true } });
        if (cancelled) return;
        const trajectory = await plugin.builders.structure.parseTrajectory(data, 'mmcif');
        if (cancelled) return;
        await plugin.builders.structure.hierarchy.applyPreset(trajectory, 'default', {
          structure: { name: 'assembly', params: { id: protein.structure.assemblyId } },
          representationPreset: 'auto',
        });
        if (!cancelled) setStatus('');
      } catch {
        if (!cancelled) {
          setError(true);
          setStatus('立体構造を表示できませんでした。通信環境やWebGLの対応状況をご確認ください。');
        }
      }
    }
    void initialize();
    return () => { cancelled = true; viewer?.dispose(); };
  }, [protein]);
  return (
    <Modal title={`${protein.nameJa}の立体構造`} close={close} wide>
      {status && <p role={error ? 'alert' : 'status'}>{status}</p>}
      <div className="viewer" ref={host} hidden={error} />
      <p>ドラッグで回転、スクロールやピンチで拡大・縮小できます。</p>
      <p className="viewer-links">
        <a target="_blank" rel="noreferrer"
          href={`https://www.rcsb.org/3d-view/${protein.structure.pdbId}/${protein.structure.assemblyId}`}>
          RCSB PDBで見る（3D）
        </a>
        <a target="_blank" rel="noreferrer" href={rcsbUrl(protein)}>RCSB PDBで見る（構造データ）</a>
      </p>
    </Modal>
  );
}
