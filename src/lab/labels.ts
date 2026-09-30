import type { RunStack, RunStatus } from './schema.ts';

export const STATUS_LABEL: Record<RunStatus, string> = {
  success: 'Success',
  template: 'Template',
  'server-only': 'Server only',
  failed: 'Failed',
};

export const STACK_LABEL: Record<RunStack, string> = {
  'react-vite': 'React + Vite',
  'next-static': 'Next.js (static)',
  'next-server': 'Next.js (server)',
  'vanilla-html': 'HTML / JS',
  unknown: 'Unknown',
};
