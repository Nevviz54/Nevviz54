'use strict';
// =====================================================================
//  MOTOR DE PARTIDA — simulação minuto a minuto
// =====================================================================

const PESO_GOL = { ATA: 4.2, PON: 3.0, MEI: 2.2, VOL: 1.0, LAT: 0.7, ZAG: 0.8, GOL: 0 };
const PESO_ASSIST = { MEI: 4, PON: 3.5, ATA: 2, LAT: 2, VOL: 1.5, ZAG: 0.4, GOL: 0.05 };
const PESO_CARTAO = { ZAG: 3, VOL: 3, LAT: 2, MEI: 1.5, PON: 1, ATA: 1.2, GOL: 0.3 };

const JEITOS_GOL = [
    'bate cruzado e marca!', 'sobe mais que todo mundo e cabeceia para o fundo da rede!',
    'arrisca de fora da área... GOLAÇO!', 'aparece na pequena área e só empurra!',
    'dribla dois e toca na saída do goleiro!', 'cobra pênalti com categoria!',
    'pega o rebote e não perdoa!', 'acerta um chute no ângulo!', 'de cobertura, que pintura!',
    'cobra falta direto e marca!', 'finaliza de primeira, sem chance pro goleiro!',
];
const JEITOS_PERDE = [
    '{n} chuta e {g} faz uma defesaça!', '{n} manda por cima do gol.', 'NA TRAVE! {n} quase marca!',
    '{n} cabeceia e a bola passa raspando.', '{g} sai bem e abafa {n}.', '{n} finaliza fraco, nas mãos de {g}.',
    '{n} tenta de fora da área, a bola vai pela linha de fundo.',
];

const Partida = {
    criar(s, jogo, opts = {}) {
        const th = s.times[jogo.h], ta = s.times[jogo.a];
        const m = {
            s, jogo, h: jogo.h, a: jogo.a, min: 0, gols: [0, 0], fin: [0, 0], posse: [1, 1],
            eventos: [], esc: [], banco: [], subs: [0, 0], estilo: [th.estilo, ta.estilo],
            slots: [FORMACOES[th.form].map(x => x[0]), FORMACOES[ta.form].map(x => x[0])],
            st: {}, bonus: {}, copa: jogo.tipo === 'copa', terminou: false,
            usuario: opts.usuario ?? null, controle: opts.controle ?? -1, lancesMin: [],
            subsIA: [U.int(55, 64), U.int(66, 74), U.int(76, 84)],
            classico: Mundo.classico(s, jogo.h, jogo.a), final: Mundo.ehFinal(s, jogo),
            fatorCasa: jogo.tipo === 'copa' ? 1 : 1.06 + Mundo.infra(th).estadio * 0.015,
        };
        if (m.classico) Partida.evento(m, { tipo: 'apito', txt: `🔥 É CLÁSSICO! ${th.nome} x ${ta.nome}, estádio pegando fogo!` });
        if (m.final) Partida.evento(m, { tipo: 'apito', txt: `🏆 É a GRANDE FINAL! Quem vencer leva a taça!` });
        [th, ta].forEach((t, lado) => {
            const ruido = (m.usuario != null && t.elenco.includes(m.usuario)) ? 1.6 : 0;
            const esc = Escalacao.doTime(s, t, ruido);
            m.esc.push(esc);
            const banco = Escalacao.banco(s, t, esc);
            // a jovem promessa do usuário costuma ser relacionada
            const u = m.usuario != null ? s.jog[m.usuario] : null;
            if (u && u.tid === t.id && !esc.includes(u.id) && !banco.includes(u.id) && Escalacao.disponivel(u)) {
                const dif = t.rep - u.ovr;
                if (U.chance(U.clamp(0.95 - dif * 0.05, 0.35, 0.95))) {
                    if (banco.length >= 9) banco.pop();
                    banco.push(u.id);
                }
            }
            m.banco.push(banco);
            for (const pid of esc) if (pid != null) m.st[pid] = Partida.novoStat(0, lado);
        });
        if (m.usuario != null && m.st[m.usuario]) Partida.planejarLances(m, 1);
        Partida.recalcular(m);
        return m;
    },

    novoStat: (entrou, lado) => ({ lado, g: 0, a: 0, am: 0, vm: false, les: false, entrou, saiu: null }),

    // habilidade especial do jogador do usuário
    hab(m, id) {
        const s = m.s;
        return m.usuario != null && s.modo === 'jogador' && s.car && Array.isArray(s.car.habs) && s.car.habs.includes(id);
    },

    // bônus do treino da semana e do capitão (time do técnico usuário)
    bonusTime(m, lado, t) {
        const s = m.s;
        const b = { ata: 0, def: 0 };
        if (!Mundo.timeDoUsuario(s, t.id)) return b;
        const tr = TREINOS_TIME[s.car.treinoTime] || TREINOS_TIME.equilibrado;
        b.ata += tr.ata; b.def += tr.def;
        if (s.car.capitao != null && m.esc[lado].includes(s.car.capitao)) {
            const cap = s.jog[s.car.capitao];
            const lid = 0.4 + (cap.idade >= 28 ? 0.3 : 0) + (cap.ovr >= t.rep + 3 ? 0.3 : 0);
            b.ata += lid; b.def += lid;
        }
        return b;
    },

    ladoDoUsuario(m) {
        if (m.usuario == null) return -1;
        const p = m.s.jog[m.usuario];
        return p.tid === m.h ? 0 : 1;
    },

    usuarioEmCampo(m) {
        return m.usuario != null && m.esc.some(e => e.includes(m.usuario));
    },

    planejarLances(m, desde) {
        const n = U.pesado([1, 2, 3, 4], k => [4, 4, 2, 0.5][k - 1]);
        const lista = [];
        const fimMin = Math.max(desde + 3, 88);
        const qtd = desde > 60 ? Math.min(n, 2) : n;
        for (let i = 0; i < qtd; i++) lista.push(U.int(desde + 2, fimMin));
        m.lancesMin = [...new Set(m.lancesMin.concat(lista))].sort((a, b) => a - b);
    },

    // -----------------------------------------------------------------
    //  Força dos times em campo
    // -----------------------------------------------------------------
    recalcular(m) {
        m.R = [0, 1].map(lado => {
            const t = m.s.times[lado ? m.a : m.h];
            const gr = { G: [], D: [], M: [], A: [] };
            let ausentes = 0;
            m.esc[lado].forEach((pid, i) => {
                if (pid == null) { ausentes++; return; }
                const slot = m.slots[lado][i];
                gr[POS_GRUPO[slot]].push(Escalacao.efetivo(m.s.jog[pid], slot));
            });
            const md = arr => arr.length ? U.media(arr) : 30;
            const fator = 1 - 0.07 * ausentes;
            const moral = (t.moral - 50) / 25;
            const est = ESTILOS[m.estilo[lado]] || ESTILOS.equilibrado;
            const bt = Partida.bonusTime(m, lado, t);
            const D = md(gr.D), M = md(gr.M), A = md(gr.A);
            return {
                ata: (0.55 * A + 0.35 * M + 0.10 * D) * fator + moral + est.ata + bt.ata,
                def: (0.60 * D + 0.30 * M + 0.10 * A) * fator + moral + est.def + bt.def,
                gol: md(gr.G),
                meio: M * fator,
            };
        });
    },

    nomeTime(m, lado) {
        return m.s.times[lado ? m.a : m.h].nome;
    },

    emCampo(m, lado) {
        return m.esc[lado].filter(id => id != null).map(id => m.s.jog[id]);
    },

    slotDe(m, lado, pid) {
        const i = m.esc[lado].indexOf(pid);
        return i >= 0 ? m.slots[lado][i] : m.s.jog[pid].pos;
    },

    evento(m, ev) {
        ev.min = m.min;
        m.eventos.push(ev);
        return ev;
    },

    // -----------------------------------------------------------------
    //  Um minuto de jogo
    // -----------------------------------------------------------------
    passo(m) {
        if (m.terminou) return { eventos: [], pausa: 'fim' };
        m.min++;
        const novos = [];
        const add = ev => novos.push(Partida.evento(m, ev));

        for (let lado = 0; lado < 2; lado++) {
            const at = m.R[lado], de = m.R[1 - lado];
            m.posse[lado] += Math.max(1, at.meio - 40);
            let pc = 0.105 * Math.exp(0.03 * (at.ata - de.def));
            if (lado === 0) pc *= m.fatorCasa;
            if (U.chance(pc)) {
                m.fin[lado]++;
                const pg = U.clamp(0.13 * Math.exp(0.025 * (at.ata - de.gol)), 0.04, 0.4);
                const autor = Partida.sortearAutor(m, lado);
                if (!autor) continue;
                if (U.chance(pg)) {
                    novos.push(...Partida.gol(m, lado, autor, U.chance(0.75)));
                } else if (U.chance(0.3)) {
                    const gk = Partida.goleiro(m, 1 - lado);
                    add({ tipo: 'chance', lado, txt: U.escolha(JEITOS_PERDE).replace('{n}', autor.nome).replace('{g}', gk ? gk.nome : 'o goleiro') });
                }
            }
            // Cartões
            if (U.chance(m.classico ? 0.015 : 0.0115)) {
                const p = U.pesado(Partida.emCampo(m, lado), p => PESO_CARTAO[Partida.slotDe(m, lado, p.id)]);
                if (p) novos.push(...Partida.cartao(m, lado, p, false));
            }
            if (U.chance(0.0004)) {
                const p = U.pesado(Partida.emCampo(m, lado), p => PESO_CARTAO[Partida.slotDe(m, lado, p.id)]);
                if (p) novos.push(...Partida.cartao(m, lado, p, true));
            }
            // Lesões
            if (U.chance(0.0009)) {
                const p = U.escolha(Partida.emCampo(m, lado));
                if (p && !(p.id === m.usuario && Partida.hab(m, 'blindado') && U.chance(0.5))) {
                    m.st[p.id].les = true;
                    add({ tipo: 'lesao', lado, pid: p.id, txt: `🚑 ${p.nome} sente uma lesão e pede para sair.` });
                    const entra = Partida.melhorReserva(m, lado, Partida.slotDe(m, lado, p.id));
                    if (entra && m.subs[lado] < 5) novos.push(Partida.substituir(m, lado, p.id, entra.id, true));
                    else { m.esc[lado][m.esc[lado].indexOf(p.id)] = null; m.st[p.id].saiu = m.min; Partida.recalcular(m); }
                }
            }
            // Substituições da IA
            if (lado !== m.controle && m.subsIA.includes(m.min)) {
                const ev = Partida.subIA(m, lado);
                if (ev) novos.push(ev);
            }
        }

        let pausa = null;
        if (m.min === 45) {
            add({ tipo: 'apito', txt: `⏸️ Fim do primeiro tempo: ${Partida.placarTxt(m)}` });
            pausa = 'intervalo';
        }
        if (m.usuario != null && m.lancesMin.includes(m.min) && Partida.usuarioEmCampo(m)) pausa = 'lance';
        if (m.min >= 90) {
            m.terminou = true;
            add({ tipo: 'apito', txt: `🏁 Fim de jogo: ${Partida.placarTxt(m)}` });
            pausa = 'fim';
        }
        return { eventos: novos, pausa };
    },

    placarTxt(m) {
        return `${m.s.times[m.h].sigla} ${m.gols[0]} x ${m.gols[1]} ${m.s.times[m.a].sigla}`;
    },

    goleiro(m, lado) {
        const i = m.slots[lado].indexOf('GOL');
        const pid = m.esc[lado][i];
        return pid != null ? m.s.jog[pid] : null;
    },

    sortearAutor(m, lado, exceto) {
        const lista = Partida.emCampo(m, lado).filter(p => p.id !== exceto);
        if (!lista.length) return null;
        return U.pesado(lista, p => PESO_GOL[Partida.slotDe(m, lado, p.id)] * Math.pow(p.ovr / 70, 2.2) * (p.id === m.usuario ? 0.5 : 1));
    },

    sortearAssist(m, lado, exceto) {
        const lista = Partida.emCampo(m, lado).filter(p => p.id !== exceto);
        if (!lista.length) return null;
        return U.pesado(lista, p => PESO_ASSIST[Partida.slotDe(m, lado, p.id)] * Math.pow(p.ovr / 70, 2));
    },

    gol(m, lado, autor, comAssist, assistente) {
        m.gols[lado]++;
        m.st[autor.id].g++;
        let ass = assistente || (comAssist ? Partida.sortearAssist(m, lado, autor.id) : null);
        if (ass) m.st[ass.id].a++;
        let comemora = '';
        const evs = [];
        if (autor.id === m.usuario && m.s.car && m.s.car.comemoracao) {
            comemora = ` E comemora: ${m.s.car.comemoracao}!`;
            m.st[autor.id].comemorou = (m.st[autor.id].comemorou || 0) + 1;
        }
        evs.push(Partida.evento(m, {
            tipo: 'gol', lado, pid: autor.id, pid2: ass ? ass.id : null,
            txt: `⚽ GOOOL do ${Partida.nomeTime(m, lado)}! ${autor.nome} ${U.escolha(JEITOS_GOL)}${ass ? ` (assist.: ${ass.nome})` : ''} — ${Partida.placarTxt(m)}.${comemora}`,
        }));
        if (comemora && /camisa/i.test(m.s.car.comemoracao) && m.esc[lado].includes(autor.id)) {
            evs.push(...Partida.cartao(m, lado, autor, false));
        }
        return evs;
    },

    cartao(m, lado, p, direto) {
        const st = m.st[p.id];
        const evs = [];
        if (!direto) {
            st.am++;
            if (st.am < 2) {
                evs.push(Partida.evento(m, { tipo: 'amarelo', lado, pid: p.id, txt: `🟨 Cartão amarelo para ${p.nome}.` }));
                return evs;
            }
            evs.push(Partida.evento(m, { tipo: 'vermelho', lado, pid: p.id, txt: `🟨🟥 Segundo amarelo! ${p.nome} está expulso!` }));
        } else {
            evs.push(Partida.evento(m, { tipo: 'vermelho', lado, pid: p.id, txt: `🟥 Vermelho direto para ${p.nome}! Entrada criminosa.` }));
        }
        st.vm = true;
        st.saiu = m.min;
        const i = m.esc[lado].indexOf(p.id);
        if (i >= 0) m.esc[lado][i] = null;
        // goleiro expulso: alguém da linha vai pro gol
        if (m.slots[lado][i] === 'GOL') {
            const entra = m.banco[lado].map(id => m.s.jog[id]).find(x => x.pos === 'GOL');
            if (entra && m.subs[lado] < 5) {
                // sai um jogador de linha para entrar o goleiro reserva
                const sai = Partida.emCampo(m, lado).sort((a, b) => a.ovr - b.ovr)[0];
                if (sai) {
                    const j = m.esc[lado].indexOf(sai.id);
                    m.esc[lado][j] = null;
                    m.st[sai.id].saiu = m.min;
                }
                m.esc[lado][i] = entra.id;
                m.banco[lado] = m.banco[lado].filter(id => id !== entra.id);
                m.st[entra.id] = Partida.novoStat(m.min, lado);
                m.subs[lado]++;
                evs.push(Partida.evento(m, { tipo: 'sub', lado, pid: entra.id, txt: `🔁 ${entra.nome} entra no gol.` }));
            }
        }
        Partida.recalcular(m);
        return evs;
    },

    melhorReserva(m, lado, slot) {
        const grupo = POS_GRUPO[slot];
        const banco = m.banco[lado].map(id => m.s.jog[id]).filter(p => !(slot !== 'GOL' && p.pos === 'GOL'));
        let best = null, bv = -1e9;
        for (const p of banco) {
            const v = Escalacao.efetivo(p, slot) + (POS_GRUPO[p.pos] === grupo ? 3 : 0);
            if (v > bv) { bv = v; best = p; }
        }
        return best;
    },

    substituir(m, lado, saiId, entraId, forcada) {
        const i = m.esc[lado].indexOf(saiId);
        if (i < 0 || m.subs[lado] >= 5) return null;
        m.esc[lado][i] = entraId;
        m.banco[lado] = m.banco[lado].filter(id => id !== entraId);
        m.st[saiId].saiu = m.min;
        m.st[entraId] = Partida.novoStat(m.min, lado);
        m.subs[lado]++;
        const sai = m.s.jog[saiId], entra = m.s.jog[entraId];
        if (entraId === m.usuario && m.min < 86) Partida.planejarLances(m, m.min);
        Partida.recalcular(m);
        return Partida.evento(m, { tipo: 'sub', lado, pid: entraId, pid2: saiId, txt: `🔁 ${forcada ? 'Substituição forçada' : 'Substituição'} no ${Partida.nomeTime(m, lado)}: sai ${sai.nome}, entra ${entra.nome}.` });
    },

    subIA(m, lado) {
        if (m.subs[lado] >= 5 || !m.banco[lado].length) return null;
        // o técnico dá minutos para o jogador do usuário que está no banco
        if (m.usuario != null && m.banco[lado].includes(m.usuario) && U.chance(0.45)) {
            const u = m.s.jog[m.usuario];
            const mesmos = Partida.emCampo(m, lado).filter(p => POS_GRUPO[Partida.slotDe(m, lado, p.id)] === POS_GRUPO[u.pos] && Partida.slotDe(m, lado, p.id) !== 'GOL');
            if (mesmos.length && u.pos !== 'GOL') {
                const sai = mesmos.sort((a, b) => (a.ovr + m.st[a.id].g * 6) - (b.ovr + m.st[b.id].g * 6))[0];
                return Partida.substituir(m, lado, sai.id, u.id, false);
            }
        }
        const campo = Partida.emCampo(m, lado).filter(p => Partida.slotDe(m, lado, p.id) !== 'GOL');
        if (!campo.length) return null;
        // tira quem está rendendo menos (ovr + sorte)
        const sai = campo.map(p => ({ p, v: p.ovr + U.normal(0, 4) + m.st[p.id].g * 6 })).sort((a, b) => a.v - b.v)[0].p;
        const slot = Partida.slotDe(m, lado, sai.id);
        const entra = Partida.melhorReserva(m, lado, slot);
        if (!entra || Escalacao.efetivo(entra, slot) < sai.ovr - 9) return null;
        return Partida.substituir(m, lado, sai.id, entra.id, false);
    },

    // Simula o resto do jogo (lances do usuário são decididos sozinhos)
    simularAteOFim(m) {
        while (!m.terminou) {
            const r = Partida.passo(m);
            if (r.pausa === 'lance') Partida.resolverLance(m, Partida.sortearLance(m), -1);
        }
    },

    // -----------------------------------------------------------------
    //  Lances do jogador (modo carreira de jogador)
    // -----------------------------------------------------------------
    sortearLance(m) {
        const slot = Partida.slotDe(m, Partida.ladoDoUsuario(m), m.usuario);
        const lista = LANCES[POS_GRUPO[slot]];
        return U.pesado(lista, l => l.peso || 1);
    },

    fatorHabilidade(p) {
        return U.clamp(0.55 + (p.ovr - 50) / 50 * 0.75, 0.4, 1.3);
    },

    // multiplicador das habilidades especiais num lance
    multHab(m, lance, o, p) {
        let k = 1;
        const grupo = POS_GRUPO[p.pos];
        const bola = /Pênalti para o seu time|Falta perigosa/.test(lance.txt);
        if (o.gol && !bola && Partida.hab(m, 'finalizador')) k *= 1.15;
        if (/abece/.test(o.txt) && Partida.hab(m, 'cabeceio')) k *= 1.25;
        if (o.ass && Partida.hab(m, 'garcom')) k *= 1.15;
        if (bola && Partida.hab(m, 'batedor')) k *= 1.2;
        if (o.estilo && Partida.hab(m, 'driblador')) k *= 1.2;
        if (lance.defesa && grupo === 'G' && Partida.hab(m, 'paredao')) k *= 1.15;
        if (lance.defesa && grupo === 'D' && Partida.hab(m, 'xerife')) k *= 1.12;
        if (m.min >= 75 && Partida.hab(m, 'decisivo')) k *= 1.2;
        return k;
    },

    // op = índice da opção escolhida (-1 = automático)
    resolverLance(m, lance, op) {
        const lado = Partida.ladoDoUsuario(m);
        const p = m.s.jog[m.usuario];
        if (op < 0) op = U.int(0, lance.ops.length - 1);
        const o = lance.ops[op];
        const f = Partida.fatorHabilidade(p) * Partida.multHab(m, lance, o, p);
        m.bonus[p.id] = m.bonus[p.id] || 0;
        const res = { txt: '', bom: false, eventos: [] };

        if (lance.defesa) {
            const ok = U.chance(U.clamp(o.def * f, 0.05, 0.95));
            if (o.cartao && U.chance(o.cartao * (Partida.hab(m, 'xerife') ? 0.5 : 1))) {
                res.eventos.push(...Partida.cartao(m, lado, p, U.chance(o.vermelho || 0)));
            }
            if (ok) {
                res.bom = true;
                m.bonus[p.id] += lance.penalti ? 1.2 : 0.5;
                res.txt = lance.penalti ? '🧤 DEFENDEU O PÊNALTI! A torcida grita seu nome!' : U.escolha(['🛡️ Você trava o lance com perfeição!', '🛡️ Desarme limpo, a torcida aplaude!', '🧤 Que defesa! Você salvou o time!']);
                if (lance.penalti && m.s.cont) m.s.cont.penaltisDefendidos = (m.s.cont.penaltisDefendidos || 0) + 1;
            } else {
                m.bonus[p.id] -= 0.4;
                const golAdv = lance.penalti ? U.chance(0.85) : U.chance(0.28);
                if (golAdv) {
                    const autor = Partida.sortearAutor(m, 1 - lado);
                    if (autor) res.eventos.push(...Partida.gol(m, 1 - lado, autor, !lance.penalti));
                    res.txt = lance.penalti ? '😩 Você pulou, mas a bola entrou.' : '😩 O adversário passou e marcou...';
                } else {
                    res.txt = '😅 Você não chegou, mas o adversário desperdiçou.';
                }
            }
        } else if (o.gol) {
            if (U.chance(U.clamp(o.gol * f, 0.03, 0.9))) {
                res.bom = true;
                res.eventos.push(...Partida.gol(m, lado, p, false));
                res.txt = '⚽ GOOOOL! VOCÊ MARCOU!';
                if (o.estilo) m.bonus[p.id] += 0.3;
            } else {
                m.bonus[p.id] -= 0.15;
                res.txt = U.escolha(['😬 Pra fora! Não foi dessa vez.', '🧤 O goleiro defendeu.', '😫 Na trave!', '😬 O zagueiro bloqueou.']);
            }
        } else if (o.ass) {
            if (U.chance(U.clamp(o.ass * f, 0.03, 0.9))) {
                const autor = Partida.sortearAutor(m, lado, p.id);
                if (autor) {
                    res.bom = true;
                    res.eventos.push(...Partida.gol(m, lado, autor, false, p));
                    res.txt = `🎯 Que passe! ${autor.nome} marca com assistência sua!`;
                } else res.txt = 'A jogada não deu em nada.';
            } else {
                m.bonus[p.id] -= 0.1;
                res.txt = U.escolha(['😕 O passe foi interceptado.', '😕 Seu companheiro furou.', '😕 A bola saiu longa demais.']);
            }
        } else {
            m.bonus[p.id] += o.nota || 0.15;
            res.bom = true;
            res.txt = '👍 Jogada segura, o time mantém a posse.';
        }
        Partida.evento(m, { tipo: 'lance', lado, pid: p.id, txt: `⭐ ${p.nome}: ${o.txt.replace(/^\S+\s/, '')} — ${res.txt}` });
        return res;
    },

    // -----------------------------------------------------------------
    //  Fim de jogo: notas, estatísticas, cartões, lesões
    // -----------------------------------------------------------------
    finalizar(s, m) {
        const r = { gh: m.gols[0], ga: m.gols[1], venc: null, pen: null, notas: {}, melhor: null };
        if (m.copa && r.gh === r.ga) {
            const pen = Partida.penaltis(m);
            r.pen = `${pen[0]}-${pen[1]}`;
            r.venc = pen[0] > pen[1] ? m.h : m.a;
            Partida.evento(m, { tipo: 'apito', txt: `🥅 Pênaltis: ${m.s.times[m.h].sigla} ${pen[0]} x ${pen[1]} ${m.s.times[m.a].sigla}` });
        } else {
            r.venc = r.gh > r.ga ? m.h : r.ga > r.gh ? m.a : null;
        }

        // suspensões cumpridas
        for (const tid of [m.h, m.a]) {
            for (const p of Mundo.elenco(s, s.times[tid])) if (p.susp > 0 && !m.st[p.id]) p.susp--;
        }

        let melhorNota = -1;
        for (const [pidS, st] of Object.entries(m.st)) {
            const p = s.jog[pidS];
            if (!p) continue;
            const meus = m.gols[st.lado], deles = m.gols[1 - st.lado];
            const slot = POS_GRUPO[p.pos];
            const minutos = (st.saiu ?? 90) - st.entrou;
            let n = 6.2 + U.normal(0, 0.45) + st.g * 1.0 + st.a * 0.6 - st.am * 0.2;
            if (slot === 'G') n += deles === 0 ? 0.9 : -0.35 * deles + 0.3;
            if (slot === 'D') n += deles === 0 ? 0.5 : -0.15 * deles;
            n += meus > deles ? 0.3 : meus < deles ? -0.3 : 0;
            if (st.vm) n -= 1.5;
            if (minutos < 20) n = 6.0 + (n - 6.2) * 0.5;
            n += m.bonus[p.id] || 0;
            n = Math.round(U.clamp(n, 3, 10) * 10) / 10;
            r.notas[p.id] = n;
            if (n > melhorNota) { melhorNota = n; r.melhor = p.id; }

            p.j++; p.g += st.g; p.a += st.a; p.ns += n;
            const desgaste = (p.id === m.usuario && Partida.hab(m, 'motorzinho')) ? 0.6 : 1;
            p.cond = Math.max(30, p.cond - Math.round(minutos / 90 * (10 + Math.max(0, p.idade - 28) * 1.2) * desgaste));
            p.amar += st.am >= 2 ? 0 : st.am;
            if (st.vm) p.susp = U.chance(0.7) ? 1 : 2;
            if (p.amar >= 3) { p.susp = Math.max(p.susp, 1); p.amar = 0; }
            if (st.les) p.les = U.chance(0.12) ? U.int(8, 20) : U.int(1, 5);
        }
        return r;
    },

    penaltis(m) {
        const p = [0, 0];
        const g = [Partida.goleiro(m, 0), Partida.goleiro(m, 1)];
        const prob = lado => U.clamp(0.78 - ((g[1 - lado] ? g[1 - lado].ovr : 50) - 70) * 0.006, 0.6, 0.9);
        for (let i = 0; i < 5; i++) {
            for (let l = 0; l < 2; l++) if (U.chance(prob(l))) p[l]++;
        }
        let guarda = 0;
        while (p[0] === p[1] && guarda++ < 30) {
            for (let l = 0; l < 2; l++) if (U.chance(prob(l))) p[l]++;
        }
        if (p[0] === p[1]) p[U.int(0, 1)]++;
        return p;
    },
};

// Lances de decisão (modo jogador)
const LANCES = {
    A: [
        {
            txt: 'Você recebe na entrada da área, de frente para o gol!', ops: [
                { txt: '🎯 Chutar colocado', gol: 0.25 },
                { txt: '💥 Encher o pé', gol: 0.21 },
                { txt: '🕺 Driblar o zagueiro e finalizar', gol: 0.18, estilo: true },
                { txt: '🤝 Tocar para o companheiro livre', ass: 0.27 },
            ]
        },
        {
            txt: 'Cruzamento na área e a bola vem na sua cabeça!', ops: [
                { txt: '🎯 Cabecear no canto', gol: 0.21 },
                { txt: '🔄 Escorar para o companheiro', ass: 0.21 },
                { txt: '🦶 Dominar no peito e bater', gol: 0.18, estilo: true },
            ]
        },
        {
            txt: 'Lançamento perfeito! Você está cara a cara com o goleiro!', ops: [
                { txt: '🪶 Tocar por cobertura', gol: 0.31, estilo: true },
                { txt: '🕺 Driblar o goleiro', gol: 0.33, estilo: true },
                { txt: '⚡ Chutar rasteiro no canto', gol: 0.36 },
            ]
        },
        {
            txt: 'Pênalti para o seu time! O capitão te entrega a bola.', peso: 0.35, ops: [
                { txt: '↖️ Bater no canto esquerdo', gol: 0.8 },
                { txt: '⬆️ Bater no meio (cavadinha)', gol: 0.72, estilo: true },
                { txt: '↗️ Bater no canto direito', gol: 0.8 },
            ]
        },
    ],
    M: [
        {
            txt: 'A bola sobra com você na intermediária, o time está avançando.', ops: [
                { txt: '🎯 Enfiar a bola em profundidade', ass: 0.21 },
                { txt: '💥 Arriscar de fora da área', gol: 0.09 },
                { txt: '🌈 Lançamento longo para o ponta', ass: 0.16 },
                { txt: '🛟 Tocar de lado e manter a posse', nota: 0.15 },
            ]
        },
        {
            txt: 'Falta perigosa na entrada da área! Você vai cobrar.', ops: [
                { txt: '🌀 Cobrar no ângulo', gol: 0.12, estilo: true },
                { txt: '💥 Bater forte por baixo da barreira', gol: 0.09 },
                { txt: '📦 Cruzar na área', ass: 0.16 },
            ]
        },
        {
            txt: 'Você rouba a bola no meio-campo e tem espaço pra correr!', ops: [
                { txt: '🏃 Conduzir até a área e chutar', gol: 0.14 },
                { txt: '🎯 Achar o atacante na corrida', ass: 0.23 },
                { txt: '🛟 Segurar e esperar o time', nota: 0.2 },
            ]
        },
    ],
    D: [
        {
            txt: 'O atacante adversário arranca em velocidade pra cima de você!', defesa: true, ops: [
                { txt: '🦵 Dar o carrinho', def: 0.62, cartao: 0.25, vermelho: 0.1 },
                { txt: '🏃 Acompanhar sem fazer falta', def: 0.52 },
                { txt: '✋ Fazer falta tática', def: 0.95, cartao: 0.85 },
            ]
        },
        {
            txt: 'Cruzamento perigoso na sua área!', defesa: true, ops: [
                { txt: '🤕 Subir de cabeça para afastar', def: 0.65 },
                { txt: '🦶 Tentar dominar e sair jogando', def: 0.45 },
            ]
        },
        {
            txt: 'Escanteio a favor! Você sobe para a área adversária.', ops: [
                { txt: '🤕 Cabecear firme para o gol', gol: 0.13 },
                { txt: '🔄 Escorar para o meio da área', ass: 0.13 },
            ]
        },
        {
            txt: 'Espaço pela lateral! Você pode apoiar o ataque.', ops: [
                { txt: '📦 Cruzar na área', ass: 0.17 },
                { txt: '🏃 Avançar e chutar', gol: 0.07 },
                { txt: '🛟 Recuar para o zagueiro', nota: 0.1 },
            ]
        },
    ],
    G: [
        {
            txt: 'Pênalti para o adversário! Para onde você pula?', defesa: true, penalti: true, peso: 0.35, ops: [
                { txt: '↖️ Pular no canto esquerdo', def: 0.3 },
                { txt: '⬆️ Ficar no meio', def: 0.22 },
                { txt: '↗️ Pular no canto direito', def: 0.3 },
            ]
        },
        {
            txt: 'Chute forte de fora da área, indo no ângulo!', defesa: true, ops: [
                { txt: '🧤 Voar para espalmar', def: 0.68 },
                { txt: '🤲 Tentar encaixar', def: 0.5 },
            ]
        },
        {
            txt: 'O atacante sai cara a cara com você!', defesa: true, ops: [
                { txt: '🏃 Sair abafando', def: 0.55 },
                { txt: '🧍 Fechar o ângulo e esperar', def: 0.48 },
                { txt: '🦵 Dar o bote no pé dele', def: 0.6, cartao: 0.3, vermelho: 0.35 },
            ]
        },
    ],
};
