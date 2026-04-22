const getCtx = () =>
new (window.AudioContext || (window as any).webkitAudioContext)();

// Soft crystalline chime — like opening an ancient enchanted tome
export function playBookOpenSound() {
  try {
    const ctx = getCtx();
    const now = ctx.currentTime;

    // Two gentle bell tones, slightly detuned for warmth
    const freqs = [880, 1320]; // A5 + E6 (a nice fifth)
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;

      const gain = ctx.createGain();
      const t = now + i * 0.06;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.07, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.8);
    });

    // Tiny high shimmer
    const shimmer = ctx.createOscillator();
    shimmer.type = 'sine';
    shimmer.frequency.value = 2640; // E7
    const sGain = ctx.createGain();
    sGain.gain.setValueAtTime(0, now + 0.1);
    sGain.gain.linearRampToValueAtTime(0.025, now + 0.12);
    sGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    shimmer.connect(sGain);
    sGain.connect(ctx.destination);
    shimmer.start(now + 0.1);
    shimmer.stop(now + 0.5);

    setTimeout(() => ctx.close(), 1200);
  } catch (e) {}
}

// Soft close — gentle muted tap
export function playBookCloseSound() {
  try {
    const ctx = getCtx();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.08);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.1);

    setTimeout(() => ctx.close(), 300);
  } catch (e) {}
}

// Magical send — ascending sparkle arpeggio, clean and bright
export function playSendSound() {
  try {
    const ctx = getCtx();
    const now = ctx.currentTime;

    // Clean ascending bell tones
    const notes = [1047, 1319, 1568, 2093]; // C6, E6, G6, C7
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;

      const gain = ctx.createGain();
      const t = now + i * 0.1;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.06, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.6);
    });

    // Final bright ping
    const ping = ctx.createOscillator();
    ping.type = 'sine';
    ping.frequency.value = 3136; // G7
    const pGain = ctx.createGain();
    const pt = now + 0.4;
    pGain.gain.setValueAtTime(0, pt);
    pGain.gain.linearRampToValueAtTime(0.04, pt + 0.01);
    pGain.gain.exponentialRampToValueAtTime(0.001, pt + 0.5);
    ping.connect(pGain);
    pGain.connect(ctx.destination);
    ping.start(pt);
    ping.stop(pt + 0.5);

    setTimeout(() => ctx.close(), 1500);
  } catch (e) {}
}