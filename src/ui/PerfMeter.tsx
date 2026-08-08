import { useEffect, useState } from 'react';

/**
 * Frame timing read off rAF rather than from inside the R3F loop, so the meter
 * itself never causes a re-render during rendering. Toggle with P.
 */
export function PerfMeter() {
  const [stats, setStats] = useState({ fps: 0, ms: 0 });

  useEffect(() => {
    let raf = 0;
    let frames = 0;
    let last = performance.now();
    let acc = 0;

    const tick = (now: number) => {
      const dt = now - last;
      last = now;
      frames++;
      acc += dt;
      if (acc >= 500) {
        setStats({ fps: Math.round((frames * 1000) / acc), ms: +(acc / frames).toFixed(2) });
        frames = 0;
        acc = 0;
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const tone = stats.fps >= 55 ? 'good' : stats.fps >= 40 ? 'ok' : 'bad';

  return (
    <div className={`perf perf--${tone}`}>
      <span>{stats.fps} fps</span>
      <span>{stats.ms} ms</span>
    </div>
  );
}
