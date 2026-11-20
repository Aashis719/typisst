let audioCtx = null;

function getContext() {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (Ctx) {
      audioCtx = new Ctx();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function playKeySound(enabled, isError = false) {
  if (!enabled) return;
  const ctx = getContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = isError ? 'sawtooth' : 'triangle';
    osc.frequency.setValueAtTime(isError ? 170 : 520 + Math.random() * 60, now);
    osc.frequency.exponentialRampToValueAtTime(isError ? 95 : 180, now + 0.035);

    gain.gain.setValueAtTime(isError ? 0.06 : 0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.045);
  } catch {
    // Ignore audio errors when autoplay policy restricts
  }
}

export function playCompleteSound(enabled) {
  if (!enabled) return;
  const ctx = getContext();
  if (!ctx) return;

  try {
    const notes = [440, 554.37, 659.25];
    notes.forEach((freq, idx) => {
      const now = ctx.currentTime + idx * 0.065;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.19);
    });
  } catch {
    // Ignore audio errors
  }
}
