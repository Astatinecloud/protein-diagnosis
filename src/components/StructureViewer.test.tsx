import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import data from '../data/proteins.json';
import StructureViewer from './StructureViewer';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  delete window.molstar;
  Reflect.deleteProperty(HTMLDialogElement.prototype, 'showModal');
  Reflect.deleteProperty(HTMLDialogElement.prototype, 'close');
});

function setup() {
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
    configurable: true,
    value: function (this: HTMLDialogElement) { this.setAttribute('open', ''); },
  });
  Object.defineProperty(HTMLDialogElement.prototype, 'close', {
    configurable: true,
    value: function (this: HTMLDialogElement) { this.removeAttribute('open'); },
  });
}

it('shows fallback links when WebGL is unavailable and permits closing', async () => {
  setup();
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
  const close = vi.fn();
  render(<StructureViewer protein={data.proteins[0]} close={close} />);
  expect(await screen.findByRole('alert')).toBeTruthy();
  expect(screen.getByRole('link', { name: 'RCSB PDBで見る（3D）' }).getAttribute('href'))
    .toBe('https://www.rcsb.org/3d-view/4HHB/1');
  expect(screen.getByRole('link', { name: 'RCSB PDBで見る（構造データ）' })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: '閉じる' }));
  expect(close).toHaveBeenCalledOnce();
});

it('loads the exact biological assembly and disposes the viewer on unmount', async () => {
  setup();
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({} as WebGLRenderingContext);
  const download = vi.fn().mockResolvedValue('data');
  const parseTrajectory = vi.fn().mockResolvedValue('trajectory');
  const applyPreset = vi.fn().mockResolvedValue(undefined);
  const dispose = vi.fn();
  window.molstar = { Viewer: { create: vi.fn().mockResolvedValue({
    dispose,
    plugin: {
      initialized: Promise.resolve(),
      builders: { data: { download }, structure: { parseTrajectory, hierarchy: { applyPreset } } },
    },
  }) } };
  const protein = data.proteins.find(protein => protein.id === 'rhodopsin')!;
  const view = render(<StructureViewer protein={protein} close={() => {}} />);
  await waitFor(() => expect(applyPreset).toHaveBeenCalledWith('trajectory', 'default', {
    structure: { name: 'assembly', params: { id: '2' } }, representationPreset: 'auto',
  }));
  expect(download).toHaveBeenCalledWith({
    url: 'https://models.rcsb.org/1f88.bcif', isBinary: true,
  }, { state: { isGhost: true } });
  view.unmount();
  expect(dispose).toHaveBeenCalledOnce();
});
