'use client';

import { Component, type ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import { Scene } from '@/components/scene/Scene';

const FALLBACK = <p className="fallback">This study needs a browser with WebGL enabled.</p>;

class CanvasBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? FALLBACK : this.props.children; }
}

/** Nur im Browser geladen (next/dynamic, ssr: false): three.js greift beim Start auf window zu. */
export default function SceneCanvas({ running, onError }: { running: boolean; onError: () => void }) {
  return (
    <CanvasBoundary>
      <Canvas
        frameloop={running ? 'always' : 'never'}
        camera={{ fov: 48, near: 0.1, far: 100 }}
        dpr={[1, 1.75]}
        gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }}
        fallback={FALLBACK}
      >
        <Scene onError={onError} />
      </Canvas>
    </CanvasBoundary>
  );
}
