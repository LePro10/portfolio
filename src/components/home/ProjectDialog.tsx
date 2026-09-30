'use client';

import { useEffect, useRef } from 'react';
import { RainbowButton } from '@/components/buttons/RainbowButton';
import { Cover } from './Cover';
import type { Project } from '@/content/profile';

/**
 * Project detail as a native <dialog>: side panel on desktop, bottom sheet on phones.
 * showModal() gives focus trapping, Escape and inert page content for free.
 */
export function ProjectDialog({ project, index, onClose }: { project: Project | null; index: number; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (project && !dialog.open) dialog.showModal();
    document.documentElement.classList.toggle('pf-locked', !!project);
  }, [project]);

  function close() {
    const dialog = ref.current;
    if (!dialog?.open) return onClose();
    dialog.classList.add('is-closing');
    setTimeout(() => { dialog.classList.remove('is-closing'); dialog.close(); }, 320);
  }

  return (
    <dialog
      ref={ref}
      className="pf-dialog"
      aria-labelledby="pf-dialog-title"
      onClose={onClose}
      onCancel={(e) => { e.preventDefault(); close(); }}
      onClick={(e) => e.target === e.currentTarget && close()}
    >
      {project && (
        <article className="pf-dialog__panel">
          <header className="pf-dialog__bar">
            <span>{String(index + 1).padStart(2, '0')} / Project</span>
            <button type="button" onClick={close} aria-label="Close">Close <i /><i /></button>
          </header>
          <Cover kind={project.cover} name={project.name} className="pf-dialog__cover" />
          <div className="pf-dialog__body">
            <h3 id="pf-dialog-title">{project.name}</h3>
            <p className="pf-dialog__lead">{project.summary}</p>
            <p>{project.details}</p>
            <dl>
              <div><dt>Stack</dt><dd>{project.stack}</dd></div>
              <div><dt>Focus</dt><dd>{project.tags}</dd></div>
              <div><dt>Source</dt><dd>{project.url ? 'Public' : 'Private'}</dd></div>
            </dl>
            <div className="pf-dialog__cta">
              {project.url
                ? <RainbowButton href={project.url} target="_blank" rel="noopener noreferrer">View on GitHub ↗</RainbowButton>
                : <span className="pf-dialog__private">Private repository. Demo on request.</span>}
            </div>
          </div>
        </article>
      )}
    </dialog>
  );
}
