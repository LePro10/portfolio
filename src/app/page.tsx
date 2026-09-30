import Link from 'next/link';
import { RainbowButton } from '@/components/buttons/RainbowButton';
import { ShinyButton } from '@/components/buttons/ShinyButton';
import { HomeScene } from '@/components/home/HomeScene';
import { ProximityText } from '@/components/home/ProximityText';
import { ToolDock } from '@/components/home/ToolDock';
import { WorkList } from '@/components/home/WorkList';
import { profile, projects, stack } from '@/content/profile';
import { labStats, loadLab } from '@/lab/load';

const AGE_WORDS: Record<number, string> = { 15: 'Fifteen', 16: 'Sixteen', 17: 'Seventeen', 18: 'Eighteen', 19: 'Nineteen', 20: 'Twenty' };

export default function HomePage() {
  const { collections } = loadLab();
  const stats = labStats(collections);
  const featured = collections.flatMap((c) => c.runs).filter((r) => r.featured && r.href);

  return (
    <>
      <HomeScene />
      <main>
        <div className="scene-track">
          <section className="study mountain-title" aria-label="Introduction">
            <div className="index">00 / INDEX — AGE {profile.age}</div>
            <h1>{profile.name}</h1>
            <p>I build AI tools, agents and the interfaces around them.</p>
          </section>
          <span id="about" className="scene-anchor" />
          <section className="study earth-title" aria-label="About">
            <div className="index">01 / ABOUT</div>
            <h2>{AGE_WORDS[profile.age] ?? profile.age}, from {profile.location}.</h2>
            <p className="about-copy">Most of my time goes where AI meets real software: agents that do actual work, tools that make me faster, and interfaces that make both usable. Most of my repositories started as something I needed myself.</p>
          </section>
          <dl className="about-stats earth-stats">
            <div><dt>Age</dt><dd>{profile.age}</dd></div>
            <div><dt>Repositories</dt><dd>19</dd></div>
            <div><dt>Languages</dt><dd>6</dd></div>
          </dl>
          <div className="footer" aria-hidden="true">
            <div className="instruction"><span className="mountain-instruction">MOVE TO DISTURB</span><span className="earth-instruction">MOVE TO ILLUMINATE</span><span className="touch-instruction">TOUCH TO INTERACT</span></div>
            <div className="scroll-cue"><span className="mountain-instruction">SCROLL TO EXPLORE</span><span className="earth-instruction">SCROLL FOR WORK</span><span className="arrow">↓</span></div>
            <span className="medium">GENERATIVE / REALTIME</span>
          </div>
        </div>

        <section id="work" className="pf-section">
          <header className="pf-section__head">
            <span className="index">02 / SELECTED WORK</span>
            <h2>Things I built<br />and still use.</h2>
            <p>{projects.length} projects, from agents to client work. Public ones link straight to the repository.</p>
          </header>
          <WorkList />
          <div className="pf-section__cta">
            <RainbowButton href={profile.github} target="_blank" rel="noopener noreferrer">All repositories ↗</RainbowButton>
          </div>
        </section>

        <section id="approach" className="pf-section pf-approach">
          <span className="index">03 / APPROACH</span>
          <ProximityText text="Most of what I build starts as a conversation with a model and ends as code I understand line by line. The part I care about is where it actually works." />
          <dl className="pf-stack">
            {stack.map((s) => <div key={s.label}><dt>{s.label}</dt><dd>{s.items}</dd></div>)}
          </dl>
          <div className="pf-tools">
            <dl><div><dt>Every day</dt><dd>The tools open on my machine right now, from the models I think with to where the code ships.</dd></div></dl>
            <ToolDock />
          </div>
        </section>

        <section id="lab" className="pf-section pf-approach pf-lab-teaser">
          <header className="pf-section__head pf-section__head--flush">
            <span className="index">04 / AI LAB</span>
            <h2>Every model.<br />Every result.</h2>
            <p>{stats.runs} runs of {stats.models} models on the same prompts, failures included. Where a model produced a site, you can open it exactly as it came out.</p>
          </header>
          <dl className="pf-stack pf-stack--numbers">
            <div><dt>Runs</dt><dd>{stats.runs}</dd></div>
            <div><dt>Models</dt><dd>{stats.models}</dd></div>
            <div><dt>Live previews</dt><dd>{stats.previews}</dd></div>
            <div><dt>Success rate</dt><dd>{stats.successRate}%</dd></div>
          </dl>
          {featured.length > 0 && (
            <ul className="pf-featured">
              {featured.map((r) => (
                <li key={r.href}>
                  <a href={r.href!} target="_blank" rel="noopener noreferrer">
                    <span className="pf-featured__title">{r.featured}</span>
                    <span className="pf-featured__model">{r.model}</span>
                    <span aria-hidden="true">↗</span>
                  </a>
                </li>
              ))}
            </ul>
          )}
          <div className="pf-section__cta pf-section__cta--start">
            <RainbowButton href="/lab">Open the Lab</RainbowButton>
          </div>
        </section>

        <section id="contact" className="pf-section pf-contact">
          <span className="index">05 / CONTACT</span>
          <h2>Got something that<br />needs building?</h2>
          <p>Open for internships, collaborations and client projects. <Link href="/services" className="pf-inline-link">See what I offer →</Link></p>
          <div className="pf-contact__actions">
            <ShinyButton href={`mailto:${profile.email}`}>Email me</ShinyButton>
            <a className="pf-textlink" href={profile.github} target="_blank" rel="noreferrer">GitHub <span>@LePro10</span> ↗</a>
          </div>
        </section>
      </main>
    </>
  );
}
