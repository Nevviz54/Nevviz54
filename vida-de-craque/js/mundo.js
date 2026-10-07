'use strict';
// =====================================================================
//  O MUNDO: times, jogadores, ligas, calendário, copas e temporadas
// =====================================================================

const TOTAL_SEMANAS = 46;               // semanas de uma temporada
const SEMANAS_COPA = [8, 18, 28, 40];   // oitavas, quartas, semi e final
const FASES_COPA = ['Oitavas de final', 'Quartas de final', 'Semifinal', 'Final'];
const JANELAS = [[0, 5], [21, 25]];     // janelas de transferência
const COMPOSICAO = { GOL: 3, ZAG: 4, LAT: 4, VOL: 3, MEI: 4, PON: 3, ATA: 3 }; // 24 por elenco

// Copas continentais (16 clubes, mata-mata). Vaga: n = os n primeiros; [a, b] = do a-ésimo ao b-ésimo.
const SEMANAS_COPA2 = [9, 19, 29, 41];
const COPAS_DEF = [
    { id: 'UCL', nome: 'Liga dos Campeões', icone: '⭐', tipo: 'continental', vagas: { ENG1: 4, ESP1: 4, ITA1: 3, GER1: 3, FRA1: 1, NED1: 1 } },
    { id: 'LIB', nome: 'Copa Libertadores', icone: '🏆', tipo: 'continental', vagas: { BRA1: 8, ARG1: 8 } },
    { id: 'CON', nome: 'Concachampions', icone: '🦅', tipo: 'continental', vagas: { MEX1: 8, USA1: 8 } },
    { id: 'UEL', nome: 'Liga Europa', icone: '🟠', tipo: 'secundaria', semanas: SEMANAS_COPA2, vagas: { ENG1: [5, 7], ESP1: [5, 7], ITA1: [4, 6], GER1: [4, 6], FRA1: [2, 3], NED1: [2, 3] } },
    { id: 'SUD', nome: 'Copa Sul-Americana', icone: '🟡', tipo: 'secundaria', semanas: SEMANAS_COPA2, vagas: { BRA1: [9, 16], ARG1: [9, 16] } },
];

// Supercopas (jogo único no começo da temporada): campeão da liga x campeão da copa
const SUPERCOPAS_NAC = [
    { id: 'SBR', pais: 'BRA', liga: 'BRA1', copa: 'CBR', nome: 'Supercopa do Brasil' },
    { id: 'CSH', pais: 'ENG', liga: 'ENG1', copa: 'FAC', nome: 'Community Shield' },
    { id: 'SES', pais: 'ESP', liga: 'ESP1', copa: 'CDR', nome: 'Supercopa de España' },
    { id: 'SIT', pais: 'ITA', liga: 'ITA1', copa: 'CIT', nome: 'Supercoppa Italiana' },
    { id: 'SGE', pais: 'GER', liga: 'GER1', copa: 'DFB', nome: 'DFL-Supercup' },
    { id: 'TDC', pais: 'FRA', liga: 'FRA1', copa: 'CDF', nome: 'Trophée des Champions' },
    { id: 'JCS', pais: 'NED', liga: 'NED1', copa: 'KNV', nome: 'Johan Cruijff Schaal' },
    { id: 'SAR', pais: 'ARG', liga: 'ARG1', copa: 'CAR', nome: 'Supercopa Argentina' },
    { id: 'CDC', pais: 'MEX', liga: 'MEX1', copa: null, nome: 'Campeón de Campeones' },
];
// Supercopas continentais: campeão da copa principal x campeão da copa secundária
const SUPERCOPAS_CONT = [
    { id: 'USC', nome: 'Supercopa da UEFA', icone: '🛡️', a: 'UCL', b: 'UEL' },
    { id: 'REC', nome: 'Recopa Sul-Americana', icone: '🏆', a: 'LIB', b: 'SUD' },
];

// Copas nacionais: mata-mata com os 32 melhores clubes do país
const SEMANAS_COPA_NAC = [3, 12, 23, 33, 43];
const FASES_COPA_NAC = ['1ª fase', 'Oitavas de final', 'Quartas de final', 'Semifinal', 'Final'];
const COPAS_NAC = [
    { id: 'CBR', pais: 'BRA', nome: 'Copa do Brasil' },
    { id: 'FAC', pais: 'ENG', nome: 'FA Cup' },
    { id: 'CDR', pais: 'ESP', nome: 'Copa del Rey' },
    { id: 'CIT', pais: 'ITA', nome: 'Coppa Italia' },
    { id: 'DFB', pais: 'GER', nome: 'DFB-Pokal' },
    { id: 'CDF', pais: 'FRA', nome: 'Coupe de France' },
    { id: 'KNV', pais: 'NED', nome: 'KNVB Beker' },
    { id: 'CAR', pais: 'ARG', nome: 'Copa Argentina' },
    { id: 'USO', pais: 'USA', nome: 'US Open Cup', n: 16 },
];

// Estrutura do clube (níveis 1 a 5)
const INFRA = {
    estadio: { nome: 'Estádio', icone: '🏟️', desc: 'Mais torcida: aumenta a receita e a força jogando em casa.' },
    ct: { nome: 'Centro de Treinamento', icone: '🏋️', desc: 'Os jogadores evoluem mais rápido e recuperam o físico melhor.' },
    base: { nome: 'Categoria de base', icone: '🌱', desc: 'Joias melhores na peneira anual e nos garotos que sobem.' },
};

const Mundo = {
    // -----------------------------------------------------------------
    //  Criação
    // -----------------------------------------------------------------
    criar(ano) {
        const s = {
            versao: 1, ano, semana: 0, seqJ: 1,
            times: [], jog: {}, ligas: [], copas: [], noticias: [],
            campeoes: {}, premios: [], classifFinal: {}, livres: [],
            modo: null, pessoa: null, car: null,
        };
        let tid = 0;
        for (const pais of DADOS.paises) {
            for (const L of pais.ligas) {
                const liga = {
                    id: L.id, pais: pais.id, nome: L.nome, curto: L.curto || L.nome, nivel: L.nivel,
                    troca: L.troca || 0, riqueza: L.riqueza, times: [],
                };
                for (const T of L.times) {
                    const [nome, sigla, forca, c1, c2, jstr] = T;
                    const t = {
                        id: tid++, nome, sigla, c1, c2, liga: L.id, pais: pais.id, rep: forca,
                        saldo: 0, elenco: [], form: U.escolha(['4-3-3', '4-4-2', '4-2-3-1', '4-3-3', '4-2-3-1', '3-5-2']),
                        estilo: 'equilibrado', moral: 50, tit: null,
                    };
                    s.times.push(t);
                    liga.times.push(t.id);
                    Mundo.criarElenco(s, t, jstr || '', pais.nomes, forca, L.riqueza);
                    const somaValor = U.soma(t.elenco, id => Mundo.valor(s.jog[id]));
                    t.saldo = U.redondo((somaValor * 0.07 + 3e6 * L.riqueza) * U.rand(0.7, 1.3));
                }
                s.ligas.push(liga);
                s.campeoes[liga.id] = [];
            }
            // jogadores reais sem clube (aparecem no mercado como "Livre")
            for (const txt of (pais.livres || '').split(',')) {
                const [nome, pos, idade, ovr] = txt.trim().split(':');
                if (!nome || !POS_NOME[pos]) continue;
                const i = parseInt(idade, 10), o = parseInt(ovr, 10);
                const p = Mundo.novoJogador(s, { nome, pos, idade: i, ovr: o, pot: Mundo.potencial(i, o), tid: -1, real: true }, 0.6);
                s.livres.push(p.id);
            }
        }
        Mundo.novaTemporada(s, true);
        return s;
    },

    criarElenco(s, t, jstr, codNomes, forca, riqueza) {
        const cont = { GOL: 0, ZAG: 0, LAT: 0, VOL: 0, MEI: 0, PON: 0, ATA: 0 };
        let reais = 0;
        for (const parte of jstr.split(',')) {
            const txt = parte.trim();
            if (!txt) continue;
            const [nome, pos, idade, ovr] = txt.split(':');
            if (!POS_NOME[pos]) { console.warn('Posição inválida', t.nome, txt); continue; }
            const o = parseInt(ovr, 10), i = parseInt(idade, 10);
            Mundo.novoJogador(s, { nome, pos, idade: i, ovr: o, pot: Mundo.potencial(i, o), tid: t.id, real: true }, riqueza);
            cont[pos]++;
            reais++;
        }
        // Completa o elenco (quanto mais jogadores reais, mais os completos são só garotos da base)
        const desconto = Math.min(12, reais * 0.55);
        for (const pos of POSICOES) {
            while (cont[pos] < COMPOSICAO[pos]) {
                const reserva = cont[pos] >= Math.ceil(COMPOSICAO[pos] / 2);
                Mundo.gerarJogador(s, t, pos, codNomes, forca - (reserva ? 5 : 2) - desconto, riqueza);
                cont[pos]++;
            }
        }
    },

    gerarJogador(s, t, pos, codNomes, base, riqueza, jovem) {
        const idade = jovem ? U.int(16, 18) : U.pesado([18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34], i => (i >= 22 && i <= 30) ? 3 : 1);
        let ovr = Math.round(base + U.normal(0, 3.2) - (idade <= 20 ? 6 : 0));
        if (jovem) ovr = Math.round(base - 14 + U.normal(0, 4));
        ovr = U.clamp(ovr, 38, 88);
        const pot = jovem ? U.clamp(ovr + U.int(8, 30), ovr, 94) : Mundo.potencial(idade, ovr);
        return Mundo.novoJogador(s, { nome: Nomes.gerar(codNomes), pos, idade, ovr, pot, tid: t ? t.id : -1, real: false }, riqueza);
    },

    novoJogador(s, d, riqueza = 1) {
        const p = {
            id: s.seqJ++, nome: d.nome, pos: d.pos, idade: d.idade, ovr: d.ovr, pot: Math.max(d.ovr, d.pot),
            tid: d.tid, real: !!d.real, sal: 0, contr: U.int(1, 4),
            les: 0, susp: 0, amar: 0, cond: 100,
            j: 0, g: 0, a: 0, ns: 0, cj: 0, cg: 0, ca: 0,
        };
        p.sal = Mundo.salarioPedido(p, riqueza);
        s.jog[p.id] = p;
        if (p.tid >= 0) s.times[p.tid].elenco.push(p.id);
        return p;
    },

    potencial(idade, ovr) {
        if (idade <= 19) return Math.min(97, ovr + U.int(7, 20));
        if (idade <= 22) return Math.min(96, ovr + U.int(3, 12));
        if (idade <= 25) return Math.min(95, ovr + U.int(0, 5));
        return ovr + U.int(0, 1);
    },

    // -----------------------------------------------------------------
    //  Valores e salários
    // -----------------------------------------------------------------
    valor(p) {
        let v = 250000 * Math.pow(1.21, p.ovr - 60);
        const i = p.idade;
        v *= i <= 21 ? 1.6 : i <= 24 ? 1.35 : i <= 28 ? 1.1 : i <= 30 ? 0.85 : i <= 32 ? 0.55 : 0.3;
        if (i <= 23) v *= 1 + Math.max(0, p.pot - p.ovr) * 0.03;
        if (p.contr <= 1) v *= 0.75;
        return U.redondo(Math.max(10000, v));
    },

    // Salário anual que o jogador pede
    salarioPedido(p, riqueza = 1) {
        const base = 250000 * Math.pow(1.21, p.ovr - 60) * 0.11;
        const minimo = 15000 + 60000 * riqueza;
        return U.redondo(Math.max(minimo, base * (0.55 + riqueza * 0.35)));
    },

    riquezaDoTime(s, t) {
        return Mundo.liga(s, t.liga).riqueza;
    },

    // -----------------------------------------------------------------
    //  Consultas
    // -----------------------------------------------------------------
    liga: (s, id) => s.ligas.find(l => l.id === id),
    copa: (s, id) => s.copas.find(c => c.id === id),
    semanasCopa: c => c.semanas || SEMANAS_COPA,
    fasesCopa: c => c.fases || FASES_COPA,
    ehFinal: (s, jogo) => jogo.tipo === 'copa' && jogo.r === Mundo.fasesCopa(Mundo.copa(s, jogo.comp)).length - 1,

    // Clássicos (rivalidades definidas em js/dados/rivais.js)
    classico(s, h, a) {
        if (!Mundo._rivais) {
            Mundo._rivais = new Set();
            for (const [x, y] of (DADOS.rivais || [])) { Mundo._rivais.add(x + '|' + y); Mundo._rivais.add(y + '|' + x); }
        }
        return Mundo._rivais.has(s.times[h].nome + '|' + s.times[a].nome);
    },

    // Estrutura do clube: cria os níveis na primeira consulta
    infra(t) {
        if (!t.infra) {
            const n = U.clamp(Math.round((t.rep - 48) / 8), 1, 5);
            t.infra = { estadio: n, ct: U.clamp(n + U.int(-1, 0), 1, 5), base: U.clamp(n + U.int(-1, 1), 1, 5) };
        }
        return t.infra;
    },
    pais: id => DADOS.paises.find(p => p.id === id),
    elenco: (s, t) => t.elenco.map(id => s.jog[id]).filter(Boolean),

    forca(s, t) {
        const top = Mundo.elenco(s, t).map(p => p.ovr).sort((a, b) => b - a).slice(0, 14);
        return top.length ? U.media(top) : 40;
    },

    emJanela(s) {
        return JANELAS.some(([a, b]) => s.semana >= a && s.semana <= b);
    },

    nomeCompeticao(s, comp) {
        const l = Mundo.liga(s, comp);
        if (l) return l.nome;
        const c = Mundo.copa(s, comp);
        return c ? c.nome : comp;
    },

    // -----------------------------------------------------------------
    //  Calendário
    // -----------------------------------------------------------------
    roundRobin(ids, turnos) {
        const t = U.embaralhar(ids.slice());
        if (t.length % 2) t.push(-1);
        const n = t.length, rodadas = [];
        for (let r = 0; r < n - 1; r++) {
            const jogos = [];
            for (let i = 0; i < n / 2; i++) {
                const a = t[i], b = t[n - 1 - i];
                if (a < 0 || b < 0) continue;
                jogos.push((r + i) % 2 === 0 ? [a, b] : [b, a]);
            }
            rodadas.push(jogos);
            t.splice(1, 0, t.pop());
        }
        if (turnos === 2) rodadas.push(...rodadas.map(r => r.map(([a, b]) => [b, a])));
        return rodadas;
    },

    novaTemporada(s, inicial) {
        for (const liga of s.ligas) {
            const turnos = liga.times.length > 24 ? 1 : 2;
            liga.rodadas = Mundo.roundRobin(liga.times, turnos);
            const R = liga.rodadas.length;
            liga.sem = liga.rodadas.map((_, r) => Math.floor(r * TOTAL_SEMANAS / R));
            liga.res = liga.rodadas.map(() => []);
            liga.tab = {};
            for (const tid of liga.times) liga.tab[tid] = { j: 0, v: 0, e: 0, d: 0, gp: 0, gc: 0, pts: 0, ult: [] };
        }
        for (const p of Object.values(s.jog)) {
            p.cj += p.j; p.cg += p.g; p.ca += p.a;
            p.j = 0; p.g = 0; p.a = 0; p.ns = 0; p.amar = 0; p.susp = 0;
        }
        Mundo.montarCopas(s, inicial);
    },

    // classificação final da última temporada (ou, no começo do jogo, pela reputação)
    ordemDaLiga(s, liga, inicial) {
        return (!inicial && s.classifFinal[liga.id])
            ? s.classifFinal[liga.id].filter(tid => liga.times.includes(tid))
            : liga.times.slice().sort((a, b) => s.times[b].rep - s.times[a].rep);
    },

    // último campeão de uma competição (null se não houver)
    ultimoCampeao(s, id) {
        const lista = s.campeoes[id];
        return lista && lista.length ? lista[lista.length - 1].tid : null;
    },

    novaCopa(s, d) {
        const ids = d.times;
        const jogos = [[]];
        for (let i = 0; i + 1 < ids.length; i += 2) jogos[0].push([ids[i], ids[i + 1]]);
        const c = Object.assign({ fase: 0, jogos, res: [[]], campeao: null }, d);
        s.copas.push(c);
        s.campeoes[c.id] = s.campeoes[c.id] || [];
        return c;
    },

    montarCopas(s, inicial) {
        // campeões da temporada passada, antes de recriar as copas
        const antes = {};
        for (const c of s.copas || []) antes[c.id] = c.campeao;
        s.copas = [];
        for (const def of COPAS_DEF) {
            const ids = [];
            for (const [ligaId, v] of Object.entries(def.vagas)) {
                const liga = Mundo.liga(s, ligaId);
                if (!liga) continue;
                const ordem = Mundo.ordemDaLiga(s, liga, inicial);
                ids.push(...(Array.isArray(v) ? ordem.slice(v[0] - 1, v[1]) : ordem.slice(0, v)));
            }
            if (ids.length < 16) continue;
            Mundo.novaCopa(s, { id: def.id, nome: def.nome, icone: def.icone, tipo: def.tipo, times: U.embaralhar(ids), semanas: def.semanas || SEMANAS_COPA, fases: FASES_COPA });
        }
        for (const def of COPAS_NAC) {
            const ligas = s.ligas.filter(l => l.pais === def.pais).sort((a, b) => a.nivel - b.nivel);
            if (!ligas.length) continue;
            const ids = [];
            for (const l of ligas) ids.push(...l.times.slice().sort((a, b) => s.times[b].rep - s.times[a].rep));
            const n = def.n || 32;
            if (ids.length < n) continue;
            Mundo.novaCopa(s, {
                id: def.id, pais: def.pais, nome: def.nome, icone: '🥇', tipo: 'nacional', times: U.embaralhar(ids.slice(0, n)),
                semanas: n === 16 ? SEMANAS_COPA_NAC.slice(1) : SEMANAS_COPA_NAC, fases: n === 16 ? FASES_COPA_NAC.slice(1) : FASES_COPA_NAC,
            });
        }
        // supercopas nacionais (semana 1)
        for (const def of SUPERCOPAS_NAC) {
            const liga = Mundo.liga(s, def.liga);
            if (!liga) continue;
            const ordem = Mundo.ordemDaLiga(s, liga, inicial);
            const a = ordem[0];
            let b = def.copa ? (inicial ? null : (antes[def.copa] != null ? antes[def.copa] : Mundo.ultimoCampeao(s, def.copa))) : null;
            if (b == null || b === a) b = ordem[1];
            if (a == null || b == null) continue;
            Mundo.novaCopa(s, { id: def.id, pais: def.pais, nome: def.nome, icone: '🛡️', tipo: 'supercopa', times: [a, b], semanas: [1], fases: ['Final'] });
        }
        // supercopas continentais (semana 2)
        for (const def of SUPERCOPAS_CONT) {
            const ca = Mundo.copa(s, def.a), cb = Mundo.copa(s, def.b);
            if (!ca || !cb) continue;
            const porRep = c => c.times.slice().sort((x, y) => s.times[y].rep - s.times[x].rep)[0];
            const a = (!inicial && antes[def.a] != null) ? antes[def.a] : porRep(ca);
            let b = (!inicial && antes[def.b] != null) ? antes[def.b] : porRep(cb);
            if (b === a) b = cb.times.find(t => t !== a);
            Mundo.novaCopa(s, { id: def.id, nome: def.nome, icone: def.icone, tipo: 'supercopa', times: [a, b], semanas: [2], fases: ['Final'] });
        }
    },

    // Mundial de Clubes: no fim da temporada, com os campeões continentais.
    // Libertadores x Concachampions na semifinal; o campeão europeu espera na final.
    criarMundial(s) {
        if (Mundo.copa(s, 'MUN')) return;
        const camp = id => { const c = Mundo.copa(s, id); return c ? c.campeao : undefined; };
        const ucl = camp('UCL'), lib = camp('LIB'), con = camp('CON');
        if (ucl == null || lib == null || con === null) return; // alguma ainda não terminou
        if (con != null) {
            Mundo.novaCopa(s, { id: 'MUN', nome: 'Mundial de Clubes', icone: '🌍', tipo: 'mundial', times: [lib, con, ucl], semanas: [43, 45], fases: ['Semifinal', 'Final'], byes: { 1: [ucl] } });
            Mundo.copa(s, 'MUN').jogos = [[[lib, con]]];
        } else {
            Mundo.novaCopa(s, { id: 'MUN', nome: 'Mundial de Clubes', icone: '🌍', tipo: 'mundial', times: [lib, ucl], semanas: [45], fases: ['Final'] });
        }
        Mundo.noticia(s, `🌍 Definidos os participantes do Mundial de Clubes: ${[lib, con, ucl].filter(x => x != null).map(t => s.times[t].nome).join(', ')}.`, 'geral');
    },

    partidasDaSemana(s, semana = s.semana) {
        const lista = [];
        for (const liga of s.ligas) {
            const r = liga.sem.indexOf(semana);
            if (r >= 0) for (const [h, a] of liga.rodadas[r]) lista.push({ tipo: 'liga', comp: liga.id, r, h, a });
        }
        for (const c of s.copas) {
            const f = Mundo.semanasCopa(c).indexOf(semana);
            if (f >= 0 && c.fase === f && c.campeao == null && c.jogos[f]) {
                for (const [h, a] of c.jogos[f]) lista.push({ tipo: 'copa', comp: c.id, r: f, h, a });
            }
        }
        return lista;
    },

    // Próximos jogos de um time (para o calendário)
    calendarioDoTime(s, tid) {
        const lista = [];
        const liga = Mundo.liga(s, s.times[tid].liga);
        liga.rodadas.forEach((jogos, r) => {
            const j = jogos.find(([h, a]) => h === tid || a === tid);
            if (!j) return;
            const res = liga.res[r].find(x => x.h === j[0] && x.a === j[1]);
            lista.push({ sem: liga.sem[r], comp: liga.id, nomeComp: liga.curto, rodada: `Rodada ${r + 1}`, h: j[0], a: j[1], res });
        });
        for (const c of s.copas) {
            c.jogos.forEach((jogos, f) => {
                const j = jogos.find(([h, a]) => h === tid || a === tid);
                if (!j) return;
                const res = (c.res[f] || []).find(x => x.h === j[0] && x.a === j[1]);
                lista.push({ sem: Mundo.semanasCopa(c)[f], comp: c.id, nomeComp: c.nome, rodada: Mundo.fasesCopa(c)[f], h: j[0], a: j[1], res });
            });
        }
        return lista.sort((a, b) => a.sem - b.sem);
    },

    // -----------------------------------------------------------------
    //  Resultados
    // -----------------------------------------------------------------
    registrar(s, jogo, r) {
        if (jogo.tipo === 'liga') {
            const liga = Mundo.liga(s, jogo.comp);
            liga.res[jogo.r].push({ h: jogo.h, a: jogo.a, gh: r.gh, ga: r.ga });
            const th = liga.tab[jogo.h], ta = liga.tab[jogo.a];
            th.j++; ta.j++;
            th.gp += r.gh; th.gc += r.ga; ta.gp += r.ga; ta.gc += r.gh;
            if (r.gh > r.ga) { th.v++; ta.d++; th.pts += 3; th.ult.push('V'); ta.ult.push('D'); }
            else if (r.gh < r.ga) { ta.v++; th.d++; ta.pts += 3; th.ult.push('D'); ta.ult.push('V'); }
            else { th.e++; ta.e++; th.pts++; ta.pts++; th.ult.push('E'); ta.ult.push('E'); }
            if (th.ult.length > 5) th.ult.shift();
            if (ta.ult.length > 5) ta.ult.shift();
        } else {
            const c = Mundo.copa(s, jogo.comp);
            const f = jogo.r;
            c.res[f].push({ h: jogo.h, a: jogo.a, gh: r.gh, ga: r.ga, venc: r.venc, pen: r.pen || null });
            if (c.res[f].length === c.jogos[f].length) {
                const venc = c.jogos[f].map(([h, a]) => c.res[f].find(x => x.h === h && x.a === a).venc);
                if (f === Mundo.fasesCopa(c).length - 1) {
                    c.campeao = venc[0];
                    s.campeoes[c.id] = s.campeoes[c.id] || [];
                    s.campeoes[c.id].push({ ano: s.ano, tid: venc[0] });
                    Mundo.noticia(s, `${c.icone} ${s.times[venc[0]].nome} conquista ${c.nome} ${s.ano}!`, 'titulo');
                    if (c.tipo === 'continental') Mundo.criarMundial(s);
                } else {
                    c.fase = f + 1;
                    c.jogos[f + 1] = [];
                    c.res[f + 1] = [];
                    const prox = venc.concat((c.byes && c.byes[f + 1]) || []);
                    for (let i = 0; i + 1 < prox.length; i += 2) c.jogos[f + 1].push([prox[i], prox[i + 1]]);
                }
            }
        }
        Mot.aposJogo(s, jogo, r);
        // moral do time (clássico pesa mais)
        const peso = Mundo.classico(s, jogo.h, jogo.a) ? 1.6 : 1;
        for (const [tid, gf, gc] of [[jogo.h, r.gh, r.ga], [jogo.a, r.ga, r.gh]]) {
            const t = s.times[tid];
            t.moral = U.clamp(t.moral + ((gf > gc ? 6 : gf < gc ? -6 : 0) + (gf - gc)) * peso, 10, 95);
            t.moral += (50 - t.moral) * 0.05;
        }
    },

    classificacao(s, liga) {
        return liga.times.slice().sort((a, b) => {
            const A = liga.tab[a], B = liga.tab[b];
            return (B.pts - A.pts) || (B.v - A.v) || ((B.gp - B.gc) - (A.gp - A.gc)) || (B.gp - A.gp) || s.times[a].nome.localeCompare(s.times[b].nome);
        });
    },

    posicaoNaLiga(s, tid) {
        const liga = Mundo.liga(s, s.times[tid].liga);
        return Mundo.classificacao(s, liga).indexOf(tid) + 1;
    },

    // Simula as partidas da semana que não são do usuário
    simularSemana(s, ignorar) {
        for (const jogo of Mundo.partidasDaSemana(s)) {
            if (ignorar && ignorar(jogo)) continue;
            const m = Partida.criar(s, jogo);
            Partida.simularAteOFim(m);
            const r = Partida.finalizar(s, m);
            Mundo.registrar(s, jogo, r);
        }
    },

    // Manutenção semanal de todo mundo
    posSemana(s) {
        for (const p of Object.values(s.jog)) {
            if (p.les > 0) p.les--;
            p.cond = Math.min(100, p.cond + 18);
        }
        if (Mundo.emJanela(s)) Mundo.transferenciasIA(s, U.int(4, 10));
        // times com elenco curto contratam livres
        for (const t of s.times) {
            if (Mundo.timeDoUsuario(s, t.id)) continue;
            if (t.elenco.length < 20) Mundo.reforcarElenco(s, t, 22);
        }
        s.semana++;
    },

    timeDoUsuario(s, tid) {
        return s.modo === 'tecnico' && s.car && s.car.tid === tid;
    },

    // -----------------------------------------------------------------
    //  Transferências
    // -----------------------------------------------------------------
    transferir(s, p, destino, preco) {
        const origem = p.tid >= 0 ? s.times[p.tid] : null;
        if (origem) {
            origem.elenco = origem.elenco.filter(id => id !== p.id);
            origem.saldo += preco;
            if (origem.tit) origem.tit = origem.tit.map(id => id === p.id ? null : id);
        } else {
            s.livres = s.livres.filter(id => id !== p.id);
        }
        destino.saldo -= preco;
        destino.elenco.push(p.id);
        if (s.car && s.car.capitao === p.id && Mundo.timeDoUsuario(s, origem ? origem.id : -1)) s.car.capitao = null;
        p.tid = destino.id;
        p.contr = U.int(2, 5);
        p.sal = Math.max(p.sal, Mundo.salarioPedido(p, Mundo.riquezaDoTime(s, destino)));
        p.cond = 100;
    },

    liberar(s, p) {
        const t = s.times[p.tid];
        if (t) {
            t.elenco = t.elenco.filter(id => id !== p.id);
            if (t.tit) t.tit = t.tit.map(id => id === p.id ? null : id);
        }
        p.tid = -1;
        if (!p.user) s.livres.push(p.id);
    },

    transferenciasIA(s, qtd) {
        // só jogadores de clube ou livres (fora: base do usuário e jogadores que só existem na seleção)
        const todos = Object.values(s.jog).filter(p => p.tid >= -1);
        for (let k = 0; k < qtd; k++) {
            const comprador = U.escolha(s.times);
            if (Mundo.timeDoUsuario(s, comprador.id)) continue;
            const esc = Escalacao.auto(s, comprador);
            const slots = FORMACOES[comprador.form];
            let piorI = -1, piorV = 1e9;
            esc.forEach((pid, i) => {
                const v = pid ? Escalacao.efetivo(s.jog[pid], slots[i][0]) : 0;
                if (v < piorV) { piorV = v; piorI = i; }
            });
            if (piorI < 0) continue;
            const pos = slots[piorI][0];
            let melhor = null;
            for (let tent = 0; tent < 400; tent++) {
                const p = todos[Math.floor(Math.random() * todos.length)];
                if (!p || p.pos !== pos || p.user || p.les > 0) continue;
                if (p.tid === comprador.id) continue;
                if (p.ovr < piorV + 3 || p.idade > 33) continue;
                const dono = p.tid >= 0 ? s.times[p.tid] : null;
                if (dono && Mundo.timeDoUsuario(s, dono.id)) continue;
                if (dono && dono.rep > comprador.rep + 4) continue;
                const preco = dono ? Mundo.valor(p) * U.rand(1.0, 1.3) : 0;
                if (preco > comprador.saldo * 0.85) continue;
                if (dono && dono.elenco.length <= 19) continue;
                if (!melhor || p.ovr > melhor.p.ovr) melhor = { p, preco: U.redondo(preco) };
            }
            if (!melhor) continue;
            const { p, preco } = melhor;
            const origem = p.tid >= 0 ? s.times[p.tid] : null;
            Mundo.transferir(s, p, comprador, preco);
            if (preco >= 12e6 || p.ovr >= 80 || comprador.rep >= 82) {
                Mundo.noticia(s, origem
                    ? `💸 ${p.nome} (${p.ovr}) troca o ${origem.nome} pelo ${comprador.nome} por ${U.dinheiro(preco)}.`
                    : `✍️ ${comprador.nome} contrata ${p.nome} (${p.ovr}), que estava sem clube.`, 'transfer');
            }
        }
    },

    reforcarElenco(s, t, alvo) {
        const liga = Mundo.liga(s, t.liga);
        while (t.elenco.length < alvo) {
            const cont = {};
            for (const p of Mundo.elenco(s, t)) cont[p.pos] = (cont[p.pos] || 0) + 1;
            const pos = POSICOES.slice().sort((a, b) => ((cont[a] || 0) / COMPOSICAO[a]) - ((cont[b] || 0) / COMPOSICAO[b]))[0];
            // tenta um livre de nível parecido
            const idx = s.livres.findIndex(id => {
                const p = s.jog[id];
                return p && p.pos === pos && p.ovr <= t.rep + 2 && p.ovr >= t.rep - 12;
            });
            if (idx >= 0) {
                const p = s.jog[s.livres[idx]];
                Mundo.transferir(s, p, t, 0);
            } else {
                Mundo.gerarJogador(s, t, pos, Mundo.pais(t.pais).nomes, t.rep - 5, liga.riqueza);
            }
        }
    },

    // -----------------------------------------------------------------
    //  Fim de temporada
    // -----------------------------------------------------------------
    fimDeTemporada(s) {
        const resumo = { ano: s.ano, campeoes: [], subiram: [], desceram: [], premios: [], copas: [] };
        for (const c of s.copas) if (c.campeao != null) resumo.copas.push({ id: c.id, nome: c.nome, icone: c.icone, tid: c.campeao, tipo: c.tipo, pais: c.pais });

        // Campeões e classificação final
        for (const liga of s.ligas) {
            const cl = Mundo.classificacao(s, liga);
            s.classifFinal[liga.id] = cl;
            s.campeoes[liga.id].push({ ano: s.ano, tid: cl[0] });
            resumo.campeoes.push({ liga: liga.nome, ligaId: liga.id, nivel: liga.nivel, tid: cl[0] });
            // artilheiro
            let art = null;
            for (const tid of liga.times) for (const p of Mundo.elenco(s, s.times[tid])) if (!art || p.g > art.g) art = p;
            if (art && art.g > 0) {
                const pr = { ano: s.ano, tipo: `Artilheiro — ${liga.curto}`, pid: art.id, nome: art.nome, tid: art.tid, info: `${art.g} gols` };
                s.premios.push(pr);
                resumo.premios.push(pr);
            }
        }

        // Melhor do mundo
        let melhor = null, mv = -1;
        for (const p of Object.values(s.jog)) {
            if (p.j < 12 || p.tid < 0) continue;
            const liga = Mundo.liga(s, s.times[p.tid].liga);
            const v = p.ovr + (p.ns / p.j - 6.5) * 6 + p.g * 0.22 + p.a * 0.12 - (liga.nivel - 1) * 8 + (liga.riqueza - 1) * 2;
            if (v > mv) { mv = v; melhor = p; }
        }
        if (melhor) {
            const pr = { ano: s.ano, tipo: 'Bola de Ouro', pid: melhor.id, nome: melhor.nome, tid: melhor.tid, info: `${melhor.g} gols, ${melhor.a} assist.` };
            s.premios.push(pr);
            resumo.premios.unshift(pr);
        }
        // Revelação (até 21 anos) e Luva de Ouro (goleiros)
        let rev = null, rv = -1, luva = null, lv = -1;
        for (const p of Object.values(s.jog)) {
            if (p.tid < 0 || p.j < 10) continue;
            const liga = Mundo.liga(s, s.times[p.tid].liga);
            const media = p.ns / p.j;
            if (p.idade <= 21) {
                const v = p.ovr + (media - 6.5) * 5 + p.g * 0.2 + p.a * 0.1 - (liga.nivel - 1) * 6;
                if (v > rv) { rv = v; rev = p; }
            }
            if (p.pos === 'GOL' && p.j >= 15) {
                const v = p.ovr * 0.6 + media * 4 - (liga.nivel - 1) * 6 + (liga.riqueza - 1) * 2;
                if (v > lv) { lv = v; luva = p; }
            }
        }
        if (rev) {
            const pr = { ano: s.ano, tipo: 'Prêmio Revelação', pid: rev.id, nome: rev.nome, tid: rev.tid, info: `${rev.idade} anos, nota ${(rev.ns / rev.j).toFixed(2)}` };
            s.premios.push(pr);
            resumo.premios.splice(1, 0, pr);
        }
        if (luva) {
            const pr = { ano: s.ano, tipo: 'Luva de Ouro', pid: luva.id, nome: luva.nome, tid: luva.tid, info: `nota ${(luva.ns / luva.j).toFixed(2)}` };
            s.premios.push(pr);
            resumo.premios.splice(2, 0, pr);
        }
        // Técnico do Ano: quem mais superou as expectativas numa liga principal
        let tec = null, tv = -1e9;
        for (const liga of s.ligas.filter(l => l.nivel === 1)) {
            const cl = Mundo.classificacao(s, liga);
            const porForca = liga.times.slice().sort((a, b) => Mundo.forca(s, s.times[b]) - Mundo.forca(s, s.times[a]));
            cl.forEach((tid, i) => {
                const v = (porForca.indexOf(tid) - i) + (i === 0 ? 4 : 0) + liga.riqueza;
                if (v > tv) { tv = v; tec = tid; }
            });
        }
        if (tec != null) {
            const pr = { ano: s.ano, tipo: 'Técnico do Ano', pid: null, tid: tec, nome: Mundo.timeDoUsuario(s, tec) ? s.pessoa.nome : `Técnico do ${s.times[tec].nome}`, info: s.times[tec].nome };
            s.premios.push(pr);
            resumo.premios.push(pr);
        }

        // Acesso e rebaixamento
        for (const pais of DADOS.paises) {
            const ligas = s.ligas.filter(l => l.pais === pais.id).sort((a, b) => a.nivel - b.nivel);
            for (let i = 0; i + 1 < ligas.length; i++) {
                const cima = ligas[i], baixo = ligas[i + 1], n = cima.troca;
                if (!n) continue;
                const desce = s.classifFinal[cima.id].slice(-n);
                const sobe = s.classifFinal[baixo.id].slice(0, n);
                cima.times = cima.times.filter(t => !desce.includes(t)).concat(sobe);
                baixo.times = baixo.times.filter(t => !sobe.includes(t)).concat(desce);
                for (const t of sobe) { s.times[t].liga = cima.id; resumo.subiram.push({ tid: t, liga: cima.nome }); }
                for (const t of desce) { s.times[t].liga = baixo.id; resumo.desceram.push({ tid: t, liga: baixo.nome }); }
            }
        }

        // Dinheiro de premiação para os times da IA
        for (const liga of s.ligas) {
            const cl = s.classifFinal[liga.id];
            cl.forEach((tid, i) => {
                const t = s.times[tid];
                if (Mundo.timeDoUsuario(s, tid)) return;
                t.saldo += U.redondo(liga.riqueza * 9e6 * (1.4 - i / cl.length) * U.rand(0.8, 1.2));
            });
        }

        // Evolução, aposentadoria e contratos
        const aposentados = [];
        for (const p of Object.values(s.jog)) {
            if (p.user) continue;
            p.idade++;
            if (p.base != null) continue; // garotos da base evoluem com o treino semanal
            Mundo.evoluir(p, p.tid >= 0 && Mundo.timeDoUsuario(s, p.tid) ? 0.8 + Mundo.infra(s.times[p.tid]).ct * 0.12 : 1);
            const vaiParar = (p.idade >= 40) || (p.idade >= 35 && U.chance((p.idade - 33) * 0.22)) || (p.idade >= 31 && p.ovr < 50 && U.chance(0.5));
            if (vaiParar) {
                aposentados.push(p);
                continue;
            }
            p.contr--;
            if (p.contr <= 0) {
                if (p.tid < 0) continue;
                const t = s.times[p.tid];
                if (Mundo.timeDoUsuario(s, t.id)) {
                    Mundo.noticia(s, `📄 O contrato de ${p.nome} com o ${t.nome} acabou e ele saiu de graça.`, 'clube');
                    Mundo.liberar(s, p);
                } else if (U.chance(0.82)) {
                    p.contr = U.int(1, 4);
                    p.sal = Mundo.salarioPedido(p, Mundo.riquezaDoTime(s, t));
                } else {
                    Mundo.liberar(s, p);
                }
            }
        }
        for (const p of aposentados) {
            if (p.real && p.ovr >= 78) Mundo.noticia(s, `👋 ${p.nome} anuncia a aposentadoria aos ${p.idade} anos.`, 'geral');
            if (p.tid >= 0) Mundo.liberar(s, p);
            s.livres = s.livres.filter(id => id !== p.id);
            delete s.jog[p.id];
        }
        // livres antigos demais somem do mercado
        s.livres = s.livres.filter(id => s.jog[id]);
        if (s.livres.length > 600) {
            // some primeiro quem foi gerado pelo jogo; os jogadores reais sem clube ficam
            const ordem = s.livres.slice().sort((a, b) => (s.jog[a].real ? 1 : 0) - (s.jog[b].real ? 1 : 0));
            const fora = new Set(ordem.slice(0, s.livres.length - 600));
            for (const id of fora) delete s.jog[id];
            s.livres = s.livres.filter(id => !fora.has(id));
        }

        // Base: cada time revela jovens, e elencos são ajustados
        // (o clube do técnico-usuário tem a própria categoria de base: js/base.js)
        for (const t of s.times) {
            const liga = Mundo.liga(s, t.liga);
            const nJovens = Mundo.timeDoUsuario(s, t.id) ? 0 : U.int(1, 2);
            for (let i = 0; i < nJovens; i++) {
                Mundo.gerarJogador(s, t, U.escolha(POSICOES.concat(['MEI', 'ATA', 'ZAG'])), Mundo.pais(t.pais).nomes, t.rep, liga.riqueza, true);
            }
            if (Mundo.timeDoUsuario(s, t.id)) {
                if (t.elenco.length < 18) Mundo.reforcarElenco(s, t, 18);
                continue;
            }
            const el = Mundo.elenco(s, t);
            if (el.length > 28) {
                el.sort((a, b) => (a.ovr - a.idade * 0.3) - (b.ovr - b.idade * 0.3));
                for (const p of el.slice(0, el.length - 27)) Mundo.liberar(s, p);
            }
            if (t.elenco.length < 22) Mundo.reforcarElenco(s, t, 22);
            t.rep = Math.round((t.rep * 0.8 + Mundo.forca(s, t) * 0.2) * 10) / 10;
            t.moral = 50;
        }

        s.ano++;
        s.semana = 0;
        Mundo.novaTemporada(s, false);
        return resumo;
    },

    evoluir(p, fator = 1) {
        const gap = Math.max(0, p.pot - p.ovr);
        let d;
        if (p.idade <= 21) d = gap * U.rand(0.18, 0.42) * fator + (p.j >= 15 ? 1 : 0);
        else if (p.idade <= 24) d = gap * U.rand(0.15, 0.4) * fator + (p.j >= 15 ? 0.5 : 0);
        else if (p.idade <= 28) d = U.rand(-1, 1.6);
        else if (p.idade <= 30) d = U.rand(-2, 0.6);
        else if (p.idade <= 32) d = U.rand(-3.5, 0);
        else d = U.rand(-5.5, -1);
        p.ovr = U.clamp(Math.round(p.ovr + d), 35, 99);
        if (p.idade <= 25 && p.ovr < p.pot) p.ovr = Math.min(p.ovr, p.pot);
        if (p.ovr > p.pot) p.pot = p.ovr;
    },

    noticia(s, txt, tipo = 'geral') {
        s.noticias.unshift({ ano: s.ano, sem: s.semana, txt, tipo });
        if (s.noticias.length > 120) s.noticias.length = 120;
    },
};

// =====================================================================
//  Escalação automática
// =====================================================================
const Escalacao = {
    disponivel: p => p && p.les <= 0 && p.susp <= 0 && !(p.folga > 0),

    efetivo(p, slot) {
        return p.ovr - penalidadePos(p.pos, slot) - Math.max(0, 75 - p.cond) * 0.25 + Mot.bonus(p);
    },

    auto(s, t, form = t.form, ruido = 0) {
        const slots = FORMACOES[form];
        const nota = new Map();
        const disp = Mundo.elenco(s, t).filter(Escalacao.disponivel);
        for (const p of disp) nota.set(p.id, p.ovr + (ruido ? U.normal(0, ruido) : 0) + (p.bonusEscala || 0) + (p.bonusFixo || 0) - Math.max(0, 75 - p.cond) * 0.25 + Mot.bonus(p));
        disp.sort((a, b) => nota.get(b.id) - nota.get(a.id));
        const usados = new Set();
        const res = new Array(slots.length).fill(null);
        // 1) posição de origem
        slots.forEach(([pos], i) => {
            const p = disp.find(p => !usados.has(p.id) && p.pos === pos);
            if (p) { res[i] = p.id; usados.add(p.id); }
        });
        // 2) completa buracos com o melhor rendimento
        slots.forEach(([pos], i) => {
            if (res[i] != null) return;
            let best = null, bv = -1e9;
            for (const p of disp) {
                if (usados.has(p.id)) continue;
                const v = nota.get(p.id) - penalidadePos(p.pos, pos);
                if (v > bv) { bv = v; best = p; }
            }
            if (best) { res[i] = best.id; usados.add(best.id); }
        });
        // 3) troca se algum reserva rende bem mais fora de posição
        slots.forEach(([pos], i) => {
            if (pos === 'GOL' || res[i] == null) return;
            const atual = nota.get(res[i]) - penalidadePos(s.jog[res[i]].pos, pos);
            let best = null, bv = atual + 3;
            for (const p of disp) {
                if (usados.has(p.id) || p.pos === 'GOL') continue;
                const v = nota.get(p.id) - penalidadePos(p.pos, pos);
                if (v > bv) { bv = v; best = p; }
            }
            if (best) { usados.delete(res[i]); res[i] = best.id; usados.add(best.id); }
        });
        return res;
    },

    banco(s, t, titulares, n = 9) {
        const usados = new Set(titulares);
        const disp = Mundo.elenco(s, t).filter(p => Escalacao.disponivel(p) && !usados.has(p.id)).sort((a, b) => b.ovr - a.ovr);
        const banco = [];
        const gol = disp.find(p => p.pos === 'GOL');
        if (gol) banco.push(gol.id);
        for (const p of disp) {
            if (banco.length >= n) break;
            if (!banco.includes(p.id)) banco.push(p.id);
        }
        return banco;
    },

    // Escalação do time: manual (se válida) ou automática
    doTime(s, t, ruido = 0) {
        if (t.tit && t.tit.length === FORMACOES[t.form].length) {
            const ok = t.tit.every(id => id != null && s.jog[id] && s.jog[id].tid === t.id && Escalacao.disponivel(s.jog[id]));
            if (ok && new Set(t.tit).size === t.tit.length) return t.tit.slice();
            // completa automaticamente o que estiver faltando
            const auto = Escalacao.auto(s, t);
            const usados = new Set();
            const res = t.tit.map(id => {
                if (id != null && s.jog[id] && s.jog[id].tid === t.id && Escalacao.disponivel(s.jog[id]) && !usados.has(id)) { usados.add(id); return id; }
                return null;
            });
            for (let i = 0; i < res.length; i++) {
                if (res[i] != null) continue;
                const slot = FORMACOES[t.form][i][0];
                const cand = Mundo.elenco(s, t).filter(p => Escalacao.disponivel(p) && !usados.has(p.id))
                    .sort((a, b) => Escalacao.efetivo(b, slot) - Escalacao.efetivo(a, slot))[0];
                if (cand) { res[i] = cand.id; usados.add(cand.id); }
            }
            return res.map((id, i) => id != null ? id : auto[i]);
        }
        return Escalacao.auto(s, t, t.form, ruido);
    },
};
