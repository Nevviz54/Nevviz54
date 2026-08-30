'use strict';
/* =========================================================
   utils.js - funções matemáticas e ajudantes gerais
   ========================================================= */

const TAU = Math.PI * 2;

function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
function lerp(a, b, t) { return a + (b - a) * t; }
function rand(a, b) { return a + Math.random() * (b - a); }
function randInt(a, b) { return Math.floor(a + Math.random() * (b - a + 1)); }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function chance(p) { return Math.random() < p; }
function dist2(ax, ay, bx, by) { const dx = ax - bx, dy = ay - by; return dx * dx + dy * dy; }
function dist(ax, ay, bx, by) { return Math.sqrt(dist2(ax, ay, bx, by)); }
function angleTo(ax, ay, bx, by) { return Math.atan2(by - ay, bx - ax); }

/** Embaralha uma cópia do array (Fisher-Yates). */
function shuffled(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
}

/** Ruído determinístico por coordenada: mesmo x,y sempre gera o mesmo valor 0..1. */
function hash2(x, y) {
    let h = x * 374761393 + y * 668265263;
    h = (h ^ (h >> 13)) * 1274126177;
    h = h ^ (h >> 16);
    return ((h >>> 0) % 100000) / 100000;
}

/** Formata segundos como MM:SS. */
function formatTime(sec) {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
}

/** Formata número grande (1234 -> 1.2k). */
function formatNum(n) {
    if (n >= 10000) return (n / 1000).toFixed(1) + 'k';
    return String(Math.floor(n));
}

/* ---------------------------------------------------------
   Grade espacial: acelera a colisão quando há centenas de
   inimigos na tela (evita testar todos contra todos).
   --------------------------------------------------------- */
class SpatialGrid {
    constructor(cell) {
        this.cell = cell;
        this.map = new Map();
    }
    key(cx, cy) { return cx * 100000 + cy; }
    clear() { this.map.clear(); }
    insert(obj) {
        const cx = Math.floor(obj.x / this.cell);
        const cy = Math.floor(obj.y / this.cell);
        const k = this.key(cx, cy);
        let bucket = this.map.get(k);
        if (!bucket) { bucket = []; this.map.set(k, bucket); }
        bucket.push(obj);
    }
    /** Chama fn para cada objeto dentro do raio aproximado (x,y,r). */
    query(x, y, r, fn) {
        const c = this.cell;
        const x0 = Math.floor((x - r) / c), x1 = Math.floor((x + r) / c);
        const y0 = Math.floor((y - r) / c), y1 = Math.floor((y + r) / c);
        for (let cx = x0; cx <= x1; cx++) {
            for (let cy = y0; cy <= y1; cy++) {
                const bucket = this.map.get(this.key(cx, cy));
                if (!bucket) continue;
                for (let i = 0; i < bucket.length; i++) fn(bucket[i]);
            }
        }
    }
}

/* ---------------------------------------------------------
   Salvamento local (progresso permanente entre partidas)
   --------------------------------------------------------- */
const SAVE_KEY = 'reino_sombrio_save_v1';

const Save = {
    data: {
        ouro: 0,
        melhorias: {},     // id -> nível comprado
        desbloqueados: ['cavaleiro', 'arqueiro', 'bruxa'],
        melhorTempo: 0,
        melhorAbates: 0,
        vitorias: 0,
        partidas: 0,
        som: true,
        musica: true
    },
    load() {
        try {
            const raw = localStorage.getItem(SAVE_KEY);
            if (raw) Object.assign(this.data, JSON.parse(raw));
        } catch (e) {
            console.warn('Não foi possível ler o save:', e);
        }
        return this.data;
    },
    save() {
        try {
            localStorage.setItem(SAVE_KEY, JSON.stringify(this.data));
        } catch (e) {
            console.warn('Não foi possível salvar:', e);
        }
    },
    reset() {
        this.data = {
            ouro: 0, melhorias: {}, desbloqueados: ['cavaleiro', 'arqueiro', 'bruxa'],
            melhorTempo: 0, melhorAbates: 0, vitorias: 0, partidas: 0, som: true, musica: true
        };
        this.save();
    },
    nivelMelhoria(id) { return this.data.melhorias[id] || 0; }
};
