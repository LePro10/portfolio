/**
 * Paletten wie im Dashboard (AMBIENT/PALETTES), mitteltonig: das Licht soll das Dunkel
 * tönen, nie Text überstrahlen. Jede Sektion hat ihre eigene Stimmung.
 */
export const PALETTES = {
  dusk: ['#06070d', '#3a2fd0', '#7a5ce0', '#c9844f', '#0a090e'],
  night: ['#05070e', '#1f3ad6', '#4f8fe0', '#7b66e8', '#07080e'],
  ice: ['#050a0e', '#1d5fc9', '#3f9bd6', '#6b7fe6', '#070a0e'],
  luna: ['#06070d', '#1f38e0', '#6a57e6', '#a8946c', '#08090e'],
  ember: ['#0a080e', '#4630d0', '#c95a36', '#a88e6a', '#0c0a0e'],
  moss: ['#060a0b', '#1b5fae', '#2f9a7a', '#c4743f', '#080a0b'],
  sand: ['#0b0a08', '#8a6b3a', '#b89a64', '#5a63c9', '#0c0b09'],
} as const;
export type Palette = keyof typeof PALETTES;
