'use strict';
// =====================================================================
//  Funções utilitárias usadas pelo jogo inteiro
// =====================================================================

const U = {
    rand: (a, b) => a + Math.random() * (b - a),
    int: (a, b) => Math.floor(a + Math.random() * (b - a + 1)),
    chance: p => Math.random() < p,
    escolha: arr => arr[Math.floor(Math.random() * arr.length)],
    clamp: (v, a, b) => Math.max(a, Math.min(b, v)),

    normal(media = 0, desvio = 1) {
        let u = 0, v = 0;
        while (u === 0) u = Math.random();
        while (v === 0) v = Math.random();
        return media + desvio * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    },

    embaralhar(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    },

    // Escolha com peso: pesoFn(item) devolve o peso de cada item
    pesado(itens, pesoFn) {
        let total = 0;
        const pesos = itens.map(i => { const p = Math.max(0, pesoFn(i)); total += p; return p; });
        if (total <= 0) return itens[Math.floor(Math.random() * itens.length)];
        let r = Math.random() * total;
        for (let i = 0; i < itens.length; i++) {
            r -= pesos[i];
            if (r <= 0) return itens[i];
        }
        return itens[itens.length - 1];
    },

    soma: (arr, fn = x => x) => arr.reduce((t, x) => t + fn(x), 0),
    media: (arr, fn = x => x) => arr.length ? U.soma(arr, fn) / arr.length : 0,

    esc(s) {
        return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    },

    dinheiro(v) {
        const neg = v < 0 ? '-' : '';
        v = Math.abs(v);
        if (v >= 1e9) return `${neg}€ ${(v / 1e9).toFixed(2).replace('.', ',')} bi`;
        if (v >= 1e6) return `${neg}€ ${(v / 1e6).toFixed(v >= 1e8 ? 0 : 1).replace('.', ',')} mi`;
        if (v >= 1e3) return `${neg}€ ${Math.round(v / 1e3)} mil`;
        return `${neg}€ ${Math.round(v)}`;
    },

    // Arredonda valores de transferência para números "bonitos"
    redondo(v) {
        if (v >= 1e7) return Math.round(v / 5e5) * 5e5;
        if (v >= 1e6) return Math.round(v / 1e5) * 1e5;
        if (v >= 1e5) return Math.round(v / 1e4) * 1e4;
        return Math.round(v / 1e3) * 1e3;
    },

    estrelas(n, max = 5) {
        n = U.clamp(Math.round(n * 2) / 2, 0, max);
        let s = '';
        for (let i = 1; i <= max; i++) s += n >= i ? '★' : (n >= i - 0.5 ? '⯪' : '☆');
        return s;
    },

    corOvr(o) {
        if (o >= 85) return 'ovr-elite';
        if (o >= 78) return 'ovr-otimo';
        if (o >= 70) return 'ovr-bom';
        if (o >= 62) return 'ovr-medio';
        return 'ovr-fraco';
    },

    // Texto do contraste para escrever em cima de uma cor
    corTexto(hex) {
        const h = hex.replace('#', '');
        const r = parseInt(h.substr(0, 2), 16), g = parseInt(h.substr(2, 2), 16), b = parseInt(h.substr(4, 2), 16);
        return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? '#111' : '#fff';
    },

    copia: obj => JSON.parse(JSON.stringify(obj)),
};

// ---------------------------------------------------------------------
//  Posições
// ---------------------------------------------------------------------
const POSICOES = ['GOL', 'ZAG', 'LAT', 'VOL', 'MEI', 'PON', 'ATA'];
const POS_NOME = { GOL: 'Goleiro', ZAG: 'Zagueiro', LAT: 'Lateral', VOL: 'Volante', MEI: 'Meia', PON: 'Ponta', ATA: 'Atacante' };
const POS_GRUPO = { GOL: 'G', ZAG: 'D', LAT: 'D', VOL: 'M', MEI: 'M', PON: 'A', ATA: 'A' };

// Quanto um jogador perde de rendimento jogando fora da posição de origem
function penalidadePos(nat, slot) {
    if (nat === slot) return 0;
    if (nat === 'GOL' || slot === 'GOL') return 35;
    const viz = {
        ZAG: { LAT: 5, VOL: 6 },
        LAT: { ZAG: 6, PON: 6, VOL: 8, MEI: 10 },
        VOL: { MEI: 4, ZAG: 6, LAT: 9 },
        MEI: { VOL: 4, PON: 5, ATA: 7 },
        PON: { MEI: 5, ATA: 4, LAT: 8 },
        ATA: { PON: 4, MEI: 7 },
    };
    return (viz[nat] && viz[nat][slot]) || 15;
}

// Formações: [posição, x (0-100, esquerda→direita), y (0-100, defesa→ataque)]
const FORMACOES = {
    '4-3-3': [['GOL', 50, 6], ['LAT', 14, 30], ['ZAG', 37, 22], ['ZAG', 63, 22], ['LAT', 86, 30], ['VOL', 50, 42], ['MEI', 28, 56], ['MEI', 72, 56], ['PON', 15, 78], ['ATA', 50, 86], ['PON', 85, 78]],
    '4-4-2': [['GOL', 50, 6], ['LAT', 14, 30], ['ZAG', 37, 22], ['ZAG', 63, 22], ['LAT', 86, 30], ['PON', 14, 60], ['VOL', 38, 50], ['MEI', 62, 50], ['PON', 86, 60], ['ATA', 38, 84], ['ATA', 62, 84]],
    '4-2-3-1': [['GOL', 50, 6], ['LAT', 14, 30], ['ZAG', 37, 22], ['ZAG', 63, 22], ['LAT', 86, 30], ['VOL', 37, 43], ['VOL', 63, 43], ['PON', 15, 68], ['MEI', 50, 64], ['PON', 85, 68], ['ATA', 50, 87]],
    '4-1-2-1-2': [['GOL', 50, 6], ['LAT', 14, 30], ['ZAG', 37, 22], ['ZAG', 63, 22], ['LAT', 86, 30], ['VOL', 50, 40], ['MEI', 28, 55], ['MEI', 72, 55], ['MEI', 50, 68], ['ATA', 37, 85], ['ATA', 63, 85]],
    '3-5-2': [['GOL', 50, 6], ['ZAG', 27, 22], ['ZAG', 50, 19], ['ZAG', 73, 22], ['LAT', 10, 52], ['VOL', 50, 42], ['MEI', 31, 58], ['MEI', 69, 58], ['LAT', 90, 52], ['ATA', 37, 84], ['ATA', 63, 84]],
    '3-4-3': [['GOL', 50, 6], ['ZAG', 27, 22], ['ZAG', 50, 19], ['ZAG', 73, 22], ['LAT', 12, 50], ['VOL', 38, 46], ['MEI', 62, 46], ['LAT', 88, 50], ['PON', 17, 78], ['ATA', 50, 86], ['PON', 83, 78]],
    '5-3-2': [['GOL', 50, 6], ['LAT', 9, 36], ['ZAG', 30, 22], ['ZAG', 50, 19], ['ZAG', 70, 22], ['LAT', 91, 36], ['VOL', 50, 45], ['MEI', 28, 58], ['MEI', 72, 58], ['ATA', 37, 84], ['ATA', 63, 84]],
};

const ESTILOS = {
    retranca: { nome: 'Retranca', ata: -5, def: +5 },
    defensivo: { nome: 'Defensivo', ata: -2, def: +2.5 },
    equilibrado: { nome: 'Equilibrado', ata: 0, def: 0 },
    ofensivo: { nome: 'Ofensivo', ata: +2.5, def: -2 },
    tudo: { nome: 'Tudo ou nada', ata: +5, def: -5 },
};

// Dados reais (ligas, times e jogadores) são adicionados pelos arquivos em js/dados/
const DADOS = { paises: [] };
