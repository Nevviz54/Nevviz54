'use strict';
// =====================================================================
//  MOTIVAÇÃO DOS JOGADORES
//  Cada jogador tem motivação de 0 a 100 (5 níveis). Ela muda com os
//  resultados, com o tempo de jogo, com as conversas com o técnico e com
//  promessas cumpridas (ou não). Quanto mais motivado, melhor ele joga.
// =====================================================================

const NIVEIS_MOT = [
    { min: 80, id: 'muito', nome: 'Muito motivado', icone: '🔥', classe: 'mot-5' },
    { min: 62, id: 'motivado', nome: 'Motivado', icone: '😀', classe: 'mot-4' },
    { min: 40, id: 'normal', nome: 'Normal', icone: '😐', classe: 'mot-3' },
    { min: 22, id: 'desmotivado', nome: 'Desmotivado', icone: '😕', classe: 'mot-2' },
    { min: 0, id: 'muitoDes', nome: 'Muito desmotivado', icone: '😠', classe: 'mot-1' },
];

const PERSONALIDADES = {
    profissional: { nome: 'Profissional', icone: '🎯', desc: 'Leva tudo a sério e aceita bem cobranças justas.' },
    ambicioso: { nome: 'Ambicioso', icone: '🚀', desc: 'Quer jogar sempre e odeia o banco.' },
    temperamental: { nome: 'Temperamental', icone: '🌋', desc: 'Explode fácil: cuidado com as broncas.' },
    vaidoso: { nome: 'Vaidoso', icone: '💅', desc: 'Adora elogios e holofotes.' },
    tranquilo: { nome: 'Tranquilo', icone: '🧘', desc: 'Difícil de abalar, para o bem e para o mal.' },
    lider: { nome: 'Líder', icone: '🦁', desc: 'Puxa o grupo e gosta de responsabilidade.' },
};

const Mot = {
    // semana "absoluta", para prazos que atravessam temporadas
    agora: s => s.ano * 60 + s.semana,

    valor(p) {
        if (p.mot == null) p.mot = 48 + ((p.id * 37) % 17);
        return p.mot;
    },

    nivel(p) {
        const v = Mot.valor(p);
        return NIVEIS_MOT.find(n => v >= n.min);
    },

    // bônus de rendimento em campo: de -4 (muito desmotivado) a +3,5 (muito motivado)
    bonus(p) {
        if (p.user) return 0; // o jogador do modo carreira não usa motivação
        return U.clamp((Mot.valor(p) - 52) / 10, -4, 3.5);
    },

    mudar(p, d) {
        p.mot = Math.round(U.clamp(Mot.valor(p) + d, 0, 100) * 10) / 10;
        return d;
    },

    pers(p) {
        if (!p.per) {
            const tipos = Object.keys(PERSONALIDADES);
            let k = (p.id * 2654435761) % 1000 / 1000;
            if (p.idade >= 30 && k < 0.25) p.per = 'lider';
            else p.per = tipos[Math.floor(k * tipos.length) % tipos.length];
        }
        return p.per;
    },

    badge(p, curto = false) {
        const n = Mot.nivel(p);
        return `<span class="mot ${n.classe}" title="${n.nome}">${n.icone}${curto ? '' : ' ' + n.nome}</span>`;
    },

    icone(p) {
        const n = Mot.nivel(p);
        return `<span class="pl-mot" title="${n.nome}">${n.icone}</span>`;
    },

    // posição de cada jogador na "fila" do elenco (pelo nível): define o que ele espera jogar
    ranking(s, t) {
        const r = new Map();
        Mundo.elenco(s, t).sort((a, b) => b.ovr - a.ovr).forEach((p, i) => r.set(p.id, i + 1));
        return r;
    },

    // ---------------------------------------------------------------
    //  Depois de cada partida (todos os times do mundo)
    // ---------------------------------------------------------------
    aposJogo(s, jogo, r) {
        const classico = Mundo.classico(s, jogo.h, jogo.a);
        const final = Mundo.ehFinal(s, jogo);
        const titulares = new Set(r.tit || []);
        for (const [tid, gf, gc] of [[jogo.h, r.gh, r.ga], [jogo.a, r.ga, r.gh]]) {
            const t = s.times[tid];
            const venceu = r.venc != null ? r.venc === tid : gf > gc;
            const perdeu = r.venc != null ? r.venc !== tid : gf < gc;
            let res = venceu ? 3 : perdeu ? -3 : 0.3;
            if (Math.abs(gf - gc) >= 3) res += venceu ? 1 : -1;
            if (classico) res *= 1.5;
            if (final) res += venceu ? 6 : -3;
            const usuario = s.modo === 'tecnico' && s.car.tid === tid;
            const rank = Mot.ranking(s, t);
            for (const p of Mundo.elenco(s, t)) {
                if (p.user) continue;
                const nota = r.notas[p.id];
                const pers = Mot.pers(p);
                let d;
                if (nota != null) {
                    d = res + (titulares.has(p.id) ? 1.5 : 1);
                    if (nota >= 7.5) d += 2;
                    if (nota >= 8.5) d += 1.5;
                    if (nota < 5.5) d -= 2;
                    p.sj = 0;
                    p.fm = p.fm == null ? nota : Math.round((p.fm * 0.6 + nota * 0.4) * 100) / 100;
                    if (p.des) {
                        // desafio do técnico: decidir o jogo
                        d += nota >= 7.5 ? 5 : -2;
                        p.des = false;
                    }
                } else if (Escalacao.disponivel(p) && !(p.folga > 0)) {
                    const k = rank.get(p.id) || 30;
                    let esp = k <= 11 ? -4 : k <= 16 ? -2 : k <= 22 ? -1 : -0.3;
                    if (pers === 'ambicioso') esp *= 1.5;
                    if (pers === 'tranquilo') esp *= 0.6;
                    if (p.idade <= 20) esp *= 0.6;
                    d = res * 0.4 + esp;
                    p.sj = (p.sj || 0) + 1;
                    if (p.des) { d -= 2; p.des = false; }
                } else {
                    d = res * 0.3;
                }
                if (pers === 'tranquilo') d *= 0.75;
                if (pers === 'temperamental') d *= 1.2;
                Mot.mudar(p, d + (55 - Mot.valor(p)) * 0.1);
                // promessas do técnico usuário
                if (usuario && s.car.prom && s.car.prom[p.id]) {
                    const pr = s.car.prom[p.id];
                    if (nota != null && (pr.tipo !== 'titular' || titulares.has(p.id))) pr.feitos++;
                    else if (pr.tipo === 'titular') pr.falhou = true;
                }
            }
        }
    },

    // ---------------------------------------------------------------
    //  Toda semana (só o time do técnico usuário)
    // ---------------------------------------------------------------
    async semana(s, t, rapido) {
        const agora = Mot.agora(s);
        s.car.prom = s.car.prom || {};
        for (const p of Mundo.elenco(s, t)) {
            if (p.folga > 0) p.folga--;
            if (p.pq > 0) p.pq--;
            if (p.br > 0) p.br--;
            if (p.prob > 0) { p.prob--; Mot.mudar(p, -1.5); }
        }
        // problema pessoal de vez em quando
        if (U.chance(0.08)) {
            const p = U.escolha(Mundo.elenco(s, t));
            if (p && !p.prob) { p.prob = U.int(3, 6); Mot.mudar(p, -8); }
        }
        // promessas
        for (const [pid, pr] of Object.entries(s.car.prom)) {
            const p = s.jog[pid];
            if (!p || p.tid !== t.id) { delete s.car.prom[pid]; continue; }
            const cumpriu = pr.feitos >= pr.precisa;
            if (cumpriu) {
                delete s.car.prom[pid];
                Mot.mudar(p, 6);
                Vida.log(s, `🤝 Promessa cumprida: ${p.nome} ganhou o tempo de jogo que você prometeu.`, 'bom');
            } else if (pr.falhou || agora > pr.ate) {
                delete s.car.prom[pid];
                Mot.mudar(p, Mot.pers(p) === 'temperamental' ? -28 : -22);
                p.pq = 6;
                t.moral = U.clamp(t.moral - 2, 5, 99);
                Vida.log(s, `💔 Promessa quebrada: ${p.nome} esperava jogar e ficou de fora. Ele está ${Mot.nivel(p).nome.toLowerCase()}.`, 'ruim');
                if (!rapido) await UI.aviso('Promessa quebrada', `<b>${U.esc(p.nome)}</b> veio falar com você: <i>"Professor, você me prometeu que eu ia ${pr.tipo === 'titular' ? 'começar jogando' : 'ter minutos'} e não cumpriu. Assim fica difícil confiar."</i><br><br>Motivação dele agora: ${Mot.badge(p)}`, '💔');
            }
        }
        // jogadores sem jogar cobram tempo de jogo
        await Mot.cobranca(s, t, rapido);
    },

    async cobranca(s, t, rapido) {
        const agora = Mot.agora(s);
        const rank = Mot.ranking(s, t);
        const cand = Mundo.elenco(s, t).filter(p => Escalacao.disponivel(p) && (p.sj || 0) >= 4 && (rank.get(p.id) || 99) <= 24
            && !(s.car.prom && s.car.prom[p.id]) && !(p.msg && agora - p.msg < 6) && !s.car.venda.includes(p.id));
        if (!cand.length || !U.chance(rapido ? 0.25 : 0.45)) return;
        const p = cand.sort((a, b) => (b.sj * (Mot.pers(b) === 'ambicioso' ? 1.5 : 1) + b.ovr / 10) - (a.sj * (Mot.pers(a) === 'ambicioso' ? 1.5 : 1) + a.ovr / 10))[0];
        p.msg = agora;
        const pers = Mot.pers(p);
        const textos = {
            ambicioso: `Professor, já são ${p.sj} jogos sem entrar em campo. Eu vim aqui para jogar, não para ficar no banco. Preciso de minutos!`,
            temperamental: `Não dá mais! ${p.sj} jogos fora e ninguém me explica nada. Quero uma resposta, professor.`,
            vaidoso: `Professor, a torcida pergunta por mim nas redes... São ${p.sj} jogos sem jogar. Quando vou ter minha chance?`,
            profissional: `Professor, respeito suas escolhas, mas já são ${p.sj} jogos sem entrar. O que eu preciso melhorar para ter uma chance?`,
            tranquilo: `E aí, professor. Faz ${p.sj} jogos que não jogo... Será que eu consigo uns minutinhos?`,
            lider: `Professor, quero ajudar o grupo dentro de campo. ${p.sj} jogos de fora é muito tempo para mim.`,
        };
        const i = await UI.perguntar(`📱 Mensagem de ${U.esc(p.nome)}`,
            `${UI.pos(p.pos)} <b>${U.esc(p.nome)}</b> · ${p.idade} anos · OVR ${p.ovr} · ${Mot.badge(p)}<br><br><i>"${textos[pers]}"</i>`,
            ['✅ "Pode ficar tranquilo, você vai ter minutos nas próximas semanas."', '🏋️ "Mostra no treino que merece a vaga."', '🏷️ "Se não está feliz, te coloco à venda."', '🙈 Ignorar a mensagem'], '📱');
        let txt;
        if (i === 0) {
            Mot.prometer(s, p, 'jogar');
            Mot.mudar(p, pers === 'ambicioso' ? 18 : 14);
            txt = `${p.nome} ficou animado com a promessa. Ponha ele em campo em pelo menos 2 jogos nas próximas 4 semanas!`;
        } else if (i === 1) {
            const d = { profissional: 5, tranquilo: 4, lider: 3, vaidoso: -2, ambicioso: -4, temperamental: -6 }[pers];
            Mot.mudar(p, d);
            txt = d >= 0 ? `${p.nome} aceitou o desafio e vai treinar mais forte.` : `${p.nome} não gostou da resposta.`;
        } else if (i === 2) {
            Mot.mudar(p, -8);
            s.car.venda.push(p.id);
            txt = `${p.nome} foi colocado à venda. Propostas chegam durante a janela.`;
        } else {
            Mot.mudar(p, -7);
            txt = `${p.nome} ficou no vácuo... e não gostou nada.`;
        }
        Vida.log(s, `📱 ${txt}`, i === 0 ? 'bom' : '');
        UI.toast(`📱 ${txt}`);
    },

    prometer(s, p, tipo) {
        s.car.prom = s.car.prom || {};
        s.car.prom[p.id] = tipo === 'titular'
            ? { tipo, ate: Mot.agora(s) + 2, precisa: 1, feitos: 0 }
            : { tipo, ate: Mot.agora(s) + 4, precisa: 2, feitos: 0 };
    },

    // ---------------------------------------------------------------
    //  Por que o jogador está desmotivado?
    // ---------------------------------------------------------------
    motivos(s, p) {
        const t = s.times[p.tid];
        const lista = [];
        if (p.prob > 0) lista.push(['pessoal', 7]);
        if (p.pq > 0) lista.push(['promessa', 8]);
        if (p.br > 0) lista.push(['bronca', 5]);
        if ((p.sj || 0) >= 3) lista.push(['banco', 3 + p.sj]);
        const liga = Mundo.liga(s, t.liga);
        const ult = liga && liga.tab && liga.tab[t.id] ? liga.tab[t.id].ult : [];
        if (ult.slice(-3).filter(x => x === 'D').length >= 2) lista.push(['derrotas', 4]);
        if (p.fm != null && p.fm < 6.1 && !(p.sj >= 3)) lista.push(['fase', 3.5]);
        const pares = Mundo.elenco(s, t).filter(x => x.id !== p.id && Math.abs(x.ovr - p.ovr) <= 3).map(x => x.sal).sort((a, b) => a - b);
        if (pares.length >= 2 && p.sal < pares[Math.floor(pares.length / 2)] * 0.6) lista.push(['salario', 4]);
        if (p.contr <= 1 && p.ovr >= t.rep - 4) lista.push(['contrato', 3]);
        lista.sort((a, b) => b[1] - a[1]);
        return lista.length ? lista.map(x => x[0]) : ['nada'];
    },

    // fala do jogador e as respostas possíveis do técnico para cada motivo
    dialogoMotivo(s, p, motivo) {
        const pers = Mot.pers(p);
        const custoPsico = U.redondo(Math.max(15000, p.sal * 0.05));
        const aumento = U.redondo(p.sal * 1.25);
        const D = {
            banco: {
                fala: `Professor, faz ${p.sj} jogos que eu não entro em campo. Eu treino forte todo dia e sinto que não tenho chance.`,
                op: [
                    { txt: '✅ "Você vai ter chances nos próximos jogos, eu prometo."', d: pers === 'ambicioso' ? 18 : 15, prometer: 'jogar', resp: 'Valeu, professor! Não vou te decepcionar.' },
                    { txt: '🏋️ "Continue treinando forte que a sua hora vai chegar."', d: U.def({ profissional: 7, tranquilo: 6, lider: 4 }[pers], pers === 'temperamental' ? -3 : 2), resp: 'Tá bom... vou continuar trabalhando.' },
                    { txt: '📏 "Hoje você não está no nível dos titulares."', d: U.def({ profissional: 3, tranquilo: -2 }[pers], pers === 'temperamental' ? -12 : pers === 'ambicioso' ? -8 : -4), resp: 'Isso dói de ouvir...' },
                    { txt: '🏷️ "Se não está feliz, posso te liberar para outro clube."', d: -6, vender: true, resp: 'Então acho melhor eu procurar outro lugar.' },
                ],
            },
            promessa: {
                fala: 'Você me prometeu que eu ia jogar e não cumpriu. Assim fica difícil confiar em você.',
                op: [
                    { txt: '🙏 "Você tem razão, me desculpe. Agora vai ser diferente."', d: 9, prometer: 'jogar', limpa: 'pq', resp: 'Vou acreditar mais uma vez, professor.' },
                    { txt: '⚖️ "As coisas mudaram, o time precisava vencer."', d: pers === 'profissional' ? 3 : -4, resp: 'Entendo... mas não gostei.' },
                    { txt: '😤 "Não admito esse tom comigo."', d: pers === 'temperamental' ? -15 : -10, resp: '...' },
                ],
            },
            bronca: {
                fala: 'Não gostei de ser cobrado daquele jeito na frente de todo mundo.',
                op: [
                    { txt: '🙏 "Exagerei, peço desculpas."', d: 10, limpa: 'br', resp: 'Tudo certo, professor. Bola para frente.' },
                    { txt: '💪 "Cobrei porque acredito no seu potencial."', d: U.def({ profissional: 8, vaidoso: 3 }[pers], 5), limpa: 'br', resp: 'Entendi. Vou mostrar em campo.' },
                    { txt: '📢 "Vou continuar cobrando. Aqui é assim."', d: pers === 'profissional' ? 2 : -6, resp: 'Beleza, então.' },
                ],
            },
            derrotas: {
                fala: 'Essa sequência de derrotas está pesando. O grupo está abatido.',
                op: [
                    { txt: '🌅 "A fase vai virar. Confio muito em você."', d: 8, resp: 'Valeu, professor. Vamos sair dessa juntos.' },
                    { txt: '🏋️ "Vamos treinar dobrado essa semana."', d: pers === 'profissional' ? 7 : 2, cond: -5, resp: 'Bora trabalhar.' },
                    { txt: '🪑 "Quem não aguentar a pressão vai para o banco."', d: pers === 'lider' ? 3 : pers === 'temperamental' ? -9 : -3, resp: 'Pressão a gente já tem de sobra...' },
                ],
            },
            fase: {
                fala: 'Não estou conseguindo jogar bem, parece que nada dá certo.',
                op: [
                    { txt: '❤️ "Esquece os erros, você é muito importante para nós."', d: pers === 'vaidoso' ? 12 : 9, resp: 'Obrigado, professor. Isso me ajuda muito.' },
                    { txt: '🎥 "Vamos ver os vídeos juntos e corrigir o que está errado."', d: pers === 'profissional' ? 10 : 6, resp: 'Boa ideia. Quero melhorar.' },
                    { txt: '⚠️ "Se não melhorar, vai perder a vaga."', d: pers === 'ambicioso' ? 2 : pers === 'temperamental' ? -9 : -5, resp: 'Tá certo...' },
                ],
            },
            salario: {
                fala: 'Estou ganhando bem menos que outros do elenco que jogam no mesmo nível que eu.',
                op: [
                    { txt: `💰 "Vou te dar um aumento agora." (salário vai para ${U.dinheiro(aumento)}/ano)`, d: 18, aumento, resp: 'Isso sim! Obrigado pela valorização!' },
                    { txt: '🗂️ "Vou levar o seu caso para a diretoria."', d: 4, resp: 'Fico no aguardo, então.' },
                    { txt: '📄 "Contrato é contrato."', d: pers === 'tranquilo' ? -3 : -8, resp: 'Hum... entendi.' },
                ],
            },
            pessoal: {
                fala: 'Estou com uns problemas em casa, professor. A cabeça não está no futebol.',
                op: [
                    { txt: '🏠 "Tire uns dias de folga para resolver." (fica fora do próximo jogo)', d: 14, folga: true, limpa: 'prob', resp: 'Muito obrigado, professor. Não vou esquecer disso.' },
                    { txt: `🧠 "O clube vai pagar um psicólogo para você." (${U.dinheiro(custoPsico)})`, d: 10, custo: custoPsico, limpa: 'prob', resp: 'Vai me ajudar bastante, obrigado.' },
                    { txt: '⚽ "Aqui dentro você precisa esquecer os problemas."', d: -6, resp: 'Não é tão simples assim...' },
                ],
            },
            contrato: {
                fala: 'Meu contrato está acabando e ninguém me procurou para renovar.',
                op: [
                    { txt: '✍️ "Vamos renovar, pode ficar tranquilo."', d: 8, renovar: true, resp: 'Ótimo! Quero continuar aqui.' },
                    { txt: '⏳ "Vamos conversar no fim da temporada."', d: -3, resp: 'Tudo bem...' },
                    { txt: '🤷 "Ainda não sei se você fica."', d: -8, resp: 'Então vou ouvir outras propostas.' },
                ],
            },
            nada: {
                fala: 'Sei lá, professor... não estou num bom momento.',
                op: [
                    { txt: '🤝 "Conte comigo para o que precisar."', d: 6, resp: 'Valeu mesmo.' },
                    { txt: '📈 "Quero ver mais empenho."', d: pers === 'profissional' ? 2 : -3, resp: 'Ok.' },
                ],
            },
        };
        return D[motivo];
    },

    // ---------------------------------------------------------------
    //  Conversa individual
    // ---------------------------------------------------------------
    async conversar(s, p) {
        const t = s.times[p.tid];
        s.car.conversas = s.car.conversas || {};
        if (s.car.conversas[p.id] === Mot.agora(s)) {
            return UI.aviso('Já conversaram', `Você já conversou com ${U.esc(p.nome)} nesta semana. Deixe ele digerir a conversa e tente de novo na próxima.`, '💬');
        }
        const pers = Mot.pers(p);
        const nv = Mot.nivel(p).id;
        const cab = Mot.cabecalho(s, p);
        const opcoes = [];
        if (nv === 'desmotivado' || nv === 'muitoDes') opcoes.push({ id: 'porque', txt: '❓ "Por que você está desmotivado?"' });
        if (nv === 'normal' || nv === 'desmotivado') opcoes.push({ id: 'motivar', txt: '🔥 Motivar o jogador' });
        if (nv === 'motivado' || nv === 'muito') opcoes.push({ id: 'elogiar', txt: '👏 Elogiar a fase dele' });
        if ((nv === 'motivado' || nv === 'muito') && (pers === 'lider' || p.idade >= 29)) opcoes.push({ id: 'liderar', txt: '©️ "Quero que você lidere o grupo."' });
        if (nv === 'muito') opcoes.push({ id: 'pesnochao', txt: '🧘 "Mantenha os pés no chão."' });
        opcoes.push({ id: 'papel', txt: '🗓️ Falar sobre o papel dele no time' });
        opcoes.push({ id: 'cobrar', txt: '📈 Cobrar mais empenho' });
        const i = await UI.perguntar(`💬 Conversa com ${U.esc(p.nome)}`, cab, opcoes.map(o => o.txt).concat(['↩️ Deixar para depois']), '💬');
        const escolha = opcoes[i];
        if (!escolha) return;
        s.car.conversas[p.id] = Mot.agora(s);
        let r = null;
        if (escolha.id === 'porque') {
            const motivo = Mot.motivos(s, p)[0];
            const dg = Mot.dialogoMotivo(s, p, motivo);
            const k = await UI.perguntar(`💬 ${U.esc(p.nome)} se abre`, `${cab}<br><br><b>${U.esc(p.nome.split(' ')[0])}:</b> <i>"${dg.fala}"</i>`, dg.op.map(o => o.txt), '💬');
            r = await Mot.aplicar(s, p, dg.op[k] || dg.op[dg.op.length - 1]);
        } else if (escolha.id === 'motivar') {
            const ops = [
                { txt: '❤️ "Eu confio muito em você. Vai ser importante para nós."', d: pers === 'vaidoso' ? 10 : 7, resp: 'Pode deixar, professor!' },
                { txt: '🎯 "Quero ver você decidir o próximo jogo." (se for bem, motiva ainda mais)', d: pers === 'ambicioso' || pers === 'lider' ? 7 : 4, desafio: true, resp: 'Desafio aceito!' },
                { txt: '🟢 "Você vai começar jogando no próximo jogo." (promessa)', d: 11, prometer: 'titular', resp: 'Não vou desperdiçar a chance!' },
            ];
            const k = await UI.perguntar(`🔥 Motivar ${U.esc(p.nome)}`, cab, ops.map(o => o.txt), '🔥');
            r = await Mot.aplicar(s, p, ops[k] || ops[0]);
        } else if (escolha.id === 'elogiar') {
            const ja = Mot.valor(p) >= 85;
            r = await Mot.aplicar(s, p, { d: ja ? 1 : (pers === 'vaidoso' ? 6 : 4), resp: ja ? 'Valeu! Sigo focado.' : 'Obrigado, professor! Vou continuar assim.' });
        } else if (escolha.id === 'liderar') {
            t.moral = U.clamp(t.moral + 3, 5, 99);
            r = await Mot.aplicar(s, p, { d: pers === 'lider' ? 6 : 3, resp: 'Pode contar comigo para puxar o grupo!' });
        } else if (escolha.id === 'pesnochao') {
            r = await Mot.aplicar(s, p, { d: pers === 'vaidoso' ? -4 : pers === 'profissional' ? 1 : -1, resp: pers === 'vaidoso' ? 'Achei que estava indo bem...' : 'Pode deixar, sem salto alto.' });
        } else if (escolha.id === 'papel') {
            const rank = Mot.ranking(s, t).get(p.id) || 30;
            const ops = [
                { txt: '⭐ "Você é titular absoluto deste time."', d: rank <= 11 ? 8 : 3, prometer: rank <= 11 ? null : 'titular', resp: rank <= 11 ? 'É isso que eu queria ouvir!' : 'Vou cobrar isso, hein!' },
                { txt: '🔄 "Você vai ter chances, principalmente nas copas."', d: rank <= 11 ? -4 : 6, prometer: rank <= 11 ? null : 'jogar', resp: rank <= 11 ? 'Só nas copas? Achei que era titular...' : 'Beleza, vou estar pronto.' },
                { txt: '🪑 "Por enquanto você é reserva."', d: rank <= 11 ? -10 : rank <= 16 ? (pers === 'profissional' ? 1 : -4) : 1, resp: rank <= 11 ? 'Como assim?!' : 'Entendi. Vou batalhar pela vaga.' },
            ];
            const k = await UI.perguntar(`🗓️ O papel de ${U.esc(p.nome)}`, cab, ops.map(o => o.txt), '🗓️');
            r = await Mot.aplicar(s, p, ops[k] || ops[2]);
        } else if (escolha.id === 'cobrar') {
            const merecia = (p.fm != null && p.fm < 6.4) || Mot.valor(p) >= 75;
            const d = merecia ? ({ profissional: 5, lider: 4, tranquilo: 2, ambicioso: 2, vaidoso: -5, temperamental: -10 }[pers]) : U.def({ profissional: -1, tranquilo: -2 }[pers], -7);
            if (d < 0) p.br = 3;
            r = await Mot.aplicar(s, p, { d, resp: d >= 0 ? 'Recado entendido. Vou dar mais.' : 'Não sei por que isso agora...' });
        }
        Jogo.manterRolagem = true;
        Jogo.atualizar();
        return r;
    },

    cabecalho(s, p) {
        const pers = PERSONALIDADES[Mot.pers(p)];
        const pr = s.car.prom && s.car.prom[p.id];
        return `<div class="conversa-cab">
            ${UI.pos(p.pos)} <b>${U.esc(p.nome)}</b> · ${p.idade} anos · OVR ${p.ovr}<br>
            Motivação: ${Mot.badge(p)} <small class="cinza">(${Math.round(Mot.valor(p))}/100)</small><br>
            <small>${pers.icone} ${pers.nome}: ${pers.desc}</small><br>
            <small class="cinza">${p.j} jogos na temporada${p.sj ? ` · ${p.sj} jogo(s) seguidos sem entrar` : ''}${p.fm != null ? ` · forma ${p.fm.toFixed(1)}` : ''}${pr ? ` · 🤝 promessa: ${pr.feitos}/${pr.precisa} jogo(s)` : ''}</small>
        </div>`;
    },

    async aplicar(s, p, op) {
        const t = s.times[p.tid];
        const antes = Mot.nivel(p);
        let extra = '';
        if (op.prometer) { Mot.prometer(s, p, op.prometer); extra += op.prometer === 'titular' ? '<br>🤝 Promessa: ele começa jogando no próximo jogo.' : '<br>🤝 Promessa: pelo menos 2 jogos nas próximas 4 semanas.'; }
        if (op.vender && !s.car.venda.includes(p.id)) { s.car.venda.push(p.id); extra += '<br>🏷️ Ele foi colocado à venda.'; }
        if (op.limpa) p[op.limpa] = 0;
        if (op.desafio) { p.des = true; extra += '<br>🎯 Se ele for bem no próximo jogo (nota 7,5+), a motivação sobe mais. Se for mal ou não jogar, cai.'; }
        if (op.cond) for (const x of Mundo.elenco(s, t)) x.cond = Math.max(30, x.cond + op.cond);
        if (op.folga) { p.folga = 1; extra += '<br>🏠 Ele fica fora do próximo jogo.'; }
        if (op.custo) { t.saldo -= op.custo; extra += `<br>💸 Custo: ${U.dinheiro(op.custo)}.`; }
        if (op.aumento) { p.sal = op.aumento; extra += `<br>💰 Novo salário: ${U.dinheiro(op.aumento)}/ano.`; }
        Mot.mudar(p, op.d);
        if (op.renovar) await Tecnico.acaoJogador(s, p, 'renovar');
        const depois = Mot.nivel(p);
        const seta = op.d > 0 ? `<b class="verde">▲ motivação +${Math.round(op.d)}</b>` : op.d < 0 ? `<b class="vermelho">▼ motivação ${Math.round(op.d)}</b>` : '<b>= sem mudança</b>';
        await UI.aviso(`${U.esc(p.nome)} responde`, `<i>"${op.resp}"</i><br><br>${seta}<br>${antes.icone} ${antes.nome} → ${Mot.badge(p)}${extra}`, depois.icone);
        Vida.log(s, `💬 Você conversou com ${p.nome}: ${antes.nome.toLowerCase()} → ${depois.nome.toLowerCase()}.`, op.d >= 0 ? 'bom' : 'ruim');
        return op.d;
    },

    // ---------------------------------------------------------------
    //  Aba "Vestiário"
    // ---------------------------------------------------------------
    tela(s) {
        const t = Tecnico.time(s);
        const el = Mundo.elenco(s, t).sort((a, b) => Mot.valor(a) - Mot.valor(b));
        const cont = NIVEIS_MOT.map(n => ({ n, q: el.filter(p => Mot.nivel(p) === n).length }));
        const media = U.media(el, p => Mot.valor(p));
        const prom = Object.entries(s.car.prom || {}).filter(([pid]) => s.jog[pid] && s.jog[pid].tid === t.id);
        const agora = Mot.agora(s);
        return `<div class="cartao">
            <div class="cartao-topo"><h3>💬 Vestiário do ${U.esc(t.nome)}</h3><span>Motivação média: <b>${Math.round(media)}</b>/100</span></div>
            <div class="mot-resumo">${cont.map(({ n, q }) => `<div class="mot-caixa ${n.classe}"><span>${n.icone}</span><b>${q}</b><small>${n.nome}</small></div>`).join('')}</div>
            <p class="cinza pequeno">Jogador motivado rende mais em campo (até +3,5 de habilidade); desmotivado rende menos (até −4). A motivação muda com os resultados, com o tempo de jogo e com as suas conversas. Uma conversa por jogador por semana.</p>
            ${prom.length ? `<h4>🤝 Promessas em andamento</h4><div class="lista-prom">${prom.map(([pid, pr]) => `<div>${U.esc(s.jog[pid].nome)}: ${pr.tipo === 'titular' ? 'começar jogando' : 'jogar'} · ${pr.feitos}/${pr.precisa} jogo(s) · prazo: ${Math.max(0, pr.ate - agora)} semana(s)</div>`).join('')}</div>` : ''}
            <div class="rolavel"><table class="tabela tabela-elenco">
                <thead><tr><th>Pos</th><th class="esq">Jogador</th><th>OVR</th><th class="esq">Motivação</th><th>Sem jogar</th><th>Forma</th><th class="esq">Personalidade</th><th></th></tr></thead>
                <tbody>${el.map(p => {
            const pers = PERSONALIDADES[Mot.pers(p)];
            const ja = s.car.conversas && s.car.conversas[p.id] === agora;
            return `<tr><td>${UI.pos(p.pos)}</td><td class="esq">${UI.jogador(p)}${p.les > 0 ? ' 🚑' : ''}${p.prob > 0 ? ' 🏠' : ''}${s.car.prom && s.car.prom[p.id] ? ' 🤝' : ''}</td><td>${UI.ovr(p.ovr)}</td>
                    <td class="esq">${Mot.badge(p)}</td><td>${p.sj ? p.sj + ' jogo(s)' : '-'}</td><td>${p.fm != null ? p.fm.toFixed(1) : '-'}</td>
                    <td class="esq pequeno">${pers.icone} ${pers.nome}</td>
                    <td><button class="btn btn-pequeno ${ja ? '' : 'btn-primario'}" data-acao="motConversar" data-pid="${p.id}" ${ja ? 'disabled' : ''}>${ja ? '✔ Conversou' : '💬 Conversar'}</button></td></tr>`;
        }).join('')}</tbody></table></div>
        </div>`;
    },
};

Object.assign(ACOES, {
    motConversar: d => Mot.conversar(Jogo.s, Jogo.s.jog[+d.pid]),
});
