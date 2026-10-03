/** All portfolio copy lives here, so text edits never touch layout code. */

export const profile = {
  name: 'Leandro Probst',
  age: 16,
  location: 'Switzerland',
  github: 'https://github.com/LePro10',
  email: 'contact@neuralhub.dev',
};

export type CoverKind = 'rings' | 'terrain' | 'grid' | 'flow' | 'map' | 'wave';
/** Lichtfarben aus der Dashboard-Palette (Tokens --pf-t-* in globals.css). */
export type Hue = 'ice' | 'azure' | 'lilac' | 'sand' | 'ember' | 'mint';

export interface Project {
  name: string;
  stack: string;
  summary: string;
  tags: string;
  cover: CoverKind;
  /** Eigene Lichtfarbe: Nummer, Hover-Balken und Cover leuchten darin. */
  hue: Hue;
  /** Longer text for the project dialog. */
  details: string;
  /** Public repositories link out; private ones are listed without a link. */
  url?: string;
}

export const projects: Project[] = [
  { name: 'NeuralHub', stack: 'TypeScript', summary: 'Personal AI dashboard run by Luna, an agent I built to handle my day-to-day tooling.', tags: 'Agents, Dashboard, LLM tooling', cover: 'rings', hue: 'lilac', details: 'A self-hosted hub that collects my tools, notes and automations in one place. Luna, the agent behind it, can run tasks, look things up and report back, so the dashboard is less a website and more a control room.' },
  { name: 'omp-designer', stack: 'JavaScript', summary: 'Design workflow for the Pi coding agent: anti-slop rules, visual review and design tooling.', tags: 'AI tooling, Design systems', cover: 'wave', hue: 'sand', details: 'Gives a coding agent taste: a set of design rules against generic AI layouts, a loop that screenshots and reviews its own output, and tooling to push results closer to a real design system.', url: 'https://github.com/LePro10/omp-designer' },
  { name: 'aiBrowser', stack: 'TypeScript', summary: 'Browser interface where a model navigates and automates pages for you.', tags: 'Automation, Agents', cover: 'flow', hue: 'ice', details: 'An experiment in letting a model use the web like a person: it reads pages, clicks, fills in forms and explains what it did, while you watch every step.' },
  { name: 'multiTerminal', stack: 'Electron', summary: 'Terminal grid with split panes, reusable layouts and broadcast input to every pane.', tags: 'Developer tools, Desktop', cover: 'grid', hue: 'mint', details: 'An Electron app that tiles many terminals into one window. Layouts can be saved as templates, and one input line can be broadcast to every pane at once, which is handy for servers and parallel builds.', url: 'https://github.com/LePro10/multiTerminal' },
  { name: 'VoidHost', stack: 'C#', summary: 'Minecraft server hosting with cloud sync, SSH tunnelling and multi-device management.', tags: 'Networking, Infrastructure', cover: 'terrain', hue: 'ember', details: 'Host Minecraft servers from your own machines: worlds sync to the cloud, SSH tunnels make them reachable without port forwarding, and several devices can be managed from one place.' },
  { name: 'japanMap', stack: 'TypeScript', summary: 'Interactive map for exploring places and data across Japan.', tags: 'Maps, Data, Interaction', cover: 'map', hue: 'azure', details: 'A map-first way to explore Japan: places, regions and data layers you can move through interactively instead of reading them from a list.', url: 'https://github.com/LePro10/japanMap' },
  { name: 'mcAi', stack: 'JavaScript', summary: 'Experiments that connect Minecraft workflows to AI-powered tooling.', tags: 'AI, Games', cover: 'flow', hue: 'mint', details: 'A playground for combining Minecraft with AI: generating content, automating repetitive workflows and testing how far models can go inside a game.' },
  { name: 'piRemote', stack: 'Dart', summary: 'Remote-control app and tooling for Raspberry Pi devices.', tags: 'Hardware, Mobile', cover: 'rings', hue: 'ice', details: 'A Flutter app plus helper tools to control Raspberry Pi devices from a phone: run commands, check status and trigger scripts without opening a terminal.' },
  { name: 'InFITnity System', stack: 'PHP', summary: 'WordPress booking system with Google Calendar sync and admin tools, built for a fitness studio.', tags: 'Client work, Booking', cover: 'grid', hue: 'ember', details: 'A booking system on WordPress for a fitness studio. Bookings sync both ways with Google Calendar, and the admin area handles slots, customers and changes.' },
  { name: 'QuizletPlus', stack: 'React', summary: 'Learning app for studying and organising school material.', tags: 'Education, Web app', cover: 'wave', hue: 'sand', details: 'A study app for school: create sets, organise material by subject and practise with modes that focus on what you still get wrong.' },
];

export const stack = [
  { label: 'Languages', items: 'TypeScript, JavaScript, C#, PHP, Dart' },
  { label: 'AI', items: 'Claude Code, agents, MCP, prompt tooling' },
  { label: 'Web', items: 'React, Three.js, Vite, Tailwind' },
  { label: 'Systems', items: 'Electron, WordPress, SSH, Raspberry Pi' },
];

/** Everyday tools for the dock in Approach. `fit` balances each logo's optical size on its tile. */
export const tools: { label: string; icon: string; fit?: string }[] = [
  { label: 'Claude', icon: '/tools/claude.svg', fit: '56%' },
  { label: 'Codex', icon: '/tools/codex.svg', fit: '60%' },
  { label: 'BridgeMind One', icon: '/tools/bridgemind.svg', fit: '58%' },
  { label: 'Obsidian', icon: '/tools/obsidian.svg', fit: '50%' },
  { label: 'GitHub', icon: '/tools/github.svg', fit: '54%' },
  { label: 'Vercel', icon: '/tools/vercel.svg', fit: '44%' },
  { label: 'VS Code', icon: '/tools/vscode.svg', fit: '54%' },
  { label: 'Open WebUI', icon: '/tools/openwebui.svg', fit: '54%' },
];

/** Navigation. `section` verbindet einen Link mit dem Anker, der ihn beim Scrollen aktiv markiert. */
export const nav = [
  { label: 'Index', href: '/', note: 'Back to the start' },
  { label: 'About', href: '/#about', note: 'Who I am', section: 'about' },
  { label: 'Work', href: '/#work', note: `${projects.length} projects`, section: 'work' },
  { label: 'Lab', href: '/lab', note: 'Models building websites', section: 'lab' },
  { label: 'Services', href: '/services', note: 'Packages and process' },
  { label: 'Contact', href: '/#contact', note: 'Email or GitHub', section: 'contact' },
];

export const site = {
  url: 'https://neuralhub.dev',
  /** Privates Dashboard, eigener Host und eigenes Repo. Nur verlinkt. */
  dashboard: 'https://dashboard.neuralhub.dev',
};
