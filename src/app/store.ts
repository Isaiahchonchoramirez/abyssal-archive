import { create } from 'zustand';

export type Phase = 'gate' | 'diving' | 'quick';

type State = {
  phase: Phase;
  /** Slug of the landmark the jellyfish is currently close enough to inspect. */
  nearby: string | null;
  /** Slug of the nearest landmark, near or not. Drives the HUD's objective line. */
  target: string | null;
  /** Whole world-units to `target`. Rounded so the store only wakes on a real change. */
  targetDistance: number;
  /** Slug of the case study open as a full overlay. Blocks player input while set. */
  active: string | null;
  reducedMotion: boolean;
  lowQuality: boolean;
  touch: boolean;
  /** False when the browser cannot give us a WebGL context at all. */
  webgl: boolean;
  showPerf: boolean;
  pointerLocked: boolean;
  /** Model attribution panel. Every GLB here is CC-BY, so this is a licence term, not a nicety. */
  credits: boolean;

  begin: () => void;
  quickPortfolio: () => void;
  setNearby: (slug: string | null) => void;
  setTarget: (slug: string | null) => void;
  setTargetDistance: (d: number) => void;
  open: (slug: string) => void;
  close: () => void;
  setReducedMotion: (v: boolean) => void;
  togglePerf: () => void;
  setPointerLocked: (v: boolean) => void;
  openCredits: () => void;
  closeCredits: () => void;
};

const prefersReduced =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const isTouch =
  typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;

/**
 * Locked-down corporate laptops, old GPUs and blocklisted drivers all fail here.
 * Without this check they reach a gate whose only button leads to a black void.
 */
function detectWebGL() {
  if (typeof document === 'undefined') return false;
  try {
    const c = document.createElement('canvas');
    return Boolean(c.getContext('webgl2') ?? c.getContext('webgl'));
  } catch {
    return false;
  }
}

const webglOk = detectWebGL();

// Coarse pointer or few cores is our proxy for "cut the particle count and pixel ratio".
const isLowPower =
  isTouch ||
  (typeof navigator !== 'undefined' && (navigator.hardwareConcurrency ?? 8) <= 4);

export const useStore = create<State>((set) => ({
  // No WebGL means the dive cannot happen — start on the readable path instead
  // of failing halfway through it.
  phase: webglOk ? 'gate' : 'quick',
  nearby: null,
  target: null,
  targetDistance: 0,
  active: null,
  reducedMotion: prefersReduced,
  lowQuality: isLowPower,
  touch: isTouch,
  webgl: webglOk,
  showPerf: false,
  pointerLocked: false,
  credits: false,

  begin: () => set((s) => (s.webgl ? { phase: 'diving' } : { phase: 'quick' })),
  quickPortfolio: () => set({ phase: 'quick' }),
  setNearby: (slug) => set({ nearby: slug }),
  setTarget: (slug) => set({ target: slug }),
  setTargetDistance: (d) => set({ targetDistance: d }),
  open: (slug) => set({ active: slug }),
  close: () => set({ active: null }),
  setReducedMotion: (v) => set({ reducedMotion: v }),
  togglePerf: () => set((s) => ({ showPerf: !s.showPerf })),
  setPointerLocked: (v) => set({ pointerLocked: v }),
  openCredits: () => set({ credits: true }),
  closeCredits: () => set({ credits: false }),
}));
