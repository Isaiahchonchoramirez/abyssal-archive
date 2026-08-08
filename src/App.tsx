import { useEffect, useState } from 'react';
import { useStore } from './app/store';
import { OceanCanvas } from './experience/OceanCanvas';
import { useInputBindings } from './experience/controllers/useInputBindings';
import { CaseStudy } from './ui/CaseStudy';
import { Credits } from './ui/Credits';
import { HUD } from './ui/HUD';
import { PerfMeter } from './ui/PerfMeter';
import { QuickPortfolio } from './ui/QuickPortfolio';
import { StartGate } from './ui/StartGate';
import { TouchControls } from './ui/TouchControls';

export default function App() {
  const phase = useStore((s) => s.phase);
  const active = useStore((s) => s.active);
  const showPerf = useStore((s) => s.showPerf);
  const touch = useStore((s) => s.touch);
  const setReducedMotion = useStore((s) => s.setReducedMotion);
  const [canvasEl, setCanvasEl] = useState<HTMLCanvasElement | null>(null);

  useInputBindings(canvasEl);

  // Respect the OS setting changing mid-session.
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [setReducedMotion]);

  useEffect(() => {
    if (phase === 'quick' && document.pointerLockElement) document.exitPointerLock();
  }, [phase]);

  return (
    <>
      {/* Mounted during the gate too, so the GLB streams in behind the title
          and "Begin dive" never lands on a black screen. */}
      {phase !== 'quick' && <OceanCanvas onCanvasReady={setCanvasEl} />}

      {phase === 'gate' && <StartGate />}
      {phase === 'diving' && !active && (
        <>
          <HUD />
          {touch && <TouchControls />}
        </>
      )}
      {phase === 'quick' && <QuickPortfolio />}

      <CaseStudy />
      <Credits />
      {showPerf && <PerfMeter />}
    </>
  );
}
