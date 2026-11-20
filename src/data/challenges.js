export const ACCURACY_CHALLENGES = {
  easy: [
    'Subtle rhythm guides every clean keystroke across the quiet morning workspace.',
    'Careful fingers avoid needless mistakes when patience leads the pace.',
    'Clear focus turns scattered thoughts into steady, accurate sentences.',
    'Light touches on familiar keys keep your breathing calm and even.',
    'Simple words reward steady posture and unhurried attention to detail.',
  ],
  medium: [
    'Accommodating conscientious bureaucracy requires thoroughness, precision, and unhurried focus.',
    'Twelve xylophonists quickly juxtaposed bizarrely eccentric rhythms before midnight.',
    'Occasionally, subtle typographical nuances separate effortless fluency from awkward hesitation.',
    'Deliberate practice strengthens muscle memory; rushed habits reinforce avoidable typographical errors.',
    'Well-structured paragraphs balance concise phrasing, measured cadence, and deliberate punctuation.',
  ],
  hard: [
    'Sphinx of black quartz, judge my vow: 148 meticulous glyphs demand 99.4% precision!',
    'Pseudo-asynchronous micro-architectures utilize deterministic checksums (SHA-256) & immutable logs.',
    'Quixotic lexicographers scrutinize rhythm, syzygy, mnemonic cues, and conscientious punctuation.',
    'Verify packet#409 [checksum: 0x7F3A] before committing multi-threaded state-machine transitions.',
    'Zero-latency pipelines—calibrated at 12.5ms intervals—eliminate jitter under peak (98%) load.',
  ],
};

export const SURVIVAL_TIERS = [
  // Tier 1: short crisp words
  [
    'flow', 'mint', 'spark', 'drift', 'calm', 'pulse', 'grid', 'tone', 'edge', 'beam',
    'leaf', 'note', 'core', 'echo', 'snap', 'bold', 'glow', 'wave', 'keen', 'pure',
  ],
  // Tier 2: medium balanced words
  [
    'balance', 'horizon', 'cadence', 'lantern', 'cascade', 'whisper', 'compass', 'velocity',
    'clarity', 'shelter', 'momentum', 'pattern', 'mercury', 'silence', 'surface', 'current',
  ],
  // Tier 3: tricky orthography & longer sequences
  [
    'rhythm', 'parallel', 'threshold', 'symmetry', 'labyrinth', 'sequence', 'transient', 'phenomenon',
    'equilibrium', 'bureaucracy', 'conscientious', 'millennium', 'orchestrate', 'camouflage', 'fluorescent', 'mnemonic',
  ],
  // Tier 4: hyphenated & compound technical words
  [
    'real-time', 'fine-grained', 'zero-latency', 'high-contrast', 'auto-complete', 'cross-check', 'sub-pixel',
    'state-driven', 'round-trip', 'well-defined', 'thread-safe', 'frame-accurate', 'long-running', 'fail-safe',
  ],
  // Tier 5: syntax, punctuation & numbers mixed
  [
    'sync(42)', 'node_v18', 'rate:99%', 'index[0]', 'cache#7', 'key=tab', 'ping:12ms', 'port:3000',
    'sha256()', 'diff>=0', 'v2.4.1', 'token@9', 'err:404', 'mem[64]', 'hex#ff0', 'step+=1',
  ],
];

export const DAILY_PASSAGES = [
  'Precision is not the opposite of speed; precision is the foundation that lets speed endure without friction or fatigue.',
  'Every keystroke leaves a tiny rhythmic trace. When your hands stay relaxed and your eyes read one word ahead, accuracy follows naturally.',
  'A quiet tool disappears beneath your fingers. What remains is just thought flowing smoothly onto the screen, word after steady word.',
  'Consistency beats occasional bursts of effort. Five focused minutes of deliberate practice each morning builds muscle memory that lasts for years.',
  'Great craft lives in small adjustments: softer posture, lighter taps on the switches, and the discipline to pause rather than guess a tricky letter.',
  'Language has cadence and architecture. Training your fingers on varied punctuation, numbers, and syntax prepares you for real writing.',
  'When an error happens, resist frustration. Reset your breathing, slow down for three words, and let clean rhythm return on its own.'
];

export function getTodayKey() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getDailyPassage(dateKey = getTodayKey()) {
  // Deterministic hash from date string
  let hash = 0;
  for (let i = 0; i < dateKey.length; i++) {
    hash = (hash * 31 + dateKey.charCodeAt(i)) >>> 0;
  }
  const passage = DAILY_PASSAGES[hash % DAILY_PASSAGES.length];
  return {
    dateKey,
    text: passage,
    words: passage.split(' ')
  };
}
