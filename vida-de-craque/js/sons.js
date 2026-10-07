'use strict';
// =====================================================================
//  SONS — tudo gerado por código com Web Audio (sem arquivos)
// =====================================================================

const Som = {
    ctx: null,

    ligado() {
        return typeof Jogo === 'undefined' || Jogo.opcoes.som !== false;
    },

    volume() {
        const v = typeof Jogo === 'undefined' ? 60 : (Jogo.opcoes.volume != null ? Jogo.opcoes.volume : 60);
        return U.clamp(v, 0, 100) / 100;
    },

    preparar() {
        if (!this.ctx) {
            const AC = window.AudioContext || window.webkitAudioContext;
            if (!AC) return false;
            try { this.ctx = new AC(); } catch (e) { return false; }
        }
        if (this.ctx.state === 'suspended') this.ctx.resume();
        return true;
    },

    // nota simples com envelope
    tom(freq, dur, tipo = 'sine', vol = 0.2, atraso = 0, freqFim) {
        const c = this.ctx, t0 = c.currentTime + atraso;
        const o = c.createOscillator(), g = c.createGain();
        o.type = tipo;
        o.frequency.setValueAtTime(freq, t0);
        if (freqFim) o.frequency.exponentialRampToValueAtTime(freqFim, t0 + dur);
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.exponentialRampToValueAtTime(vol * this.volume(), t0 + 0.012);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
        o.connect(g).connect(c.destination);
        o.start(t0);
        o.stop(t0 + dur + 0.05);
    },

    // ruído filtrado (torcida, vento, "whoosh")
    ruido(dur, vol = 0.2, freq = 800, atraso = 0, freqFim, q = 0.8) {
        const c = this.ctx, t0 = c.currentTime + atraso;
        const n = Math.floor(c.sampleRate * dur);
        const buf = c.createBuffer(1, n, c.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
        const src = c.createBufferSource();
        src.buffer = buf;
        const f = c.createBiquadFilter();
        f.type = 'bandpass';
        f.Q.value = q;
        f.frequency.setValueAtTime(freq, t0);
        if (freqFim) f.frequency.exponentialRampToValueAtTime(freqFim, t0 + dur);
        const g = c.createGain();
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.exponentialRampToValueAtTime(vol * this.volume(), t0 + dur * 0.25);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
        src.connect(f).connect(g).connect(c.destination);
        src.start(t0);
        src.stop(t0 + dur + 0.05);
    },

    apito(atraso = 0, dur = 0.35) {
        const c = this.ctx, t0 = c.currentTime + atraso;
        const o = c.createOscillator(), lfo = c.createOscillator(), prof = c.createGain(), g = c.createGain();
        o.type = 'square';
        o.frequency.value = 2900;
        lfo.frequency.value = 32;
        prof.gain.value = 140;
        lfo.connect(prof).connect(o.frequency);
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.exponentialRampToValueAtTime(0.05 * this.volume(), t0 + 0.02);
        g.gain.setValueAtTime(0.05 * this.volume(), t0 + dur - 0.05);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
        o.connect(g).connect(c.destination);
        o.start(t0); lfo.start(t0);
        o.stop(t0 + dur + 0.05); lfo.stop(t0 + dur + 0.05);
    },

    tocar(nome) {
        if (!this.ligado() || !this.preparar()) return;
        try {
            switch (nome) {
                case 'clique': this.tom(1100, 0.05, 'triangle', 0.08, 0, 700); break;
                case 'aba': this.tom(620, 0.07, 'sine', 0.1, 0, 880); break;
                case 'moeda': this.tom(1320, 0.08, 'square', 0.05); this.tom(1980, 0.18, 'square', 0.05, 0.07); break;
                case 'erro': this.tom(220, 0.2, 'sawtooth', 0.06, 0, 150); break;
                case 'apito': this.apito(0, 0.4); break;
                case 'apitoFinal': this.apito(0, 0.25); this.apito(0.35, 0.25); this.apito(0.7, 0.7); break;
                case 'gol':
                    this.ruido(2.2, 0.35, 700, 0, 1200, 0.5);
                    this.ruido(1.6, 0.18, 2200, 0.1, 1500, 1.2);
                    this.tom(392, 0.25, 'triangle', 0.12, 0.05);
                    this.tom(523, 0.25, 'triangle', 0.12, 0.2);
                    this.tom(659, 0.45, 'triangle', 0.12, 0.35);
                    break;
                case 'golContra': this.ruido(1.2, 0.12, 500, 0, 300, 0.6); this.tom(300, 0.5, 'sine', 0.08, 0, 180); break;
                case 'torcida': this.ruido(2.8, 0.25, 650, 0, 900, 0.5); this.ruido(2.4, 0.1, 1800, 0.3, 1400, 1); break;
                case 'conquista':
                    [523, 659, 784, 1047].forEach((f, i) => this.tom(f, 0.22, 'triangle', 0.12, i * 0.09));
                    this.tom(1568, 0.5, 'sine', 0.06, 0.38);
                    break;
                case 'titulo':
                    [392, 523, 659, 784, 1047, 784, 1047].forEach((f, i) => this.tom(f, i === 6 ? 0.9 : 0.22, 'square', 0.05, i * 0.16));
                    this.ruido(3.5, 0.3, 700, 0.2, 1100, 0.5);
                    break;
                case 'cena': this.ruido(0.7, 0.18, 300, 0, 3000, 1.5); break;
                case 'impacto': this.tom(110, 0.35, 'sine', 0.3, 0, 50); this.ruido(0.3, 0.2, 200, 0, 80, 1); break;
                case 'virar': this.tom(880, 0.06, 'square', 0.04); this.tom(660, 0.06, 'square', 0.04, 0.05); break;
                case 'triste': [392, 349, 311, 262].forEach((f, i) => this.tom(f, 0.35, 'sine', 0.08, i * 0.22)); break;
            }
        } catch (e) { /* som é só enfeite */ }
    },
};
