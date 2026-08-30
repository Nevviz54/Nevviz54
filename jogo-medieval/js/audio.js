'use strict';
/* =========================================================
   audio.js - todo o som é gerado na hora com a Web Audio API
   (nenhum arquivo externo, o jogo funciona offline)
   ========================================================= */

const Som = {
    ctx: null,
    master: null,
    ganhoSfx: null,
    ganhoMusica: null,
    ligado: true,
    musicaLigada: true,
    _tocandoMusica: false,
    _proximaNota: 0,
    _passo: 0,
    _timer: null,

    /** Cria o contexto de áudio (precisa acontecer depois de um clique do jogador). */
    iniciar() {
        if (this.ctx) {
            if (this.ctx.state === 'suspended') this.ctx.resume();
            return;
        }
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = 0.7;
        this.master.connect(this.ctx.destination);

        this.ganhoSfx = this.ctx.createGain();
        this.ganhoSfx.gain.value = 0.55;
        this.ganhoSfx.connect(this.master);

        this.ganhoMusica = this.ctx.createGain();
        this.ganhoMusica.gain.value = 0.22;
        this.ganhoMusica.connect(this.master);
    },

    /* ----------------------- efeitos ----------------------- */

    /** Toca um bipe simples com envelope. */
    tom(freq, dur, tipo = 'square', vol = 0.3, freqFinal = null, atraso = 0) {
        if (!this.ctx || !this.ligado) return;
        const t = this.ctx.currentTime + atraso;
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = tipo;
        osc.frequency.setValueAtTime(freq, t);
        if (freqFinal) osc.frequency.exponentialRampToValueAtTime(Math.max(20, freqFinal), t + dur);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        osc.connect(g); g.connect(this.ganhoSfx);
        osc.start(t); osc.stop(t + dur + 0.02);
    },

    /** Ruído branco filtrado - serve para impactos, explosões e passos. */
    ruido(dur, vol = 0.3, freq = 900, tipo = 'lowpass', atraso = 0) {
        if (!this.ctx || !this.ligado) return;
        const t = this.ctx.currentTime + atraso;
        const n = Math.floor(this.ctx.sampleRate * dur);
        const buf = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
        const src = this.ctx.createBufferSource();
        src.buffer = buf;
        const filtro = this.ctx.createBiquadFilter();
        filtro.type = tipo;
        filtro.frequency.setValueAtTime(freq, t);
        const g = this.ctx.createGain();
        g.gain.setValueAtTime(vol, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        src.connect(filtro); filtro.connect(g); g.connect(this.ganhoSfx);
        src.start(t);
    },

    // espaço mínimo entre repetições do mesmo efeito (segundos).
    // Sem isso, centenas de acertos por segundo travariam o áudio.
    _limites: { acerto: 0.07, critico: 0.10, morte: 0.08, espada: 0.06, flecha: 0.06, magia: 0.08, gema: 0.06, moeda: 0.06, fogo: 0.12, raio: 0.12, machado: 0.08, dano: 0.15 },
    _ultimo: {},

    efeito(nome) {
        if (!this.ctx || !this.ligado) return;
        const agora = this.ctx.currentTime;
        const limite = this._limites[nome] || 0.03;
        if (agora - (this._ultimo[nome] || -9) < limite) return;
        this._ultimo[nome] = agora;

        switch (nome) {
            case 'espada':   this.ruido(0.13, 0.22, 2600, 'highpass'); this.tom(420, 0.09, 'sawtooth', 0.10, 180); break;
            case 'flecha':   this.tom(880, 0.07, 'square', 0.10, 420); break;
            case 'machado':  this.tom(300, 0.14, 'triangle', 0.14, 140); break;
            case 'magia':    this.tom(600, 0.16, 'sine', 0.16, 1500); break;
            case 'raio':     this.ruido(0.22, 0.28, 3800, 'highpass'); this.tom(180, 0.20, 'sawtooth', 0.14, 60); break;
            case 'fogo':     this.ruido(0.30, 0.24, 700, 'lowpass'); this.tom(140, 0.22, 'sawtooth', 0.12, 50); break;
            case 'acerto':   this.tom(220, 0.05, 'square', 0.07, 120); break;
            case 'critico':  this.tom(1000, 0.09, 'square', 0.14, 1600); this.tom(1400, 0.07, 'square', 0.08, 2000, 0.03); break;
            case 'morte':    this.ruido(0.16, 0.16, 1200, 'lowpass'); this.tom(160, 0.14, 'square', 0.08, 60); break;
            case 'dano':     this.tom(160, 0.20, 'sawtooth', 0.24, 60); this.ruido(0.16, 0.16, 500); break;
            case 'gema':     this.tom(1050, 0.06, 'sine', 0.10, 1500); break;
            case 'moeda':    this.tom(1250, 0.05, 'square', 0.09); this.tom(1750, 0.07, 'square', 0.08, null, 0.04); break;
            case 'cura':     this.tom(520, 0.10, 'sine', 0.16); this.tom(780, 0.14, 'sine', 0.14, null, 0.08); break;
            case 'nivel':    [523, 659, 784, 1046].forEach((f, i) => this.tom(f, 0.16, 'square', 0.16, null, i * 0.07)); break;
            case 'bau':      [660, 880, 1100].forEach((f, i) => this.tom(f, 0.20, 'triangle', 0.16, null, i * 0.09)); break;
            case 'chefe':    this.tom(70, 0.9, 'sawtooth', 0.30, 42); this.ruido(0.7, 0.22, 300); break;
            case 'gameover': [392, 349, 294, 220].forEach((f, i) => this.tom(f, 0.42, 'triangle', 0.22, null, i * 0.22)); break;
            case 'vitoria':  [523, 659, 784, 1046, 1318].forEach((f, i) => this.tom(f, 0.34, 'square', 0.18, null, i * 0.15)); break;
            case 'ui':       this.tom(700, 0.05, 'square', 0.10); break;
            case 'compra':   this.tom(600, 0.08, 'square', 0.12); this.tom(900, 0.12, 'square', 0.12, null, 0.07); break;
            case 'erro':     this.tom(180, 0.16, 'square', 0.14, 110); break;
        }
    },

    /* ----------------------- música ----------------------- */
    // Progressão sombria em Lá menor, tocada por um agendador simples.
    baixo:   [55.00, 55.00, 43.65, 43.65, 49.00, 49.00, 41.20, 41.20],
    arpejos: [
        [220.0, 261.6, 329.6, 261.6], // Am
        [220.0, 261.6, 329.6, 392.0],
        [174.6, 220.0, 261.6, 220.0], // F
        [174.6, 220.0, 261.6, 329.6],
        [196.0, 246.9, 293.7, 246.9], // G
        [196.0, 246.9, 293.7, 392.0],
        [164.8, 196.0, 246.9, 196.0], // E menor
        [164.8, 196.0, 246.9, 329.6]
    ],

    tocarMusica() {
        if (!this.ctx || !this.musicaLigada || this._tocandoMusica) return;
        this._tocandoMusica = true;
        this._proximaNota = this.ctx.currentTime + 0.1;
        this._passo = 0;
        this._timer = setInterval(() => this._agendar(), 40);
    },

    pararMusica() {
        this._tocandoMusica = false;
        if (this._timer) { clearInterval(this._timer); this._timer = null; }
    },

    _agendar() {
        if (!this.ctx || !this._tocandoMusica) return;
        const bpm = 96;
        const passoDur = 60 / bpm / 2; // colcheias
        while (this._proximaNota < this.ctx.currentTime + 0.25) {
            const t = this._proximaNota;
            const compasso = Math.floor(this._passo / 4) % 8;
            const dentro = this._passo % 4;

            // baixo grave a cada tempo forte
            if (dentro === 0) this._nota(this.baixo[compasso], t, passoDur * 1.8, 'triangle', 0.5);
            // arpejo
            const arp = this.arpejos[compasso];
            this._nota(arp[dentro], t, passoDur * 0.9, 'square', 0.16);
            // uma nota aguda ocasional dá o "clima" medieval
            if (compasso % 4 === 3 && dentro === 2) this._nota(arp[dentro] * 2, t, passoDur * 1.4, 'triangle', 0.10);

            this._proximaNota += passoDur;
            this._passo++;
        }
    },

    _nota(freq, t, dur, tipo, vol) {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = tipo;
        osc.frequency.setValueAtTime(freq, t);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        osc.connect(g); g.connect(this.ganhoMusica);
        osc.start(t); osc.stop(t + dur + 0.05);
    },

    definirSom(v) { this.ligado = v; },
    definirMusica(v) {
        this.musicaLigada = v;
        if (!v) this.pararMusica();
        else this.tocarMusica();
    }
};
