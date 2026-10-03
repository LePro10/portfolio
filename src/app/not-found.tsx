import type { Metadata } from 'next';
import Link from 'next/link';
import { Light } from '@/components/light/Light';

export const metadata: Metadata = { title: 'Not found' };

export default function NotFound() {
  return (
    <main id="main" className="pf-page pf-page--short">
      <Light palette="night" seed={9} className="pf-light--top" />
      <header className="pf-page__head" data-reveal="">
        <span className="index">404 · Not found</span>
        <h1>Nothing here.</h1>
        <p>This address does not exist (anymore). <Link href="/" className="pf-inline-link">Back to the start →</Link></p>
      </header>
    </main>
  );
}
