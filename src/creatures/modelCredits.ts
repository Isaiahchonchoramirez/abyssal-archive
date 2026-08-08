/**
 * Model attribution.
 *
 * Every field here was read out of the GLB's own `asset.extras` block, which
 * Sketchfab writes at export time — not transcribed from a download page, so it
 * cannot drift from the file that actually ships.
 *
 * All four are CC-BY-4.0. That licence requires attribution to be shown to the
 * people who see the work, which is why this renders in the site rather than
 * only sitting in ASSETS.md.
 */
export type ModelCredit = {
  file: string;
  title: string;
  author: string;
  authorUrl: string;
  source: string;
  license: string;
  licenseUrl: string;
};

export const MODEL_CREDITS: ModelCredit[] = [
  {
    file: 'jellyfish.glb',
    title: 'Crystal Jellyfish (Leptomedusae)',
    author: 'n-',
    authorUrl: 'https://sketchfab.com/n-',
    source:
      'https://sketchfab.com/3d-models/crystal-jellyfish-leptomedusae-38ac0d91213d447eb3366f615298ce8f',
    license: 'CC BY 4.0',
    licenseUrl: 'http://creativecommons.org/licenses/by/4.0/',
  },
  {
    file: 'manta-ray.glb',
    title: 'Manta Ray',
    author: 'Chenzoss',
    authorUrl: 'https://sketchfab.com/Chenzoss',
    source:
      'https://sketchfab.com/3d-models/manta-ray-c9989ab953164ee5baa3f401f6041fc9',
    license: 'CC BY 4.0',
    licenseUrl: 'http://creativecommons.org/licenses/by/4.0/',
  },
  {
    file: 'whale-shark.glb',
    title: 'Whale Shark Game Ready',
    author: 'kenchoo',
    authorUrl: 'https://sketchfab.com/kenchoo',
    source:
      'https://sketchfab.com/3d-models/whale-shark-game-ready-e32a1b2715384935a7f23d1498463339',
    license: 'CC BY 4.0',
    licenseUrl: 'http://creativecommons.org/licenses/by/4.0/',
  },
  {
    file: 'great-white-shark.glb',
    title: 'Great White Shark',
    author: 'charliegodofsharks',
    authorUrl: 'https://sketchfab.com/charliegodofsharks',
    source:
      'https://sketchfab.com/3d-models/great-white-shark-bf81b64f0121443da38112f706b7356f',
    license: 'CC BY 4.0',
    licenseUrl: 'http://creativecommons.org/licenses/by/4.0/',
  },
];
