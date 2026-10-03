'use client';

import { useEffect, useRef, useState } from 'react';
import { Cover } from './Cover';
import { projects } from '@/content/profile';
import { ProjectDialog } from './ProjectDialog';

/**
 * After hyperiux/interactive-list-preview: a bar in the project's own light slides to the hovered row, and that
 * row's cover wipes open (clip-path from the centre) on top of the previous ones, drifting
 * with the cursor. Rebuilt on CSS transitions instead of GSAP. The summary sits in the row
 * itself, so touch screens get it too. Clicking any row opens the project dialog; the
 * GitHub link lives there, not on the row.
 */
export function WorkList() {
  const [active, setActive] = useState<number | null>(null);
  const [open, setOpen] = useState<number | null>(null);
  const [bar, setBar] = useState({ y: 0, h: 0, hue: projects[0].hue });
  const [stack, setStack] = useState<number[]>([]);
  const listRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const drift = useRef({ tx: 0, ty: 0, x: 0, y: 0, frame: 0 });

  useEffect(() => () => cancelAnimationFrame(drift.current.frame), []);

  function follow() {
    const d = drift.current;
    d.x += (d.tx - d.x) * 0.14;
    d.y += (d.ty - d.y) * 0.14;
    previewRef.current?.style.setProperty('translate', `${d.x.toFixed(2)}px ${d.y.toFixed(2)}px`);
    d.frame = Math.abs(d.tx - d.x) + Math.abs(d.ty - d.y) > 0.05 ? requestAnimationFrame(follow) : 0;
  }

  function onMove(event: React.PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== 'mouse' || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const r = event.currentTarget.getBoundingClientRect();
    drift.current.tx = ((event.clientX - r.left) / r.width - 0.5) * 60;
    drift.current.ty = ((event.clientY - r.top) / r.height - 0.5) * 40;
    if (!drift.current.frame) drift.current.frame = requestAnimationFrame(follow);
  }

  function enter(index: number, row: HTMLElement) {
    setActive(index);
    // Die Farbe bleibt beim Verlassen stehen, damit der Balken in seinem Licht ausblendet.
    setBar({ y: row.offsetTop, h: row.offsetHeight, hue: projects[index].hue });
    // Newest cover is last in the stack so it paints on top while the old one stays under it.
    setStack((s) => [...s.filter((i) => i !== index), index].slice(-3));
  }

  return (
    <div
      ref={listRef}
      className={`pf-list ${active !== null ? 'is-hovering' : ''}`}
      onPointerMove={onMove}
      onPointerLeave={() => setActive(null)}
    >
      <span
        className="pf-list__bar"
        style={{ translate: `0 ${bar.y}px`, height: bar.h, '--hue': `var(--pf-t-${bar.hue})` } as React.CSSProperties}
        aria-hidden="true"
      />
      {projects.map((p, i) => (
        <div
          key={p.name}
          className={`pf-row ${active === i ? 'is-active' : ''}`}
          style={{ '--hue': `var(--pf-t-${p.hue})` } as React.CSSProperties}
          onPointerEnter={(e) => e.pointerType === 'mouse' && enter(i, e.currentTarget)}
        >
          <button type="button" className="pf-row__line" aria-haspopup="dialog" onClick={() => setOpen(i)}>
            <span className="pf-row__index" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
            <span className="pf-row__main">
              <span className="pf-row__name">{p.name}</span>
              <span className="pf-row__summary">{p.summary}</span>
            </span>
            <span className="pf-row__gap" aria-hidden="true" />
            <span className="pf-row__meta">
              <span className="pf-row__stack">{p.stack}</span>
              <span className={`pf-badge ${p.url ? 'is-public' : ''}`}>{p.url ? 'Public' : 'Private'}</span>
            </span>
            <b className="pf-row__plus" aria-hidden="true">+</b>
          </button>
        </div>
      ))}
      <div className="pf-preview" aria-hidden="true">
        <div ref={previewRef} className="pf-preview__drift">
          {projects.map((p, i) => (
            <figure
              key={p.name}
              className={`pf-preview__layer ${active === i ? 'is-shown' : ''}`}
              style={{ zIndex: stack.indexOf(i) + 1 }}
            >
              <Cover kind={p.cover} name={p.name} hue={p.hue} />
              <figcaption>{p.tags}</figcaption>
            </figure>
          ))}
        </div>
      </div>
      <ProjectDialog project={open === null ? null : projects[open]} index={open ?? 0} onClose={() => setOpen(null)} />
    </div>
  );
}
