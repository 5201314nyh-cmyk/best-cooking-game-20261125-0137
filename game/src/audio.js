// Tiny synthesised sound effects through WebAudio: no audio files, nothing fetched.
// The engine is created on the first user gesture (browsers block audio before that)
// and every effect is a short oscillator or noise burst, so a muted tab stays silent.
export function createAudio() {
  let context = null;
  let muted = false;
  let master = null;

  function ensure() {
    if (context !== null) return context;
    try {
      const AudioContext = window.AudioContext ?? window.webkitAudioContext;
      if (!AudioContext) return null;
      context = new AudioContext();
      master = context.createGain();
      master.gain.value = 0.35;
      master.connect(context.destination);
    } catch {
      context = null;
    }
    return context;
  }

  function tone(freq, dur, type, gain, when = 0, slideTo = 0) {
    const ctx = ensure();
    if (ctx === null || muted) return;
    const t0 = ctx.currentTime + when;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo > 0) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(gain, t0 + 0.008);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(g);
    g.connect(master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  function noise(dur, gain, cutoff, when = 0) {
    const ctx = ensure();
    if (ctx === null || muted) return;
    const t0 = ctx.currentTime + when;
    const length = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = cutoff;
    const g = ctx.createGain();
    g.gain.value = gain;
    source.connect(filter);
    filter.connect(g);
    g.connect(master);
    source.start(t0);
  }

  return {
    unlock() { ensure(); },
    setMuted(value) { muted = value; },
    isMuted() { return muted; },
    click() { tone(520, 0.07, 'triangle', 0.5); },
    pickup() { tone(420, 0.08, 'triangle', 0.5, 0, 760); },
    place() { tone(300, 0.08, 'triangle', 0.5, 0, 190); noise(0.05, 0.25, 900); },
    chop() { noise(0.07, 0.7, 1400); tone(170, 0.07, 'square', 0.35); },
    sizzle() { noise(0.35, 0.35, 3200); },
    bubble() { tone(220, 0.12, 'sine', 0.3, 0, 420); },
    done() { tone(660, 0.1, 'sine', 0.5); tone(880, 0.14, 'sine', 0.5, 0.09); },
    serve() { tone(659, 0.12, 'sine', 0.55); tone(880, 0.12, 'sine', 0.55, 0.1); tone(1319, 0.2, 'sine', 0.5, 0.2); },
    fail() { tone(196, 0.22, 'sawtooth', 0.4, 0, 130); },
    expire() { tone(392, 0.14, 'triangle', 0.45, 0, 262); tone(262, 0.2, 'triangle', 0.45, 0.13); },
    trash() { noise(0.16, 0.5, 700); tone(140, 0.14, 'triangle', 0.35, 0, 90); },
    tick() { tone(980, 0.05, 'square', 0.25); },
  };
}
