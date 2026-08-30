'use strict';
/* =========================================================
   art.js - toda a arte é desenhada por código (pixel art
   montada a partir de mapas de texto). Nenhuma imagem externa.
   ========================================================= */

/** Cria um canvas fora da tela. */
function novoCanvas(w, h) {
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(w));
    c.height = Math.max(1, Math.round(h));
    return c;
}

/**
 * Transforma um "desenho em texto" num canvas pintado.
 * @param {string[]} mapa linhas do desenho
 * @param {object} paleta caractere -> cor ('.' e ' ' são transparentes)
 * @param {number} escala tamanho de cada pixel
 */
function criarSprite(mapa, paleta, escala) {
    const largura = mapa.reduce((m, l) => Math.max(m, l.length), 0);
    const altura = mapa.length;
    const c = novoCanvas(largura * escala, altura * escala);
    const g = c.getContext('2d');
    for (let y = 0; y < altura; y++) {
        const linha = mapa[y];
        for (let x = 0; x < linha.length; x++) {
            const ch = linha[x];
            if (ch === '.' || ch === ' ') continue;
            const cor = paleta[ch];
            if (!cor) continue;
            g.fillStyle = cor;
            g.fillRect(x * escala, y * escala, escala, escala);
        }
    }
    return c;
}

/** Devolve uma cópia espelhada horizontalmente. */
function espelhar(src) {
    const c = novoCanvas(src.width, src.height);
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.translate(src.width, 0);
    g.scale(-1, 1);
    g.drawImage(src, 0, 0);
    return c;
}

/** Silhueta clara usada para o "flash" quando algo leva dano. */
function silhueta(src, cor) {
    const c = novoCanvas(src.width, src.height);
    const g = c.getContext('2d');
    g.drawImage(src, 0, 0);
    g.globalCompositeOperation = 'source-in';
    g.fillStyle = cor;
    g.fillRect(0, 0, c.width, c.height);
    return c;
}

/* ---------------------------------------------------------
   Texturas em cache: criar gradiente a cada quadro é caro,
   então cada brilho/sombra é desenhado uma vez e reaproveitado.
   --------------------------------------------------------- */
const _cacheBrilho = new Map();
let _texturaSombra = null;

/** Converte uma cor para a mesma cor com alfa 0 (evita halo escuro). */
function corTransparente(cor) {
    if (cor.startsWith('rgba(') || cor.startsWith('rgb(')) {
        const n = cor.slice(cor.indexOf('(') + 1, cor.lastIndexOf(')')).split(',');
        return 'rgba(' + n[0].trim() + ',' + n[1].trim() + ',' + n[2].trim() + ',0)';
    }
    if (cor[0] === '#') {
        let h = cor.slice(1);
        if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
        const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
        return 'rgba(' + r + ',' + g + ',' + b + ',0)';
    }
    return 'rgba(0,0,0,0)';
}

function texturaBrilho(cor) {
    let c = _cacheBrilho.get(cor);
    if (!c) {
        const T = 128;
        c = novoCanvas(T, T);
        const g = c.getContext('2d');
        const grad = g.createRadialGradient(T / 2, T / 2, 0, T / 2, T / 2, T / 2);
        grad.addColorStop(0, cor);
        grad.addColorStop(1, corTransparente(cor));
        g.fillStyle = grad;
        g.fillRect(0, 0, T, T);
        _cacheBrilho.set(cor, c);
    }
    return c;
}

function texturaSombra() {
    if (!_texturaSombra) {
        const T = 64;
        _texturaSombra = novoCanvas(T, T);
        const g = _texturaSombra.getContext('2d');
        const grad = g.createRadialGradient(T / 2, T / 2, 0, T / 2, T / 2, T / 2);
        grad.addColorStop(0, 'rgba(0,0,0,0.85)');
        grad.addColorStop(0.6, 'rgba(0,0,0,0.35)');
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = grad;
        g.fillRect(0, 0, T, T);
    }
    return _texturaSombra;
}

/** Sombra elíptica simples desenhada sob as criaturas. */
function desenharSombra(g, x, y, rx, ry, alpha) {
    const t = texturaSombra();
    g.globalAlpha = alpha;
    g.drawImage(t, x - rx * 1.6, y - ry * 1.9, rx * 3.2, ry * 3.8);
    g.globalAlpha = 1;
}

/* =========================================================
   MAPAS DE PIXEL ART
   ========================================================= */

// Herói (12x14) - elmo com viseira, capa, braços e botas
const MAPA_HEROI = [
    '....oooo....',
    '...ohhhho...',
    '..ohhhhhho..',
    '..ohffffho..',
    '..ohhhhhho..',
    '...ohhhho...',
    '..cccccccc..',
    '.ccaaaaaacc.',
    'saaattttaaas',
    'soaattttaaos',
    '..oattttao..',
    '..ollllllo..',
    '..oll..llo..',
    '..bb....bb..'
];

// Inimigo humanoide genérico (12x14) - recolorido para cada monstro
const MAPA_HUMANOIDE = [
    '....oooo....',
    '...ohhhho...',
    '..ohhhhhho..',
    '..ohffhffho.',
    '..ohhhhhho..',
    '...ohhhho...',
    '....oooo....',
    '.oottttttoo.',
    'osttttttttso',
    'osottttttoso',
    '..otttttto..',
    '..ollllllo..',
    '..oll..llo..',
    '..oo....oo..'
];

// Lobo (16x10) - visto de lado: orelhas à esquerda, cauda à direita
const MAPA_LOBO = [
    '.oo..........oo.',
    '.ogo........oggo',
    '.oggoooooooogggo',
    'oggggggggggggggo',
    'offggggggggggggo',
    'oggggggggggggggo',
    '.oggggggggggggo.',
    '..og.og..go.go..',
    '..og.og..go.go..',
    '..oo.oo..oo.oo..'
];

// Morcego (10x8)
const MAPA_MORCEGO = [
    '..........',
    '.oo....oo.',
    'oggo..oggo',
    'oggggggggo',
    '.ogffffgo.',
    '..oggggo..',
    '...oggo...',
    '....oo....'
];

// Espectro (10x12)
const MAPA_ESPECTRO = [
    '...oooo...',
    '..oggggo..',
    '.oggggggo.',
    '.ogffffgo.',
    '.oggggggo.',
    '.oggggggo.',
    '.oggggggo.',
    '.oggggggo.',
    '..oggggo..',
    '..og gg o.',
    '...o  o...',
    '..........'
];

// Chefe bruto (16x18) - ogro / necromante / rei vampiro (mudam as cores)
const MAPA_CHEFE = [
    '.....oooooo.....',
    '....ohhhhhho....',
    '...ohhhhhhhho...',
    '...ohffhhffho...',
    '...ohhhhhhhho...',
    '....ohhmmhho....',
    '....otttttto....',
    '..otttttttttto..',
    '.otttttttttttto.',
    'osttttttttttttso',
    'osttttttttttttso',
    '.ottttttttttto..',
    '..ottttttttto...',
    '..olllllllllo...',
    '..ollll llllo...',
    '..obbo   obbo...',
    '..obbo   obbo...',
    '..oooo   oooo...'
];

// Objetos e cenário
const MAPA_GEMA = [
    '..ggg..',
    '.gGGGg.',
    'gGGGGGg',
    'gGGGGGg',
    '.gGGGg.',
    '..ggg..',
    '...g...'
];
const MAPA_MOEDA = [
    '..ooo..',
    '.oyyyo.',
    'oyYYYyo',
    'oyYYYyo',
    'oyYYYyo',
    '.oyyyo.',
    '..ooo..'
];
const MAPA_CORACAO = [
    '.rr.rr.',
    'rRRrRRr',
    'rRRRRRr',
    'rRRRRRr',
    '.rRRRr.',
    '..rRr..',
    '...r...'
];
const MAPA_BAU = [
    '.oooooooo.',
    'oyyyyyyyyo',
    'oyMMMMMMyo',
    'oooooooooo',
    'obbbbbbbbo',
    'obbbMMbbbo',
    'obbbbbbbbo',
    '.oooooooo.'
];
const MAPA_TUMULO = [
    '..ssssss..',
    '.sSSSSSSs.',
    'sSSSSSSSSs',
    'sSSSooSSSs',
    'sSSooooSSs',
    'sSSSooSSSs',
    'sSSSooSSSs',
    'sSSSSSSSSs',
    'sSSSSSSSSs',
    '.ssssssss.',
    '..dddddd..',
    '.dddddddd.'
];
const MAPA_ARVORE = [
    '.....gg.....',
    '...gggggg...',
    '..gggGGggg..',
    '.ggGGGGGGgg.',
    'ggGGGGGGGGgg',
    'ggGGGGGGGGgg',
    '.ggGGGGGGgg.',
    '..gggGGggg..',
    '...gggggg...',
    '.....tt.....',
    '.....tt.....',
    '....tttt....',
    '...dddddd...',
    '..dddddddd..'
];
const MAPA_PEDRA = [
    '..pppp..',
    '.pPPPPp.',
    'pPPPPPPp',
    'pPPPPPPp',
    '.pppppp.',
    '..pppp..'
];
const MAPA_CRANIO = [
    '.ssss.',
    'sSSSSs',
    'sooSos',
    'sSSSSs',
    '.s.s.s',
    '......'
];

/* =========================================================
   PALETAS
   ========================================================= */

const PAL_HEROI = {
    cavaleiro: { o: '#141019', h: '#c6cddb', f: '#2b2440', c: '#a8322c', a: '#9aa3b4', t: '#7d8698', l: '#5a4632', b: '#3a2c1e', s: '#c6cddb' },
    arqueiro:  { o: '#101408', h: '#8a6a3f', f: '#241c12', c: '#3f7a3a', a: '#5f8f45', t: '#4a6b32', l: '#5a4632', b: '#3a2c1e', s: '#e8b48a' },
    bruxa:     { o: '#140f1c', h: '#e8b48a', f: '#2b1f38', c: '#7a3fb0', a: '#5f3a8f', t: '#4a2c70', l: '#3a2450', b: '#281a38', s: '#e8b48a' },
    paladino:  { o: '#1a1408', h: '#f0e2b0', f: '#3a2f14', c: '#e0b04a', a: '#f5efdc', t: '#d8cfae', l: '#a8862e', b: '#6b5420', s: '#f0e2b0' }
};

const PAL_INIMIGO = {
    rato:      { o: '#1a1418', h: '#6b5f56', f: '#c0392b', t: '#7a6d62', s: '#8a7d70', l: '#4a4038' },
    esqueleto: { o: '#1b1520', h: '#e6e2d0', f: '#2b2440', t: '#cfc9b4', s: '#e6e2d0', l: '#6b5a45' },
    goblin:    { o: '#131a12', h: '#79b04a', f: '#1b2a14', t: '#8b5a2b', s: '#79b04a', l: '#4a3a22' },
    orc:       { o: '#101a14', h: '#4f7a3a', f: '#16220f', t: '#5f6470', s: '#4f7a3a', l: '#3a3f47' },
    arqueiro:  { o: '#161a20', h: '#d8d4c0', f: '#2b3a20', t: '#4a6b3a', s: '#d8d4c0', l: '#5a4a30' },
    cavaleiro: { o: '#0b0910', h: '#4a4468', f: '#e0453a', t: '#2f2a48', s: '#4a4468', l: '#1e1b2c' },
    cultista:  { o: '#140f1c', h: '#c9a882', f: '#2b1f38', t: '#6b3fa0', s: '#c9a882', l: '#4a2a70' }
};

const PAL_LOBO = {
    lobo:  { o: '#141014', g: '#6e6a76', f: '#e0453a' },
    alfa:  { o: '#12100c', g: '#4a4038', f: '#ffb03a' },
    rato:  { o: '#1a1414', g: '#7a5f4a', f: '#e0453a' }
};
const PAL_MORCEGO = {
    morcego: { o: '#120e18', g: '#4a3560', f: '#e0453a' },
    vampiro: { o: '#180c10', g: '#7a2038', f: '#ffd24a' }
};
const PAL_ESPECTRO = {
    espectro: { o: '#1a2a38', g: '#8fd0e8', f: '#0d1a24' },
    alma:     { o: '#2a1a38', g: '#c9a0e8', f: '#160d24' }
};
const PAL_CHEFE = {
    ogro:    { o: '#101808', h: '#8fae52', f: '#e0453a', m: '#f0e0a0', t: '#7a5a30', s: '#8fae52', l: '#4a3a20', b: '#3a2c18' },
    necro:   { o: '#0e0a16', h: '#dcd6c0', f: '#5fe0a0', m: '#2b2440', t: '#3a2a5a', s: '#dcd6c0', l: '#241a3a', b: '#180f28' },
    rei:     { o: '#120508', h: '#e8dcd4', f: '#ff3a3a', m: '#e0b04a', t: '#6b1020', s: '#e8dcd4', l: '#3a0a12', b: '#28060c' }
};

const PAL_ITENS = {
    gemaAzul:  { g: '#2a6fd0', G: '#7ec8ff' },
    gemaVerde: { g: '#2aa04a', G: '#8fffa0' },
    gemaRoxa:  { g: '#8a3fd0', G: '#d9a0ff' },
    gemaOuro:  { g: '#c08a1a', G: '#ffe08a' },
    moeda:     { o: '#6b4a10', y: '#e0b04a', Y: '#ffe9a8' },
    coracao:   { r: '#8a1a24', R: '#ff4a5a' },
    bau:       { o: '#3a2410', y: '#c08a3a', M: '#ffe08a', b: '#7a5220' },
    tumulo:    { s: '#4a4a52', S: '#787884', o: '#2a2a30', d: '#3a3020' },
    arvore:    { g: '#1e3a1e', G: '#2f5a2c', t: '#4a3520', d: '#2a2414' },
    pedra:     { p: '#4a4a52', P: '#6a6a74' },
    cranio:    { s: '#8a8676', S: '#c8c4b0', o: '#241f28' }
};

/* =========================================================
   BANCO DE SPRITES PRONTOS
   ========================================================= */
const SPR = {};

function montar(nome, mapa, paleta, escala) {
    const base = criarSprite(mapa, paleta, escala);
    SPR[nome] = {
        dir: base,
        esq: espelhar(base),
        flash: silhueta(base, '#ffffff'),
        flashEsq: espelhar(silhueta(base, '#ffffff')),
        w: base.width,
        h: base.height
    };
    return SPR[nome];
}

function prepararArte() {
    // heróis
    for (const k in PAL_HEROI) montar('heroi_' + k, MAPA_HEROI, PAL_HEROI[k], 3);
    // inimigos humanoides
    for (const k in PAL_INIMIGO) montar('hum_' + k, MAPA_HUMANOIDE, PAL_INIMIGO[k], 3);
    // bichos
    for (const k in PAL_LOBO) montar(k, MAPA_LOBO, PAL_LOBO[k], 3);
    for (const k in PAL_MORCEGO) montar(k, MAPA_MORCEGO, PAL_MORCEGO[k], 3);
    for (const k in PAL_ESPECTRO) montar(k, MAPA_ESPECTRO, PAL_ESPECTRO[k], 3);
    // chefes
    for (const k in PAL_CHEFE) montar('chefe_' + k, MAPA_CHEFE, PAL_CHEFE[k], 4);
    // itens
    montar('gema1', MAPA_GEMA, PAL_ITENS.gemaAzul, 3);
    montar('gema2', MAPA_GEMA, PAL_ITENS.gemaVerde, 3);
    montar('gema3', MAPA_GEMA, PAL_ITENS.gemaRoxa, 4);
    montar('gema4', MAPA_GEMA, PAL_ITENS.gemaOuro, 4);
    montar('moeda', MAPA_MOEDA, PAL_ITENS.moeda, 3);
    montar('coracao', MAPA_CORACAO, PAL_ITENS.coracao, 3);
    montar('bau', MAPA_BAU, PAL_ITENS.bau, 4);
    // cenário
    montar('tumulo', MAPA_TUMULO, PAL_ITENS.tumulo, 3);
    montar('arvore', MAPA_ARVORE, PAL_ITENS.arvore, 4);
    montar('pedra', MAPA_PEDRA, PAL_ITENS.pedra, 3);
    montar('cranio', MAPA_CRANIO, PAL_ITENS.cranio, 3);
}

/* =========================================================
   CHÃO INFINITO
   ========================================================= */

/** Gera uma textura de 256x256 que se repete formando o campo de batalha. */
function criarTexturaChao(tema) {
    const T = 256;
    const c = novoCanvas(T, T);
    const g = c.getContext('2d');
    const cores = tema === 'cripta'
        ? { base: '#221d26', escuro: '#1b1720', claro: '#2b2530', detalhe: '#3a3242' }
        : { base: '#20301f', escuro: '#1a2819', claro: '#27391f', detalhe: '#33471f' };

    g.fillStyle = cores.base;
    g.fillRect(0, 0, T, T);

    // manchas grandes
    for (let i = 0; i < 90; i++) {
        const x = Math.random() * T, y = Math.random() * T, r = rand(8, 28);
        g.fillStyle = Math.random() < 0.5 ? cores.escuro : cores.claro;
        g.globalAlpha = 0.5;
        g.beginPath(); g.ellipse(x, y, r, r * rand(0.5, 0.9), rand(0, TAU), 0, TAU); g.fill();
    }
    g.globalAlpha = 1;

    // pixels de grama / cascalho
    for (let i = 0; i < 1400; i++) {
        const x = Math.floor(Math.random() * T), y = Math.floor(Math.random() * T);
        g.fillStyle = Math.random() < 0.3 ? cores.detalhe : (Math.random() < 0.5 ? cores.escuro : cores.claro);
        const s = Math.random() < 0.85 ? 2 : 3;
        g.fillRect(x, y, s, s);
    }
    return c;
}

/* =========================================================
   DESENHOS DE EFEITOS (feitos com formas, não com pixels)
   ========================================================= */

/**
 * Golpe de espada: uma meia-lua que varre de um lado ao outro,
 * com a ponta da lâmina brilhando na frente do rastro.
 */
function desenharArco(g, x, y, raio, angulo, abertura, progresso, cor) {
    const p = clamp(progresso, 0, 1);
    const rInt = raio * 0.42, rExt = raio;
    const a0 = angulo - abertura / 2, a1 = angulo + abertura / 2;

    g.save();
    // rastro completo, fraquinho
    g.globalAlpha = (1 - p) * 0.30;
    g.fillStyle = cor;
    g.beginPath();
    g.arc(x, y, rExt, a0, a1);
    g.arc(x, y, rInt, a1, a0, true);
    g.closePath();
    g.fill();

    // lâmina: faixa brilhante que atravessa o arco
    const ponta = a0 + abertura * (0.15 + p * 0.95);
    const larg = abertura * 0.22;
    g.globalAlpha = (1 - p) * 0.95;
    g.fillStyle = '#ffffff';
    g.beginPath();
    g.arc(x, y, rExt, ponta - larg, ponta);
    g.arc(x, y, rInt, ponta, ponta - larg, true);
    g.closePath();
    g.fill();

    // contorno externo
    g.globalAlpha = (1 - p) * 0.55;
    g.strokeStyle = cor;
    g.lineWidth = 3;
    g.beginPath();
    g.arc(x, y, rExt, a0, a1);
    g.stroke();
    g.restore();
    g.globalAlpha = 1;
}

/** Brilho radial (usado em auras, explosões e gemas). */
function desenharBrilho(g, x, y, raio, cor, alpha) {
    const t = texturaBrilho(cor);
    g.globalAlpha = clamp(alpha, 0, 1);
    g.drawImage(t, x - raio, y - raio, raio * 2, raio * 2);
    g.globalAlpha = 1;
}

/** Raio quebrado caindo do céu. */
function desenharRaio(g, x, y, altura, semente, alpha) {
    g.save();
    g.globalAlpha = alpha;
    g.strokeStyle = '#cfe8ff';
    g.lineWidth = 4;
    g.beginPath();
    let px = x, py = y - altura;
    g.moveTo(px, py);
    const passos = 7;
    for (let i = 1; i <= passos; i++) {
        const t = i / passos;
        px = x + (hash2(semente + i, i * 7) - 0.5) * 34 * (1 - t);
        py = y - altura * (1 - t);
        g.lineTo(px, py);
    }
    g.stroke();
    g.strokeStyle = '#ffffff';
    g.lineWidth = 1.5;
    g.stroke();
    g.restore();
    g.globalAlpha = 1;
}
