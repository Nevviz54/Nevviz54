'use strict';
/* =========================================================
   game.js - motor do jogo: laço principal, jogador, monstros,
   colisões, desenho e telas.
   ========================================================= */

const Game = {
    canvas: null, ctx: null,
    w: 0, h: 0, escala: 1,
    estado: 'menu',           // menu | selecao | loja | jogando | nivel | pausa | fim | vitoria
    tempo: 0,
    dt: 0,
    jogador: null,
    inimigos: [], projeteis: [], projInimigos: [],
    areas: [], zonas: [], coletaveis: [], efeitos: [], textos: [],
    grade: null,
    abates: 0, ouro: 0, gemasColetadas: 0,
    dificuldade: 'normal',
    camX: 0, camY: 0, tremor: 0, tremorT: 0,
    chao: null, padrao: null,
    proximoChefe: 0,
    chefeAtivo: null,
    timerSpawn: 0, timerHorda: 0,
    filaNivel: 0,
    ultimoQuadro: 0,
    hudSujo: true,
    bonus: null,
    teclas: {},
    joystick: { ativo: false, id: null, bx: 0, by: 0, x: 0, y: 0, dx: 0, dy: 0 },
    DURACAO: 900              // 15 minutos até a vitória
};

/* =========================================================
   INICIALIZAÇÃO
   ========================================================= */
function iniciar() {
    Save.load();
    prepararArte();

    Game.canvas = document.getElementById('tela');
    Game.ctx = Game.canvas.getContext('2d');
    Game.grade = new SpatialGrid(72);
    Game.chao = criarTexturaChao('campo');
    Game.padrao = Game.ctx.createPattern(Game.chao, 'repeat');

    redimensionar();
    window.addEventListener('resize', redimensionar);

    configurarEntrada();
    configurarMenus();

    Som.ligado = Save.data.som !== false;
    Som.musicaLigada = Save.data.musica !== false;

    montarSelecaoHerois();
    atualizarMenuPrincipal();

    Game.ultimoQuadro = performance.now();
    requestAnimationFrame(laco);
}

function redimensionar() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    Game.w = window.innerWidth;
    Game.h = window.innerHeight;
    Game.canvas.width = Math.floor(Game.w * dpr);
    Game.canvas.height = Math.floor(Game.h * dpr);
    Game.canvas.style.width = Game.w + 'px';
    Game.canvas.style.height = Game.h + 'px';
    Game.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    Game.dpr = dpr;
    // O zoom é arredondado para múltiplos de 1/3 porque a arte é feita
    // com pixels de 3x3: assim cada pixel continua quadradinho e nítido.
    const bruto = clamp(Math.min(Game.w / 780, Game.h / 440), 1, 2.34);
    Game.escala = Math.max(3, Math.round(bruto * 3)) / 3;
}

function meiaLargura() { return Game.w / (2 * Game.escala); }
function meiaAltura() { return Game.h / (2 * Game.escala); }

/* =========================================================
   ENTRADA (teclado + toque)
   ========================================================= */
function configurarEntrada() {
    window.addEventListener('keydown', e => {
        Game.teclas[e.key.toLowerCase()] = true;
        if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(e.key.toLowerCase())) e.preventDefault();
        if (e.key === 'Escape' || e.key.toLowerCase() === 'p') alternarPausa();
    });
    window.addEventListener('keyup', e => { Game.teclas[e.key.toLowerCase()] = false; });
    window.addEventListener('blur', () => { Game.teclas = {}; });

    const c = Game.canvas;
    c.addEventListener('touchstart', e => {
        for (const t of e.changedTouches) {
            if (!Game.joystick.ativo) {
                Game.joystick.ativo = true;
                Game.joystick.id = t.identifier;
                Game.joystick.bx = t.clientX; Game.joystick.by = t.clientY;
                Game.joystick.x = t.clientX; Game.joystick.y = t.clientY;
            }
        }
        e.preventDefault();
    }, { passive: false });

    c.addEventListener('touchmove', e => {
        for (const t of e.changedTouches) {
            if (t.identifier === Game.joystick.id) {
                Game.joystick.x = t.clientX; Game.joystick.y = t.clientY;
            }
        }
        e.preventDefault();
    }, { passive: false });

    const fim = e => {
        for (const t of e.changedTouches) {
            if (t.identifier === Game.joystick.id) {
                Game.joystick.ativo = false; Game.joystick.id = null;
                Game.joystick.dx = 0; Game.joystick.dy = 0;
            }
        }
    };
    c.addEventListener('touchend', fim);
    c.addEventListener('touchcancel', fim);
}

function direcaoEntrada() {
    let dx = 0, dy = 0;
    const t = Game.teclas;
    if (t['a'] || t['arrowleft']) dx -= 1;
    if (t['d'] || t['arrowright']) dx += 1;
    if (t['w'] || t['arrowup']) dy -= 1;
    if (t['s'] || t['arrowdown']) dy += 1;

    if (Game.joystick.ativo) {
        let jx = Game.joystick.x - Game.joystick.bx;
        let jy = Game.joystick.y - Game.joystick.by;
        const m = Math.hypot(jx, jy);
        const morto = 12, maxR = 70;
        if (m > morto) {
            const f = Math.min(m, maxR) / maxR;
            dx += (jx / m) * f;
            dy += (jy / m) * f;
        }
    }
    const m = Math.hypot(dx, dy);
    if (m > 1) { dx /= m; dy /= m; }
    return { x: dx, y: dy, m: Math.min(m, 1) };
}

/* =========================================================
   PARTIDA
   ========================================================= */
function iniciarPartida(heroiId, dificuldade) {
    const heroi = HEROIS.find(h => h.id === heroiId) || HEROIS[0];
    const b = bonusPermanentes();
    Game.bonus = b;
    Game.dificuldade = dificuldade || 'normal';

    Game.tempo = 0;
    Game.abates = 0; Game.ouro = 0; Game.gemasColetadas = 0;
    Game.inimigos = []; Game.projeteis = []; Game.projInimigos = [];
    Game.areas = []; Game.zonas = []; Game.coletaveis = []; Game.efeitos = []; Game.textos = [];
    Game.timerSpawn = 0; Game.timerHorda = 12; Game.filaNivel = 0;
    Game.proximoChefe = 0; Game.chefeAtivo = null;
    Game.tremor = 0;

    const bon = heroi.bonus || {};
    Game.jogador = {
        heroi: heroi.id, sprite: heroi.sprite,
        x: 0, y: 0, vx: 0, vy: 0, r: 13, olhar: 1, andando: 0, passo: 0,
        vidaMax: heroi.vida + b.vida,
        vida: heroi.vida + b.vida,
        velocidade: heroi.velocidade * b.vel,
        armadura: heroi.armadura + b.armadura,
        danoMul: (bon.danoMul || 1) * b.dano,
        recargaMul: bon.recargaMul || 1,
        areaMul: bon.areaMul || 1,
        velProjMul: 1,
        duracaoMul: 1,
        imaRaio: 95 * (bon.imaMul || 1) * b.ima,
        sorte: 0,
        regen: bon.regen || 0,
        xpMul: b.xp,
        ouroMul: b.ouro,
        nivel: 1, xp: 0, xpProx: 10,
        armas: [], passivos: {},
        invuln: 0, vidas: b.vidas, morto: false
    };
    darArma(heroi.arma);

    Save.data.partidas++;
    Save.save();

    Game.estado = 'jogando';
    Game.hudSujo = true;
    mostrarTela(null);
    document.getElementById('hud').classList.remove('escondido');
    Som.iniciar();
    Som.tocarMusica();
    atualizarHUD();
}

function darArma(id) {
    const p = Game.jogador;
    if (p.armas.find(a => a.id === id)) return;
    p.armas.push({ id, nivel: 1, timer: 0 });
    Game.hudSujo = true;
}

/* =========================================================
   LAÇO PRINCIPAL
   ========================================================= */
function laco(agora) {
    let dt = (agora - Game.ultimoQuadro) / 1000;
    Game.ultimoQuadro = agora;
    dt = Math.min(dt, 1 / 20);   // evita saltos gigantes ao voltar de outra aba
    Game.dt = dt;

    if (Game.estado === 'jogando') atualizar(dt);
    desenhar();

    requestAnimationFrame(laco);
}

/* =========================================================
   ATUALIZAÇÃO
   ========================================================= */
function atualizar(dt) {
    const p = Game.jogador;
    Game.tempo += dt;

    /* ---- movimento do jogador ---- */
    const dir = direcaoEntrada();
    const vel = p.velocidade;
    p.vx = dir.x * vel;
    p.vy = dir.y * vel;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (dir.x !== 0) p.olhar = dir.x > 0 ? 1 : -1;
    p.andando = dir.m;
    if (dir.m > 0.05) p.passo += dt * 9 * dir.m;

    if (p.invuln > 0) p.invuln -= dt;
    if (p.regen > 0 && p.vida < p.vidaMax) {
        p.vida = Math.min(p.vidaMax, p.vida + p.regen * dt);
        Game.hudSujo = true;
    }

    /* ---- armas ---- */
    for (const arma of p.armas) {
        const def = ARMAS[arma.id];
        if (!def) continue;
        if (def.continua) {
            def.atualizar(arma, dt);
        } else {
            arma.timer -= dt;
            if (arma.timer <= 0) {
                const s = def.stats(arma.nivel);
                arma.timer = Math.max(0.08, s.recarga * p.recargaMul);
                def.disparar(arma);
            }
        }
    }

    /* ---- surgimento de monstros ---- */
    atualizarSpawn(dt);
    atualizarChefes();

    /* ---- monstros ---- */
    Game.grade.clear();
    for (const e of Game.inimigos) {
        atualizarInimigo(e, dt);
        Game.grade.insert(e);
    }
    separarInimigos();

    /* ---- projéteis do jogador ---- */
    atualizarProjeteis(dt);
    /* ---- áreas de dano (golpes, explosões) ---- */
    atualizarAreas(dt);
    /* ---- poças de fogo ---- */
    atualizarZonas(dt);
    /* ---- projéteis inimigos ---- */
    atualizarProjeteisInimigos(dt);
    /* ---- itens no chão ---- */
    atualizarColetaveis(dt);
    /* ---- contato com o jogador ---- */
    colisaoJogador(dt);
    /* ---- efeitos e textos ---- */
    atualizarEfeitos(dt);

    /* ---- limpeza ---- */
    if (Game.inimigos.some(e => e.morto)) Game.inimigos = Game.inimigos.filter(e => !e.morto);
    if (Game.projeteis.some(b => b.morto)) Game.projeteis = Game.projeteis.filter(b => !b.morto);
    if (Game.projInimigos.some(b => b.morto)) Game.projInimigos = Game.projInimigos.filter(b => !b.morto);
    if (Game.coletaveis.some(c => c.morto)) Game.coletaveis = Game.coletaveis.filter(c => !c.morto);

    /* ---- câmera ---- */
    Game.camX = p.x; Game.camY = p.y;
    if (Game.tremor > 0) Game.tremor = Math.max(0, Game.tremor - dt * 26);

    /* ---- vitória por tempo (caso o chefe final já tenha caído) ---- */
    if (Game.tempo >= Game.DURACAO + 30 && !Game.chefeAtivo) vencer();

    atualizarHUD();
}

/* =========================================================
   SURGIMENTO DE MONSTROS
   ========================================================= */
function multiplicadorVida() {
    const min = Game.tempo / 60;
    return (1 + min * 0.42 + min * min * 0.03) * DIFICULDADES[Game.dificuldade].vidaMul;
}
function multiplicadorDano() {
    const min = Game.tempo / 60;
    return (1 + min * 0.11) * DIFICULDADES[Game.dificuldade].danoMul;
}

function tiposDisponiveis() {
    const t = Game.tempo;
    const lista = [];
    for (const id in MONSTROS) {
        const m = MONSTROS[id];
        if (t >= m.desde) lista.push(id);
    }
    return lista;
}

function sortearTipo() {
    const tipos = tiposDisponiveis();
    let total = 0;
    for (const id of tipos) total += MONSTROS[id].peso;
    let r = Math.random() * total;
    for (const id of tipos) {
        r -= MONSTROS[id].peso;
        if (r <= 0) return id;
    }
    return tipos[tipos.length - 1];
}

function pontoDeSurgimento() {
    const raio = Math.max(meiaLargura(), meiaAltura()) + rand(70, 190);
    const a = rand(0, TAU);
    return { x: Game.jogador.x + Math.cos(a) * raio, y: Game.jogador.y + Math.sin(a) * raio };
}

function atualizarSpawn(dt) {
    const min = Game.tempo / 60;
    const taxa = (1.0 + min * 1.15) * DIFICULDADES[Game.dificuldade].ritmoMul;
    Game.timerSpawn -= dt;
    if (Game.timerSpawn <= 0 && Game.inimigos.length < 320) {
        Game.timerSpawn = 1 / taxa;
        const pos = pontoDeSurgimento();
        const elite = Game.tempo > 200 && chance(0.022 + Game.jogador.sorte * 0.02);
        criarInimigo(sortearTipo(), pos.x, pos.y, { elite });
    }

    // hordas periódicas: um grupo grande vem de um lado só
    Game.timerHorda -= dt;
    if (Game.timerHorda <= 0) {
        Game.timerHorda = Math.max(22, 46 - min * 1.4);
        lancarHorda();
    }
}

function lancarHorda() {
    const qtd = Math.floor(12 + Game.tempo / 60 * 5);
    const tipo = sortearTipo();
    const angBase = rand(0, TAU);
    const raio = Math.max(meiaLargura(), meiaAltura()) + 110;
    const p = Game.jogador;
    for (let i = 0; i < qtd; i++) {
        const a = angBase + rand(-0.6, 0.6);
        const d = raio + rand(0, 180);
        criarInimigo(tipo, p.x + Math.cos(a) * d, p.y + Math.sin(a) * d, {});
    }
    mostrarAviso('Uma horda se aproxima!', 1.6);
}

function criarInimigo(tipoId, x, y, op) {
    const def = MONSTROS[tipoId];
    if (!def) return null;
    const elite = !!(op && op.elite);
    const vidaMul = multiplicadorVida() * (elite ? 7 : 1);
    const e = {
        id: ++criarInimigo.contador,
        tipo: tipoId, def,
        nome: def.nome, sprite: def.sprite,
        x, y, vx: 0, vy: 0,
        escala: def.escala * (elite ? 1.35 : 1),
        r: def.r * (elite ? 1.35 : 1),
        vidaMax: def.vida * vidaMul,
        vida: def.vida * vidaMul,
        vel: def.vel * rand(0.92, 1.08),
        dano: def.dano * multiplicadorDano(),
        xp: def.xp * (elite ? 8 : 1),
        ouro: def.ouro * (elite ? 10 : 1),
        ia: def.ia,
        elite, chefe: false,
        olhar: 1, flash: 0, ataque: 0, timer: rand(0, 2),
        empX: 0, empY: 0, morto: false
    };
    Game.inimigos.push(e);
    return e;
}
criarInimigo.contador = 0;

/* =========================================================
   CHEFES
   ========================================================= */
function atualizarChefes() {
    if (Game.proximoChefe >= CHEFES.length) return;
    const c = CHEFES[Game.proximoChefe];
    if (Game.tempo >= c.tempo && !Game.chefeAtivo) {
        Game.proximoChefe++;
        invocarChefe(c);
    }
}

function invocarChefe(def) {
    const p = Game.jogador;
    const a = rand(0, TAU);
    const d = Math.max(meiaLargura(), meiaAltura()) + 120;
    const mul = multiplicadorVida() / 3 + 1;
    const e = {
        id: ++criarInimigo.contador,
        tipo: def.id, def,
        nome: def.nome, sprite: def.sprite,
        x: p.x + Math.cos(a) * d, y: p.y + Math.sin(a) * d,
        vx: 0, vy: 0,
        escala: def.escala, r: def.r,
        vidaMax: def.vida * mul * DIFICULDADES[Game.dificuldade].vidaMul,
        vida: def.vida * mul * DIFICULDADES[Game.dificuldade].vidaMul,
        vel: def.vel,
        dano: def.dano * multiplicadorDano(),
        xp: def.xp, ouro: def.ouro,
        ia: 'chefe', ataque: def.recarga,
        elite: false, chefe: true, final: !!def.final,
        olhar: 1, flash: 0, timer: 0,
        empX: 0, empY: 0, morto: false
    };
    Game.inimigos.push(e);
    Game.chefeAtivo = e;
    mostrarAviso(def.nome.toUpperCase() + ' DESPERTOU!', 2.6);
    Som.efeito('chefe');
    Game.tremor = 14;
    document.getElementById('barra-chefe').classList.remove('escondido');
    document.getElementById('nome-chefe').textContent = def.nome;
}

function ataqueDeChefe(e, dt) {
    const p = Game.jogador;
    e.ataque -= dt;
    if (e.ataque > 0) return;
    e.ataque = e.def.recarga;

    switch (e.def.ataque) {
        case 'pisada': {
            const x = e.x, y = e.y;
            criarEfeito({ tipo: 'aviso', x, y, raio: 170, vida: 0.6, cor: '#ff6b3a', aoFim: () => {
                danoAoJogadorSeDentro(x, y, 170, e.dano * 1.2);
                criarEfeito({ tipo: 'explosao', x, y, raio: 170, vida: 0.4, cor: '#ffae5a' });
                Game.tremor = 12; Som.efeito('fogo');
            }});
            break;
        }
        case 'invocar': {
            const qtd = 5;
            for (let i = 0; i < qtd; i++) {
                const a = (i / qtd) * TAU + rand(-0.3, 0.3);
                criarInimigo(Game.tempo > 500 ? 'espectro' : 'esqueleto',
                    e.x + Math.cos(a) * 70, e.y + Math.sin(a) * 70, {});
            }
            criarEfeito({ tipo: 'aneis', x: e.x, y: e.y, raio: 110, vida: 0.5, cor: '#7fffc0' });
            Som.efeito('magia');
            break;
        }
        case 'leque': {
            const base = angleTo(e.x, e.y, p.x, p.y);
            for (let i = 0; i < 9; i++) {
                const ang = base + (i - 4) * 0.19;
                criarProjetilInimigo(e.x, e.y - 20, ang, 250, e.dano * 0.8, '#ff4a6a', 9);
            }
            Som.efeito('magia');
            break;
        }
    }
}

/* =========================================================
   IA DOS MONSTROS
   ========================================================= */
function atualizarInimigo(e, dt) {
    const p = Game.jogador;
    const dx = p.x - e.x, dy = p.y - e.y;
    const d = Math.hypot(dx, dy) || 1;
    const nx = dx / d, ny = dy / d;
    e.olhar = dx >= 0 ? 1 : -1;
    if (e.flash > 0) e.flash -= dt;

    let vx = 0, vy = 0;

    switch (e.ia) {
        case 'perseguir':
            vx = nx * e.vel; vy = ny * e.vel;
            break;

        case 'ondulado': {
            e.timer += dt;
            const lateral = Math.sin(e.timer * 5) * 0.65;
            vx = (nx + (-ny) * lateral) * e.vel;
            vy = (ny + (nx) * lateral) * e.vel;
            break;
        }

        case 'investida': {
            e.timer -= dt;
            if (e.investida > 0) {
                e.investida -= dt;
                vx = e.invX * e.vel * 3.0; vy = e.invY * e.vel * 3.0;
            } else if (e.timer <= 0 && d < 460) {
                e.timer = rand(2.4, 4.0);
                e.investida = 0.45;
                e.invX = nx; e.invY = ny;
                criarEfeito({ tipo: 'faisca', x: e.x, y: e.y, raio: 16, vida: 0.25, cor: '#ffd24a' });
            } else {
                vx = nx * e.vel * 0.55; vy = ny * e.vel * 0.55;
            }
            break;
        }

        case 'atirador': {
            const ideal = e.def.alcance * 0.75;
            if (d > ideal + 40) { vx = nx * e.vel; vy = ny * e.vel; }
            else if (d < ideal - 60) { vx = -nx * e.vel * 0.8; vy = -ny * e.vel * 0.8; }
            else { vx = -ny * e.vel * 0.5; vy = nx * e.vel * 0.5; }
            e.ataque -= dt;
            if (e.ataque <= 0 && d < e.def.alcance + 60) {
                e.ataque = e.def.recarga * rand(0.85, 1.15);
                criarProjetilInimigo(e.x, e.y - 8, angleTo(e.x, e.y, p.x, p.y), 300,
                    e.def.danoTiro * multiplicadorDano(), e.def.corTiro || '#e8dfc0', 6);
            }
            break;
        }

        case 'fantasma':
            vx = nx * e.vel; vy = ny * e.vel;
            break;

        case 'chefe':
            vx = nx * e.vel; vy = ny * e.vel;
            ataqueDeChefe(e, dt);
            break;
    }

    // empurrão (knockback) some com o tempo
    e.empX *= Math.pow(0.0016, dt);
    e.empY *= Math.pow(0.0016, dt);

    e.x += (vx + e.empX) * dt;
    e.y += (vy + e.empY) * dt;

    // monstros que ficaram muito longe voltam para perto;
    // se já houver gente demais no mapa, eles simplesmente somem
    if (!e.chefe && d > 1600) {
        if (Game.inimigos.length < 150) {
            const pos = pontoDeSurgimento();
            e.x = pos.x; e.y = pos.y;
        } else {
            e.morto = true;
        }
    }
}

/** Impede que os monstros fiquem todos empilhados no mesmo ponto. */
function separarInimigos() {
    const lista = Game.inimigos;
    for (let i = 0; i < lista.length; i++) {
        const a = lista[i];
        if (a.ia === 'fantasma') continue;
        Game.grade.query(a.x, a.y, a.r + 18, b => {
            if (b === a || b.ia === 'fantasma') return;
            const dx = b.x - a.x, dy = b.y - a.y;
            const dd = dx * dx + dy * dy;
            const min = (a.r + b.r) * 0.82;
            if (dd > 0.0001 && dd < min * min) {
                const d = Math.sqrt(dd);
                const f = (min - d) / min;
                const px = (dx / d) * f * 26;
                const py = (dy / d) * f * 26;
                const pesoA = a.chefe ? 0.05 : 1, pesoB = b.chefe ? 0.05 : 1;
                a.x -= px * pesoA; a.y -= py * pesoA;
                b.x += px * pesoB; b.y += py * pesoB;
            }
        });
    }
}

/* =========================================================
   PROJÉTEIS DO JOGADOR
   ========================================================= */
function criarProjetil(op) {
    if (Game.projeteis.length > 500) return;
    const b = {
        x: op.x, y: op.y,
        ang: op.ang,
        vel: op.vel,
        vx: Math.cos(op.ang) * op.vel,
        vy: Math.sin(op.ang) * op.vel,
        dano: op.dano,
        perfura: op.perfura == null ? 0 : op.perfura,
        vida: op.vida || 1.2,
        tipo: op.tipo || 'bola',
        raio: op.raio || 8,
        cor: op.cor || '#ffffff',
        knock: op.knock || 0,
        gira: op.gira || 0, rot: 0,
        bumerangue: !!op.bumerangue,
        alcance: op.alcance || 0,
        andou: 0, voltando: false,
        explodir: op.explodir || null,
        zona: op.zona || null,
        acertados: new Set(),
        morto: false
    };
    Game.projeteis.push(b);
    return b;
}

function atualizarProjeteis(dt) {
    const p = Game.jogador;
    for (const b of Game.projeteis) {
        b.vida -= dt;
        if (b.vida <= 0) { finalizarProjetil(b, false); continue; }

        if (b.bumerangue) {
            if (!b.voltando) {
                b.andou += b.vel * dt;
                if (b.andou >= b.alcance) { b.voltando = true; b.acertados.clear(); }
            } else {
                const ang = angleTo(b.x, b.y, p.x, p.y);
                b.vx = Math.cos(ang) * b.vel * 1.15;
                b.vy = Math.sin(ang) * b.vel * 1.15;
                if (dist2(b.x, b.y, p.x, p.y) < 24 * 24) { b.morto = true; continue; }
            }
        }

        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.rot += b.gira * dt;

        // colisão com monstros
        Game.grade.query(b.x, b.y, b.raio + 30, e => {
            if (b.morto || e.morto || b.acertados.has(e.id)) return;
            const rr = b.raio + e.r;
            if (dist2(b.x, b.y, e.x, e.y) <= rr * rr) {
                b.acertados.add(e.id);
                aplicarDano(e, b.dano, b.vx, b.vy, b.knock);
                if (b.perfura > 0) b.perfura--;
                else finalizarProjetil(b, true);
            }
        });
    }
}

function finalizarProjetil(b, acertou) {
    if (b.morto) return;
    b.morto = true;
    if (b.explodir) {
        danoNaArea(b.x, b.y, b.explodir.raio, b.explodir.dano, 200);
        criarEfeito({ tipo: 'explosao', x: b.x, y: b.y, raio: b.explodir.raio, vida: 0.35, cor: b.cor });
        Game.tremor = Math.max(Game.tremor, 5);
    }
    if (b.zona) {
        criarZona({ x: b.x, y: b.y, raio: b.zona.raio, dano: b.zona.dano, vida: b.zona.vida, cor: b.zona.cor });
    }
    if (!b.explodir && acertou) criarParticulas(b.x, b.y, 3, b.cor, 90);
}

/* =========================================================
   PROJÉTEIS INIMIGOS
   ========================================================= */
function criarProjetilInimigo(x, y, ang, vel, dano, cor, raio) {
    Game.projInimigos.push({
        x, y, vx: Math.cos(ang) * vel, vy: Math.sin(ang) * vel,
        dano, cor: cor || '#ff6b6b', raio: raio || 6, vida: 4, morto: false
    });
}

function atualizarProjeteisInimigos(dt) {
    const p = Game.jogador;
    for (const b of Game.projInimigos) {
        b.vida -= dt;
        b.x += b.vx * dt; b.y += b.vy * dt;
        if (b.vida <= 0) { b.morto = true; continue; }
        const rr = b.raio + p.r;
        if (dist2(b.x, b.y, p.x, p.y) <= rr * rr) {
            b.morto = true;
            danoNoJogador(b.dano);
        }
    }
}

/* =========================================================
   ÁREAS DE DANO (golpes de espada, explosões, pulsos)
   ========================================================= */
function criarArea(op) {
    Game.areas.push({
        tipo: op.tipo || 'circulo',
        x: op.x, y: op.y, ang: op.ang || 0,
        raio: op.raio, abertura: op.abertura || TAU,
        dano: op.dano, knock: op.knock || 0,
        vida: op.vida || 0.2, vidaMax: op.vida || 0.2,
        cor: op.cor || '#ffffff',
        acertados: new Set()
    });
}

function atualizarAreas(dt) {
    for (let i = Game.areas.length - 1; i >= 0; i--) {
        const a = Game.areas[i];
        a.vida -= dt;
        Game.grade.query(a.x, a.y, a.raio + 30, e => {
            if (e.morto || a.acertados.has(e.id)) return;
            const rr = a.raio + e.r;
            if (dist2(a.x, a.y, e.x, e.y) > rr * rr) return;
            if (a.tipo === 'arco') {
                let dif = Math.atan2(e.y - a.y, e.x - a.x) - a.ang;
                while (dif > Math.PI) dif -= TAU;
                while (dif < -Math.PI) dif += TAU;
                if (Math.abs(dif) > a.abertura / 2) return;
            }
            a.acertados.add(e.id);
            const ang = angleTo(a.x, a.y, e.x, e.y);
            aplicarDano(e, a.dano, Math.cos(ang), Math.sin(ang), a.knock);
        });
        if (a.vida <= 0) Game.areas.splice(i, 1);
    }
}

/** Dano imediato num círculo. Devolve quantos monstros foram atingidos. */
function danoNaArea(x, y, raio, dano, knock) {
    let n = 0;
    Game.grade.query(x, y, raio + 30, e => {
        if (e.morto) return;
        const rr = raio + e.r;
        if (dist2(x, y, e.x, e.y) <= rr * rr) {
            const ang = angleTo(x, y, e.x, e.y);
            aplicarDano(e, dano, Math.cos(ang), Math.sin(ang), knock || 0);
            n++;
        }
    });
    return n;
}

/* =========================================================
   ZONAS PERSISTENTES (poças de fogo)
   ========================================================= */
function criarZona(op) {
    if (Game.zonas.length > 18) Game.zonas.shift();   // evita entupir a tela de fogo
    Game.zonas.push({
        x: op.x, y: op.y, raio: op.raio, dano: op.dano,
        vida: op.vida, vidaMax: op.vida, cor: op.cor || '#ff7b2a',
        intervalo: 0.4, timer: 0
    });
}

function atualizarZonas(dt) {
    for (let i = Game.zonas.length - 1; i >= 0; i--) {
        const z = Game.zonas[i];
        z.vida -= dt;
        z.timer -= dt;
        if (z.timer <= 0) {
            z.timer = z.intervalo;
            danoNaArea(z.x, z.y, z.raio, z.dano, 0);
        }
        if (z.vida <= 0) Game.zonas.splice(i, 1);
    }
}

/* =========================================================
   DANO
   ========================================================= */
function aplicarDano(e, dano, dirX, dirY, knock) {
    const p = Game.jogador;
    let critico = false;
    let valor = dano;
    if (Math.random() < 0.05 + p.sorte * 0.35) { critico = true; valor *= 2; }
    e.vida -= valor;
    e.flash = 0.09;

    if (knock && !e.chefe) {
        const m = Math.hypot(dirX, dirY) || 1;
        const f = e.elite ? 0.45 : 1;
        e.empX += (dirX / m) * knock * f;
        e.empY += (dirY / m) * knock * f;
    }

    // só mostra o número em parte dos acertos: com centenas de inimigos
    // a tela viraria uma sopa de números
    if (critico || e.chefe || e.elite || chance(0.4)) {
        criarTexto(e.x, e.y - e.r - 6, Math.round(valor), critico ? '#ffd24a' : '#ffffff', critico ? 20 : 15);
    }
    if (critico) Som.efeito('critico'); else Som.efeito('acerto');

    if (e.vida <= 0) matarInimigo(e);
}

function matarInimigo(e) {
    if (e.morto) return;
    e.morto = true;
    Game.abates++;
    criarParticulas(e.x, e.y, e.chefe ? 26 : (e.elite ? 14 : 6), e.chefe ? '#ff5a5a' : '#c0393b', e.chefe ? 220 : 130);
    Som.efeito('morte');

    // recompensas
    soltarGema(e.x, e.y, e.xp);
    const ouro = e.ouro * (1 + Game.jogador.sorte * 0.5);
    if (ouro >= 1) {
        for (let i = 0; i < Math.min(8, Math.floor(ouro)); i++)
            soltarItem(e.x + rand(-16, 16), e.y + rand(-16, 16), 'moeda', 1);
    } else if (chance(ouro)) {
        soltarItem(e.x, e.y, 'moeda', 1);
    }
    if (chance(0.012 + Game.jogador.sorte * 0.01)) soltarItem(e.x, e.y, 'coracao', 20);
    if (e.elite || e.chefe) soltarItem(e.x, e.y, 'bau', 1);

    if (e.chefe) {
        Game.chefeAtivo = null;
        document.getElementById('barra-chefe').classList.add('escondido');
        Game.tremor = 18;
        mostrarAviso(e.nome + ' foi derrotado!', 2.2);
        for (let i = 0; i < 14; i++) soltarItem(e.x + rand(-70, 70), e.y + rand(-70, 70), 'moeda', 5);
        if (e.final) { setTimeout(vencer, 1400); }
    }
}

function danoNoJogador(dano) {
    const p = Game.jogador;
    if (p.invuln > 0 || p.morto) return;
    const reducao = clamp(p.armadura * 0.035, 0, 0.7);
    const valor = Math.max(1, dano * (1 - reducao));
    p.vida -= valor;
    p.invuln = 0.6;
    Game.tremor = Math.max(Game.tremor, 6);
    Som.efeito('dano');
    criarTexto(p.x, p.y - 30, '-' + Math.round(valor), '#ff6b6b', 17);
    document.getElementById('flash-dano').classList.add('ativo');
    setTimeout(() => document.getElementById('flash-dano').classList.remove('ativo'), 120);
    Game.hudSujo = true;
    if (p.vida <= 0) morrerJogador();
}

function danoAoJogadorSeDentro(x, y, raio, dano) {
    const p = Game.jogador;
    if (dist2(x, y, p.x, p.y) <= (raio + p.r) * (raio + p.r)) danoNoJogador(dano);
}

function curarJogador(v) {
    const p = Game.jogador;
    p.vida = Math.min(p.vidaMax, p.vida + v);
    Game.hudSujo = true;
}

function morrerJogador() {
    const p = Game.jogador;
    if (p.vidas > 0) {
        p.vidas--;
        p.vida = p.vidaMax * 0.7;
        p.invuln = 3;
        danoNaArea(p.x, p.y, 340, 9999, 500);
        criarEfeito({ tipo: 'explosao', x: p.x, y: p.y, raio: 340, vida: 0.6, cor: '#ffe9a8' });
        mostrarAviso('RENASCEU!', 2);
        Som.efeito('vitoria');
        return;
    }
    p.morto = true;
    perder();
}

/* =========================================================
   COLISÃO COM O JOGADOR
   ========================================================= */
function colisaoJogador(dt) {
    const p = Game.jogador;
    if (p.invuln > 0) return;
    let atingiu = null;
    Game.grade.query(p.x, p.y, p.r + 60, e => {
        if (atingiu || e.morto) return;
        const rr = p.r + e.r * 0.8;
        if (dist2(p.x, p.y, e.x, e.y) <= rr * rr) atingiu = e;
    });
    if (atingiu) danoNoJogador(atingiu.dano);
}

/* =========================================================
   ITENS NO CHÃO
   ========================================================= */
function soltarGema(x, y, valor) {
    let sprite = 'gema1';
    if (valor >= 40) sprite = 'gema4';
    else if (valor >= 12) sprite = 'gema3';
    else if (valor >= 4) sprite = 'gema2';
    soltarItem(x, y, 'gema', valor, sprite);
}

function soltarItem(x, y, tipo, valor, sprite) {
    if (Game.coletaveis.length > 900) {
        // se o chão estiver lotado, junta o valor no item mais antigo
        const primeiro = Game.coletaveis.find(c => c.tipo === tipo);
        if (primeiro) { primeiro.valor += valor; return; }
    }
    Game.coletaveis.push({
        x: x + rand(-6, 6), y: y + rand(-6, 6), tipo, valor,
        sprite: sprite || (tipo === 'moeda' ? 'moeda' : tipo === 'coracao' ? 'coracao' : 'bau'),
        t: rand(0, 6), atraido: false, vx: 0, vy: 0, morto: false
    });
}

function atualizarColetaveis(dt) {
    const p = Game.jogador;
    const raioIma = p.imaRaio;
    for (const c of Game.coletaveis) {
        c.t += dt;
        const d2 = dist2(c.x, c.y, p.x, p.y);
        if (!c.atraido && d2 < raioIma * raioIma) c.atraido = true;
        if (c.atraido) {
            const ang = angleTo(c.x, c.y, p.x, p.y);
            const vel = 260 + (raioIma * raioIma - d2) / Math.max(1, raioIma * raioIma) * 340;
            c.x += Math.cos(ang) * vel * dt;
            c.y += Math.sin(ang) * vel * dt;
        }
        if (d2 < 26 * 26) coletar(c);
    }
}

function coletar(c) {
    if (c.morto) return;
    c.morto = true;
    const p = Game.jogador;
    switch (c.tipo) {
        case 'gema':
            ganharXP(c.valor);
            Game.gemasColetadas++;
            if (chance(0.3)) Som.efeito('gema');
            break;
        case 'moeda':
            Game.ouro += Math.round(c.valor * p.ouroMul);
            if (chance(0.35)) Som.efeito('moeda');
            Game.hudSujo = true;
            break;
        case 'coracao':
            curarJogador(c.valor);
            criarTexto(p.x, p.y - 34, '+' + c.valor, '#7fff8a', 17);
            Som.efeito('cura');
            break;
        case 'bau':
            abrirBau();
            break;
    }
}

function abrirBau() {
    Som.efeito('bau');
    Game.ouro += Math.round(rand(15, 45) * Game.jogador.ouroMul);
    const opcoes = gerarOpcoes(1);
    if (opcoes.length) {
        aplicarOpcao(opcoes[0]);
        criarTexto(Game.jogador.x, Game.jogador.y - 44, 'BAÚ: ' + opcoes[0].titulo, '#ffd24a', 19);
    } else {
        curarJogador(40);
    }
    Game.hudSujo = true;
}

/* =========================================================
   EXPERIÊNCIA E NÍVEIS
   ========================================================= */
function ganharXP(v) {
    const p = Game.jogador;
    p.xp += v * p.xpMul;
    while (p.xp >= p.xpProx) {
        p.xp -= p.xpProx;
        p.nivel++;
        p.xpProx = Math.floor(4 + p.nivel * 2.6 + Math.pow(p.nivel, 1.5));
        Game.filaNivel++;
    }
    if (Game.filaNivel > 0 && Game.estado === 'jogando') abrirTelaNivel();
    Game.hudSujo = true;
}

/* =========================================================
   EFEITOS VISUAIS E TEXTOS
   ========================================================= */
function criarEfeito(op) {
    if (Game.efeitos.length > 500) return;
    Game.efeitos.push({
        tipo: op.tipo, x: op.x, y: op.y,
        raio: op.raio || 20, vida: op.vida || 0.3, vidaMax: op.vida || 0.3,
        cor: op.cor || '#fff', semente: op.semente || 0,
        vx: op.vx || 0, vy: op.vy || 0,
        aoFim: op.aoFim || null
    });
}

function criarParticulas(x, y, n, cor, vel) {
    for (let i = 0; i < n; i++) {
        const a = rand(0, TAU), v = rand(vel * 0.3, vel);
        criarEfeito({
            tipo: 'particula', x, y, raio: rand(2, 4.5), vida: rand(0.25, 0.6), cor,
            vx: Math.cos(a) * v, vy: Math.sin(a) * v
        });
    }
}

function criarTexto(x, y, txt, cor, tam) {
    if (Game.textos.length > 70) return;
    Game.textos.push({ x: x + rand(-6, 6), y, txt: String(txt), cor, tam: tam || 15, vida: 0.75, vidaMax: 0.75 });
}

function atualizarEfeitos(dt) {
    for (let i = Game.efeitos.length - 1; i >= 0; i--) {
        const f = Game.efeitos[i];
        f.vida -= dt;
        if (f.tipo === 'particula') {
            f.x += f.vx * dt; f.y += f.vy * dt;
            f.vx *= Math.pow(0.02, dt); f.vy *= Math.pow(0.02, dt);
        }
        if (f.vida <= 0) {
            if (f.aoFim) f.aoFim();
            Game.efeitos.splice(i, 1);
        }
    }
    for (let i = Game.textos.length - 1; i >= 0; i--) {
        const t = Game.textos[i];
        t.vida -= dt;
        t.y -= 34 * dt;
        if (t.vida <= 0) Game.textos.splice(i, 1);
    }
}

/* =========================================================
   BUSCA DE ALVOS (usada pelas armas)
   ========================================================= */
function inimigoMaisProximo(x, y, raioMax) {
    let melhor = null, melhorD = raioMax * raioMax;
    for (const e of Game.inimigos) {
        if (e.morto) continue;
        const d = dist2(x, y, e.x, e.y);
        if (d < melhorD) { melhorD = d; melhor = e; }
    }
    return melhor;
}

function inimigosNaTela(n) {
    const p = Game.jogador;
    const hw = meiaLargura() + 40, hh = meiaAltura() + 40;
    const lista = [];
    for (const e of Game.inimigos) {
        if (e.morto) continue;
        if (Math.abs(e.x - p.x) < hw && Math.abs(e.y - p.y) < hh) lista.push(e);
        if (lista.length > 60) break;
    }
    return shuffled(lista).slice(0, n);
}

function inimigoAleatorioNaTela() {
    const l = inimigosNaTela(1);
    return l.length ? l[0] : null;
}

/* =========================================================
   DESENHO
   ========================================================= */
function desenhar() {
    const g = Game.ctx;
    const dpr = Game.dpr || 1;

    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.fillStyle = '#0d0b12';
    g.fillRect(0, 0, Game.w, Game.h);

    if (!Game.jogador) { desenharFundoMenu(g); return; }

    const tx = rand(-Game.tremor, Game.tremor);
    const ty = rand(-Game.tremor, Game.tremor);
    const esc = Game.escala * dpr;
    g.setTransform(esc, 0, 0, esc, Game.w * dpr / 2 - Game.camX * esc + tx, Game.h * dpr / 2 - Game.camY * esc + ty);
    g.imageSmoothingEnabled = false;

    const hw = meiaLargura() + 60, hh = meiaAltura() + 60;
    const x0 = Game.camX - hw, x1 = Game.camX + hw;
    const y0 = Game.camY - hh, y1 = Game.camY + hh;

    desenharChao(g, x0, y0, x1, y1);
    desenharCenario(g, x0, y0, x1, y1);
    desenharZonas(g);

    // aura por baixo das criaturas
    for (const arma of Game.jogador.armas) {
        const def = ARMAS[arma.id];
        if (def && def.desenhar && (arma.id === 'aura' || arma.id === 'circulo')) def.desenhar(arma, g);
    }

    desenharColetaveis(g, x0, y0, x1, y1);

    // criaturas ordenadas pelo eixo Y (quem está mais abaixo aparece na frente)
    const lista = [];
    for (const e of Game.inimigos) {
        if (e.x > x0 && e.x < x1 && e.y > y0 && e.y < y1) lista.push(e);
    }
    lista.push(Game.jogador);
    lista.sort((a, b) => a.y - b.y);
    for (const ent of lista) {
        if (ent === Game.jogador) desenharJogador(g);
        else desenharInimigo(g, ent);
    }

    // escudos e outros efeitos por cima
    for (const arma of Game.jogador.armas) {
        const def = ARMAS[arma.id];
        if (def && def.desenhar && arma.id !== 'aura' && arma.id !== 'circulo') def.desenhar(arma, g);
    }

    desenharAreas(g);
    desenharProjeteis(g);
    desenharEfeitos(g);
    desenharTextos(g);

    // vinheta
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    desenharVinheta(g);
    if (Game.joystick.ativo) desenharJoystick(g);
}

function desenharChao(g, x0, y0, x1, y1) {
    g.save();
    g.fillStyle = Game.padrao;
    g.fillRect(x0, y0, x1 - x0, y1 - y0);
    g.restore();
}

/** Objetos decorativos gerados de forma determinística (o mundo é infinito). */
function desenharCenario(g, x0, y0, x1, y1) {
    const C = 230;
    const cx0 = Math.floor(x0 / C), cx1 = Math.floor(x1 / C);
    const cy0 = Math.floor(y0 / C), cy1 = Math.floor(y1 / C);
    for (let cx = cx0; cx <= cx1; cx++) {
        for (let cy = cy0; cy <= cy1; cy++) {
            const h = hash2(cx, cy);
            if (h > 0.62) continue;
            const px = cx * C + hash2(cx + 7, cy) * C;
            const py = cy * C + hash2(cx, cy + 13) * C;
            let spr;
            if (h < 0.16) spr = SPR.arvore;
            else if (h < 0.30) spr = SPR.tumulo;
            else if (h < 0.48) spr = SPR.pedra;
            else spr = SPR.cranio;
            desenharSombra(g, px, py + 2, spr.w * 0.35, spr.h * 0.14, 0.25);
            g.drawImage(spr.dir, Math.round(px - spr.w / 2), Math.round(py - spr.h));
        }
    }
}

function desenharZonas(g) {
    for (const z of Game.zonas) {
        const t = clamp(z.vida / z.vidaMax * 2, 0, 1);
        const pulso = 0.8 + 0.2 * Math.sin(Game.tempo * 9 + z.x);
        desenharBrilho(g, z.x, z.y, z.raio * pulso, z.cor, 0.26 * t);
        // labaredas: pequenos focos de fogo dentro da poça
        g.globalAlpha = 0.5 * t;
        g.fillStyle = z.cor;
        for (let i = 0; i < 5; i++) {
            const a = (i / 5) * TAU + Game.tempo * 1.4 + z.x;
            const d = z.raio * (0.25 + 0.45 * hash2(Math.floor(z.x) + i, i));
            const alt = 5 + 5 * Math.sin(Game.tempo * 11 + i * 2);
            g.fillRect(z.x + Math.cos(a) * d - 3, z.y + Math.sin(a) * d * 0.6 - alt, 6, alt);
        }
        g.globalAlpha = 1;
    }
}

function desenharColetaveis(g, x0, y0, x1, y1) {
    for (const c of Game.coletaveis) {
        if (c.x < x0 || c.x > x1 || c.y < y0 || c.y > y1) continue;
        const spr = SPR[c.sprite];
        if (!spr) continue;
        const bob = Math.sin(c.t * 3.5) * 3;
        if (c.tipo === 'gema') desenharBrilho(g, c.x, c.y + bob, 16, 'rgba(140,200,255,0.5)', 0.5);
        if (c.tipo === 'bau') desenharBrilho(g, c.x, c.y + bob, 30, 'rgba(255,210,120,0.6)', 0.6);
        g.drawImage(spr.dir, Math.round(c.x - spr.w / 2), Math.round(c.y - spr.h / 2 + bob));
    }
}

function desenharInimigo(g, e) {
    const spr = SPR[e.sprite];
    if (!spr) return;
    const w = spr.w * e.escala, h = spr.h * e.escala;
    const bob = Math.sin(Game.tempo * 8 + e.id) * (e.ia === 'ondulado' || e.ia === 'fantasma' ? 4 : 2);
    const px = Math.round(e.x - w / 2);
    const py = Math.round(e.y - h + bob);

    desenharSombra(g, e.x, e.y, w * 0.32, h * 0.11, 0.3);

    if (e.elite) desenharBrilho(g, e.x, e.y - h * 0.4, w * 0.9, 'rgba(255,120,60,0.45)', 0.55);
    if (e.chefe) desenharBrilho(g, e.x, e.y - h * 0.4, w * 1.0, 'rgba(255,60,60,0.4)', 0.6);

    g.globalAlpha = e.ia === 'fantasma' ? 0.75 : 1;
    const img = e.flash > 0
        ? (e.olhar >= 0 ? spr.flash : spr.flashEsq)
        : (e.olhar >= 0 ? spr.dir : spr.esq);
    if (e.escala === 1) g.drawImage(img, px, py);      // sem redimensionar: bem mais rápido
    else g.drawImage(img, px, py, w, h);
    g.globalAlpha = 1;

    // barra de vida dos grandões
    if ((e.elite || e.chefe) && e.vida < e.vidaMax) {
        const bw = w * 0.9, bh = 4;
        g.fillStyle = '#000a'; g.fillRect(e.x - bw / 2, py - 8, bw, bh);
        g.fillStyle = e.chefe ? '#e04a4a' : '#ff9b3a';
        g.fillRect(e.x - bw / 2, py - 8, bw * clamp(e.vida / e.vidaMax, 0, 1), bh);
    }
}

function desenharJogador(g) {
    const p = Game.jogador;
    const spr = SPR[p.sprite];
    const bob = Math.sin(p.passo * 2) * 2 * p.andando;
    const inclina = Math.sin(p.passo) * 0.06 * p.andando;
    const px = p.x, py = p.y - spr.h + bob;

    // um brilho discreto embaixo do herói: no meio da horda,
    // sem isso é fácil perder de vista quem é você
    desenharBrilho(g, p.x, p.y - 4, 30, 'rgba(255,228,150,0.34)', 0.55);
    desenharSombra(g, p.x, p.y, spr.w * 0.33, spr.h * 0.11, 0.35);

    g.save();
    g.translate(px, p.y);
    g.rotate(inclina);
    g.translate(-px, -p.y);
    if (p.invuln > 0 && Math.floor(Game.tempo * 20) % 2 === 0) g.globalAlpha = 0.45;
    g.drawImage(p.olhar >= 0 ? spr.dir : spr.esq, Math.round(px - spr.w / 2), Math.round(py));
    g.globalAlpha = 1;
    g.restore();
}

function desenharAreas(g) {
    for (const a of Game.areas) {
        const prog = 1 - a.vida / a.vidaMax;
        if (a.tipo === 'arco') desenharArco(g, a.x, a.y, a.raio, a.ang, a.abertura, prog, a.cor);
        else desenharBrilho(g, a.x, a.y, a.raio, a.cor, (1 - prog) * 0.4);
    }
}

function desenharProjeteis(g) {
    for (const b of Game.projeteis) {
        g.save();
        g.translate(b.x, b.y);
        switch (b.tipo) {
            case 'flecha': {
                g.rotate(Math.atan2(b.vy, b.vx));
                g.fillStyle = b.cor;
                g.fillRect(-10, -2, 20, 4);
                g.fillStyle = '#8a7a55';
                g.fillRect(-12, -3, 5, 6);
                break;
            }
            case 'faca': {
                g.rotate(Math.atan2(b.vy, b.vx));
                g.fillStyle = b.cor;
                g.fillRect(-7, -1.5, 14, 3);
                break;
            }
            case 'machado': {
                g.rotate(b.rot);
                g.fillStyle = '#6b4a28'; g.fillRect(-2, -12, 4, 24);
                g.fillStyle = b.cor;
                g.beginPath();
                g.moveTo(-2, -12); g.lineTo(-14, -6); g.lineTo(-14, 4); g.lineTo(-2, 8);
                g.lineTo(2, 8); g.lineTo(14, 4); g.lineTo(14, -6); g.lineTo(2, -12);
                g.closePath(); g.fill();
                break;
            }
            case 'martelo': {
                g.rotate(b.rot);
                g.fillStyle = '#6b4a28'; g.fillRect(-2.5, -6, 5, 22);
                g.fillStyle = b.cor; g.fillRect(-13, -14, 26, 14);
                g.strokeStyle = '#8a6a20'; g.lineWidth = 2; g.strokeRect(-13, -14, 26, 14);
                break;
            }
            case 'bola':
            default: {
                desenharBrilho(g, 0, 0, b.raio * 2.6, 'rgba(255,150,60,0.75)', 0.75);
                g.fillStyle = b.cor;
                g.beginPath(); g.arc(0, 0, b.raio, 0, TAU); g.fill();
                g.fillStyle = '#ffe9a8';
                g.beginPath(); g.arc(0, 0, b.raio * 0.45, 0, TAU); g.fill();
                break;
            }
        }
        g.restore();
    }

    for (const b of Game.projInimigos) {
        desenharBrilho(g, b.x, b.y, b.raio * 3, 'rgba(255,80,80,0.55)', 0.6);
        g.fillStyle = b.cor;
        g.beginPath(); g.arc(b.x, b.y, b.raio, 0, TAU); g.fill();
    }
}

function desenharEfeitos(g) {
    for (const f of Game.efeitos) {
        const t = 1 - f.vida / f.vidaMax;
        switch (f.tipo) {
            case 'particula':
                g.globalAlpha = 1 - t;
                g.fillStyle = f.cor;
                g.fillRect(f.x - f.raio / 2, f.y - f.raio / 2, f.raio, f.raio);
                g.globalAlpha = 1;
                break;
            case 'aneis':
                g.globalAlpha = (1 - t) * 0.8;
                g.strokeStyle = f.cor; g.lineWidth = 4;
                g.beginPath(); g.arc(f.x, f.y, f.raio * (0.6 + t * 0.5), 0, TAU); g.stroke();
                g.globalAlpha = 1;
                break;
            case 'explosao':
                desenharBrilho(g, f.x, f.y, f.raio * (0.5 + t), f.cor, (1 - t) * 0.85);
                g.globalAlpha = (1 - t) * 0.9;
                g.strokeStyle = '#fff'; g.lineWidth = 3;
                g.beginPath(); g.arc(f.x, f.y, f.raio * (0.4 + t * 0.8), 0, TAU); g.stroke();
                g.globalAlpha = 1;
                break;
            case 'raio':
                desenharRaio(g, f.x, f.y, 420, f.semente, 1 - t);
                desenharBrilho(g, f.x, f.y, f.raio * 1.4, 'rgba(200,230,255,0.8)', 1 - t);
                break;
            case 'meteoro': {
                const alt = 460 * (1 - t);
                g.globalAlpha = 0.9;
                g.fillStyle = '#ff8b3a';
                g.beginPath(); g.arc(f.x + alt * 0.3, f.y - alt, 12, 0, TAU); g.fill();
                desenharBrilho(g, f.x + alt * 0.3, f.y - alt, 34, 'rgba(255,140,60,0.8)', 0.8);
                g.globalAlpha = 0.5;
                g.strokeStyle = '#ff5a2a'; g.lineWidth = 3;
                g.beginPath(); g.ellipse(f.x, f.y, f.raio * 0.9, f.raio * 0.55, 0, 0, TAU); g.stroke();
                g.globalAlpha = 1;
                break;
            }
            case 'aviso':
                g.globalAlpha = 0.35 + 0.3 * Math.sin(Game.tempo * 22);
                g.strokeStyle = f.cor; g.lineWidth = 4;
                g.beginPath(); g.ellipse(f.x, f.y, f.raio, f.raio * 0.62, 0, 0, TAU); g.stroke();
                g.globalAlpha = 1;
                break;
            case 'faisca':
                g.globalAlpha = 1 - t;
                g.fillStyle = f.cor;
                g.beginPath(); g.arc(f.x, f.y - 20, f.raio * (1 - t), 0, TAU); g.fill();
                g.globalAlpha = 1;
                break;
        }
    }
}

function desenharTextos(g) {
    g.textAlign = 'center';
    for (const t of Game.textos) {
        const a = clamp(t.vida / t.vidaMax * 1.6, 0, 1);
        g.globalAlpha = a;
        g.font = 'bold ' + t.tam + 'px "Trebuchet MS", system-ui, sans-serif';
        g.lineWidth = 3; g.strokeStyle = 'rgba(0,0,0,0.85)';
        g.strokeText(t.txt, t.x, t.y);
        g.fillStyle = t.cor;
        g.fillText(t.txt, t.x, t.y);
    }
    g.globalAlpha = 1;
    g.textAlign = 'left';
}

let _vinheta = null, _vinhetaTam = '';
function desenharVinheta(g) {
    const chave = Game.w + 'x' + Game.h;
    if (chave !== _vinhetaTam) {
        // desenha a vinheta uma única vez numa imagem: repetir o gradiente
        // a cada quadro custa caro
        _vinhetaTam = chave;
        _vinheta = novoCanvas(Game.w, Game.h);
        const vg = _vinheta.getContext('2d');
        const grad = vg.createRadialGradient(Game.w / 2, Game.h / 2, Math.min(Game.w, Game.h) * 0.35,
            Game.w / 2, Game.h / 2, Math.max(Game.w, Game.h) * 0.75);
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        grad.addColorStop(1, 'rgba(0,0,0,0.55)');
        vg.fillStyle = grad;
        vg.fillRect(0, 0, Game.w, Game.h);
    }
    g.drawImage(_vinheta, 0, 0);
}

function desenharJoystick(g) {
    const j = Game.joystick;
    g.globalAlpha = 0.28;
    g.strokeStyle = '#ffe9a8'; g.lineWidth = 3;
    g.beginPath(); g.arc(j.bx, j.by, 62, 0, TAU); g.stroke();
    let dx = j.x - j.bx, dy = j.y - j.by;
    const m = Math.hypot(dx, dy);
    if (m > 62) { dx = dx / m * 62; dy = dy / m * 62; }
    g.fillStyle = '#ffe9a8';
    g.beginPath(); g.arc(j.bx + dx, j.by + dy, 26, 0, TAU); g.fill();
    g.globalAlpha = 1;
}

/** Fundo animado das telas de menu. */
function desenharFundoMenu(g) {
    const t = performance.now() / 1000;
    g.save();
    g.fillStyle = '#0f0d16';
    g.fillRect(0, 0, Game.w, Game.h);
    for (let i = 0; i < 60; i++) {
        const x = (hash2(i, 1) * Game.w + t * (8 + hash2(i, 2) * 22)) % (Game.w + 60) - 30;
        const y = (hash2(i, 3) * Game.h + Math.sin(t * 0.5 + i) * 22);
        g.globalAlpha = 0.10 + hash2(i, 4) * 0.16;
        g.fillStyle = '#c9a84a';
        g.fillRect(x, y, 3, 3);
    }
    g.globalAlpha = 1;
    g.restore();
}

/* =========================================================
   HUD
   ========================================================= */
function atualizarHUD() {
    const p = Game.jogador;
    if (!p) return;

    document.getElementById('tempo').textContent = formatTime(Game.tempo);
    document.getElementById('abates').textContent = formatNum(Game.abates);
    document.getElementById('ouro-hud').textContent = formatNum(Game.ouro);
    document.getElementById('nivel-num').textContent = p.nivel;

    const barraVida = document.getElementById('vida-preenche');
    barraVida.style.width = clamp(p.vida / p.vidaMax, 0, 1) * 100 + '%';
    document.getElementById('vida-texto').textContent = Math.max(0, Math.ceil(p.vida)) + ' / ' + Math.round(p.vidaMax);

    document.getElementById('xp-preenche').style.width = clamp(p.xp / p.xpProx, 0, 1) * 100 + '%';

    if (Game.chefeAtivo) {
        document.getElementById('chefe-preenche').style.width =
            clamp(Game.chefeAtivo.vida / Game.chefeAtivo.vidaMax, 0, 1) * 100 + '%';
    }

    if (Game.hudSujo) {
        Game.hudSujo = false;
        const cx = document.getElementById('itens-hud');
        cx.innerHTML = '';
        for (const a of p.armas) {
            const def = ARMAS[a.id];
            cx.appendChild(iconeItem(def.icone, a.nivel, def.max, def.evoluida));
        }
        for (const id in p.passivos) {
            const def = PASSIVOS[id];
            cx.appendChild(iconeItem(def.icone, p.passivos[id], def.max, false, true));
        }
    }
}

function iconeItem(icone, nivel, max, evo, passivo) {
    const d = document.createElement('div');
    d.className = 'item-hud' + (evo ? ' evoluido' : '') + (passivo ? ' passivo' : '');
    d.innerHTML = '<span class="ico">' + icone + '</span><span class="niv">' +
        (nivel >= max ? 'MAX' : nivel) + '</span>';
    return d;
}

function mostrarAviso(texto, dur) {
    const el = document.getElementById('aviso');
    el.textContent = texto;
    el.classList.remove('escondido');
    el.classList.remove('anima');
    void el.offsetWidth;
    el.classList.add('anima');
    clearTimeout(mostrarAviso.t);
    mostrarAviso.t = setTimeout(() => el.classList.add('escondido'), (dur || 2) * 1000);
}

/* =========================================================
   TELAS / MENUS
   ========================================================= */
function mostrarTela(id) {
    document.querySelectorAll('.tela-ui').forEach(t => t.classList.add('escondido'));
    if (id) document.getElementById(id).classList.remove('escondido');
}

function configurarMenus() {
    const clique = (id, fn) => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('click', () => { Som.iniciar(); Som.efeito('ui'); fn(); });
    };

    clique('btn-jogar', () => { montarSelecaoHerois(); mostrarTela('tela-selecao'); });
    clique('btn-loja', () => { montarLoja(); mostrarTela('tela-loja'); });
    clique('btn-ajuda', () => mostrarTela('tela-ajuda'));
    clique('btn-voltar-selecao', () => { atualizarMenuPrincipal(); mostrarTela('tela-menu'); });
    clique('btn-voltar-loja', () => { atualizarMenuPrincipal(); mostrarTela('tela-menu'); });
    clique('btn-voltar-ajuda', () => mostrarTela('tela-menu'));
    clique('btn-continuar', () => alternarPausa());
    clique('btn-sair', () => voltarAoMenu());
    clique('btn-reiniciar', () => iniciarPartida(Game.ultimoHeroi, Game.dificuldade));
    clique('btn-menu-fim', () => voltarAoMenu());
    clique('btn-menu-vitoria', () => voltarAoMenu());
    clique('btn-reiniciar-vitoria', () => iniciarPartida(Game.ultimoHeroi, Game.dificuldade));

    document.querySelectorAll('.btn-dificuldade').forEach(b => {
        b.addEventListener('click', () => {
            Som.efeito('ui');
            document.querySelectorAll('.btn-dificuldade').forEach(o => o.classList.remove('ativo'));
            b.classList.add('ativo');
            Game.dificuldade = b.dataset.dif;
        });
    });

    const botoesSom = ['btn-som', 'btn-som2'].map(i => document.getElementById(i)).filter(Boolean);
    const botoesMusica = ['btn-musica', 'btn-musica2'].map(i => document.getElementById(i)).filter(Boolean);
    const sincronizarAudio = () => {
        botoesSom.forEach(b => b.textContent = '🔊 Efeitos: ' + (Som.ligado ? 'ligado' : 'desligado'));
        botoesMusica.forEach(b => b.textContent = '🎵 Música: ' + (Som.musicaLigada ? 'ligada' : 'desligada'));
    };
    botoesSom.forEach(b => b.addEventListener('click', () => {
        Som.definirSom(!Som.ligado);
        Save.data.som = Som.ligado; Save.save();
        sincronizarAudio(); Som.efeito('ui');
    }));
    botoesMusica.forEach(b => b.addEventListener('click', () => {
        Som.iniciar();
        Som.definirMusica(!Som.musicaLigada);
        Save.data.musica = Som.musicaLigada; Save.save();
        sincronizarAudio();
    }));
    sincronizarAudio();

    const resetBtn = document.getElementById('btn-apagar');
    if (resetBtn) resetBtn.addEventListener('click', () => {
        if (confirm('Apagar todo o progresso salvo (ouro e melhorias)?')) {
            Save.reset(); montarLoja(); atualizarMenuPrincipal(); montarSelecaoHerois();
        }
    });
}

function atualizarMenuPrincipal() {
    document.getElementById('ouro-menu').textContent = formatNum(Save.data.ouro);
    document.getElementById('recorde-tempo').textContent = formatTime(Save.data.melhorTempo || 0);
    document.getElementById('recorde-abates').textContent = formatNum(Save.data.melhorAbates || 0);
    document.getElementById('recorde-vitorias').textContent = Save.data.vitorias || 0;
}

/* ----------------------- seleção de herói ----------------------- */
function montarSelecaoHerois() {
    const cx = document.getElementById('lista-herois');
    cx.innerHTML = '';
    document.getElementById('ouro-selecao').textContent = formatNum(Save.data.ouro);

    for (const h of HEROIS) {
        const bloqueado = !Save.data.desbloqueados.includes(h.id);
        const card = document.createElement('button');
        card.className = 'card-heroi' + (bloqueado ? ' bloqueado' : '');
        card.innerHTML = `
            <div class="heroi-icone">${bloqueado ? '🔒' : h.icone}</div>
            <div class="heroi-nome">${h.nome}</div>
            <div class="heroi-desc">${h.desc}</div>
            <div class="heroi-detalhe">${h.detalhe}</div>
            <div class="heroi-arma">Arma inicial: <b>${ARMAS[h.arma].nome}</b></div>
            ${bloqueado ? `<div class="heroi-preco">Desbloquear por ${h.preco} 🪙</div>` : ''}
        `;
        card.addEventListener('click', () => {
            Som.iniciar();
            if (bloqueado) {
                if (Save.data.ouro >= h.preco) {
                    Save.data.ouro -= h.preco;
                    Save.data.desbloqueados.push(h.id);
                    Save.save();
                    Som.efeito('compra');
                    montarSelecaoHerois();
                } else {
                    Som.efeito('erro');
                    mostrarAviso('Ouro insuficiente!', 1.5);
                }
                return;
            }
            Som.efeito('ui');
            Game.ultimoHeroi = h.id;
            iniciarPartida(h.id, Game.dificuldade);
        });
        cx.appendChild(card);
    }

    document.querySelectorAll('.btn-dificuldade').forEach(b => {
        b.classList.toggle('ativo', b.dataset.dif === Game.dificuldade);
    });
}

/* ----------------------- loja ----------------------- */
function montarLoja() {
    const cx = document.getElementById('lista-loja');
    cx.innerHTML = '';
    document.getElementById('ouro-loja').textContent = formatNum(Save.data.ouro);

    for (const item of LOJA) {
        const nivel = Save.nivelMelhoria(item.id);
        const maximo = nivel >= item.max;
        const custo = item.custo(nivel);
        const pode = !maximo && Save.data.ouro >= custo;

        const b = document.createElement('button');
        b.className = 'card-loja' + (maximo ? ' maximo' : '') + (pode ? '' : ' sem-ouro');
        b.innerHTML = `
            <div class="loja-icone">${item.icone}</div>
            <div class="loja-info">
                <div class="loja-nome">${item.nome} <span class="loja-nivel">${nivel}/${item.max}</span></div>
                <div class="loja-desc">${item.desc}</div>
            </div>
            <div class="loja-custo">${maximo ? 'MÁX' : custo + ' 🪙'}</div>
        `;
        b.addEventListener('click', () => {
            Som.iniciar();
            if (maximo) return;
            if (Save.data.ouro < custo) { Som.efeito('erro'); return; }
            Save.data.ouro -= custo;
            Save.data.melhorias[item.id] = nivel + 1;
            Save.save();
            Som.efeito('compra');
            montarLoja();
        });
        cx.appendChild(b);
    }
}

/* ----------------------- subir de nível ----------------------- */
function gerarOpcoes(qtd) {
    const p = Game.jogador;
    const opcoes = [];

    // evoluções têm prioridade
    for (const arma of p.armas) {
        const def = ARMAS[arma.id];
        if (def.evolucao && arma.nivel >= def.max) {
            const pas = def.evolucao.passivo;
            if ((p.passivos[pas] || 0) >= PASSIVOS[pas].max) {
                const evo = ARMAS[def.evolucao.arma];
                opcoes.push({
                    tipo: 'evolucao', id: def.evolucao.arma, de: arma.id,
                    titulo: evo.nome, icone: evo.icone,
                    sub: 'EVOLUÇÃO', desc: evo.desc, evo: true
                });
            }
        }
    }

    const pool = [];
    for (const arma of p.armas) {
        const def = ARMAS[arma.id];
        if (arma.nivel < def.max) {
            pool.push({
                tipo: 'arma', id: arma.id, titulo: def.nome, icone: def.icone,
                sub: 'Nível ' + (arma.nivel + 1), desc: def.proximo(arma.nivel)
            });
        }
    }
    for (const id in p.passivos) {
        const def = PASSIVOS[id];
        if (p.passivos[id] < def.max) {
            pool.push({
                tipo: 'passivo', id, titulo: def.nome, icone: def.icone,
                sub: 'Nível ' + (p.passivos[id] + 1), desc: def.porNivel
            });
        }
    }
    if (p.armas.length < 6) {
        for (const id in ARMAS) {
            const def = ARMAS[id];
            if (def.oculta || p.armas.find(a => a.id === id)) continue;
            pool.push({ tipo: 'novaArma', id, titulo: def.nome, icone: def.icone, sub: 'NOVA ARMA', desc: def.desc });
        }
    }
    if (Object.keys(p.passivos).length < 6) {
        for (const id in PASSIVOS) {
            if (p.passivos[id]) continue;
            const def = PASSIVOS[id];
            pool.push({ tipo: 'novoPassivo', id, titulo: def.nome, icone: def.icone, sub: 'NOVO ITEM', desc: def.desc });
        }
    }

    for (const o of shuffled(pool)) {
        if (opcoes.length >= qtd) break;
        opcoes.push(o);
    }

    // quando não há mais nada para melhorar, o nível ainda vale a pena
    while (opcoes.length < qtd) {
        opcoes.push({
            tipo: 'bonus', id: 'cura', titulo: 'Bênção Antiga', icone: '💖',
            sub: 'RECOMPENSA', desc: 'Cura total, +6% de dano e 80 de ouro'
        });
        break;
    }
    return opcoes;
}

function abrirTelaNivel() {
    Game.estado = 'nivel';
    Som.efeito('nivel');
    const qtd = 3 + (Math.random() < Game.jogador.sorte * 0.6 ? 1 : 0);
    const opcoes = gerarOpcoes(qtd);
    const cx = document.getElementById('lista-nivel');
    cx.innerHTML = '';
    document.getElementById('nivel-titulo').textContent = 'NÍVEL ' + Game.jogador.nivel;

    for (const o of opcoes) {
        const b = document.createElement('button');
        b.className = 'card-nivel' + (o.evo ? ' evolucao' : '');
        b.innerHTML = `
            <div class="nivel-icone">${o.icone}</div>
            <div class="nivel-sub">${o.sub}</div>
            <div class="nivel-nome">${o.titulo}</div>
            <div class="nivel-desc">${o.desc}</div>
        `;
        b.addEventListener('click', () => {
            Som.efeito('ui');
            aplicarOpcao(o);
            fecharTelaNivel();
        });
        cx.appendChild(b);
    }
    mostrarTela('tela-nivel');
}

function fecharTelaNivel() {
    Game.filaNivel--;
    if (Game.filaNivel > 0) {
        abrirTelaNivel();
    } else {
        Game.filaNivel = 0;
        mostrarTela(null);
        Game.estado = 'jogando';
        Game.ultimoQuadro = performance.now();
    }
}

function aplicarOpcao(o) {
    const p = Game.jogador;
    switch (o.tipo) {
        case 'novaArma':
            darArma(o.id);
            break;
        case 'arma': {
            const arma = p.armas.find(a => a.id === o.id);
            if (arma) arma.nivel = Math.min(ARMAS[o.id].max, arma.nivel + 1);
            break;
        }
        case 'evolucao': {
            const idx = p.armas.findIndex(a => a.id === o.de);
            if (idx >= 0) p.armas[idx] = { id: o.id, nivel: 1, timer: 0 };
            Som.efeito('vitoria');
            mostrarAviso('EVOLUÇÃO: ' + ARMAS[o.id].nome, 2.4);
            break;
        }
        case 'novoPassivo':
        case 'passivo':
            p.passivos[o.id] = (p.passivos[o.id] || 0) + 1;
            aplicarPassivo(o.id);
            break;
        case 'bonus':
            curarJogador(p.vidaMax);
            p.danoMul += 0.06;
            Game.ouro += 80;
            break;
    }
    Game.hudSujo = true;
}

function aplicarPassivo(id) {
    const p = Game.jogador;
    switch (id) {
        case 'anel': p.danoMul += 0.12; break;
        case 'ampulheta': p.recargaMul = Math.max(0.35, p.recargaMul - 0.08); break;
        case 'botas': p.velocidade *= 1.08; break;
        case 'coracao': p.vidaMax += 20; curarJogador(20); break;
        case 'armadura': p.armadura += 2; break;
        case 'amuleto': p.imaRaio *= 1.3; break;
        case 'tomo': p.areaMul += 0.12; break;
        case 'trevo': p.sorte += 0.08; break;
        case 'relicario': p.regen += 0.5; break;
    }
}

/* ----------------------- pausa / fim ----------------------- */
function alternarPausa() {
    if (Game.estado === 'jogando') {
        Game.estado = 'pausa';
        mostrarTela('tela-pausa');
        montarResumoPausa();
    } else if (Game.estado === 'pausa') {
        Game.estado = 'jogando';
        mostrarTela(null);
        Game.ultimoQuadro = performance.now();
    }
}

function montarResumoPausa() {
    const p = Game.jogador;
    const cx = document.getElementById('resumo-pausa');
    let html = `<div class="linha-resumo"><span>Tempo</span><b>${formatTime(Game.tempo)}</b></div>
                <div class="linha-resumo"><span>Nível</span><b>${p.nivel}</b></div>
                <div class="linha-resumo"><span>Abates</span><b>${Game.abates}</b></div>
                <div class="linha-resumo"><span>Ouro</span><b>${Game.ouro}</b></div>
                <div class="linha-resumo"><span>Dano</span><b>${Math.round(p.danoMul * 100)}%</b></div>
                <div class="linha-resumo"><span>Armadura</span><b>${p.armadura}</b></div>`;
    cx.innerHTML = html;
}

function finalizarPartida() {
    Som.pararMusica();
    document.getElementById('hud').classList.add('escondido');
    document.getElementById('barra-chefe').classList.add('escondido');

    Save.data.ouro += Game.ouro;
    if (Game.tempo > (Save.data.melhorTempo || 0)) Save.data.melhorTempo = Game.tempo;
    if (Game.abates > (Save.data.melhorAbates || 0)) Save.data.melhorAbates = Game.abates;
    Save.save();
}

function perder() {
    if (Game.estado === 'fim') return;
    Game.estado = 'fim';
    finalizarPartida();
    Som.efeito('gameover');
    document.getElementById('fim-tempo').textContent = formatTime(Game.tempo);
    document.getElementById('fim-nivel').textContent = Game.jogador.nivel;
    document.getElementById('fim-abates').textContent = Game.abates;
    document.getElementById('fim-ouro').textContent = Game.ouro;
    mostrarTela('tela-fim');
}

function vencer() {
    if (Game.estado === 'vitoria') return;
    Game.estado = 'vitoria';
    Game.ouro += 500;
    Save.data.vitorias = (Save.data.vitorias || 0) + 1;
    finalizarPartida();
    Som.efeito('vitoria');
    document.getElementById('vit-tempo').textContent = formatTime(Game.tempo);
    document.getElementById('vit-nivel').textContent = Game.jogador.nivel;
    document.getElementById('vit-abates').textContent = Game.abates;
    document.getElementById('vit-ouro').textContent = Game.ouro;
    mostrarTela('tela-vitoria');
}

function voltarAoMenu() {
    if (Game.estado === 'jogando' || Game.estado === 'pausa' || Game.estado === 'nivel') finalizarPartida();
    Game.estado = 'menu';
    Game.jogador = null;
    Game.inimigos = []; Game.projeteis = []; Game.projInimigos = [];
    Game.areas = []; Game.zonas = []; Game.coletaveis = []; Game.efeitos = []; Game.textos = [];
    Game.chefeAtivo = null;
    Som.pararMusica();
    document.getElementById('hud').classList.add('escondido');
    document.getElementById('barra-chefe').classList.add('escondido');
    atualizarMenuPrincipal();
    montarSelecaoHerois();
    mostrarTela('tela-menu');
}

window.addEventListener('load', iniciar);
