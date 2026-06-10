/**
 * Procedural Audio Generator using Web Audio API. No assets needed!
 */

class SoundEffectsManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  constructor() {
    // Avoid creating AudioContext immediately to prevent browser warning
  }

  private init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    // Resume context if suspended
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setMute(muted: boolean) {
    this.isMuted = muted;
    if (!muted) {
      this.init();
    }
  }

  public toggleMute(): boolean {
    this.setMute(!this.isMuted);
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  private createOscillator(
    type: OscillatorType,
    freq: number,
    duration: number,
    gainStart: number
  ): { osc: OscillatorNode; gain: GainNode } | null {
    this.init();
    if (!this.ctx || this.isMuted) return null;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    
    gain.gain.setValueAtTime(gainStart, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    return { osc, gain };
  }

  public playMenuHover() {
    const sfx = this.createOscillator('triangle', 600, 0.08, 0.1);
    if (!sfx) return;
    sfx.osc.frequency.exponentialRampToValueAtTime(300, this.ctx!.currentTime + 0.08);
    sfx.osc.start();
    sfx.osc.stop(this.ctx!.currentTime + 0.08);
  }

  public playMenuClick() {
    const sfx = this.createOscillator('sine', 400, 0.15, 0.25);
    if (!sfx) return;
    sfx.osc.frequency.exponentialRampToValueAtTime(800, this.ctx!.currentTime + 0.15);
    sfx.osc.start();
    sfx.osc.stop(this.ctx!.currentTime + 0.15);
  }

  public playJump() {
    const sfx = this.createOscillator('triangle', 150, 0.18, 0.15);
    if (!sfx) return;
    sfx.osc.frequency.exponentialRampToValueAtTime(450, this.ctx!.currentTime + 0.15);
    sfx.osc.start();
    sfx.osc.stop(this.ctx!.currentTime + 0.18);
  }

  public playDoubleJump() {
    const sfx = this.createOscillator('triangle', 300, 0.15, 0.12);
    if (!sfx) return;
    sfx.osc.frequency.exponentialRampToValueAtTime(700, this.ctx!.currentTime + 0.12);
    sfx.osc.start();
    sfx.osc.stop(this.ctx!.currentTime + 0.15);
  }

  public playBeam() {
    const sfx = this.createOscillator('sawtooth', 800, 0.2, 0.1);
    if (!sfx) return;
    sfx.osc.frequency.linearRampToValueAtTime(200, this.ctx!.currentTime + 0.2);
    sfx.osc.start();
    sfx.osc.stop(this.ctx!.currentTime + 0.2);
  }

  public playShieldBlock() {
    const sfx = this.createOscillator('sine', 1200, 0.1, 0.2);
    if (!sfx) return;
    sfx.osc.frequency.linearRampToValueAtTime(600, this.ctx!.currentTime + 0.1);
    sfx.osc.start();
    sfx.osc.stop(this.ctx!.currentTime + 0.1);
  }

  public playShieldBreak() {
    // High-pitched glassy breaking sound
    const now = this.ctx?.currentTime || 0;
    for (let i = 0; i < 3; i++) {
      const sfx = this.createOscillator('triangle', 1800 - i * 400, 0.3, 0.15);
      if (sfx && this.ctx) {
        sfx.osc.frequency.linearRampToValueAtTime(100, now + 0.3);
        sfx.osc.start();
        sfx.osc.stop(now + 0.3);
      }
    }
  }

  public playHit(damage: number) {
    this.init();
    if (!this.ctx || this.isMuted) return;

    const now = this.ctx.currentTime;
    
    // Noise buffer for punch snap
    const bufferSize = this.ctx.sampleRate * 0.1; // 100ms
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.setValueAtTime(300, now);

    const noiseGain = this.ctx.createGain();
    const duration = Math.min(0.1 + damage * 0.005, 0.4);
    const volume = Math.min(0.15 + damage * 0.015, 0.6);

    noiseGain.gain.setValueAtTime(volume * 1.5, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);
    noise.start();
    noise.stop(now + 0.1);

    // Low resonant thump
    const baseFreq = Math.max(120 - damage * 0.5, 60);
    const thump = this.createOscillator('sine', baseFreq, duration, volume);
    if (thump) {
      thump.osc.frequency.exponentialRampToValueAtTime(30, now + duration * 0.8);
      thump.osc.start();
      thump.osc.stop(now + duration);
    }

    // High frequency launch sizzle for hard hits
    if (damage >= 15) {
      const sizzle = this.createOscillator('sawtooth', 800, duration * 0.6, volume * 0.4);
      if (sizzle) {
        sizzle.osc.frequency.exponentialRampToValueAtTime(2000, now + duration * 0.5);
        sizzle.osc.start();
        sizzle.osc.stop(now + duration * 0.6);
      }
    }
  }

  public playLaunch() {
    this.init();
    if (!this.ctx || this.isMuted) return;
    
    // Dynamic crash sound
    const now = this.ctx.currentTime;
    const duration = 0.5;
    
    // Sweep oscillator
    const sweep = this.createOscillator('sawtooth', 150, duration, 0.3);
    if (sweep) {
      sweep.osc.frequency.exponentialRampToValueAtTime(2500, now + duration);
      sweep.osc.start();
      sweep.osc.stop(now + duration);
    }
  }

  public playRingOut() {
    this.init();
    if (!this.ctx || this.isMuted) return;

    const now = this.ctx.currentTime;
    
    // Deep explosion rubmle
    const sfx1 = this.createOscillator('triangle', 80, 0.8, 0.4);
    if (sfx1) {
      sfx1.osc.frequency.linearRampToValueAtTime(20, now + 0.8);
      sfx1.osc.start();
      sfx1.osc.stop(now + 0.8);
    }

    // High pitch zoom sweep to represent flying off-screen
    const sfx2 = this.createOscillator('sine', 100, 0.6, 0.3);
    if (sfx2) {
      sfx2.osc.frequency.exponentialRampToValueAtTime(1600, now + 0.5);
      sfx2.osc.start();
      sfx2.osc.stop(now + 0.6);
    }
  }
}

export const sfx = new SoundEffectsManager();
