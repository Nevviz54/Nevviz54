'use strict';
/* =========================================================
   data.js - todo o conteúdo do jogo:
   heróis, armas, itens passivos, monstros, chefes e loja.
   ========================================================= */

/* Atalhos que aplicam os bônus do jogador */
function D(v) { return v * Game.jogador.danoMul; }          // dano
function A(v) { return v * Game.jogador.areaMul; }          // área
function V(v) { return v * Game.jogador.velProjMul; }       // velocidade do projétil
function Du(v) { return v * Game.jogador.duracaoMul; }      // duração

/* =========================================================
   HERÓIS
   ========================================================= */
const HEROIS = [
    {
        id: 'cavaleiro', nome: 'Cavaleiro', icone: '🛡️', sprite: 'heroi_cavaleiro',
        desc: 'Resistente e equilibrado. Começa com a Espada Longa.',
        vida: 130, velocidade: 168, armadura: 2, arma: 'espada',
        bonus: { danoMul: 1.0, imaMul: 1.0 },
        detalhe: '+vida · +2 armadura',
        preco: 0
    },
    {
        id: 'arqueiro', nome: 'Arqueiro', icone: '🏹', sprite: 'heroi_arqueiro',
        desc: 'Rápido e certeiro. Começa com a Besta e enxerga longe.',
        vida: 100, velocidade: 196, armadura: 0, arma: 'besta',
        bonus: { danoMul: 1.1, imaMul: 1.15 },
        detalhe: '+velocidade · +10% dano',
        preco: 0
    },
    {
        id: 'bruxa', nome: 'Bruxa', icone: '🔮', sprite: 'heroi_bruxa',
        desc: 'Frágil, mas domina a magia. Começa com o Fogo Grego.',
        vida: 85, velocidade: 172, armadura: 0, arma: 'fogo',
        bonus: { danoMul: 1.0, areaMul: 1.2, recargaMul: 0.9, imaMul: 1.3 },
        detalhe: '+20% área · +10% recarga · +ímã',
        preco: 0
    },
    {
        id: 'paladino', nome: 'Paladino', icone: '✨', sprite: 'heroi_paladino',
        desc: 'A luz o protege. Começa com a Aura Sagrada e regenera vida.',
        vida: 120, velocidade: 170, armadura: 3, arma: 'aura',
        bonus: { danoMul: 1.05, regen: 0.6 },
        detalhe: '+3 armadura · regeneração',
        preco: 600
    }
];

/* =========================================================
   ARMAS
   Cada arma tem no máximo 8 níveis.
   ========================================================= */
const ARMAS = {

    /* ---------- Espada Longa: golpe em arco perto do herói ---------- */
    espada: {
        nome: 'Espada Longa', icone: '⚔️', max: 8,
        desc: 'Um golpe amplo que corta tudo à frente.',
        stats(n) {
            return {
                dano: 14 + n * 5.5,
                recarga: 1.0 - n * 0.045,
                area: 95 + n * 7,
                abertura: 1.5 + n * 0.09,
                golpes: n >= 4 ? 2 : 1
            };
        },
        proximo(n) {
            if (n + 1 === 4) return '+1 golpe (frente e costas)';
            return '+dano, +alcance e ataque mais rápido';
        },
        disparar(arma) {
            const p = Game.jogador, s = this.stats(arma.nivel);
            const alvo = inimigoMaisProximo(p.x, p.y, 460);
            const base = alvo ? angleTo(p.x, p.y, alvo.x, alvo.y) : (p.olhar >= 0 ? 0 : Math.PI);
            for (let i = 0; i < s.golpes; i++) {
                criarArea({
                    tipo: 'arco', x: p.x, y: p.y - 6,
                    ang: base + i * Math.PI, raio: A(s.area), abertura: s.abertura,
                    dano: D(s.dano), vida: 0.22, knock: 130, cor: '#e8f0ff'
                });
            }
            Som.efeito('espada');
        },
        evolucao: { arma: 'excalibur', passivo: 'anel' }
    },

    /* ---------- Excalibur (evolução da espada) ---------- */
    excalibur: {
        nome: 'Excalibur', icone: '🗡️', max: 1, oculta: true, evoluida: true,
        desc: 'A lâmina sagrada. Golpes gigantes em todas as direções.',
        stats() { return { dano: 92, recarga: 0.62, area: 172, abertura: 2.5, golpes: 3 }; },
        proximo() { return 'No poder máximo'; },
        disparar(arma) {
            const p = Game.jogador, s = this.stats();
            const alvo = inimigoMaisProximo(p.x, p.y, 520);
            const base = alvo ? angleTo(p.x, p.y, alvo.x, alvo.y) : (p.olhar >= 0 ? 0 : Math.PI);
            for (let i = 0; i < s.golpes; i++) {
                criarArea({
                    tipo: 'arco', x: p.x, y: p.y - 6,
                    ang: base + i * (TAU / s.golpes), raio: A(s.area), abertura: s.abertura,
                    dano: D(s.dano), vida: 0.26, knock: 300, cor: '#ffe9a8'
                });
            }
            Som.efeito('espada'); Som.efeito('critico');
        }
    },

    /* ---------- Besta: virotes no inimigo mais próximo ---------- */
    besta: {
        nome: 'Besta', icone: '🏹', max: 8,
        desc: 'Dispara virotes perfurantes no alvo mais próximo.',
        stats(n) {
            return {
                dano: 9 + n * 4,
                recarga: 0.95 - n * 0.055,
                qtd: 1 + Math.floor(n / 3),
                perfura: 1 + Math.floor(n / 2),
                vel: 520 + n * 14
            };
        },
        proximo(n) {
            const p = n + 1;
            if (p % 3 === 0) return '+1 virote por disparo';
            if (p % 2 === 0) return '+1 perfuração';
            return '+dano e recarga mais rápida';
        },
        disparar(arma) {
            const p = Game.jogador, s = this.stats(arma.nivel);
            const alvo = inimigoMaisProximo(p.x, p.y, 700);
            const base = alvo ? angleTo(p.x, p.y, alvo.x, alvo.y) : (p.olhar >= 0 ? 0 : Math.PI);
            for (let i = 0; i < s.qtd; i++) {
                const desvio = (i - (s.qtd - 1) / 2) * 0.13;
                criarProjetil({
                    x: p.x, y: p.y - 4, ang: base + desvio, vel: V(s.vel),
                    dano: D(s.dano), perfura: s.perfura, vida: 1.5,
                    tipo: 'flecha', raio: 7, cor: '#e8dfc0', knock: 90
                });
            }
            Som.efeito('flecha');
        },
        evolucao: { arma: 'balista', passivo: 'ampulheta' }
    },

    balista: {
        nome: 'Balista Sagrada', icone: '🎯', max: 1, oculta: true, evoluida: true,
        desc: 'Rajadas contínuas de lanças que atravessam tudo.',
        stats() { return { dano: 44, recarga: 0.22, qtd: 3, perfura: 99, vel: 760 }; },
        proximo() { return 'No poder máximo'; },
        disparar(arma) {
            const p = Game.jogador, s = this.stats();
            const alvo = inimigoMaisProximo(p.x, p.y, 800);
            const base = alvo ? angleTo(p.x, p.y, alvo.x, alvo.y) : (p.olhar >= 0 ? 0 : Math.PI);
            for (let i = 0; i < s.qtd; i++) {
                criarProjetil({
                    x: p.x, y: p.y - 4, ang: base + (i - 1) * 0.16, vel: V(s.vel),
                    dano: D(s.dano), perfura: s.perfura, vida: 1.6,
                    tipo: 'flecha', raio: 9, cor: '#ffe9a8', knock: 120
                });
            }
            Som.efeito('flecha');
        }
    },

    /* ---------- Machado: volta como bumerangue ---------- */
    machado: {
        nome: 'Machado Giratório', icone: '🪓', max: 8,
        desc: 'Machados que giram, atravessam a horda e voltam.',
        stats(n) {
            return {
                dano: 16 + n * 6,
                recarga: 1.9 - n * 0.09,
                qtd: 1 + Math.floor((n + 1) / 3),
                alcance: 190 + n * 16
            };
        },
        proximo(n) { return (n + 1) % 3 === 2 ? '+1 machado' : '+dano e alcance'; },
        disparar(arma) {
            const p = Game.jogador, s = this.stats(arma.nivel);
            const alvo = inimigoMaisProximo(p.x, p.y, 600);
            const base = alvo ? angleTo(p.x, p.y, alvo.x, alvo.y) : (p.olhar >= 0 ? 0 : Math.PI);
            for (let i = 0; i < s.qtd; i++) {
                const ang = base + (i - (s.qtd - 1) / 2) * 0.45;
                criarProjetil({
                    x: p.x, y: p.y - 6, ang, vel: V(420),
                    dano: D(s.dano), perfura: 99, vida: 2.4,
                    tipo: 'machado', raio: 15, cor: '#c9d2e0', knock: 140,
                    bumerangue: true, alcance: A(s.alcance), gira: 16
                });
            }
            Som.efeito('machado');
        }
    },

    /* ---------- Aura Sagrada: dano constante em volta ---------- */
    aura: {
        nome: 'Aura Sagrada', icone: '🕯️', max: 8,
        desc: 'Uma luz que queima os mortos-vivos ao seu redor.',
        stats(n) {
            return { dano: 7 + n * 3.2, raio: 74 + n * 11, intervalo: 0.62 - n * 0.028 };
        },
        proximo() { return '+dano, +raio e pulsos mais rápidos'; },
        continua: true,
        atualizar(arma, dt) {
            const p = Game.jogador, s = this.stats(arma.nivel);
            arma.pulso = (arma.pulso || 0) - dt;
            if (arma.pulso <= 0) {
                arma.pulso = s.intervalo * p.recargaMul;
                danoNaArea(p.x, p.y, A(s.raio), D(s.dano), 40);
                criarEfeito({ tipo: 'aneis', x: p.x, y: p.y, raio: A(s.raio), vida: 0.35, cor: '#ffe9a8' });
            }
        },
        desenhar(arma, g) {
            const p = Game.jogador, s = this.stats(arma.nivel);
            const r = A(s.raio);
            const pulso = 0.5 + 0.5 * Math.sin(Game.tempo * 4);
            desenharBrilho(g, p.x, p.y, r, 'rgba(255,220,140,0.30)', 0.35 + pulso * 0.15);
        },
        evolucao: { arma: 'circulo', passivo: 'coracao' }
    },

    circulo: {
        nome: 'Círculo Divino', icone: '🌟', max: 1, oculta: true, evoluida: true,
        desc: 'Aura imensa que queima inimigos e cura você a cada pulso.',
        stats() { return { dano: 30, raio: 210, intervalo: 0.35 }; },
        proximo() { return 'No poder máximo'; },
        continua: true,
        atualizar(arma, dt) {
            const p = Game.jogador, s = this.stats();
            arma.pulso = (arma.pulso || 0) - dt;
            if (arma.pulso <= 0) {
                arma.pulso = s.intervalo * p.recargaMul;
                const acertos = danoNaArea(p.x, p.y, A(s.raio), D(s.dano), 90);
                if (acertos > 0) curarJogador(0.35);
                criarEfeito({ tipo: 'aneis', x: p.x, y: p.y, raio: A(s.raio), vida: 0.35, cor: '#fff4c0' });
            }
        },
        desenhar(arma, g) {
            const p = Game.jogador, r = A(this.stats().raio);
            desenharBrilho(g, p.x, p.y, r, 'rgba(255,240,190,0.34)', 0.5);
        }
    },

    /* ---------- Fogo Grego: bola de fogo que deixa poça ---------- */
    fogo: {
        nome: 'Fogo Grego', icone: '🔥', max: 8,
        desc: 'Explode e deixa chamas ardendo no chão.',
        stats(n) {
            return {
                dano: 14 + n * 5,
                danoChama: 5 + n * 2.4,
                recarga: 2.0 - n * 0.1,
                qtd: 1 + Math.floor(n / 4),
                raio: 62 + n * 6,
                duracao: 3.0 + n * 0.25
            };
        },
        proximo(n) { return (n + 1) % 4 === 0 ? '+1 bola de fogo' : '+dano, +área e mais duração'; },
        disparar(arma) {
            const p = Game.jogador, s = this.stats(arma.nivel);
            for (let i = 0; i < s.qtd; i++) {
                const alvo = inimigoAleatorioNaTela();
                const ang = alvo ? angleTo(p.x, p.y, alvo.x, alvo.y) + rand(-0.12, 0.12) : rand(0, TAU);
                const alcance = alvo ? dist(p.x, p.y, alvo.x, alvo.y) : 220;
                criarProjetil({
                    x: p.x, y: p.y - 6, ang, vel: V(330),
                    dano: D(s.dano), perfura: 0, vida: clamp(alcance / 330, 0.25, 2.2),
                    tipo: 'bola', raio: 12, cor: '#ff9b3a', knock: 60,
                    explodir: { raio: A(s.raio), dano: D(s.dano) },
                    zona: { raio: A(s.raio) * 0.9, dano: D(s.danoChama), vida: Du(s.duracao), cor: '#ff7b2a' }
                });
            }
            Som.efeito('fogo');
        },
        evolucao: { arma: 'inferno', passivo: 'tomo' }
    },

    inferno: {
        nome: 'Inferno Sagrado', icone: '☄️', max: 1, oculta: true, evoluida: true,
        desc: 'Chuva de meteoros que transforma o campo em brasas.',
        stats() { return { dano: 60, danoChama: 26, recarga: 1.1, qtd: 3, raio: 110, duracao: 5 }; },
        proximo() { return 'No poder máximo'; },
        disparar(arma) {
            const p = Game.jogador, s = this.stats();
            for (let i = 0; i < s.qtd; i++) {
                const alvo = inimigoAleatorioNaTela();
                const x = alvo ? alvo.x : p.x + rand(-260, 260);
                const y = alvo ? alvo.y : p.y + rand(-200, 200);
                criarEfeito({ tipo: 'meteoro', x, y, vida: 0.45, raio: A(s.raio), cor: '#ff8b3a', aoFim: () => {
                    danoNaArea(x, y, A(s.raio), D(s.dano), 200);
                    criarZona({ x, y, raio: A(s.raio) * 0.9, dano: D(s.danoChama), vida: Du(s.duracao), cor: '#ff6b2a' });
                    criarEfeito({ tipo: 'explosao', x, y, raio: A(s.raio), vida: 0.4, cor: '#ffb03a' });
                    Som.efeito('fogo');
                }});
            }
        }
    },

    /* ---------- Escudos orbitais ---------- */
    orbes: {
        nome: 'Escudos Sagrados', icone: '🛡️', max: 8,
        desc: 'Escudos giram ao seu redor ferindo quem encostar.',
        stats(n) {
            return { dano: 9 + n * 4, qtd: 2 + Math.floor(n / 2), raio: 74 + n * 5, vel: 2.1 + n * 0.09 };
        },
        proximo(n) { return (n + 1) % 2 === 0 ? '+1 escudo' : '+dano e giro mais rápido'; },
        continua: true,
        atualizar(arma, dt) {
            const p = Game.jogador, s = this.stats(arma.nivel);
            arma.ang = (arma.ang || 0) + s.vel * dt;
            arma.golpe = (arma.golpe || 0) - dt;
            const bate = arma.golpe <= 0;
            if (bate) arma.golpe = 0.22;
            arma.pos = [];
            for (let i = 0; i < s.qtd; i++) {
                const a = arma.ang + (i / s.qtd) * TAU;
                const x = p.x + Math.cos(a) * A(s.raio);
                const y = p.y + Math.sin(a) * A(s.raio) * 0.8;
                arma.pos.push({ x, y });
                if (bate) danoNaArea(x, y, 22 * Game.jogador.areaMul, D(s.dano), 220);
            }
        },
        desenhar(arma, g) {
            if (!arma.pos) return;
            for (const o of arma.pos) {
                desenharBrilho(g, o.x, o.y, 22, 'rgba(160,220,255,0.55)', 0.6);
                g.fillStyle = '#dfe8ff';
                g.beginPath(); g.arc(o.x, o.y, 9, 0, TAU); g.fill();
                g.strokeStyle = '#7fb0e0'; g.lineWidth = 2; g.stroke();
            }
        }
    },

    /* ---------- Relâmpago ---------- */
    raio: {
        nome: 'Relâmpago Divino', icone: '⚡', max: 8,
        desc: 'Raios caem do céu sobre inimigos aleatórios.',
        stats(n) {
            return { dano: 22 + n * 9, recarga: 2.6 - n * 0.14, qtd: 1 + Math.floor((n + 1) / 2), raio: 46 + n * 4 };
        },
        proximo(n) { return (n + 1) % 2 === 1 ? '+1 raio' : '+dano e área'; },
        disparar(arma) {
            const s = this.stats(arma.nivel);
            const alvos = inimigosNaTela(s.qtd);
            if (!alvos.length) return;
            for (let i = 0; i < s.qtd; i++) {
                const alvo = alvos[i % alvos.length];
                const x = alvo.x + rand(-10, 10), y = alvo.y;
                criarEfeito({ tipo: 'raio', x, y, vida: 0.28, raio: A(s.raio), semente: randInt(0, 9999) });
                danoNaArea(x, y, A(s.raio), D(s.dano), 120);
            }
            Som.efeito('raio');
        }
    },

    /* ---------- Adagas ---------- */
    adagas: {
        nome: 'Adagas Velozes', icone: '🗡', max: 8,
        desc: 'Rajada rápida de adagas na direção em que você anda.',
        stats(n) {
            return { dano: 7 + n * 3, recarga: 0.62 - n * 0.035, qtd: 1 + Math.floor(n / 2), perfura: n >= 6 ? 2 : 1 };
        },
        proximo(n) { return (n + 1) % 2 === 0 ? '+1 adaga' : '+dano e velocidade'; },
        disparar(arma) {
            const p = Game.jogador, s = this.stats(arma.nivel);
            const alvo = inimigoMaisProximo(p.x, p.y, 520);
            const base = alvo ? angleTo(p.x, p.y, alvo.x, alvo.y) : (p.olhar >= 0 ? 0 : Math.PI);
            for (let i = 0; i < s.qtd; i++) {
                setTimeout(() => {
                    if (Game.estado !== 'jogando') return;
                    criarProjetil({
                        x: p.x, y: p.y - 4, ang: base + rand(-0.1, 0.1), vel: V(640),
                        dano: D(s.dano), perfura: s.perfura, vida: 1.1,
                        tipo: 'faca', raio: 6, cor: '#dfe8ff', knock: 60
                    });
                }, i * 70);
            }
            Som.efeito('flecha');
        }
    },

    /* ---------- Martelo ---------- */
    martelo: {
        nome: 'Martelo do Trovão', icone: '🔨', max: 8,
        desc: 'Projétil pesado que explode e empurra a horda.',
        stats(n) {
            return { dano: 26 + n * 11, recarga: 2.4 - n * 0.11, raio: 74 + n * 8, qtd: n >= 5 ? 2 : 1 };
        },
        proximo(n) { return (n + 1) === 5 ? '+1 martelo' : '+dano e explosão maior'; },
        disparar(arma) {
            const p = Game.jogador, s = this.stats(arma.nivel);
            const alvo = inimigoMaisProximo(p.x, p.y, 620);
            const base = alvo ? angleTo(p.x, p.y, alvo.x, alvo.y) : (p.olhar >= 0 ? 0 : Math.PI);
            for (let i = 0; i < s.qtd; i++) {
                criarProjetil({
                    x: p.x, y: p.y - 6, ang: base + (i - (s.qtd - 1) / 2) * 0.35, vel: V(300),
                    dano: D(s.dano), perfura: 2, vida: 1.6,
                    tipo: 'martelo', raio: 16, cor: '#cfa14a', knock: 260, gira: 9,
                    explodir: { raio: A(s.raio), dano: D(s.dano * 0.7) }
                });
            }
            Som.efeito('machado');
        }
    }
};

/* =========================================================
   ITENS PASSIVOS
   ========================================================= */
const PASSIVOS = {
    anel:      { nome: 'Anel de Poder',   icone: '💍', max: 5, desc: '+12% de dano em tudo', porNivel: '+12% dano' },
    ampulheta: { nome: 'Ampulheta',        icone: '⏳', max: 5, desc: 'Armas recarregam mais rápido', porNivel: '-8% recarga' },
    botas:     { nome: 'Botas de Couro',   icone: '🥾', max: 5, desc: 'Você corre mais', porNivel: '+8% velocidade' },
    coracao:   { nome: 'Coração de Leão',  icone: '❤️', max: 5, desc: 'Aumenta a vida máxima e cura', porNivel: '+20 vida máxima' },
    armadura:  { nome: 'Armadura',         icone: '🪖', max: 5, desc: 'Reduz o dano recebido', porNivel: '+2 armadura' },
    amuleto:   { nome: 'Amuleto do Ímã',   icone: '🧲', max: 5, desc: 'Atrai gemas de longe', porNivel: '+30% coleta' },
    tomo:      { nome: 'Tomo Antigo',      icone: '📖', max: 5, desc: 'Aumenta a área das armas', porNivel: '+12% área' },
    trevo:     { nome: 'Trevo da Sorte',   icone: '🍀', max: 5, desc: 'Mais chance de crítico e itens', porNivel: '+8% sorte' },
    relicario: { nome: 'Relicário',        icone: '⚜️', max: 5, desc: 'Regenera vida devagar', porNivel: '+0,5 vida/s' }
};

/* =========================================================
   MONSTROS
   ========================================================= */
const MONSTROS = {
    rato: {
        nome: 'Rato Gigante', sprite: 'rato', escala: 0.7, r: 13,
        vida: 9, vel: 104, dano: 6, xp: 1, ouro: 0.06, ia: 'perseguir', desde: 0, peso: 10
    },
    esqueleto: {
        nome: 'Esqueleto', sprite: 'hum_esqueleto', escala: 1, r: 15,
        vida: 16, vel: 74, dano: 9, xp: 2, ouro: 0.10, ia: 'perseguir', desde: 0, peso: 10
    },
    goblin: {
        nome: 'Goblin', sprite: 'hum_goblin', escala: 0.95, r: 14,
        vida: 22, vel: 112, dano: 10, xp: 3, ouro: 0.12, ia: 'perseguir', desde: 55, peso: 9
    },
    morcego: {
        nome: 'Morcego', sprite: 'morcego', escala: 1, r: 12,
        vida: 12, vel: 142, dano: 7, xp: 2, ouro: 0.08, ia: 'ondulado', desde: 110, peso: 8
    },
    lobo: {
        nome: 'Lobo Faminto', sprite: 'lobo', escala: 0.9, r: 16,
        vida: 30, vel: 138, dano: 13, xp: 4, ouro: 0.16, ia: 'investida', desde: 170, peso: 7
    },
    arqueiro: {
        nome: 'Arqueiro Esquelético', sprite: 'hum_arqueiro', escala: 1, r: 15,
        vida: 24, vel: 62, dano: 8, xp: 5, ouro: 0.2, ia: 'atirador', desde: 240, peso: 5,
        alcance: 300, recarga: 2.2, danoTiro: 11
    },
    orc: {
        nome: 'Orc Bruto', sprite: 'hum_orc', escala: 1.35, r: 22,
        vida: 78, vel: 58, dano: 18, xp: 8, ouro: 0.3, ia: 'perseguir', desde: 300, peso: 6
    },
    espectro: {
        nome: 'Espectro', sprite: 'espectro', escala: 1.1, r: 16,
        vida: 44, vel: 92, dano: 14, xp: 7, ouro: 0.26, ia: 'fantasma', desde: 420, peso: 6
    },
    cultista: {
        nome: 'Cultista', sprite: 'hum_cultista', escala: 1, r: 15,
        vida: 40, vel: 78, dano: 12, xp: 7, ouro: 0.28, ia: 'atirador', desde: 480, peso: 5,
        alcance: 260, recarga: 1.9, danoTiro: 15, corTiro: '#c07bff'
    },
    alfa: {
        nome: 'Lobo Alfa', sprite: 'alfa', escala: 1.15, r: 20,
        vida: 120, vel: 148, dano: 20, xp: 12, ouro: 0.5, ia: 'investida', desde: 540, peso: 4
    },
    cavaleiro: {
        nome: 'Cavaleiro Negro', sprite: 'hum_cavaleiro', escala: 1.25, r: 20,
        vida: 190, vel: 84, dano: 24, xp: 16, ouro: 0.7, ia: 'perseguir', desde: 600, peso: 5
    },
    vampiro: {
        nome: 'Morcego Vampiro', sprite: 'vampiro', escala: 1.15, r: 14,
        vida: 70, vel: 168, dano: 16, xp: 10, ouro: 0.4, ia: 'ondulado', desde: 660, peso: 5
    },
    alma: {
        nome: 'Alma Penada', sprite: 'alma', escala: 1.2, r: 17,
        vida: 130, vel: 104, dano: 22, xp: 14, ouro: 0.6, ia: 'fantasma', desde: 720, peso: 5
    }
};

/* =========================================================
   CHEFES
   ========================================================= */
const CHEFES = [
    {
        id: 'ogro', tempo: 300, nome: 'Ogro da Ponte', sprite: 'chefe_ogro', escala: 1.5, r: 44,
        vida: 2600, vel: 62, dano: 30, xp: 120, ouro: 60, ia: 'chefe',
        ataque: 'pisada', recarga: 3.2
    },
    {
        id: 'necro', tempo: 600, nome: 'Necromante', sprite: 'chefe_necro', escala: 1.5, r: 42,
        vida: 6200, vel: 74, dano: 28, xp: 220, ouro: 120, ia: 'chefe',
        ataque: 'invocar', recarga: 2.6
    },
    {
        id: 'rei', tempo: 900, nome: 'Rei Vampiro', sprite: 'chefe_rei', escala: 1.8, r: 50,
        vida: 9500, vel: 88, dano: 38, xp: 500, ouro: 300, ia: 'chefe',
        ataque: 'leque', recarga: 2.0, final: true
    }
];

/* =========================================================
   DIFICULDADES
   ========================================================= */
const DIFICULDADES = {
    facil:  { nome: 'Escudeiro', vidaMul: 0.75, danoMul: 0.7, ritmoMul: 0.8, ouroMul: 0.8 },
    normal: { nome: 'Cavaleiro', vidaMul: 1.0, danoMul: 1.0, ritmoMul: 1.0, ouroMul: 1.0 },
    dificil:{ nome: 'Lenda',     vidaMul: 1.5, danoMul: 1.35, ritmoMul: 1.3, ouroMul: 1.6 }
};

/* =========================================================
   LOJA PERMANENTE (gasta o ouro guardado entre partidas)
   ========================================================= */
const LOJA = [
    { id: 'vigor',    nome: 'Vigor',        icone: '❤️', max: 8, custo: n => 120 + n * 110, desc: '+12 vida máxima' },
    { id: 'furia',    nome: 'Fúria',        icone: '💢', max: 8, custo: n => 160 + n * 140, desc: '+6% de dano' },
    { id: 'passada',  nome: 'Passada Leve', icone: '🥾', max: 5, custo: n => 140 + n * 120, desc: '+4% de velocidade' },
    { id: 'couraca',  nome: 'Couraça',      icone: '🪖', max: 5, custo: n => 180 + n * 150, desc: '+1 armadura' },
    { id: 'ganancia', nome: 'Ganância',     icone: '💰', max: 5, custo: n => 200 + n * 160, desc: '+12% de ouro' },
    { id: 'sabedoria',nome: 'Sabedoria',    icone: '📜', max: 5, custo: n => 220 + n * 170, desc: '+8% de experiência' },
    { id: 'ima',      nome: 'Ímã Arcano',   icone: '🧲', max: 3, custo: n => 260 + n * 200, desc: '+20% de coleta' },
    { id: 'renascer', nome: 'Renascer',     icone: '⚜️', max: 2, custo: n => 1200 + n * 1500, desc: 'Reviva 1 vez por partida' }
];

/* Bônus permanentes aplicados no início da partida */
function bonusPermanentes() {
    const m = Save.data.melhorias;
    return {
        vida: (m.vigor || 0) * 12,
        dano: 1 + (m.furia || 0) * 0.06,
        vel: 1 + (m.passada || 0) * 0.04,
        armadura: (m.couraca || 0),
        ouro: 1 + (m.ganancia || 0) * 0.12,
        xp: 1 + (m.sabedoria || 0) * 0.08,
        ima: 1 + (m.ima || 0) * 0.20,
        vidas: (m.renascer || 0)
    };
}
