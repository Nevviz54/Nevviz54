'use strict';
// =====================================================================
//  SELEÇÕES
//  Convocação (craques reais dos clubes + quem joga fora das ligas do
//  jogo + gerados), jogos nas Datas FIFA, torneios no fim da temporada
//  (Copa do Mundo, Eurocopa, Copa América, Copa Ouro, Copa Africana e
//  Copa da Ásia), jogador convocado e técnico de seleção.
// =====================================================================

const DATAS_FIFA = [10, 20, 32];        // semanas com 2 jogos de seleção cada
const MIN_POS_SEL = { GOL: 3, ZAG: 4, LAT: 4, VOL: 3, MEI: 4, PON: 3, ATA: 3 };
const TAM_CONVOCACAO = 26;
const NOMES_FASE_KO = { 32: '16 avos de final', 16: 'Oitavas de final', 8: 'Quartas de final', 4: 'Semifinal', 2: 'Final' };

const Selecoes = {
    nacao: id => NACOES.find(n => n.id === id),
    nacoesDe: confed => NACOES.filter(n => n.confed === confed).sort((a, b) => b.forca - a.forca),

    estado(s, id) {
        s.sel = s.sel || {};
        if (!s.sel[id]) s.sel[id] = { pool: null };
        return s.sel[id];
    },

    // índice dos jogadores dos clubes (e livres) por nome, para achar os craques
    indice(s) {
        const idx = new Map();
        for (const p of Object.values(s.jog)) {
            if (p.tid < -1 || p.aposentado) continue;
            const k = U.semAcento(p.nome);
            const ja = idx.get(k);
            if (!ja || (p.real && !ja.real) || (p.real === ja.real && p.ovr > ja.ovr)) idx.set(k, p);
        }
        return idx;
    },

    // todos os jogadores que podem ser convocados
    pool(s, id, idx) {
        const n = Selecoes.nacao(id), st = Selecoes.estado(s, id);
        if (!st.pool) {
            st.pool = [];
            for (const txt of (n.extras || '').split(',')) {
                const [nome, pos, idade, ovr] = txt.trim().split(':');
                if (!nome || !POS_NOME[pos]) continue;
                const p = Mundo.novoJogador(s, { nome, pos, idade: +idade, ovr: +ovr, pot: Mundo.potencial(+idade, +ovr), tid: -5, real: true }, 0.8);
                p.sel = id;
                st.pool.push(p.id);
            }
        }
        st.pool = st.pool.filter(pid => s.jog[pid] && !s.jog[pid].aposentado);
        idx = idx || Selecoes.indice(s);
        const lista = [], vistos = new Set();
        const add = p => { if (p && !vistos.has(p.id)) { vistos.add(p.id); lista.push(p); } };
        for (const nome of (n.craques || '').split(',')) if (nome.trim()) add(idx.get(U.semAcento(nome)));
        for (const pid of st.pool) add(s.jog[pid]);
        // o jogador do modo carreira entra na disputa pela vaga do país dele
        if (s.modo === 'jogador' && s.pessoa.pais === id && s.car && s.car.pid != null) {
            const u = s.jog[s.car.pid];
            if (u && !u.aposentado) add(u);
        }
        // completa as posições com jogadores gerados
        for (const [pos, min] of Object.entries(MIN_POS_SEL)) {
            let q = lista.filter(p => p.pos === pos && !p.user).length;
            while (q < min + 1) {
                const ovr = U.clamp(n.forca - U.int(9, 16), 46, 84);
                const p = Mundo.novoJogador(s, { nome: Nomes.gerar(n.nomes, true), pos, idade: U.int(21, 31), ovr, pot: ovr + U.int(0, 2), tid: -5, real: false }, 0.8);
                p.sel = id;
                st.pool.push(p.id);
                add(p);
                q++;
            }
        }
        return lista;
    },

    // os 26 convocados (por habilidade, respeitando o mínimo de cada posição)
    convocar(s, id, opts = {}) {
        const lista = Selecoes.pool(s, id, opts.idx).filter(p => p.les <= 3 && !(opts.semUsuario && p.user));
        const valor = p => p.ovr + (p.user ? s.pessoa.fama / 25 : 0) - (p.idade >= 36 ? 2 : 0);
        const ord = lista.slice().sort((a, b) => valor(b) - valor(a));
        const esc = [];
        for (const [pos, min] of Object.entries(MIN_POS_SEL)) esc.push(...ord.filter(p => p.pos === pos).slice(0, min));
        for (const p of ord) {
            if (esc.length >= TAM_CONVOCACAO) break;
            if (!esc.includes(p)) esc.push(p);
        }
        return esc;
    },

    forca(conv) {
        const top = conv.map(p => p.ovr).sort((a, b) => b - a).slice(0, 14);
        return top.length ? U.media(top) : 60;
    },

    time(s, id, conv, tatica) {
        const n = Selecoes.nacao(id);
        tatica = tatica || {};
        return {
            id: s.times.length, nome: n.nome, sigla: n.sigla, c1: n.c1, c2: n.c2, liga: null, pais: id, rep: n.forca,
            saldo: 0, elenco: conv.map(p => p.id), form: tatica.form || '4-3-3', estilo: tatica.estilo || 'equilibrado',
            moral: 55, tit: null, infra: { estadio: 4, ct: 4, base: 4 }, selecao: id,
        };
    },

    // -----------------------------------------------------------------
    //  Uma partida entre seleções (ao vivo ou simulada)
    //  cfg: rotulo, mataMata, final, neutro, vivo, controla ('a' | 'b'),
    //       semUsuario, taticaA, taticaB
    // -----------------------------------------------------------------
    async jogar(s, a, b, cfg = {}) {
        const idx = Selecoes.indice(s);
        const convA = Selecoes.convocar(s, a, { idx, semUsuario: cfg.semUsuario });
        const convB = Selecoes.convocar(s, b, { idx, semUsuario: cfg.semUsuario });
        const ta = Selecoes.time(s, a, convA, cfg.taticaA);
        s.times.push(ta);
        const tb = Selecoes.time(s, b, convB, cfg.taticaB);
        s.times.push(tb);
        const jogo = { tipo: 'selecao', comp: cfg.rotulo, rotulo: cfg.rotulo, r: 0, h: ta.id, a: tb.id, mataMata: !!cfg.mataMata, final: !!cfg.final, neutro: !!cfg.neutro };
        const u = s.modo === 'jogador' && s.car ? s.jog[s.car.pid] : null;
        const ladoU = u ? (convA.includes(u) ? 0 : convB.includes(u) ? 1 : -1) : -1;
        if (cfg.controla) jogo.controle = cfg.controla === 'a' ? 0 : 1;
        if (ladoU >= 0) { jogo.usuario = u.id; jogo.ladoUsuario = ladoU; }
        // estatísticas de clube não mudam com jogo de seleção
        const snap = [...convA, ...convB].map(p => [p, p.j, p.g, p.a, p.ns, p.amar, p.susp]);
        let m, r;
        try {
            if (cfg.vivo && (jogo.controle != null || jogo.usuario != null)) {
                jogo.aoFim = async (mm, rr) => { m = mm; r = rr; return Selecoes.linhaFim(s, jogo, mm, rr, ladoU); };
                await TelaPartida.jogar(s, jogo);
            } else {
                const opts = {};
                if (jogo.controle != null) opts.controle = jogo.controle;
                if (jogo.usuario != null) opts.usuario = jogo.usuario;
                m = Partida.criar(s, jogo, opts);
                Partida.simularAteOFim(m);
                r = Partida.finalizar(s, m);
            }
        } finally {
            for (const [p, j, g, aa, ns, am, su] of snap) Object.assign(p, { j, g, a: aa, ns, amar: am, susp: su });
            s.times.splice(ta.id, 2);
        }
        const res = {
            a, b, ga: r.gh, gb: r.ga, pen: r.pen,
            venc: r.venc === ta.id ? a : r.venc === tb.id ? b : null,
            nota: u ? r.notas[u.id] : null, gols: 0, assist: 0,
        };
        if (u && m && m.st[u.id]) {
            res.gols = m.st[u.id].g;
            res.assist = m.st[u.id].a;
            s.car.selecao.jogos++;
            s.car.selecao.gols += res.gols;
            Vida.mudar(s, { fama: 0.8 + res.gols * 1.5 + Math.max(0, (res.nota || 6) - 6.5) * 0.6 });
        }
        return res;
    },

    linhaFim(s, jogo, m, r, ladoU) {
        if (ladoU < 0 || !s.car) return '';
        const st = m.st[s.car.pid];
        if (!st) return '<div class="rf-linha">Você não entrou em campo.</div>';
        return `<div class="rf-linha">🇺🇳 Pela seleção: ${st.g ? `${st.g} gol(s)` : 'sem gols'}${st.a ? `, ${st.a} assistência(s)` : ''}.</div>`;
    },

    // resultado rápido (jogos que não envolvem o usuário)
    simRapido(fa, fb, mataMata) {
        const d = (fa - fb) / 8;
        const poisson = l => { let k = 0, p = 1; const L = Math.exp(-l); do { k++; p *= Math.random(); } while (p > L); return k - 1; };
        const ga = poisson(U.clamp(1.3 + d * 0.6, 0.25, 3.5)), gb = poisson(U.clamp(1.3 - d * 0.6, 0.25, 3.5));
        let venc = ga > gb ? 'a' : gb > ga ? 'b' : null, pen = null;
        if (mataMata && !venc) {
            const pa = U.int(2, 5), pb = pa + (U.chance(0.5 + d * 0.05) ? -1 : 1);
            pen = `${pa}-${Math.max(0, pb)}`;
            venc = pa > pb ? 'a' : 'b';
        }
        return { ga, gb, venc, pen };
    },

    // -----------------------------------------------------------------
    //  Quem o usuário acompanha: o país do jogador (se convocado) ou a
    //  seleção que ele treina
    // -----------------------------------------------------------------
    minhaNacao(s) {
        if (s.modo === 'tecnico') return s.car && s.car.sel ? s.car.sel.id : null;
        if (s.modo === 'jogador') return s.pessoa.pais;
        return null;
    },

    usuarioConvocado(s, id) {
        if (s.modo !== 'jogador') return false;
        const u = s.jog[s.car.pid];
        if (!u || u.aposentado || u.les > 3) return false;
        return Selecoes.convocar(s, id).includes(u);
    },

    // pergunta se o jogo do usuário vai ser ao vivo
    async aoVivo(s, a, b, rotulo) {
        const na = Selecoes.nacao(a), nb = Selecoes.nacao(b);
        const i = await UI.perguntar(rotulo, `${na.bandeira} <b>${U.esc(na.nome)}</b> x <b>${U.esc(nb.nome)}</b> ${nb.bandeira}`, ['▶ Jogar ao vivo', '⏩ Simular resultado'], '🌎');
        return i === 0;
    },

    textoPlacar(res) {
        const na = Selecoes.nacao(res.a), nb = Selecoes.nacao(res.b);
        return `${na.bandeira} ${na.nome} ${res.ga} x ${res.gb} ${nb.nome} ${nb.bandeira}${res.pen ? ` (pên. ${res.pen})` : ''}`;
    },

    // -----------------------------------------------------------------
    //  Datas FIFA: 2 jogos (eliminatórias ou amistosos)
    // -----------------------------------------------------------------
    adversarios(s, id) {
        const n = Selecoes.nacao(id);
        const Y = s.ano + 1;
        const eliminatorias = Y % 4 !== 2 || s.semana < 20; // antes da Copa do Mundo
        const res = [];
        for (let k = 0; k < 2; k++) {
            const mesmo = eliminatorias && U.chance(0.65) && n.confed !== 'OFC';
            const cands = NACOES.filter(x => x.id !== id && !res.some(r => r.id === x.id) && (mesmo ? x.confed === n.confed : Math.abs(x.forca - n.forca) <= 9));
            const adv = U.escolha(cands.length ? cands : NACOES.filter(x => x.id !== id));
            res.push({ id: adv.id, rotulo: mesmo ? `Eliminatórias da Copa do Mundo` : 'Amistoso internacional', casa: k === 0 });
        }
        return res;
    },

    async dataFifa(s) {
        const id = Selecoes.minhaNacao(s);
        if (!id || !DATAS_FIFA.includes(s.semana)) return;
        if (s.modo === 'jogador') return Selecoes.dataFifaJogador(s, id);
        if (s.modo === 'tecnico') return Selecoes.dataFifaTecnico(s, id);
    },

    async dataFifaJogador(s, id) {
        const n = Selecoes.nacao(id);
        if (!Selecoes.usuarioConvocado(s, id)) return;
        const advs = Selecoes.adversarios(s, id);
        const lista = advs.map(x => `${x.casa ? `${n.nome} x ${Selecoes.nacao(x.id).nome}` : `${Selecoes.nacao(x.id).nome} x ${n.nome}`} <small>(${x.rotulo})</small>`).join('<br>');
        const i = await UI.perguntar('📞 Convocado para a seleção!', `O técnico da seleção ${n.bandeira} <b>${U.esc(n.nome)}</b> te convocou para a Data FIFA:<br><br>${lista}`, ['🙌 Aceitar com orgulho', '🙅 Pedir dispensa (cansaço)'], '📞');
        if (i === 1) {
            Vida.log(s, '🙅 Você pediu dispensa da seleção.', '');
            Vida.mudar(s, { fama: -2 });
            return;
        }
        if (!s.car.selecao.convocacoes) s.car.selecao.convocacoes = 0;
        s.car.selecao.convocacoes++;
        Vida.log(s, `📞 Convocado para a seleção ${n.bandeira} ${n.nome}!`, 'bom');
        for (const x of advs) {
            const [a, b] = x.casa ? [id, x.id] : [x.id, id];
            const vivo = await Selecoes.aoVivo(s, a, b, x.rotulo);
            const res = await Selecoes.jogar(s, a, b, { rotulo: x.rotulo, vivo });
            Selecoes.registrarJogador(s, res, x.rotulo);
        }
    },

    registrarJogador(s, res, rotulo) {
        const sc = s.car.selecao;
        sc.hist = sc.hist || [];
        sc.hist.unshift({ ano: s.ano, txt: Selecoes.textoPlacar(res), rotulo, nota: res.nota, gols: res.gols });
        sc.hist = sc.hist.slice(0, 12);
        const txt = `🇺🇳 ${rotulo}: ${Selecoes.textoPlacar(res)}${res.nota != null ? ` · sua nota ${res.nota.toFixed(1)}${res.gols ? ` · ${res.gols} gol(s)` : ''}` : ' · você não entrou'}`;
        Vida.log(s, txt, res.gols ? 'bom' : '');
        UI.toast(txt);
    },

    async dataFifaTecnico(s, id) {
        const sel = s.car.sel;
        const n = Selecoes.nacao(id);
        const advs = Selecoes.adversarios(s, id);
        await UI.aviso('🌎 Data FIFA', `A seleção ${n.bandeira} <b>${U.esc(n.nome)}</b> tem dois jogos nesta Data FIFA. Você comanda o time.`, '🌎');
        for (const x of advs) {
            const [a, b] = x.casa ? [id, x.id] : [x.id, id];
            const vivo = await Selecoes.aoVivo(s, a, b, x.rotulo);
            const tat = { form: sel.form, estilo: sel.estilo };
            const res = await Selecoes.jogar(s, a, b, { rotulo: x.rotulo, vivo, controla: x.casa ? 'a' : 'b', taticaA: x.casa ? tat : null, taticaB: x.casa ? null : tat });
            Selecoes.registrarTecnico(s, res, x.rotulo);
        }
        await Selecoes.avaliarTecnico(s);
    },

    registrarTecnico(s, res, rotulo) {
        const sel = s.car.sel;
        if (!sel) return;
        const meu = sel.id;
        const gf = res.a === meu ? res.ga : res.gb, gc = res.a === meu ? res.gb : res.ga;
        const venceu = res.venc ? res.venc === meu : gf > gc;
        const perdeu = res.venc ? res.venc !== meu : gf < gc;
        sel.j++;
        if (venceu) sel.v++; else if (perdeu) sel.d++; else sel.e++;
        sel.hist = sel.hist || [];
        sel.hist.unshift({ ano: s.ano, txt: Selecoes.textoPlacar(res), rotulo, r: venceu ? 'V' : perdeu ? 'D' : 'E' });
        sel.hist = sel.hist.slice(0, 15);
        Vida.log(s, `🌎 ${rotulo}: ${Selecoes.textoPlacar(res)}`, venceu ? 'bom' : perdeu ? 'ruim' : '');
        UI.toast(`🌎 ${Selecoes.textoPlacar(res)}`);
        Vida.mudar(s, { fama: venceu ? 0.6 : 0, felicidade: venceu ? 1 : perdeu ? -1 : 0 });
    },

    // seleção demite o técnico se o aproveitamento for muito ruim
    async avaliarTecnico(s) {
        const sel = s.car.sel;
        if (!sel || sel.j < 8) return;
        const aprov = (sel.v * 3 + sel.e) / (sel.j * 3);
        const n = Selecoes.nacao(sel.id);
        const exige = U.clamp(0.25 + (n.forca - 70) * 0.015, 0.25, 0.55);
        if (aprov < exige) await Selecoes.demitirTecnico(s, `O aproveitamento de ${Math.round(aprov * 100)}% ficou abaixo do esperado.`);
    },

    async demitirTecnico(s, motivo) {
        const sel = s.car.sel;
        const n = Selecoes.nacao(sel.id);
        s.car.sel = null;
        s.car.selCooldown = s.ano + 1;
        s.car.rep = U.clamp(s.car.rep - 3, 0, 100);
        Mundo.noticia(s, `🚪 A seleção ${n.bandeira} ${n.nome} demite o técnico ${s.pessoa.nome}.`, 'geral');
        Vida.log(s, `🚪 Você foi demitido da seleção ${n.nome}. ${motivo}`, 'ruim');
        await UI.aviso('Demitido da seleção', `A federação ${n.bandeira} <b>${U.esc(n.nome)}</b> decidiu trocar de técnico. ${motivo}`, '🚪');
    },

    // -----------------------------------------------------------------
    //  Convites para comandar uma seleção (quanto maior a reputação,
    //  maior a seleção)
    // -----------------------------------------------------------------
    async convite(s, chance = 0.3) {
        if (s.modo !== 'tecnico' || s.car.sel || s.car.rep < 45) return;
        if (s.car.selCooldown && s.ano < s.car.selCooldown) return;
        if (!U.chance(chance)) return;
        const alvo = 62 + s.car.rep * 0.27;
        let cands = NACOES.filter(n => Math.abs(n.forca - alvo) <= 4);
        if (!cands.length) cands = NACOES.slice().sort((a, b) => Math.abs(a.forca - alvo) - Math.abs(b.forca - alvo)).slice(0, 3);
        const n = U.escolha(cands);
        const i = await UI.perguntar('📞 Convite de seleção!', `A federação ${n.bandeira} <b>${U.esc(n.nome)}</b> (força ${n.forca}) quer você como técnico da seleção.<br><br>Você continua no seu clube e comanda a seleção nas Datas FIFA e nos torneios.`, ['✅ Aceitar o desafio', '❌ Recusar'], n.bandeira);
        if (i !== 0) {
            s.car.selCooldown = s.ano + 1;
            Vida.log(s, `❌ Você recusou o convite da seleção ${n.nome}.`, '');
            return;
        }
        s.car.sel = { id: n.id, desde: s.ano, j: 0, v: 0, e: 0, d: 0, titulos: [], hist: [], form: '4-3-3', estilo: 'equilibrado' };
        Conquistas.contar(s, 'selecoesTreinadas');
        s.car.rep = U.clamp(s.car.rep + 3, 0, 100);
        Vida.mudar(s, { fama: 6 + (n.forca - 70) * 0.4, felicidade: 10 });
        Mundo.noticia(s, `🌎 ${s.pessoa.nome} é o novo técnico da seleção ${n.bandeira} ${n.nome}.`, 'geral');
        Vida.log(s, `🌎 Você é o novo técnico da seleção ${n.bandeira} ${n.nome}!`, 'titulo');
        await Cena.simples(n.bandeira, `SELEÇÃO ${n.nome.toUpperCase()}`, `${U.esc(s.pessoa.nome)} assume o comando da seleção!`, `radial-gradient(circle at 50% 40%, ${n.c1} 0%, #05070c 75%)`, 'torcida', [n.c1, n.c2, '#ffffff']);
    },

    // -----------------------------------------------------------------
    //  Torneios no fim da temporada
    // -----------------------------------------------------------------
    torneiosDoAno(Y) {
        const top = (lista, n) => lista.slice().sort((a, b) => b.forca - a.forca).slice(0, n).map(x => x.id);
        if (Y % 4 === 2) {
            const fora = NACOES.filter(n => n.confed !== 'OFC');
            return [{ id: 'WC', nome: 'Copa do Mundo', icone: '🏆', ids: top(fora, 47).concat(['NZL']), grupos: 12, ko: 32 }];
        }
        if (Y % 4 === 0) {
            return [
                { id: 'EURO', nome: 'Eurocopa', icone: '🇪🇺', ids: top(Selecoes.nacoesDe('UEFA'), 16), grupos: 4, ko: 8 },
                { id: 'CA', nome: 'Copa América', icone: '🌎', ids: top(Selecoes.nacoesDe('CONMEBOL'), 8).concat(top(Selecoes.nacoesDe('CONCACAF'), 6), ['JPN', 'QAT']), grupos: 4, ko: 8 },
            ];
        }
        if (Y % 2 === 1) {
            return [
                { id: 'GOLD', nome: 'Copa Ouro', icone: '🥇', ids: top(Selecoes.nacoesDe('CONCACAF'), 6).concat(['QAT', 'KSA']), grupos: 2, ko: 4 },
                { id: 'AFCON', nome: 'Copa Africana de Nações', icone: '🌍', ids: top(Selecoes.nacoesDe('CAF'), 8), grupos: 2, ko: 4 },
                { id: 'ASIA', nome: 'Copa da Ásia', icone: '🌏', ids: top(Selecoes.nacoesDe('AFC'), 8), grupos: 2, ko: 4 },
            ];
        }
        return [];
    },

    async fimTemporada(s, anoTemp) {
        const Y = anoTemp + 1;
        const meu = Selecoes.minhaNacao(s);
        for (const def of Selecoes.torneiosDoAno(Y)) {
            const participa = meu && def.ids.includes(meu);
            let interativo = null;
            if (participa && s.modo === 'tecnico') interativo = meu;
            if (participa && s.modo === 'jogador') {
                if (Selecoes.usuarioConvocado(s, meu)) {
                    const n = Selecoes.nacao(meu);
                    const i = await UI.perguntar(`📞 Convocado para a ${def.nome}!`, `Você está na lista de ${TAM_CONVOCACAO} da seleção ${n.bandeira} <b>${U.esc(n.nome)}</b> para a <b>${def.nome} ${Y}</b>!`, ['🙌 Bora buscar a taça!', '🙅 Pedir dispensa'], def.icone);
                    if (i === 0) interativo = meu;
                } else if (meu) {
                    Vida.log(s, `😔 Você ficou fora da lista da seleção para a ${def.nome} ${Y}.`, 'ruim');
                    UI.toast(`😔 Você não foi convocado para a ${def.nome}.`);
                }
            }
            if (participa && s.modo === 'tecnico') {
                const n = Selecoes.nacao(meu);
                await Cena.simples(def.icone, `${def.nome.toUpperCase()} ${Y}`, `A seleção ${U.esc(n.nome)} vai em busca da taça!`, `radial-gradient(circle at 50% 40%, ${n.c1} 0%, #05070c 75%)`, 'torcida');
            }
            const r = await Selecoes.torneio(s, def, Y, interativo);
            Mundo.noticia(s, `${def.icone} ${Selecoes.nacao(r.campeao).nome} conquista a ${def.nome} ${Y}!`, 'titulo');
            if (participa) await Selecoes.resultadoTorneio(s, def, Y, r, meu, !!interativo);
        }
        await Selecoes.convite(s, 0.35);
    },

    // simula (e joga, se for o caso) um torneio inteiro
    async torneio(s, def, Y, interativo) {
        const idx = Selecoes.indice(s);
        const forca = {};
        for (const id of def.ids) forca[id] = Selecoes.forca(Selecoes.convocar(s, id, { idx }));
        // potes: os mais fortes ficam em grupos diferentes
        const ord = def.ids.slice().sort((a, b) => forca[b] - forca[a]);
        const grupos = Array.from({ length: def.grupos }, () => []);
        ord.forEach((id, i) => { const pote = Math.floor(i / def.grupos); const g = pote % 2 ? def.grupos - 1 - (i % def.grupos) : i % def.grupos; grupos[g].push(id); });
        const tab = {};
        for (const id of def.ids) tab[id] = { id, pts: 0, j: 0, gp: 0, gc: 0 };
        const letra = g => String.fromCharCode(65 + g);
        const jogar = async (a, b, rotulo, mataMata, final) => {
            if (interativo && (a === interativo || b === interativo)) {
                const vivo = await Selecoes.aoVivo(s, a, b, rotulo);
                const tat = s.modo === 'tecnico' ? { form: s.car.sel.form, estilo: s.car.sel.estilo } : null;
                const res = await Selecoes.jogar(s, a, b, {
                    rotulo, mataMata, final, neutro: true, vivo,
                    controla: s.modo === 'tecnico' ? (a === interativo ? 'a' : 'b') : null,
                    taticaA: a === interativo ? tat : null, taticaB: b === interativo ? tat : null,
                });
                if (s.modo === 'tecnico') Selecoes.registrarTecnico(s, res, rotulo);
                else Selecoes.registrarJogador(s, res, rotulo);
                return res;
            }
            const x = Selecoes.simRapido(forca[a], forca[b], mataMata);
            return { a, b, ga: x.ga, gb: x.gb, pen: x.pen, venc: x.venc === 'a' ? a : x.venc === 'b' ? b : null };
        };
        // fase de grupos (3 rodadas)
        const rodadas = [[[0, 1], [2, 3]], [[0, 2], [1, 3]], [[0, 3], [1, 2]]];
        for (let r = 0; r < 3; r++) {
            for (let g = 0; g < grupos.length; g++) {
                for (const [i, k] of rodadas[r]) {
                    const a = grupos[g][i], b = grupos[g][k];
                    if (!a || !b) continue;
                    const res = await jogar(a, b, `${def.nome} — Grupo ${letra(g)}, ${r + 1}ª rodada`, false, false);
                    for (const [id, gf, gc] of [[a, res.ga, res.gb], [b, res.gb, res.ga]]) {
                        const t = tab[id];
                        t.j++; t.gp += gf; t.gc += gc; t.pts += gf > gc ? 3 : gf === gc ? 1 : 0;
                    }
                }
            }
        }
        const ordem = lista => lista.slice().sort((x, y) => (tab[y].pts - tab[x].pts) || ((tab[y].gp - tab[y].gc) - (tab[x].gp - tab[x].gc)) || (tab[y].gp - tab[x].gp) || (forca[y] - forca[x]));
        const finais = grupos.map(ordem);
        // classificados: 1º e 2º de cada grupo + melhores terceiros, até completar o mata-mata
        const primeiros = finais.map(g => g[0]), segundos = finais.map(g => g[1]);
        const terceiros = ordem(finais.map(g => g[2]).filter(Boolean));
        let classif = primeiros.concat(segundos);
        if (classif.length < def.ko) classif = classif.concat(terceiros.slice(0, def.ko - classif.length));
        classif = classif.slice(0, def.ko);
        const fase = { [interativo]: 'Fase de grupos' };
        if (interativo) {
            const g = grupos.findIndex(x => x.includes(interativo));
            const tabela = finais[g].map((id, i) => { const t = tab[id], n = Selecoes.nacao(id); return `<tr class="${id === interativo ? 'destaque' : ''} ${classif.includes(id) ? '' : 'cinza'}"><td>${i + 1}</td><td class="esq">${n.bandeira} ${U.esc(n.nome)}</td><td>${t.pts}</td><td>${t.j}</td><td>${t.gp - t.gc}</td></tr>`; }).join('');
            await UI.modal({
                titulo: `${def.icone} ${def.nome} — Grupo ${letra(g)}`,
                html: `<table class="tabela"><thead><tr><th>#</th><th class="esq">Seleção</th><th>P</th><th>J</th><th>SG</th></tr></thead><tbody>${tabela}</tbody></table>
                    <p>${classif.includes(interativo) ? '✅ Classificado para o mata-mata!' : '❌ Eliminado na fase de grupos.'}</p>`,
                botoes: [{ txt: 'Continuar ▶', valor: true }],
            });
        }
        // mata-mata: o melhor classificado pega o pior
        let vivos = classif.slice();
        while (vivos.length > 1) {
            const nomeFase = NOMES_FASE_KO[vivos.length] || 'Mata-mata';
            if (vivos.includes(interativo)) fase[interativo] = nomeFase;
            const prox = [];
            for (let i = 0; i < vivos.length / 2; i++) {
                const a = vivos[i], b = vivos[vivos.length - 1 - i];
                const res = await jogar(a, b, `${def.nome} — ${nomeFase}`, true, vivos.length === 2);
                prox.push(res.venc || (res.ga >= res.gb ? a : b));
            }
            vivos = prox;
        }
        const campeao = vivos[0];
        if (campeao === interativo) fase[interativo] = 'Campeão';
        return { campeao, fase: interativo ? fase[interativo] : null, classif, tab };
    },

    async resultadoTorneio(s, def, Y, r, meu, jogou) {
        const n = Selecoes.nacao(meu);
        const campeao = r.campeao === meu;
        const timeObj = { nome: n.nome, sigla: n.sigla, c1: n.c1, c2: n.c2 };
        if (s.modo === 'jogador') {
            if (!jogou) {
                if (campeao) Vida.log(s, `${def.icone} A seleção ${n.nome} foi campeã da ${def.nome} ${Y} — sem você na lista.`, '');
                return;
            }
            if (campeao) {
                s.pessoa.trofeus.push({ ano: Y, txt: `${def.nome} (seleção)` });
                Vida.mudar(s, { fama: def.id === 'WC' ? 25 : 12, felicidade: 25 });
                Vida.log(s, `🏆 VOCÊ É CAMPEÃO DA ${def.nome.toUpperCase()} ${Y} COM A SELEÇÃO!`, 'titulo');
                await Cena.titulo(`${def.nome} ${Y}`, timeObj, `${U.esc(s.pessoa.nome)} é campeão com a seleção ${n.nome}!`);
            } else {
                Vida.log(s, `${def.icone} ${def.nome} ${Y}: a seleção ${n.nome} parou na fase "${r.fase}".`, '');
                Vida.mudar(s, { felicidade: r.fase === 'Final' || r.fase === 'Semifinal' ? 0 : -5 });
                await UI.aviso(def.nome, `A seleção ${n.bandeira} ${U.esc(n.nome)} parou em: <b>${r.fase}</b>.<br>Campeã: ${Selecoes.nacao(r.campeao).bandeira} ${U.esc(Selecoes.nacao(r.campeao).nome)}.`, def.icone);
            }
            return;
        }
        // técnico
        const sel = s.car.sel;
        if (!sel) return;
        if (campeao) {
            sel.titulos.push(`${def.nome} ${Y}`);
            s.pessoa.trofeus.push({ ano: Y, txt: `${def.nome} (${n.nome})` });
            Conquistas.contar(s, 'titulosSelecao');
            s.car.rep = U.clamp(s.car.rep + (def.id === 'WC' ? 20 : 10), 0, 100);
            Vida.mudar(s, { fama: def.id === 'WC' ? 25 : 12, felicidade: 25 });
            Vida.log(s, `🏆 CAMPEÃO DA ${def.nome.toUpperCase()} ${Y} COM ${n.nome.toUpperCase()}!`, 'titulo');
            await Cena.titulo(`${def.nome} ${Y}`, timeObj, `${U.esc(s.pessoa.nome)} leva ${n.nome} ao título!`);
            return;
        }
        // expectativa: as mais fortes do torneio precisam ir longe
        const rank = def.ids.slice().sort((a, b) => Selecoes.nacao(b).forca - Selecoes.nacao(a).forca).indexOf(meu);
        const esperado = rank < def.ids.length / 8 ? 'Semifinal' : rank < def.ids.length / 4 ? 'Quartas de final' : 'Fase de grupos';
        const nivel = f => ['Fase de grupos', '16 avos de final', 'Oitavas de final', 'Quartas de final', 'Semifinal', 'Final', 'Campeão'].indexOf(f);
        await UI.aviso(def.nome, `A seleção ${n.bandeira} ${U.esc(n.nome)} parou em: <b>${r.fase}</b>.<br>Campeã: ${Selecoes.nacao(r.campeao).bandeira} ${U.esc(Selecoes.nacao(r.campeao).nome)}.`, def.icone);
        if (nivel(r.fase) < nivel(esperado) - 1 || (nivel(r.fase) === 0 && rank < def.ids.length / 4)) {
            await Selecoes.demitirTecnico(s, `A campanha na ${def.nome} ficou muito abaixo do esperado.`);
        } else if (nivel(r.fase) >= nivel(esperado)) {
            s.car.rep = U.clamp(s.car.rep + 3, 0, 100);
        }
    },

    // -----------------------------------------------------------------
    //  Aba "Seleção" do técnico
    // -----------------------------------------------------------------
    tela(s) {
        const sel = s.car.sel;
        if (!sel) {
            const alvo = Math.round(62 + s.car.rep * 0.27);
            return `<div class="cartao"><h3>🌎 Seleção</h3>
                <p>Você ainda não comanda nenhuma seleção. As federações fazem convites quando sua reputação cresce: quanto maior a reputação, maior a seleção.</p>
                <div class="ficha"><div><span>Sua reputação</span><b>${Math.round(s.car.rep)}/100</b></div>
                <div><span>Seleções do seu nível</span><b>${s.car.rep < 45 ? 'nenhuma ainda (a partir de 45 de reputação)' : `força perto de ${alvo}`}</b></div></div></div>`;
        }
        const n = Selecoes.nacao(sel.id);
        const conv = Selecoes.convocar(s, sel.id).sort((a, b) => POSICOES.indexOf(a.pos) - POSICOES.indexOf(b.pos) || b.ovr - a.ovr);
        const prox = DATAS_FIFA.find(w => w >= s.semana);
        const clube = p => p.tid >= 0 ? U.esc(s.times[p.tid].nome) : p.tid === -1 ? 'Sem clube' : '<span class="cinza">Fora das ligas do jogo</span>';
        return `<div class="grade-2">
            <div class="cartao">
                <div class="cartao-topo"><h3>${n.bandeira} Seleção ${U.esc(n.nome)}</h3><span>Força ${Math.round(Selecoes.forca(conv))}</span></div>
                <div class="ficha">
                    <div><span>No cargo desde</span><b>${sel.desde}</b></div>
                    <div><span>Jogos</span><b>${sel.j} (${sel.v}V ${sel.e}E ${sel.d}D)</b></div>
                    <div><span>Títulos</span><b>${sel.titulos.length ? sel.titulos.map(U.esc).join(', ') : 'nenhum ainda'}</b></div>
                    <div><span>Próxima Data FIFA</span><b>${prox != null ? `semana ${prox + 1}` : 'na próxima temporada'}</b></div>
                </div>
                <div class="linha-botoes">
                    <label>Formação <select class="sel" data-mudar="selForm">${Object.keys(FORMACOES).map(f => `<option ${f === sel.form ? 'selected' : ''}>${f}</option>`).join('')}</select></label>
                    <label>Estilo <select class="sel" data-mudar="selEstilo">${Object.entries(ESTILOS).map(([k, e]) => `<option value="${k}" ${k === sel.estilo ? 'selected' : ''}>${e.nome}</option>`).join('')}</select></label>
                </div>
                <h4>Últimos jogos</h4>
                ${(sel.hist || []).length ? sel.hist.map(h => `<div class="pequeno">${h.r === 'V' ? '✅' : h.r === 'D' ? '❌' : '➖'} ${U.esc(h.txt)} <span class="cinza">· ${U.esc(h.rotulo)}</span></div>`).join('') : '<p class="cinza">Nenhum jogo ainda.</p>'}
                <p class="cinza pequeno">Jogos nas semanas ${DATAS_FIFA.map(w => w + 1).join(', ')} de cada temporada e torneios no fim da temporada (Copa do Mundo, continentais).</p>
                <div class="linha-botoes"><button class="btn btn-perigo btn-pequeno" data-acao="selDemissao">🚪 Pedir demissão da seleção</button></div>
            </div>
            <div class="cartao"><h3>📋 Convocados (${conv.length})</h3>
                <div class="rolavel"><table class="tabela tabela-elenco"><thead><tr><th>Pos</th><th class="esq">Jogador</th><th>Idade</th><th>OVR</th><th class="esq">Clube</th></tr></thead>
                <tbody>${conv.map(p => `<tr><td>${UI.pos(p.pos)}</td><td class="esq">${U.esc(p.nome)}</td><td>${p.idade}</td><td>${UI.ovr(p.ovr)}</td><td class="esq pequeno">${clube(p)}</td></tr>`).join('')}</tbody></table></div>
                <p class="cinza pequeno">A convocação é feita pelos melhores do país em cada posição.</p>
            </div>
        </div>`;
    },

    // card da seleção na carreira do jogador
    cardJogador(s) {
        const sc = s.car.selecao;
        const n = Selecoes.nacao(s.pessoa.pais);
        const conv = Selecoes.usuarioConvocado(s, s.pessoa.pais);
        const prox = DATAS_FIFA.find(w => w >= s.semana);
        return `<p>${sc.jogos ? `${sc.jogos} jogos e ${sc.gols} gols pela seleção ${n.bandeira}.` : 'Ainda não estreou pela seleção.'}
            ${conv ? '<b class="verde">Hoje você está entre os convocáveis!</b>' : 'Hoje você está fora da lista. Continue evoluindo!'}</p>
            <p class="cinza pequeno">Próxima Data FIFA: ${prox != null ? `semana ${prox + 1}` : 'próxima temporada'}. Torneios no fim da temporada: Copa do Mundo (${Selecoes.proximoAno(s, 2)}) e ${['ENG', 'ESP', 'ITA', 'GER', 'FRA', 'NED'].includes(s.pessoa.pais) ? 'Eurocopa' : ['MEX', 'USA'].includes(s.pessoa.pais) ? 'Copa Ouro / Copa América' : 'Copa América'}.</p>
            ${(sc.hist || []).slice(0, 5).map(h => `<div class="pequeno">${U.esc(h.txt)} <span class="cinza">· ${U.esc(h.rotulo)}${h.nota != null ? ` · nota ${h.nota.toFixed(1)}` : ''}${h.gols ? ` · ⚽${h.gols}` : ''}</span></div>`).join('')}`;
    },

    // próximo ano (de torneio) com Y % 4 === resto
    proximoAno(s, resto) {
        let Y = s.ano + 1;
        while (Y % 4 !== resto) Y++;
        return Y;
    },
};

Object.assign(ACOES, {
    selForm: (d, el) => { Jogo.s.car.sel.form = el.value; UI.toast('📋 Formação da seleção: ' + el.value); },
    selEstilo: (d, el) => { Jogo.s.car.sel.estilo = el.value; UI.toast('📋 Estilo da seleção: ' + ESTILOS[el.value].nome); },
    async selDemissao() {
        const s = Jogo.s, n = Selecoes.nacao(s.car.sel.id);
        if (!(await UI.confirmar(`Pedir demissão da seleção ${n.nome}?`, 'Pedir demissão'))) return;
        s.car.sel = null;
        s.car.selCooldown = s.ano + 1;
        Vida.log(s, `👋 Você deixou o comando da seleção ${n.nome}.`, '');
        Jogo.atualizar();
    },
});
