'use strict';
// =====================================================================
//  CLIMA DO CLUBE (carreira de técnico)
//  🎙️ Coletivas antes de clássicos, finais e jogos grandes. Cada clube da IA
//     tem o seu técnico (nome do país, estilo próprio) e você guarda o
//     retrospecto contra cada um; ele responde pelos jornais.
//  📣 Humor da torcida (0-100): resultados, clássicos, preço do ingresso,
//     reforços e venda de ídolos. Mexe na força em casa, na bilheteria e na
//     diretoria (faixas, protestos, festa no aeroporto, "fora, professor!").
//  ⏰ Último dia da janela: 1 a 3 negócios de última hora, com relógio.
//  🤝 Química do elenco: duplas entrosadas (defesa, meio e ataque) e brigas.
//  🧳 Pré-temporada: excursão (dinheiro e fama, mais cansaço) ou treino em casa.
//  🎯 Objetivos extras da diretoria, com progresso, prêmio e cobrança.
//
//  Nada disso abre janela no avanço rápido (⏭️ / ⏩ / "simular os jogos"):
//  lá tudo vira linha no diário (e o ⏭️ para uma semana antes do último dia
//  da janela, para você jogar esse dia ao vivo).
//
//  Estado (criado na primeira vez que precisa: saves antigos abrem normal)
//    t.tecnico = { id, nome, bnd, est, idade }   técnico de cada clube da IA
//    s.car.clima = { tid, torc, preco, evt[], ultEvt, ult[], riv{}, col, cols[],
//                    ultCol, provRival, qm: { pares{ 'a-b': { n, s } }, briga,
//                    ultBriga, paz }, pre, obj, objAnt, dl, dlHist[], el0[],
//                    base0[], idol[], casa{} }
//    p.cria = id do clube cuja base revelou o jogador
//  Ganchos: Tecnico (abas, antesDaSemana, inicio, financas, semana, posJogo,
//  antesFimTemporada, resumoTemporada), Partida.bonusTime, Mot.tela,
//  Comissao.pendencias / resultadoSemanal e TelaPartida.preJogo.
// =====================================================================

// Jeito de cada técnico rival (muda a resposta nos jornais)
const ESTILOS_TEC = {
    cavalheiro: { nome: 'Cavalheiro', icone: '🎩', peso: 3 },
    estrategista: { nome: 'Estrategista', icone: '🧠', peso: 3 },
    provocador: { nome: 'Provocador', icone: '😈', peso: 2 },
    boleiro: { nome: 'Boleiro', icone: '😄', peso: 2 },
    pavio: { nome: 'Pavio curto', icone: '🌋', peso: 1.5 },
};

// Preço do ingresso: multiplica o preço e o público da bilheteria; humor = efeito por semana
const PRECOS_INGRESSO = {
    barato: { nome: 'Barato', icone: '🎟️', preco: 0.7, publico: 1.18, humor: 0.7, desc: 'Estádio cheio e torcida feliz, mas a bilheteria rende menos.' },
    normal: { nome: 'Normal', icone: '🎫', preco: 1, publico: 1, humor: 0, desc: 'O preço de sempre: ninguém reclama, ninguém comemora.' },
    caro: { nome: 'Caro', icone: '💎', preco: 1.45, publico: 0.8, humor: -0.9, desc: 'Bilheteria bem maior, mas a torcida reclama toda semana.' },
};
const PARTE_BILHETERIA = 0.35;   // parte da receita semanal que vem dos ingressos

// Coletiva antes de jogo grande
const COLETIVA_OPS = [
    { k: 'respeitar', txt: '🤝 Respeitar o adversário', curto: 'respeitou o adversário' },
    { k: 'provocar', txt: '😈 Provocar o técnico rival', curto: 'provocou o técnico rival' },
    { k: 'arbitragem', txt: '🧑‍⚖️ Pressionar a arbitragem', curto: 'pressionou a arbitragem' },
    { k: 'blindar', txt: '🛡️ Blindar o elenco', curto: 'blindou o elenco' },
];
const RESPOSTAS_TEC = {
    respeitar: {
        cavalheiro: 'Respeito é recíproco. Que vença o melhor.', estrategista: 'Elogio não ganha jogo. Estamos preparados.',
        provocador: 'Respeito? Eles estão é com medo da gente.', boleiro: 'Gente fina, o professor! Mas em campo vai ser pegado, hein?',
        pavio: 'Não preciso do respeito de ninguém. Preciso dos três pontos.',
    },
    provocar: {
        cavalheiro: 'Prefiro responder dentro de campo.', estrategista: 'Ele fala, eu trabalho. Vamos ver quem ri por último.',
        provocador: 'Fala muito para quem ainda não ganhou nada!', boleiro: 'Ih, o homem tá nervoso! Vai ter troco no gramado.',
        pavio: 'Ele vai engolir cada palavra!',
    },
    arbitragem: {
        cavalheiro: 'Confio na arbitragem. Pressão não é o nosso estilo.', estrategista: 'Quem pressiona o árbitro antes do jogo já está com medo.',
        provocador: 'Já está preparando a desculpa para a derrota?', boleiro: 'Chorar antes do jogo é novidade para mim!',
        pavio: 'Isso é choro! A gente resolve na bola.',
    },
    blindar: { provocador: 'Blindar o elenco? Deve estar rachado por dentro...', pavio: 'Problema deles. Nós estamos prontos.' },
};
const PROVOCACOES_RIVAL = [
    'Quem tem camisa entra em campo e decide. O resto é conversa.', 'Eles têm medo de nós. E têm motivo.',
    'Esse técnico ainda tem muito o que aprender.', 'Vamos calar o estádio deles.', 'Jogo grande se ganha na raça, e raça é com a gente.',
];
const FAIXAS_TORCIDA = ['Professor, você é o cara!', 'Esse time tem a nossa cara!', 'Ninguém segura este elenco!', 'Obrigado, professor!', 'Vamos juntos até o título!'];

// Pré-temporada. din = semanas de receita; b = bônus/ônus de força nas primeiras "sem" semanas
const PRETEMPORADA = {
    europa: { nome: 'Excursão pela Europa', icone: '🇪🇺', din: 4, fama: 2, torc: 2, seg: 0.04, cond: -10, b: -0.3, sem: 2, desc: 'Amistosos contra gigantes: dinheiro, fama e vitrine. Volta um pouco cansado.' },
    eua: { nome: 'Excursão pelos EUA', icone: '🇺🇸', din: 5, fama: 2, torc: 1, seg: 0.07, cond: -12, b: -0.4, sem: 2, desc: 'Torneio de verão com estádios lotados e muitos patrocinadores.' },
    asia: { nome: 'Excursão pela Ásia', icone: '🌏', din: 6.5, fama: 3, torc: 1, seg: 0.12, cond: -18, b: -0.6, sem: 3, desc: 'A que mais paga e mais dá seguidores, mas o fuso horário derruba o elenco.' },
    interior: { nome: 'Amistosos pelo interior', icone: '🚌', din: 2.2, fama: 0, torc: 4, seg: 0, cond: -6, b: -0.15, sem: 2, desc: 'Giro de amistosos perto de casa: um dinheiro extra e a torcida do interior adora.' },
    casa: { nome: 'Treino em casa', icone: '🏠', din: 0, fama: 0, torc: 1, seg: 0, cond: 12, b: 0.35, sem: 4, quimica: 5, desc: 'Sem viagem: físico em dia, titulares mais entrosados e o time começa voando.' },
};

// Duplas: jogos começando juntos -> nível e bônus (só a melhor dupla de cada setor em campo conta)
const NIVEIS_DUPLA = [
    { min: 10, nome: 'Entrosada', b: 0.15 },
    { min: 20, nome: 'Afinada', b: 0.3 },
    { min: 35, nome: 'Inseparável', b: 0.45 },
];
const SETORES_DUPLA = {
    def: { nome: 'Defesa', icone: '🧱' },
    mei: { nome: 'Meio-campo', icone: '🎯' },
    ata: { nome: 'Ataque', icone: '⚽' },
};
const PENA_BRIGA = 0.4;   // os dois brigados em campo juntos

// Objetivos extras da diretoria
const OBJETIVOS_DIR = {
    classico: { ic: '🔥', peso: 3 },
    copa: { ic: '🥇', peso: 2.5 },
    base: { ic: '🌱', peso: 1.5 },
    lucro: { ic: '💰', peso: 2 },
    artilheiro: { ic: '⚽', peso: 1.5 },
    torcida: { ic: '📣', peso: 1.5 },
};
const PREMIO_OBJ = { conf: 6, rep: 1.5 }, CASTIGO_OBJ = { conf: -5, rep: -1 };

const Clube = {
    // -----------------------------------------------------------------
    //  Básico
    // -----------------------------------------------------------------
    // ⏭️ / ⏩ ou "simular os jogos do meu time": nada de janela opcional
    rapido() {
        return (typeof Ritmo !== 'undefined' && Ritmo.rodando) || !!(Jogo.opcoes && Jogo.opcoes.simularJogos);
    },

    // aviso rápido; no meio do ⏭️ / ⏩ fica só no diário
    avisar(txt) {
        if (typeof Ritmo !== 'undefined' && Ritmo.rodando) return;
        UI.toast(txt);
    },

    num(v, sinal) {
        const r = Math.round(v * 100) / 100;
        return (sinal && r > 0 ? '+' : '') + String(r).replace('.', ',');
    },

    ativo(s) {
        return !!(s && s.modo === 'tecnico' && s.car && s.car.tid >= 0 && s.times[s.car.tid]);
    },

    estado(s) {
        const c = s.car;
        if (!c.clima) c.clima = { tid: null, riv: {}, cols: [] };
        const q = c.clima;
        q.riv = q.riv || {};
        q.cols = q.cols || [];
        q.dlHist = q.dlHist || [];
        if (q.tid !== c.tid) Clube.novoClube(s, q);
        return q;
    },

    // você chegou (ou saiu): o técnico que estava lá vai embora e o clube antigo contrata outro
    novoClube(s, q) {
        const antigo = q.tid != null && q.tid >= 0 ? s.times[q.tid] : null;
        if (antigo) antigo.tecnico = null;
        const t = s.car.tid >= 0 ? s.times[s.car.tid] : null;
        if (t) t.tecnico = null;
        q.tid = s.car.tid;
        // a torcida recebe o técnico novo com alguma expectativa (técnico famoso anima mais)
        q.torc = U.clamp(Math.round(50 + ((s.car.rep || 40) - 50) * 0.15 + U.int(-2, 6)), 35, 72);
        q.preco = 'normal';
        q.evt = [];
        q.ultEvt = -99;
        q.ult = [];
        q.qm = { pares: {}, briga: null, ultBriga: -99, paz: -99 };
        q.obj = null;
        q.dl = null;
        q.el0 = null;
        q.base0 = null;
        q.idol = null;
        q.casa = {};
        q.col = null;
        q.provRival = null;
        // quem já jogava junto antes de você chegar já tem algum entrosamento
        if (t) Clube.reforcarDuplas(s, t, q, null);
    },

    // técnico de um clube da IA (gerado na primeira vez)
    tecnico(s, t) {
        if (!t || t.selecao || Mundo.timeDoUsuario(s, t.id)) return null;
        if (!t.tecnico || !t.tecnico.nome) {
            const pais = Mundo.pais(t.pais);
            let cod = pais ? pais.nomes : 'br', bnd = pais ? pais.bandeira : '🏳️';
            if (U.chance(0.22)) {
                const outro = U.escolha(NOMES_LIGAS);
                if (outro !== cod) { cod = outro; bnd = BANDEIRA_NOMES_CM[outro] || bnd; }
            }
            const est = U.pesado(Object.keys(ESTILOS_TEC), k => ESTILOS_TEC[k].peso);
            t.tecnico = { id: s.seqJ++, nome: Nomes.gerar(cod, true), bnd, est, idade: U.int(36, 68) };
        }
        return t.tecnico;
    },

    nomeTec(tec) {
        const E = ESTILOS_TEC[tec.est] || ESTILOS_TEC.cavalheiro;
        return `${tec.bnd} <b>${U.esc(tec.nome)}</b> <span class="cinza">(${E.icone} ${E.nome})</span>`;
    },

    retrospecto(r) {
        if (!r || !(r.v + r.e + r.d)) return 'primeiro duelo';
        return `retrospecto <b>${r.v}V ${r.e}E ${r.d}D</b>`;
    },

    // a última semana de cada janela de transferências
    fimJanela: sem => JANELAS.some(j => j[1] === sem),

    // -----------------------------------------------------------------
    //  📣 Torcida
    // -----------------------------------------------------------------
    humor(v) {
        if (v >= 85) return { ic: '😍', nome: 'Apaixonada', cls: 'clb-h5' };
        if (v >= 68) return { ic: '😀', nome: 'Animada', cls: 'clb-h4' };
        if (v >= 50) return { ic: '🙂', nome: 'Tranquila', cls: 'clb-h3' };
        if (v >= 33) return { ic: '😐', nome: 'Desconfiada', cls: 'clb-h2' };
        if (v >= 18) return { ic: '😠', nome: 'Irritada', cls: 'clb-h1' };
        return { ic: '🤬', nome: 'Revoltada', cls: 'clb-h0' };
    },

    mudarTorcida(s, q, d) {
        q.torc = Math.round(U.clamp(q.torc + d, 0, 100) * 10) / 10;
        Conquistas.maximo(s, 'torcidaMax', Math.floor(q.torc));
        return d;
    },

    // força extra nos jogos em casa: de −0,6 (revoltada) a +0,6 (apaixonada)
    bonusCasa: q => (q.torc - 50) / 50 * 0.6,

    // ajuste semanal da bilheteria pelo preço do ingresso e pelo humor (pode ser negativo)
    extraBilheteria(s, q) {
        const P = PRECOS_INGRESSO[q.preco] || PRECOS_INGRESSO.normal;
        const publico = Math.min(1.25, P.publico * (0.85 + q.torc * 0.003));   // estádio lotado não cabe mais gente
        return (s.car.receita || 0) * PARTE_BILHETERIA * (P.preco * publico - 1);
    },

    // gancho em Comissao.resultadoSemanal (resultado do clube por semana)
    extraSemanal(s) {
        if (!Clube.ativo(s) || !s.car.clima || s.car.clima.tid !== s.car.tid) return 0;
        return Clube.extraBilheteria(s, s.car.clima);
    },

    evento(s, q, ic, txt, tipo, noticia) {
        q.evt.unshift({ ano: s.ano, sem: s.semana, ic, txt, tipo: tipo || '' });
        if (q.evt.length > 12) q.evt.length = 12;
        q.ultEvt = Mot.agora(s);
        Vida.log(s, `${ic} ${txt}`, tipo === 'bom' || tipo === 'ruim' ? tipo : '');
        if (noticia) Mundo.noticia(s, `${ic} ${noticia}`, 'clube');
        Clube.avisar(`${ic} ${txt}`);
    },

    // faixas, protestos, "fora, professor!" (no máximo um a cada 4 semanas)
    eventoTorcida(s, t, q) {
        if (Mot.agora(s) - q.ultEvt < 4) return;
        const ult = q.ult || [];
        const vits = ult.slice(-3).filter(x => x === 'V').length;
        const nome = U.esc(s.pessoa.nome.split(' ')[0]);
        if (q.torc <= 14 && ult[ult.length - 1] === 'D' && U.chance(0.55)) {
            s.car.conf = U.clamp(s.car.conf - 5, 0, 100);
            Vida.mudar(s, { felicidade: -3 });
            Clube.evento(s, q, '🗣️', `"Fora, ${nome}!" A torcida pede a sua cabeça no estádio. A diretoria ouviu (−5 de confiança).`, 'ruim', `Torcida do ${t.nome} pede a saída do técnico ${s.pessoa.nome}.`);
        } else if (q.torc <= 28 && U.chance(0.35)) {
            t.moral = U.clamp(t.moral - 4, 5, 99);
            s.car.conf = U.clamp(s.car.conf - 2, 0, 100);
            Clube.evento(s, q, '📢', 'Protesto da torcida na porta do CT. O elenco sentiu o golpe (−4 de moral, −2 de confiança da diretoria).', 'ruim', `Torcedores do ${t.nome} protestam no CT.`);
        } else if (q.torc >= 78 && vits >= 2 && U.chance(0.35)) {
            t.moral = U.clamp(t.moral + 3, 5, 99);
            Vida.mudar(s, { fama: 1 });
            Clube.evento(s, q, '🏳️', `Faixa da torcida no CT: "${U.escolha(FAIXAS_TORCIDA)}" (+3 de moral do elenco).`, 'bom');
        } else if (q.torc >= 62 && U.chance(0.05)) {
            t.moral = U.clamp(t.moral + 2, 5, 99);
            Clube.evento(s, q, '🎆', 'A torcida prepara um mosaico gigante e lota o treino aberto. Clima ótimo no clube!', 'bom', `Festa da torcida do ${t.nome} no treino aberto.`);
        }
    },

    // quem a torcida considera ídolo: os craques, o capitão, quem tem 3+ anos de casa e as crias da base
    idolos(s, t, q) {
        const el = Mundo.elenco(s, t).sort((a, b) => b.ovr - a.ovr);
        const ids = el.slice(0, 3).map(p => p.id);
        const add = id => { if (ids.indexOf(id) < 0) ids.push(id); };
        if (s.car.capitao != null && t.elenco.indexOf(s.car.capitao) >= 0) add(s.car.capitao);
        for (const p of el) {
            if ((q.casa[p.id] || 0) >= 3 && p.ovr >= t.rep - 4) add(p.id);
            if (p.cria === t.id && p.ovr >= t.rep - 2) add(p.id);
        }
        return ids;
    },

    // reforços, vendas de ídolos e garotos que subiram da base (compara com a semana passada)
    mudancasElenco(s, t, q) {
        const atual = t.elenco.slice();
        const base = (t.base || []).slice();
        if (q.el0) {
            const antes = new Set(q.el0), base0 = new Set(q.base0 || []), idol = new Set(q.idol || []);
            let d = 0, festa = 0;
            const chegaram = [], sairam = [], crias = [];
            for (const id of atual) {
                if (antes.has(id)) continue;
                const p = s.jog[id];
                if (!p) continue;
                if (base0.has(id)) { p.cria = t.id; crias.push(p); d += 1; continue; }
                if (p.ovr >= t.rep + 4) { chegaram.push(p); festa += p.ovr >= t.rep + 8 ? 6 : 4; }
            }
            for (const id of q.el0) {
                if (atual.indexOf(id) >= 0 || !idol.has(id)) continue;
                const p = s.jog[id];
                if (!p) continue;   // aposentou
                sairam.push(p);
                d -= p.tid >= 0 ? 8 : 5;
            }
            festa = Math.min(10, festa);
            d = U.clamp(d + festa, -14, 10);
            if (d) Clube.mudarTorcida(s, q, d);
            const nomes = l => l.slice(0, 2).map(p => U.esc(p.nome)).join(' e ');
            if (chegaram.length) Clube.evento(s, q, '🎉', `Torcida em festa com a chegada de ${nomes(chegaram)} (+${festa} de humor).`, 'bom');
            if (sairam.length) Clube.evento(s, q, '😡', `A torcida não engoliu a saída de ${nomes(sairam)}: ${sairam.length > 1 ? 'eram ídolos' : 'era ídolo'} do clube.`, 'ruim', `Torcida do ${t.nome} protesta contra a saída de ${sairam[0].nome}.`);
            if (crias.length && !chegaram.length && !sairam.length) Vida.log(s, `🌱 A torcida gosta de ver ${nomes(crias)}, cria da casa, no time de cima.`, 'bom');
        }
        q.el0 = atual;
        q.base0 = base;
        q.idol = Clube.idolos(s, t, q);
    },

    // -----------------------------------------------------------------
    //  🤝 Química do elenco
    // -----------------------------------------------------------------
    par: (a, b) => (a < b ? a + '-' + b : b + '-' + a),

    // setor de uma dupla pelas posições em que começaram jogando (null = não forma dupla)
    setorPar(sa, sb) {
        const ga = POS_GRUPO[sa], gb = POS_GRUPO[sb];
        if (!ga || !gb || ga === 'G' || gb === 'G') return null;
        if (ga === 'D' && gb === 'D') return 'def';
        if (ga === 'A' && gb === 'A') return 'ata';
        if ((ga === 'A' && sb === 'MEI') || (gb === 'A' && sa === 'MEI')) return 'ata';   // o meia e o atacante também formam dupla
        if (ga === 'M' && gb === 'M') return 'mei';
        return null;
    },

    nivelDupla(n) {
        let r = null;
        for (const nv of NIVEIS_DUPLA) if (n >= nv.min) r = nv;
        return r;
    },

    // lista = [{ id, slot }]; soma n jogos juntos a cada dupla
    somarDuplas(s, q, lista, n) {
        const pares = q.qm.pares;
        let max = 0;
        for (let i = 0; i < lista.length; i++) {
            for (let j = i + 1; j < lista.length; j++) {
                const se = Clube.setorPar(lista[i].slot, lista[j].slot);
                if (!se) continue;
                const k = Clube.par(lista[i].id, lista[j].id);
                const pr = pares[k] || (pares[k] = { n: 0, s: se });
                pr.n = Math.round((pr.n + n) * 10) / 10;
                pr.s = se;
                if (pr.n > max) max = pr.n;
            }
        }
        if (max) Conquistas.maximo(s, 'duplaMax', Math.floor(max));
    },

    // depois do jogo: quem começou jogando junto ganha entrosamento
    contarDuplas(s, q, m, lado) {
        const lista = [];
        for (const pid in m.st) {
            const st = m.st[pid];
            if (st.lado !== lado || st.entrou !== 0) continue;
            const p = s.jog[pid];
            if (!p) continue;
            const i = m.esc[lado].indexOf(+pid);
            lista.push({ id: +pid, slot: i >= 0 ? m.slots[lado][i] : p.pos });
        }
        Clube.somarDuplas(s, q, lista, 1);
    },

    // entrosamento do time provável (pré-temporada em casa ou o elenco que você herdou)
    reforcarDuplas(s, t, q, n) {
        if (!FORMACOES[t.form]) return;
        const esc = Escalacao.doTime(s, t);
        const slots = FORMACOES[t.form];
        const lista = esc.map((id, i) => (id != null && s.jog[id] ? { id, slot: slots[i][0] } : null)).filter(Boolean);
        if (n != null) return Clube.somarDuplas(s, q, lista, n);
        // herança: cada dupla do time provável já tem de 3 a 12 jogos juntos
        for (let i = 0; i < lista.length; i++) {
            for (let j = i + 1; j < lista.length; j++) {
                const se = Clube.setorPar(lista[i].slot, lista[j].slot);
                if (se) q.qm.pares[Clube.par(lista[i].id, lista[j].id)] = { n: U.int(3, 12), s: se };
            }
        }
    },

    // melhor dupla de cada setor entre os que estão em campo
    duplasEmCampo(s, q, esc) {
        const em = new Set(esc.filter(x => x != null));
        const best = { def: null, mei: null, ata: null };
        const pares = q.qm.pares;
        for (const k in pares) {
            const pr = pares[k];
            if (pr.n < NIVEIS_DUPLA[0].min) continue;
            const ids = k.split('-');
            const a = +ids[0], b = +ids[1];
            if (!em.has(a) || !em.has(b)) continue;
            if (!best[pr.s] || pr.n > best[pr.s].n) best[pr.s] = { a, b, n: pr.n, se: pr.s };
        }
        let ata = 0, def = 0;
        const lista = [];
        for (const se of ['def', 'mei', 'ata']) {
            const x = best[se];
            if (!x) continue;
            x.nv = Clube.nivelDupla(x.n);
            const v = x.nv.b;
            if (se === 'def') def += v;
            else if (se === 'ata') ata += v;
            else { ata += v / 2; def += v / 2; }
            lista.push(x);
        }
        return { ata, def, lista };
    },

    brigaAtiva(s, q) {
        const b = q.qm && q.qm.briga;
        return b && Mot.agora(s) < b.ate ? b : null;
    },

    // briga no elenco (de vez em quando): decisão rápida; no avanço rápido o auxiliar resolve
    async semanaQuimica(s, t, q, rapido) {
        const qm = q.qm;
        const agora = Mot.agora(s);
        if (qm.briga && agora >= qm.briga.ate) {
            const a = s.jog[qm.briga.a], b = s.jog[qm.briga.b];
            if (a && b) Vida.log(s, `🤝 ${U.esc(a.nome)} e ${U.esc(b.nome)} fizeram as pazes. O clima no vestiário voltou ao normal.`, 'bom');
            qm.briga = null;
        }
        if (qm.briga || agora - qm.ultBriga < 8 || !U.chance(0.06)) return;
        const el = Mundo.elenco(s, t).filter(p => p.les <= 0 && !p.user);
        if (el.length < 14) return;
        const peso = p => ({ temperamental: 3, vaidoso: 2, ambicioso: 1.6 }[Mot.pers(p)] || 1) * (Mot.valor(p) < 45 ? 1.8 : 1);
        const a = U.pesado(el, peso);
        const mesma = el.filter(x => x.id !== a.id && x.pos === a.pos);
        const disputa = mesma.length > 0 && U.chance(0.45);
        const b = disputa ? U.pesado(mesma, x => x.ovr) : U.pesado(el.filter(x => x.id !== a.id), peso);
        if (!b) return;
        qm.ultBriga = agora;
        const motivo = disputa ? 'a disputa pela mesma vaga no time' : U.escolha(['uma entrada dura no rachão', 'uma discussão no vestiário depois do treino', 'uma brincadeira que ninguém achou graça', 'uma festa que um deles postou nas redes']);
        const exp = a.idade >= b.idade ? a : b, nov = exp === a ? b : a;
        // a dupla dos dois esfria
        const k = Clube.par(a.id, b.id);
        if (qm.pares[k]) qm.pares[k].n = Math.round(qm.pares[k].n * 5) / 10;
        const ops = ['🤝 Chamar os dois para conversar', '👴 Ficar do lado do mais experiente', '💸 Multar os dois', '🙈 Deixar eles se resolverem'];
        let i;
        const aux = Comissao.membro(s, 'aux');
        if (rapido) {
            i = aux ? 0 : 3;
        } else {
            const pers = p => (PERSONALIDADES[Mot.pers(p)] || {}).icone || '';
            i = await Ritmo.perguntar(s, 'clube:briga', 'Briga no elenco!',
                `${UI.pos(a.pos)} <b>${U.esc(a.nome)}</b> ${pers(a)} e ${UI.pos(b.pos)} <b>${U.esc(b.nome)}</b> ${pers(b)} se estranharam por causa de ${motivo}.<br>
                <small class="cinza">Brigados, os dois juntos em campo rendem menos (−${Clube.num(PENA_BRIGA)}). O mais experiente é ${U.esc(exp.nome)} (${exp.idade} anos).</small>`, ops, '⚡', 'Briga no elenco');
            if (typeof i !== 'number' || i < 0 || i > 3) i = 3;
        }
        const quem = `${U.esc(a.nome)} x ${U.esc(b.nome)}`;
        let txt, dura = 0;
        if (i === 0) {
            const chance = aux && rapido ? 0.5 + aux.est * 0.08 : 0.72;
            if (U.chance(chance)) { Mot.mudar(a, 3); Mot.mudar(b, 3); txt = 'a conversa resolveu e os dois se abraçaram'; }
            else { Mot.mudar(a, -2); Mot.mudar(b, -2); dura = 4; txt = 'a conversa não adiantou, o clima segue tenso'; }
        } else if (i === 1) {
            Mot.mudar(exp, 5);
            Mot.mudar(nov, Mot.pers(nov) === 'temperamental' ? -14 : -10);
            t.moral = U.clamp(t.moral - 1, 5, 99);
            if (U.chance(0.3)) dura = 3;
            txt = `você ficou do lado de ${U.esc(exp.nome)} e ${U.esc(nov.nome)} ficou magoado`;
        } else if (i === 2) {
            Mot.mudar(a, -6); Mot.mudar(b, -6);
            t.moral = U.clamp(t.moral + 3, 5, 99);
            s.car.conf = U.clamp(s.car.conf + 1.5, 0, 100);
            t.saldo += U.redondo((a.sal + b.sal) * 0.02);
            txt = 'multa para os dois: o grupo entendeu o recado (+3 de moral)';
        } else {
            if (U.chance(0.5)) { if (qm.pares[k]) qm.pares[k].n += 2; txt = 'eles se resolveram sozinhos e viraram até amigos'; }
            else { dura = 6; t.moral = U.clamp(t.moral - 3, 5, 99); txt = 'ninguém resolveu nada e o clima pesou (−3 de moral)'; }
        }
        if (dura) qm.briga = { a: a.id, b: b.id, ate: agora + dura, motivo };
        const prefixo = rapido ? (aux ? `🧑‍💼 Auxiliar ${U.esc(aux.nome)} cuidou da briga ${quem}` : `⚡ Briga no elenco (${quem})`) : `⚡ Briga no elenco (${quem})`;
        Vida.log(s, `${prefixo}: ${txt}.`, dura ? 'ruim' : '');
        Clube.avisar(`⚡ ${quem}: ${txt}.`);
    },

    // -----------------------------------------------------------------
    //  Bônus nas partidas (gancho em Partida.bonusTime)
    // -----------------------------------------------------------------
    bonusDetalhado(m, lado, t, comTexto) {
        const s = m.s;
        const r = { ata: 0, def: 0, itens: [] };
        if (s.modo !== 'tecnico' || !s.car || !(s.car.tid >= 0) || !m.jogo || m.jogo.tipo === 'selecao' || !t) return r;
        const meu = s.car.tid;
        if (m.h !== meu && m.a !== meu) return r;
        const q = s.car.clima;
        if (!q || q.tid !== meu) return r;
        const add = (a, d, txt) => { r.ata += a; r.def += d; if (comTexto && txt) r.itens.push(txt); };
        if (t.id === meu) {
            if (lado === 0 && m.fatorCasa > 1) {
                const b = Clube.bonusCasa(q), H = Clube.humor(q.torc);
                if (Math.abs(b) >= 0.05) add(b, b, `📣 Torcida ${H.ic} ${H.nome.toLowerCase()}: <b class="${b > 0 ? 'verde' : 'vermelho'}">${Clube.num(b, true)}</b> em casa`);
            }
            if (q.pre && q.pre.ano === s.ano && s.semana <= q.pre.ate && q.pre.b) {
                const P = PRETEMPORADA[q.pre.k] || {};
                add(q.pre.b, q.pre.b, `${P.icone || '🧳'} Pré-temporada — ${U.esc(P.nome || '')}: <b class="${q.pre.b > 0 ? 'verde' : 'vermelho'}">${Clube.num(q.pre.b, true)}</b>`);
            }
            const du = Clube.duplasEmCampo(s, q, m.esc[lado]);
            if (du.lista.length) {
                const nomes = du.lista.map(x => `${SETORES_DUPLA[x.se].icone} ${U.esc(Clube.sobrenome(s, x.a))} & ${U.esc(Clube.sobrenome(s, x.b))} <small>(${x.nv.nome.toLowerCase()})</small>`).join(' · ');
                add(du.ata, du.def, `🤝 Duplas: ${nomes} <b class="verde">${Clube.num(du.ata + du.def, true)}</b>`);
            }
            const br = Clube.brigaAtiva(s, q);
            if (br && m.esc[lado].indexOf(br.a) >= 0 && m.esc[lado].indexOf(br.b) >= 0) {
                add(-PENA_BRIGA, -PENA_BRIGA, `⚡ ${U.esc(Clube.sobrenome(s, br.a))} e ${U.esc(Clube.sobrenome(s, br.b))} brigados em campo: <b class="vermelho">−${Clube.num(PENA_BRIGA)}</b>`);
            }
        } else {
            const col = Clube.coletivaNaSemana(s);
            if (col && col.adv === t.id && col.deles) {
                add(col.deles, col.deles, col.deles > 0 ? `🎙️ Depois da coletiva, o ${U.esc(t.nome)} entra mordido: <b class="vermelho">${Clube.num(col.deles, true)} para eles</b>`
                    : `🎙️ Efeito da coletiva no ${U.esc(t.nome)}: <b class="verde">${Clube.num(col.deles, true)} para eles</b>`);
            }
            const pr = q.provRival;
            if (pr && pr.ano === s.ano && pr.sem === s.semana && pr.adv === t.id) add(0.3, 0.3, `🗣️ O técnico deles inflamou o elenco nos jornais: <b class="vermelho">+0,3 para eles</b>`);
        }
        return r;
    },

    bonusTime(m, lado, t) {
        const r = Clube.bonusDetalhado(m, lado, t, false);
        return { ata: r.ata, def: r.def };
    },

    sobrenome(s, pid) {
        const p = s.jog[pid];
        return p ? p.nome.split(' ').slice(-1)[0] : '?';
    },

    // quadro no pré-jogo (gancho em TelaPartida.preJogo)
    htmlPreJogo(m) {
        const s = m.s;
        if (s.modo !== 'tecnico' || !(m.controle >= 0) || !m.jogo || m.jogo.tipo === 'selecao' || !Clube.ativo(s)) return '';
        const l = m.controle;
        const t = s.times[l ? m.a : m.h], adv = s.times[l ? m.h : m.a];
        if (!t || !adv || t.id !== s.car.tid) return '';
        const q = Clube.estado(s);
        const linhas = [];
        const tec = Clube.tecnico(s, adv);
        if (tec) linhas.push(`👔 Do outro lado: ${Clube.nomeTec(tec)} · ${Clube.retrospecto(q.riv[tec.id])}`);
        const col = Clube.coletivaNaSemana(s);
        if (col && col.adv === adv.id) linhas.push(`🎙️ Na coletiva você ${(COLETIVA_OPS.find(o => o.k === col.op) || {}).curto || 'falou'}.`);
        Clube.bonusDetalhado(m, l, t, true).itens.forEach(x => linhas.push(x));
        Clube.bonusDetalhado(m, 1 - l, adv, true).itens.forEach(x => linhas.push(x));
        if (!linhas.length) return '';
        return `<div class="clb-prejogo">${linhas.map(x => `<div>${x}</div>`).join('')}</div>`;
    },

    // -----------------------------------------------------------------
    //  🎙️ Coletiva antes de jogo grande e técnicos rivais
    // -----------------------------------------------------------------
    tipoJogoGrande(s, t, j) {
        if (Mundo.ehFinal(s, j)) return 'final';
        if (Mundo.classico(s, j.h, j.a)) return 'classico';
        if (j.tipo === 'copa') {
            const c = Mundo.copa(s, j.comp);
            if (c && Mundo.fasesCopa(c)[j.r] === 'Semifinal') return 'semi';
        }
        if (j.tipo === 'liga' && s.semana >= 8) {
            const adv = j.h === t.id ? j.a : j.h;
            if (Mundo.posicaoNaLiga(s, adv) <= 3 && Mundo.posicaoNaLiga(s, t.id) <= 6) return 'topo';
        }
        return null;
    },

    coletivaNaSemana(s) {
        const q = s.car && s.car.clima;
        const c = q && q.col;
        return c && c.ano === s.ano && c.sem === s.semana ? c : null;
    },

    // antes dos jogos da semana: o técnico rival provoca e, às vezes, você dá a coletiva
    async coletivaDaSemana(s, t, q, rapido) {
        const jogos = Mundo.partidasDaSemana(s).filter(j => j.h === t.id || j.a === t.id);
        let j = null, tipo = null;
        for (const x of jogos) { const tp = Clube.tipoJogoGrande(s, t, x); if (tp) { j = x; tipo = tp; break; } }
        if (!j) return;
        const adv = s.times[j.h === t.id ? j.a : j.h];
        const tec = Clube.tecnico(s, adv);
        if (!tec) return;
        let provocou = false;
        if ((tipo === 'classico' || tipo === 'final') && (tec.est === 'provocador' || tec.est === 'pavio') && U.chance(0.5)) {
            provocou = true;
            q.provRival = { ano: s.ano, sem: s.semana, adv: adv.id };
            for (const p of Mundo.elenco(s, t)) Mot.mudar(p, 2);   // seu elenco também fica mordido
            Mundo.noticia(s, `🗣️ ${tec.nome}, técnico do ${adv.nome}, provoca antes do jogo: "${U.escolha(PROVOCACOES_RIVAL)}"`, 'clube');
            Vida.log(s, `🗣️ ${U.esc(tec.nome)} (${U.esc(adv.nome)}) te provocou nos jornais antes do jogo. O elenco ficou mordido.`, '');
        }
        if (rapido || Mot.agora(s) - (q.ultCol == null ? -99 : q.ultCol) < 3) return;
        if (!U.chance({ final: 0.75, classico: 0.65, semi: 0.5, topo: 0.3 }[tipo])) return;
        await Clube.coletiva(s, t, q, j, adv, tec, tipo, provocou);
    },

    async coletiva(s, t, q, j, adv, tec, tipo, provocou) {
        const nomeJogo = { final: 'da FINAL', classico: 'do CLÁSSICO', semi: 'da semifinal', topo: 'do jogo grande' }[tipo];
        const texto = `Os repórteres querem saber do jogo contra o <b>${U.esc(adv.nome)}</b> (${U.esc(Mundo.nomeCompeticao(s, j.comp))}).<br>
            Do outro lado: ${Clube.nomeTec(tec)} · ${Clube.retrospecto(q.riv[tec.id])}.${provocou ? '<br>🗣️ <b>Ele te provocou nos jornais esta semana!</b>' : ''}<br>
            <small class="cinza">Provocar inflama os dois times (e a torcida); respeitar acalma o adversário; pressionar a arbitragem pode render multa; blindar o elenco levanta quem anda desmotivado.</small>`;
        const i = await Ritmo.perguntar(s, 'clube:coletiva', `Coletiva antes ${nomeJogo}`, texto, COLETIVA_OPS.map(o => o.txt), '🎙️', 'Coletiva antes de jogo grande');
        const op = (COLETIVA_OPS[typeof i === 'number' && i >= 0 ? i : 0] || COLETIVA_OPS[0]).k;
        const txt = Clube.aplicarColetiva(s, t, q, adv, tec, tipo, op);
        UI.toast(`🎙️ ${txt}`);
    },

    // efeitos da coletiva (devolve o resumo)
    aplicarColetiva(s, t, q, adv, tec, tipo, op) {
        const el = Mundo.elenco(s, t);
        const grande = tipo === 'classico' || tipo === 'final';
        let deles = 0, txt = '';
        if (op === 'respeitar') {
            el.forEach(p => Mot.mudar(p, 1));
            s.car.conf = U.clamp(s.car.conf + 1, 0, 100);
            if (tipo === 'classico') Clube.mudarTorcida(s, q, -1);
            deles = tec.est === 'provocador' ? 0.2 : -0.2;
            txt = tec.est === 'provocador' ? 'Elegante... mas o técnico deles debochou e o time dele ficou ligado.' : 'Discurso elegante: o adversário entra mais tranquilo (−0,2 para eles) e a diretoria gostou.';
        } else if (op === 'provocar') {
            el.forEach(p => Mot.mudar(p, 3));
            t.moral = U.clamp(t.moral + 3, 5, 99);
            Vida.mudar(s, { fama: 2 });
            Clube.mudarTorcida(s, q, grande ? 4 : 2);
            deles = tec.est === 'pavio' ? 0.9 : 0.7;
            txt = `Manchete garantida! Seu elenco e a torcida vibraram, mas o ${U.esc(adv.nome)} entra mordido (+${Clube.num(deles)} para eles). Agora tem que ganhar...`;
            q.riv[tec.id] = Clube.registroRival(q, tec, adv);
            q.riv[tec.id].prov++;
        } else if (op === 'arbitragem') {
            Vida.mudar(s, { fama: 1 });
            if (U.chance(0.3)) {
                const multa = U.redondo(Math.max(20000, (s.car.receita || 0) * 0.3));
                t.saldo -= multa;
                s.car.conf = U.clamp(s.car.conf - 2, 0, 100);
                txt = `A federação não gostou: multa de ${U.dinheiro(multa)} para o clube e a diretoria torceu o nariz.`;
            } else {
                deles = -0.35;
                txt = 'A arbitragem vai ficar de olho no adversário (−0,35 para eles).';
            }
        } else {
            let levantou = 0;
            el.forEach(p => { if (Mot.valor(p) < 50) { Mot.mudar(p, 6); levantou++; } else Mot.mudar(p, 1); });
            t.moral = U.clamp(t.moral + 4, 5, 99);
            s.car.conf = U.clamp(s.car.conf + 1, 0, 100);
            txt = `Você protegeu o grupo: +4 de moral${levantou ? ` e ${levantou} desmotivado${levantou > 1 ? 's' : ''} ganharam confiança` : ''}.`;
        }
        q.col = { ano: s.ano, sem: s.semana, adv: adv.id, tec: tec.id, op, deles, tipo };
        q.cols.unshift({ ano: s.ano, sem: s.semana, adv: adv.nome, op, tipo, res: null, placar: '' });
        if (q.cols.length > 8) q.cols.length = 8;
        q.ultCol = Mot.agora(s);
        Conquistas.contar(s, 'coletivas');
        const O = COLETIVA_OPS.find(o => o.k === op);
        Vida.log(s, `🎙️ Coletiva antes ${{ final: 'da final', classico: 'do clássico', semi: 'da semifinal', topo: 'do jogo grande' }[tipo]} contra o ${U.esc(adv.nome)}: você ${O.curto}. ${txt}`, '');
        // o técnico rival responde nos jornais
        const frases = RESPOSTAS_TEC[op] || {};
        const frase = frases[tec.est];
        if (frase && (op !== 'blindar' || U.chance(0.6))) Mundo.noticia(s, `🗣️ ${tec.nome} (${adv.nome}) responde a ${s.pessoa.nome}: "${frase}"`, 'clube');
        return txt;
    },

    registroRival(q, tec, adv) {
        const r = q.riv[tec.id] || { nome: tec.nome, bnd: tec.bnd, est: tec.est, v: 0, e: 0, d: 0, gp: 0, gc: 0, prov: 0, ult: [] };
        r.tid = adv.id;
        r.clube = adv.nome;
        return r;
    },

    // retrospecto contra cada técnico (no máximo 120 guardados)
    registrarDuelo(s, q, adv, res, gf, gc) {
        const tec = Clube.tecnico(s, adv);
        if (!tec) return null;
        const r = Clube.registroRival(q, tec, adv);
        q.riv[tec.id] = r;
        if (res === 'V') r.v++; else if (res === 'E') r.e++; else r.d++;
        r.gp += gf;
        r.gc += gc;
        r.ult.push(res);
        if (r.ult.length > 5) r.ult.shift();
        r.ano = s.ano;
        r.ag = Mot.agora(s);
        const ids = Object.keys(q.riv);
        if (ids.length > 120) {
            ids.sort((a, b) => (q.riv[a].v + q.riv[a].e + q.riv[a].d) - (q.riv[b].v + q.riv[b].e + q.riv[b].d) || (q.riv[a].ag || 0) - (q.riv[b].ag || 0));
            ids.slice(0, ids.length - 120).forEach(k => { delete q.riv[k]; });
        }
        return r;
    },

    // -----------------------------------------------------------------
    //  Depois de cada jogo do seu clube (gancho em Tecnico.posJogo)
    // -----------------------------------------------------------------
    async posJogo(s, jogo, m, r, rapido) {
        const t = Tecnico.time(s);
        if (!t || jogo.tipo === 'selecao') return '';
        const q = Clube.estado(s);
        const lado = jogo.h === t.id ? 0 : 1;
        const adv = s.times[lado === 0 ? jogo.a : jogo.h];
        const gf = lado === 0 ? r.gh : r.ga, gc = lado === 0 ? r.ga : r.gh;
        const venceu = r.venc === t.id || (r.venc == null && gf > gc);
        const empate = r.venc == null && gf === gc;
        const res = venceu ? 'V' : empate ? 'E' : 'D';
        const classico = Mundo.classico(s, jogo.h, jogo.a);
        const final = Mundo.ehFinal(s, jogo);
        const linhas = [];
        q.ult = (q.ult || []).concat([res]).slice(-6);
        Clube.registrarDuelo(s, q, adv, res, gf, gc);
        Clube.contarDuplas(s, q, m, lado);
        // objetivos: clássico vencido
        const obj = q.obj;
        if (obj && obj.ano === s.ano && classico && venceu) { obj.c = obj.c || {}; obj.c.clas = (obj.c.clas || 0) + 1; }
        // coletiva: falou e fez?
        const col = Clube.coletivaNaSemana(s);
        if (col && col.adv === adv.id && !col.res) {
            col.res = res;
            const reg = q.cols[0];
            if (reg && reg.ano === col.ano && reg.sem === col.sem) { reg.res = res; reg.placar = `${gf} x ${gc}`; }
            if (col.op === 'provocar') {
                if (venceu) {
                    Vida.mudar(s, { fama: 2 });
                    s.car.conf = U.clamp(s.car.conf + 2, 0, 100);
                    Clube.mudarTorcida(s, q, 3);
                    Conquistas.contar(s, 'provocacoesVencidas');
                    linhas.push('😈 <b>Falou e fez!</b> A provocação da coletiva virou meme a seu favor (+fama, +torcida).');
                } else if (!empate) {
                    Vida.mudar(s, { fama: -1 });
                    s.car.conf = U.clamp(s.car.conf - 4, 0, 100);
                    Clube.mudarTorcida(s, q, -4);
                    linhas.push('🤐 <b>Falou demais...</b> A provocação da coletiva voltou contra você (−4 de confiança, torcida irritada).');
                }
            }
        }
        // torcida: o resultado comparado com o que se esperava do jogo (a mesma conta da diretoria):
        // time grande que só vence os pequenos não empolga; zebra e clássico mexem muito
        const fd = (Mundo.forca(s, t) - Mundo.forca(s, adv)) / 10 + (lado === 0 ? 0.25 : -0.25);
        const esperado = U.clamp(1.35 + fd * 0.9, 0.3, 2.6);
        let d = ((venceu ? 3 : empate ? 1 : 0) - esperado) * 1.4;
        if (Math.abs(gf - gc) >= 3) d += venceu ? (esperado < 2 ? 1.5 : 0.5) : -2;   // goleada
        if (classico) d = d * 1.6 + (venceu ? 2 : empate ? 0 : -2);
        if (final) d += venceu ? 8 : -4;
        const antes = q.torc;
        Clube.mudarTorcida(s, q, d);
        const H = Clube.humor(q.torc);
        const dif = Math.round(q.torc - antes);
        linhas.push(`📣 Torcida: ${H.ic} ${H.nome} (${Math.round(q.torc)})${dif ? ` <span class="${dif > 0 ? 'verde' : 'vermelho'}">${dif > 0 ? '+' : ''}${dif}</span>` : ''}`);
        // festa no aeroporto: título, ou vitória fora de casa em clássico ou semifinal
        const c = jogo.tipo === 'copa' ? Mundo.copa(s, jogo.comp) : null;
        const semi = !!c && Mundo.fasesCopa(c)[jogo.r] === 'Semifinal';
        if (venceu && (final || (lado === 1 && (classico || semi) && q.torc >= 55 && Mot.agora(s) - q.ultEvt >= 2 && U.chance(0.6)))) {
            t.moral = U.clamp(t.moral + 4, 5, 99);
            Vida.mudar(s, { felicidade: 3, fama: 1 });
            Clube.evento(s, q, '✈️', `Festa no aeroporto! Milhares de torcedores recebem o time depois da vitória sobre o ${U.esc(adv.nome)} (+4 de moral).`, 'bom', `Torcida do ${t.nome} faz festa no aeroporto.`);
            linhas.push('✈️ A torcida vai fazer festa no aeroporto!');
        }
        return linhas.map(x => `<div class="rf-linha">${x}</div>`).join('');
    },

    // -----------------------------------------------------------------
    //  Semana (gancho em Tecnico.semana)
    // -----------------------------------------------------------------
    async semana(s, t) {
        const q = Clube.estado(s);
        const rapido = Clube.rapido();
        Clube.garantirObjetivos(s, t, q);
        Clube.mudancasElenco(s, t, q);
        // humor: preço do ingresso e a volta lenta ao normal
        const P = PRECOS_INGRESSO[q.preco] || PRECOS_INGRESSO.normal;
        Clube.mudarTorcida(s, q, P.humor + (52 - q.torc) * 0.035);
        t.saldo += Math.round(Clube.extraBilheteria(s, q));
        Clube.eventoTorcida(s, t, q);
        await Clube.semanaQuimica(s, t, q, rapido);
        // último dia da janela que ninguém abriu (avanço rápido): passou batido
        if (Clube.fimJanela(s.semana) && !Clube.dlFeito(s, q)) {
            q.dl = { ano: s.ano, sem: s.semana, ofertas: [], feito: true, pulado: true };
            Vida.log(s, '⏰ O último dia da janela passou no avanço rápido: nenhum negócio de última hora.', '');
        }
        // o ⏭️ para uma semana antes, para você viver o último dia da janela
        if (Clube.fimJanela(s.semana + 1) && typeof Ritmo !== 'undefined' && Ritmo.rodando) Ritmo.modalAberto('⏰ A próxima semana é o último dia da janela');
    },

    // antes dos jogos da semana (gancho em Tecnico.antesDaSemana)
    async antesDaSemana(s) {
        const t = Tecnico.time(s);
        if (!t) return;
        const q = Clube.estado(s);
        const rapido = Clube.rapido();
        Clube.garantirObjetivos(s, t, q);
        if (Clube.prePendente(s, q)) await Clube.preTemporada(s, t, q, rapido);
        if (!rapido && Clube.fimJanela(s.semana) && !Clube.dlFeito(s, q)) await Clube.ultimoDia(s, t, q);
        await Clube.coletivaDaSemana(s, t, q, rapido);
    },

    // -----------------------------------------------------------------
    //  🧳 Pré-temporada
    // -----------------------------------------------------------------
    prePendente(s, q) {
        return s.semana <= 1 && !(q.pre && q.pre.ano === s.ano);
    },

    opcoesPre(t) {
        return t.rep >= 70 ? ['europa', 'eua', 'asia', 'casa'] : t.rep >= 62 ? ['europa', 'eua', 'casa'] : ['interior', 'casa'];
    },

    dinheiroPre(s, k) {
        return U.redondo((s.car.receita || 0) * PRETEMPORADA[k].din);
    },

    descPre(s, k) {
        const P = PRETEMPORADA[k];
        const partes = [];
        if (P.din) partes.push(`💰 ~${U.dinheiro(Clube.dinheiroPre(s, k))}`);
        if (P.fama) partes.push(`⭐ +${P.fama} fama`);
        if (P.seg) partes.push(`📱 +${Math.round(P.seg * 100)}% seguidores`);
        if (P.quimica) partes.push('🤝 titulares mais entrosados');
        partes.push(`${P.b > 0 ? '💪' : '😮‍💨'} ${Clube.num(P.b, true)} de força nas ${P.sem} primeiras semanas`);
        return partes.join(' · ');
    },

    // no avanço rápido a diretoria decide: caixa apertado = excursão; senão, treino em casa
    preAuto(s, t) {
        const ops = Clube.opcoesPre(t);
        if (t.saldo < Tecnico.folha(s, t) / 6) return ops.indexOf('eua') >= 0 ? 'eua' : ops[0];
        return 'casa';
    },

    async preTemporada(s, t, q, rapido) {
        const ops = Clube.opcoesPre(t);
        let k;
        if (rapido) k = Clube.preAuto(s, t);
        else {
            const html = `<p class="texto-evento">Antes da estreia, a diretoria quer saber como vai ser a pré-temporada do <b>${U.esc(t.nome)}</b>.</p>`;
            k = await UI.modal({
                titulo: '<span class="modal-icone">🧳</span>Pré-temporada', html, fechavel: false, classe: 'modal-evento clb-pre-modal',
                botoes: ops.map(x => { const P = PRETEMPORADA[x]; return { txt: `<span class="clb-pre-bt"><b>${P.icone} ${P.nome}</b><small>${P.desc}</small><small class="clb-pre-ef">${Clube.descPre(s, x)}</small></span>`, valor: x, classe: 'btn-opcao' }; }),
            });
        }
        if (!PRETEMPORADA[k] || ops.indexOf(k) < 0) k = 'casa';
        Clube.aplicarPre(s, t, q, k, rapido);
    },

    aplicarPre(s, t, q, k, auto) {
        const P = PRETEMPORADA[k];
        const din = P.din ? U.redondo(Clube.dinheiroPre(s, k) * U.rand(0.9, 1.1)) : 0;
        t.saldo += din;
        if (P.fama) Vida.mudar(s, { fama: P.fama });
        if (P.seg) s.pessoa.seg = Math.round((s.pessoa.seg || 0) * (1 + P.seg));
        Clube.mudarTorcida(s, q, P.torc);
        for (const p of Mundo.elenco(s, t)) p.cond = U.clamp(p.cond + P.cond, 30, 100);
        if (P.quimica) Clube.reforcarDuplas(s, t, q, P.quimica);
        q.pre = { ano: s.ano, k, ate: s.semana + P.sem - 1, b: P.b, din };
        if (k === 'europa' || k === 'eua' || k === 'asia') Conquistas.contar(s, 'excursoes');
        const txt = `${P.icone} Pré-temporada: ${P.nome}${din ? ` (+${U.dinheiro(din)} para o caixa)` : ''}${auto ? ' — escolha da diretoria no avanço rápido' : ''}.`;
        Vida.log(s, txt, 'bom');
        if (k !== 'casa') Mundo.noticia(s, `${P.icone} Pré-temporada do ${t.nome}: ${P.nome}.`, 'clube');
        Clube.avisar(txt);
    },

    // -----------------------------------------------------------------
    //  ⏰ Último dia da janela
    // -----------------------------------------------------------------
    dlFeito(s, q) {
        return !!(q.dl && q.dl.ano === s.ano && q.dl.sem === s.semana && q.dl.feito);
    },

    // as ofertas do último dia (geradas uma vez por janela)
    prepararDeadline(s, t, q) {
        if (q.dl && q.dl.ano === s.ano && q.dl.sem === s.semana) return q.dl;
        const ofertas = [];
        const n = U.pesado([1, 2, 3], k => [2, 4, 3][k - 1]);
        for (const tipo of U.embaralhar(['pechincha', 'assedio', 'livre'])) {
            if (ofertas.length >= n) break;
            const o = tipo === 'pechincha' ? Clube.dlPechincha(s, t) : tipo === 'assedio' ? Clube.dlAssedio(s, t) : Clube.dlLivre(s, t);
            if (o) ofertas.push(o);
        }
        q.dl = { ano: s.ano, sem: s.semana, ofertas, feito: false };
        return q.dl;
    },

    // posição mais carente do elenco: quanto o melhor jogador de cada posição fica abaixo do nível do clube
    carencia(s, t) {
        const melhor = {};
        for (const p of Mundo.elenco(s, t)) if (!(melhor[p.pos] >= p.ovr)) melhor[p.pos] = p.ovr;
        return pos => Math.max(0, t.rep + 2 - (melhor[pos] || 40));
    },

    dlPechincha(s, t) {
        const cands = [];
        const min = t.rep - 3, max = t.rep + 7;
        for (const id in s.jog) {
            const p = s.jog[id];
            if (p.tid < 0 || p.tid === t.id || p.user || p.les > 0 || p.empr || p.idade > 31 || p.ovr < min || p.ovr > max) continue;   // carreiras: sem emprestados
            const dono = s.times[p.tid];
            if (!dono || dono.selecao || !dono.liga || dono.elenco.length <= 20) continue;
            cands.push(p);
        }
        if (!cands.length) return null;
        const car = Clube.carencia(s, t);
        const p = U.pesado(cands, x => (1 + car(x.pos)) * (x.idade <= 26 ? 1.5 : 1));
        const riq = Mundo.riquezaDoTime(s, t);
        return { tipo: 'pechincha', pid: p.id, de: p.tid, preco: U.redondo(Mundo.valor(p) * U.rand(0.5, 0.72)), sal: U.redondo(Math.max(p.sal, Mundo.salarioPedido(p, riq))) };
    },

    dlAssedio(s, t) {
        const top = Mundo.elenco(s, t).filter(p => p.les <= 0 && !p.empr).sort((a, b) => b.ovr - a.ovr).slice(0, 6);   // carreiras: sem emprestados
        if (t.elenco.length <= 18 || !top.length) return null;
        const p = U.escolha(top);
        const valor = Mundo.valor(p);
        const comp = s.times.filter(x => !x.selecao && x.liga && x.id !== t.id && x.rep >= Math.max(t.rep + 2, p.ovr - 5) && x.saldo >= valor * 1.3);
        if (!comp.length) return null;
        const c = U.escolha(comp);
        return { tipo: 'assedio', pid: p.id, de: c.id, preco: U.redondo(valor * U.rand(1.15, 1.5)) };
    },

    dlLivre(s, t) {
        const riq = Mundo.riquezaDoTime(s, t);
        const cands = s.livres.map(id => s.jog[id]).filter(p => p && !p.user && p.tid === -1 && p.les <= 0 && p.idade <= 33 && p.ovr >= t.rep - 5 && p.ovr <= t.rep + 4);
        let p;
        if (cands.length) p = U.pesado(cands, x => (x.real ? 3 : 1) * (1 + Clube.carencia(s, t)(x.pos)));
        else {
            // apareceu alguém que rescindiu com outro clube
            const pais = Mundo.pais(t.pais);
            p = Mundo.gerarJogador(s, null, U.escolha(POSICOES), pais ? pais.nomes : 'br', t.rep + U.int(-1, 3), riq);
            s.livres.push(p.id);
        }
        return { tipo: 'livre', pid: p.id, de: null, preco: 0, sal: U.redondo(Mundo.salarioPedido(p, riq) * 1.15) };
    },

    cardDeadline(s, t, o, i) {
        const p = s.jog[o.pid];
        if (!p) return '';
        const de = o.de != null ? s.times[o.de] : null;
        const T = { pechincha: ['💰', 'Pechincha de última hora'], assedio: ['🦈', 'Querem levar um titular'], livre: ['🆓', 'Livre no mercado'] }[o.tipo];
        let corpo, botoes;
        if (o.tipo === 'pechincha') {
            corpo = `O ${U.esc(de ? de.nome : 'clube dele')} precisa fazer caixa e libera ele por <b>${U.dinheiro(o.preco)}</b> (vale ${U.dinheiro(Mundo.valor(p))}). Salário: ${U.dinheiro(o.sal)}/ano.`;
            botoes = [['sim', `✅ Fechar por ${U.dinheiro(o.preco)}`, 'btn-primario', o.preco > t.saldo], ['nao', '❌ Deixar passar', 'btn-fantasma']];
        } else if (o.tipo === 'livre') {
            corpo = `Rescindiu com o antigo clube e topa vir hoje mesmo. Sem taxa: só o salário de <b>${U.dinheiro(o.sal)}/ano</b>.`;
            botoes = [['sim', '✍️ Contratar', 'btn-primario'], ['nao', '❌ Não precisa', 'btn-fantasma']];
        } else {
            corpo = `O <b>${U.esc(de ? de.nome : 'clube')}</b> oferece <b>${U.dinheiro(o.preco)}</b> (valor de mercado: ${U.dinheiro(Mundo.valor(p))}). Ele quer ouvir a proposta...`;
            botoes = [['vender', `💰 Vender por ${U.dinheiro(o.preco)}`, ''], ['mais', '💬 Pedir +20%', ''], ['segurar', '🛡️ Segurar', 'btn-fantasma']];
        }
        const msg = o.msg ? `<div class="clb-dl-res ${o.res === 'ok' || o.res === 'vendeu' ? 'verde' : o.res ? 'cinza' : 'vermelho'}">${o.msg}</div>` : '';
        return `<div class="clb-dl-card ${o.res ? 'resolvido' : ''}" data-i="${i}">
            <div class="clb-dl-tipo">${T[0]} ${T[1]}</div>
            <div class="clb-dl-jog">${UI.pos(p.pos)} <b>${U.esc(p.nome)}</b> ${UI.ovr(p.ovr)} <small class="cinza">${p.idade} anos${de ? ` · ${U.esc(de.nome)}` : ''}</small></div>
            <p>${corpo}</p>
            ${o.res ? '' : `<div class="clb-dl-botoes">${botoes.map(b => `<button class="btn btn-pequeno ${b[2]}" data-dl="${i}" data-op="${b[0]}" ${b[3] ? 'disabled title="Sem caixa"' : ''}>${b[1]}</button>`).join('')}</div>`}
            ${msg}
        </div>`;
    },

    // decisão em uma oferta do último dia
    resolverDeadline(s, t, q, o, op) {
        const p = s.jog[o.pid];
        if (o.res) return;
        if (!p) { o.res = 'sumiu'; o.msg = 'O negócio caiu.'; return; }
        if (o.tipo === 'pechincha' || o.tipo === 'livre') {
            if (op !== 'sim') { o.res = 'nao'; o.msg = 'Você deixou passar.'; return; }
            const dono = p.tid >= 0 ? s.times[p.tid] : null;
            if ((o.tipo === 'pechincha' && (!dono || dono.id !== o.de)) || (o.tipo === 'livre' && p.tid !== -1)) { o.res = 'sumiu'; o.msg = 'Outro clube chegou antes!'; return; }
            if (t.elenco.length >= 34) { o.msg = 'Elenco cheio: não cabe mais ninguém.'; return; }
            if (o.preco > t.saldo) { o.msg = 'Sem caixa para pagar.'; return; }
            const regra = Desafios.bloqueioCompra(s, p, o.preco);   // carreiras: regras do desafio de carreira
            if (regra) { o.msg = '🎯 ' + regra; return; }
            Mundo.transferir(s, p, t, o.preco);
            p.sal = o.sal;
            p.contr = (o.tipo === 'livre' ? 2 : 3) + 1;
            o.res = 'ok';
            o.msg = '✅ Negócio fechado no último minuto!';
            Conquistas.contar(s, 'negociosDeadline');
            Mundo.noticia(s, dono ? `⏰ No apagar das luzes, ${t.nome} contrata ${p.nome} do ${dono.nome} por ${U.dinheiro(o.preco)}.` : `⏰ No último dia da janela, ${t.nome} contrata ${p.nome}, que estava livre.`, 'transfer');
            Vida.log(s, `⏰ Último dia da janela: você contratou ${U.esc(p.nome)} (${p.pos}, OVR ${p.ovr})${o.preco ? ` por ${U.dinheiro(o.preco)}` : ''}.`, 'bom');
            return;
        }
        const comp = s.times[o.de];
        if (p.tid !== t.id || !comp) { o.res = 'sumiu'; o.msg = 'O negócio caiu.'; return; }
        const vender = preco => {
            Mundo.transferir(s, p, comp, preco);
            s.car.venda = s.car.venda.filter(id => id !== p.id);
            o.res = 'vendeu';
            o.msg = `💸 Vendido por ${U.dinheiro(preco)}!`;
            Mundo.noticia(s, `⏰ Bomba no fim da janela: ${p.nome} deixa o ${t.nome} e vai para o ${comp.nome} por ${U.dinheiro(preco)}.`, 'transfer');
            Vida.log(s, `⏰ Último dia da janela: você vendeu ${U.esc(p.nome)} ao ${U.esc(comp.nome)} por ${U.dinheiro(preco)}.`, 'bom');
        };
        if (op === 'vender') vender(o.preco);
        else if (op === 'mais') {
            if (U.chance(0.5)) vender(U.redondo(o.preco * 1.2));
            else { o.res = 'nao'; o.msg = `🚪 O ${U.esc(comp.nome)} achou caro e desistiu.`; }
        } else {
            o.res = 'segurou';
            Mot.mudar(p, Mot.pers(p) === 'ambicioso' ? -10 : -4);
            o.msg = `🛡️ Você segurou ${U.esc(p.nome.split(' ')[0])} (ele ficou um pouco chateado).`;
        }
    },

    async ultimoDia(s, t, q) {
        const dl = Clube.prepararDeadline(s, t, q);
        if (dl.feito) return;
        dl.feito = true;
        if (!dl.ofertas.length) {
            Vida.log(s, '⏰ Último dia da janela: nenhum negócio de última hora apareceu.', '');
            return;
        }
        const DUR = 45;
        const html = `<div class="clb-dl">
            <div class="clb-dl-relogio">
                <span class="clb-dl-hora">⏰ <b class="clb-dl-h">21:00</b></span>
                <small>A janela fecha à meia-noite. Decida rápido!</small>
                <div class="clb-dl-barra"><i style="animation-duration:${DUR}s"></i></div>
            </div>
            <div class="clb-dl-lista">${dl.ofertas.map((o, i) => Clube.cardDeadline(s, t, o, i)).join('')}</div>
        </div>`;
        const promessa = UI.modal({ titulo: '⏰ ÚLTIMO DIA DA JANELA', html, largo: true, fechavel: false, classe: 'clb-dl-modal', botoes: [{ txt: '🔒 Encerrar o dia', valor: 'fim', classe: 'btn-fantasma' }] });
        const raiz = typeof document !== 'undefined' && document.querySelector ? document.querySelector('#modais .modal-fundo:last-child') : null;
        let timer = null;
        if (raiz && raiz._fechar) {
            const ini = Date.now();
            const hora = raiz.querySelector('.clb-dl-h');
            timer = setInterval(() => {
                const f = Math.min(1, (Date.now() - ini) / (DUR * 1000));
                const min = Math.round(21 * 60 + f * 179);
                if (hora) hora.textContent = `${Math.floor(min / 60)}:${String(min % 60).padStart(2, '0')}`;
                if (f > 0.78) raiz.classList.add('clb-dl-fim');
                if (f >= 1) { clearInterval(timer); timer = null; raiz._fechar('tempo'); }
            }, 250);
            raiz.addEventListener('click', e => {
                const b = e.target.closest('[data-dl]');
                if (!b || b.disabled) return;
                const i = +b.dataset.dl, o = dl.ofertas[i];
                if (!o || o.res) return;
                Clube.resolverDeadline(s, t, q, o, b.dataset.op);
                const card = raiz.querySelector(`.clb-dl-card[data-i="${i}"]`);
                if (card) card.outerHTML = Clube.cardDeadline(s, t, o, i);
                if (o.res === 'ok' || o.res === 'vendeu') Som.tocar('moeda');
                if (dl.ofertas.every(x => x.res) && raiz._fechar) setTimeout(() => { if (raiz.parentNode) raiz._fechar('fim'); }, 1300);
            });
        }
        const r = await promessa;
        if (timer) clearInterval(timer);
        let fechados = 0, recusados = 0, expirou = 0;
        for (const o of dl.ofertas) {
            if (!o.res) { o.res = 'expirou'; o.msg = '⌛ O relógio venceu.'; expirou++; }
            else if (o.res === 'ok' || o.res === 'vendeu') fechados++;
            else recusados++;
        }
        const txt = `⏰ Último dia da janela: ${fechados} negócio${fechados === 1 ? '' : 's'} fechado${fechados === 1 ? '' : 's'}${recusados ? `, ${recusados} recusado${recusados > 1 ? 's' : ''}` : ''}${expirou ? `, ${expirou} expirou${expirou > 1 ? '' : ''}` : ''}.`;
        q.dlHist.unshift({ ano: s.ano, sem: s.semana, txt: dl.ofertas.map(o => { const p = s.jog[o.pid]; return `${{ pechincha: '💰', assedio: '🦈', livre: '🆓' }[o.tipo]} ${p ? U.esc(p.nome) : '?'}: ${o.msg}`; }).join(' · ') });
        if (q.dlHist.length > 4) q.dlHist.length = 4;
        Vida.log(s, txt, fechados ? 'bom' : '');
        if (r === 'tempo') UI.toast('⌛ Meia-noite! A janela fechou.');
    },

    // -----------------------------------------------------------------
    //  🎯 Objetivos extras da diretoria
    // -----------------------------------------------------------------
    copaNacional(s, t) {
        return s.copas.find(c => c.tipo === 'nacional' && c.pais === t.pais && c.jogos.some(f => f.some(j => j[0] === t.id || j[1] === t.id))) || null;
    },

    rivaisNaLiga(s, t) {
        const liga = Mundo.liga(s, t.liga);
        return liga ? liga.times.filter(id => id !== t.id && Mundo.classico(s, t.id, id)) : [];
    },

    garantirObjetivos(s, t, q) {
        if (!t) return null;
        if (q.obj && q.obj.ano === s.ano && q.obj.tid === t.id) return q.obj;
        const obj = { ano: s.ano, tid: t.id, lista: [], saldo0: t.saldo, c: {} };
        q.obj = obj;
        if (s.semana > 30) return obj;   // chegou tarde: a diretoria só cobra a posição na liga
        const liga = Mundo.liga(s, t.liga);
        const cands = [];
        const rivais = Clube.rivaisNaLiga(s, t);
        if (rivais.length) cands.push({ k: 'classico', txt: `Vencer um clássico (ex.: contra o ${s.times[U.escolha(rivais)].nome})` });
        const copa = Clube.copaNacional(s, t);
        if (copa) {
            const fases = Mundo.fasesCopa(copa);
            const alvo = t.rep >= 72 ? 'Semifinal' : 'Quartas de final';
            const f = fases.indexOf(alvo);
            if (f > 0) cands.push({ k: 'copa', copa: copa.id, fase: f, txt: `Chegar ${alvo === 'Semifinal' ? 'à semifinal' : 'às quartas de final'} da ${copa.nome}` });
        }
        const garotos = t.base ? Base.garotos(s, t) : [];
        if (garotos.some(p => p.idade >= 17) || Mundo.elenco(s, t).some(p => p.cria === t.id && p.idade <= 21)) cands.push({ k: 'base', txt: 'Revelar um jogador da base (5 jogos na temporada)' });
        cands.push({ k: 'lucro', txt: 'Fechar o ano no lucro (sem contar a premiação)' });
        if (liga) {
            const f = Mundo.forca(s, t);
            const acima = liga.times.filter(id => id !== t.id && Mundo.forca(s, s.times[id]) > f).length;
            if (acima <= 2) cands.push({ k: 'artilheiro', txt: `Ter o artilheiro da ${liga.curto}` });
        }
        if (q.torc < 72) cands.push({ k: 'torcida', txt: 'Terminar o ano com a torcida feliz (humor 65+)' });
        const res = t.saldo < 0 || (Comissao.resultadoSemanal(s, t) < 0);
        const n = t.rep >= 72 ? 2 : U.chance(0.5) ? 2 : 1;
        while (obj.lista.length < n && cands.length) {
            const o = U.pesado(cands, x => OBJETIVOS_DIR[x.k].peso * (x.k === 'lucro' && res ? 2 : 1));
            cands.splice(cands.indexOf(o), 1);
            o.ic = OBJETIVOS_DIR[o.k].ic;
            o.ok = null;
            obj.lista.push(o);
        }
        return obj;
    },

    // { estado: 'ok' | 'and' | 'falhou', pct, txt }. fim = avaliação do fim da temporada
    statusObj(s, t, q, o, fim) {
        const obj = q.obj;
        const fecha = (ok, pct, txt) => ({ estado: ok ? 'ok' : fim ? 'falhou' : 'and', pct: ok ? 100 : U.clamp(Math.round(pct), 0, 99), txt });
        if (o.ok === true) return { estado: 'ok', pct: 100, txt: 'cumprido' };
        if (o.ok === false) return { estado: 'falhou', pct: 0, txt: 'não cumprido' };
        if (o.k === 'classico') {
            const n = (obj.c && obj.c.clas) || 0;
            if (!n && !fim) {
                const restam = Mundo.calendarioDoTime(s, t.id).filter(j => !j.res && Mundo.classico(s, j.h, j.a)).length;
                if (!restam) return { estado: 'falhou', pct: 0, txt: 'não há mais clássicos na temporada' };
                return { estado: 'and', pct: 0, txt: `${restam} clássico${restam > 1 ? 's' : ''} pela frente` };
            }
            return fecha(n >= 1, 0, n ? `${n} clássico${n > 1 ? 's' : ''} vencido${n > 1 ? 's' : ''}` : 'nenhum clássico vencido');
        }
        if (o.k === 'copa') {
            const c = Mundo.copa(s, o.copa);
            if (!c) return fecha(false, 0, 'copa encerrada');
            const fases = Mundo.fasesCopa(c);
            let ult = -1, fora = false;
            c.jogos.forEach((jogos, f) => {
                const j = jogos.find(x => x[0] === t.id || x[1] === t.id);
                if (!j) return;
                ult = f;
                const r = (c.res[f] || []).find(x => x.h === j[0] && x.a === j[1]);
                if (r && r.venc !== t.id) fora = true;
            });
            if (ult >= o.fase) return fecha(true, 100, `chegou: ${fases[ult]}`);
            if (fora || ult < 0) return { estado: 'falhou', pct: 0, txt: ult >= 0 ? `eliminado: ${fases[ult]}` : 'fora da copa' };
            return fecha(false, (ult + 1) / (o.fase + 1) * 100, `fase atual: ${fases[ult]}`);
        }
        if (o.k === 'base') {
            const crias = Mundo.elenco(s, t).filter(p => p.cria === t.id);
            const melhor = crias.sort((a, b) => b.j - a.j)[0];
            const j = melhor ? melhor.j : 0;
            return fecha(j >= 5, j / 5 * 100, melhor ? `${U.esc(melhor.nome)}: ${j}/5 jogos` : 'suba um garoto da base e dê minutos a ele');
        }
        if (o.k === 'lucro') {
            const d = t.saldo - (obj.saldo0 || 0);
            if (!fim) return { estado: 'and', pct: d >= 0 ? 99 : 40, txt: `${d >= 0 ? '+' : ''}${U.dinheiro(d)} no ano até agora` };
            return fecha(d >= 0, 0, `${d >= 0 ? '+' : ''}${U.dinheiro(d)} no ano`);
        }
        if (o.k === 'artilheiro') {
            const liga = Mundo.liga(s, t.liga);
            let lider = null, meu = null;
            for (const tid of liga.times) for (const p of Mundo.elenco(s, s.times[tid])) {
                if (!lider || p.g > lider.g) lider = p;
                if (tid === t.id && (!meu || p.g > meu.g)) meu = p;
            }
            if (!meu || !lider || !lider.g) return fecha(false, 0, 'ninguém marcou ainda');
            const ok = meu.g >= lider.g;
            if (!fim) return { estado: 'and', pct: ok ? 99 : meu.g / lider.g * 100, txt: ok ? `${U.esc(meu.nome)} lidera com ${meu.g} gols` : `${U.esc(meu.nome)} ${meu.g} · líder: ${U.esc(lider.nome)} ${lider.g}` };
            return fecha(ok, 0, ok ? `${U.esc(meu.nome)}, ${meu.g} gols` : `artilheiro: ${U.esc(lider.nome)} (${lider.g})`);
        }
        if (o.k === 'torcida') {
            if (!fim) return { estado: 'and', pct: q.torc / 65 * 100, txt: `humor agora: ${Math.round(q.torc)}` };
            return fecha(q.torc >= 65, 0, `humor final: ${Math.round(q.torc)}`);
        }
        return { estado: 'and', pct: 0, txt: '' };
    },

    htmlObjetivos(s, t, compacto) {
        const q = Clube.estado(s);
        const obj = Clube.garantirObjetivos(s, t, q);
        if (!obj || !obj.lista.length) return compacto ? '' : '<p class="cinza">Sem objetivos extras nesta temporada (você chegou com o campeonato andando). A diretoria cobra só a posição na liga.</p>';
        const linha = o => {
            const st = Clube.statusObj(s, t, q, o, false);
            const ic = st.estado === 'ok' ? '✅' : st.estado === 'falhou' ? '❌' : '⏳';
            return `<div class="clb-obj clb-obj-${st.estado}">
                <div class="clb-obj-topo"><span>${o.ic} ${U.esc(o.txt)}</span><b>${ic}</b></div>
                <div class="stat-fundo"><div class="stat-preenche ${st.estado === 'ok' ? 'verde' : st.estado === 'falhou' ? 'vermelho' : 'amarelo'}" style="width:${st.estado === 'falhou' ? 100 : st.pct}%"></div></div>
                <small class="cinza">${st.txt}</small>
            </div>`;
        };
        if (compacto) return `<div class="clb-objs compacto"><h4>🎯 Objetivos extras</h4>${obj.lista.map(linha).join('')}</div>`;
        const ant = q.objAnt && q.objAnt.ano === s.ano - 1 ? q.objAnt : null;
        return `<p>Meta principal: terminar em <b>${Tecnico.expectativa(s)}º</b> ou melhor na liga.</p>
            <div class="clb-objs">${obj.lista.map(linha).join('')}</div>
            <p class="cinza pequeno">Cada objetivo cumprido vale <b>+${PREMIO_OBJ.conf} de confiança</b> e reputação no fim da temporada; cada um que falhar custa <b>${CASTIGO_OBJ.conf}</b>.</p>
            ${ant ? `<p class="pequeno">Ano passado: ${ant.lista.map(o => `${o.ok ? '✅' : '❌'} ${U.esc(o.txt)}`).join(' · ')}</p>` : ''}`;
    },

    // linha do slide "Sua temporada" da cutscene (gancho em Tecnico.resumoTemporada)
    htmlCena(s) {
        if (!Clube.ativo(s)) return '';
        const t = Tecnico.time(s);
        const q = Clube.estado(s);
        const obj = q.obj;
        if (!obj || obj.ano !== s.ano || obj.tid !== t.id || !obj.lista.length) return '';
        return `<div class="cena-sub">${obj.lista.map(o => `${Clube.statusObj(s, t, q, o, true).estado === 'ok' ? '✅' : '❌'} ${U.esc(o.txt)}`).join('<br>')}</div>`;
    },

    // -----------------------------------------------------------------
    //  Fim da temporada (gancho em Tecnico.antesFimTemporada): devolve a observação do histórico
    // -----------------------------------------------------------------
    fimTemporada(s, t) {
        const q = Clube.estado(s);
        let obs = '';
        // objetivos extras
        const obj = q.obj;
        if (obj && obj.ano === s.ano && obj.tid === t.id && obj.lista.length && !obj.fim) {
            let ok = 0;
            const partes = [];
            for (const o of obj.lista) {
                const st = Clube.statusObj(s, t, q, o, true);
                o.ok = st.estado === 'ok';
                const P = o.ok ? PREMIO_OBJ : CASTIGO_OBJ;
                s.car.conf = U.clamp(s.car.conf + P.conf, 0, 100);
                s.car.rep = U.clamp(s.car.rep + P.rep, 0, 100);
                if (o.ok) ok++;
                partes.push(`${o.ok ? '✅' : '❌'} ${U.esc(o.txt)}`);
            }
            obj.fim = true;
            q.objAnt = { ano: s.ano, lista: obj.lista.map(o => ({ ic: o.ic, txt: o.txt, ok: o.ok })) };
            Conquistas.contar(s, 'objetivosCumpridos', ok);
            if (ok === obj.lista.length && ok >= 2) Conquistas.contar(s, 'objetivosTemporada');
            Vida.log(s, `🎯 Objetivos extras da diretoria: ${partes.join(' · ')} (${ok}/${obj.lista.length}).`, ok === obj.lista.length ? 'bom' : ok ? '' : 'ruim');
            obs = `Objetivos ${ok}/${obj.lista.length}`;
        }
        // torcida: título, acesso, rebaixamento e a meta da liga
        const liga = Mundo.liga(s, t.liga);
        const pos = Mundo.posicaoNaLiga(s, t.id);
        const ligasPais = s.ligas.filter(l => l.pais === liga.pais).sort((a, b) => a.nivel - b.nivel);
        const idx = ligasPais.indexOf(liga);
        let d = (Tecnico.expectativa(s) - pos) * 1.2;
        if (pos === 1) d += 12;
        if (idx > 0 && pos <= ligasPais[idx - 1].troca) d += 10;
        if (liga.troca && pos > liga.times.length - liga.troca) d -= 18;
        Clube.mudarTorcida(s, q, U.clamp(d, -25, 25));
        // química: as férias esfriam as duplas e quem saiu do clube some
        const no = new Set(t.elenco);
        const pares = q.qm.pares;
        for (const k of Object.keys(pares)) {
            const ids = k.split('-');
            if (!no.has(+ids[0]) || !no.has(+ids[1])) { delete pares[k]; continue; }
            pares[k].n = Math.round(pares[k].n * 0.8 * 10) / 10;
            if (pares[k].n < 2) delete pares[k];
        }
        q.qm.briga = null;
        // tempo de casa (para saber quem é ídolo)
        const casa = {};
        for (const id of t.elenco) casa[id] = (q.casa[id] || 0) + 1;
        q.casa = casa;
        // dança das cadeiras: técnicos da IA mal colocados na sua liga podem cair
        Clube.dancaDasCadeiras(s, t, liga);
        return obs;
    },

    dancaDasCadeiras(s, t, liga) {
        const cl = Mundo.classificacao(s, liga);
        cl.forEach((tid, i) => {
            const x = s.times[tid];
            if (tid === t.id || !x.tecnico || i < cl.length * 0.6 || !U.chance(0.35)) return;
            const velho = x.tecnico;
            x.tecnico = null;
            const novo = Clube.tecnico(s, x);
            if (novo) Mundo.noticia(s, `🔄 O ${x.nome} demite ${velho.nome} e anuncia ${novo.nome} ${novo.bnd} como novo técnico.`, 'clube');
        });
    },

    // -----------------------------------------------------------------
    //  📝 Pendências (gancho em Comissao.pendencias)
    // -----------------------------------------------------------------
    pendencias(s, t, add) {
        const q = Clube.estado(s);
        if (Clube.prePendente(s, q)) add('aviso', '🧳', 'Escolha a pré-temporada', 'Excursão (dinheiro e fama) ou treino em casa (físico e entrosamento).', { txt: 'Escolher', aba: 'inicio', rolar: '.clb-pre' });
        if (Clube.fimJanela(s.semana) && !Clube.dlFeito(s, q)) add('aviso', '⏰', 'Último dia da janela!', 'Negócios de última hora esperando por você.', { txt: 'Abrir', aba: 'inicio', rolar: '.clb-dl-aviso' });
        if (q.torc < 30) {
            const H = Clube.humor(q.torc);
            add(q.torc < 15 ? 'urgente' : 'aviso', H.ic, `Torcida ${H.nome.toLowerCase()} (${Math.round(q.torc)})`,
                q.preco === 'caro' ? 'O ingresso caro piora o humor toda semana.' : 'Vitórias (principalmente em clássicos e contra os grandes) e reforços acalmam a arquibancada.', { txt: 'Bastidores', aba: 'clima' });
        }
        const br = Clube.brigaAtiva(s, q);
        if (br && s.jog[br.a] && s.jog[br.b]) add('aviso', '⚡', `Clima tenso: ${U.esc(Clube.sobrenome(s, br.a))} x ${U.esc(Clube.sobrenome(s, br.b))}`, 'Juntos em campo, o time rende menos. Tente fazer as pazes no Vestiário.', { txt: 'Vestiário', aba: 'vestiario' });
        const obj = q.obj;
        if (obj && obj.ano === s.ano && s.semana >= 32) {
            for (const o of obj.lista) {
                const st = Clube.statusObj(s, t, q, o, false);
                if (st.estado === 'and' && st.pct < 99) add('info', '🎯', `Objetivo: ${U.esc(o.txt)}`, st.txt, { txt: 'Bastidores', aba: 'clima' });
            }
        }
    },

    // -----------------------------------------------------------------
    //  Telas
    // -----------------------------------------------------------------
    // ao lado da "Moral do elenco" no topo da tela do clube
    htmlCabecalho(s, t) {
        const q = Clube.estado(s);
        const H = Clube.humor(q.torc);
        return `<div class="cc-moral clb-cc" data-acao="aba" data-aba="clima" title="Humor da torcida (aba Bastidores)">Torcida<b>${H.ic} ${H.nome} <small>${Math.round(q.torc)}</small></b></div>`;
    },

    // pré-temporada e último dia da janela no alto da tela do clube
    htmlAvisos(s, t) {
        const q = Clube.estado(s);
        let html = '';
        if (Clube.prePendente(s, q)) {
            html += `<div class="cartao clb-pre">
                <div class="cartao-topo"><h3>🧳 Pré-temporada ${s.ano}</h3><span class="cinza pequeno">Escolha antes de avançar a semana (no avanço rápido, a diretoria decide).</span></div>
                <div class="clb-pre-ops">${Clube.opcoesPre(t).map(k => { const P = PRETEMPORADA[k]; return `<button class="atividade" data-acao="clbPre" data-k="${k}"><span class="at-icone">${P.icone}</span><b>${P.nome}</b><small>${P.desc}</small><small class="clb-pre-ef">${Clube.descPre(s, k)}</small></button>`; }).join('')}</div>
            </div>`;
        }
        if (Clube.fimJanela(s.semana) && !Clube.dlFeito(s, q)) {
            html += `<div class="cartao clb-dl-aviso">
                <div class="cartao-topo"><h3>⏰ Último dia da janela!</h3><button class="btn btn-primario" data-acao="clbDeadline">Abrir o mercado de última hora</button></div>
                <p class="cinza pequeno">Pechinchas, jogadores livres e clubes atrás dos seus titulares. Se você não abrir agora, abre sozinho ao avançar a semana (no avanço rápido, passa batido).</p>
            </div>`;
        }
        return html;
    },

    termometro(v) {
        const H = Clube.humor(v);
        return `<div class="clb-termo"><div class="clb-termo-barra"><i style="left:${U.clamp(v, 0, 100)}%"></i></div>
            <div class="clb-termo-rot"><span>🤬</span><b class="${H.cls}">${H.ic} ${H.nome} · ${Math.round(v)}</b><span>😍</span></div></div>`;
    },

    htmlPrecos(s, q) {
        return `<div class="clb-precos">${Object.keys(PRECOS_INGRESSO).map(k => {
            const P = PRECOS_INGRESSO[k];
            return `<button class="chip-btn ${q.preco === k ? 'ativo' : ''}" data-acao="clbPreco" data-k="${k}" title="${P.desc}">${P.icone} ${P.nome}</button>`;
        }).join('')}</div>
            <p class="cinza pequeno">${(PRECOS_INGRESSO[q.preco] || PRECOS_INGRESSO.normal).desc}</p>`;
    },

    htmlEfeitosTorcida(s, q) {
        const P = PRECOS_INGRESSO[q.preco] || PRECOS_INGRESSO.normal;
        const b = Clube.bonusCasa(q), extra = Clube.extraBilheteria(s, q);
        return `<div class="ficha">
            <div><span>Força nos jogos em casa</span><b class="${b >= 0 ? 'verde' : 'vermelho'}">${Clube.num(b, true)}</b></div>
            <div><span>Bilheteria (preço + humor)</span><b class="${extra >= 0 ? 'verde' : 'vermelho'}">${extra >= 0 ? '+' : ''}${U.dinheiro(extra)}/sem.</b></div>
            <div><span>Efeito do preço no humor</span><b class="${P.humor > 0 ? 'verde' : P.humor < 0 ? 'vermelho' : ''}">${P.humor ? `${Clube.num(P.humor, true)} por semana` : 'nenhum'}</b></div>
        </div>`;
    },

    // aba Finanças
    htmlFinancas(s, t) {
        const q = Clube.estado(s);
        const H = Clube.humor(q.torc);
        return `<div class="cartao clb-ingressos">
            <div class="cartao-topo"><h3>🎟️ Ingressos e torcida</h3><span class="clb-humor ${H.cls}">${H.ic} Torcida ${H.nome.toLowerCase()} (${Math.round(q.torc)})</span></div>
            ${Clube.htmlPrecos(s, q)}
            ${Clube.htmlEfeitosTorcida(s, q)}
        </div>`;
    },

    // aba Vestiário: duplas e brigas
    htmlQuimica(s, t) {
        const q = Clube.estado(s);
        const no = new Set(t.elenco);
        const pares = q.qm.pares;
        const lista = [];
        for (const k in pares) {
            const ids = k.split('-');
            const a = +ids[0], b = +ids[1];
            if (!no.has(a) || !no.has(b)) continue;
            lista.push({ a, b, n: pares[k].n, se: pares[k].s });
        }
        lista.sort((x, y) => y.n - x.n);
        const prov = new Set(Escalacao.doTime(s, t).filter(x => x != null));
        const du = Clube.duplasEmCampo(s, q, Array.from(prov));
        const melhorSetor = se => lista.find(x => x.se === se);
        const entros = Math.round(U.media(['def', 'mei', 'ata'], se => { const x = melhorSetor(se); return x ? Math.min(35, x.n) / 35 * 100 : 0; }));
        const caixa = se => {
            const x = melhorSetor(se), S = SETORES_DUPLA[se];
            if (!x) return `<div class="clb-setor"><span class="clb-setor-tit">${S.icone} ${S.nome}</span><small class="cinza">Ninguém jogou junto o bastante ainda.</small></div>`;
            const nv = Clube.nivelDupla(x.n);
            const prox = NIVEIS_DUPLA.find(v => v.min > x.n);
            const emCampo = prov.has(x.a) && prov.has(x.b);
            return `<div class="clb-setor ${nv ? 'on' : ''}">
                <span class="clb-setor-tit">${S.icone} ${S.nome}</span>
                <b>${U.esc(Clube.sobrenome(s, x.a))} & ${U.esc(Clube.sobrenome(s, x.b))}</b>
                <small>${nv ? `<span class="tag clb-nivel">${nv.nome}</span> +${Clube.num(nv.b)}` : '<span class="cinza">ainda se conhecendo</span>'} · ${Math.floor(x.n)} jogos juntos${prox ? ` (${prox.nome.toLowerCase()} com ${prox.min})` : ''}</small>
                <small class="${emCampo ? 'verde' : 'cinza'}">${emCampo ? '✔ no time provável' : '✖ fora do time provável'}</small>
            </div>`;
        };
        const outras = lista.filter(x => !['def', 'mei', 'ata'].some(se => melhorSetor(se) === x)).slice(0, 8);
        const br = Clube.brigaAtiva(s, q);
        const agora = Mot.agora(s);
        return `<div class="cartao clb-quimica">
            <div class="cartao-topo"><h3>🤝 Química do elenco</h3><span>Entrosamento: <b>${entros}</b>/100 · em campo: <b class="verde">${Clube.num(du.ata + du.def, true)}</b></span></div>
            ${br && s.jog[br.a] && s.jog[br.b] ? `<div class="clb-briga">⚡ <span><b>Clima tenso:</b> ${U.esc(s.jog[br.a].nome)} x ${U.esc(s.jog[br.b].nome)} (${U.esc(br.motivo)}). Juntos em campo: −${Clube.num(PENA_BRIGA)}. Mais ${br.ate - agora} semana${br.ate - agora > 1 ? 's' : ''}.</span>
                <button class="btn btn-pequeno" data-acao="clbPaz" ${q.qm.paz === agora ? 'disabled' : ''}>${q.qm.paz === agora ? '✔ Tentou nesta semana' : '🤝 Tentar a paz'}</button></div>` : ''}
            <div class="clb-setores">${caixa('def')}${caixa('mei')}${caixa('ata')}</div>
            ${outras.length ? `<div class="clb-outras"><span class="cinza pequeno">Outras duplas:</span> ${outras.map(x => { const nv = Clube.nivelDupla(x.n); return `<span class="tag">${SETORES_DUPLA[x.se].icone} ${U.esc(Clube.sobrenome(s, x.a))} & ${U.esc(Clube.sobrenome(s, x.b))} · ${Math.floor(x.n)}${nv ? ' ★' : ''}</span>`; }).join(' ')}</div>` : ''}
            <p class="cinza pequeno">Quem começa jogando junto ganha entrosamento: ${NIVEIS_DUPLA.map(v => `${v.min} jogos = ${v.nome.toLowerCase()} (+${Clube.num(v.b)})`).join(', ')}. Vale a melhor dupla de cada setor em campo. Nas férias as duplas esfriam um pouco.</p>
        </div>`;
    },

    // aba 🎙️ Bastidores
    tela(s) {
        const t = Tecnico.time(s);
        const q = Clube.estado(s);
        const H = Clube.humor(q.torc);
        const evts = (q.evt || []).slice(0, 6);
        // técnicos rivais
        const prox = Mundo.calendarioDoTime(s, t.id).find(j => !j.res && j.sem >= s.semana);
        const advProx = prox ? s.times[prox.h === t.id ? prox.a : prox.h] : null;
        const tecProx = advProx ? Clube.tecnico(s, advProx) : null;
        const rivais = Object.keys(q.riv).map(k => Object.assign({ id: k }, q.riv[k])).filter(r => r.v + r.e + r.d > 0)
            .sort((a, b) => (b.v + b.e + b.d) - (a.v + a.e + a.d) || (b.ag || 0) - (a.ag || 0)).slice(0, 12);
        const icRes = { V: '✅', E: '➖', D: '❌' };
        const pre = q.pre && q.pre.ano === s.ano ? PRETEMPORADA[q.pre.k] : null;
        return `<div class="grade-2 clb-grade">
            <div class="cartao">
                <div class="cartao-topo"><h3>📣 Torcida do ${U.esc(t.nome)}</h3><span class="clb-humor ${H.cls}">${H.ic} ${H.nome}</span></div>
                ${Clube.termometro(q.torc)}
                ${Clube.htmlEfeitosTorcida(s, q)}
                <h4>🎟️ Preço do ingresso</h4>
                ${Clube.htmlPrecos(s, q)}
                <h4>📰 O que a torcida anda aprontando</h4>
                ${evts.length ? `<div class="clb-evts">${evts.map(e => `<div class="clb-evt ${e.tipo ? 'clb-evt-' + e.tipo : ''}"><small>${e.ano} · sem. ${e.sem + 1}</small> ${e.ic} ${e.txt}</div>`).join('')}</div>` : '<p class="cinza pequeno">Nada de especial por enquanto.</p>'}
                <p class="cinza pequeno">O humor sobe com resultados acima do esperado (zebras e clássicos mexem mais), títulos, reforços de peso e ingresso barato; cai com tropeços, ingresso caro e a venda de ídolos. Torcida feliz empurra o time em casa e enche o estádio; revoltada protesta e pressiona a diretoria.</p>
            </div>
            <div class="cartao">
                <h3>🎯 Objetivos da diretoria — ${s.ano}</h3>
                ${UI.barra('Confiança da diretoria', s.car.conf, '🤝')}
                ${Clube.htmlObjetivos(s, t, false)}
            </div>
        </div>
        <div class="grade-2 clb-grade">
            <div class="cartao">
                <h3>👔 Técnicos rivais</h3>
                ${tecProx ? `<div class="clb-prox">Próximo jogo: ${UI.time(s, advProx.id)}<br>${Clube.nomeTec(tecProx)} · ${Clube.retrospecto(q.riv[tecProx.id])}</div>` : ''}
                ${rivais.length ? `<div class="rolavel"><table class="tabela">
                    <thead><tr><th class="esq">Técnico</th><th class="esq">Clube</th><th>J</th><th>V-E-D</th><th>Gols</th><th>Últimos</th><th>😈</th></tr></thead>
                    <tbody>${rivais.map(r => `<tr><td class="esq">${r.bnd} ${U.esc(r.nome)} <small>${(ESTILOS_TEC[r.est] || {}).icone || ''}</small></td><td class="esq pequeno">${U.esc(r.clube || '')}</td><td>${r.v + r.e + r.d}</td>
                        <td><b class="${r.v > r.d ? 'verde' : r.v < r.d ? 'vermelho' : ''}">${r.v}-${r.e}-${r.d}</b></td><td>${r.gp}:${r.gc}</td><td>${(r.ult || []).map(x => icRes[x]).join('')}</td><td>${r.prov || ''}</td></tr>`).join('')}</tbody>
                </table></div>` : '<p class="cinza">Os duelos contra cada técnico aparecem aqui depois dos jogos.</p>'}
                <p class="cinza pequeno">😈 = provocações suas nas coletivas. Técnicos mal colocados podem ser demitidos no fim do ano.</p>
            </div>
            <div class="cartao">
                <h3>🎙️ Coletivas, pré-temporada e janela</h3>
                ${q.cols.length ? `<div class="clb-cols">${q.cols.slice(0, 6).map(c => `<div class="linha-jogo"><small>${c.ano} S${c.sem + 1}</small> <span>${{ final: '🏆', classico: '🔥', semi: '🥈', topo: '⭐' }[c.tipo] || '🎙️'} vs ${U.esc(c.adv)}: ${(COLETIVA_OPS.find(o => o.k === c.op) || {}).txt || ''}</span> <span class="lj-res">${c.res ? `<i class="f-${c.res}">${c.res}</i> ${c.placar}` : '⏳'}</span></div>`).join('')}</div>`
                    : '<p class="cinza pequeno">Antes de clássicos, finais e jogos contra os primeiros colocados, às vezes os repórteres chamam você para uma coletiva.</p>'}
                <h4>🧳 Pré-temporada</h4>
                <p class="pequeno">${pre ? `${pre.icone} ${pre.nome}${q.pre.din ? ` (+${U.dinheiro(q.pre.din)})` : ''}` : '<span class="cinza">Escolhida na semana 1 de cada temporada.</span>'}</p>
                <h4>⏰ Último dia da janela</h4>
                ${q.dlHist.length ? q.dlHist.slice(0, 2).map(h => `<p class="pequeno"><b>${h.ano} · sem. ${h.sem + 1}:</b> ${h.txt}</p>`).join('') : '<p class="cinza pequeno">Na última semana de cada janela aparecem negócios de última hora.</p>'}
            </div>
        </div>`;
    },
};

// Os ganchos chamados por outros módulos nunca podem quebrar o jogo: um erro
// aqui vira só um aviso no console (as funções assíncronas também).
[['semana', undefined], ['antesDaSemana', undefined], ['posJogo', ''], ['bonusTime', { ata: 0, def: 0 }], ['htmlPreJogo', ''],
    ['coletivaNaSemana', null], ['extraSemanal', 0], ['pendencias', undefined], ['fimTemporada', ''], ['htmlCena', ''],
    ['htmlCabecalho', ''], ['htmlAvisos', ''], ['htmlObjetivos', ''], ['htmlFinancas', ''], ['htmlQuimica', '']].forEach(([k, padrao]) => {
    const fn = Clube[k];
    Clube[k] = function () {
        try {
            const r = fn.apply(Clube, arguments);
            if (r && typeof r.then === 'function') return r.catch(e => { console.warn('clube.' + k, e); return padrao; });
            return r;
        } catch (e) {
            console.warn('clube.' + k, e);
            return padrao;
        }
    };
});

Object.assign(ACOES, {
    clbPreco(d) {
        const s = Jogo.s;
        if (!Clube.ativo(s) || !PRECOS_INGRESSO[d.k]) return;
        const q = Clube.estado(s);
        q.preco = d.k;
        const P = PRECOS_INGRESSO[d.k];
        UI.toast(`${P.icone} Ingresso ${P.nome.toLowerCase()}: ${P.desc}`);
        Jogo.manterRolagem = true;
        Jogo.atualizar();
    },
    clbPre(d) {
        const s = Jogo.s;
        if (!Clube.ativo(s) || Jogo.ocupado) return;
        const t = Tecnico.time(s), q = Clube.estado(s);
        if (!Clube.prePendente(s, q) || Clube.opcoesPre(t).indexOf(d.k) < 0) return;
        Clube.aplicarPre(s, t, q, d.k, false);
        Jogo.manterRolagem = true;
        Jogo.atualizar();
    },
    async clbDeadline() {
        const s = Jogo.s;
        if (!Clube.ativo(s) || Jogo.ocupado) return;
        const t = Tecnico.time(s), q = Clube.estado(s);
        if (!Clube.fimJanela(s.semana) || Clube.dlFeito(s, q)) return;
        Jogo.ocupado = true;   // ninguém avança a semana com o relógio correndo
        try {
            await Clube.ultimoDia(s, t, q);
        } finally {
            Jogo.ocupado = false;
        }
        if (Jogo.s === s) { Jogo.manterRolagem = true; Jogo.atualizar(); }
    },
    clbPaz() {
        const s = Jogo.s;
        if (!Clube.ativo(s)) return;
        const q = Clube.estado(s);
        const br = Clube.brigaAtiva(s, q);
        const agora = Mot.agora(s);
        if (!br || q.qm.paz === agora) return;
        q.qm.paz = agora;
        const a = s.jog[br.a], b = s.jog[br.b];
        if (U.chance(0.55)) {
            q.qm.briga = null;
            if (a) Mot.mudar(a, 2);
            if (b) Mot.mudar(b, 2);
            UI.toast(`🤝 Deu certo: ${a ? U.esc(a.nome) : ''} e ${b ? U.esc(b.nome) : ''} apertaram as mãos.`);
            Vida.log(s, `🤝 Você reuniu ${a ? U.esc(a.nome) : '?'} e ${b ? U.esc(b.nome) : '?'} e eles fizeram as pazes.`, 'bom');
        } else UI.toast('😤 Não rolou: eles ainda não se olham na cara. Tente de novo na semana que vem.');
        Jogo.manterRolagem = true;
        Jogo.atualizar();
    },
});
