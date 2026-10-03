'use client';

import { useSyncExternalStore } from 'react';

const FORMAT = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Zurich', hour: '2-digit', minute: '2-digit', hour12: false });

function subscribe(onChange: () => void) {
  const id = window.setInterval(onChange, 1000);
  return () => window.clearInterval(id);
}
const now = () => FORMAT.format(new Date());
// Auf dem Server (statischer Export) gibt es keine sinnvolle Uhrzeit: Platzhalter, keine Abweichung beim Hydrieren.
const none = () => null;

/** Echte Ortszeit in der Schweiz (Europe/Zurich), nur im Browser. Der Doppelpunkt atmet leise. */
export function ZurichClock() {
  const time = useSyncExternalStore(subscribe, now, none);
  const [h, m] = (time ?? '--:--').split(':');
  return (
    <time className="pf-clock" dateTime={time ?? undefined} data-live={time ? '' : undefined}>
      {h}<span aria-hidden="true">:</span><span className="pf-sr">:</span>{m}
    </time>
  );
}
