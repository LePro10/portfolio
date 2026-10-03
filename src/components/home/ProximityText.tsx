'use client';

import { Fragment, useEffect, useRef } from 'react';

const FROM = 300;
const TO = 720;

/**
 * After hyperiux/variable-text-proximity: every letter's weight follows its distance to
 * the cursor. Uses DM Sans' variable wght axis, locks each glyph to its heavier width so
 * the paragraph never reflows, and only runs its frame loop while the pointer is near.
 * The same nearness (--k) tints the letter mint in CSS, so the cursor reads as a small light.
 */
export function ProximityText({ text, radius = 110 }: { text: string; radius?: number }) {
  const rootRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const letters = Array.from(root.querySelectorAll<HTMLSpanElement>('[data-l]'));
    let target = { x: -1e4, y: -1e4 }, pos = { ...target }, frame = 0, centers: { x: number; y: number }[] = [];

    const measure = () => {
      letters.forEach((l) => { l.style.width = ''; l.style.fontVariationSettings = `'wght' ${TO}`; });
      const heavy = letters.map((l) => l.getBoundingClientRect().width);
      letters.forEach((l, i) => { l.style.fontVariationSettings = `'wght' ${FROM}`; l.style.width = `${heavy[i]}px`; });
      centers = letters.map((l) => ({ x: l.offsetLeft + l.offsetWidth / 2, y: l.offsetTop + l.offsetHeight / 2 }));
    };
    const tick = () => {
      pos.x += (target.x - pos.x) * 0.2;
      pos.y += (target.y - pos.y) * 0.2;
      letters.forEach((l, i) => {
        const d = Math.hypot(centers[i].x - pos.x, centers[i].y - pos.y);
        const k = d < radius ? Math.exp(-((d / (radius / 2)) ** 2) / 2) : 0;
        l.style.fontVariationSettings = `'wght' ${Math.round(FROM + (TO - FROM) * k)}`;
        l.style.setProperty('--k', k.toFixed(3));
      });
      frame = Math.abs(target.x - pos.x) + Math.abs(target.y - pos.y) > 0.3 ? requestAnimationFrame(tick) : 0;
    };
    const move = (e: PointerEvent) => {
      const r = root.getBoundingClientRect();
      target = { x: e.clientX - r.left, y: e.clientY - r.top };
      if (pos.x < -5000) pos = { ...target };
      if (!frame) frame = requestAnimationFrame(tick);
    };
    const leave = () => { target = { x: -1e4, y: -1e4 }; pos = { ...target }; tick(); };

    document.fonts.ready.then(measure);
    window.addEventListener('resize', measure);
    root.addEventListener('pointermove', move);
    root.addEventListener('pointerleave', leave);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', measure);
      root.removeEventListener('pointermove', move);
      root.removeEventListener('pointerleave', leave);
    };
  }, [radius, text]);

  return (
    <p ref={rootRef} className="pf-proximity" aria-label={text} data-reveal="">
      {text.split(' ').map((word, w) => (
        <Fragment key={w}>
          {w > 0 && ' '}
          <span className="pf-proximity__word" aria-hidden="true">
            {[...word].map((c, i) => <span key={i} data-l="">{c}</span>)}
          </span>
        </Fragment>
      ))}
    </p>
  );
}
