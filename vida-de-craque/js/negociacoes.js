'use strict';
// =====================================================================
//  CARREIRAS: NEGOCIAÇÕES MAIS RICAS (carreira de técnico)
//  🔁 Empréstimo: peça um jogador emprestado até o fim da temporada pagando
//     uma parte do salário (quanto mais você paga, mais fácil o clube dono
//     topar), ou empreste os seus com minutos garantidos (o outro clube paga
//     parte do salário e escala o jogador). Tudo volta no fim da temporada;
//     garoto que jogou bastante volta mais experiente.
//  🔄 Troca: ofereça um jogador seu (e dinheiro, se quiser) pelo alvo.
//  📈 Percentual de revenda: ao vender, aceite um pouco menos e fique com
//     uma parte da próxima venda. Quando a IA vender o jogador, o clube
//     recebe a parte e sai uma notícia.
//  A interface fica dentro do fluxo de propostas (Tecnico.proposta,
//  propostaRecebida e os botões do jogador), no Elenco e em Finanças.
//
//  Estado (criado na primeira vez que precisa: saves antigos abrem normal)
//    p.empr    = { tipo: 'in' | 'out', de, deNome, para, paraNome, ano, sem,
//                  sal (salário cheio), parte (fração paga por quem recebe),
//                  j, g, ns (números do jogador quando o empréstimo começou) }
//    p.revenda = { tid, nome, pct, ano }   cláusula de revenda (clube que recebe)
//    s.car.neg = { hist: [empréstimos encerrados], rec: [revendas recebidas] }
//  Ganchos: Tecnico (semana, proposta, propostaRecebida, acoesJogador,
//  acaoJogador, elenco, financas, antesFimTemporada), Mundo.transferir e
//  Mundo.transferenciasIA, Clube (último dia da janela), Comissao
//  (pendências, renovações e resultado semanal).
// =====================================================================

const NEG = {
    maxIn: 4,              // emprestados ao seu clube ao mesmo tempo
    maxOut: 6,             // seus jogadores emprestados ao mesmo tempo
    partes: [0.5, 0.75, 1],
    garantia: 8,           // bônus na escalação do clube que pegou o seu jogador emprestado
    recall: 6,             // jogos seguidos sem entrar: o clube dono pede o emprestado de volta
};

const Negociacoes = {
    // -----------------------------------------------------------------
    //  Básico
    // -----------------------------------------------------------------
    avisar(txt) {
        if (typeof Ritmo !== 'undefined' && Ritmo.rodando) return;
        UI.toast(txt);
    },

    estado(s) {
        const c = s.car;
        if (!c.neg) c.neg = { hist: [], rec: [] };
        c.neg.hist = c.neg.hist || [];
        c.neg.rec = c.neg.rec || [];
        return c.neg;
    },

    pct: k => Math.round(k * 100),

    // jogadores emprestados ao clube (tipo 'in') ou pelo clube (tipo 'out')
    lista(s, tid, tipo) {
        const r = [];
        for (const id in s.jog) {
            const p = s.jog[id], e = p.empr;
            if (!e || e.tipo !== tipo) continue;
            if (tipo === 'in' ? e.para === tid : e.de === tid) r.push(p);
        }
        return r.sort((a, b) => b.ovr - a.ovr);
    },

    emprestadoAoMeu(s, p) {
        const t = Tecnico.time(s);
        return !!(t && p && p.empr && p.empr.tipo === 'in' && p.empr.para === t.id && p.tid === t.id);
    },

    rankNoDono(s, p, dono) {
        return Mundo.elenco(s, dono).sort((a, b) => b.ovr - a.ovr).indexOf(p);
    },

    // tira o jogador de um clube e põe em outro sem transferência (o vínculo continua com o dono)
    mover(s, p, de, para) {
        if (de) {
            de.elenco = de.elenco.filter(id => id !== p.id);
            if (de.tit) de.tit = de.tit.map(id => (id === p.id ? null : id));
        }
        if (para.elenco.indexOf(p.id) < 0) para.elenco.push(p.id);
        p.tid = para.id;
        if (s.car && s.car.capitao === p.id) s.car.capitao = null;
        if (s.car && s.car.venda) s.car.venda = s.car.venda.filter(id => id !== p.id);
    },

    novoEmprestimo(s, p, tipo, de, para, parte) {
        p.empr = { tipo, de: de.id, deNome: de.nome, para: para.id, paraNome: para.nome, ano: s.ano, sem: s.semana, sal: p.sal, parte, j: p.j, g: p.g, ns: p.ns };
    },

    // -----------------------------------------------------------------
    //  🔁 Pedir emprestado (o jogador vem para o seu clube)
    // -----------------------------------------------------------------
    chanceEmprestimo(s, p, dono, t, parte) {
        const rank = Negociacoes.rankNoDono(s, p, dono);
        if (rank >= 0 && rank < 5) return 0;   // titular absoluto não sai
        let c = rank >= 16 || rank < 0 ? 0.9 : rank >= 11 ? 0.7 : 0.42;
        if (p.idade <= 22) c += 0.1;
        if (dono.elenco.length <= 20) c *= 0.5;
        c *= parte >= 1 ? 1 : parte >= 0.75 ? 0.78 : 0.55;
        if (p.ovr - t.rep > 8) c *= 0.5;       // ele acha o seu clube pequeno
        return U.clamp(c, 0, 0.95);
    },

    impedeEntrada(s, p, t) {
        if (Negociacoes.lista(s, t.id, 'in').length >= NEG.maxIn) return `O seu clube já tem ${NEG.maxIn} emprestados (o máximo). Devolva alguém antes.`;
        if (t.elenco.length >= 34) return 'Elenco cheio: não cabe mais ninguém.';
        if (p.les > 3) return `${U.esc(p.nome)} está machucado (${p.les} semanas). Ninguém empresta jogador no departamento médico.`;
        return '';
    },

    async pedirEmprestimo(s, p, info) {
        const t = Tecnico.time(s), dono = info.dono;
        const motivo = Negociacoes.impedeEntrada(s, p, t);
        if (motivo) return UI.aviso('Empréstimo', motivo, '🔁');
        const ch = NEG.partes.map(k => Negociacoes.chanceEmprestimo(s, p, dono, t, k));
        const rank = Negociacoes.rankNoDono(s, p, dono);
        if (!ch.some(c => c > 0)) return UI.aviso('Sem empréstimo', `${U.esc(p.nome)} é titular absoluto no ${U.esc(dono.nome)}. Eles não emprestam de jeito nenhum — só vendem.`, '🙅');
        const papel = rank < 11 ? 'titular' : rank < 16 ? 'reserva' : 'quase não joga';
        const rot = c => c >= 0.7 ? '<span class="verde">chance alta</span>' : c >= 0.4 ? '<span class="amarelo">chance média</span>' : '<span class="vermelho">chance baixa</span>';
        const r = await UI.modal({
            titulo: `<span class="modal-icone">🔁</span>Pedir ${U.esc(p.nome)} emprestado`,
            classe: 'modal-evento neg-modal',
            html: `<p class="texto-evento">Ele é <b>${papel}</b> no ${U.esc(dono.nome)}. O empréstimo vai <b>até o fim da temporada</b> e depois ele volta para lá. Não tem taxa: você paga só uma parte do salário (${U.dinheiro(p.sal)}/ano) — quanto mais você pagar, mais fácil o ${U.esc(dono.nome)} topar.</p>`,
            botoes: NEG.partes.map((k, i) => ({ txt: `<span class="neg-bt so-texto"><b>Pagar ${Negociacoes.pct(k)}% do salário</b><small>${U.dinheiro(p.sal * k)}/ano · ${ch[i] > 0 ? rot(ch[i]) : '<span class="vermelho">sem chance</span>'}</small></span>`, valor: i, classe: 'btn-opcao', desativado: ch[i] <= 0 }))
                .concat([{ txt: 'Cancelar', valor: null, classe: 'btn-fantasma' }]),
        });
        if (typeof r !== 'number' || !NEG.partes[r]) return;
        const parte = NEG.partes[r];
        if (!U.chance(ch[r])) {
            s.car.recusas[`${p.id}`] = s.ano * 100 + s.semana - 2;
            Vida.log(s, `🔁 O ${dono.nome} recusou emprestar ${p.nome}.`, '');
            return UI.aviso('Empréstimo recusado', `O ${U.esc(dono.nome)} prefere manter ${U.esc(p.nome)} no elenco. ${parte < 1 ? 'Talvez pagando uma parte maior do salário...' : ''}`, '❌');
        }
        Negociacoes.trazerEmprestado(s, p, dono, t, parte);
        await UI.aviso('Empréstimo fechado!', `${U.esc(p.nome)} chega emprestado pelo ${U.esc(dono.nome)} até o fim da temporada. O ${U.esc(t.nome)} paga ${Negociacoes.pct(parte)}% do salário (${U.dinheiro(p.sal)}/ano).`, '🔁');
    },

    trazerEmprestado(s, p, dono, t, parte) {
        Negociacoes.novoEmprestimo(s, p, 'in', dono, t, parte);
        p.sal = U.redondo(p.empr.sal * parte);
        p.sj = 0;   // a conta dos jogos sem entrar recomeça no clube novo
        Negociacoes.mover(s, p, dono, t);
        Conquistas.contar(s, 'emprestimosTec');
        Mundo.noticia(s, `🔁 ${t.nome} acerta o empréstimo de ${p.nome}, do ${dono.nome}, até o fim da temporada.`, 'transfer');
        Vida.log(s, `🔁 ${p.nome} (${p.pos}, OVR ${p.ovr}) chega emprestado pelo ${dono.nome}. Você paga ${Negociacoes.pct(parte)}% do salário.`, 'bom');
    },

    // -----------------------------------------------------------------
    //  🔁 Emprestar um jogador seu (minutos garantidos)
    // -----------------------------------------------------------------
    impedeSaida(s, p, t) {
        if (!Mundo.emJanela(s)) return 'Empréstimos só com a janela de transferências aberta (semanas 1–6 e 22–26).';
        if (p.empr) return `${U.esc(p.nome)} já está emprestado.`;
        if (Negociacoes.lista(s, t.id, 'out').length >= NEG.maxOut) return `Você já emprestou ${NEG.maxOut} jogadores (o máximo).`;
        if (t.elenco.length <= 18) return 'Elenco curto demais: com menos de 18 jogadores o time não fecha os jogos.';
        if (p.contr < 2) return `O contrato de ${U.esc(p.nome)} acaba nesta temporada. Renove antes de emprestar (senão ele volta e já sai de graça).`;
        if (p.les > 2) return `${U.esc(p.nome)} está machucado. Ninguém pega emprestado jogador no departamento médico.`;
        if (p.idade > 33) return `Com ${p.idade} anos, ninguém quer ${U.esc(p.nome)} emprestado.`;
        return '';
    },

    // clubes onde ele seria titular. parte = quanto do salário eles pagam
    destinos(s, p, t, n) {
        const cands = s.times.filter(x => x.liga && !x.selecao && x.id !== t.id && x.elenco.length < 30 && x.rep <= p.ovr + 1 && x.rep >= p.ovr - 12 && Mundo.liga(s, x.liga));
        const escolhidos = [];
        let lista = cands;
        while (escolhidos.length < n && lista.length) {
            const x = U.pesado(lista, c => (c.pais === t.pais ? 3 : 1) * (1 + Math.min(4, Clube.carencia(s, c)(p.pos)) * 0.4) / (1 + Math.abs(c.rep - (p.ovr - 4)) * 0.15));
            escolhidos.push(x);
            lista = lista.filter(c => c !== x);
        }
        return escolhidos.map(x => ({ t: x, parte: p.ovr >= x.rep + 5 ? 1 : p.ovr >= x.rep + 1 ? 0.75 : 0.5 })).sort((a, b) => b.t.rep - a.t.rep);
    },

    async emprestarJogador(s, p) {
        const t = Tecnico.time(s);
        if (!t || p.tid !== t.id) return;
        const motivo = Negociacoes.impedeSaida(s, p, t);
        if (motivo) return UI.aviso('Empréstimo', motivo, '🔁');
        const ops = Negociacoes.destinos(s, p, t, 3);
        if (!ops.length) return UI.aviso('Ninguém se interessou', `Nenhum clube em que ${U.esc(p.nome)} seria titular quer ele emprestado agora.`, '🔁');
        const desc = o => `<span class="neg-bt">${UI.escudo(o.t)}<span><b>${U.esc(o.t.nome)}</b><small>${U.esc(Mundo.liga(s, o.t.liga).curto)} · ${Mundo.posicaoNaLiga(s, o.t.id)}º · paga ${Negociacoes.pct(o.parte)}% do salário</small></span></span>`;
        const r = await UI.modal({
            titulo: `<span class="modal-icone">🔁</span>Emprestar ${U.esc(p.nome)}`,
            classe: 'modal-evento neg-modal',
            html: `<p class="texto-evento">Até o fim da temporada, com <b>minutos garantidos</b> (ele joga de titular). O clube que pega paga uma parte do salário (${U.dinheiro(p.sal)}/ano) e o ${U.esc(t.nome)} paga o resto. No fim do ano ele volta${p.idade <= 23 ? ' — e garoto que joga bastante volta mais experiente' : ''}.</p>`,
            botoes: ops.map((o, i) => ({ txt: desc(o), valor: i, classe: 'btn-opcao' })).concat([{ txt: 'Cancelar', valor: null, classe: 'btn-fantasma' }]),
        });
        if (typeof r !== 'number' || !ops[r]) return;
        Negociacoes.emprestarPara(s, p, t, ops[r].t, ops[r].parte);
        UI.toast(`🔁 ${U.esc(p.nome)} vai jogar no ${U.esc(ops[r].t.nome)} até o fim da temporada.`);
    },

    emprestarPara(s, p, t, dest, parte) {
        Negociacoes.novoEmprestimo(s, p, 'out', t, dest, parte);
        Negociacoes.mover(s, p, t, dest);
        p.sj = 0;
        p.bonusEscala = Math.max(p.bonusEscala || 0, NEG.garantia);
        p.bonusEscalaSem = 99;
        Conquistas.contar(s, 'emprestimosTec');
        Mundo.noticia(s, `🔁 ${t.nome} empresta ${p.nome} ao ${dest.nome} até o fim da temporada.`, 'transfer');
        Vida.log(s, `🔁 Você emprestou ${p.nome} ao ${dest.nome} com minutos garantidos (eles pagam ${Negociacoes.pct(parte)}% do salário).`, '');
    },

    // -----------------------------------------------------------------
    //  Fim do empréstimo (volta ao clube dono)
    // -----------------------------------------------------------------
    devolver(s, p, motivo) {
        const e = p.empr;
        if (!e) return null;
        const dono = s.times[e.de];
        const atual = p.tid >= 0 ? s.times[p.tid] : null;
        const mesmoAno = e.ano === s.ano;
        const j = mesmoAno ? Math.max(0, p.j - (e.j || 0)) : 0, g = mesmoAno ? Math.max(0, p.g - (e.g || 0)) : 0;
        const ns = mesmoAno ? Math.max(0, p.ns - (e.ns || 0)) : 0;
        const nota = j ? ns / j : 0;
        delete p.empr;
        if (e.tipo === 'in') p.sal = e.sal;
        if (e.tipo === 'out' && (p.bonusEscala || 0) > 0) { p.bonusEscala = 0; p.bonusEscalaSem = 0; }
        p.sj = 0;
        // clima (js/clube.js): o fim do empréstimo não é venda de ídolo nem reforço novo para a torcida
        const q = s.car && s.car.clima;
        if (q && q.tid === e.para && q.idol) q.idol = q.idol.filter(id => id !== p.id);
        if (q && q.tid === e.de && q.el0 && q.el0.indexOf(p.id) < 0) q.el0.push(p.id);
        if (dono && dono.liga !== undefined && !dono.selecao) Negociacoes.mover(s, p, atual && atual !== dono ? atual : null, dono);
        else {
            if (atual) { atual.elenco = atual.elenco.filter(id => id !== p.id); if (atual.tit) atual.tit = atual.tit.map(id => (id === p.id ? null : id)); }
            p.tid = -1;
            if (s.livres.indexOf(p.id) < 0) s.livres.push(p.id);
        }
        // quem foi emprestado por você: jogar bastante faz bem (principalmente aos garotos)
        let efeito = '';
        if (e.tipo === 'out') {
            if (j >= 12 && p.idade <= 23) {
                const ganho = nota >= 7 ? 2 : 1;
                p.ovr = Math.min(99, p.ovr + ganho);
                p.pot = Math.max(p.pot, p.ovr);
                Mot.mudar(p, 6);
                Conquistas.contar(s, 'vitrines');
                efeito = `voltou mais experiente (+${ganho} OVR)`;
            } else if (j >= 8) { Mot.mudar(p, 3); efeito = 'voltou com ritmo de jogo'; }
            else { Mot.mudar(p, -3); efeito = 'quase não jogou'; }
        }
        const reg = { ano: e.ano, tipo: e.tipo, pid: p.id, nome: p.nome, pos: p.pos, de: e.deNome, para: e.paraNome, j, g, nota: Math.round(nota * 100) / 100, motivo: motivo || '', efeito };
        if (s.modo === 'tecnico' && s.car) {
            const neg = Negociacoes.estado(s);
            neg.hist.unshift(reg);
            if (neg.hist.length > 12) neg.hist.length = 12;
        }
        Mundo.noticia(s, `🔁 ${p.nome} volta ao ${e.deNome} depois do empréstimo ao ${e.paraNome}.`, 'transfer');
        return reg;
    },

    textoVolta(r) {
        return `${U.esc(r.nome)} ${r.tipo === 'out' ? `voltou do ${U.esc(r.para)}` : `voltou ao ${U.esc(r.de)}`} (${r.j} jogo${r.j === 1 ? '' : 's'}${r.g ? `, ${r.g} gol${r.g > 1 ? 's' : ''}` : ''}${r.efeito ? ` · ${r.efeito}` : ''})`;
    },

    // segurança: alguém transferiu um emprestado (não deveria acontecer)
    limparEmprestimo(s, p) {
        const e = p.empr;
        if (!e) return;
        if (e.tipo === 'in') p.sal = e.sal;
        if (e.tipo === 'out' && (p.bonusEscala || 0) > 0) { p.bonusEscala = 0; p.bonusEscalaSem = 0; }
        delete p.empr;
    },

    // -----------------------------------------------------------------
    //  🔄 Troca
    // -----------------------------------------------------------------
    // quanto o clube dono acha que o seu jogador vale
    avaliarTroca(s, meu, dono) {
        let f = 0.85;
        const falta = Clube.carencia(s, dono)(meu.pos);
        if (falta > 0) f += Math.min(0.2, falta * 0.03);
        if (meu.ovr >= dono.rep) f += 0.08;
        if (meu.idade >= 31) f -= 0.2; else if (meu.idade <= 23) f += 0.05;
        if (meu.contr <= 1) f -= 0.1;
        return U.redondo(Mundo.valor(meu) * f);
    },

    // { estado: 'ok' | 'mais' | 'nao' | 'recusa', falta }
    respostaTroca(s, alvo, meu, dono, din, pedido) {
        if (meu.les > 2) return { estado: 'nao', txt: `${U.esc(meu.nome)} está machucado: o ${U.esc(dono.nome)} não quer.` };
        if (dono.rep + 10 < meu.ovr) return { estado: 'recusa', txt: `${U.esc(meu.nome)} não quer ir para um clube tão menor.` };
        const total = Negociacoes.avaliarTroca(s, meu, dono) + din;
        if (total >= pedido * 0.97) return { estado: 'ok' };
        if (total >= pedido * 0.8) {
            const falta = Math.max(5e4, Math.ceil((pedido * 0.97 - total) / 5e4) * 5e4);
            return { estado: 'mais', falta };
        }
        return { estado: 'nao', txt: `O ${U.esc(dono.nome)} achou a proposta muito baixa.` };
    },

    estimativaTroca(s, alvo, meu, dono, din, pedido) {
        const aval = Negociacoes.avaliarTroca(s, meu, dono);
        const total = aval + din, pc = Math.round(total / Math.max(1, pedido) * 100);
        const st = total >= pedido * 0.97 ? '<b class="verde">✅ eles devem aceitar</b>' : total >= pedido * 0.8 ? '<b class="amarelo">🤔 vão pedir um pouco mais</b>' : '<b class="vermelho">❌ ainda longe</b>';
        let aviso = dono.rep + 10 < meu.ovr ? `<br>⚠️ ${U.esc(meu.nome)} acha o ${U.esc(dono.nome)} pequeno e não quer ir.` : '';
        if (total > pedido * 1.5) aviso += `<br>⚠️ Você está oferecendo bem mais do que o ${U.esc(dono.nome)} pede: eles aceitam, mas não devolvem a diferença.`;
        return `💡 O ${U.esc(dono.nome)} avalia ${U.esc(meu.nome)} em ~<b>${U.dinheiro(aval)}</b>${din ? ` + ${U.dinheiro(din)}` : ''} = ${U.dinheiro(total)} de ${U.dinheiro(pedido)} pedidos (${pc}%): ${st}${aviso}`;
    },

    async proporTroca(s, alvo, info) {
        const t = Tecnico.time(s), dono = info.dono;
        const meus = Mundo.elenco(s, t).filter(x => !x.empr && x.les <= 2).sort((a, b) => Mundo.valor(b) - Mundo.valor(a));
        if (!meus.length) return UI.aviso('Troca', 'Você não tem ninguém disponível para oferecer.', '🔄');
        const semTaxa = Desafios.semTaxa(s);
        let escolha = meus[0], din = 0;
        const promessa = UI.modal({
            titulo: `<span class="modal-icone">🔄</span>Troca por ${U.esc(alvo.nome)}`,
            classe: 'neg-modal',
            html: `<p>O ${U.esc(dono.nome)} pede <b>${U.dinheiro(info.pedido)}</b> por ${U.esc(alvo.nome)} (${alvo.pos}, ${alvo.idade} anos, OVR ${alvo.ovr}). Ofereça um jogador seu${semTaxa ? ' — no desafio Orçamento zero, sem dinheiro' : ' e, se precisar, um dinheiro a mais'}:</p>
                <label class="campo">Jogador que vai<select id="neg-meu" class="sel">${meus.map(x => `<option value="${x.id}">${x.pos} · ${U.esc(x.nome)} (${x.idade} anos, OVR ${x.ovr}) — ${U.dinheiro(Mundo.valor(x))}</option>`).join('')}</select></label>
                <label class="campo">Dinheiro a mais (€)<input id="neg-din" class="inp" type="number" min="0" step="50000" value="0" ${semTaxa ? 'disabled' : ''}></label>
                <p class="neg-estim pequeno">${Negociacoes.estimativaTroca(s, alvo, escolha, dono, 0, info.pedido)}</p>
                <p class="cinza pequeno">${U.esc(alvo.nome)} chega com salário de ${U.dinheiro(info.salario)}/ano. O seu jogador assina com o ${U.esc(dono.nome)}.</p>`,
            botoes: [{
                txt: '🔄 Propor troca', valor: 'ok', antes: f => {
                    const sel = f.querySelector('#neg-meu'), inp = f.querySelector('#neg-din');
                    if (sel && s.jog[+sel.value]) escolha = s.jog[+sel.value];
                    din = semTaxa || !inp ? 0 : Math.max(0, Math.round(+inp.value || 0));
                },
            }, { txt: 'Cancelar', valor: false, classe: 'btn-fantasma' }],
        });
        const raiz = typeof document !== 'undefined' && document.querySelector ? document.querySelector('#modais .modal-fundo:last-child') : null;
        if (raiz && raiz.querySelector) {
            const atualizar = () => {
                const sel = raiz.querySelector('#neg-meu'), inp = raiz.querySelector('#neg-din'), est = raiz.querySelector('.neg-estim');
                const m = sel && s.jog[+sel.value];
                if (m && est) est.innerHTML = Negociacoes.estimativaTroca(s, alvo, m, dono, semTaxa || !inp ? 0 : Math.max(0, +inp.value || 0), info.pedido);
            };
            raiz.addEventListener('change', atualizar);
            raiz.addEventListener('input', atualizar);
        }
        const r = await promessa;
        if (r !== 'ok' || !escolha) return;
        if (din > t.saldo) return UI.aviso('Sem dinheiro', 'O clube não tem caixa para essa parte em dinheiro.', '💸');
        let res = Negociacoes.respostaTroca(s, alvo, escolha, dono, din, info.pedido);
        if (res.estado === 'mais') {
            if (semTaxa) return UI.aviso('Quase!', `O ${U.esc(dono.nome)} toparia com mais ${U.dinheiro(res.falta)} — mas no desafio Orçamento zero não dá para pôr dinheiro. Tente outro jogador.`, '🤏');
            const i = await UI.perguntar('Contraproposta', `O ${U.esc(dono.nome)} topa a troca se você colocar mais <b>${U.dinheiro(res.falta)}</b> (total em dinheiro: ${U.dinheiro(din + res.falta)}).`, [`✅ Fechar com ${U.dinheiro(din + res.falta)}`, 'Desistir'], '💬');
            if (i !== 0) return;
            din += res.falta;
            if (din > t.saldo) return UI.aviso('Sem dinheiro', 'O clube não tem caixa para isso.', '💸');
            res = { estado: 'ok' };
        }
        if (res.estado !== 'ok') {
            s.car.recusas[`${alvo.id}`] = s.ano * 100 + s.semana - 2;
            return UI.aviso('Troca recusada', res.txt, '❌');
        }
        Negociacoes.executarTroca(s, alvo, escolha, dono, t, din, info.salario);
        await UI.aviso('Troca fechada!', `${U.esc(alvo.nome)} é do ${U.esc(t.nome)}! ${U.esc(escolha.nome)} foi para o ${U.esc(dono.nome)}${din ? ` e você pagou ${U.dinheiro(din)}` : ''}. Contrato até ${s.ano + 3}.`, '🔄');
    },

    executarTroca(s, alvo, meu, dono, t, din, salario) {
        Mundo.transferir(s, alvo, t, din);
        alvo.sal = salario || alvo.sal;
        alvo.contr = 3 + 1;
        Mundo.transferir(s, meu, dono, 0);
        s.car.venda = s.car.venda.filter(id => id !== meu.id);
        Conquistas.contar(s, 'trocas');
        Mundo.noticia(s, `🔄 Troca: ${alvo.nome} deixa o ${dono.nome} e chega ao ${t.nome}; ${meu.nome} faz o caminho inverso${din ? ` (+${U.dinheiro(din)})` : ''}.`, 'transfer');
        Vida.log(s, `🔄 Troca fechada: ${alvo.nome} (${alvo.pos}, OVR ${alvo.ovr}) chega e ${meu.nome} vai para o ${dono.nome}${din ? ` (+${U.dinheiro(din)})` : ''}.`, 'bom');
    },

    // -----------------------------------------------------------------
    //  📈 Percentual de revenda
    // -----------------------------------------------------------------
    // opção extra na proposta recebida (gancho em Tecnico.propostaRecebida)
    opcaoRevenda(s, p, oferta) {
        if (!p || p.idade > 27 || oferta < 1e5) return null;
        const pct = p.idade <= 21 ? 25 : p.idade <= 24 ? 20 : 15;
        const preco = U.redondo(oferta * (1 - pct / 100 * 0.6));
        return { pct, preco, txt: `📈 Aceitar ${U.dinheiro(preco)} e ficar com ${pct}% da próxima venda` };
    },

    registrarRevenda(s, p, t, comprador, pct) {
        p.revenda = { tid: t.id, nome: t.nome, pct, ano: s.ano };
        Vida.log(s, `📈 ${p.nome} foi vendido ao ${comprador.nome} com ${pct}% de revenda para o ${t.nome}.`, '');
    },

    // gancho em Mundo.transferir (antes do dinheiro mudar de mãos)
    aoTransferir(s, p, origem, destino, preco) {
        if (p.empr) Negociacoes.limparEmprestimo(s, p);
        const c = p.revenda;
        if (!c) return;
        if (!origem || !destino || destino.id === c.tid || origem.id === c.tid || !(preco > 0)) {
            // saiu de graça ou voltou ao clube da cláusula: a cláusula acaba sem pagamento
            delete p.revenda;
            return;
        }
        const v = U.redondo(preco * c.pct / 100);
        const dono = s.times[c.tid];
        delete p.revenda;
        if (!dono || !v) return;
        origem.saldo -= v;
        dono.saldo += v;
        Mundo.noticia(s, `📈 Percentual de revenda: o ${dono.nome} embolsa ${U.dinheiro(v)} (${c.pct}%) com a venda de ${p.nome} ao ${destino.nome}.`, 'transfer');
        if (s.modo === 'tecnico' && s.car && s.car.tid === c.tid) {
            const neg = Negociacoes.estado(s);
            neg.rec.unshift({ ano: s.ano, sem: s.semana, nome: p.nome, de: origem.nome, para: destino.nome, valor: v, pct: c.pct });
            if (neg.rec.length > 10) neg.rec.length = 10;
            Conquistas.contar(s, 'revendas');
            Conquistas.maximo(s, 'maiorRevenda', v);
            Vida.log(s, `📈 Dinheiro que volta: ${p.nome} foi vendido pelo ${origem.nome} ao ${destino.nome} por ${U.dinheiro(preco)} e o ${dono.nome} recebeu ${U.dinheiro(v)} (${c.pct}%).`, 'bom');
            Negociacoes.avisar(`📈 Percentual de revenda: +${U.dinheiro(v)} pela venda de ${U.esc(p.nome)}!`);
        }
    },

    // -----------------------------------------------------------------
    //  Semana e fim de temporada
    // -----------------------------------------------------------------
    // os empréstimos que não são do seu clube atual (você saiu ou foi demitido) se desfazem
    desfazerAntigos(s) {
        const voltaram = [];
        for (const id in s.jog) {
            const p = s.jog[id], e = p.empr;
            if (!e || (e.tipo === 'out' ? e.de : e.para) === s.car.tid) continue;
            const r = Negociacoes.devolver(s, p, 'você saiu do clube');
            if (r) voltaram.push(r);
        }
        if (voltaram.length) Vida.log(s, `🔁 Com a sua saída, os empréstimos do clube foram desfeitos: ${voltaram.map(Negociacoes.textoVolta).join(' · ')}.`, '');
    },

    // gancho no começo de Tecnico.semana
    semana(s) {
        Negociacoes.desfazerAntigos(s);
        const t = Tecnico.time(s);
        if (!t) return;
        let custo = 0;
        for (const id in s.jog) {
            const p = s.jog[id], e = p.empr;
            if (!e) continue;
            if (e.tipo === 'out' && e.de === t.id) {
                custo += p.sal * (1 - e.parte) / 52;
                if (p.tid === e.para) { p.bonusEscala = Math.max(p.bonusEscala || 0, NEG.garantia); p.bonusEscalaSem = 99; }
            } else if (e.tipo === 'in' && e.para === t.id && p.tid === t.id && (p.sj || 0) >= NEG.recall && Escalacao.disponivel(p)) {
                // minutos são parte do acordo: sem jogar, o clube dono pede de volta
                const r = Negociacoes.devolver(s, p, 'o clube dono pediu de volta');
                if (r) {
                    const txt = `🔁 O ${e.deNome} pediu ${p.nome} de volta: ${p.sj} jogos sem entrar em campo.`;
                    Vida.log(s, txt, 'ruim');
                    Negociacoes.avisar(txt);
                }
            }
        }
        if (custo) t.saldo -= Math.round(custo);
    },

    // sua parte dos salários de quem você emprestou (por semana)
    custoSemanal(s) {
        const t = s.car && s.car.tid >= 0 ? s.times[s.car.tid] : null;
        if (!t) return 0;
        return U.soma(Negociacoes.lista(s, t.id, 'out'), p => p.sal * (1 - p.empr.parte) / 52);
    },

    // fim da temporada, antes da virada do ano (gancho em Tecnico.antesFimTemporada):
    // todo mundo volta antes dos contratos andarem
    fimTemporada(s, t) {
        const voltaram = [];
        for (const id in s.jog) {
            const p = s.jog[id];
            if (!p.empr) continue;
            const r = Negociacoes.devolver(s, p, 'fim do empréstimo');
            if (r) voltaram.push(r);
        }
        if (voltaram.length) {
            const txt = `🔁 Fim dos empréstimos: ${voltaram.map(Negociacoes.textoVolta).join(' · ')}.`;
            Vida.log(s, txt, '');
            Negociacoes.avisar(`🔁 ${voltaram.length} empréstimo${voltaram.length > 1 ? 's terminaram' : ' terminou'}: veja no diário.`);
        }
    },

    // -----------------------------------------------------------------
    //  Fluxo de propostas (ganchos em Tecnico.proposta / acoesJogador)
    // -----------------------------------------------------------------
    // antes da proposta: emprestado não está à venda; regras do desafio. true = parou aqui
    async bloqueioProposta(s, p, t) {
        const e = p.empr;
        if (e) {
            if (e.tipo === 'out' && e.de === t.id) {
                const nums = e.ano === s.ano ? ` (${Math.max(0, p.j - e.j)} jogos, ${Math.max(0, p.g - e.g)} gols)` : '';
                if (Mundo.emJanela(s)) {
                    const i = await UI.perguntar('Ele é seu!', `${U.esc(p.nome)} está emprestado ao ${U.esc(e.paraNome)} até o fim da temporada${nums}. Quer chamar de volta agora? A janela está aberta.`, ['↩️ Chamar de volta', 'Deixar lá'], '🔁');
                    if (i === 0) {
                        const r = Negociacoes.devolver(s, p, 'você chamou de volta');
                        if (r) { Vida.log(s, `↩️ Você chamou ${p.nome} de volta do ${e.paraNome}.`, ''); UI.toast(`↩️ ${U.esc(p.nome)} voltou ao elenco.`); }
                        Jogo.manterRolagem = true;
                        Jogo.atualizar();
                    }
                } else await UI.aviso('Ele é seu!', `${U.esc(p.nome)} está emprestado ao ${U.esc(e.paraNome)}${nums} e volta no fim da temporada.`, '🔁');
                return true;
            }
            await UI.aviso('Emprestado', `${U.esc(p.nome)} está emprestado ao ${U.esc(e.paraNome)} até o fim da temporada. Depois disso, fale com o ${U.esc(e.deNome)}.`, '🔁');
            return true;
        }
        const msg = Desafios.bloqueioCompra(s, p, 0);
        if (msg) { await UI.aviso('Regra do desafio', msg, '🎯'); return true; }
        return false;
    },

    botoesProposta(s, p, dono) {
        if (!dono) return [];
        return [{ txt: '🔁 Pedir emprestado', valor: 'emp' }, { txt: '🔄 Propor troca', valor: 'troca' }];
    },

    htmlProposta(s, p, dono) {
        if (!dono) return '';
        return `<p class="cinza pequeno neg-dica">🔁 <b>Empréstimo</b>: ele joga no seu time até o fim da temporada e você paga só parte do salário. 🔄 <b>Troca</b>: ofereça um jogador seu (e dinheiro, se quiser).</p>
            ${Desafios.semTaxa(s) ? '<p class="pequeno vermelho">🎯 Desafio Orçamento zero: sem verba para taxas. Peça emprestado ou proponha uma troca sem dinheiro.</p>' : ''}`;
    },

    async negociar(s, p, tipo, info) {
        if (tipo === 'emp') await Negociacoes.pedirEmprestimo(s, p, info);
        else if (tipo === 'troca') await Negociacoes.proporTroca(s, p, info);
        Jogo.manterRolagem = true;
        Jogo.atualizar();
    },

    // botão "🔁 Emprestar" nos jogadores do seu elenco
    botaoEmprestar(s, p, t) {
        const jan = Mundo.emJanela(s);
        return { id: 'ngEmprestar', txt: jan ? '🔁 Emprestar' : '🔁 Emprestar (só na janela)', desativado: !jan };
    },

    // jogador emprestado ao seu clube: opções próprias
    acoesEmprestado(s, p, t) {
        if (!p.empr || p.empr.tipo !== 'in' || p.empr.para !== t.id) return null;
        return [
            { id: 'conversar', txt: '💬 Conversar', classe: 'btn-primario' },
            { id: 'capitao', txt: s.car.capitao === p.id ? '©️ Já é o capitão' : '©️ Fazer capitão', desativado: s.car.capitao === p.id },
            { id: 'ngDevolver', txt: `↩️ Devolver ao ${U.esc(p.empr.deNome)}` },
            { id: 'ngInfo', txt: `🔁 Emprestado até o fim de ${p.empr.ano} · você paga ${Negociacoes.pct(p.empr.parte)}%`, desativado: true, classe: 'btn-fantasma' },
        ];
    },

    async acaoJogador(s, p, id) {
        const t = Tecnico.time(s);
        if (!t) return;
        if (id === 'ngEmprestar') await Negociacoes.emprestarJogador(s, p);
        if (id === 'ngDevolver' && p.empr) {
            if (!(await UI.confirmar(`Devolver ${U.esc(p.nome)} ao ${U.esc(p.empr.deNome)} agora? O empréstimo acaba e ele não volta mais nesta temporada.`, 'Devolver'))) return;
            const de = p.empr.deNome;
            const r = Negociacoes.devolver(s, p, 'você devolveu');
            if (r) Vida.log(s, `↩️ Você devolveu ${p.nome} ao ${de}.`, '');
        }
        Jogo.manterRolagem = true;
        Jogo.atualizar();
    },

    // -----------------------------------------------------------------
    //  Telas
    // -----------------------------------------------------------------
    // selo ao lado do nome no Elenco
    marca(s, p) {
        if (!p.empr || p.empr.tipo !== 'in') return '';
        return ` <small class="tag neg-tag" title="Emprestado pelo ${U.esc(p.empr.deNome)} até o fim da temporada">🔁 emp.</small>`;
    },

    linhaEmp(s, p, tipo) {
        const e = p.empr;
        const mesmo = e.ano === s.ano;
        const j = mesmo ? Math.max(0, p.j - e.j) : 0, g = mesmo ? Math.max(0, p.g - e.g) : 0;
        const ns = mesmo ? Math.max(0, p.ns - e.ns) : 0;
        const clube = s.times[tipo === 'out' ? e.para : e.de];
        const quem = tipo === 'out' ? `no ${U.esc(e.paraNome)}` : `do ${U.esc(e.deNome)}`;
        const custo = tipo === 'out' ? `você paga ${100 - Negociacoes.pct(e.parte)}% do salário` : `você paga ${Negociacoes.pct(e.parte)}% do salário`;
        const bt = tipo === 'out'
            ? `<button class="btn btn-pequeno" data-acao="ngChamar" data-pid="${p.id}" ${Mundo.emJanela(s) ? '' : 'disabled title="Só com a janela aberta"'}>↩️ Chamar de volta</button>`
            : `<button class="btn btn-pequeno btn-fantasma" data-acao="verJogador" data-pid="${p.id}">Ver</button>`;
        return `<div class="neg-item">
            <span class="neg-item-info">${UI.pos(p.pos)} ${UI.jogador(p)} ${UI.ovr(p.ovr)} <small class="cinza">${p.idade} anos</small>
                <small>${clube ? UI.escudo(clube) : ''} ${quem} · ${j} jogo${j === 1 ? '' : 's'}${g ? `, ${g} gol${g > 1 ? 's' : ''}` : ''}${j ? `, nota ${(ns / j).toFixed(1).replace('.', ',')}` : ''} · ${custo}${tipo === 'in' && (p.sj || 0) >= 3 ? ` · <span class="vermelho">${p.sj} jogos sem entrar</span>` : ''}</small></span>
            ${bt}
        </div>`;
    },

    // aba Elenco (gancho em Tecnico.elenco)
    painelElenco(s, t) {
        const fora = Negociacoes.lista(s, t.id, 'out'), dentro = Negociacoes.lista(s, t.id, 'in');
        if (!fora.length && !dentro.length) return '';
        return `<div class="cartao neg-painel">
            <div class="cartao-topo"><h3>🔁 Empréstimos</h3><span class="cinza pequeno">Todos voltam no fim da temporada</span></div>
            ${fora.length ? `<h4>Seus jogadores emprestados (${fora.length}/${NEG.maxOut})</h4><div class="neg-lista">${fora.map(p => Negociacoes.linhaEmp(s, p, 'out')).join('')}</div>` : ''}
            ${dentro.length ? `<h4>Emprestados ao ${U.esc(t.nome)} (${dentro.length}/${NEG.maxIn})</h4><div class="neg-lista">${dentro.map(p => Negociacoes.linhaEmp(s, p, 'in')).join('')}</div>
                <p class="cinza pequeno">Minutos fazem parte do acordo: ${NEG.recall} jogos seguidos sem entrar e o clube dono pede o jogador de volta.</p>` : ''}
        </div>`;
    },

    // aba Finanças (gancho em Tecnico.financas)
    htmlFinancas(s, t) {
        const neg = Negociacoes.estado(s);
        const fora = Negociacoes.lista(s, t.id, 'out'), dentro = Negociacoes.lista(s, t.id, 'in');
        const custo = Negociacoes.custoSemanal(s);
        const economia = U.soma(dentro, p => (p.empr.sal - p.sal) / 52);
        const clausulas = [];
        for (const id in s.jog) { const p = s.jog[id]; if (p.revenda && p.revenda.tid === t.id) clausulas.push(p); }
        clausulas.sort((a, b) => Mundo.valor(b) - Mundo.valor(a));
        const vazio = !fora.length && !dentro.length && !clausulas.length && !neg.rec.length;
        return `<div class="cartao neg-financas">
            <div class="cartao-topo"><h3>🔁 Empréstimos e 📈 percentuais de revenda</h3></div>
            ${vazio ? '<p class="cinza pequeno">💡 No Mercado, clique em <b>Proposta</b> para <b>pedir emprestado</b> (você paga só parte do salário) ou <b>propor uma troca</b>. No seu elenco, <b>🔁 Emprestar</b> manda um jogador jogar com minutos garantidos. Ao vender, dá para aceitar um pouco menos e ficar com uma <b>% da próxima venda</b>.</p>' : `
            <div class="ficha">
                <div><span>Seus emprestados (${fora.length}): sua parte dos salários</span><b class="${custo ? 'vermelho' : ''}">${U.dinheiro(custo)}/sem.</b></div>
                <div><span>Emprestados ao clube (${dentro.length}): economia nos salários</span><b class="${economia ? 'verde' : ''}">${U.dinheiro(economia)}/sem.</b></div>
            </div>
            ${clausulas.length ? `<h4>📈 Cláusulas de revenda</h4><div class="rolavel"><table class="tabela"><thead><tr><th class="esq">Jogador</th><th class="esq">Clube</th><th>%</th><th>Se vendido hoje</th></tr></thead>
                <tbody>${clausulas.slice(0, 12).map(p => `<tr><td class="esq">${UI.jogador(p)} <small class="cinza">${p.idade}a</small></td><td class="esq">${p.tid >= 0 ? UI.time(s, p.tid, true) : '<span class="cinza">sem clube</span>'}</td><td>${p.revenda.pct}%</td><td>~${U.dinheiro(Mundo.valor(p) * p.revenda.pct / 100)}</td></tr>`).join('')}</tbody></table></div>` : ''}
            ${neg.rec.length ? `<h4>💰 Revendas recebidas</h4>${neg.rec.slice(0, 5).map(r => `<div class="rs-linha pequeno">${r.ano} · ${U.esc(r.nome)} (${U.esc(r.de)} → ${U.esc(r.para)}): <b class="verde">+${U.dinheiro(r.valor)}</b> (${r.pct}%)</div>`).join('')}` : ''}`}
            ${neg.hist.length ? `<h4>📜 Empréstimos encerrados</h4>${neg.hist.slice(0, 5).map(r => `<div class="rs-linha pequeno">${r.ano} · ${Negociacoes.textoVolta(r)}${r.motivo && r.motivo !== 'fim do empréstimo' ? ` <span class="cinza">(${U.esc(r.motivo)})</span>` : ''}</div>`).join('')}` : ''}
        </div>`;
    },

    // dica no alto do mercado (gancho em Tecnico.mercado)
    dicaMercado(s) {
        if (!Mundo.emJanela(s)) return '';
        return '<p class="cinza pequeno neg-dica-mercado">💡 Na <b>Proposta</b> dá também para 🔁 <b>pedir emprestado</b> ou 🔄 <b>propor uma troca</b>.</p>';
    },

    // 📝 Pendências (gancho em Comissao.pendencias)
    pendencias(s, t, add) {
        const dentro = Negociacoes.lista(s, t.id, 'in');
        const parados = dentro.filter(p => (p.sj || 0) >= NEG.recall - 2 && Escalacao.disponivel(p));
        if (parados.length) {
            const p = parados[0];
            add('aviso', '🔁', `${U.esc(p.nome)} (emprestado) não está jogando`, `${p.sj} jogos sem entrar: com ${NEG.recall}, o ${U.esc(p.empr.deNome)} pede ele de volta.`, { txt: 'Tática', aba: 'tatica' });
        }
        const total = dentro.length + Negociacoes.lista(s, t.id, 'out').length;
        if (total && s.semana >= 38) add('info', '🔁', `${total} empréstimo${total > 1 ? 's terminam' : ' termina'} no fim da temporada`, 'Os emprestados voltam aos clubes donos antes da virada do ano.', { txt: 'Elenco', aba: 'elenco' });
    },
};

// Os ganchos chamados por outros módulos nunca podem quebrar o jogo: um erro
// aqui vira só um aviso no console (as funções assíncronas também).
[['semana', undefined], ['fimTemporada', undefined], ['aoTransferir', undefined], ['custoSemanal', 0], ['opcaoRevenda', null], ['registrarRevenda', undefined],
    ['botoesProposta', []], ['htmlProposta', ''], ['botaoEmprestar', { id: 'ngEmprestar', txt: '🔁 Emprestar', desativado: true }], ['acoesEmprestado', null],
    ['marca', ''], ['painelElenco', ''], ['htmlFinancas', ''], ['dicaMercado', ''], ['pendencias', undefined], ['bloqueioProposta', false]].forEach(([k, padrao]) => {
    const fn = Negociacoes[k];
    Negociacoes[k] = function () {
        try {
            const r = fn.apply(Negociacoes, arguments);
            if (r && typeof r.then === 'function') return r.catch(e => { console.warn('negociacoes.' + k, e); return padrao; });
            return r;
        } catch (e) {
            console.warn('negociacoes.' + k, e);
            return padrao;
        }
    };
});

Object.assign(ACOES, {
    ngChamar(d) {
        const s = Jogo.s, t = s && Tecnico.time(s), p = s && s.jog[+d.pid];
        if (!t || !p || !p.empr || p.empr.de !== t.id || !Mundo.emJanela(s)) return;
        const de = p.empr.paraNome;
        const r = Negociacoes.devolver(s, p, 'você chamou de volta');
        if (r) { Vida.log(s, `↩️ Você chamou ${p.nome} de volta do ${de}.`, ''); UI.toast(`↩️ ${U.esc(p.nome)} voltou ao elenco.`); }
        Jogo.manterRolagem = true;
        Jogo.atualizar();
    },
});
