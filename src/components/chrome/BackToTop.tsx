'use client';

/** Zurück nach oben: weich gescrollt, bei reduzierter Bewegung sofort. Ohne JS bleibt der Anker #top. */
export function BackToTop({ label }: { label: string }) {
  const up = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: still ? 'auto' : 'smooth' });
  };
  return (
    <a href="#top" className="pf-top" onClick={up}>
      {label}
      <span className="pf-top__arrow" aria-hidden="true"><i>↑</i><i>↑</i></span>
    </a>
  );
}
