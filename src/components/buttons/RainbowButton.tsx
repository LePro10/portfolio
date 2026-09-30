'use client';

import { useEffect, useRef, type AnchorHTMLAttributes, type ButtonHTMLAttributes } from 'react';

/** Mit href wird ein Link gerendert, sonst ein Button. */
type RainbowButtonProps =
  | (ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined })
  | (AnchorHTMLAttributes<HTMLAnchorElement> & { href: string });

/** Distance in px at which the rim starts catching the cursor's light. */
const RANGE = 110;

/**
 * ref/elements/rainbow_button.tsx rebuilt achromatic: the same bottom-weighted gradient rim,
 * flowing sheen and floor glow, but in silver and only while hovered. As the cursor approaches,
 * the side of the rim facing it lights up before the button is even touched.
 */
export function RainbowButton({ children, className = '', ...props }: RainbowButtonProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    let frame = 0;
    let x = -1e4;
    let y = -1e4;

    const update = () => {
      frame = 0;
      const r = el.getBoundingClientRect();
      const dx = Math.max(r.left - x, 0, x - r.right);
      const dy = Math.max(r.top - y, 0, y - r.bottom);
      const near = Math.max(0, 1 - Math.hypot(dx, dy) / RANGE);
      el.style.setProperty('--prox', (near * near).toFixed(3));
      if (near > 0) {
        const scale = r.width / el.offsetWidth || 1;
        el.style.setProperty('--px', `${(x - r.left) / scale}px`);
        el.style.setProperty('--py', `${(y - r.top) / scale}px`);
      }
    };
    const onMove = (event: PointerEvent) => {
      x = event.clientX;
      y = event.clientY;
      if (!frame) frame = requestAnimationFrame(update);
    };
    const onLeave = () => {
      x = y = -1e4;
      if (!frame) frame = requestAnimationFrame(update);
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
    return () => {
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeave);
      cancelAnimationFrame(frame);
    };
  }, []);

  if (props.href !== undefined) {
    return <a {...props} ref={ref as React.Ref<HTMLAnchorElement>} className={`ds-rainbow ${className}`}>{children}</a>;
  }
  const { type = 'button', ...rest } = props;
  return (
    <button {...rest} ref={ref as React.Ref<HTMLButtonElement>} type={type} className={`ds-rainbow ${className}`}>
      {children}
    </button>
  );
}

export default RainbowButton;
