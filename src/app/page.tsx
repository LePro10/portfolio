import Link from 'next/link';
import { RainbowButton } from '@/components/buttons/RainbowButton';
import { ShinyButton } from '@/components/buttons/ShinyButton';
import { HomeScene } from '@/components/home/HomeScene';
import { ProximityText } from '@/components/home/ProximityText';
import { ToolDock } from '@/components/home/ToolDock';
import { WorkList } from '@/components/home/WorkList';
import { RunField, type FieldGroup } from '@/components/lab/RunField';
import { CopyEmail, HorizonGlow, Magnetic } from '@/components/sections/ContactMotion';
import { Light } from '@/components/light/Light';
import { profile, projects, stack, type Hue } from '@/content/profile';
import { labStats, loadLab } from '@/lab/load';

/** Jede Stack-Spalte trägt eine Lichtfarbe, in derselben Familie wie die Projekte. */
const STACK_HUES: Hue[] = ['lilac', 'ice', 'mint', 'sand'];
const COLLECTION_HUES: Hue[] = ['lilac', 'mint', 'sand'];

const AGE_WORDS: Record<number, string> = { 15: 'Fifteen', 16: 'Sixteen', 17: 'Seventeen', 18: 'Eighteen', 19: 'Nineteen', 20: 'Twenty' };

export default function HomePage() {
  const { collections } = loadLab();
  const stats = labStats(collections);
  const groups: FieldGroup[] = collections.map((c, i) => ({
    title: c.title,
    hue: COLLECTION_HUES[i % COLLECTION_HUES.length],
    runs: c.runs.map((r) => ({ slug: r.slug, model: r.model, status: r.status, href: r.href, note: r.note })),
  }));

  return (
    <>
      <HomeScene />
      <main>
        <div className="scene-track">
          <section className="study mountain-title" aria-label="Introduction">
            <div className="index">Portfolio · {profile.location}</div>
            {/* Name steigt Buchstabe für Buchstabe aus einer Maske (motion-hero.css); Screenreader lesen den ganzen Namen. */}
            <h1 className="hero-name">
              <span className="pf-sr">{profile.name}</span>
              <span aria-hidden="true">
                {profile.name.split(' ').map((word, w, words) => (
                  <span key={w} className="hero-word">
                    {[...word].map((ch, c) => (
                      <span key={c} className="hero-char" style={{ '--i': words.slice(0, w).join('').length + c } as React.CSSProperties}>{ch}</span>
                    ))}
                  </span>
                ))}
              </span>
            </h1>
            <p className="hero-sub">I build AI tools, agents and the interfaces around them.</p>
          </section>
          <span id="about" className="scene-anchor" />
          <section className="study earth-title" aria-label="About">
            <div className="index">About</div>
            <h2>{AGE_WORDS[profile.age] ?? profile.age}, from {profile.location}.</h2>
            <p className="about-copy">Most of my time goes where AI meets real software: agents that do actual work, tools that make me faster, and interfaces that make both usable. Most of my repositories started as something I needed myself.</p>
          </section>
          <dl className="about-stats earth-stats">
            <div><dt>Age</dt><dd data-earth-count={profile.age}>{profile.age}</dd></div>
            <div><dt>Repositories</dt><dd data-earth-count={19}>19</dd></div>
            <div><dt>Languages</dt><dd data-earth-count={6}>6</dd></div>
          </dl>
          <div className="footer" aria-hidden="true">
            <div className="instruction"><span className="mountain-instruction">MOVE TO LIGHT THE RIDGE</span><span className="earth-instruction">MOVE TO ILLUMINATE</span><span className="touch-instruction">TOUCH TO INTERACT</span></div>
            <div className="scroll-cue"><span className="mountain-instruction">SCROLL TO EXPLORE</span><span className="earth-instruction">SCROLL FOR WORK</span><span className="hero-drop"><i /></span></div>
            <span className="medium">GENERATIVE / REALTIME</span>
          </div>
        </div>

        <section id="work" className="pf-section pf-work">
          <Light palette="night" seed={6} className="pf-light--top pf-light--soft" />
          <header className="pf-section__head" data-reveal="">
            <span className="index">Selected work · {projects.length} projects</span>
            <h2>Things I built<br /><span className="pf-soft">and still use.</span></h2>
            <p>From agents to client work. Open a project for the full story; public ones link to their repository.</p>
          </header>
          <WorkList />
          <div className="pf-section__cta" data-reveal="">
            <RainbowButton href={profile.github} target="_blank" rel="noopener noreferrer">All repositories ↗</RainbowButton>
          </div>
        </section>

        <section id="approach" className="pf-section pf-approach">
          <Light palette="moss" seed={8} className="pf-light--band" />
          <span className="index" data-reveal="">Approach</span>
          <ProximityText text="Most of what I build starts as a conversation with a model and ends as code I understand line by line. The part I care about is where it actually works." />
          <dl className="pf-stack" data-reveal="">
            {stack.map((s, i) => (
              <div key={s.label} style={{ '--hue': `var(--pf-t-${STACK_HUES[i % STACK_HUES.length]})` } as React.CSSProperties}>
                <dt>{s.label}</dt><dd>{s.items}</dd>
              </div>
            ))}
          </dl>
          <div className="pf-tools" data-reveal="">
            <dl><div><dt>Every day</dt><dd>The tools open on my machine right now, from the models I think with to where the code ships.</dd></div></dl>
            <ToolDock />
          </div>
        </section>

        <section id="lab" className="pf-section pf-lab">
          <Light palette="ice" seed={7} className="pf-light--band" />
          <header className="pf-section__head" data-reveal="">
            <span className="index">AI Lab · {stats.runs} runs</span>
            <h2>Every model.<br /><span className="pf-soft">Every result.</span></h2>
            <p>{stats.runs} runs of {stats.models} models on the same prompts, failures included. Where a model produced a site, you can open it exactly as it came out.</p>
          </header>
          <dl className="pf-figures" data-reveal="">
            <div><dt>Runs</dt><dd data-count={stats.runs}>{stats.runs}</dd></div>
            <div><dt>Models</dt><dd data-count={stats.models}>{stats.models}</dd></div>
            <div><dt>Live previews</dt><dd data-count={stats.previews}>{stats.previews}</dd></div>
            <div><dt>Success rate</dt><dd><span data-count={stats.successRate}>{stats.successRate}</span><small>%</small></dd></div>
          </dl>
          <RunField groups={groups} />
          <div className="pf-section__cta pf-section__cta--start" data-reveal="">
            <RainbowButton href="/lab">Open the Lab</RainbowButton>
          </div>
        </section>

        <section id="contact" className="pf-section pf-contact">
          <Light palette="ember" seed={11} className="pf-light--bottom" />
          <HorizonGlow />
          <span className="index" data-reveal="">Contact</span>
          <h2 data-reveal="" style={{ '--d': '.08s' } as React.CSSProperties}>Got something that<br /><span className="pf-soft">needs building?</span></h2>
          <p data-reveal="" style={{ '--d': '.16s' } as React.CSSProperties}>Open for internships, collaborations and client projects. <Link href="/services" className="pf-inline-link">See what I offer →</Link></p>
          <div className="pf-contact__actions" data-reveal="" style={{ '--d': '.24s' } as React.CSSProperties}>
            <Magnetic><ShinyButton href={`mailto:${profile.email}`}>Email me</ShinyButton></Magnetic>
            <a className="pf-textlink" href={profile.github} target="_blank" rel="noreferrer">GitHub <span>@LePro10</span> ↗</a>
          </div>
          <div className="pf-contact__copy" data-reveal="" style={{ '--d': '.32s' } as React.CSSProperties}>
            <CopyEmail email={profile.email} />
          </div>
        </section>
      </main>
    </>
  );
}
