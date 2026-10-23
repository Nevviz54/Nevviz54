'use strict';
// =====================================================================
//  COMISSÃO TÉCNICA (carreira de técnico)
//  🧑‍💼 Auxiliar técnico: assume as tarefas que você delegar — treino da
//     semana, conversa com o grupo, mensagens dos jogadores, renovações e
//     a base. Tudo vira uma linha no diário/aviso rápido, nunca um modal.
//  💪 Preparador físico, 🩺 médico e 📊 analista de desempenho (relatório
//     do adversário antes do jogo, com uma dica que dá bônus se seguida).
//  📝 Pendências na tela do clube, 🔍 buscar substituto (abre o mercado
//     filtrado) e ✍️ renovação em lote no elenco.
//
//  Estado (criado na primeira vez que precisa: saves antigos abrem normal)
//    s.car.cm = { staff: { aux, prep, med, ana } (profissional ou null),
//                 merc: { prox, lista: { aux: [3], prep: [3], ... } },
//                 deleg: { treino, grupo, msgs, renov, base } (bool),
//                 tid: clube onde a comissão trabalha, sem: tarefas da
//                 semana atual, ult: resumo da última semana, treino: motivo }
//    profissional = { id, papel, nome, bnd, est (1-5), sal (€/semana), desde, ano, ... contadores }
//    p.renRec = semana (Mot.agora) em que o jogador recusou renovar
//  Ganchos: Tecnico (abas, inicio, elenco, mercado, semana, posJogo),
//  Mot.cobranca, Base.reclamacao e Base.fimTemporada, Partida (lesões e bônus do time) e
//  TelaPartida (relatório no pré-jogo e a dica durante o jogo).
// =====================================================================

const PAPEIS_CM = {
    aux: {
        nome: 'Auxiliar técnico', icone: '🧑‍💼', titulo: '', sal: [0, 2000, 4500, 9000, 16000, 28000],
        desc: 'Seu braço direito: cuida das tarefas que você delegar. Quanto mais estrelas, melhores as decisões.',
    },
    prep: {
        nome: 'Preparador físico', icone: '💪', titulo: 'Prof.', sal: [0, 1200, 2800, 5500, 10000, 17000],
        desc: 'O elenco recupera mais o físico, se machuca menos nos jogos e se livra antes do risco de recaída.',
    },
    med: {
        nome: 'Médico', icone: '🩺', titulo: 'Dr.', sal: [0, 1200, 2800, 5500, 10000, 17000],
        desc: 'Lesões mais curtas e recuperação mais rápida no departamento médico.',
    },
    ana: {
        nome: 'Analista de desempenho', icone: '📊', titulo: '', sal: [0, 1000, 2400, 4800, 8500, 15000],
        desc: 'Relatório do adversário antes de cada jogo, com uma dica: seguir a dica deixa o time mais forte.',
    },
};
const ORDEM_CM = ['aux', 'prep', 'med', 'ana'];

// tarefas que o auxiliar pode assumir
const DELEG_CM = {
    treino: { nome: 'Treino da semana', icone: '🏋️', desc: 'Escolhe o treino olhando o próximo adversário, o cansaço e os jogos grandes.' },
    grupo: { nome: 'Conversa com o grupo', icone: '📣', desc: 'Fala com o vestiário a cada 3 semanas: elogia na boa fase, cobra na má fase ou motiva todos.' },
    msgs: { nome: 'Mensagens dos jogadores', icone: '📱', desc: 'Responde quem cobra tempo de jogo do jeito que cada personalidade gosta.' },
    renov: { nome: 'Renovar contratos', icone: '✍️', desc: 'Renova quem vale a pena e está com o contrato no fim, sem estourar o orçamento (até 2 por semana).' },
    base: { nome: 'Cuidar da base', icone: '🌱', desc: 'Testa os treinos de cada garoto até achar o que mais rende, responde as mensagens deles e decide quem sobe aos 20 anos.' },
};

const LUVAS_CM = 6;          // luvas = salário semanal x 6
const MULTA_CM = 4;          // demitir = salário semanal x 4
const TROCA_MERC_CM = 8;     // a lista de candidatos muda a cada 8 semanas
const QUALI_CM = ['', 'fracas', 'razoáveis', 'boas', 'ótimas', 'de elite'];
const BANDEIRA_NOMES_CM = { br: '🇧🇷', de: '🇩🇪', en: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', fr: '🇫🇷', es: '🇪🇸', it: '🇮🇹', nl: '🇳🇱', ar: '🇦🇷' };
const PRECOS_MERCADO_CM = [5e5, 2e6, 5e6, 1e7, 2e7, 5e7, 1e8];   // as opções do filtro de valor do mercado

const Comissao = {
    // -----------------------------------------------------------------
    //  Estado
    // -----------------------------------------------------------------
    estado(s) {
        const c = s.car;
        if (!c.cm) c.cm = { staff: {}, merc: { prox: 0, lista: {} }, deleg: {}, tid: c.tid, sem: null, ult: null, treino: null };
        const cm = c.cm;
        cm.staff = cm.staff || {};
        cm.merc = cm.merc || { prox: 0, lista: {} };
        cm.merc.lista = cm.merc.lista || {};
        cm.deleg = cm.deleg || {};
        if (cm.tid === undefined) cm.tid = c.tid;
        // mudou de clube (ou ficou sem clube): o auxiliar vai junto com você, o resto fica no clube antigo
        if (cm.tid !== c.tid) {
            const antigo = cm.tid >= 0 ? s.times[cm.tid] : null;
            const ficaram = ['prep', 'med', 'ana'].filter(k => cm.staff[k]).map(k => cm.staff[k].nome);
            if (ficaram.length && antigo) Vida.log(s, `👋 ${ficaram.join(', ')} ficaram na comissão do ${antigo.nome}.`, '');
            cm.staff = { aux: cm.staff.aux || null };
            if (cm.staff.aux && c.tid >= 0) Vida.log(s, `🧑‍💼 Seu auxiliar ${cm.staff.aux.nome} segue com você para o ${s.times[c.tid].nome}.`, 'bom');
            cm.merc = { prox: 0, lista: {} };
            cm.sem = null;
            cm.treino = null;
            cm.tid = c.tid;
        }
        return cm;
    },

    // profissional contratado (null se não tem ou se a comissão é de outro clube)
    membro(s, papel) {
        const cm = s.modo === 'tecnico' && s.car ? s.car.cm : null;
        if (!cm || !cm.staff || cm.tid !== s.car.tid) return null;
        return cm.staff[papel] || null;
    },

    nome(o) {
        const P = PAPEIS_CM[o.papel] || {};
        return U.esc((P.titulo ? P.titulo + ' ' : '') + o.nome);
    },

    custoSemanal(s) {
        const cm = s.car && s.car.cm;
        if (!cm || cm.tid !== s.car.tid || s.car.tid < 0) return 0;
        return U.soma(ORDEM_CM, k => (cm.staff[k] ? cm.staff[k].sal : 0));
    },

    // receita - folha - base e olheiros - comissão (por semana)
    resultadoSemanal(s, t) {
        return s.car.receita - Tecnico.folha(s, t) / 52 - Base.custoSemanal(s, t) - Comissao.custoSemanal(s) + Clube.extraSemanal(s);   // clima: bilheteria (ingresso e torcida)
    },

    efeito(papel, est) {
        const num = v => String(Math.round(v * 100) / 100).replace('.', ',');
        if (papel === 'aux') {
            const d = Math.round((est * 0.02 - 0.04) * 100);
            return `Decisões ${QUALI_CM[est]}${d ? ` · salários ${d > 0 ? '−' : '+'}${Math.abs(d)}% nas renovações` : ''}`;
        }
        if (papel === 'prep') return `+${num(est * 1.2)} de físico por semana · −${est * 9}% de lesões nos jogos`;
        if (papel === 'med') return `Lesões ${est * 7}% mais curtas · recuperação extra`;
        return `Relatório do adversário · +${num(Comissao.bonusDica(est))} seguindo a dica`;
    },

    bonusDica: est => 0.3 + est * 0.15,

    // -----------------------------------------------------------------
    //  Mercado de profissionais
    // -----------------------------------------------------------------
    gerar(s, papel, t) {
        const rep = t ? t.rep : 50;
        const pesos = rep >= 75 ? [0, 8, 20, 32, 26, 14] : rep >= 62 ? [0, 18, 30, 28, 17, 7] : [0, 36, 34, 19, 8, 3];
        const est = U.pesado([1, 2, 3, 4, 5], e => pesos[e]);
        const local = t ? Mundo.pais(t.pais) : null;
        let cod = local ? local.nomes : 'br', bnd = local ? local.bandeira : '🇧🇷';
        if (U.chance(0.3)) {
            const outro = U.escolha(NOMES_LIGAS);
            if (outro !== cod) { cod = outro; bnd = BANDEIRA_NOMES_CM[outro] || bnd; }
        }
        const riq = t ? Mundo.riquezaDoTime(s, t) : 0.5;
        const f = U.clamp(0.4 + riq * 0.6, 0.45, 1.6);
        const sal = Math.max(300, Math.round(PAPEIS_CM[papel].sal[est] * f * U.rand(0.88, 1.12) / 100) * 100);
        return { id: s.seqJ++, papel, nome: Nomes.gerar(cod, true), bnd, est, sal, desde: null };
    },

    atualizarMercado(s, t) {
        const cm = Comissao.estado(s);
        const agora = Mot.agora(s);
        const trocar = agora >= cm.merc.prox;
        for (const k of ORDEM_CM) {
            const lista = cm.merc.lista[k] = cm.merc.lista[k] || [];
            if (trocar && lista.length >= 3) lista.splice(U.int(0, lista.length - 1), 1);
            while (lista.length < 3) lista.push(Comissao.gerar(s, k, t));
            lista.sort((a, b) => b.est - a.est || a.sal - b.sal);
        }
        if (trocar) cm.merc.prox = agora + TROCA_MERC_CM;
    },

    // -----------------------------------------------------------------
    //  Semana (ganchos em Tecnico.semana)
    // -----------------------------------------------------------------
    // começo da semana, antes do treino: o auxiliar trabalha
    semana(s, t) {
        const cm = Comissao.estado(s);
        Comissao.atualizarMercado(s, t);
        cm.sem = { ag: Mot.agora(s), itens: [] };
        const prep = cm.staff.prep;
        if (prep) {
            // com acompanhamento, o risco de recaída acaba antes
            for (const p of Mundo.elenco(s, t)) if (p.recaida > 0 && U.chance(prep.est * 0.1)) p.recaida = Math.max(0, p.recaida - 2);
        }
        const aux = cm.staff.aux;
        if (!aux) return;
        if (cm.deleg.treino) Comissao.auxTreino(s, t, aux);
        if (cm.deleg.grupo) Comissao.auxGrupo(s, t, aux);
        if (cm.deleg.renov) Comissao.auxRenovar(s, t, aux);
        if (cm.deleg.base) Comissao.auxBase(s, t, aux);
    },

    // fim da semana (depois do vestiário e da base): salários, físico, médico e o resumo do auxiliar
    fimSemana(s, t) {
        const cm = Comissao.estado(s);
        t.saldo -= Comissao.custoSemanal(s);
        const prep = cm.staff.prep, med = cm.staff.med;
        for (const p of Mundo.elenco(s, t)) {
            if (prep) p.cond = Math.min(100, p.cond + prep.est * 1.2);
            if (med && p.les > 1 && U.chance(med.est * 0.06)) {
                p.les--;
                med.poupou = (med.poupou || 0) + 1;
            }
        }
        const aux = cm.staff.aux;
        const sem = cm.sem;
        cm.sem = null;
        if (!aux || !sem || !sem.itens.length) return;
        aux.tarefas = (aux.tarefas || 0) + sem.itens.length;
        Conquistas.contar(s, 'tarefasAuxiliar', sem.itens.length);
        cm.ult = { ano: s.ano, sem: s.semana, itens: sem.itens.slice(0, 8) };
        Vida.log(s, `🧑‍💼 <b>Auxiliar ${U.esc(aux.nome)}:</b> ${sem.itens.join(' · ')}`, '');
        if (!Ritmo.rodando) {
            const n = sem.itens.length;
            UI.toast(`🧑‍💼 <b>Auxiliar:</b> ${sem.itens.slice(0, 3).join(' · ')}${n > 3 ? ` <small>(+${n - 3} no diário)</small>` : ''}`);
        }
    },

    tarefa(s, txt) {
        const cm = s.car.cm;
        if (!cm) return;
        if (!cm.sem || cm.sem.ag !== Mot.agora(s)) cm.sem = { ag: Mot.agora(s), itens: [] };
        cm.sem.itens.push(txt);
    },

    // -----------------------------------------------------------------
    //  🧑‍💼 Tarefas do auxiliar
    // -----------------------------------------------------------------
    // forma física média prevista para o próximo jogo (os 14 melhores disponíveis)
    formaPrevista(s, t) {
        const prep = Comissao.membro(s, 'prep');
        const ct = Mundo.infra(t).ct - 3;
        const top = Mundo.elenco(s, t).filter(p => p.les <= 0).sort((a, b) => b.ovr - a.ovr).slice(0, 14);
        if (!top.length) return 100;
        return U.media(top, p => Math.min(100, p.cond + 18 + ct + (prep ? prep.est * 1.2 : 0)));
    },

    // o treino que o auxiliar escolhe: { k, motivo }
    treinoIdeal(s, t) {
        const prox = Mundo.partidasDaSemana(s, s.semana + 1).filter(j => j.h === t.id || j.a === t.id);
        const forma = Comissao.formaPrevista(s, t);
        if (!prox.length) return forma < 90 ? { k: 'fisico', motivo: 'semana sem jogo: recuperar o físico' } : { k: 'tatico', motivo: 'semana sem jogo: hora de trabalhar a parte tática' };
        if (forma < 72) return { k: 'descanso', motivo: `elenco muito cansado (${Math.round(forma)}% de forma)` };
        if (prox.length >= 2) return { k: 'fisico', motivo: `${prox.length} jogos na semana que vem` };
        if (forma < 86) return { k: 'fisico', motivo: `forma física baixa (${Math.round(forma)}%)` };
        const j = prox[0];
        const adv = s.times[j.h === t.id ? j.a : j.h];
        if (Mundo.ehFinal(s, j) || Mundo.classico(s, j.h, j.a)) return { k: 'tatico', motivo: `${Mundo.ehFinal(s, j) ? 'final' : 'clássico'} contra o ${adv.nome}: tudo ajustado` };
        const dif = Mundo.forca(s, t) - Mundo.forca(s, adv);
        if (dif >= 4) return { k: 'ataque', motivo: `o ${adv.nome} é mais fraco: vamos para cima` };
        if (dif <= -4) return { k: 'defesa', motivo: `o ${adv.nome} é mais forte: fechar a casinha` };
        return forma >= 92 ? { k: 'tatico', motivo: `jogo parelho contra o ${adv.nome}` } : { k: 'equilibrado', motivo: `jogo parelho contra o ${adv.nome}` };
    },

    auxTreino(s, t, aux) {
        const cm = s.car.cm;
        // você mudou o treino na aba Tática: nesta semana ele respeita a sua escolha
        if (cm.treino && !cm.treino.manual && cm.treino.k !== s.car.treinoTime && TREINOS_TIME[s.car.treinoTime]) {
            cm.treino = { k: s.car.treinoTime, motivo: 'escolha sua nesta semana (na próxima ele volta a escolher)', manual: true, ano: s.ano, sem: s.semana };
            return;
        }
        let ideal = Comissao.treinoIdeal(s, t);
        // auxiliar fraco às vezes vai no automático
        if (ideal.k !== 'equilibrado' && U.chance((5 - aux.est) * 0.08)) ideal = { k: 'equilibrado', motivo: 'escolha no piloto automático' };
        cm.treino = { k: ideal.k, motivo: ideal.motivo, ano: s.ano, sem: s.semana };
        if (s.car.treinoTime === ideal.k) return;
        s.car.treinoTime = ideal.k;
        const tr = TREINOS_TIME[ideal.k];
        Comissao.tarefa(s, `${tr.icone} treino ${tr.nome} (${U.esc(ideal.motivo)})`);
    },

    faseDoTime(s, t) {
        const liga = Mundo.liga(s, t.liga);
        const ult = (liga && liga.tab && liga.tab[t.id] ? liga.tab[t.id].ult : []).slice(-3);
        const vit = ult.filter(x => x === 'V').length, der = ult.filter(x => x === 'D').length;
        return vit >= 2 ? 'boa' : der >= 2 ? 'ruim' : 'normal';
    },

    // mesmo efeito da conversa com o grupo (Mot.conversarGrupo), sem abrir nada
    efeitoGrupo(op, fase, p) {
        const pers = Mot.pers(p), nv = Mot.nivel(p).id;
        if (op === 'cada') {
            let d = { muitoDes: 5, desmotivado: 6, normal: 6, motivado: 3, muito: 1 }[nv];
            if (pers === 'vaidoso' && nv !== 'muito') d += 2;
            if (pers === 'tranquilo') d -= 1;
            if (p.prob > 0) d = Math.min(d, 2);
            return d;
        }
        if (op === 'elogiar') {
            if (fase === 'boa') return { vaidoso: 6, profissional: 3 }[pers] || 4;
            if (fase === 'normal') return { vaidoso: 4, profissional: 1 }[pers] || 2;
            return { vaidoso: 2, profissional: -1, lider: -1 }[pers] || 0;
        }
        if (fase === 'ruim') return { profissional: 5, lider: 5, ambicioso: 4, tranquilo: 2, vaidoso: -2, temperamental: -4 }[pers];
        if (fase === 'normal') return { profissional: 2, lider: 2, ambicioso: 1, tranquilo: 0, vaidoso: -3, temperamental: -5 }[pers];
        return pers === 'profissional' ? -1 : -3;
    },

    auxGrupo(s, t, aux) {
        const agora = Mot.agora(s);
        if (s.car.grupo === agora) return;   // você mesmo já falou com o grupo nesta semana
        const desde = s.car.grupoUlt == null ? 99 : agora - s.car.grupoUlt;
        if (desde < 3) return;
        const el = Mundo.elenco(s, t);
        if (!el.length) return;
        const fase = Comissao.faseDoTime(s, t);
        const media = U.media(el, p => Mot.valor(p));
        let op = fase === 'boa' ? 'elogiar' : fase === 'ruim' ? (aux.est >= 3 ? 'cobrar' : 'cada') : (media < 58 ? 'cada' : null);
        if (!op) return;
        // auxiliar fraco às vezes erra a mão
        if (U.chance((5 - aux.est) * 0.07)) op = fase === 'boa' ? 'cobrar' : 'elogiar';
        const q = 0.6 + aux.est * 0.08;
        s.car.conversas = s.car.conversas || {};
        let subiu = 0, caiu = 0;
        for (const p of el) {
            let d = Math.round((Comissao.efeitoGrupo(op, fase, p) * q + (op === 'cada' ? U.rand(-1, 1) : 0)) * 10) / 10;
            if (op === 'cada') { d = Math.max(0.5, d); s.car.conversas[p.id] = agora; }
            Mot.mudar(p, d);
            if (d > 0) subiu++; else if (d < 0) caiu++;
        }
        const moral = op === 'elogiar' ? { boa: 4, normal: 2, ruim: 0 }[fase] : op === 'cobrar' ? { boa: -3, normal: 0, ruim: 3 }[fase] : 2;
        t.moral = U.clamp(t.moral + Math.round(moral * q), 5, 99);
        s.car.grupo = agora;
        s.car.grupoUlt = agora;
        const nome = { cada: 'motivou o grupo', elogiar: 'elogiou o grupo', cobrar: 'cobrou o grupo' }[op];
        Comissao.tarefa(s, `📣 ${nome} (▲${subiu}${caiu ? ` ▼${caiu}` : ''})`);
    },

    // resposta automática para quem cobra tempo de jogo (gancho em Mot.cobranca).
    // Opções de lá: 0 = prometer minutos, 1 = "mostra no treino", 2 = pôr à venda, 3 = ignorar
    responderCobranca(s, t, p) {
        const aux = Comissao.membro(s, 'aux');
        if (!aux || !s.car.cm.deleg.msgs) return -1;
        const pers = Mot.pers(p);
        let i;
        if (aux.est <= 2 && U.chance((3 - aux.est) * 0.15)) i = 3;   // esqueceu de responder...
        else if (['profissional', 'tranquilo', 'lider'].indexOf(pers) >= 0) i = 1;
        // no rodízio ele vai jogar de qualquer jeito: dá para prometer sem medo
        else if (aux.est >= 4 && !t.tit && t.criterio === 'rodizio') i = 0;
        else {
            i = 1;
            if (aux.est >= 3) Mot.mudar(p, aux.est - 2);   // conversa de canto para amaciar a resposta
        }
        Comissao.tarefa(s, `📱 respondeu ${U.esc(p.nome)}${i === 3 ? ' (deixou no vácuo 😬)' : i === 0 ? ' (prometeu minutos)' : ''}`);
        return i;
    },

    // mensagem de garoto da base pedindo chance (gancho em Base.reclamacao).
    // Opções de lá: 0 = subir agora, 1 = prometer subir até o fim da temporada, 3 = liberar
    // (nunca a 2, "paciência", que pode abrir um aviso no meio da semana)
    responderBase(s, t, p) {
        const aux = Comissao.membro(s, 'aux');
        if (!aux || !s.car.cm.deleg.base) return -1;
        const cabe = t.elenco.length < 32;
        const pronto = cabe && p.ovr >= t.rep - 9;
        const promete = cabe && (p.pmax >= t.rep - 3 || (aux.est <= 2 && U.chance(0.3)));
        const i = pronto && !(aux.est <= 2 && U.chance(0.3)) ? 0 : promete ? 1 : 3;
        Comissao.tarefa(s, `🌱 ${U.esc(p.nome)} (base) ${['subiu para o profissional', 'ganhou a promessa de subir no fim da temporada', '', 'foi liberado (teto baixo)'][i]}`);
        return i;
    },

    // garoto de 20 anos no fim da temporada (gancho em Base.fimTemporada): 0 = subir, 1 = liberar
    decidirVinte(s, t, p) {
        const aux = Comissao.membro(s, 'aux');
        if (!aux || !s.car.cm.deleg.base) return -1;
        const sobe = t.elenco.length < 32 && (p.ovr >= t.rep - 12 || p.pmax >= t.rep - 2);
        Vida.log(s, `🧑‍💼 Auxiliar ${U.esc(aux.nome)}: ${U.esc(p.nome)} fez 20 anos e ${sobe ? 'subiu para o profissional' : 'foi liberado da base'}.`, sobe ? 'bom' : '');
        aux.tarefas = (aux.tarefas || 0) + 1;
        Conquistas.contar(s, 'tarefasAuxiliar');
        return sobe ? 0 : 1;
    },

    // o treino em que o garoto mais rende (o auxiliar testa um por um)
    treinoBaseIdeal(p) {
        const tipos = Object.keys(TREINOS_BASE).filter(k => k !== 'goleiro' || p.pos === 'GOL');
        const conhec = p.conhec || {};
        const conhecidos = tipos.filter(k => conhec[k]).sort((a, b) => Base.rendimento(p, b) - Base.rendimento(p, a));
        const melhor = conhecidos[0];
        if (melhor && Base.rendimento(p, melhor) >= 1.5) return melhor;   // achou o treino em que ele voa
        if (!conhec[p.tb]) return p.tb;                                    // ainda testando o atual
        const esperado = k => {
            const tr = TREINOS_BASE[k];
            if (tr.encaixe) return tr.encaixe.indexOf(p.pos) >= 0 ? 1.15 : 0.8;
            return p.pos === 'GOL' && k !== 'fisico' && k !== 'mental' ? 0.8 : 1;
        };
        const faltam = tipos.filter(k => !conhec[k]).sort((a, b) => esperado(b) - esperado(a));
        return faltam[0] || melhor || p.tb;
    },

    auxBase(s, t, aux) {
        let trocas = 0, achou = 0;
        const precisa = aux.est >= 5 ? 1 : aux.est >= 4 ? 2 : 3;   // olho clínico: descobre antes como o garoto rende
        for (const p of Base.garotos(s, t)) {
            p.conhec = p.conhec || {};
            if (!p.conhec[p.tb] && (p.st || 0) >= precisa) {
                p.conhec[p.tb] = 1;
                if (p.tb === p.af) achou++;
            }
            const novo = Comissao.treinoBaseIdeal(p);
            if (novo && novo !== p.tb) { p.tb = novo; p.st = 0; trocas++; }
        }
        if (trocas || achou) Comissao.tarefa(s, `🌱 base: ${[trocas ? `trocou o treino de ${trocas} garoto${trocas > 1 ? 's' : ''}` : '', achou ? `achou o treino ideal de ${achou}` : ''].filter(Boolean).join(', ')}`);
        // reta final da temporada: cumpre as promessas de subir garotos (se ainda cabe no elenco)
        if (s.semana >= TOTAL_SEMANAS - 3) {
            for (const p of Base.garotos(s, t)) {
                if (p.promB == null || p.promB > s.ano || t.elenco.length >= 32) continue;
                Comissao.tarefa(s, `⬆️ cumpriu a promessa e subiu ${U.esc(p.nome)} da base`);
                Base.promover(s, p, t);
            }
        }
    },

    // -----------------------------------------------------------------
    //  ✍️ Renovações (auxiliar e renovação em lote)
    // -----------------------------------------------------------------
    // o que o jogador pede e por quanto tempo
    proposta(s, t, p, anos) {
        const aux = Comissao.membro(s, 'aux');
        let pede = Math.max(p.sal * 1.08, Mundo.salarioPedido(p, Mundo.riquezaDoTime(s, t))) * (1 + Math.max(0, p.ovr - t.rep) * 0.015);
        if (aux) pede *= 1.04 - aux.est * 0.02;   // o auxiliar ajuda (ou atrapalha) na negociação
        const n = anos || (p.idade <= 27 ? 3 : p.idade <= 31 ? 2 : 1);
        return { pede: U.redondo(Math.max(pede, p.sal)), anos: n };
    },

    // chance de o jogador recusar e o motivo principal
    risco(s, t, p) {
        const partes = [];
        const nv = Mot.nivel(p).id;
        if (nv === 'muitoDes') partes.push([0.55, 'está muito desmotivado']);
        else if (nv === 'desmotivado') partes.push([0.25, 'anda desmotivado']);
        if (Mot.pers(p) === 'ambicioso' && p.ovr >= t.rep) partes.push([0.2, 'é ambicioso e sonha mais alto']);
        if (p.ovr > t.rep + 7) partes.push([0.35, 'acha que merece um clube maior']);
        if (p.pq > 0) partes.push([0.15, 'não esqueceu a promessa quebrada']);
        let r = U.soma(partes, x => x[0]);
        if (nv === 'muito') r -= 0.1;
        if (p.idade >= 32) r -= 0.1;
        partes.sort((a, b) => b[0] - a[0]);
        return { r: U.clamp(r, 0, 0.9), motivo: partes.length ? partes[0][1] : '' };
    },

    recusouHaPouco(s, p) {
        return p.renRec != null && Mot.agora(s) - p.renRec < 6;
    },

    renovar(s, t, p, prop) {
        p.sal = prop.pede;
        p.contr = prop.anos + 1;
        Mot.mudar(p, 4);
    },

    // vale a pena renovar? (critério do auxiliar)
    valeRenovar(s, t, p, rank, aux) {
        const k = rank.get(p.id) || 99;
        if (p.idade >= 34 && k > 6) return false;
        if (k <= (aux.est <= 2 ? 20 : 16)) return true;
        return p.idade <= 23 && p.pot >= t.rep - 3;
    },

    cabeNoOrcamento(s, t, aumentoAno) {
        if (aumentoAno <= 0) return true;
        if (Comissao.resultadoSemanal(s, t) - aumentoAno / 52 >= 0) return true;
        return t.saldo >= aumentoAno * 3 && aumentoAno <= Tecnico.folha(s, t) * 0.02;
    },

    auxRenovar(s, t, aux) {
        if (aux.est <= 2 && U.chance((3 - aux.est) * 0.25)) return;   // auxiliar fraco deixa para depois
        const rank = Mot.ranking(s, t);
        const cands = Mundo.elenco(s, t).filter(p => p.contr <= 1 && s.car.venda.indexOf(p.id) < 0 && !Comissao.recusouHaPouco(s, p)
            && p.renOrc !== s.ano && Comissao.valeRenovar(s, t, p, rank, aux)).sort((a, b) => b.ovr - a.ovr);
        let feitos = 0;
        for (const p of cands) {
            if (feitos >= 2) break;
            const prop = Comissao.proposta(s, t, p);
            if (!Comissao.cabeNoOrcamento(s, t, prop.pede - p.sal)) {
                p.renOrc = s.ano;   // não tenta de novo nesta temporada
                Comissao.tarefa(s, `💸 não renovou ${U.esc(p.nome)}: não cabe no orçamento`);
                continue;
            }
            feitos++;
            const rc = Comissao.risco(s, t, p);
            if (U.chance(rc.r)) {
                p.renRec = Mot.agora(s);
                Comissao.tarefa(s, `❌ ${U.esc(p.nome)} não quis renovar (${rc.motivo})`);
                continue;
            }
            Comissao.renovar(s, t, p, prop);
            Comissao.tarefa(s, `✍️ renovou ${U.esc(p.nome)} até ${s.ano + p.contr - 1} (${U.dinheiro(p.sal)}/ano)`);
        }
    },

    // -----------------------------------------------------------------
    //  💪 🩺 Preparador e médico durante os jogos
    // -----------------------------------------------------------------
    // gancho em Partida.passo: chance de lesão do time do usuário (com preparador, menor)
    fatorLesao(m, lado) {
        const s = m.s;
        if (s.modo !== 'tecnico' || !s.car || !s.car.cm) return 1;
        if (!Mundo.timeDoUsuario(s, lado ? m.a : m.h)) return 1;
        const prep = Comissao.membro(s, 'prep');
        return prep ? 1 - prep.est * 0.09 : 1;
    },

    // gancho em Tecnico.posJogo (antes do departamento médico): lesões mais curtas e a dica do analista
    posJogo(s, t, m, r) {
        if (!s.car.cm) return;
        const med = Comissao.membro(s, 'med');
        if (med) {
            for (const pid of Object.keys(m.st)) {
                const p = s.jog[pid];
                if (!p || p.tid !== t.id || !m.st[pid].les || !(p.les > 0)) continue;
                const antes = p.les;
                p.les = Math.max(1, Math.round(p.les * (1 - med.est * 0.07)));
                if (p.les < antes) {
                    med.poupou = (med.poupou || 0) + antes - p.les;
                    Vida.log(s, `🩺 ${Comissao.nome(med)}: ${U.esc(p.nome)} volta em ${p.les} semana${p.les > 1 ? 's' : ''} (a previsão era ${antes}).`, 'bom');
                }
            }
        }
        const ana = Comissao.membro(s, 'ana');
        const cx = m.cmx;
        if (ana && cx && cx.dica) {
            ana.jogos = (ana.jogos || 0) + 1;
            if (cx.usou && r.venc === t.id) {
                ana.vitorias = (ana.vitorias || 0) + 1;
                Conquistas.contar(s, 'dicasAnalista');
            }
        }
    },

    // -----------------------------------------------------------------
    //  📊 Analista: relatório e dica do jogo
    // -----------------------------------------------------------------
    // a partida é do time do usuário (e não de seleção)?
    jogoDoClube(m) {
        const s = m.s;
        if (s.modo !== 'tecnico' || !s.car || m.controle < 0 || m.jogo.tipo === 'selecao') return false;
        return Mundo.timeDoUsuario(s, m.controle ? m.a : m.h);
    },

    // a dica do analista para este jogo (fica guardada na partida)
    dica(m, lado) {
        if (m.cmx && m.cmx.dica) return m.cmx.dica;
        const s = m.s, o = 1 - lado;
        const adv = s.times[o ? m.a : m.h];
        const emCampo = Partida.emCampo(m, o);
        if (!adv || !emCampo.length) return null;
        const craque = PartidaExtras.craque(m, o);
        const media = U.media(emCampo, p => p.ovr);
        const gap = craque ? craque.ovr - media : 0;
        const estilo = m.estilo[o];
        const liga = adv.liga ? Mundo.liga(s, adv.liga) : null;
        const ult = liga && liga.tab && liga.tab[adv.id] ? liga.tab[adv.id].ult.slice(-5) : [];
        const idade = U.media(emCampo, p => p.idade);
        let d;
        if (craque && gap >= 6) d = { k: 'marcar', txt: `${craque.nome} decide os jogos deles: tire o craque do jogo.`, como: '🎯 Marcar o craque deles' };
        else if (estilo === 'ofensivo' || estilo === 'tudo') d = { k: 'estilo', estilos: ['defensivo', 'retranca'], txt: 'Eles vão para cima e deixam espaço atrás: jogue no contra-ataque.', como: 'Estilo Defensivo (ou Retranca)' };
        else if (estilo === 'retranca' || estilo === 'defensivo') d = { k: 'pontas', txt: 'Eles se fecham no meio: abra o jogo pelas pontas.', como: '↔️ Jogar pelas pontas' };
        else if (ult.filter(x => x === 'D').length >= 3) d = { k: 'estilo', estilos: ['ofensivo', 'tudo'], txt: 'Chegam em má fase e sem confiança: pressione desde o começo.', como: 'Estilo Ofensivo' };
        else if (idade >= 29.5) d = { k: 'pressao', txt: 'Time experiente, mas que cansa: aperte com pressão total no 2º tempo.', como: '⚡ Pressão total' };
        else if (craque && gap >= 3.5) d = { k: 'marcar', txt: `${craque.nome} é a principal arma deles: marcação individual nele.`, como: '🎯 Marcar o craque deles' };
        else d = { k: 'estilo', estilos: ['equilibrado'], txt: 'Jogo de xadrez: time equilibrado e paciência.', como: 'Estilo Equilibrado' };
        d.craque = craque ? craque.id : null;
        d.ult = ult;
        d.estiloAdv = estilo;
        d.formAdv = adv.form;
        m.cmx = m.cmx || {};
        m.cmx.dica = d;
        return d;
    },

    // 'sim' = você está seguindo a dica, 'aux' = o auxiliar passou a dica aos jogadores, '' = não
    seguindo(m, lado, d) {
        if (d.k === 'estilo') return d.estilos.indexOf(m.estilo[lado]) >= 0 ? 'sim' : '';
        const I = m.px && m.px.instr[lado];
        if (I && (d.k === 'marcar' ? I.marcar : I.plano === d.k)) return 'sim';
        return Comissao.membro(m.s, 'aux') ? 'aux' : '';
    },

    // gancho em Partida.bonusTime (só o time do técnico usuário): bônus de seguir a dica
    bonusAnalista(m, lado) {
        if (!Comissao.jogoDoClube(m) || m.controle !== lado) return 0;
        const ana = Comissao.membro(m.s, 'ana');
        if (!ana) return 0;
        const d = Comissao.dica(m, lado);
        if (!d) return 0;
        const seg = Comissao.seguindo(m, lado, d);
        if (!seg) return 0;
        m.cmx.usou = true;
        return Comissao.bonusDica(ana.est) * (seg === 'sim' ? 1 : 0.5);
    },

    // relatório no pré-jogo (gancho em TelaPartida.preJogo)
    htmlPreJogo(m) {
        if (!Comissao.jogoDoClube(m)) return '';
        const s = m.s, l = m.controle;
        const ana = Comissao.membro(s, 'ana');
        if (!ana) return '<p class="cinza pequeno cm-pre-sem">📊 Sem analista de desempenho: contrate um na aba 🧑‍💼 Comissão para receber o relatório do adversário.</p>';
        const d = Comissao.dica(m, l);
        if (!d) return '';
        const o = 1 - l;
        const craque = d.craque != null ? s.jog[d.craque] : null;
        const icones = { V: '✅', E: '➖', D: '❌' };
        const linhas = [`<div><span>Formação</span><b>${U.esc(d.formAdv)} · ${ESTILOS[d.estiloAdv] ? ESTILOS[d.estiloAdv].nome : ''}</b></div>`];
        if (craque) linhas.push(`<div><span>Craque</span><b>${U.esc(craque.nome)} (${craque.pos}, ${craque.ovr})</b></div>`);
        if (ana.est >= 2) linhas.push(`<div><span>Últimos jogos</span><b>${d.ult.length ? d.ult.map(x => icones[x]).join('') : 'sem jogos na liga'}</b></div>`);
        if (ana.est >= 3 && m.R) {
            const R = m.R[o];
            const fraco = R.def < R.ata - 2 ? 'a defesa' : R.ata < R.def - 2 ? 'o ataque (criam pouco)' : 'nenhum setor em especial';
            linhas.push(`<div><span>Ponto fraco</span><b>${fraco}</b></div>`);
        }
        const seg = Comissao.seguindo(m, l, d);
        const bonus = String(Math.round(Comissao.bonusDica(ana.est) * 100) / 100).replace('.', ',');
        const status = seg === 'sim' ? `<b class="verde">✅ Você está seguindo a dica (+${bonus})</b>`
            : seg === 'aux' ? '🧑‍💼 O auxiliar já passou a dica aos jogadores (metade do bônus). Ative você mesmo no jogo para o bônus inteiro.'
                : `👉 Para seguir: <b>${d.como}</b>${d.k === 'estilo' ? ' (em "📋 Alterar tática")' : ' (botão durante o jogo)'}`;
        return `<div class="cm-relatorio">
            <div class="cm-rel-topo">📊 <b>Relatório do analista</b> <small>${Comissao.nome(ana)} <span class="estrelas-olh">${U.estrelas(ana.est)}</span></small></div>
            <div class="ficha">${linhas.join('')}</div>
            <p class="cm-dica-txt">💡 <b>Dica:</b> ${U.esc(d.txt)}</p>
            <p class="pequeno">${status}</p>
        </div>`;
    },

    // linha da dica durante o jogo (gancho em TelaPartida.controles)
    htmlDica(m) {
        if (!Comissao.jogoDoClube(m) || m.terminou) return '';
        const ana = Comissao.membro(m.s, 'ana');
        const d = ana ? Comissao.dica(m, m.controle) : null;
        if (!d) return '';
        const seg = Comissao.seguindo(m, m.controle, d);
        const st = seg === 'sim' ? '<b class="verde">✅ seguindo</b>' : seg === 'aux' ? '<span class="cinza">🧑‍💼 meio bônus (auxiliar)</span>' : '<span class="cinza">não está seguindo</span>';
        return `<div class="px-linha cm-dica-jogo">📊 Dica do analista: <b>${d.como}</b> · ${st}</div>`;
    },

    // -----------------------------------------------------------------
    //  📝 Pendências (tela do clube)
    // -----------------------------------------------------------------
    pendencias(s, t) {
        const itens = [];
        const add = (nivel, ic, txt, det, botao) => itens.push({ nivel, ic, txt, det, botao });
        const el = Mundo.elenco(s, t);
        const cm = Comissao.estado(s);
        const aux = cm.staff.aux;
        const nomes = (lista, f) => lista.slice(0, 3).map(p => U.esc(p.nome.split(' ').slice(-1)[0]) + (f ? f(p) : '')).join(', ') + (lista.length > 3 ? ` e mais ${lista.length - 3}` : '');
        // dinheiro
        const res = Comissao.resultadoSemanal(s, t);
        if (t.saldo < 0) add('urgente', '💸', `Caixa negativo: ${U.dinheiro(t.saldo)}`, 'A diretoria perde confiança toda semana assim.', { txt: 'Finanças', aba: 'financas' });
        else if (res < 0 && t.saldo < -res * 8) add('aviso', '💸', `O clube perde ${U.dinheiro(-res)} por semana`, `O caixa dura umas ${Math.max(1, Math.floor(t.saldo / -res))} semanas.`, { txt: 'Finanças', aba: 'financas' });
        // contratos
        const vencendo = el.filter(p => p.contr <= 1 && s.car.venda.indexOf(p.id) < 0).sort((a, b) => b.ovr - a.ovr);
        if (vencendo.length) {
            const cuidando = aux && cm.deleg.renov;
            const tarde = s.semana >= 30;
            add(cuidando ? (tarde ? 'aviso' : 'info') : (tarde ? 'urgente' : 'aviso'), '✍️', `${vencendo.length} contrato${vencendo.length > 1 ? 's vencem' : ' vence'} no fim da temporada`,
                nomes(vencendo) + (cuidando ? ' · o auxiliar renova quem vale a pena' : ''), { txt: 'Renovar em lote', aba: 'elenco', lote: 1 });
        }
        // vestiário
        const des = el.filter(p => { const n = Mot.nivel(p).id; return n === 'desmotivado' || n === 'muitoDes'; }).sort((a, b) => Mot.valor(a) - Mot.valor(b));
        if (des.length) add(des.filter(p => Mot.nivel(p).id === 'muitoDes').length >= 2 ? 'urgente' : 'aviso', '😕', `${des.length} jogador${des.length > 1 ? 'es desmotivados' : ' desmotivado'}`, nomes(des, p => ' ' + Mot.nivel(p).icone), { txt: 'Vestiário', aba: 'vestiario' });
        const agora = Mot.agora(s);
        const prom = Object.keys(s.car.prom || {}).map(pid => [s.jog[pid], s.car.prom[pid]]).filter(x => x[0] && x[0].tid === t.id);
        if (prom.length) {
            const perto = prom.some(x => x[1].ate - agora <= 1 && x[1].feitos < x[1].precisa);
            add(perto ? 'aviso' : 'info', '🤝', `${prom.length} promessa${prom.length > 1 ? 's' : ''} de tempo de jogo`,
                prom.slice(0, 3).map(x => `${U.esc(x[0].nome.split(' ').slice(-1)[0])} ${x[1].feitos}/${x[1].precisa} (${Math.max(0, x[1].ate - agora)} sem.)`).join(', '), { txt: 'Vestiário', aba: 'vestiario' });
        }
        // lesões
        const top = new Set(el.slice().sort((a, b) => b.ovr - a.ovr).slice(0, 13).map(p => p.id));
        const les = el.filter(p => p.les > 0 && top.has(p.id)).sort((a, b) => b.les - a.les);
        if (les.length) add('aviso', '🚑', `${les.length} titular${les.length > 1 ? 'es machucados' : ' machucado'}`, nomes(les, p => ` (${p.les} sem.)`) + (Comissao.membro(s, 'med') ? '' : ' · um médico encurtaria as lesões'), { txt: 'Ajustar o time', aba: 'tatica' });
        if (t.elenco.length < 18) add('aviso', '👥', `Elenco curto: ${t.elenco.length} jogadores`, 'Contrate alguém (jogadores sem clube podem vir a qualquer momento).', { txt: 'Mercado', aba: 'mercado' });
        // base e olheiros
        const kids = t.base ? Base.garotos(s, t) : [];
        const promB = kids.filter(p => p.promB != null);
        if (promB.length) {
            const cuida = aux && cm.deleg.base;
            add(cuida ? 'info' : 'aviso', '🌱', `Promessa: subir ${promB.length > 1 ? `${promB.length} garotos` : 'um garoto'} da base`,
                nomes(promB) + (cuida ? ' · o auxiliar sobe na reta final da temporada' : ' · até o fim da temporada, senão vão embora'), { txt: 'Base', aba: 'base' });
        }
        const relat = (s.car.relat || []).filter(r => r.cands.some(x => !x.st));
        if (relat.length) add('aviso', '📋', `${relat.length} relatório${relat.length > 1 ? 's' : ''} de olheiro esperando`, 'Decida quem vai para a base.', { txt: 'Base', aba: 'base' });
        const parados = (s.car.olheiros || []).filter(o => !o.missao);
        if (parados.length) add('info', '🔭', `${parados.length} olheiro${parados.length > 1 ? 's' : ''} sem missão`, nomes(parados.map(o => ({ nome: o.nome }))), { txt: 'Base', aba: 'base' });
        // mercado e propostas
        const ofertas = (s.car.ofertas || []).length;
        if (ofertas) add('info', '📨', `${ofertas} proposta${ofertas > 1 ? 's' : ''} de emprego`, 'Estão no alto desta tela.', { txt: 'Ver', aba: 'inicio', rolar: '.oferta' });
        const venda = s.car.venda.map(id => s.jog[id]).filter(p => p && p.tid === t.id);
        if (venda.length) add('info', '🏷️', `${venda.length} jogador${venda.length > 1 ? 'es' : ''} à venda`, nomes(venda) + (Mundo.emJanela(s) ? ' · janela aberta: as propostas chegam a qualquer semana' : ' · as propostas só chegam com a janela aberta'), { txt: 'Elenco', aba: 'elenco' });
        // diretoria e organização
        if (s.car.conf < 30) add('urgente', '⚠️', `Diretoria impaciente: ${Math.round(s.car.conf)}% de confiança`, 'Os próximos resultados podem custar o emprego.', { txt: 'Próximos jogos', aba: 'calendario' });
        if (s.car.capitao == null || !s.jog[s.car.capitao] || s.jog[s.car.capitao].tid !== t.id) add('info', '©️', 'Time sem capitão', 'Com o capitão em campo o time joga melhor.', { txt: 'Tática', aba: 'tatica' });
        if (!aux) add('info', '🧑‍💼', 'Sem auxiliar técnico', 'Contrate um e delegue treino, vestiário, mensagens, renovações e base.', { txt: 'Comissão', aba: 'comissao' });
        Clube.pendencias(s, t, add);   // clima (js/clube.js): pré-temporada, janela, torcida, brigas e objetivos
        const ordem = { urgente: 0, aviso: 1, info: 2 };
        return itens.sort((a, b) => ordem[a.nivel] - ordem[b.nivel]);
    },

    htmlPendencias(s, t) {
        const itens = Comissao.pendencias(s, t);
        const urg = itens.filter(x => x.nivel !== 'info').length;
        const linha = x => `<div class="cm-pend cm-${x.nivel}">
            <span class="cm-pend-ic">${x.ic}</span>
            <span class="cm-pend-txt"><b>${x.txt}</b>${x.det ? `<small>${x.det}</small>` : ''}</span>
            ${x.botao ? `<button class="btn btn-pequeno ${x.nivel === 'urgente' ? 'btn-primario' : ''}" data-acao="cmIr" data-aba="${x.botao.aba}"${x.botao.lote ? ' data-lote="1"' : ''}${x.botao.rolar ? ` data-rolar="${x.botao.rolar}"` : ''}>${x.botao.txt}</button>` : ''}
        </div>`;
        return `<div class="cartao cm-pendencias">
            <div class="cartao-topo"><h3>📝 Pendências${itens.length ? ` <small class="tag">${itens.length}</small>` : ''}</h3>${urg ? `<span class="pequeno ${itens[0].nivel === 'urgente' ? 'vermelho' : 'cinza'}">${urg} pedindo atenção</span>` : ''}</div>
            ${itens.length ? `<div class="cm-pend-lista">${itens.map(linha).join('')}</div>` : '<p class="cinza">✅ Nada pendente. Tudo em dia, professor!</p>'}
        </div>`;
    },

    // -----------------------------------------------------------------
    //  👥 Elenco: renovação em lote e buscar substituto
    // -----------------------------------------------------------------
    elegiveisLote(s, t) {
        const mais = !!Jogo.ui.loteMais;
        return Mundo.elenco(s, t).filter(p => p.contr <= (mais ? 2 : 1)).sort((a, b) => a.contr - b.contr || b.ovr - a.ovr);
    },

    abrirLote(s, t) {
        const rank = Mot.ranking(s, t);
        Jogo.ui.lote = true;
        Jogo.ui.loteMais = false;
        Jogo.ui.loteAnos = 'auto';
        Jogo.ui.loteSel = {};
        for (const p of Comissao.elegiveisLote(s, t)) {
            if (s.car.venda.indexOf(p.id) >= 0 || Comissao.recusouHaPouco(s, p)) continue;
            if (p.idade <= 33 || (rank.get(p.id) || 99) <= 8) Jogo.ui.loteSel[p.id] = true;
        }
    },

    painelElenco(s, t) {
        const vencendo = Mundo.elenco(s, t).filter(p => p.contr <= 1).length;
        if (!Jogo.ui.lote) {
            return `<div class="cm-barra-elenco">
                <button class="btn btn-pequeno ${vencendo ? 'btn-primario' : ''}" data-acao="cmLote">✍️ Renovação em lote${vencendo ? ` (${vencendo} vencendo)` : ''}</button>
                <span class="cinza pequeno">🔍 ao lado do nome = buscar um substituto no mercado</span>
            </div>`;
        }
        const anos = Jogo.ui.loteAnos === 'auto' ? 0 : +Jogo.ui.loteAnos || 0;
        const sel = Jogo.ui.loteSel || {};
        const lista = Comissao.elegiveisLote(s, t);
        let n = 0, aumento = 0;
        const linhas = lista.map(p => {
            const prop = Comissao.proposta(s, t, p, anos);
            const rc = Comissao.risco(s, t, p);
            const bloq = Comissao.recusouHaPouco(s, p);
            const marcado = !bloq && !!sel[p.id];
            if (marcado) { n++; aumento += prop.pede - p.sal; }
            const dif = p.sal ? Math.round((prop.pede / p.sal - 1) * 100) : 0;
            const risco = bloq ? `<span class="vermelho">recusou · ${6 - (Mot.agora(s) - p.renRec)} sem.</span>`
                : rc.r >= 0.45 ? `<span class="vermelho" title="${U.esc(rc.motivo)}">😠 alto</span>`
                    : rc.r >= 0.2 ? `<span class="cm-medio" title="${U.esc(rc.motivo)}">⚠️ médio</span>` : '<span class="verde">✅ baixo</span>';
            return `<tr class="${marcado ? 'cm-sel' : ''}">
                <td><input type="checkbox" class="cm-check" data-mudar="cmLoteSel" data-pid="${p.id}" ${marcado ? 'checked' : ''} ${bloq ? 'disabled' : ''}></td>
                <td>${UI.pos(p.pos)}</td><td class="esq">${UI.jogador(p)}${s.car.venda.indexOf(p.id) >= 0 ? ' 🏷️' : ''}</td><td>${p.idade}</td><td>${UI.ovr(p.ovr)}</td><td>${Mot.badge(p, true)}</td>
                <td class="${p.contr <= 1 ? 'vermelho' : ''}">${s.ano + p.contr - 1}</td>
                <td>${U.dinheiro(p.sal)} → <b>${U.dinheiro(prop.pede)}</b> <small class="cinza">(${dif >= 0 ? '+' : ''}${dif}%)</small></td>
                <td>até ${s.ano + prop.anos}</td><td>${risco}</td></tr>`;
        }).join('');
        const antes = Comissao.resultadoSemanal(s, t), depois = antes - aumento / 52;
        const aux = Comissao.membro(s, 'aux');
        return `<div class="cartao cm-lote">
            <div class="cartao-topo"><h3>✍️ Renovação em lote</h3><button class="btn btn-pequeno btn-fantasma" data-acao="cmLoteFechar">✖ Fechar</button></div>
            <p class="cinza pequeno">Marque os contratos e renove todos de uma vez. Jogador desmotivado, ambicioso ou que se acha grande demais para o clube pode recusar (veja o risco). ${aux ? `Seu auxiliar entra na negociação (${Comissao.efeito('aux', aux.est).split(' · ')[1] || 'sem desconto'}).` : ''}</p>
            <div class="cm-lote-opcoes">
                <button class="chip-btn ${Jogo.ui.loteMais ? '' : 'ativo'}" data-acao="cmLoteMais" data-v="0">Vencem em ${s.ano}</button>
                <button class="chip-btn ${Jogo.ui.loteMais ? 'ativo' : ''}" data-acao="cmLoteMais" data-v="1">+ os que vencem em ${s.ano + 1}</button>
                <label class="pequeno">Duração <select class="sel sel-mini" data-mudar="cmLoteAnos">
                    ${[['auto', 'Pela idade (3/2/1 anos)'], ['1', '1 temporada'], ['2', '2 temporadas'], ['3', '3 temporadas']].map(([v, txt]) => `<option value="${v}" ${String(Jogo.ui.loteAnos) === v ? 'selected' : ''}>${txt}</option>`).join('')}
                </select></label>
            </div>
            ${lista.length ? `<div class="rolavel"><table class="tabela tabela-elenco cm-tabela-lote">
                <thead><tr><th></th><th>Pos</th><th class="esq">Jogador</th><th>Idade</th><th>OVR</th><th>Mot.</th><th>Contrato</th><th>Salário/ano</th><th>Novo</th><th>Risco</th></tr></thead>
                <tbody>${linhas}</tbody></table></div>` : '<p class="cinza">Nenhum contrato vencendo. 👍</p>'}
            <div class="cm-lote-total">
                <span><b>${n}</b> selecionado${n === 1 ? '' : 's'} · folha <b class="${aumento > 0 ? 'vermelho' : ''}">${aumento >= 0 ? '+' : ''}${U.dinheiro(aumento)}/ano</b> <small class="cinza">(${aumento >= 0 ? '+' : ''}${U.dinheiro(aumento / 52)}/sem.)</small></span>
                <span>Resultado semanal do clube: <b class="${antes < 0 ? 'vermelho' : 'verde'}">${U.dinheiro(antes)}</b> → <b class="${depois < 0 ? 'vermelho' : 'verde'}">${U.dinheiro(depois)}</b></span>
            </div>
            <div class="linha-botoes">
                <button class="btn btn-primario" data-acao="cmLoteRenovar" ${n ? '' : 'disabled'}>✍️ Renovar ${n} contrato${n === 1 ? '' : 's'}</button>
                <button class="btn btn-pequeno" data-acao="cmLoteTodos" data-v="1">Marcar todos</button>
                <button class="btn btn-pequeno btn-fantasma" data-acao="cmLoteTodos" data-v="0">Desmarcar</button>
            </div>
        </div>`;
    },

    async renovarLote(s) {
        const t = Tecnico.time(s);
        if (!t) return;
        const anos = Jogo.ui.loteAnos === 'auto' ? 0 : +Jogo.ui.loteAnos || 0;
        const sel = Jogo.ui.loteSel || {};
        const alvos = Comissao.elegiveisLote(s, t).filter(p => sel[p.id] && !Comissao.recusouHaPouco(s, p));
        if (!alvos.length) return;
        const ok = [], nao = [];
        for (const p of alvos) {
            const prop = Comissao.proposta(s, t, p, anos);
            const rc = Comissao.risco(s, t, p);
            if (U.chance(rc.r)) { p.renRec = Mot.agora(s); nao.push([p, rc.motivo]); continue; }
            const antes = p.sal;
            Comissao.renovar(s, t, p, prop);
            ok.push([p, antes]);
        }
        Jogo.ui.loteSel = {};
        if (ok.length) {
            Conquistas.maximo(s, 'renovacaoLote', ok.length);
            Vida.log(s, `✍️ Renovação em lote: ${ok.map(x => `${x[0].nome} (até ${s.ano + x[0].contr - 1})`).join(', ')}.`, 'bom');
        }
        if (nao.length) Vida.log(s, `❌ Não quiseram renovar: ${nao.map(x => x[0].nome).join(', ')}.`, 'ruim');
        const aumento = U.soma(ok, x => x[0].sal - x[1]);
        await UI.aviso('Renovação em lote', `${ok.length ? `<b class="verde">✅ ${ok.length} renovaram:</b><div class="lista-grupo">${ok.map(x => `<div>${UI.pos(x[0].pos)} ${U.esc(x[0].nome)} · até ${s.ano + x[0].contr - 1} · ${U.dinheiro(x[0].sal)}/ano</div>`).join('')}</div>` : ''}
            ${nao.length ? `<b class="vermelho">❌ ${nao.length} recusaram:</b><div class="lista-grupo">${nao.map(x => `<div>${UI.pos(x[0].pos)} ${U.esc(x[0].nome)} — ${U.esc(x[1])}</div>`).join('')}</div><small class="cinza">Converse com eles no Vestiário e tente de novo em 6 semanas.</small>` : ''}
            ${ok.length ? `<br>Impacto na folha: <b>+${U.dinheiro(aumento)}/ano</b>.` : ''}`, ok.length ? '✍️' : '🙅');
        if (!Comissao.elegiveisLote(s, t).some(p => !Comissao.recusouHaPouco(s, p))) Jogo.ui.lote = false;
    },

    botaoSubstituto(s, p) {
        return `<button class="cm-sub" data-acao="cmSubstituto" data-pid="${p.id}" title="Buscar substituto para ${U.esc(p.nome)}">🔍</button>`;
    },

    // filtros do mercado para achar um substituto: mesma posição, OVR parecido ou melhor, mais novo ou mais barato
    filtroSubstituto(p) {
        const v = Mundo.valor(p) * 1.25;
        const preco = PRECOS_MERCADO_CM.find(x => x >= v) || 0;
        return { pos: p.pos, liga: '', ovr: Math.max(40, p.ovr - 2), idade: p.idade <= 23 ? 25 : p.idade, preco, nome: '', livres: false };
    },

    // as melhores opções para substituir p (com as vantagens de cada um)
    sugestoes(s, t, p) {
        const janela = Mundo.emJanela(s);
        const vp = Mundo.valor(p);
        const lista = [];
        for (const id in s.jog) {
            const q = s.jog[id];
            if (q.user || q.pos !== p.pos || q.tid === t.id || q.tid < -1 || q.ovr < p.ovr - 2 || q.idade > 36) continue;
            if (q.tid >= 0 && !janela) continue;
            const custo = q.tid >= 0 ? Mundo.valor(q) : 0;
            // substituto, não reforço de luxo: no máximo 50% mais caro (ou € 2 mi a mais) e que caiba no caixa
            if (custo > Math.max(0, t.saldo) || custo > Math.max(vp * 1.5, vp + 2e6)) continue;
            const dOvr = q.ovr - p.ovr, dIdade = p.idade - q.idade;
            const vant = [];
            if (dOvr >= 1) vant.push(`+${dOvr} OVR`);
            if (dIdade >= 2) vant.push(`${dIdade} anos mais novo`);
            if (custo < vp * 0.8) vant.push(q.tid < 0 ? 'livre, sem taxa' : 'mais barato');
            if (q.sal < p.sal * 0.85) vant.push('salário menor');
            if (!vant.length) continue;
            // chance de ele nem querer conversar (a mesma conta de Tecnico.proposta): quem quase certamente recusa fica de fora
            const dif = (q.tid >= 0 ? s.times[q.tid].rep : q.ovr - 6) - t.rep;
            const recusa = dif > 5 ? Math.min(0.92, (dif - 5) * 0.11) : 0;
            if (recusa > 0.5) continue;
            const nota = U.clamp(dOvr, -2, 4) * 1.3 + U.clamp(dIdade, -4, 8) * 0.5 + (vp - custo) / Math.max(vp, custo, 1) * 2.5
                + (q.sal < p.sal ? 0.8 : 0) + (q.tid < 0 ? 1 : 0) - recusa * 5;
            lista.push({ q, custo, vant, nota });
        }
        return lista.sort((a, b) => b.nota - a.nota).slice(0, 6);
    },

    bannerMercado(s) {
        const t = Tecnico.time(s);
        const p = t && Jogo.ui.substituto != null ? s.jog[Jogo.ui.substituto] : null;
        if (!p || p.tid !== t.id) return '';
        const f = Comissao.filtroSubstituto(p);
        const sug = Comissao.sugestoes(s, t, p);
        const card = x => `<div class="cm-sug">
            <div class="cm-sug-topo">${UI.pos(x.q.pos)} ${UI.jogador(x.q)} ${UI.ovr(x.q.ovr)}</div>
            <small class="cinza">${x.q.idade} anos · ${x.q.tid >= 0 ? U.esc(s.times[x.q.tid].nome) : 'sem clube'}</small>
            <small>${x.q.tid >= 0 ? `Valor ${U.dinheiro(x.custo)} · ` : ''}${U.dinheiro(x.q.sal)}/ano</small>
            <div class="cm-vant">${x.vant.map(v => `<span class="tag">${v}</span>`).join('')}</div>
            <button class="btn btn-pequeno btn-primario" data-acao="tcProposta" data-pid="${x.q.id}">${x.q.tid >= 0 ? '💸 Proposta' : '✍️ Contratar'}</button>
        </div>`;
        return `<div class="cartao cm-subst">
            <div class="cartao-topo"><h3>🔍 Substituto para ${UI.pos(p.pos)} ${U.esc(p.nome)}</h3><button class="btn btn-pequeno btn-fantasma" data-acao="cmSubLimpar">✖ Fechar</button></div>
            <p class="cinza pequeno">${p.idade} anos · OVR ${p.ovr} · ${U.dinheiro(p.sal)}/ano · valor ${U.dinheiro(Mundo.valor(p))}. A busca abaixo já está filtrada: ${POS_NOME[p.pos].toLowerCase()}, OVR ${f.ovr}+, até ${f.idade} anos${f.preco ? `, valor até ${U.dinheiro(f.preco)}` : ''}.</p>
            ${sug.length ? `<h4>⭐ Melhores opções (mais novo, mais barato ou melhor)</h4><div class="cm-sugestoes">${sug.map(card).join('')}</div>`
                : `<p class="cinza">Nenhuma opção ${Mundo.emJanela(s) ? 'que caiba no caixa' : 'sem clube'} melhor, mais nova ou mais barata agora.</p>`}
            ${Mundo.emJanela(s) ? '' : '<p class="pequeno">🔒 Janela fechada: só aparecem jogadores sem clube nas sugestões (a lista completa continua abaixo).</p>'}
        </div>`;
    },

    // -----------------------------------------------------------------
    //  Aba "🧑‍💼 Comissão"
    // -----------------------------------------------------------------
    cardMembro(s, papel, o) {
        const P = PAPEIS_CM[papel];
        if (!o) {
            return `<div class="olheiro cm-vaga">
                <div class="olh-topo"><span class="olh-band">${P.icone}</span><span><b>${P.nome}</b><br><small class="cinza">Vaga aberta</small></span></div>
                <p class="cinza pequeno">${P.desc}</p>
                <button class="btn btn-pequeno" data-acao="cmPapel" data-p="${papel}">Ver candidatos</button>
            </div>`;
        }
        const extra = [];
        if (papel === 'aux' && o.tarefas) extra.push(`<div><span>Tarefas resolvidas</span><b>${o.tarefas}</b></div>`);
        if (papel === 'med' && o.poupou) extra.push(`<div><span>Semanas de lesão poupadas</span><b>${o.poupou}</b></div>`);
        if (papel === 'ana' && o.jogos) extra.push(`<div><span>Vitórias com a dica</span><b>${o.vitorias || 0} em ${o.jogos} jogos</b></div>`);
        return `<div class="olheiro cm-membro">
            <div class="olh-topo"><span class="olh-band">${P.icone}</span><span><small class="cinza">${P.nome}</small><br><b>${o.bnd} ${Comissao.nome(o)}</b></span></div>
            <div class="ficha">
                <div><span>Competência</span><b>${Base.estrelasHtml(o.est)}</b></div>
                <div><span>Salário</span><b>${U.dinheiro(o.sal)}/sem.</b></div>
                ${extra.join('')}
            </div>
            <p class="pequeno cm-efeito">${Comissao.efeito(papel, o.est)}</p>
            <div class="linha-botoes"><button class="btn btn-fantasma btn-pequeno" data-acao="cmDemitir" data-p="${papel}">Demitir · multa ${U.dinheiro(o.sal * MULTA_CM)}</button></div>
        </div>`;
    },

    cardCandidato(s, t, o) {
        const atual = Comissao.estado(s).staff[o.papel];
        const luvas = o.sal * LUVAS_CM;
        const pode = t.saldo >= luvas + (atual ? atual.sal * MULTA_CM : 0);
        return `<div class="olheiro">
            <div class="olh-topo"><span class="olh-band">${o.bnd}</span><span><b>${Comissao.nome(o)}</b><br><small class="cinza">${PAPEIS_CM[o.papel].icone} ${PAPEIS_CM[o.papel].nome}</small></span></div>
            <div class="ficha">
                <div><span>Competência</span><b>${Base.estrelasHtml(o.est)}</b></div>
                <div><span>Salário</span><b>${U.dinheiro(o.sal)}/sem.</b></div>
            </div>
            <p class="pequeno cm-efeito">${Comissao.efeito(o.papel, o.est)}</p>
            <button class="btn btn-pequeno ${pode && (!atual || o.est > atual.est) ? 'btn-primario' : ''}" data-acao="cmContratar" data-p="${o.papel}" data-id="${o.id}">${atual ? 'Trocar' : 'Contratar'} · luvas ${U.dinheiro(luvas)}</button>
        </div>`;
    },

    tela(s) {
        const t = Tecnico.time(s);
        const cm = Comissao.estado(s);
        Comissao.atualizarMercado(s, t);
        const aux = cm.staff.aux;
        const papel = PAPEIS_CM[Jogo.ui.cmPapel] ? Jogo.ui.cmPapel : (ORDEM_CM.find(k => !cm.staff[k]) || 'aux');
        const custo = Comissao.custoSemanal(s);
        const delegs = Object.keys(DELEG_CM).map(k => {
            const D = DELEG_CM[k], on = !!cm.deleg[k];
            return `<button class="atividade ${on ? 'ativa' : ''}" data-acao="cmDeleg" data-k="${k}" ${aux ? '' : 'disabled'}>
                <span class="at-icone">${D.icone}</span><b>${D.nome}${on ? ' <small class="tag">delegado</small>' : ''}</b><small>${D.desc}</small></button>`;
        }).join('');
        const tr = cm.treino && cm.deleg.treino && aux && TREINOS_TIME[cm.treino.k];
        const ult = cm.ult;
        return `
        <div class="cartao">
            <div class="cartao-topo"><h3>🧑‍💼 Comissão técnica do ${U.esc(t.nome)}</h3><span>Custo: <b>${U.dinheiro(custo)}/sem.</b> · Caixa: <b class="${t.saldo < 0 ? 'vermelho' : 'verde'}">${U.dinheiro(t.saldo)}</b></span></div>
            <p class="cinza pequeno">Os salários saem do caixa do clube toda semana. Se você trocar de clube, o auxiliar vai junto; o resto da comissão fica.</p>
            <div class="grade-olh cm-grade">${ORDEM_CM.map(k => Comissao.cardMembro(s, k, cm.staff[k])).join('')}</div>
        </div>
        <div class="cartao">
            <div class="cartao-topo"><h3>🤝 Tarefas delegadas ao auxiliar</h3>${aux ? `<span class="pequeno">${U.esc(aux.nome)}: decisões <b>${QUALI_CM[aux.est]}</b></span>` : ''}</div>
            ${aux ? '<p class="cinza pequeno">Toque para ligar ou desligar. O que ele faz aparece num aviso rápido e no diário — nada de janelas no meio da semana.</p>'
                : '<p class="cinza pequeno">Contrate um auxiliar técnico para entregar estas tarefas a ele e avançar o tempo mais rápido.</p>'}
            <div class="cm-delegs">${delegs}</div>
            ${tr ? `<p class="pequeno">🏋️ Treino desta semana: <b>${tr.icone} ${tr.nome}</b> — ${U.esc(cm.treino.motivo)}</p>` : ''}
            ${aux && ult && ult.itens.length ? `<div class="cm-ult"><b>📋 Última semana (sem. ${ult.sem + 1}):</b> ${ult.itens.join(' · ')}</div>` : ''}
        </div>
        <div class="cartao">
            <div class="cartao-topo"><h3>📋 Profissionais disponíveis</h3><span class="cinza pequeno">a lista muda a cada ${TROCA_MERC_CM} semanas</span></div>
            <div class="sub-abas">${ORDEM_CM.map(k => `<button class="chip-btn ${k === papel ? 'ativo' : ''}" data-acao="cmPapel" data-p="${k}">${PAPEIS_CM[k].icone} ${PAPEIS_CM[k].nome}${cm.staff[k] ? ' ✔' : ''}</button>`).join('')}</div>
            <p class="cinza pequeno">${PAPEIS_CM[papel].desc} Clubes maiores atraem profissionais melhores.</p>
            <div class="grade-olh">${(cm.merc.lista[papel] || []).map(o => Comissao.cardCandidato(s, t, o)).join('')}</div>
        </div>`;
    },
};

// Os ganchos que rodam no meio da semana, das partidas e das telas de outros
// módulos nunca podem quebrar o jogo: um erro aqui vira só um aviso no console.
[['semana', undefined], ['fimSemana', undefined], ['posJogo', undefined], ['fatorLesao', 1], ['bonusAnalista', 0],
    ['responderCobranca', -1], ['responderBase', -1], ['decidirVinte', -1], ['htmlPreJogo', ''], ['htmlDica', ''], ['htmlPendencias', ''],
    ['painelElenco', ''], ['botaoSubstituto', ''], ['bannerMercado', '']].forEach(([k, padrao]) => {
    const fn = Comissao[k];
    Comissao[k] = function () {
        try {
            return fn.apply(Comissao, arguments);
        } catch (e) {
            console.warn('comissao.' + k, e);
            return padrao;
        }
    };
});

Object.assign(ACOES, {
    cmPapel(d) {
        Jogo.ui.cmPapel = d.p;
        if (Jogo.aba !== 'comissao') { Jogo.aba = 'comissao'; Jogo.atualizar(); return; }
        Jogo.manterRolagem = true;
        Jogo.atualizar();
    },
    async cmContratar(d) {
        const s = Jogo.s, t = Tecnico.time(s);
        if (!t) return;
        const cm = Comissao.estado(s);
        const lista = cm.merc.lista[d.p] || [];
        const i = lista.findIndex(o => o.id === +d.id);
        if (i < 0) return;
        const o = lista[i], P = PAPEIS_CM[o.papel];
        const atual = cm.staff[o.papel];
        const luvas = o.sal * LUVAS_CM, multa = atual ? atual.sal * MULTA_CM : 0;
        if (t.saldo < luvas + multa) return UI.toast('💸 O clube não tem caixa para as luvas.', 'erro');
        const ok = await UI.confirmar(`Contratar <b>${o.bnd} ${Comissao.nome(o)}</b> como ${P.icone} <b>${P.nome.toLowerCase()}</b> (${U.estrelas(o.est)})?<br>
            Luvas: <b>${U.dinheiro(luvas)}</b> · salário <b>${U.dinheiro(o.sal)}/semana</b>.${atual ? `<br>${Comissao.nome(atual)} sai e recebe <b>${U.dinheiro(multa)}</b> de multa.` : ''}`, '✍️ Contratar');
        if (!ok || Jogo.s !== s || lista.indexOf(o) < 0) return;
        t.saldo -= luvas + multa;
        lista.splice(lista.indexOf(o), 1);
        if (atual) Vida.log(s, `👋 ${atual.nome} deixou a comissão técnica.`, '');
        o.desde = Mot.agora(s);
        o.ano = s.ano;
        cm.staff[o.papel] = o;
        if (o.est >= 5) Conquistas.contar(s, 'staff5');
        Vida.log(s, `${P.icone} Você contratou ${o.nome} (${P.nome.toLowerCase()}, ${o.est} estrelas).`, 'bom');
        if (o.papel === 'aux' && !cm.delegIni) {
            // primeira vez: ele já assume tudo (dá para desligar cada tarefa)
            cm.delegIni = true;
            Object.keys(DELEG_CM).forEach(k => { cm.deleg[k] = true; });
            UI.toast(`🧑‍💼 ${U.esc(o.nome)} já assume treino, vestiário, mensagens, renovações e base. Desligue o que quiser aqui na aba Comissão.`);
        } else UI.toast(`${P.icone} ${U.esc(o.nome)} é o novo ${P.nome.toLowerCase()}!`);
        Som.tocar('moeda');
        Jogo.manterRolagem = true;
        Jogo.atualizar();
    },
    async cmDemitir(d) {
        const s = Jogo.s, t = Tecnico.time(s);
        if (!t) return;
        const cm = Comissao.estado(s);
        const o = cm.staff[d.p];
        if (!o) return;
        const multa = o.sal * MULTA_CM;
        if (!(await UI.confirmar(`Demitir ${PAPEIS_CM[d.p].icone} <b>${Comissao.nome(o)}</b>? A multa é de ${U.dinheiro(multa)}.`, 'Demitir'))) return;
        if (Jogo.s !== s || cm.staff[d.p] !== o) return;
        t.saldo -= multa;
        cm.staff[d.p] = null;
        Vida.log(s, `👋 Você demitiu ${o.nome} (${PAPEIS_CM[d.p].nome.toLowerCase()}).`, '');
        Jogo.manterRolagem = true;
        Jogo.atualizar();
    },
    cmDeleg(d) {
        const s = Jogo.s;
        const cm = Comissao.estado(s);
        if (!cm.staff.aux || !DELEG_CM[d.k]) return;
        cm.deleg[d.k] = !cm.deleg[d.k];
        cm.delegIni = true;
        const D = DELEG_CM[d.k];
        UI.toast(cm.deleg[d.k] ? `${D.icone} ${D.nome}: agora é com o auxiliar.` : `${D.icone} ${D.nome}: de volta com você.`);
        Jogo.manterRolagem = true;
        Jogo.atualizar();
    },
    // links da lista de pendências
    cmIr(d) {
        const s = Jogo.s, t = s && Tecnico.time(s);
        if (!t) return;
        if (d.lote) Comissao.abrirLote(s, t);
        Jogo.aba = d.aba;
        Jogo.atualizar();
        const c = document.querySelector('.conteudo');
        const alvo = d.rolar ? document.querySelector(d.rolar) : null;
        if (alvo && alvo.scrollIntoView) alvo.scrollIntoView({ behavior: 'smooth', block: 'center' });
        else if (c) c.scrollTop = 0;
    },
    cmLote() {
        const s = Jogo.s, t = Tecnico.time(s);
        if (!t) return;
        Comissao.abrirLote(s, t);
        Jogo.manterRolagem = true;
        Jogo.atualizar();
    },
    cmLoteFechar() { Jogo.ui.lote = false; Jogo.manterRolagem = true; Jogo.atualizar(); },
    cmLoteSel(d, el) {
        Jogo.ui.loteSel = Jogo.ui.loteSel || {};
        if (el.checked) Jogo.ui.loteSel[d.pid] = true; else delete Jogo.ui.loteSel[d.pid];
        Jogo.manterRolagem = true;
        Jogo.atualizar();
    },
    cmLoteTodos(d) {
        const s = Jogo.s, t = Tecnico.time(s);
        if (!t) return;
        Jogo.ui.loteSel = {};
        if (d.v === '1') for (const p of Comissao.elegiveisLote(s, t)) if (!Comissao.recusouHaPouco(s, p)) Jogo.ui.loteSel[p.id] = true;
        Jogo.manterRolagem = true;
        Jogo.atualizar();
    },
    cmLoteMais(d) { Jogo.ui.loteMais = d.v === '1'; Jogo.manterRolagem = true; Jogo.atualizar(); },
    cmLoteAnos(d, el) { Jogo.ui.loteAnos = el.value; Jogo.manterRolagem = true; Jogo.atualizar(); },
    async cmLoteRenovar() {
        await Comissao.renovarLote(Jogo.s);
        Jogo.manterRolagem = true;
        Jogo.atualizar();
    },
    cmSubstituto(d) {
        const s = Jogo.s, p = s && s.jog[+d.pid];
        if (!p) return;
        Jogo.ui.substituto = p.id;
        Jogo.ui.filtro = Comissao.filtroSubstituto(p);
        Jogo.aba = 'mercado';
        Jogo.atualizar();
        const c = document.querySelector('.conteudo');
        if (c) c.scrollTop = 0;
    },
    cmSubLimpar() { Jogo.ui.substituto = null; Jogo.manterRolagem = true; Jogo.atualizar(); },
});
