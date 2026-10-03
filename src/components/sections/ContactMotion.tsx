'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

/** Nur mit feiner Maus und ohne reduzierte Bewegung (.pf-motion fehlt dann). */
function canFollow() {
  return document.documentElement.classList.contains('pf-motion') && matchMedia('(hover: hover) and (pointer: fine)').matches;
}

/**
 * Horizontlinie des Sonnenuntergangs. Die Sonne (das Glühen über der Linie) folgt der Maus
 * ein Stück entlang des Horizonts — weich nachgezogen und höchstens ±12 % der Breite.
 * Gesetzt wird nur die CSS-Variable --sun-x am eigenen Element; die Schleife läuft nur,
 * solange sich etwas bewegt.
 */
export function HorizonGlow() {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    const section = el?.parentElement;
    if (!el || !section || !canFollow()) return;
    let target = 0, x = 0, frame = 0;
    const tick = () => {
      x += (target - x) * 0.06;
      el.style.setProperty('--sun-x', `${x.toFixed(1)}px`);
      frame = Math.abs(target - x) > 0.3 ? requestAnimationFrame(tick) : 0;
    };
    const kick = () => { if (!frame) frame = requestAnimationFrame(tick); };
    const move = (e: PointerEvent) => {
      const r = section.getBoundingClientRect();
      target = ((e.clientX - r.left) / r.width - 0.5) * 0.24 * r.width;
      kick();
    };
    const leave = () => { target = 0; kick(); };
    section.addEventListener('pointermove', move);
    section.addEventListener('pointerleave', leave);
    return () => {
      cancelAnimationFrame(frame);
      section.removeEventListener('pointermove', move);
      section.removeEventListener('pointerleave', leave);
    };
  }, []);

  return <span ref={ref} className="pf-horizon" aria-hidden="true" />;
}

/**
 * Magnetischer Knopf: das Kind lehnt sich leicht zur Maus (höchstens ~6 px) und federt
 * beim Verlassen zurück. Bewegt wird nur die Hülle über eine CSS-Variable.
 */
export function Magnetic({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !canFollow()) return;
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
      const dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
      el.style.setProperty('--mx', `${(dx * 6).toFixed(1)}px`);
      el.style.setProperty('--my', `${(dy * 4).toFixed(1)}px`);
    };
    const leave = () => { el.style.setProperty('--mx', '0px'); el.style.setProperty('--my', '0px'); };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', leave);
    return () => { el.removeEventListener('pointermove', move); el.removeEventListener('pointerleave', leave); };
  }, []);

  return <span ref={ref} className="pf-magnetic">{children}</span>;
}

/**
 * Adresse zum Kopieren: zeigt die E-Mail-Adresse ausgeschrieben (wer kein Mailprogramm
 * eingerichtet hat, kommt so trotzdem an sie heran) und kopiert sie per Klick.
 * Rückmeldung sichtbar im Knopf und für Screenreader über aria-live.
 */
export function CopyEmail({ email }: { email: string }) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const timer = useRef<number>(0);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setState('copied');
    } catch {
      setState('failed');
    }
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setState('idle'), 2200);
  };

  return (
    <button type="button" className="pf-mailcopy" data-state={state} onClick={copy}>
      <span className="pf-mailcopy__addr">{email}</span>
      <span className="pf-mailcopy__act" aria-live="polite">
        {state === 'copied' ? 'Copied ✓' : state === 'failed' ? 'Copy it by hand' : 'Copy'}
      </span>
    </button>
  );
}
