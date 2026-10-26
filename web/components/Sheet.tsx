"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { Icon } from "./ui/Icon";

/** A bottom sheet on the native <dialog>, so focus, Escape and the backdrop behave correctly. */
export function Sheet({ open, onClose, title, id, children }: { open: boolean; onClose: () => void; title: string; id: string; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog ref={ref} className="sheet" aria-labelledby={id} onClose={onClose} onClick={(e) => e.target === ref.current && onClose()}>
      <div className="sheet-body">
        <div className="sheet-grab" aria-hidden="true" />
        <div className="sheet-head">
          <h2 id={id} className="h-heading">{title}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            <Icon name="x" />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
