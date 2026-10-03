import type { Metadata } from 'next';
import { CopyButton } from '@/components/lab/CopyButton';
import { FeaturedPreview } from '@/components/lab/FeaturedPreview';
import { Light } from '@/components/light/Light';
import { STACK_LABEL, STATUS_LABEL } from '@/lab/labels';
import { labStats, loadLab, type LabCollection } from '@/lab/load';

export const metadata: Metadata = {
  title: 'AI Lab',
  description: 'A public benchmark: AI models build real websites from the same prompts. Every run is listed, failures included, and every site that came out can be opened as it is.',
};

export default function LabPage() {
  const { collections } = loadLab();
  const stats = labStats(collections);
  const featured = collections
    .flatMap((c) => c.runs)
    .filter((r) => r.featured && r.href)
    .map((r) => ({ href: r.href!, title: r.featured!, model: r.model }));

  return (
    <main className="pf-page" style={{ '--hue': 'var(--pf-t-ice)' } as React.CSSProperties}>
      <Light palette="ice" seed={2} className="pf-light--top" />
      <header className="pf-page__head" data-reveal="">
        <span className="index">AI Lab · {stats.runs} runs</span>
        <h1>Every model.<br /><span className="pf-soft">Every result.</span></h1>
        <p>
          Models get the same prompt and build a real website. Every run is listed here, including the ones that failed. Where a
          model produced a site, you can open it exactly as it came out; where it did not, the reason is written next to it.
        </p>
      </header>

      <dl className="pf-figures" data-reveal="">
        <div><dt>Runs</dt><dd data-count={stats.runs}>{stats.runs}</dd></div>
        <div><dt>Models</dt><dd data-count={stats.models}>{stats.models}</dd></div>
        <div><dt>Live previews</dt><dd data-count={stats.previews}>{stats.previews}</dd></div>
        <div><dt>Success rate</dt><dd><span data-count={stats.successRate}>{stats.successRate}</span><small>%</small></dd></div>
      </dl>

      {featured.length > 0 && (
        <section className="pf-page__block" aria-label="Featured runs" data-reveal="">
          <FeaturedPreview items={featured} />
        </section>
      )}

      {collections.map((c, i) => <Collection key={c.slug} collection={c} letter={String.fromCharCode(65 + i)} hue={COLLECTION_HUES[i % COLLECTION_HUES.length]} />)}
    </main>
  );
}

/** Jede Sammlung trägt ihre eigene Lichtfarbe, wie die Projekte auf der Startseite. */
const COLLECTION_HUES = ['lilac', 'mint', 'sand'] as const;

function Collection({ collection, letter, hue }: { collection: LabCollection; letter: string; hue: string }) {
  const withPreview = collection.runs.filter((r) => r.href).length;
  return (
    <section id={collection.slug} className="pf-page__block" data-reveal="" style={{ '--hue': `var(--pf-t-${hue})` } as React.CSSProperties}>
      <header className="pf-collection__head">
        <span className="index">Collection {letter}</span>
        <h2>{collection.title}</h2>
        <p>{collection.description}</p>
        <p className="pf-collection__meta">{collection.runs.length} runs · {withPreview} with preview</p>
      </header>

      <details className="pf-prompt pf-card">
        <summary>
          <span>The prompt</span>
          <span className="pf-prompt__first">{collection.prompt.split('\n').find(Boolean)}</span>
        </summary>
        <div className="pf-prompt__body">
          <CopyButton text={collection.prompt} label="Copy prompt" />
          <pre>{collection.prompt}</pre>
        </div>
      </details>

      <div className="pf-runs" role="table" aria-label={`${collection.title} runs`}>
        <div className="pf-runs__head" role="row">
          <span role="columnheader">Model</span>
          <span role="columnheader">Stack</span>
          <span role="columnheader">Result</span>
          <span role="columnheader"><span className="pf-sr">Link</span></span>
        </div>
        {collection.runs.map((run) => {
          const cells = (
            <>
              <span role="cell" className="pf-runs__model">{run.model}</span>
              <span role="cell" className="pf-runs__stack">{STACK_LABEL[run.stack]}</span>
              <span role="cell" className="pf-runs__result">
                <i className={`pf-dot pf-dot--${run.status}`} aria-hidden="true" />
                {STATUS_LABEL[run.status]}
                {run.note && <small>{run.note}</small>}
              </span>
              <span role="cell" className="pf-runs__open">{run.href ? 'Open ↗' : ''}</span>
            </>
          );
          return run.href ? (
            <a key={run.slug} role="row" className="pf-runs__row is-link" href={run.href} target="_blank" rel="noopener noreferrer">{cells}</a>
          ) : (
            <div key={run.slug} role="row" className="pf-runs__row">{cells}</div>
          );
        })}
      </div>
    </section>
  );
}
