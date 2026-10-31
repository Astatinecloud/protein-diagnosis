import { useEffect, useRef, type ReactNode } from 'react';

export function Modal({ title, close, children, wide = false }: {
  title: string;
  close: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    const previous = document.activeElement as HTMLElement | null;
    element?.showModal();
    return () => {
      element?.close();
      previous?.focus();
    };
  }, []);
  return (
    <dialog ref={dialog} aria-label={title} className={wide ? 'modal wide' : 'modal'} onCancel={close}>
      <div className="modal-header">
        <h2>{title}</h2>
        <button onClick={close} autoFocus>閉じる</button>
      </div>
      {children}
    </dialog>
  );
}
