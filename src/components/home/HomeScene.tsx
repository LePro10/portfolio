'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { Light } from '@/components/light/Light';

const SceneCanvas = dynamic(() => import('./SceneCanvas'), { ssr: false });

/**
 * Feste WebGL-Bühne hinter .scene-track (Berg → Wind → Erde). Der Text darüber
 * wird serverseitig gerendert; hier liegen Himmel, Canvas, Rahmen und Scroll-Zustand.
 */
export function HomeScene() {
  const [error, setError] = useState(false);
  const [running, setRunning] = useState(true);
  const onError = useCallback(() => setError(true), []);

  useLayoutEffect(() => {
    let width = 0;
    const resize = () => {
      const nextWidth = window.innerWidth;
      // Mobile toolbar/keyboard changes affect only height. Keep the initial
      // pixel height until rotation, a width change, or a desktop resize.
      if (nextWidth <= 700 && nextWidth === width) return;
      width = nextWidth;
      document.documentElement.style.setProperty('--scene-height', `${window.innerHeight}px`);
    };
    resize();
    window.addEventListener('resize', resize, { passive: true });
    return () => window.removeEventListener('resize', resize);
  }, []);

  // Content sections are opaque and cover the fixed canvas; stop rendering it once it is gone.
  useEffect(() => {
    const track = document.querySelector('.scene-track');
    if (!track) return;
    const observer = new IntersectionObserver(([entry]) => setRunning(entry.isIntersecting), { rootMargin: '0px 0px -100% 0px' });
    observer.observe(track);
    return () => observer.disconnect();
  }, []);

  // Die Szene schreibt --progress & Co. auf <html>. Beim Verlassen der Startseite zurücksetzen.
  useEffect(() => () => {
    for (const name of ['--progress', '--mountain-label', '--mountain-shift', '--mountain-title-shift', '--earth-label', '--scene-height']) {
      document.documentElement.style.removeProperty(name);
    }
  }, []);

  return (
    <>
      {/* Himmel: Dämmerung über dem Berg, Nacht über der Erde; dazwischen geht die Sonne hinter dem Gipfel unter. */}
      <div className="pf-sky" aria-hidden="true">
        <Light palette="dusk" seed={3} className="pf-sky__dusk" />
        <Light palette="night" seed={5} className="pf-sky__night" />
        <span className="pf-sun" />
      </div>
      <div className="canvas-wrap"><SceneCanvas running={running} onError={onError} /></div>
      <div className="frame" aria-hidden="true"><span className="corner top-left" /><span className="corner top-right" /><span className="corner bottom-left" /><span className="corner bottom-right" /></div>
      <div className="progress-track" aria-hidden="true"><span /></div>
      {error && <p role="alert" className="fallback">Earth data could not load. Refresh to try again.</p>}
    </>
  );
}
