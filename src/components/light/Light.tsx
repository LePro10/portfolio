import { MeshGradient } from './MeshGradient';
import { PALETTES, type Palette } from './palettes';

/**
 * Ein Lichtfeld wie das Ambient im Dashboard: Mesh-Gradient, zum Inhalt hin abgedunkelt
 * und per Maske in die Seitenfarbe auslaufend. Richtung und Lage regelt die Klasse
 * (.pf-light--top, --bottom, --band, --fixed); jede Sektion wählt ihre eigene Palette.
 */
export function Light({ palette, seed = 1, className = '', intensity = 0.55, warp = 0.35 }: {
  palette: Palette;
  seed?: number;
  className?: string;
  intensity?: number;
  warp?: number;
}) {
  return (
    <div aria-hidden="true" className={`pf-light ${className}`}>
      <MeshGradient colors={[...PALETTES[palette]]} intensity={intensity} falloff={0.32} warp={warp} grain={0} seed={seed} speed={0.35} resolution={0.34} />
    </div>
  );
}
