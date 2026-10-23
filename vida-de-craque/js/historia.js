'use strict';
// =====================================================================
//  HISTÓRIA DA CARREIRA DE JOGADOR
//  ⚔️ Rival pessoal: um jogador real de outro clube, da mesma faixa de
//     idade e de nível parecido. Duelo quando os times se enfrentam,
//     provocações e notícias, balanço no fim da temporada e troca de rival
//     quando ele some ou quando você o supera por duas temporadas seguidas.
//  🎯 Metas da temporada: do técnico, do patrocinador, do empresário ou da
//     torcida, com barra de progresso, prêmio ou cobrança.
//  🎤 Entrevista / redes sociais depois de jogos marcantes: opcional, na
//     tela do fim do jogo (nunca nos jogos simulados).
//  💼 Empresário: Negociador, Marqueteiro ou Conexões, com comissão.
//
//  Estado (criado na primeira vez que precisa: saves antigos abrem normal)
//    s.car.rival   { pid, nome, desde, tipo, v, e, d, ult[], temps[], sup... } ou null
//    s.car.rivais  rivais anteriores
//    s.car.metas   { ano, lista[], c: contadores da temporada }
//    s.car.emp     empresário contratado (ou null)
//    s.car.hst     { tec, tor, ent, pol, merc, bal, comAno }
//                  tec = confiança do técnico, tor = moral com a torcida (0-100)
// =====================================================================

const TIPOS_EMP = {
    negociador: { nome: 'Negociador', icone: '🤝', desc: 'Salários maiores e luvas quando você assina ou renova.' },
    marqueteiro: { nome: 'Marqueteiro', icone: '📣', desc: 'Renegocia e traz patrocínios, e você ganha mais seguidores.' },
    conexoes: { nome: 'Conexões', icone: '🌐', desc: 'Mais propostas nas janelas, inclusive de clubes maiores.' },
};

// Empresários famosos (só de brincadeira): [nome, bandeira, tipo, estrelas]
const EMPRESARIOS_REAIS = [
    ['Jorge Mendes', '🇵🇹', 'negociador', 5], ['Rafaela Pimenta', '🇧🇷', 'negociador', 5], ['Jonathan Barnett', '🇬🇧', 'negociador', 4],
    ['Pini Zahavi', '🇮🇱', 'conexoes', 5], ['Kia Joorabchian', '🇬🇧', 'conexoes', 4], ['Giuliano Bertolucci', '🇧🇷', 'conexoes', 4],
    ['Wagner Ribeiro', '🇧🇷', 'marqueteiro', 4],
];
const COMISSAO_EMP = [0, 5, 6, 8, 10, 12];   // % do salário, por estrelas
const FAMA_EMP = [0, 0, 6, 16, 30, 45];      // fama mínima para ele aceitar cuidar de você

const ORIGEM_META = {
    tecnico: { nome: 'Técnico', icone: '🧑‍🏫' },
    patrocinador: { nome: 'Patrocinador', icone: '🤝' },
    empresario: { nome: 'Empresário', icone: '💼' },
    torcida: { nome: 'Torcida', icone: '📣' },
};

// Números de uma temporada de titular em cada posição (medidos simulando carreiras)
const ESPERADO_POS = {
    ATA: { g: 21, a: 5, mvp: 4, nota: 6.7, cs: 0 },
    PON: { g: 16, a: 8, mvp: 3, nota: 6.5, cs: 0 },
    MEI: { g: 5, a: 9, mvp: 2, nota: 6.4, cs: 0 },
    VOL: { g: 2, a: 4, mvp: 1, nota: 6.2, cs: 5 },
    LAT: { g: 1, a: 4, mvp: 1, nota: 6.1, cs: 6 },
    ZAG: { g: 1, a: 1, mvp: 1, nota: 6.1, cs: 7 },
    GOL: { g: 0, a: 0, mvp: 1, nota: 6.2, cs: 8 },
};

// Tipos de meta: valor atual (c = contadores da temporada). "fim" = só se decide no fim da temporada
const TIPOS_META = {
    gols: { icone: '⚽', txt: n => `Fazer ${n} gols`, valor: c => c.g },
    assist: { icone: '🅰️', txt: n => `Dar ${n} assistências`, valor: c => c.a },
    ga: { icone: '🎯', txt: n => `Participar de ${n} gols (gols + assistências)`, valor: c => c.g + c.a },
    nota: { icone: '📝', txt: n => `Média de nota ${Historia.fmtNota(n)} ou mais`, valor: c => (c.j ? c.ns / c.j : 0), fim: true },
    titular: { icone: '✅', txt: n => `Ser titular em ${n} jogos`, valor: c => c.tit },
    jogos: { icone: '👟', txt: n => `Entrar em campo em ${n} jogos`, valor: c => c.j },
    // alvo = expulsões permitidas (0 = nenhuma)
    disciplina: { icone: '🟥', txt: n => (n > 0 ? `No máximo ${n} expulsão na temporada` : 'Não ser expulso na temporada'), valor: c => c.vm, fim: true },
    cs: { icone: '🧱', txt: n => `${n} jogos sem sofrer gol (jogando os 90 minutos)`, valor: c => c.cs },
    mvp: { icone: '⭐', txt: n => (n > 1 ? `Ser o melhor em campo ${n} vezes` : 'Ser o melhor em campo uma vez'), valor: c => c.mvp },
    classico: { icone: '🔥', txt: n => (n > 1 ? `Vencer ${n} clássicos em campo` : 'Vencer um clássico em campo'), valor: c => c.clas },
    seg: { icone: '📱', txt: n => `Chegar a ${Vida.numero(n)} seguidores`, valor: (c, s) => s.pessoa.seg || 0 },
    ovr: { icone: '📈', txt: n => `Chegar a ${n} de habilidade`, valor: (c, s) => Jogador.p(s).ovr },
    selecao: { icone: '🇺🇳', txt: () => 'Jogar pela seleção', valor: (c, s) => ((s.car.selecao && s.car.selecao.jogos) || 0) - (c.sel0 || 0) },
};

const Historia = {
    entPend: null,   // entrevista esperando resposta na tela do fim do jogo
    _propSem: -1,    // semana em que já houve proposta (o "Conexões" não manda outra)

    // -----------------------------------------------------------------
    //  Estado
    // -----------------------------------------------------------------
    ativo(s) {
        if (!s || s.modo !== 'jogador' || !s.car || s.car.pid == null) return false;
        const p = s.jog[s.car.pid];
        return !!p && !p.aposentado;
    },

    estado(s) {
        const c = s.car;
        if (!c.hst) c.hst = { tec: 50, tor: 50, ent: -99, pol: null, merc: null, bal: null, comAno: 0 };
        if (!c.rivais) c.rivais = [];
        if (c.emp === undefined) c.emp = null;
        return c.hst;
    },

    // completa o que faltar (saves antigos, jogador que assinou no meio do ano)
    garantir(s) {
        if (!Historia.ativo(s)) return;
        Historia.estado(s);
        const u = Jogador.p(s);
        if (s.car.rival === undefined) Historia.novoRival(s, 'normal', true);
        const mt = s.car.metas;
        if (u.tid >= 0 && (!mt || mt.ano !== s.ano || mt.semClube)) Historia.novasMetas(s);
    },

    // começo da carreira (Jogador.iniciar)
    iniciar(s) {
        Historia.estado(s);
        Historia.novoRival(s, 'normal');
        Historia.novasMetas(s);
    },

    clampClima(h) {
        h.tec = U.clamp(h.tec, 0, 100);
        h.tor = U.clamp(h.tor, 0, 100);
    },

    fmtNota: n => n.toFixed(1).replace('.', ','),

    // número "bonito" para metas de seguidores
    bonito(n) {
        if (n >= 1e6) return Math.round(n / 1e5) * 1e5;
        if (n >= 1e4) return Math.round(n / 1e3) * 1e3;
        return Math.max(100, Math.round(n / 100) * 100);
    },

    // -----------------------------------------------------------------
    //  Avisos e o ritmo do jogo (js/ritmo.js)
    // -----------------------------------------------------------------
    // simulando várias semanas (⏭️ / ⏩) ou com a opção "simular os jogos do meu
    // time": nada de janela opcional, só diário e aviso rápido
    rapido() {
        return (typeof Ritmo !== 'undefined' && Ritmo.rodando) || !!(Jogo.opcoes && Jogo.opcoes.simularJogos);
    },

    // aviso rápido; no meio do ⏭️ / ⏩ fica só no diário (o resumo da sessão conta o que importa)
    avisar(txt) {
        if (typeof Ritmo !== 'undefined' && Ritmo.rodando) return;
        UI.toast(txt);
    },

    // anota duelos e metas no resumo da sessão do ⏭️ / ⏩
    anotarSessao(chave, v) {
        const ses = typeof Ritmo !== 'undefined' ? Ritmo.sessao : null;
        if (!ses) return;
        ses.hst = ses.hst || { duelos: [], metasOk: 0, metasNao: 0 };
        if (chave === 'duelo') ses.hst.duelos.push(v);
        else ses.hst[chave] = (ses.hst[chave] || 0) + 1;
    },

    // pedaços do resumo do ⏭️ / ⏩ (gancho em Ritmo.partesSessao)
    partesSessao(ses) {
        const h = ses && ses.hst;
        if (!h) return [];
        const partes = [];
        const pl = (n, um, varios) => `${n} ${n === 1 ? um : varios}`;
        if (h.duelos.length) partes.push(`⚔️ Duelo: ${h.duelos.map(r => (r === 'v' ? '✅' : r === 'd' ? '❌' : '➖')).join('')}`);
        if (h.metasOk) partes.push(`🎯 ${pl(h.metasOk, 'meta cumprida', 'metas cumpridas')}`);
        if (h.metasNao) partes.push(`❌ ${pl(h.metasNao, 'meta perdida', 'metas perdidas')}`);
        return partes;
    },

    // o ⏭️ também para antes do duelo com o rival, para você jogar ao vivo
    // (gancho em Ritmo.jogoGrande; '' = não é jogo grande)
    jogoGrande(s) {
        if (!Historia.ativo(s) || !s.car.rival) return '';
        const prox = Historia.proxDuelo(s);
        const rp = Historia.rival(s);
        if (!prox || prox.sem !== s.semana || !rp || rp.les > 0 || rp.susp > 0) return '';   // ele não joga: sem duelo
        return `⚔️ Duelo com ${rp.nome} (${s.times[rp.tid].nome})`;
    },

    // -----------------------------------------------------------------
    //  ⚔️ Rival
    // -----------------------------------------------------------------
    // tipo: 'normal' (mesma idade e nível), 'joia' (garoto mais novo e promissor) ou 'forte' (um desafio maior)
    escolherRival(s, tipo) {
        const u = Jogador.p(s);
        const meu = u.tid >= 0 ? s.times[u.tid] : null;
        const grupo = POS_GRUPO[u.pos];
        const ja = new Set((s.car.rivais || []).map(r => r.pid));
        const ok = p => !p.user && !p.aposentado && p.tid >= 0 && p.tid !== u.tid && s.times[p.tid] && s.times[p.tid].liga
            && POS_GRUPO[p.pos] === grupo && !ja.has(p.id);
        const todos = Object.values(s.jog).filter(ok);
        const especiais = tipo === 'joia'
            ? [p => p.idade <= Math.min(21, u.idade - 2) && p.pot >= u.ovr && p.ovr >= u.ovr - 12,
                p => p.idade < u.idade && p.ovr >= u.ovr - 6]
            : tipo === 'forte'
                ? [p => Math.abs(p.idade - u.idade) <= 4 && p.ovr >= u.ovr + 1 && p.ovr <= u.ovr + 8,
                    p => p.ovr >= u.ovr && p.ovr <= u.ovr + 12]
                : [];
        const normais = [
            p => Math.abs(p.idade - u.idade) <= 2 && p.ovr >= u.ovr - 3 && p.ovr <= u.ovr + 5,
            p => Math.abs(p.idade - u.idade) <= 4 && p.ovr >= u.ovr - 6 && p.ovr <= u.ovr + 8,
            p => p.ovr >= u.ovr - 9 && p.ovr <= u.ovr + 12];
        // de preferência alguém da mesma liga (assim tem duelo), depois do mesmo país, depois qualquer um
        const ligaU = meu ? meu.liga : null, paisU = meu ? meu.pais : s.pessoa.pais;
        const escopos = [t => t.liga === ligaU, t => t.pais === paisU, () => true];
        // titulares de cada clube (a escalação automática de hoje): rival que vive no banco não tem duelo
        const xi = new Map();
        const titular = p => {
            if (!xi.has(p.tid)) {
                let ids = [];
                try { ids = Escalacao.auto(s, s.times[p.tid]); } catch (e) { ids = []; }
                xi.set(p.tid, new Set(ids));
            }
            return xi.get(p.tid).has(p.id);
        };
        // ordem de preferência: mesma liga > titular no clube dele > idade e nível mais parecidos
        for (const faixas of especiais.length ? [especiais, normais] : [normais]) {
            for (const noEscopo of escopos) {
                for (const soTitular of [true, false]) {
                    for (const f of faixas) {
                        const cands = todos.filter(p => f(p) && noEscopo(s.times[p.tid]) && (!soTitular || titular(p)));
                        if (!cands.length) continue;
                        return U.pesado(cands, p => (p.real ? 2 : 1) * (p.pos === u.pos ? 1.5 : 1)
                            * (tipo === 'joia' ? 1 + Math.max(0, p.pot - u.ovr) / 8 : 1) / (1 + Math.abs(p.ovr - u.ovr - 1) * 0.25));
                    }
                }
            }
        }
        return null;
    },

    novoRival(s, tipo, quieto) {
        const r = Historia.escolherRival(s, tipo);
        if (!r) { s.car.rival = null; return null; }
        s.car.rival = {
            pid: r.id, nome: r.nome, desde: s.ano, tipo, v: 0, e: 0, d: 0, ult: [], temps: [], sup: 0,
            g0: r.g, tid0: r.tid, les0: r.les, prov: Mot.agora(s),
        };
        const t = s.times[r.tid];
        const quem = tipo === 'joia' ? `a joia ${r.nome} (${r.idade} anos)` : `${r.nome} (${POS_NOME[r.pos]}, ${r.idade} anos)`;
        Vida.log(s, `⚔️ Nasce uma rivalidade: ${quem}, do ${t.nome}, é o seu novo rival. A imprensa adora comparar vocês dois!`, 'bom');
        if (!quieto) Mundo.noticia(s, `⚔️ ${r.nome} x ${Jogador.p(s).nome}: a imprensa já trata os dois como rivais.`, 'geral');
        return r;
    },

    // ate = último ano da rivalidade (padrão: chamado depois da virada do ano,
    // então ela foi até a temporada que acabou)
    encerrarRival(s, motivo, ate) {
        const rv = s.car.rival;
        if (!rv) return;
        s.car.rivais.unshift({ pid: rv.pid, nome: rv.nome, de: rv.desde, ate: Math.max(rv.desde, ate != null ? ate : s.ano - 1), v: rv.v, e: rv.e, d: rv.d, motivo });
        if (s.car.rivais.length > 8) s.car.rivais.length = 8;
        s.car.rival = null;
    },

    rival(s) {
        const rv = s.car && s.car.rival;
        return rv ? s.jog[rv.pid] || null : null;
    },

    // pontuação de uma temporada (para saber quem foi melhor)
    pontuacao(x, grupo) {
        if (!x.j) return 0;
        const peso = { A: 1, M: 1.2, D: 2, G: 0 }[grupo];
        return x.j * 0.12 + x.g * peso + x.a * 0.7 + (x.j >= 5 ? (x.ns / x.j - 6.4) * 6 : -2);
    },

    // próximo jogo do seu time contra o time do rival
    proxDuelo(s) {
        const u = Jogador.p(s), rp = Historia.rival(s);
        if (!rp || u.tid < 0 || rp.tid < 0 || rp.tid === u.tid) return null;
        return Mundo.calendarioDoTime(s, u.tid).find(j => !j.res && j.sem >= s.semana && (j.h === rp.tid || j.a === rp.tid)) || null;
    },

    // selo no rodapé quando o próximo jogo é contra o rival
    selo(s, prox) {
        if (!Historia.ativo(s) || !prox) return '';
        const rp = Historia.rival(s), u = Jogador.p(s);
        if (!rp || rp.tid < 0 || rp.tid === u.tid || (prox.h !== rp.tid && prox.a !== rp.tid)) return '';
        return ` · <b class="hst-selo">⚔️ duelo com ${U.esc(rp.nome)}</b>`;
    },

    // duelo no jogo contra o time do rival. Devolve o texto (ou '')
    duelo(s, jogo, m, r, u, st, info) {
        const rv = s.car.rival, rp = Historia.rival(s);
        if (!rp || rp.tid < 0 || rp.tid === u.tid || (jogo.h !== rp.tid && jogo.a !== rp.tid)) return null;
        const sr = m.st[rp.id];
        const nr = r.notas[rp.id];
        rv.g0 = rp.g;   // os gols dele neste jogo não viram "notícia da semana"
        if (!st && !sr) return null;
        if (st && !sr) {
            const txt = `⚔️ ${rp.nome} nem entrou em campo. Ponto moral para você no duelo.`;
            Vida.mudar(s, { fama: 0.5 });
            return { txt, res: null };
        }
        if (!st) {
            Vida.mudar(s, { felicidade: -1 });
            return { txt: `⚔️ Você ficou de fora e ${rp.nome} jogou (nota ${nr.toFixed(1)}).`, res: null };
        }
        const n = r.notas[u.id];
        const grupoU = POS_GRUPO[u.pos], grupoR = POS_GRUPO[rp.pos];
        const ind = (x, nota, grupo, sofridos) => nota + x.g * 0.6 + x.a * 0.35 + ((grupo === 'G' || grupo === 'D') && sofridos === 0 ? 0.3 : 0);
        const minhaLado = jogo.h === u.tid ? 0 : 1;
        const golsContra = [r.ga, r.gh];
        const dif = ind(st, n, grupoU, golsContra[minhaLado]) - ind(sr, nr, grupoR, golsContra[1 - minhaLado]);
        const res = dif > 0.25 ? 'v' : dif < -0.25 ? 'd' : 'e';
        rv[res]++;
        const placar = `você ${n.toFixed(1)} x ${nr.toFixed(1)} ele`;
        let txt;
        if (res === 'v') {
            Conquistas.contar(s, 'duelosVencidos');
            Vida.mudar(s, { fama: 1.5 + (info.venceu ? 1 : 0), felicidade: 3 });
            const h = Historia.estado(s);
            h.tor += 2;
            txt = `⚔️ Duelo com ${rp.nome}: ${placar}. VOCÊ LEVOU A MELHOR!`;
        } else if (res === 'd') {
            Vida.mudar(s, { felicidade: -2 });
            txt = `⚔️ Duelo com ${rp.nome}: ${placar}. Hoje ele levou a melhor...`;
        } else txt = `⚔️ Duelo com ${rp.nome}: ${placar}. Empate técnico.`;
        rv.ult.unshift({ ano: s.ano, sem: s.semana, txt: `${s.times[jogo.h].sigla} ${r.gh} x ${r.ga} ${s.times[jogo.a].sigla} · ${placar}`, res });
        if (rv.ult.length > 5) rv.ult.length = 5;
        return { txt, res };
    },

    // notícias da semana sobre o rival (gols, transferência, lesão, provocação)
    noticiasRival(s) {
        const rv = s.car.rival, rp = Historia.rival(s), u = Jogador.p(s);
        if (!rv || !rp) return;
        const agora = Mot.agora(s);
        if (rp.tid !== rv.tid0) {
            rv.tid0 = rp.tid;
            if (rp.tid >= 0 && s.times[rp.tid]) {
                const txt = rp.tid === u.tid
                    ? `💸 Seu rival ${rp.nome} assinou com o SEU clube! Agora a briga é por posição no mesmo vestiário.`
                    : `💸 Seu rival ${rp.nome} trocou de clube: agora joga no ${s.times[rp.tid].nome}.`;
                Vida.log(s, txt, '');
                Historia.avisar(txt);
            }
        }
        const dg = rp.g - (rv.g0 || 0);
        if (dg >= 2 && rp.tid >= 0) {
            const txt = `📰 ${rp.nome} fez ${dg >= 3 ? 'HAT-TRICK' : 'dois gols'} pelo ${s.times[rp.tid].nome}. Seu rival não para!`;
            Vida.log(s, txt, '');
            if (dg >= 3) Historia.avisar(txt);
        }
        rv.g0 = rp.g;
        if (rp.les >= 4 && !(rv.les0 > 0)) Vida.log(s, `🚑 Seu rival ${rp.nome} se lesionou e vai ficar ${rp.les} semanas fora.`, '');
        rv.les0 = rp.les;
        // provocação ou comparação da imprensa (no máximo uma a cada 5 semanas)
        if (agora - (rv.prov || 0) < 5 || !U.chance(0.07)) return;
        rv.prov = agora;
        let txt;
        if (U.chance(0.55)) {
            const frase = U.escolha([
                `Ele ainda tem muito a aprender.`, `Na nossa posição, só tem um craque. E não é ele.`, `Quero ver repetir isso contra mim.`,
                `Respeito, mas eu jogo mais.`, `Ele é bom... nos vídeos da internet.`, `Manda ele treinar finalização.`,
            ]);
            txt = `📱 ${rp.nome} provocou você nas redes: "${frase}"`;
            Vida.mudar(s, { felicidade: -1.5, fama: 0.5 });
            s.pessoa.seg = (s.pessoa.seg || 0) * 1.01;
        } else {
            const nf = x => (x.j ? (x.ns / x.j).toFixed(2).replace('.', ',') : '-');
            const mu = nf(u), mr = nf(rp);
            txt = `📰 Jornal compara você e ${rp.nome}: ${u.g} gols e nota ${mu} contra ${rp.g} gols e nota ${mr} dele. "Quem é o melhor?", pergunta a manchete.`;
            Vida.mudar(s, { fama: 0.5 });
        }
        Vida.log(s, txt, '');
        Historia.avisar(txt);
        Mundo.noticia(s, txt, 'geral');
    },

    // aviso na semana anterior ao duelo
    hype(s) {
        const u = Jogador.p(s), rp = Historia.rival(s);
        if (!rp || u.tid < 0 || rp.tid < 0 || rp.tid === u.tid) return;
        const prox = Mundo.calendarioDoTime(s, u.tid).find(j => !j.res && j.sem === s.semana + 1 && (j.h === rp.tid || j.a === rp.tid));
        if (!prox) return;
        const txt = `🔥 Semana que vem tem DUELO: você x ${rp.nome} (${s.times[rp.tid].nome}), pela ${prox.nomeComp}. A imprensa já esquenta o confronto!`;
        Vida.log(s, txt, '');
        Historia.avisar(txt);
        Mundo.noticia(s, `⚔️ ${rp.nome} x ${u.nome}: o duelo particular da semana!`, 'geral');
    },

    // -----------------------------------------------------------------
    //  🎯 Metas da temporada
    // -----------------------------------------------------------------
    contadores(s) {
        return { j: 0, g: 0, a: 0, ns: 0, tit: 0, vm: 0, cs: 0, mvp: 0, clas: 0, sel0: (s.car.selecao && s.car.selecao.jogos) || 0 };
    },

    papel(s) {
        const u = Jogador.p(s), t = s.times[u.tid];
        const mesmos = Mundo.elenco(s, t).filter(x => POS_GRUPO[x.pos] === POS_GRUPO[u.pos]).sort((a, b) => b.ovr - a.ovr);
        const rank = mesmos.indexOf(u) + 1;
        const vagas = { G: 1, D: 4, M: 3, A: 3 }[POS_GRUPO[u.pos]];
        if (u.pos === 'GOL') return rank <= 1 ? 'titular' : 'reserva';   // goleiro reserva quase não joga
        return rank <= vagas ? 'titular' : rank <= vagas + 2 ? 'briga' : 'reserva';
    },

    temClassico(s, t) {
        const liga = Mundo.liga(s, t.liga);
        return !!liga && liga.times.some(id => id !== t.id && Mundo.classico(s, t.id, id));
    },

    novasMetas(s) {
        const u = Jogador.p(s);
        const resta = (TOTAL_SEMANAS - s.semana) / TOTAL_SEMANAS;
        if (u.tid < 0) { s.car.metas = { ano: s.ano, lista: [], c: Historia.contadores(s), semClube: true }; return; }
        const mt = { ano: s.ano, sem: s.semana, lista: [], c: Historia.contadores(s) };
        s.car.metas = mt;
        if (resta < 0.3) { mt.tarde = true; return; }   // temporada quase no fim: metas só na próxima
        const t = s.times[u.tid];
        const liga = Mundo.liga(s, t.liga);
        const E = ESPERADO_POS[u.pos];
        const grupo = POS_GRUPO[u.pos];
        const papel = Historia.papel(s);
        const fl = U.clamp(liga.rodadas.length / 38, 0.75, 1.25);
        const forca = u.ovr - t.rep;
        const fq = forca >= 5 ? 1.15 : forca <= -9 ? 0.6 : forca <= -6 ? 0.8 : 1;
        // quem briga por posição ou é reserva joga bem menos (medido simulando carreiras);
        // atacante reserva ainda faz muitos gols saindo do banco
        const share = { titular: 1, briga: 0.6, reserva: 0.45 }[papel];
        const shareGols = grupo === 'A' ? { titular: 1, briga: 0.72, reserva: 0.5 }[papel] : share;
        // garoto com muito espaço para crescer evolui durante o ano: a cobrança é um pouco maior
        const fj = u.idade <= 21 && u.pot - u.ovr >= 5 ? 1.1 : 1;
        const k = share * fl * fq * fj * resta, kg = shareGols * fl * fq * fj * resta;
        const alvo = (v, min) => Math.max(min, Math.round(v * k * U.rand(0.9, 1.1)));
        const alvoGols = (v, min) => Math.max(min, Math.round(v * kg * U.rand(0.9, 1.1)));
        const kj = fl * resta;
        const alvoTit = Math.max(3, Math.round({ titular: 20, briga: 12, reserva: 6 }[papel] * kj));
        const alvoJogos = Math.max(3, Math.round((u.pos === 'GOL' && papel !== 'titular' ? 5 : { titular: 30, briga: 24, reserva: 16 }[papel]) * kj * (papel === 'titular' ? 1 : fq)));
        const notaAlvo = Math.round((E.nota + { titular: 0, briga: -0.2, reserva: -0.25 }[papel] + (fq > 1 ? 0.1 : fq < 1 ? -0.1 : 0) + (u.idade <= 19 ? -0.1 : 0)) * 10) / 10;
        // média de nota só vale com um mínimo de jogos (menor para quem joga pouco)
        const minJ = Math.max(3, Math.min(Math.round(10 * resta), Math.round(alvoJogos * 0.6)));
        const usados = new Set();
        const add = (origem, tipo, n, extra) => {
            if (usados.has(tipo)) return false;
            usados.add(tipo);
            const T = TIPOS_META[tipo];
            mt.lista.push(Object.assign({ origem, tipo, alvo: n, icone: tipo === 'cs' && grupo === 'G' ? '🧤' : T.icone, txt: T.txt(n), st: null }, extra || {}));
            return true;
        };
        // 1) a meta principal do técnico (depende da posição; jogo sem sofrer gol só para quem é titular)
        const titular = papel === 'titular';
        // goleiro reserva ou garoto muito abaixo do elenco: primeiro, ganhar minutos
        if ((u.pos === 'GOL' && !titular) || (!titular && forca <= -9)) add('tecnico', 'jogos', alvoJogos);
        else if (u.pos === 'ATA') add('tecnico', 'gols', alvoGols(E.g, 3));
        else if (u.pos === 'PON') { if (U.chance(0.6)) add('tecnico', 'gols', alvoGols(E.g, 3)); else add('tecnico', 'ga', alvoGols(E.g + E.a, 4)); }
        else if (u.pos === 'MEI') { if (U.chance(0.6)) add('tecnico', 'assist', alvo(E.a, 3)); else add('tecnico', 'ga', alvo(E.g + E.a, 4)); }
        else if (u.pos === 'VOL') { if (titular && U.chance(0.5)) add('tecnico', 'titular', alvoTit); else add('tecnico', 'ga', alvo(E.g + E.a, 2)); }
        else if (u.pos === 'LAT') { if (!titular || U.chance(0.6)) add('tecnico', 'assist', alvo(E.a, 2)); else add('tecnico', 'cs', alvo(E.cs, 2)); }
        else if (titular) add('tecnico', 'cs', alvo(E.cs, 2));
        else add('tecnico', 'jogos', alvoJogos);
        // 2) regularidade / comportamento
        const opc = [];
        if (papel === 'reserva') opc.push('jogos', 'jogos', 'nota');
        else if (papel === 'briga' || u.idade <= 19) opc.push('titular', 'titular', 'jogos');
        if (grupo === 'D' || u.pos === 'VOL') opc.push('disciplina');
        opc.push('nota', 'nota');
        if (titular) opc.push('titular');
        for (const tipo of U.embaralhar(opc)) {
            // zagueiro e volante titulares levam muito cartão: podem ser expulsos uma vez
            const maxVm = titular && (u.pos === 'ZAG' || u.pos === 'VOL') && resta > 0.6 ? 1 : 0;
            if (add('tecnico', tipo, tipo === 'nota' ? notaAlvo : tipo === 'titular' ? alvoTit : tipo === 'jogos' ? alvoJogos : maxVm,
                tipo === 'nota' || tipo === 'disciplina' ? { minJ } : null)) break;
        }
        // 3) empresário, patrocinador ou torcida
        const emp = s.car.emp, patr = s.pessoa.patrocinios[0];
        let feito = false;
        if (emp) {
            const ex = { quem: emp.nome };
            // seguidores: o que a fama de hoje dá, mais o equivalente a +4 de fama na temporada
            const seg = Math.max(s.pessoa.seg || 0, Math.pow(10, 2 + s.pessoa.fama * 0.065));
            if (emp.tipo === 'marqueteiro') feito = add('empresario', 'seg', Historia.bonito(Math.max(seg * Math.pow(10, 0.26 * resta), (s.pessoa.seg || 0) + 100)), ex);
            else if (emp.tipo === 'negociador' && u.idade <= 26 && u.ovr < u.pot) feito = add('empresario', 'ovr', Math.min(u.pot, u.ovr + (u.idade <= 21 ? 3 : u.idade <= 24 ? 2 : 1)), ex);
            else if (emp.tipo === 'conexoes' && Historia.convocavel(s)) feito = add('empresario', 'selecao', 1, ex);
            if (!feito) feito = add('empresario', 'mvp', alvo(E.mvp + 1, 2), ex) || add('empresario', 'jogos', alvoJogos, ex);
        } else if (patr) {
            const ex = { quem: patr.marca, bonus: Math.round(Math.max(10000, patr.semana * 10, u.sal * 0.06) / 1000) * 1000 };
            if (grupo === 'A' || u.pos === 'MEI') feito = add('patrocinador', 'ga', (grupo === 'A' ? alvoGols : alvo)((E.g + E.a) * 1.1, 4), ex);
            if (!feito) feito = add('patrocinador', 'mvp', alvo(E.mvp + 1, 2), ex) || add('patrocinador', 'nota', notaAlvo, Object.assign({ minJ }, ex));
        }
        if (!feito) {
            if (Historia.temClassico(s, t)) add('torcida', 'classico', 1);
            else add('torcida', 'mvp', alvo(E.mvp, 1)) || add('torcida', 'jogos', alvoJogos);
        }
        for (const m of mt.lista) m.premio = Historia.textoPremio(m);
        if (mt.lista.length) Vida.log(s, `🎯 Metas de ${s.ano} no ${t.nome}: ${mt.lista.map(m => m.txt).join(' · ')}. Acompanhe na aba ⚽ Carreira.`, '');
    },

    convocavel(s) {
        try { return Selecoes.usuarioConvocado(s, s.pessoa.pais); } catch (e) { return false; }
    },

    textoPremio(m) {
        if (m.origem === 'tecnico') return '+1 ponto de habilidade e mais confiança do técnico';
        if (m.origem === 'patrocinador') return `bônus de ${U.dinheiro(m.bonus)} da ${m.quem}`;
        if (m.origem === 'empresario') return 'ele usa os números para te dar um aumento de 8%';
        return 'a torcida vai cantar o seu nome (+fama)';
    },

    // valor e progresso (0-1) de uma meta, e o texto do número
    progresso(s, m) {
        const c = s.car.metas.c, T = TIPOS_META[m.tipo];
        if (m.tipo === 'nota') {
            const md = c.j ? c.ns / c.j : null;
            return { pct: md == null ? 0 : U.clamp((md - 5.5) / (m.alvo - 5.5), 0, 1), num: `${md == null ? '-' : md.toFixed(2).replace('.', ',')} / ${Historia.fmtNota(m.alvo)}`, sub: `${c.j} de no mínimo ${m.minJ || 10} jogos` };
        }
        if (m.tipo === 'disciplina') return { pct: c.vm > (m.alvo || 0) ? 0 : 1, num: `${c.vm === 1 ? '1 expulsão' : `${c.vm} expulsões`}${m.alvo ? ` (máx. ${m.alvo})` : ''}`, sub: `${c.j} de no mínimo ${m.minJ || 10} jogos` };
        const v = T.valor(c, s);
        const f = m.tipo === 'seg' ? Vida.numero : x => x;
        return { pct: U.clamp(v / m.alvo, 0, 1), num: `${f(Math.min(v, m.alvo))}/${f(m.alvo)}` };
    },

    cumprir(s, m) {
        m.st = 'ok';
        Conquistas.contar(s, 'metasCumpridas');
        const u = Jogador.p(s), h = Historia.estado(s);
        let ef = '';
        if (m.origem === 'tecnico') {
            h.tec += 12;
            s.car.pontos = (s.car.pontos || 0) + 1;
            ef = ` +1 ponto de habilidade e o técnico confia mais em você.${Vida.mudar(s, { felicidade: 3 })}`;
        } else if (m.origem === 'patrocinador') {
            ef = ` A ${m.quem} pagou o bônus!${Vida.mudar(s, { dinheiro: m.bonus || 10000, fama: 1.5 })}`;
        } else if (m.origem === 'empresario') {
            if (u.tid >= 0) {
                const novo = U.redondo(u.sal * 1.08);
                ef = ` ${m.quem} conseguiu um aumento: ${U.dinheiro(u.sal)} → ${U.dinheiro(novo)} por ano.`;
                u.sal = novo;
            }
            ef += Vida.mudar(s, { fama: 1.5, felicidade: 3 });
        } else {
            h.tor += 15;
            ef = ` A torcida canta o seu nome!${Vida.mudar(s, { fama: 3, felicidade: 3 })}`;
        }
        Historia.clampClima(h);
        m.ef = ef;
        const txt = `🎯 Meta cumprida (${ORIGEM_META[m.origem].nome}): ${m.txt}!${ef}`;
        Vida.log(s, txt, 'bom');
        Historia.anotarSessao('metasOk');
        return txt;
    },

    falhar(s, m) {
        m.st = 'falhou';
        const h = Historia.estado(s);
        let ef = '';
        if (m.origem === 'tecnico') { h.tec -= 10; ef = ` O técnico cobrou.${Vida.mudar(s, { felicidade: -3 })}`; }
        else if (m.origem === 'torcida') { h.tor -= 8; ef = ` A torcida ficou na bronca.${Vida.mudar(s, { felicidade: -2 })}`; }
        else if (m.origem === 'patrocinador') {
            // a marca corta 10% do contrato (se ele ainda existir)
            const pt = s.pessoa.patrocinios.find(x => x.marca === m.quem);
            if (pt) { pt.semana = Math.round(pt.semana * 0.9 / 100) * 100; ef = ` A ${m.quem} cortou 10% do patrocínio.`; }
            ef += Vida.mudar(s, { felicidade: -2 });
        } else ef = ` ${m.quem || 'Seu empresário'} ficou decepcionado.${Vida.mudar(s, { felicidade: -2 })}`;
        Historia.clampClima(h);
        m.ef = ef;
        const txt = `❌ Meta perdida (${ORIGEM_META[m.origem].nome}): ${m.txt}.${ef}`;
        Vida.log(s, txt, 'ruim');
        Historia.anotarSessao('metasNao');
        return txt;
    },

    // confere as metas que já se decidiram. Devolve os textos do que mudou
    checarMetas(s) {
        const mt = s.car.metas;
        const msgs = [];
        if (!mt || !mt.lista || mt.ano !== s.ano) return msgs;
        for (const m of mt.lista) {
            if (m.st) continue;
            if (m.tipo === 'disciplina') { if (mt.c.vm > (m.alvo || 0)) msgs.push(Historia.falhar(s, m)); continue; }
            if (TIPOS_META[m.tipo].fim) continue;
            if (TIPOS_META[m.tipo].valor(mt.c, s) >= m.alvo) msgs.push(Historia.cumprir(s, m));
        }
        return msgs;
    },

    // fim da temporada: decide o que faltava
    fecharMetas(s) {
        const mt = s.car.metas;
        if (!mt || !mt.lista || !mt.lista.length || mt.ano !== s.ano) return null;
        Historia.checarMetas(s);
        const c = mt.c;
        for (const m of mt.lista) {
            if (m.st) continue;
            let ok;
            if (m.tipo === 'nota') ok = c.j >= (m.minJ || 10) && c.ns / c.j >= m.alvo - 1e-9;
            else if (m.tipo === 'disciplina') ok = c.vm <= (m.alvo || 0) && c.j >= (m.minJ || 10);
            else ok = TIPOS_META[m.tipo].valor(c, s) >= m.alvo;
            if (ok) Historia.cumprir(s, m); else Historia.falhar(s, m);
        }
        const todas = mt.lista.length >= 2 && mt.lista.every(m => m.st === 'ok');
        if (todas) {
            s.car.pontos = (s.car.pontos || 0) + 1;
            Conquistas.contar(s, 'temporadasPerfeitas');
            Vida.log(s, `🎯 Temporada perfeita: você cumpriu TODAS as metas! (+1 ponto de habilidade extra)${Vida.mudar(s, { felicidade: 5, fama: 2 })}`, 'titulo');
        }
        return { lista: mt.lista.map(m => ({ icone: m.icone, txt: m.txt, origem: m.origem, quem: m.quem, st: m.st, ef: m.ef || '' })), todas };
    },

    // -----------------------------------------------------------------
    //  Depois de cada jogo do clube (ao vivo ou simulado)
    // -----------------------------------------------------------------
    async posJogo(s, jogo, m, r, rapido) {
        if (!Historia.ativo(s)) return '';
        Historia.garantir(s);
        const u = Jogador.p(s);
        if (u.tid !== jogo.h && u.tid !== jogo.a) return '';
        const st = m.st[u.id];
        const lado = jogo.h === u.tid ? 0 : 1;
        const adv = s.times[lado === 0 ? jogo.a : jogo.h];
        const gf = lado === 0 ? r.gh : r.ga, gc = lado === 0 ? r.ga : r.gh;
        const venceu = r.venc === u.tid || (r.venc == null && gf > gc);
        const perdeu = r.venc != null ? r.venc !== u.tid : gf < gc;
        const classico = Mundo.classico(s, jogo.h, jogo.a);
        const final = Mundo.ehFinal(s, jogo);
        const linhas = [];
        // contadores das metas
        const mt = s.car.metas;
        if (st && mt && mt.c && mt.ano === s.ano) {
            const c = mt.c;
            c.j++; c.g += st.g; c.a += st.a; c.ns += r.notas[u.id];
            if (st.entrou === 0) c.tit++;
            if (st.vm) c.vm++;
            if (r.melhor === u.id) c.mvp++;
            if (gc === 0 && st.entrou === 0 && st.saiu == null) c.cs++;
            if (classico && venceu) c.clas++;
        }
        // duelo com o rival
        const duelo = Historia.duelo(s, jogo, m, r, u, st, { venceu });
        if (duelo) {
            Vida.log(s, duelo.txt, duelo.res === 'v' ? 'bom' : duelo.res === 'd' ? 'ruim' : '');
            if (duelo.res) Historia.anotarSessao('duelo', duelo.res);
            if (rapido) Historia.avisar(duelo.txt);
            else linhas.push(`<div class="rf-linha hst-duelo ${duelo.res === 'v' ? 'destaque-bom' : ''}">${U.esc(duelo.txt)}</div>`);
        }
        // metas que se decidiram neste jogo
        for (const txt of Historia.checarMetas(s)) {
            if (rapido) Historia.avisar(txt);
            else linhas.push(`<div class="rf-linha hst-meta-fim">${txt}</div>`);
        }
        Historia.clampClima(Historia.estado(s));
        // entrevista (só nos jogos ao vivo, de vez em quando, depois de jogos marcantes)
        Historia.entPend = null;
        if (!rapido && st) {
            const n = r.notas[u.id];
            const ctx = {
                n, g: st.g, a: st.a, vm: !!st.vm, venceu, perdeu, empate: !venceu && !perdeu, classico, final,
                titulo: final && venceu, adv: adv.nome, rival: duelo && duelo.res ? { nome: Historia.rival(s).nome, res: duelo.res } : null,
            };
            const notavel = n >= 7.8 || n <= 5.6 || st.g >= 2 || ctx.vm || classico || final || !!ctx.rival;
            const h = Historia.estado(s);
            const agora = Mot.agora(s);
            if (notavel && agora - h.ent >= 3 && U.chance(ctx.rival || ctx.titulo ? 0.85 : 0.6)) {
                ctx.agora = agora;
                Historia.entPend = ctx;
                linhas.push(Historia.htmlEntrevista(ctx));
            }
        }
        return linhas.join('');
    },

    // -----------------------------------------------------------------
    //  🎤 Entrevista / redes sociais
    // -----------------------------------------------------------------
    pergunta(c) {
        if (c.titulo) return 'É CAMPEÃO! O que você diz para a torcida?';
        if (c.rival) {
            if (c.rival.res === 'v') return `Você levou a melhor no duelo com ${c.rival.nome}. Algum recado para ele?`;
            if (c.rival.res === 'd') return `${c.rival.nome} levou a melhor hoje. Como você responde?`;
            return `Duelo equilibrado com ${c.rival.nome}. E aí, quem é o melhor?`;
        }
        if (c.vm) return 'Você foi expulso. Foi justo?';
        if (c.classico) return c.venceu ? `Vitória no clássico contra o ${c.adv}! O que isso significa?` : c.perdeu ? 'Derrota no clássico... o que faltou?' : 'Empate no clássico. Ficou um gosto amargo?';
        if (c.g >= 3) return 'Hat-trick! Já pediu música no Fantástico?';
        if (c.n >= 7.8) return 'Que atuação! Você foi o nome do jogo. O que tem a dizer?';
        if (c.n <= 5.6) return 'Noite difícil, hein? A torcida pegou no seu pé. Alguma resposta?';
        if (c.final) return 'Que final! Como você avalia?';
        return 'O que achou do jogo?';
    },

    htmlEntrevista(c) {
        const alvo = c.rival ? c.rival.nome.split(' ').slice(-1)[0] : c.classico ? 'o rival' : null;
        return `<!--hst-ent--><div class="hst-entrevista" id="hst-ent">
            <div class="hst-ent-tit">🎤 Entrevista na saída do campo <small class="cinza">(opcional)</small></div>
            <div class="hst-ent-perg">"${U.esc(Historia.pergunta(c))}"</div>
            <div class="hst-ent-botoes">
                <button class="btn btn-pequeno" data-acao="hstEntrevista" data-k="humilde">🙏 Humilde</button>
                <button class="btn btn-pequeno" data-acao="hstEntrevista" data-k="confiante">😎 Confiante</button>
                <button class="btn btn-pequeno" data-acao="hstEntrevista" data-k="polemico">🔥 ${alvo ? `Provocar ${U.esc(alvo)}` : 'Polemizar'}</button>
                <button class="btn btn-pequeno" data-acao="hstEntrevista" data-k="redes">📱 Postar nas redes</button>
            </div>
        </div><!--/hst-ent-->`;
    },

    responder(s, k, c) {
        const h = Historia.estado(s), ps = s.pessoa;
        const bom = c.n >= 7.2 || c.g >= 2 || c.titulo || (c.rival && c.rival.res === 'v');
        const ruim = c.n < 6 || c.vm;
        const seg0 = ps.seg || 0;
        const ganhaSeg = f => { const g = Math.round(seg0 * f + 100); ps.seg = seg0 + g; return Vida.numero(g); };
        const alvo = c.rival ? c.rival.nome : c.classico ? `o ${c.adv}` : 'a arbitragem';
        let txt, tipo = '';
        if (k === 'humilde') {
            const frase = c.titulo ? 'Esse título é do grupo e da torcida. Eu só ajudei.'
                : ruim ? 'Hoje eu errei. Assumo a responsabilidade e vou trabalhar dobrado.'
                    : bom ? 'O mérito é do grupo. Eu só fiz a minha parte.' : 'Seguimos trabalhando. Respeito total ao adversário.';
            h.tec += 4; h.tor += ruim ? 4 : 2;
            txt = `🙏 "${frase}" O técnico e a torcida gostaram da postura.${Vida.mudar(s, { fama: bom ? 1 : 0.5, felicidade: 1 })}`;
            tipo = 'bom';
        } else if (k === 'confiante') {
            if (ruim) {
                h.tor -= 5; h.tec -= 3;
                txt = `😎 "Eu sei do meu potencial, um jogo não me define." Depois dessa atuação, soou arrogante.${Vida.mudar(s, { fama: -1 })}`;
                tipo = 'ruim';
            } else {
                h.tor += bom ? 4 : 1;
                const g = ganhaSeg(bom ? 0.03 : 0.01);
                txt = `😎 "${bom ? 'Eu nasci para jogos assim. Vou ser o melhor do país!' : 'Esse time vai brigar por tudo, pode escrever.'}" A frase rodou a internet: +${g} seguidores.${Vida.mudar(s, { fama: bom ? 2.5 : 1, felicidade: 2 })}`;
                tipo = 'bom';
            }
        } else if (k === 'polemico') {
            const frase = c.rival ? U.escolha([`${c.rival.nome}? Hoje ele só me viu de costas.`, `Pergunta para o ${c.rival.nome} quem manda nesse duelo.`, `Respeito o ${c.rival.nome}, mas o melhor da posição sou eu.`])
                : c.classico ? U.escolha([`O ${c.adv} é freguês. Pode escrever.`, `Clássico é para quem tem camisa. Eles sentiram.`, `A torcida deles pode chorar, o clássico é nosso.`])
                    : U.escolha(['Com essa arbitragem não dá. Alguém precisa falar!', 'Ninguém tem coragem de dizer, mas o juiz decidiu o jogo.', 'Tem gente que não quer ver a gente ganhar.']);
            const p = U.clamp(0.5 + (bom ? 0.15 : 0) - (ruim ? 0.2 : 0) + (c.venceu ? 0.1 : c.perdeu ? -0.1 : 0), 0.15, 0.85);
            if (U.chance(p)) {
                const g = ganhaSeg(U.rand(0.06, 0.14));
                h.tor += (c.rival || c.classico) ? 7 : 3; h.tec -= 2;
                Conquistas.contar(s, 'provocacoesBoas');
                txt = `🔥 "${frase}" A provocação BOMBOU: +${g} seguidores e a torcida adorou!${Vida.mudar(s, { fama: 4, felicidade: 3 })}`;
                tipo = 'bom';
                if (c.rival || c.classico) h.pol = { quando: c.agora + U.int(1, 3), alvo: c.rival ? c.rival.nome : c.adv, tipo: 'resposta' };
            } else {
                h.tec -= 7; h.tor -= 3;
                txt = `🔥 "${frase}" Pegou MAL: virou polêmica nacional e o técnico não gostou nada.${Vida.mudar(s, { fama: -2, felicidade: -3 })}`;
                tipo = 'ruim';
                h.pol = { quando: c.agora + U.int(1, 2), alvo, tipo: 'crise' };
            }
        } else {
            const post = c.titulo ? 'a foto beijando a taça' : c.g ? 'o vídeo da comemoração do gol' : c.venceu ? 'uma selfie com a torcida no vestiário' : c.perdeu ? 'uma mensagem de "cabeça erguida"' : 'os bastidores do jogo';
            if (ruim && U.chance(0.4)) {
                ps.seg = seg0 * 0.98;
                txt = `📱 Você postou ${post}, mas os haters lotaram os comentários. Perdeu seguidores.${Vida.mudar(s, { felicidade: -3 })}`;
                tipo = 'ruim';
            } else {
                const g = ganhaSeg(bom ? U.rand(0.04, 0.1) : U.rand(0.008, 0.025));
                const curt = Vida.numero(Math.max(50, seg0 * U.rand(0.03, bom ? 0.25 : 0.1)));
                txt = `📱 Você postou ${post}: ${curt} curtidas e +${g} seguidores.${Vida.mudar(s, { fama: bom ? 1.5 : 0.5, felicidade: 1 })}`;
                tipo = 'bom';
            }
        }
        Historia.clampClima(h);
        h.ent = c.agora;
        Conquistas.contar(s, 'entrevistas');
        Vida.log(s, txt, tipo);
        return txt;
    },

    // continuação das polêmicas (só log e aviso rápido, sem janela)
    polemicas(s) {
        const h = Historia.estado(s);
        if (!h.pol || Mot.agora(s) < h.pol.quando) return;
        const pol = h.pol, u = Jogador.p(s);
        h.pol = null;
        let txt;
        if (pol.tipo === 'resposta') {
            const frase = U.escolha(['Fala muito e joga pouco.', 'Vamos ver no próximo jogo.', 'Nem vou perder meu tempo respondendo... ops, respondi.', 'Respeito é bom e eu gosto.']);
            s.pessoa.seg = (s.pessoa.seg || 0) * 1.02;
            txt = `📱 ${pol.alvo} respondeu à sua provocação: "${frase}" A internet está dividida!${Vida.mudar(s, { fama: 1.5 })}`;
        } else {
            const r = Math.random();
            if (r < 0.45 && u.tid >= 0) {
                const multa = U.redondo(Math.max(2000, u.sal * 0.03));
                h.tec -= 2;
                txt = `💸 O clube te multou em ${U.dinheiro(multa)} pela entrevista polêmica.${Vida.mudar(s, { dinheiro: -multa, felicidade: -2 })}`;
            } else if (r < 0.75) {
                h.tor += 2; h.tec += 3;
                txt = `🙊 Você teve que pedir desculpas publicamente pela entrevista. O assunto morreu.${Vida.mudar(s, { felicidade: -2 })}`;
            } else {
                s.pessoa.seg = (s.pessoa.seg || 0) * 1.03;
                h.tec -= 2;
                txt = `📢 A polêmica virou meme e você ganhou seguidores, mas o vestiário ficou de cara feia.${Vida.mudar(s, { fama: 2 })}`;
            }
        }
        Historia.clampClima(h);
        Vida.log(s, txt, 'evento');
        Historia.avisar(txt);
    },

    // -----------------------------------------------------------------
    //  Clima no clube: confiança do técnico e moral com a torcida
    // -----------------------------------------------------------------
    clima(s) {
        const h = Historia.estado(s), u = Jogador.p(s);
        h.tec += (50 - h.tec) * 0.03;
        h.tor += (50 - h.tor) * 0.03;
        Historia.clampClima(h);
        if (u.tid >= 0) {
            // o técnico confiante dá mais chances (é o mesmo bônus da conversa com o técnico);
            // desconfiado, deixa você na geladeira
            const alvo = h.tec >= 80 ? 2.5 : h.tec >= 65 ? 1.5 : h.tec <= 25 ? -1.5 : 0;
            const atual = u.bonusEscala || 0;
            if (alvo > 0 && atual < alvo) { u.bonusEscala = alvo; u.bonusEscalaSem = Math.max(u.bonusEscalaSem || 0, 1); }
            else if (alvo < 0 && atual <= 0) u.bonusEscala = alvo;
            else if (alvo >= 0 && atual < 0) u.bonusEscala = 0;
        } else if ((u.bonusEscala || 0) < 0) u.bonusEscala = 0;
        if (h.tor >= 75) Vida.mudar(s, { felicidade: 0.4 });
        else if (h.tor <= 25) Vida.mudar(s, { felicidade: -0.4 });
    },

    rotuloTec(v) {
        return v >= 80 ? 'Homem de confiança: muito mais chances de jogar' : v >= 65 ? 'Ele gosta de você: mais chances de jogar'
            : v <= 25 ? 'Na geladeira: menos chances de jogar' : 'Relação normal';
    },

    rotuloTor(v) {
        return v >= 75 ? 'Ídolo: a torcida te deixa mais feliz' : v <= 25 ? 'Vaiado: a pressão tira sua felicidade' : 'Relação normal';
    },

    // -----------------------------------------------------------------
    //  💼 Empresário
    // -----------------------------------------------------------------
    gerarEmpresario(s, tipo, usados) {
        if (U.chance(0.35)) {
            const reais = EMPRESARIOS_REAIS.filter(r => r[2] === tipo && !usados.has(r[0]));
            if (reais.length) {
                const r = U.escolha(reais);
                return { nome: r[0], bnd: r[1], tipo, est: r[3], com: COMISSAO_EMP[r[3]], real: true };
            }
        }
        const est = U.clamp(Math.round(1 + s.pessoa.fama / 22 + U.rand(-0.6, 1.1)), 1, 4);
        const pais = U.escolha([['br', '🇧🇷'], ['pt', '🇵🇹'], ['es', '🇪🇸'], ['it', '🇮🇹'], ['ar', '🇦🇷'], ['fr', '🇫🇷'], ['de', '🇩🇪'], ['nl', '🇳🇱']]);
        return { nome: Nomes.gerar(pais[0], true), bnd: pais[1], tipo, est, com: U.clamp(COMISSAO_EMP[est] + U.int(-1, 1), 4, 12), real: false };
    },

    // três candidatos (um de cada tipo); a lista muda a cada 12 semanas
    mercadoEmp(s) {
        const h = Historia.estado(s);
        const agora = Mot.agora(s);
        if (!h.merc || agora >= h.merc.prox || !h.merc.lista.length) {
            const usados = new Set(s.car.emp ? [s.car.emp.nome] : []);
            h.merc = { prox: agora + 12, lista: Object.keys(TIPOS_EMP).map(tipo => { const e = Historia.gerarEmpresario(s, tipo, usados); usados.add(e.nome); return e; }) };
        }
        return h.merc.lista;
    },

    // o que ele faz por você, em números (depende das estrelas)
    efeitoEmp(e) {
        return e.tipo === 'negociador' ? `+${5 * e.est}% nos salários, luvas de ${4 * e.est}% ao assinar e mais chance quando você pede mais`
            : e.tipo === 'marqueteiro' ? `patrocínios ${Math.round(8 * e.est)}% mais gordos e marcas novas`
                : `mais propostas e clubes até ${Math.round(1.3 * e.est)} pontos de força acima`;
    },

    htmlEmp(e, fama) {
        const T = TIPOS_EMP[e.tipo];
        const trava = fama < FAMA_EMP[e.est];
        return `<div class="hst-emp-cand ${e.real ? 'real' : ''} ${trava ? 'bloq' : ''}">
            <div class="hst-emp-cab"><span class="hst-emp-band">${e.bnd}</span><span><b>${U.esc(e.nome)}</b>${e.real ? ' <small class="tag-real">famoso</small>' : ''}<br><span class="estrelas-olh">${U.estrelas(e.est)}</span></span></div>
            <div><span class="hst-tipo">${T.icone} ${T.nome}</span> <small class="cinza">${Historia.efeitoEmp(e)}.</small></div>
            <small>Comissão: <b>${e.com}%</b> do salário${e.tipo === 'marqueteiro' ? ' e dos patrocínios' : ''}${trava ? ` · <b class="vermelho">🔒 só aceita quem tem fama ${FAMA_EMP[e.est]}+</b>` : ''}</small>
        </div>`;
    },

    async procurarEmpresario(s) {
        const lista = Historia.mercadoEmp(s);
        const fama = s.pessoa.fama;
        const antigo = s.car.emp, multa = antigo ? Historia.multaEmp(s) : 0;
        const i = await UI.modal({
            titulo: '💼 Escolher empresário',
            html: `<p class="pequeno">Um empresário cuida dos seus contratos e da sua imagem em troca de uma comissão. Os mais famosos só aceitam jogadores famosos. ${antigo ? `<b>Trocar de empresário encerra o contrato com ${U.esc(antigo.nome)} (rescisão de ${U.dinheiro(multa)}).</b>` : ''}</p>
                <div class="hst-emp-cands">${lista.map(e => Historia.htmlEmp(e, fama)).join('')}</div>
                <p class="cinza pequeno">A lista muda a cada 12 semanas.</p>`,
            botoes: lista.map((e, k) => ({ txt: fama >= FAMA_EMP[e.est] ? `✍️ Contratar ${U.esc(e.nome)}` : `🔒 ${U.esc(e.nome)} (fama ${FAMA_EMP[e.est]}+)`, valor: k, classe: 'btn-opcao', desativado: fama < FAMA_EMP[e.est] }))
                .concat([{ txt: 'Agora não', valor: -1, classe: 'btn-fantasma' }]),
        });
        if (i == null || i < 0 || !lista[i]) return false;
        if (antigo && s.car.emp === antigo) Vida.log(s, `💼 Você rompeu com ${antigo.nome}.${Vida.mudar(s, { dinheiro: -multa })}`, '');
        Historia.contratarEmp(s, lista[i]);
        Historia.estado(s).merc.lista.splice(i, 1);
        return true;
    },

    contratarEmp(s, e) {
        const antigo = s.car.emp;
        s.car.emp = Object.assign({}, e, { desde: s.ano, pago: 0 });
        if (e.est >= 5) Conquistas.contar(s, 'empresario5');
        const T = TIPOS_EMP[e.tipo];
        const txt = `💼 ${e.nome} (${T.icone} ${T.nome}, ${e.est}★) agora é o seu empresário${antigo ? ` no lugar de ${antigo.nome}` : ''}. Comissão: ${e.com}%.`;
        Vida.log(s, txt, 'bom');
        UI.toast(txt);
    },

    // multa para encerrar o contrato com o empresário
    multaEmp(s) {
        const e = s.car.emp, u = Jogador.p(s);
        return Math.max(2000, Math.round((u.tid >= 0 ? u.sal / 52 : 0) * e.com / 100 * 8 / 100) * 100);
    },

    // salário melhor com o Negociador (propostas e renovação). Descontada a
    // comissão, sobra de ~0% (1★) a ~+10% (5★), fora as luvas
    salario(s, sal) {
        const e = Historia.ativo(s) ? s.car.emp : null;
        if (!e || e.tipo !== 'negociador') return sal;
        return U.redondo(sal * (1 + 0.05 * e.est));
    },

    // chance extra quando você pede mais (renovação, proposta, aumento) com o Negociador
    bonusPedido(s) {
        const e = Historia.ativo(s) ? s.car.emp : null;
        return e && e.tipo === 'negociador' ? 0.04 * e.est : 0;
    },

    // luvas que o Negociador arranca ao assinar ou renovar
    luvas(s, sal, onde) {
        const e = Historia.ativo(s) ? s.car.emp : null;
        if (!e || e.tipo !== 'negociador') return;
        const v = U.redondo(sal * 0.04 * e.est);
        if (v <= 0) return;
        Vida.log(s, `💼 ${e.nome} arrancou ${U.dinheiro(v)} de luvas na ${onde}.${Vida.mudar(s, { dinheiro: v })}`, 'bom');
    },

    // o Conexões coloca clubes maiores na disputa (Jogador.proposta)
    ampliarCands(s, p, cands, maxRep) {
        Historia._propSem = Mot.agora(s);
        const e = Historia.ativo(s) ? s.car.emp : null;
        if (!e || e.tipo !== 'conexoes') return;
        const teto = maxRep + e.est * 1.3;
        for (const t of s.times) {
            if (t.liga && t.id !== p.tid && t.rep > maxRep && t.rep <= teto && cands.indexOf(t) < 0) cands.push(t, t);
        }
    },

    // mudou de clube (Jogador.proposta): luvas, clima novo, rival
    aoTransferir(s, atual, dest, sal) {
        if (!Historia.ativo(s)) return;
        const h = Historia.estado(s), u = Jogador.p(s);
        Historia.luvas(s, sal, 'transferência');
        h.tec = 50; h.tor = 45;
        // clube novo, técnico novo: as metas da temporada recomeçam do zero (as antigas
        // ficam para trás, sem prêmio nem cobrança; perto do fim do ano, só na próxima)
        Historia.novasMetas(s);
        if ((u.bonusEscala || 0) < 0) u.bonusEscala = 0;
        const rp = Historia.rival(s);
        if (rp && rp.tid === dest.id) Vida.log(s, `⚔️ Agora você e ${rp.nome} vestem a mesma camisa. A briga é por posição!`, '');
        else if (rp && rp.tid >= 0 && s.times[rp.tid] && s.times[rp.tid].pais !== dest.pais) {
            // foi jogar em outro país: sem duelo possível, então a imprensa de lá arruma um rival novo na hora
            Historia.encerrarRival(s, 'longe', s.ano);
            Vida.log(s, `⚔️ Longe de ${rp.nome}, a rivalidade esfriou.`, '');
            Historia.novoRival(s, 'normal');
        } else if (rp && atual && rp.tid >= 0 && Mundo.classico(s, dest.id, rp.tid)) Vida.log(s, `⚔️ Você foi para o maior rival do clube de ${rp.nome}. A rivalidade ferveu!`, '');
    },

    // comissão semanal
    comissao(s) {
        const e = s.car.emp;
        if (!e) return;
        const u = Jogador.p(s), h = Historia.estado(s);
        const base = (u.tid >= 0 ? u.sal / 52 : 0) + (e.tipo === 'marqueteiro' ? U.soma(s.pessoa.patrocinios, x => x.semana) : 0);
        const v = Math.round(base * e.com / 100);
        if (v <= 0) return;
        s.pessoa.dinheiro -= v;
        e.pago = (e.pago || 0) + v;
        h.comAno = (h.comAno || 0) + v;
    },

    // Marqueteiro: renegocia patrocínios, traz marcas e seguidores
    marqueteiro(s) {
        const e = s.car.emp, ps = s.pessoa;
        if (!e || e.tipo !== 'marqueteiro') return;
        const k = 1 + 0.08 * e.est;
        for (const pt of ps.patrocinios) {
            if (pt.mq != null) continue;
            const antes = pt.semana;
            pt.semana = Math.round(pt.semana * k / 100) * 100;
            pt.mq = 1;
            Vida.log(s, `📣 ${e.nome} renegociou o contrato com a ${pt.marca}: ${U.dinheiro(antes)} → ${U.dinheiro(pt.semana)} por semana.`, 'bom');
        }
        ps.seg = (ps.seg || 0) * (1 + 0.002 * e.est);
        const max = 3 + (e.est >= 4 ? 1 : 0);
        if (ps.fama >= 8 && ps.patrocinios.length < max && U.chance(0.012 * e.est)) {
            const livres = MARCAS.filter(m => !ps.patrocinios.some(x => x.marca === m));
            if (!livres.length) return;
            const marca = U.escolha(livres);
            const estrela = (s.car.habs || []).indexOf('estrela') >= 0 ? 1.3 : 1;
            const semana = Math.round((150 + Math.pow(ps.fama, 2.1) * 4 + Math.sqrt(ps.seg || 0) * 1.5) * k * estrela / 100) * 100;
            ps.patrocinios.push({ marca, semana, ate: s.ano + 2, mq: 1 });
            const txt = `📣 ${e.nome} fechou um patrocínio com a ${marca}: ${U.dinheiro(semana)} por semana durante 2 temporadas!`;
            Vida.log(s, txt + Vida.mudar(s, { fama: 1, felicidade: 3 }), 'bom');
            Historia.avisar(txt);
        }
    },

    // Conexões: propostas extras (a proposta é uma decisão, então abre a janela de sempre)
    async conexoes(s) {
        const e = s.car.emp, u = Jogador.p(s);
        if (!e || e.tipo !== 'conexoes' || Historia._propSem === Mot.agora(s)) return;
        if (u.tid < 0) { if (U.chance(0.05 * e.est)) await Jogador.proposta(s, true); }
        else if (Mundo.emJanela(s) && U.chance(0.025 * e.est)) await Jogador.proposta(s, false);
    },

    // -----------------------------------------------------------------
    //  Semana (fim de Jogador.semana)
    // -----------------------------------------------------------------
    async semana(s) {
        Historia.entPend = null;
        if (!Historia.ativo(s)) return;
        Historia.garantir(s);
        Historia.comissao(s);
        Historia.clima(s);
        Historia.noticiasRival(s);
        Historia.polemicas(s);
        Historia.marqueteiro(s);
        for (const txt of Historia.checarMetas(s)) Historia.avisar(txt);
        Historia.hype(s);
        await Historia.conexoes(s);
    },

    // -----------------------------------------------------------------
    //  Fim da temporada
    // -----------------------------------------------------------------
    // antes de zerar as estatísticas: metas e balanço da rivalidade
    async antesFimTemporada(s) {
        if (!Historia.ativo(s)) return;
        Historia.garantir(s);
        const h = Historia.estado(s), u = Jogador.p(s);
        const bal = { ano: s.ano, metas: Historia.fecharMetas(s), rival: null, novo: null, comissao: h.comAno || 0, emp: s.car.emp ? s.car.emp.nome : null };
        h.comAno = 0;
        const rv = s.car.rival, rp = Historia.rival(s);
        if (rv && rp) {
            const eu = { j: u.j, g: u.g, a: u.a, ns: u.ns }, ele = { j: rp.j, g: rp.g, a: rp.a, ns: rp.ns };
            const pe = Historia.pontuacao(eu, POS_GRUPO[u.pos]), pr = Historia.pontuacao(ele, POS_GRUPO[rp.pos]);
            const res = pe > pr + 1 ? 'v' : pr > pe + 1 ? 'd' : 'e';
            rv.sup = pe >= pr + 4 && pe >= pr * 1.25 ? (rv.sup || 0) + 1 : 0;
            rv.temps.unshift({ ano: s.ano, eu, ele, res });
            if (rv.temps.length > 8) rv.temps.length = 8;
            let txt;
            if (res === 'v') txt = `⚔️ Na briga com ${rp.nome}, a temporada foi SUA!${Vida.mudar(s, { fama: 2, felicidade: 4 })}`;
            else if (res === 'd') txt = `⚔️ ${rp.nome} fez uma temporada melhor que a sua. Ano que vem tem revanche.${Vida.mudar(s, { felicidade: -3 })}`;
            else txt = `⚔️ Você e ${rp.nome} terminaram a temporada empatados na comparação.`;
            Vida.log(s, txt, res === 'v' ? 'bom' : res === 'd' ? 'ruim' : '');
            bal.rival = { nome: rp.nome, clube: rp.tid >= 0 && s.times[rp.tid] ? s.times[rp.tid].nome : 'sem clube', eu, ele, res, v: rv.v, e: rv.e, d: rv.d, txt };
        }
        h.bal = bal;
    },

    // depois da virada do ano: troca de rival, novas metas e o balanço na tela
    async depoisFimTemporada(s, resumo) {
        if (!Historia.ativo(s)) return;
        const h = Historia.estado(s), u = Jogador.p(s);
        const bal = h.bal || { ano: s.ano - 1, metas: null, rival: null };
        const rv = s.car.rival;
        if (rv && bal.rival && resumo && resumo.premios) {
            const pr = resumo.premios.find(x => x.pid === rv.pid);
            if (pr) bal.rival.premio = pr.tipo;
        }
        let troca = null;
        if (rv) {
            const rp = Historia.rival(s);
            if (!rp || rp.aposentado) troca = { motivo: 'aposentou', txt: `${rv.nome} pendurou as chuteiras.`, tipo: 'normal' };
            else if (rv.sup >= 2) troca = { motivo: 'superado', txt: `Você superou ${rv.nome} por duas temporadas seguidas: página virada!`, tipo: U.chance(0.5) ? 'joia' : 'forte' };
            else if (rp.ovr <= u.ovr - 10 || (rp.tid < 0 && rp.ovr < u.ovr)) troca = { motivo: 'ficou', txt: `${rv.nome} ficou para trás.`, tipo: 'forte' };
            else if (rp.tid >= 0 && u.tid >= 0 && s.times[rp.tid].pais !== s.times[u.tid].pais) troca = { motivo: 'longe', txt: `A rivalidade com ${rv.nome} esfriou: vocês agora jogam em países diferentes.`, tipo: 'normal' };
            else if (rp.tid >= 0 && rp.tid === u.tid) troca = { motivo: 'companheiro', txt: `${rv.nome} virou seu companheiro de time e a rivalidade virou parceria.`, tipo: 'normal' };
            else if (rp.tid >= 0 && u.tid >= 0 && s.times[rp.tid].liga !== s.times[u.tid].liga && U.chance(0.5)) troca = { motivo: 'longe', txt: `A rivalidade com ${rv.nome} esfriou: vocês jogam em divisões diferentes e quase não se cruzam.`, tipo: 'normal' };
        } else troca = { motivo: null, txt: '', tipo: 'normal' };
        if (troca) {
            if (troca.motivo) {
                Historia.encerrarRival(s, troca.motivo);
                if (troca.motivo === 'superado') Conquistas.contar(s, 'rivaisSuperados');
                Vida.log(s, `⚔️ ${troca.txt}`, troca.motivo === 'superado' ? 'bom' : '');
            }
            const r = Historia.novoRival(s, troca.tipo);
            if (r && troca.motivo) bal.novo = { txt: troca.txt, nome: r.nome, clube: s.times[r.tid].nome, idade: r.idade, ovr: r.ovr, joia: troca.tipo === 'joia' };
        }
        Historia.novasMetas(s);
        h.bal = null;
        // fica guardado para rever na aba Carreira durante a temporada nova
        h.ultBal = bal;
        if (!bal.metas && !bal.rival && !bal.novo) return;
        if (Historia.rapido()) {
            // avanço rápido: nada de janela, só o diário e um aviso (o balanço fica na aba Carreira)
            const m = bal.metas;
            const txt = `📊 Balanço de ${bal.ano}: ${m ? `${m.lista.filter(x => x.st === 'ok').length}/${m.lista.length} metas cumpridas` : 'temporada encerrada'}${bal.rival ? ` · rival: ${bal.rival.res === 'v' ? 'você levou a melhor' : bal.rival.res === 'd' ? 'ele levou a melhor' : 'empate'}` : ''}. Veja tudo na aba ⚽ Carreira.`;
            Vida.log(s, txt, '');
            UI.toast(txt);
        } else await Historia.mostrarBalanco(s, bal);
    },

    // rever = aberto de novo pela aba Carreira (as metas novas já estão no cartão)
    async mostrarBalanco(s, b, rever) {
        const metas = b.metas;
        const novas = (!rever && s.car.metas && s.car.metas.ano === s.ano && s.car.metas.lista) || [];
        if (!metas && !b.rival && !b.novo && !novas.length) return;
        const linhaMeta = m => `<div class="hst-bal-linha ${m.st === 'ok' ? 'ok' : 'falhou'}"><span>${m.st === 'ok' ? '✅' : '❌'}</span><div><b>${m.icone} ${U.esc(m.txt)}</b> <small class="cinza">${ORIGEM_META[m.origem].icone} ${U.esc(m.quem || ORIGEM_META[m.origem].nome)}</small><small class="hst-ef">${m.ef}</small></div></div>`;
        const r = b.rival;
        const nota = x => (x.j ? (x.ns / x.j).toFixed(2).replace('.', ',') : '-');
        const html = `<div class="hst-balanco">
            ${metas ? `<h4>🎯 Metas de ${b.ano} — ${metas.lista.filter(m => m.st === 'ok').length}/${metas.lista.length}</h4>${metas.lista.map(linhaMeta).join('')}
                ${metas.todas ? '<p class="destaque-bom">🎯 Temporada perfeita! +1 ponto de habilidade extra.</p>' : ''}` : ''}
            ${r ? `<h4>⚔️ Você x ${U.esc(r.nome)}</h4>
                <table class="tabela hst-comp"><thead><tr><th>Você</th><th></th><th>${U.esc(r.nome.split(' ').slice(-1)[0])}</th></tr></thead><tbody>
                    <tr><td>${r.eu.j}</td><td class="cinza">Jogos</td><td>${r.ele.j}</td></tr>
                    <tr><td>${r.eu.g}</td><td class="cinza">Gols</td><td>${r.ele.g}</td></tr>
                    <tr><td>${r.eu.a}</td><td class="cinza">Assistências</td><td>${r.ele.a}</td></tr>
                    <tr><td>${nota(r.eu)}</td><td class="cinza">Nota média</td><td>${nota(r.ele)}</td></tr>
                </tbody></table>
                <p class="${r.res === 'v' ? 'destaque-bom' : r.res === 'd' ? 'destaque-ruim' : ''}">${r.txt}</p>
                <p class="cinza pequeno">Duelos entre vocês: ${r.v} vitória(s), ${r.e} empate(s), ${r.d} derrota(s).${r.premio ? ` 🏅 Ele ganhou o prêmio ${U.esc(r.premio)}.` : ''}</p>` : ''}
            ${b.novo ? `<p class="hst-novo-rival">⚔️ ${U.esc(b.novo.txt)} <b>Novo rival: ${U.esc(b.novo.nome)}</b> (${U.esc(b.novo.clube)}, ${b.novo.idade} anos, ${b.novo.ovr})${b.novo.joia ? ' — uma joia que vem com tudo!' : ''}.</p>` : ''}
            ${b.emp && b.comissao ? `<p class="cinza pequeno">💼 Comissão paga a ${U.esc(b.emp)} na temporada: ${U.dinheiro(b.comissao)}.</p>` : ''}
            ${novas.length ? `<h4>📋 Metas para ${s.ano}</h4>${novas.map(m => `<div class="hst-bal-linha"><span>${ORIGEM_META[m.origem].icone}</span><div><b>${m.icone} ${U.esc(m.txt)}</b><small class="hst-ef">🎁 ${U.esc(m.premio)}</small></div></div>`).join('')}` : ''}
        </div>`;
        await UI.modal({ titulo: `📊 Balanço da temporada ${b.ano}`, html, largo: true, botoes: [{ txt: rever ? 'Fechar' : `Bora pra ${s.ano}! ▶`, valor: true }] });
    },

    // -----------------------------------------------------------------
    //  Aba Carreira: metas, rival e empresário
    // -----------------------------------------------------------------
    painel(s) {
        if (!Historia.ativo(s)) return '';
        Historia.garantir(s);
        return `<div class="grade-3 hst-painel">${Historia.cardMetas(s)}${Historia.cardRival(s)}${Historia.cardEmp(s)}</div>`;
    },

    cardMetas(s) {
        const mt = s.car.metas, h = Historia.estado(s), u = Jogador.p(s);
        const lista = (mt && mt.ano === s.ano && mt.lista) || [];
        const feitas = lista.filter(m => m.st === 'ok').length;
        let corpo;
        if (!lista.length) {
            corpo = `<p class="cinza pequeno">${u.tid < 0 ? 'Sem clube, sem metas. Assine com alguém!' : 'As metas chegam no começo da próxima temporada.'}</p>`;
        } else {
            const ini = mt.sem || 0;
            const ritmo = U.clamp((s.semana - ini) / Math.max(1, TOTAL_SEMANAS - ini), 0, 1);
            corpo = lista.map(m => {
                const pr = Historia.progresso(s, m);
                const O = ORIGEM_META[m.origem];
                const cor = m.st === 'ok' ? 'verde' : m.st === 'falhou' ? 'vermelho' : m.tipo === 'disciplina' ? 'verde' : pr.pct >= ritmo ? 'azul' : 'amarelo';
                const status = m.st === 'ok' ? '<small class="verde">✔ Cumprida</small>' : m.st === 'falhou' ? '<small class="vermelho">✖ Não deu</small>'
                    : TIPOS_META[m.tipo].fim ? `<small class="cinza">${pr.sub}</small>` : `<small class="${pr.pct >= ritmo ? 'verde' : 'cinza'}">${pr.pct >= ritmo ? '📈 no ritmo' : '⏳ atrasada'}</small>`;
                return `<div class="hst-meta ${m.st || ''}">
                    <div class="hst-meta-topo"><span class="hst-meta-txt">${m.icone} ${U.esc(m.txt)}</span><b class="hst-meta-num">${pr.num}</b></div>
                    <div class="stat-fundo pequeno"><div class="stat-preenche ${cor}" style="width:${Math.round(pr.pct * 100)}%"></div></div>
                    <div class="hst-meta-pe"><small class="hst-origem">${O.icone} ${U.esc(m.quem || O.nome)}</small>${status}</div>
                    ${m.st ? '' : `<small class="hst-premio">🎁 ${U.esc(m.premio)}</small>`}
                </div>`;
            }).join('');
        }
        return `<div class="cartao hst-metas">
            <div class="cartao-topo"><h3>🎯 Metas de ${s.ano}</h3>${lista.length ? `<span class="pequeno cinza">${feitas}/${lista.length} cumpridas</span>` : ''}</div>
            ${corpo}
            ${u.tid >= 0 ? `<div class="hst-clima">
                <div>${UI.barra('Confiança do técnico', h.tec, '🧑‍🏫', h.tec >= 65 ? 'verde' : h.tec <= 25 ? 'vermelho' : 'amarelo')}<small class="cinza">${Historia.rotuloTec(h.tec)}</small></div>
                <div>${UI.barra('Moral com a torcida', h.tor, '📣', h.tor >= 75 ? 'verde' : h.tor <= 25 ? 'vermelho' : 'amarelo')}<small class="cinza">${Historia.rotuloTor(h.tor)}</small></div>
            </div>` : ''}
            ${h.ultBal && h.ultBal.ano === s.ano - 1 ? `<div class="linha-botoes"><button class="btn btn-pequeno" data-acao="hstBalanco">📊 Balanço de ${h.ultBal.ano}</button></div>` : ''}
        </div>`;
    },

    cardRival(s) {
        const rv = s.car.rival, rp = Historia.rival(s), u = Jogador.p(s);
        const topo = `<div class="cartao-topo"><h3>⚔️ Rival</h3>${rv ? `<span class="pequeno cinza">desde ${rv.desde}${rv.tipo === 'joia' ? ' · 🌟 joia' : ''}</span>` : ''}</div>`;
        if (!rv) return `<div class="cartao hst-rival">${topo}<p class="cinza pequeno">Ninguém à sua altura por enquanto. Um rival aparece no fim da temporada.</p></div>`;
        if (!rp) return `<div class="cartao hst-rival">${topo}<p class="cinza pequeno">${U.esc(rv.nome)} pendurou as chuteiras. Um novo rival aparece no fim da temporada.</p></div>`;
        const tR = rp.tid >= 0 ? s.times[rp.tid] : null, tU = u.tid >= 0 ? s.times[u.tid] : null;
        const clube = t => `<small class="hst-vs-clube">${t ? `${UI.escudo(t)} <span>${U.esc(t.nome)}</span>` : 'Sem clube'}</small>`;
        const media = x => (x.j ? x.ns / x.j : null);
        const linha = (rot, a, b, fmt) => {
            const f = fmt || (x => x);
            const ca = a != null && (b == null || a > b) ? 'hst-melhor' : '', cb = b != null && (a == null || b > a) ? 'hst-melhor' : '';
            return `<tr><td class="${ca}">${a == null ? '-' : f(a)}</td><td class="cinza">${rot}</td><td class="${cb}">${b == null ? '-' : f(b)}</td></tr>`;
        };
        const nf = x => x.toFixed(2).replace('.', ',');
        const prox = Historia.proxDuelo(s);
        const temps = rv.temps || [];
        const tv = temps.filter(x => x.res === 'v').length, te = temps.filter(x => x.res === 'e').length, td = temps.filter(x => x.res === 'd').length;
        return `<div class="cartao hst-rival">${topo}
            <div class="hst-vs">
                <div class="hst-vs-lado"><b class="link-jog eu">Você</b><small>${POS_NOME[u.pos]} · ${u.idade} anos</small>${clube(tU)}${UI.ovr(u.ovr)}</div>
                <div class="hst-vs-x">VS</div>
                <div class="hst-vs-lado">${UI.jogador(rp)}<small>${POS_NOME[rp.pos]} · ${rp.idade} anos</small>${clube(tR)}${UI.ovr(rp.ovr)}</div>
            </div>
            <table class="tabela hst-comp"><thead><tr><th>Você</th><th>${s.ano}</th><th>Ele</th></tr></thead><tbody>
                ${linha('Jogos', u.j, rp.j)}${linha('Gols', u.g, rp.g)}${linha('Assist.', u.a, rp.a)}${linha('Nota', media(u), media(rp), nf)}
                ${linha(`Gols desde ${ANO_INICIAL}`, u.cg + u.g, rp.cg + rp.g)}
            </tbody></table>
            <div class="hst-duelos"><span class="cinza">Duelos entre vocês:</span> <b class="verde">${rv.v}V</b> <b>${rv.e}E</b> <b class="vermelho">${rv.d}D</b>${temps.length ? ` <span class="cinza">· Temporadas: ${tv}V ${te}E ${td}D</span>` : ''}</div>
            ${rv.ult && rv.ult.length ? `<small class="cinza">Último duelo: ${U.esc(rv.ult[0].txt)}</small>` : ''}
            <p class="pequeno">${rp.tid === u.tid ? '🤝 Vocês jogam no mesmo time: a briga é por posição!' : prox ? `📅 Próximo duelo: <b>semana ${prox.sem + 1}</b> · ${U.esc(prox.nomeComp)}` : '<span class="cinza">Sem duelo marcado nesta temporada.</span>'}</p>
            ${s.car.rivais.length ? `<small class="cinza">Rivais anteriores: ${s.car.rivais.slice(0, 3).map(x => `${U.esc(x.nome)} (${x.de === x.ate ? x.de : `${x.de}–${x.ate}`}${x.motivo === 'superado' ? ', superado 👑' : x.motivo === 'aposentou' ? ', aposentou' : ''})`).join(' · ')}</small>` : ''}
        </div>`;
    },

    cardEmp(s) {
        const e = s.car.emp, u = Jogador.p(s);
        if (!e) {
            return `<div class="cartao hst-emp"><div class="cartao-topo"><h3>💼 Empresário</h3></div>
                <p class="pequeno">Você ainda não tem empresário. Um bom empresário rende <b>salários maiores</b>, <b>patrocínios</b> ou <b>propostas de clubes grandes</b>, em troca de uma comissão.</p>
                <div class="hst-tipos">${Object.keys(TIPOS_EMP).map(k => `<div><span class="hst-tipo">${TIPOS_EMP[k].icone} ${TIPOS_EMP[k].nome}</span> <small class="cinza">${TIPOS_EMP[k].desc}</small></div>`).join('')}</div>
                <div class="linha-botoes"><button class="btn btn-primario" data-acao="hstEmpProcurar">🔎 Procurar empresário</button></div>
            </div>`;
        }
        const T = TIPOS_EMP[e.tipo];
        const semana = Math.round(((u.tid >= 0 ? u.sal / 52 : 0) + (e.tipo === 'marqueteiro' ? U.soma(s.pessoa.patrocinios, x => x.semana) : 0)) * e.com / 100);
        const efeito = Historia.efeitoEmp(e);
        return `<div class="cartao hst-emp"><div class="cartao-topo"><h3>💼 Empresário</h3><span class="pequeno cinza">desde ${e.desde}</span></div>
            <div class="hst-emp-cand ${e.real ? 'real' : ''}">
                <div class="hst-emp-cab"><span class="hst-emp-band">${e.bnd}</span><span><b>${U.esc(e.nome)}</b>${e.real ? ' <small class="tag-real">famoso</small>' : ''}<br><span class="estrelas-olh">${U.estrelas(e.est)}</span></span></div>
                <div><span class="hst-tipo">${T.icone} ${T.nome}</span> <small class="cinza">${efeito}</small></div>
            </div>
            <div class="ficha">
                <div><span>Comissão</span><b>${e.com}% · ${U.dinheiro(semana)}/sem.</b></div>
                <div><span>Já recebeu</span><b>${U.dinheiro(e.pago || 0)}</b></div>
            </div>
            <div class="linha-botoes"><button class="btn btn-pequeno" data-acao="hstEmpProcurar">🔄 Trocar</button><button class="btn btn-pequeno btn-perigo" data-acao="hstEmpDemitir">✖ Demitir</button></div>
        </div>`;
    },
};

// Os ganchos que rodam no meio da semana, no fim do jogo e nas telas da carreira
// nunca podem travar o jogo: um erro aqui só vira aviso no console e o valor padrão.
(function () {
    const proteger = (k, padrao) => {
        const fn = Historia[k];
        Historia[k] = function () {
            const args = arguments;
            const falhou = e => { console.warn('historia.' + k, e); return padrao(args); };
            try {
                const r = fn.apply(Historia, args);
                return r && typeof r.then === 'function' ? r.catch(falhou) : r;
            } catch (e) {
                return falhou(e);
            }
        };
    };
    const vazio = () => '', nada = () => undefined;
    ['painel', 'selo', 'posJogo', 'jogoGrande'].forEach(k => proteger(k, vazio));
    ['iniciar', 'semana', 'luvas', 'ampliarCands', 'aoTransferir', 'antesFimTemporada', 'depoisFimTemporada', 'anotarSessao'].forEach(k => proteger(k, nada));
    proteger('salario', a => a[1]);
    proteger('bonusPedido', () => 0);
    proteger('partesSessao', () => []);
})();

Object.assign(ACOES, {
    async hstBalanco() {
        const s = Jogo.s, h = Historia.ativo(s) ? Historia.estado(s) : null;
        if (h && h.ultBal) await Historia.mostrarBalanco(s, h.ultBal, true);
    },
    hstEntrevista(d) {
        const s = Jogo.s, c = Historia.entPend;
        if (!s || !c) return UI.toast('A entrevista já acabou.');
        Historia.entPend = null;
        const txt = Historia.responder(s, d.k, c);
        const html = `<div class="hst-ent-tit">🎤 Entrevista</div><div class="hst-ent-res">${txt}</div>`;
        const el = document.getElementById('hst-ent');
        if (el) el.innerHTML = html;
        // se a tela do fim do jogo for redesenhada, mostra a resposta no lugar dos botões
        if (typeof TelaPartida !== 'undefined' && TelaPartida.extraFim) {
            TelaPartida.extraFim = TelaPartida.extraFim.replace(/<!--hst-ent-->[\s\S]*?<!--\/hst-ent-->/, `<div class="hst-entrevista" id="hst-ent">${html}</div>`);
        }
        Som.tocar('moeda');
    },
    async hstEmpProcurar() {
        const s = Jogo.s;
        if (!Historia.ativo(s)) return;
        if (await Historia.procurarEmpresario(s)) { Jogo.manterRolagem = true; Jogo.atualizar(); }
    },
    async hstEmpDemitir() {
        const s = Jogo.s, e = s && s.car.emp;
        if (!e) return;
        const multa = Historia.multaEmp(s);
        if (!(await UI.confirmar(`Demitir <b>${U.esc(e.nome)}</b>? A rescisão custa <b>${U.dinheiro(multa)}</b>.`, 'Demitir', 'Cancelar'))) return;
        s.car.emp = null;
        Vida.log(s, `💼 Você demitiu o empresário ${e.nome}.${Vida.mudar(s, { dinheiro: -multa })}`, '');
        UI.toast(`💼 ${e.nome} não é mais o seu empresário.`);
        Jogo.manterRolagem = true;
        Jogo.atualizar();
    },
});
