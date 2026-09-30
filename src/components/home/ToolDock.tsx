'use client';

import { useEffect, useRef, useState } from 'react';
import { tools } from '@/content/profile';

/**
 * Adapted from carolinaraulino's "Techstack" (21st.dev) without framer-motion:
 * a tilted, overlapping row of app tiles that swells around the pointer and
 * shares one gliding label. Hover is resolved from the pointer's x against each
 * slot's resting centre, never hit-testing, so it cannot flicker. At rest the
 * tiles drift slowly and stay monochrome; the one under the pointer takes colour.
 */
const TILT = [-7, 5, -4, 8, -6, 4, -8, 6];
const REACH = 1.2;       // tile widths either side of the pointer that still swell
const LIFT = .19;        // rise of a fully swollen tile, in tile heights
const MAG = .28;         // growth of the tile under the pointer
const OVERLAP = .12;     // how far each tile tucks under the previous one
const ROOM = OVERLAP + MAG / 2;
const K = 520, C = 40, M = .5; // spring: quick, no wobble

type Spring = { v: number; vel: number };
const step = (s: Spring, target: number, dt: number) => {
  s.vel += ((-K * (s.v - target) - C * s.vel) / M) * dt;
  s.v += s.vel * dt;
};

export function ToolDock({ size = 54 }: { size?: number }) {
  const rail = useRef<HTMLUListElement>(null);
  const tiles = useRef<(HTMLDivElement | null)[]>([]);
  const pointer = useRef(Infinity);
  const layout = useRef({ centers: [] as number[], width: 0 });
  const [active, setActive] = useState<number | null>(null);
  const [label, setLabel] = useState({ text: tools[0].label, at: 0, glide: false });
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = rail.current;
    if (!el) return;
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const measure = () => {
      const slots = [...el.children] as HTMLElement[];
      layout.current = { centers: slots.map(li => li.offsetLeft + li.offsetWidth / 2), width: slots[0]?.offsetWidth ?? 0 };
    };
    measure();
    const resize = new ResizeObserver(measure);
    resize.observe(el);

    const swell = tools.map(() => ({ v: 0, vel: 0 }));
    const push = tools.map(() => ({ v: 0, vel: 0 }));
    const near = (k: number, x: number) => {
      const { centers, width } = layout.current;
      if (!Number.isFinite(x) || !width) return 0;
      return Math.max(0, 1 - Math.abs(x - centers[k]) / width / REACH) ** 2;
    };

    let raf = 0, last = 0, visible = false;
    const frame = (now: number) => {
      const dt = Math.min(.032, (now - last) / 1000 || .016);
      last = now;
      const x = still ? Infinity : pointer.current;
      const w = layout.current.width;
      const t = now / 1000;
      const weights = tools.map((_, k) => near(k, x));
      tools.forEach((_, i) => {
        let shift = 0;
        weights.forEach((wk, k) => { if (k !== i) shift += wk * (k < i ? 1 : -1); });
        step(swell[i], weights[i], dt);
        step(push[i], shift * w * ROOM, dt);
        const s = swell[i].v, lean = TILT[i % TILT.length];
        // Passive drift: a slow bob and sway, each tile on its own phase, fading out as it swells.
        const idle = still ? 0 : 1 - Math.min(1, s * 1.5);
        const bob = Math.sin(t * .9 + i * 1.3) * w * .05 * idle;
        const sway = Math.sin(t * .6 + i * 2.1) * 2.2 * idle;
        const tile = tiles.current[i];
        if (tile) tile.style.transform =
          `translate3d(${push[i].v}px, ${bob - s * LIFT * w}px, 0) scale(${1 + s * MAG}) rotate(${lean * (1 - s) + sway}deg)`;
      });
      if (visible) raf = requestAnimationFrame(frame);
    };
    // Only animate while on screen; the first sighting also deals the tiles in.
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) { setShown(true); cancelAnimationFrame(raf); last = performance.now(); raf = requestAnimationFrame(frame); }
    }, { threshold: .2 });
    io.observe(el);
    return () => { resize.disconnect(); io.disconnect(); cancelAnimationFrame(raf); };
  }, []);

  const current = useRef<number | null>(null);
  const track = (clientX: number) => {
    const el = rail.current;
    if (!el) return;
    const x = clientX - el.getBoundingClientRect().left;
    pointer.current = x;
    const { centers } = layout.current;
    let nearest = 0;
    centers.forEach((c, i) => { if (Math.abs(x - c) < Math.abs(x - centers[nearest])) nearest = i; });
    if (nearest === current.current) return;
    setLabel({ text: tools[nearest].label, at: centers[nearest], glide: current.current !== null });
    current.current = nearest;
    setActive(nearest);
  };
  const release = () => { pointer.current = Infinity; current.current = null; setActive(null); };

  const span = 1 + (tools.length - 1) * (1 - OVERLAP) + 2 * ROOM;
  return (
    <div className="pf-dock" style={{ '--dock-size': `min(${size}px, calc((100cqw - 1rem) / ${(span + .52).toFixed(3)}))`, '--dock-rise': LIFT + MAG } as React.CSSProperties}>
      <div className="pf-dock__inner">
        <span aria-hidden="true" className={`pf-dock__tip${active !== null ? ' is-open' : ''}${label.glide ? ' is-gliding' : ''}`} style={{ translate: `calc(${label.at}px - 50%) 0` }}>{label.text}</span>
        <ul ref={rail} aria-label="Tools I use every day" className={`pf-dock__rail${shown ? ' is-shown' : ''}`}
          onPointerMove={e => track(e.clientX)} onPointerDown={e => track(e.clientX)} onPointerLeave={release}
          onPointerUp={e => { if (e.pointerType !== 'mouse') release(); }} onPointerCancel={release}>
          {tools.map((tool, i) => (
            <li key={tool.label} style={{ zIndex: tools.length - i, '--i': i } as React.CSSProperties}>
              <div ref={el => { tiles.current[i] = el; }} role="img" aria-label={tool.label} className={`pf-dock__tile${active === i ? ' is-active' : ''}`}>
                {/* eslint-disable-next-line @next/next/no-img-element -- winzige SVG-Icons, next/image bringt hier nichts */}
                <img src={tool.icon} alt="" draggable={false} style={{ width: tool.fit ?? '54%' }}/>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
