'use client';

import { useRef, useState } from 'react';
import type { Hue } from '@/content/profile';
import { STATUS_LABEL } from '@/lab/labels';
import type { RunStatus } from '@/lab/schema';

export interface FieldRun {
  slug: string;
  model: string;
  status: RunStatus;
  href: string | null;
  note?: string;
}

export interface FieldGroup {
  title: string;
  hue: Hue;
  runs: FieldRun[];
}

const STATUSES: RunStatus[] = ['success', 'template', 'server-only', 'failed'];

/**
 * Jeder Lauf ist ein Feld. Kommt die Matrix ins Bild, laufen die Felder nacheinander
 * durch wie eine Testsuite (CSS, gestaffelt über --i) und bleiben in der Farbe ihres
 * Ergebnisses stehen. Maus oder Fokus zeigen den Lauf in der Anzeigezeile; ein Klick auf
 * ein schon gezeigtes Feld öffnet die Seite. Auf Touch heisst das: erst tippen, dann
 * nochmals tippen. Tastatur: ein Tabstopp, Pfeiltasten wandern durch alle Felder.
 *
 * Die Legende ist ein Filter: ein Status gedrückt (aria-pressed) lässt nur seine Felder
 * leuchten, die anderen treten zurück. Der Zustand steht als data-filter am Wurzelelement,
 * gerendert von React, nicht per DOM gesetzt.
 */
export function RunField({ groups }: { groups: FieldGroup[] }) {
  const flat = groups.flatMap((g) => g.runs.map((run) => ({ run, group: g.title })));
  const [selected, setSelected] = useState<number | null>(null);
  const [filter, setFilter] = useState<RunStatus | null>(null);
  const cells = useRef<(HTMLButtonElement | null)[]>([]);
  const counts = STATUSES.map((s) => ({ status: s, n: flat.filter((f) => f.run.status === s).length })).filter((c) => c.n > 0);
  const current = selected === null ? null : flat[selected];

  const open = (i: number) => {
    const href = flat[i].run.href;
    if (selected === i && href) window.open(href, '_blank', 'noopener');
    else setSelected(i);
  };

  const onKey = (e: React.KeyboardEvent, i: number) => {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    const next = step ? (i + step + flat.length) % flat.length : e.key === 'Home' ? 0 : e.key === 'End' ? flat.length - 1 : null;
    if (next === null) return;
    e.preventDefault();
    setSelected(next);
    cells.current[next]?.focus();
  };

  let index = 0;
  return (
    <div className="pf-runfield" data-reveal="" data-filter={filter ?? undefined}>
      <div className="pf-runfield__groups">
        {groups.map((g) => (
          <div key={g.title} className="pf-runfield__group" style={{ '--hue': `var(--pf-t-${g.hue})` } as React.CSSProperties}>
            <span className="pf-runfield__label">{g.title}<b>{g.runs.length}</b></span>
            <div className="pf-runfield__grid" role="group" aria-label={`${g.title}: ${g.runs.length} runs`}>
              {g.runs.map((run) => {
                const i = index++;
                return (
                  <button
                    key={run.slug}
                    ref={(el) => { cells.current[i] = el; }}
                    type="button"
                    className={`pf-run pf-run--${run.status}${selected === i ? ' is-selected' : ''}`}
                    style={{ '--i': i } as React.CSSProperties}
                    tabIndex={(selected ?? 0) === i ? 0 : -1}
                    aria-label={`${run.model}, ${g.title}: ${STATUS_LABEL[run.status]}${run.href ? ', opens the site' : ''}`}
                    onPointerEnter={(e) => e.pointerType === 'mouse' && setSelected(i)}
                    onFocus={() => setSelected(i)}
                    onClick={() => open(i)}
                    onKeyDown={(e) => onKey(e, i)}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="pf-runfield__readout" aria-live="polite">
        {current ? (
          <>
            <i className={`pf-dot pf-dot--${current.run.status}`} aria-hidden="true" />
            <b>{current.run.model}</b>
            <span>{current.group} · {STATUS_LABEL[current.run.status]}</span>
            {current.run.href
              ? <a href={current.run.href} target="_blank" rel="noopener noreferrer">Open the site ↗</a>
              : <span className="pf-runfield__note">{current.run.note ?? 'No site to show.'}</span>}
          </>
        ) : (
          <span className="pf-runfield__hint">Every square is one model run. Point at one to see what came out.</span>
        )}
      </div>

      <ul className="pf-runfield__legend" aria-label="Show only one result">
        {counts.map((c) => (
          <li key={c.status}>
            <button
              type="button"
              className="pf-runfield__chip"
              data-status={c.status}
              aria-pressed={filter === c.status}
              onClick={() => setFilter((f) => (f === c.status ? null : c.status))}
            >
              <i className={`pf-dot pf-dot--${c.status}`} aria-hidden="true" />{STATUS_LABEL[c.status]}<b>{c.n}</b>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
