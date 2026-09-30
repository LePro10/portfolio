/** Copy for /services. Kept apart from layout so text edits never touch markup. */

export const packages = [
  {
    title: 'Website',
    audience: 'For freelancers, clubs and small businesses that want to be taken seriously online.',
    scope: ['Concept and design', 'Hand-written code', 'Responsive on every screen', 'Accessible and fast', 'SEO basics', 'Launch and handover'],
    tags: 'Next.js, Self-hosted',
  },
  {
    title: 'Web app',
    audience: 'For workflows that need more than a business card: logins, data, dashboards.',
    scope: ['Concept and data model', 'Built with Next.js', 'Login and roles', 'Database', 'Hosting on request'],
    tags: 'TypeScript, Auth, PostgreSQL',
  },
  {
    title: 'AI integration',
    audience: 'For anyone who wants to use AI as a tool, not a buzzword.',
    scope: ['Look at your use case', 'Working prototype', 'Fit into your process', 'Self-hosted options', 'An honest call on what is worth it'],
    tags: 'LLM workflows, Automation, Local models',
  },
];

export const process = [
  { title: 'First call', description: 'You explain, I listen and ask. Afterwards you know whether and how I can help. No strings attached.' },
  { title: 'Concept & design', description: 'Structure, content and look are settled before any code exists. You get a fixed-price offer.' },
  { title: 'Build', description: 'I build and show you progress along the way. You always know where the project stands.' },
  { title: 'Launch & care', description: 'The site goes live, on my server or yours, with support afterwards if you want it.' },
];

export const faq = [
  { q: 'What does a project cost?', a: 'It depends on scope. After the first call you get a fixed-price offer, and no surprises after that.' },
  { q: 'How long does it take?', a: 'Also depends on scope. You get a schedule together with the offer, and see progress while I build.' },
  { q: 'Where does my site run?', a: 'On my own server in Switzerland, or with your host. We decide during the concept.' },
  { q: 'Can I edit content myself?', a: 'Yes, if you want to. We settle that in the concept.' },
  { q: 'Do you use AI?', a: 'Where it helps. The public AI Lab on this site shows what models can do today, and where I still do it by hand.' },
];
