export type Category =
  | 'ai'
  | 'data'
  | 'web'
  | 'design'
  | '3d'
  | 'simulation';

export type Project = {
  slug: string;
  title: string;
  summary: string;
  category: Category;
  role: string;
  year: string;
  technologies: string[];
  /** World-space anchor for the landmark. */
  position: [number, number, number];
  /** Accent colour — drives the landmark glow and the HUD tint in range. */
  accent: string;
  /** Inner-ring work. Drives nothing mechanical yet; kept for ordering. */
  featured?: boolean;
  links: { label: string; href: string }[];
  caseStudy: {
    problem: string;
    process: string;
    outcome: string;
    decisions: string[];
    /**
     * Optional on purpose. A retrospective is a first-person claim, so a
     * project only carries one where the source material actually supports it
     * rather than having one invented to fill the section.
     */
    lessons?: string;
  };
};

/**
 * Ported from the `isaiahramirezdev` portfolio, which stays the source of truth
 * for the prose. Landmarks sit on two rings: the featured six at ~62 units, the
 * rest at ~112, against a 150-unit bound and roughly 120 units of fog. Nothing
 * is visible from spawn except the nearest beacon, which is the point.
 */
export const PROJECTS: Project[] = [
  // ---- inner ring ---------------------------------------------------------
  {
    slug: 'tesseraxis',
    title: 'Tesseraxis',
    summary: 'Engineering systems you can see.',
    category: 'simulation',
    role: 'Simulation architecture · Control systems · Physics · Product design',
    year: '2026',
    technologies: [
      'JavaScript',
      'Three.js',
      'WebGL',
      'ECS',
      'Control Theory',
      'Numerical Simulation',
    ],
    position: [0, 3, -62],
    accent: '#7cf0d0',
    featured: true,
    links: [{ label: 'Open Tesseraxis', href: '/tesseraxis/index.html' }],
    caseStudy: {
      problem:
        'Engineering simulations are often either opaque specialist tools or attractive demos that hide the mathematics driving them.',
      process:
        'Tesseraxis is a modular engineering simulation platform built around a deterministic fixed-timestep engine. Its Powered Descent Lab exposes six-degree-of-freedom rocket dynamics and PID guidance; its Swarm Intelligence Lab models distributed coordination across thousands of agents; and its Vehicle Dynamics Lab exposes tire saturation, load transfer, suspension response, braking, weather, collisions, and autonomous path tracking.',
      outcome:
        'A browser-native engineering laboratory with deterministic physics, inspectable controllers, replayable runs, and three complete simulation plugins.',
      decisions: [
        'Reusable plugin SDK — the rocket and swarm laboratories use the same engine, inspector, timeline, graphing, replay, sharing, and export contracts',
        'Deterministic 120 Hz simulation loop with seeded disturbances and journaled control inputs',
        'Powered landing with variable mass, fuel consumption, aerodynamic instability, engine gimbal, actuator limits, and live PID tuning',
        'Swarm intelligence with separation, alignment, cohesion, search coverage, packet loss, and approximately O(n) spatial-neighbor discovery',
        'Vehicle dynamics with nonlinear tire saturation, longitudinal load transfer, spring-damper body response, wet-road braking, collision constraints, and curvature-aware autonomous driving',
        'Instanced Three.js rendering, force vectors, flight trails, mission objectives, and scalable telemetry views',
        'Headless regression harnesses verify collective swarm behavior and exact seeded reproduction without requiring a renderer',
        'Research primitives compile deterministic scenario scripts and run seeded parameter sweeps locally, with a FastAPI boundary designed for isolated optimization, RL, and collaboration workers',
      ],
    },
  },
  {
    slug: 'trade-assistant',
    title: 'AI Trade Assistant',
    summary: 'When money goes in, and when it comes out.',
    category: 'ai',
    role: 'Product design · Full-stack engineering · Data science',
    year: '2025 — 2026',
    technologies: ['Python', 'FastAPI', 'React', 'pandas', 'Technical Analysis'],
    position: [53.7, -6, -31],
    accent: '#ffb35c',
    featured: true,
    links: [
      { label: 'Open the dashboard', href: '/trade-assistant/index.html' },
      {
        label: 'Download it free',
        href: 'https://github.com/Isaiahchonchoramirez/ai-trade-assistant/releases/latest',
      },
    ],
    caseStudy: {
      problem:
        'Market tools often produce opaque calls without showing whether the same logic survived historical testing.',
      process:
        'A market dashboard that scores a stock the way an analyst would, then proves the scoring out on history. Seven technical factors each read the tape independently and combine by weight into one number from −100 to +100, which becomes an action with a real entry, stop and target. The same scoring code is then replayed bar by bar over years of history to show what following it would actually have returned — against simply buying and holding.',
      outcome:
        'A transparent market dashboard that explains every signal and tests it without lookahead bias.',
      decisions: [
        'Seven-factor composite signal — trend structure, MACD, moving-average cross, RSI, ADX, volume flow and Bollinger position — each shown with its own contribution and a plain-English reason, so nothing is a black box',
        "Backtest with no lookahead: a signal computed from one bar's close is acted on at the next bar's open, every fill pays commission and slippage, and a gap below the stop fills at the open rather than at a price the market never traded",
        'Reports drawdown and Sharpe beside return, and marks whichever side wins each measure — on most large caps buy-and-hold wins on return while the strategy wins on drawdown, and the app says so',
        'Grades its own evidence: under ten round trips it tells you the sample cannot separate an edge from luck',
        'Colour is never the only signal — the green/red convention fails a colourblind check at ΔE 4.1, so every value also carries a sign, an arrow and a label, and one toggle swaps in a validated blue/orange pair at ΔE 24.7',
        'Charts flip to a log scale automatically once the span demands it, so forty-five years of price history stays readable instead of collapsing onto the baseline',
        'Assistant answers from the computed indicators rather than from memory, so it cannot invent a number — with an optional Claude upgrade for open-ended questions',
        'Free to download and run locally against live market data — one double-click, Python and nothing else, no API keys or account',
      ],
    },
  },
  {
    slug: 'lyrx',
    title: 'Lyrx',
    summary: 'A full music studio in one tab.',
    category: 'ai',
    role: 'Product design · Audio engineering · Frontend development',
    year: '2026',
    technologies: ['JavaScript', 'Web Audio API', 'Canvas'],
    position: [53.7, 5, 31],
    accent: '#ff6fd8',
    featured: true,
    links: [
      { label: 'Open the studio', href: '/lyrx/index.html' },
      { label: 'Pairs with DataCore', href: '/datacore/index.html' },
    ],
    caseStudy: {
      problem:
        'Powerful music tools are often expensive, installation-heavy, and intimidating to new producers.',
      process:
        'Lyrx is a complete digital audio workstation that runs entirely in the browser — no install, no account, no plugins. I built the synth engine on the raw Web Audio API, the windowed desktop that holds twenty-six dockable tools, and an AI producer that turns a plain-language description of a beat into a working arrangement. Everything saves locally and exports to WAV.',
      outcome:
        'A browser-based studio with 26 tools, 85 instruments, local saving, and WAV export.',
      decisions: [
        'Synth engine written from scratch on the Web Audio API — 85 instruments, from 808s and supersaws to tabla, banjo and pedal steel',
        'Twenty-six dockable windows: step sequencer, piano roll, mixer with buses and sends, plugin rack, automation curves, spectrum and LUFS metering, mastering',
        'Fifty built-in presets spanning forty-plus genres — techno, trap, bossa nova, bhangra, gospel, drum & bass and more',
        'Describe a beat in plain words and the AI producer lays it down',
        "Linked to DataCore — each app opens the other, and DataCore's studio screens hand off straight into a Lyrx session",
      ],
    },
  },
  {
    slug: 'datacore',
    title: 'DataCore',
    summary: 'Governed AI training data.',
    category: 'data',
    role: 'Systems design · Data governance · Frontend development',
    year: '2026',
    technologies: ['JavaScript', 'Design Systems', 'Data Pipeline UX'],
    position: [0, -9, 62],
    accent: '#6fa8ff',
    featured: true,
    links: [
      { label: 'Open DataCore', href: '/datacore/index.html' },
      { label: 'Pairs with Lyrx', href: '/lyrx/index.html' },
    ],
    caseStudy: {
      problem:
        'Training pipelines often hide where data came from and whether its use was actually authorized.',
      process:
        'DataCore is a control surface for training an AI on data you are actually licensed to use — a governed refinery rather than one giant scraper feeding one giant model. I designed the seven-stage pipeline, the rights-classification model that decides what may be kept, and the audit views that show exactly what got removed and why. The premise: publicly reachable is not the same as authorized to train on.',
      outcome:
        'A seven-stage, rights-aware data pipeline with consent gates and a complete removal audit.',
      decisions: [
        'Seven-stage pipeline — discover, acquire, classify rights, extract, compress, index, train',
        'Rights classification per source, with consent required before any voice is cloned',
        'Full removal audit — duplicates, unsupported media, low-quality and restricted content, each with a reason',
        'Compresses to a portable, inspectable archive instead of an opaque neural net',
        'Neon-noir interface with a full light theme, built on a shared design system',
        'Voice Studio and Music Studio hand off into Lyrx, the DAW half of the same stack',
        'Backed by a real local crawler — robots-aware, rights-gated, and you choose item by item what gets kept and passed to Lyrx',
      ],
    },
  },
  {
    slug: 'unwritten-age',
    title: 'The Unwritten Age',
    summary: 'A mythic RPG where memory rewrites the world.',
    category: '3d',
    role: 'Game systems · Procedural 3D · World design · UX',
    year: '2026',
    technologies: [
      'JavaScript',
      'Three.js',
      'WebGL',
      'Procedural Generation',
      'Game Systems',
    ],
    position: [-53.7, 6, 31],
    accent: '#ffd166',
    featured: true,
    links: [{ label: 'Enter the Unwritten Age', href: '/unwritten-age/index.html' }],
    caseStudy: {
      problem:
        'Build an explorable prehistoric world without copying familiar fantasy settings — and make history, mythology, character identity, and progression reinforce one another.',
      process:
        'The Unwritten Age is a browser RPG set in a compressed mythological interpretation of Earth around 30,000–12,000 BCE. You inhabit a customizable mortal body, develop practical skills and divine Aspects, encounter remembered beasts, and discover locations informed by real archaeology. Its central mechanic is erasure: defeating a god removes their name, gifts, quests, and monuments from history while the player alone remembers what changed.',
      outcome:
        'A playable Three.js RPG prototype with character creation, combat, classes, cultures, factions, skills, beasts, ancient-site discovery, equipment, and a world-changing god-erasure mechanic.',
      decisions: [
        'Procedural humanoid with visible face, body, hair, clothing, ritual markings, scars, and live character-creation controls',
        'Five cultures and multiple combat callings without race-locked statistics',
        'Twelve 1–99 Practices, faction standing, combat abilities, quests, and persistent character presets',
        'Data-driven ancient sites inspired by Pavlov, Kostenki, Sunghir, and Chauvet, each separating archaeological evidence from fictional myth',
        'Material-aware equipment rewards using ivory, bone, hide, ochre, flint, stone, and wood rather than generic fantasy metal loot',
        "God erasure mutates the live world, interface, abilities, quest history, and the player's private Chronicle",
      ],
    },
  },
  {
    slug: 'datagate',
    title: 'DataGate',
    summary: 'Profiling your data without uploading it.',
    category: 'data',
    role: 'Product design · Statistics engine · Frontend development · Node service',
    year: '2026',
    technologies: ['TypeScript', 'React', 'Statistics', 'Node', 'Vite'],
    position: [-53.7, -4, -31],
    accent: '#9d7bff',
    featured: true,
    links: [{ label: 'Scan a dataset', href: '/datagate/index.html' }],
    caseStudy: {
      problem:
        'A data profiler is easy to fake — charts and percentages look convincing whether or not anything was measured. The version I designed in Figma had exactly that problem: it advertised stock prediction and phone lookups, and its upload zone ran a timer.',
      process:
        'Drop in a CSV, TSV, JSON or JSONL file and DataGate returns a real profile — no upload, no parsing library, no charting library. I wrote the RFC 4180 parser, the type-inference rules, the distribution statistics and the quality audit; the design started as a Figma Make export and the engine underneath it is new. The premise is that a tool making claims about your data should be checkable, so every number it reports is computed from the file in front of you and the tests assert them against values worked out by hand.',
      outcome:
        'A profiler that reads your file in the tab, types every column, measures every distribution, and names each duplicate, gap and outlier with the reason it matters — verified by 55 tests against hand-computed statistics.',
      decisions: [
        'Dependency-free parser — RFC 4180 quoting, newlines inside quoted fields, delimiter sniffing that a prose column full of commas cannot fool, ragged rows, and one-level JSON flattening',
        'Type inference across seven kinds, with two rules that matter: a zero-padded value like 007 stays text rather than becoming 7, and a near-unique column is an identifier, so it is kept out of the statistics instead of being averaged',
        "Per-column min, quartiles, median, mean, sample standard deviation and a histogram — integer columns spanning 20 values or fewer get one bar per value, so the shape shown is the data's and not the binning rule's",
        'Pearson correlation on pairwise-complete rows, ranked by strength, flagging collinear pairs — and stating plainly that it measures straight-line association only and is not evidence of causation',
        'Quality audit that explains consequences rather than just counting: why a 60%-missing column makes an average describe the rows that happened to be filled in, why a constant column adds noise to a model',
        'Exports the profile as Markdown or JSON, plus a cleaned CSV whose every removal is one the findings list already justified',
        '55 tests over the parser and the maths, including a seeded demo dataset whose planted duplicates and negative shipping-to-satisfaction correlation are asserted rather than assumed',
        'URL scanning runs against a small Node service rather than pretending the browser can read another origin — it refuses private and loopback addresses, and the interface says whether the service is up instead of faking a result',
      ],
      lessons:
        'The Figma version of this advertised stock prediction and phone lookups and ran a timer on its upload zone — it looked finished and measured nothing. Rebuilding it taught me that a profiler is the easiest kind of tool to fake, so the tests assert against statistics worked out by hand rather than against the code’s own output.',
    },
  },

  // ---- outer ring ---------------------------------------------------------
  {
    slug: 'rave-io',
    title: 'RAVE.IO',
    summary: 'Every sound built from an oscillator up.',
    category: 'web',
    role: 'Audio engineering · DSP · Interaction design · Frontend development',
    year: '2026',
    technologies: ['TypeScript', 'Web Audio API', 'React', 'DSP', 'Canvas'],
    position: [38.3, 4, -105.2],
    accent: '#ff5f6d',
    links: [
      { label: 'Open the studio', href: '/rave/index.html' },
      { label: 'Pairs with Lyrx', href: '/lyrx/index.html' },
    ],
    caseStudy: {
      problem:
        'My Figma draft looked like a DAW and was mostly a screenshot: the 56-instrument sound library changed nothing when you clicked it, there were no pitched instruments at all, the generate button wrote one hardcoded pattern regardless of genre, and the master meter was twelve numbers typed into an array.',
      process:
        'A step sequencer and melody roll that ships no samples — every instrument is synthesised in the browser from oscillators, filters and envelopes. I built the eight synthesis archetypes and the 56 voices on top of them, the scheduler that runs ahead of the audio clock, the per-genre rhythm generation, and the offline renderer. The interesting constraint was honesty: the sound library had to actually change the sound, and the exported file had to be the arrangement you heard rather than a second implementation of it.',
      outcome:
        'A working beat machine — 56 synthesised instruments across seven genres, a melody roll locked to the selected scale, per-genre rhythm generation, and a WAV render of the arrangement you actually heard.',
      decisions: [
        'Eight synthesis archetypes — plucked and bowed string, blown pipe, struck bell, membrane, metal, pad, lead, sub — each an instrument definition rather than a bespoke function, so a new voice costs a line of data',
        'Harmonic instruments run on a single oscillator carrying a PeriodicWave built from their partials; bells and struck metal keep discrete oscillators because their partials sit at non-integer ratios, which is exactly why a bell sounds like a bell',
        "Melody roll whose rows are degrees of the selected genre's scale — natural minor, Phrygian, Raga Bhairav, minor and major pentatonic, Maqam Hijaz, Dorian — so there is no wrong note to click",
        "Per-genre rhythm generation taken from how each style is actually played: half-time trap hats, techno's offbeat open hat, a teentaal-flavoured tabla cycle, a country train beat, a maqsum, a jig grouped in threes",
        'Scheduler runs 120 ms ahead of the audio clock outside React, and the playhead is read back from AudioContext.currentTime — so the highlight lines up with what you hear and a dropped frame is not an audible glitch',
        'Export walks the same voice code against an OfflineAudioContext, so the WAV is the arrangement that played rather than an approximation of it',
        'Real AnalyserNode metering on log-spaced bands, a working recorder, keyboard and touch on every knob, and a hero canvas that stops animating when it scrolls out of view',
      ],
      lessons:
        'Two profiling fixes took a sixteen-bar render from over thirty seconds to about seven — one channel strip per track instead of per hit, and noise percussion filtered once per context rather than through a pair of biquads on every hi-hat. Both were structural rather than clever, which is where the time in audio code usually goes.',
    },
  },
  {
    slug: 'blom-redesign',
    title: 'Bløm Redesign',
    summary: 'A usability study, carried through to working software.',
    category: 'design',
    role: 'UX research · Information architecture · Full-stack development',
    year: '2026',
    technologies: ['React', 'TypeScript', 'Node', 'Usability Testing', 'Tailwind'],
    position: [97, -8, -56],
    accent: '#f7b2c8',
    links: [{ label: 'Open the site', href: '/blom/index.html' }],
    caseStudy: {
      problem:
        'A moderated study of drinkblom.com found all three participants unable to say what the Aperitivo was, and wandering through unrelated sections to finish basic tasks. The redesign I built in Figma restructured the navigation but shipped as a prototype: the cart, the search, and all four forms did nothing.',
      process:
        'A redesign of an Ann Arbor meadery’s website, starting from a ten-task moderated study with three participants. The research named four problems — navigation that did not match how people think, an unexplained flagship product, a missing search, and no way to actually buy anything. This build answers all four. I restructured the information architecture, wrote the commerce layer and the search index, and built the taproom service that receives orders and enquiries.',
      outcome:
        'A working storefront — cart with correct tax and shipping rules, checkout, site search, and four validated forms — served by a small Node service, with every submission surviving an unreachable server.',
      decisions: [
        'Every participant asked for search and the original shipped a dead magnifying glass — there is now a ⌘K dialog indexing products and pages by the words people actually type, so "where to buy", "hours" and "book a party" each resolve to one page',
        'Cart and checkout with the rules a real order has: Michigan sales tax, free shipping over $75, and growler fills correctly forced to taproom pickup because they are poured to order',
        'Prices, copy and search results all read from one catalogue module — the shop and the products page had been separate hand-written markup that could disagree about what a bottle costs',
        'Every submission is written to the browser before it is posted, so an unreachable service degrades to a queue with a reference number rather than to a silent failure — and the confirmation says which of the two happened',
        "The service validates independently of the browser and recomputes each order's subtotal from its line items, rejecting any total that disagrees",
        'Rewrote the homepage hero, which had been a full-screen autoplaying video carrying no headline, no description and nothing to click — the first thing a visitor saw was a black rectangle loading, which is where the Aperitivo confusion starts',
        'Deliberately takes no payment: the checkout and the club signup both say the taproom confirms the order and handles payment, rather than implying a transaction that never happens',
      ],
      lessons:
        'Cutting the Figma export’s 32 MB of PNGs down to 2.1 MB of WebP mattered more than any interface decision on the page — one menu photo alone had been 12 MB, more than the rest of the portfolio combined. The research had already said the first thing a visitor saw was a black rectangle loading.',
    },
  },
  {
    slug: 'maya-3d',
    title: '3D Modeling & Animation',
    summary: 'Characters, environments, materials and motion built in Maya.',
    category: '3d',
    role: '3D modeling · Materials · Lighting · Animation',
    year: '2024',
    technologies: [
      'Autodesk Maya',
      '3D Modeling',
      'UV Mapping',
      'Texturing',
      'Lighting',
      'Animation',
    ],
    position: [110.3, 5, 19.4],
    accent: '#8ee8ff',
    links: [
      {
        label: 'Watch the render',
        href: '/video/maya-workstation-animation.mp4',
      },
    ],
    caseStudy: {
      problem:
        'Build a complete scene that demonstrates the full path from modeled assets through a finished animated render.',
      process:
        'A collection of character, environment, hard-surface, UV, texturing, lighting and animation work created in Autodesk Maya. The final project combines a custom computer workstation, animated cooling fans, lighting, materials and a complete indoor environment. Earlier studies explore stylized characters and outdoor scene construction.',
      outcome:
        'A rendered workstation environment plus a documented progression of character and environment studies.',
      decisions: [
        'Modeled and assembled a complete indoor computer-workstation environment — desk, monitors, tower, mic arm and the room around them',
        'Created custom UV layouts and painted material maps for the desk, monitors, computer tower, cooling system and environmental elements',
        'Animated a turntable and six individual cooling fans',
        'Designed stylized characters and outdoor environments during earlier modeling studies',
        'Developed the work from modeling and materials through lighting, animation and final rendering',
      ],
    },
  },
  {
    slug: 'sports-forecast-engine',
    title: 'Sports Forecast Engine',
    summary: 'An honest C++ probability model, tested before the final whistle.',
    category: 'data',
    role: 'C++ engineering · Statistical modeling · Backtest design',
    year: '2026',
    technologies: [
      'C++20',
      'Poisson Modeling',
      'Backtesting',
      'CSV',
      'StatsBomb Open Data',
    ],
    position: [72, -12, 85.8],
    accent: '#5fe08a',
    links: [
      {
        label: 'Read the C++ source',
        href: 'https://github.com/Isaiahchonchoramirez/isaiahramirezdev/tree/main/projects/sports-forecast-engine',
      },
    ],
    caseStudy: {
      problem:
        'A player-stat assignment could rank past performance, but it could not forecast a game or prove whether its predictions generalized.',
      process:
        'I rebuilt an early C++ sports-statistics project as a reproducible forecasting engine. It learns team attack, defense, and home advantage from match results, produces a complete score-probability grid, and reports home/draw/away probabilities instead of pretending one score is certain. An expanding-window backtest makes every holdout prediction using only information available before kickoff.',
      outcome:
        'A dependency-free C++20 engine that generates score probabilities and measures them on 76 unseen matches without future-data leakage.',
      decisions: [
        'Written with the C++20 standard library only — CSV parsing, model fitting, Poisson probabilities, evaluation, and JSON reporting',
        'Chronological 80/20 split across all 380 Premier League 2015/16 matches, with the model refit after each held-out result',
        'Reports outcome accuracy, multiclass log loss, Brier score, and goal mean absolute error rather than selecting one flattering metric',
        'Five-match prior smooths early and sparse team records toward the league average',
        'Publishes model limitations beside the result: no injuries, lineups, market odds, or claim of betting certainty',
      ],
    },
  },
  {
    slug: 'michigan-lead-risk',
    title: 'Michigan Lead-Risk Analysis',
    summary: 'Public-health indicators joined across all 83 counties.',
    category: 'data',
    role: 'Data cleaning · Statistical analysis · Visualization',
    year: '2025',
    technologies: ['Python', 'pandas', 'NumPy', 'Matplotlib', 'Public Health Data'],
    position: [0, 6, 112],
    accent: '#c2f26d',
    links: [],
    caseStudy: {
      problem:
        'Housing age, childhood blood-lead surveillance, and public-water measurements live in separate datasets with inconsistent geographic labels.',
      process:
        'An information-analysis project combining three Michigan datasets: pre-1950 housing counts, elevated blood-lead levels among tested children under six, and public-water-system 90th-percentile lead measurements. I normalized county names, reconciled Detroit and Wayne County records, aggregated each source to a common unit, and used correlations and standardized scores to compare risk signals without implying that correlation proves causation.',
      outcome:
        'A reproducible 83-county dataset and six analytical views for comparing environmental and housing risk indicators.',
      decisions: [
        'Cleaned and joined all three sources into one row per Michigan county, retaining all 83 counties',
        'Calculated elevated-blood-lead rates from tested-child totals rather than comparing raw counts',
        'Standardized housing, water, and childhood measures with z-scores for cross-indicator comparison',
        'Produced six views covering rankings, pairwise relationships, and the correlation structure',
        'Kept source limitations visible: testing coverage, aggregation, and ecological correlation constrain interpretation',
      ],
    },
  },
  {
    slug: 'occupy-space',
    title: 'Occupy Space',
    summary: 'A normalized NASA asteroid-data pipeline.',
    category: 'data',
    role: 'NEO API collector · Database design · Collaborative analysis',
    year: '2025',
    technologies: ['Python', 'NASA APIs', 'SQLite', 'pandas', 'Matplotlib', 'Seaborn'],
    position: [-72, -10, 85.8],
    accent: '#a0b4ff',
    links: [],
    caseStudy: {
      problem:
        "NASA's near-Earth-object feed is nested, repeated, and time-based, making it difficult to accumulate clean observations without duplicating asteroids or approach dates.",
      process:
        'A collaborative information-analysis project with Sajjad Majeed. I built the near-Earth-object collector and normalized storage path; the final analysis was shared. The database separates asteroids, approach dates, approaches, orbiting bodies, and orbital elements so repeated API runs can add new observations without collecting the same object twice.',
      outcome:
        'A normalized SQLite pipeline containing 100 asteroids and 100 approaches, paired with four analytical visualizations.',
      decisions: [
        'Designed the NEO collector and normalized multi-table SQLite schema',
        'Used unique identifiers and insert-or-ignore logic to prevent duplicate records across incremental runs',
        'Analyzed 100 approaches: 9 were NASA-classified as potentially hazardous',
        'Measured a modest positive velocity-versus-miss-distance correlation of 0.337 in this sample',
        'Built four views spanning approaches over time, velocity and distance, APOD content, and size versus hazard status',
        'Collaborative credit preserved: NEO collection by Isaiah Ramirez; APOD collection by Sajjad Majeed; analysis by both',
      ],
    },
  },
  {
    slug: 'crop-yield',
    title: 'Crop-Yield Efficiency Study',
    summary: 'From raw agricultural data to tested findings.',
    category: 'data',
    role: 'Data exploration · Feature engineering · Visualization · Testing',
    year: '2025',
    technologies: ['Python', 'pandas', 'NumPy', 'Seaborn', 'pytest'],
    position: [-110.3, 3, 19.4],
    accent: '#9ede6a',
    links: [],
    caseStudy: {
      problem:
        'Raw yield alone obscures the effects of rainfall, soil, weather, irrigation, and fertilizer across regions and crops.',
      process:
        'An exploratory agricultural analysis that engineers yield-per-millimeter and crop-relative z-score features, then compares performance across regions, soil types, weather conditions, and treatment combinations. The notebook concludes with ten automated tests covering the calculations and exported results.',
      outcome:
        'A tested analysis pipeline with derived efficiency measures, grouped comparisons, and crop-relative z-scores.',
      decisions: [
        'Engineered yield-per-millimeter to compare output against rainfall rather than treating volume alone as efficiency',
        'Found the East region led yield per millimeter while North had the highest average rainfall in the dataset',
        'Compared every irrigation and fertilizer combination; using both produced the highest mean yield at roughly 6.0 tons per hectare',
        'Standardized crop performance within each crop before comparing soil types',
        'Exported five cleaned summary datasets and passed ten automated checks',
      ],
    },
  },
  {
    slug: 'network-polarization',
    title: 'Networks, Homophily & Polarization',
    summary: 'Testing how network structure shapes social separation.',
    category: 'data',
    role: 'Network analysis · Simulation · Statistical interpretation',
    year: '2026',
    technologies: ['Python', 'NetworkX', 'pandas', 'Seaborn', 'Simulation'],
    position: [-97, -6, -56],
    accent: '#ff9f6b',
    links: [],
    caseStudy: {
      problem:
        'A network can look clustered without establishing whether cross-group ties occur less often than its group proportions predict.',
      process:
        'A social-information-processing analysis that measures observed cross-type edges against the expected fraction in email, political-Wikipedia, and congressional networks. I then examined how triadic, membership, and focal closure alter political sorting across 750 simulated time steps in a synthetic network of 1,000 people.',
      outcome:
        'A quantitative homophily test applied to three real networks, followed by 1,000-node simulations of polarization mechanisms.',
      decisions: [
        'Implemented a NetworkX homophily test using graph structure rather than hard-coded answers',
        'Compared an email network, political Wikipedia links, and congressional interactions',
        'Distinguished inverse homophily from weak and strong homophily using observed-versus-expected cross-group edges',
        'Simulated focal, triadic, and membership closure mechanisms over 750 time steps',
        'Connected quantitative trajectories to network snapshots rather than relying on visual intuition alone',
      ],
    },
  },
  {
    slug: 'lansing-redlining',
    title: "Mapping Lansing's HOLC Grades",
    summary: 'A careful spatial audit of historical redlining boundaries.',
    category: 'data',
    role: 'Geospatial analysis · Data validation · Visualization',
    year: '2025',
    technologies: ['Python', 'GeoPandas', 'GIS', 'pandas', 'Spatial Data'],
    position: [-38.3, 7, -105.2],
    accent: '#e07a9c',
    links: [],
    caseStudy: {
      problem:
        'Historical HOLC boundaries are geographic records, so raw polygon counts can misrepresent how much of a city received each grade.',
      process:
        "A geospatial analysis of Mapping Inequality's historical HOLC polygons for Lansing. I filtered the national layer to the city, projected the boundaries into a metric coordinate system, calculated polygon areas, and summarized the share assigned to grades A through D. The published story deliberately stops at what the source supports instead of treating historical grades as proof of present-day outcomes.",
      outcome:
        "A reproducible area-weighted summary of Lansing's historical grades using a locally appropriate projected coordinate system.",
      decisions: [
        'Filtered 10,000-plus national polygons down to the Lansing survey areas',
        'Reprojected latitude/longitude geometry before measuring area',
        'Compared area share rather than raw polygon counts',
        'Separated the historical classification finding from claims about modern demographics',
        'Documents source, unit, sample, and interpretation limits directly beside the chart',
      ],
    },
  },
];

export const bySlug = (slug: string | null) =>
  slug ? (PROJECTS.find((p) => p.slug === slug) ?? null) : null;
