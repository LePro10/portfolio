import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Not found' };

export default function NotFound() {
  return (
    <main className="pf-page pf-page--short">
      <header className="pf-page__head">
        <span className="index">404 · Not found</span>
        <h1>Nothing here.</h1>
        <p>This address does not exist (anymore). <Link href="/" className="pf-inline-link">Back to the start →</Link></p>
      </header>
    </main>
  );
}
