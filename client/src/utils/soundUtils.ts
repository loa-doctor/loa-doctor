
export type SoundType = 'chime' | 'bell' | 'arcade' | 'zelda';

class SoundManager {
    private ctx: AudioContext | null = null;
    private masterGain: GainNode | null = null;

    private init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            this.masterGain = this.ctx.createGain();
            this.masterGain.connect(this.ctx.destination);
            this.masterGain.gain.value = 0.4; // Master Volume
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    public play(type: SoundType) {
        try {
            this.init();
            if (!this.ctx || !this.masterGain) return;

            switch (type) {
                case 'chime': this.playChime(); break;
                case 'bell': this.playBell(); break;
                case 'arcade': this.playArcade(); break;
                case 'zelda': this.playZelda(); break;
            }
        } catch (e) {
            console.error("Audio Playback Failed", e);
        }
    }

    private playChime() {
        if (!this.ctx || !this.masterGain) return;
        const now = this.ctx.currentTime;
        
        // E5 -> G#5 -> B5 (Major Triad)
        this.osc(523.25, now, 0.5, 'sine'); // C5
        this.osc(659.25, now + 0.15, 0.5, 'sine'); // E5
        this.osc(783.99, now + 0.30, 0.8, 'sine'); // G5
    }

    private playBell() {
        if (!this.ctx || !this.masterGain) return;
        const now = this.ctx.currentTime;
        // Bell-like harmonic structure
        const freq = 880; // A5
        this.osc(freq, now, 1.5, 'triangle');
        this.osc(freq * 2, now, 1.0, 'sine');
        this.osc(freq * 3, now, 0.8, 'sine');
        this.osc(freq * 4.2, now, 0.4, 'sine'); // Slight dissonance
    }

    private playArcade() {
        if (!this.ctx || !this.masterGain) return;
        const now = this.ctx.currentTime;
        // Quick scaling run
        const notes = [440, 554, 659, 880];
        notes.forEach((f, i) => {
            this.osc(f, now + (i * 0.08), 0.1, 'square');
        });
    }

    private playZelda() {
        if (!this.ctx || !this.masterGain) return;
        const now = this.ctx.currentTime;
        // Secret discovery
        const notes = [
             783.99, // G5
             739.99, // F#5
             622.25, // D#5
             440.00, // A4
             415.30, // G#4
             659.25, // E5
             830.61, // G#5
             1046.50 // C6
        ];
        
        notes.forEach((f, i) => {
            this.osc(f, now + (i * 0.13), 0.12, 'triangle');
        });
    }

    private osc(freq: number, time: number, duration: number, type: OscillatorType) {
        if (!this.ctx || !this.masterGain) return;
        
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = type;
        osc.frequency.setValueAtTime(freq, time);
        
        gain.gain.setValueAtTime(0.1, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
        
        osc.connect(gain);
        gain.connect(this.masterGain);
        
        osc.start(time);
        osc.stop(time + duration);
    }
}

export const soundManager = new SoundManager();
