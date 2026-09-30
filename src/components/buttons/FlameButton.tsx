'use client';

import { useEffect, useRef, type CSSProperties, type PointerEvent } from 'react';

interface FlameButtonProps {
  text?: string;
  showArrow?: boolean;
  height?: number;
  textColor?: string;
  borderColor?: string;
  href?: string;
  onClick?: () => void;
}

/**
 * Same props and hover physics as ref/elements/flame_button.tsx: a light that follows the
 * cursor inside the pill and a flare that bleeds out of the nearest edge. Re-lit for dark UI.
 * Hover state lives in CSS and the flare easing runs in rAF only while it is settling,
 * so an idle button costs nothing.
 */
export function FlameButton({
  text = 'Get started',
  showArrow = true,
  height = 44,
  textColor,
  borderColor,
  href,
  onClick,
}: FlameButtonProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const flare = useRef({ current: 0, target: 0, frame: 0 });

  useEffect(() => () => cancelAnimationFrame(flare.current.frame), []);

  function settle() {
    const state = flare.current;
    const diff = state.target - state.current;
    state.current = Math.abs(diff) < 0.002 ? state.target : state.current + diff * 0.15;
    rootRef.current?.style.setProperty('--flare', state.current.toFixed(3));
    state.frame = state.current === state.target ? 0 : requestAnimationFrame(settle);
  }

  function aim(target: number) {
    flare.current.target = target;
    if (!flare.current.frame) flare.current.frame = requestAnimationFrame(settle);
  }

  function handleMove(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === 'touch') return;
    const root = event.currentTarget;
    const rect = root.getBoundingClientRect();
    // Divide out any ancestor transform so the light stays under the cursor when scaled.
    const scale = rect.width / root.offsetWidth || 1;
    const x = (event.clientX - rect.left) / scale;
    const normX = rect.width ? (event.clientX - rect.left) / rect.width : 0.5;
    root.style.setProperty('--x', `${x}px`);
    root.style.setProperty('--edge', normX >= 0.5 ? '88%' : '12%');
    aim(Math.pow(Math.min(1, Math.abs(normX - 0.5) * 2), 1.6));
  }


  // Mit href ein echter Link (Rechtsklick, Mittelklick, Tastatur), sonst ein Button.
  const Tag = href ? 'a' : 'button';
  const style = {
    '--h': `${height}px`,
    ...(textColor && { '--fg': textColor }),
    ...(borderColor && { '--border': borderColor }),
  } as CSSProperties;

  return (
    <div ref={rootRef} className="ds-flame" style={style} onPointerMove={handleMove} onPointerLeave={() => aim(0)}>
      <div className="ds-flame__flare" aria-hidden="true" />
      <Tag {...(href ? { href } : { type: 'button' as const })} className="ds-flame__button" onClick={onClick}>
        <span className="ds-flame__light" aria-hidden="true" />
        <span className="ds-flame__label">{text}</span>
        {showArrow && <svg className="ds-flame__arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7" /></svg>}
      </Tag>
    </div>
  );
}

export default FlameButton;
