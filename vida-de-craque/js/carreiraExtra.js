'use strict';
// =====================================================================
//  CARREIRA DE JOGADOR: VARIEDADE
//  🔀 Mudança de posição: o técnico pede (a idade pesa, ou falta gente em
//     outra posição) ou você pede na aba Carreira. Umas semanas de
//     adaptação rendendo menos e os lances passam a ser os da posição nova.
//  🔁 Empréstimo: quem quase não joga pede (ou o clube oferece) um
//     empréstimo a um clube menor até o fim da temporada, com vaga
//     garantida. O contrato e o salário continuam com o clube dono.
//  🌴 Aposentadoria dourada: a partir dos 32 anos, propostas milionárias
//     da MLS e da Liga MX (mais felicidade, menos fama).
//  🏟️ Lenda do clube: jogos, gols, títulos e temporadas em cada clube. Na
//     aposentadoria: Hall da Fama, camisa aposentada ou estátua, e o jogo
//     de despedida (cutscene).
//  🔥 Polêmicas: eventos da vida novos (entram na lista EVENTOS de vida.js,
//     então valem o "🔁 Lembrar minha escolha" do js/ritmo.js).
//  🏅 Prêmios extras no fim da temporada (os dois modos): Seleção da
//     Temporada (mundo e a liga do usuário), Chuteira de Ouro (gols com peso
//     da liga) e Prêmio Puskás (s.golacos, do js/partidaExtras.js).
//
//  Estado (criado na primeira vez que precisa: saves antigos abrem normal)
//    s.car.cx = { adapt, posPed, posSem, posPedJog, posHist[], semJogar, jogouEm,
//                 temp, jt, jj, empr, emprPed, emprSem, dour, dourAno,
//                 clubes: { tid: { nome, j, g, a, anos[] } }, pend[] }
//    p.adaptPen      rendimento a menos enquanto se adapta à posição nova
//    s.pessoa.lendas homenagens recebidas na aposentadoria
//    s.selTemp       a última Seleção da Temporada (aba Mundo)
// =====================================================================

// para onde cada posição pode mudar
const TROCAS_POS = {
    PON: ['MEI', 'ATA', 'LAT'],
    ATA: ['PON', 'MEI'],
    MEI: ['VOL', 'PON', 'ATA'],
    VOL: ['ZAG', 'MEI'],
    LAT: ['ZAG', 'PON', 'VOL'],
    ZAG: ['VOL', 'LAT'],
    GOL: [],
};

// o técnico sugere a troca com a idade: de -> [para, idade mínima, fala do técnico]
const TROCAS_IDADE = {
    PON: ['MEI', 29, 'Você perdeu um pouco da explosão, mas ganhou visão de jogo. Quero você por dentro, armando o time como meia.'],
    ATA: ['MEI', 31, 'Na área a pancada é grande. Jogando um pouco mais atrás, como meia, a sua experiência vai render muito mais.'],
    LAT: ['ZAG', 29, 'Subir e descer a lateral o jogo inteiro cansa. Com a sua leitura de jogo, você seria um ótimo zagueiro.'],
    VOL: ['ZAG', 30, 'Você marca bem e sabe sair jogando. O time precisa da sua experiência lá atrás, na zaga.'],
    MEI: ['VOL', 31, 'Você enxerga o jogo como poucos. Jogando de volante, perto da zaga, vai ditar o ritmo do time.'],
};

// os lances de cada posição (LANCES_POS, em js/partida.js)
const LANCES_DA_POS = {
    ATA: 'pivô de costas para o gol e rebote na pequena área', PON: '1 contra 1 com o lateral e contra-ataque',
    MEI: 'tabela, escanteio e falta', VOL: 'bote no meia e saída de bola pressionada', LAT: 'apoio ao ataque e marcar o ponta',
    ZAG: 'bola nas costas, marcação na área e saída de bola', GOL: 'pênalti, cruzamento e reposição',
};

const PEN_ADAPT = 5;   // rendimento a menos no começo da adaptação (diminui semana a semana)

// homenagens de cada clube na aposentadoria (pontos = jogos + 2×gols + assistências + 30×títulos + 10×temporadas)
const NIVEIS_LENDA = [
    null,
    { id: 'hall', nome: 'Hall da Fama', icone: '🏛️', min: 260, jogos: 60 },
    { id: 'camisa', nome: 'Camisa aposentada', icone: '👕', min: 560, jogos: 150 },
    { id: 'estatua', nome: 'Estátua no estádio', icone: '🗿', min: 950, jogos: 250 },
];

// beleza de cada tipo de golaço para o júri do Puskás (chaves de GOLACOS)
const PESO_GOLACO = { bicicleta: 10, olimpico: 9, individual: 8, calcanhar: 7.5, chapeu: 7.2, voleio: 7, fora: 6.5, falta: 6.2 };

// Seleção da Temporada: 4-3-3 (ataque, meio, defesa e gol, de cima para baixo na tela)
const XI_TEMPORADA = ['GOL', 'LAT', 'ZAG', 'ZAG', 'LAT', 'VOL', 'MEI', 'MEI', 'PON', 'ATA', 'PON'];
const XI_LINHAS = [[8, 9, 10], [6, 5, 7], [1, 2, 3, 4], [0]];

const CarreiraExtra = {
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
        if (!c.cx) c.cx = {};
        const x = c.cx;
        if (x.adapt === undefined) x.adapt = null;
        if (x.posPed === undefined) x.posPed = null;
        if (x.empr === undefined) x.empr = null;
        if (x.dour === undefined) x.dour = null;
        if (x.semJogar == null) x.semJogar = 0;
        x.pend = x.pend || [];
        if (x.temp !== s.ano) { x.temp = s.ano; x.jt = 0; x.jj = 0; }
        const u = s.jog[c.pid];
        if (!x.posHist && u) x.posHist = [u.pos];
        if (!x.clubes) CarreiraExtra.semear(s, x);
        return x;
    },

    // números por clube de quem já jogava antes desta versão (pelo histórico)
    semear(s, x) {
        x.clubes = {};
        const u = s.jog[s.car.pid];
        const somar = (tid, j, g, a, ano) => {
            const c = CarreiraExtra.clube(s, x, tid);
            c.j += j || 0; c.g += g || 0; c.a += a || 0;
            if ((j || 0) > 0 && c.anos.indexOf(ano) < 0) c.anos.push(ano);
        };
        for (const h of s.car.hist || []) {
            const nome = String(h.time || '').replace(/ \(emp\.\)$/, '');
            const t = s.times.find(t => t.nome === nome && t.liga);
            if (t) somar(t.id, h.j, h.g, h.a, h.ano);
        }
        if (u && u.tid >= 0 && s.times[u.tid] && s.times[u.tid].liga) somar(u.tid, u.j, u.g, u.a, s.ano);
    },

    clube(s, x, tid) {
        if (!x.clubes[tid]) x.clubes[tid] = { nome: s.times[tid].nome, j: 0, g: 0, a: 0, anos: [] };
        return x.clubes[tid];
    },

    agora: s => Mot.agora(s),
    rapido: () => (typeof Historia !== 'undefined' ? Historia.rapido() : !!(typeof Ritmo !== 'undefined' && Ritmo.rodando)),
    // aviso rápido; no meio do ⏭️ / ⏩ fica só no diário
    avisar(txt) {
        if (typeof Ritmo !== 'undefined' && Ritmo.rodando) return;
        UI.toast(txt);
    },
    hst(s) { return typeof Historia !== 'undefined' && Historia.ativo(s) ? Historia.estado(s) : null; },
    // confiança do técnico e moral com a torcida (js/historia.js)
    clima(s, tec, tor) {
        const h = CarreiraExtra.hst(s);
        if (!h) return;
        h.tec += tec || 0;
        h.tor += tor || 0;
        Historia.clampClima(h);
    },
    ganharSeg(s, f) {
        const ps = s.pessoa, g = Math.round((ps.seg || 0) * f + 80);
        ps.seg = (ps.seg || 0) + g;
        return Vida.numero(g);
    },
    noClube(s) {
        if (s.modo !== 'jogador' || !s.car || s.car.pid == null) return false;
        const u = s.jog[s.car.pid];
        return !!u && u.tid >= 0 && !u.aposentado;
    },
    emprestado(s) { return CarreiraExtra.ativo(s) && !!(s.car.cx && s.car.cx.empr); },

    // clube dono do vínculo (o de origem, se você está emprestado)
    clubeDono(s) {
        const u = Jogador.p(s);
        const e = s.car && s.car.cx && s.car.cx.empr;
        return e && s.times[e.de] && u && u.tid >= 0 ? e.de : u.tid;
    },

    // emprestado não recebe outras propostas (o vínculo é com o clube dono)
    bloqueiaProposta(s) { return CarreiraExtra.emprestado(s); },

    // -----------------------------------------------------------------
    //  Depois de cada jogo do clube (gancho em Jogador.posJogo)
    // -----------------------------------------------------------------
    posJogo(s, jogo, m, r) {
        if (!CarreiraExtra.ativo(s)) return;
        const u = Jogador.p(s);
        if (u.tid !== jogo.h && u.tid !== jogo.a) return;
        const novo = !s.car.cx || !s.car.cx.clubes;   // a semeadura já conta este jogo
        const x = CarreiraExtra.estado(s);
        const st = m.st[u.id];
        x.jt++;
        if (st) {
            x.jj++;
            x.semJogar = 0;
            x.jogouEm = CarreiraExtra.agora(s);
            if (!novo && s.times[u.tid].liga) {
                const c = CarreiraExtra.clube(s, x, u.tid);
                c.j++; c.g += st.g; c.a += st.a;
                if (c.anos.indexOf(s.ano) < 0) c.anos.push(s.ano);
            }
            const e = x.empr;
            if (e && u.tid === e.para) { e.j = (e.j || 0) + 1; e.g = (e.g || 0) + st.g; e.ns = (e.ns || 0) + (r.notas[u.id] || 6); }
        } else if (u.les <= 0 && u.susp <= 0) x.semJogar++;
    },

    // quase não joga: muitos jogos seguidos fora ou pouco tempo de campo na temporada
    quaseNaoJoga(s, x) {
        return x.semJogar >= 4 || (x.jt >= 8 && x.jj / x.jt < 0.35);
    },

    // -----------------------------------------------------------------
    //  Semana (fim de Jogador.semana)
    // -----------------------------------------------------------------
    async semana(s) {
        if (!CarreiraExtra.ativo(s)) return;
        const x = CarreiraExtra.estado(s), u = Jogador.p(s);
        CarreiraExtra.adaptar(s, x, u);
        CarreiraExtra.pendencias(s, x);
        CarreiraExtra.vidaDourada(s, x, u);
        if (x.empr) CarreiraExtra.garantirMinutos(s, x, u);
        // decisões: no máximo uma por semana (e nenhuma se já houve proposta)
        if (typeof Historia !== 'undefined' && Historia._propSem === CarreiraExtra.agora(s)) return;
        if (await CarreiraExtra.verEmprestimo(s, x, u)) return;
        if (await CarreiraExtra.verDourada(s, x, u)) return;
        await CarreiraExtra.verPosicao(s, x, u);
    },

    // -----------------------------------------------------------------
    //  🔀 Mudança de posição
    // -----------------------------------------------------------------
    // seria titular nesta posição no time? (folga = OVR a menos pela adaptação)
    titularEm(s, t, u, pos, folga) {
        const vagas = FORMACOES[t.form].filter(x => x[0] === pos).length;
        if (!vagas) return false;
        const outros = Mundo.elenco(s, t).filter(p => p.id !== u.id && p.pos === pos).sort((a, b) => b.ovr - a.ovr);
        const ultimo = outros[vagas - 1];
        return u.ovr - (folga || 0) > (ultimo ? ultimo.ovr : 0);
    },

    // o técnico tem um motivo para te mudar de posição? { para, txt, chance } ou null
    sugestao(s, u) {
        const t = s.times[u.tid];
        const id = TROCAS_IDADE[u.pos];
        if (id && u.idade >= id[1]) return { para: id[0], txt: id[2], chance: 0.014 };
        if (CarreiraExtra.titularEm(s, t, u, u.pos, 0)) return null;   // já é titular: ele não mexe
        for (const para of TROCAS_POS[u.pos] || []) {
            if (CarreiraExtra.titularEm(s, t, u, para, 3)) {
                return { para, txt: `O time está carente de ${POS_NOME[para].toLowerCase()} e eu te vejo lá. Topa o desafio?`, chance: 0.03 };
            }
        }
        return null;
    },

    async verPosicao(s, x, u) {
        if (u.tid < 0 || u.pos === 'GOL' || x.adapt || x.posPed || x.empr || u.les > 0) return;
        if (s.semana < 2 || s.semana > 40) return;
        if (x.posSem != null && CarreiraExtra.agora(s) - x.posSem < 30) return;
        const sug = CarreiraExtra.sugestao(s, u);
        if (!sug || !U.chance(sug.chance)) return;
        x.posSem = CarreiraExtra.agora(s);
        if (CarreiraExtra.rapido()) {
            // ⏭️ / ⏩ / simular jogos: nada de janela, a pergunta fica na aba Carreira
            // (vale até o fim da temporada; quem não responde fica como está)
            x.posPed = { para: sug.para, txt: sug.txt };
            const txt = `🔀 O técnico quer te ver jogando como ${POS_NOME[sug.para].toLowerCase()}. Responda na aba 📄 Contrato e carreira.`;
            Vida.log(s, txt, '');
            CarreiraExtra.avisar(txt);
            return;
        }
        const i = await UI.perguntar('Mudança de posição?', `🧑‍🏫 "${U.esc(sug.txt)}"<br><br>Você joga de <b>${POS_NOME[u.pos].toLowerCase()}</b>. Na posição nova, as primeiras semanas são de adaptação (você rende um pouco menos) e os seus lances passam a ser outros: ${LANCES_DA_POS[sug.para]}.`,
            [`✅ Topar: virar ${POS_NOME[sug.para].toLowerCase()}`, `🙅 Continuar de ${POS_NOME[u.pos].toLowerCase()}`], '🔀');
        CarreiraExtra.responderTecnico(s, x, u, sug.para, i === 0);
    },

    responderTecnico(s, x, u, para, aceitou) {
        x.posPed = null;
        if (aceitou) {
            CarreiraExtra.clima(s, 10, 0);
            Vida.mudar(s, { felicidade: 2 });
            CarreiraExtra.iniciarAdaptacao(s, x, u, para);
        } else {
            CarreiraExtra.clima(s, -6, 0);
            Vida.log(s, `🙅 Você disse ao técnico que prefere continuar de ${POS_NOME[u.pos].toLowerCase()}. Ele não gostou muito.`, '');
        }
    },

    iniciarAdaptacao(s, x, u, para) {
        const de = u.pos;
        x.posHist = x.posHist || [de];
        if (x.posHist.indexOf(para) < 0) { x.posHist.push(para); Conquistas.contar(s, 'posicoesNovas'); }
        u.pos = para;
        const total = U.int(5, 7);
        x.adapt = { de, para, falta: total, total, desde: CarreiraExtra.agora(s) };
        u.adaptPen = PEN_ADAPT;
        x.posSem = CarreiraExtra.agora(s);
        const t = u.tid >= 0 ? s.times[u.tid] : null;
        const txt = `🔀 Agora você é ${POS_NOME[para].toLowerCase()}! Umas ${total} semanas de adaptação (rendendo um pouco menos em campo) e lances novos: ${LANCES_DA_POS[para]}.`;
        Vida.log(s, txt, 'bom');
        if (t) Mundo.noticia(s, `🔀 ${u.nome} deixa de ser ${POS_NOME[de].toLowerCase()} e vai jogar como ${POS_NOME[para].toLowerCase()} no ${t.nome}.`, 'clube');
        CarreiraExtra.avisar(txt);
    },

    // adaptação semana a semana (jogar acelera; machucado não conta)
    adaptar(s, x, u) {
        const a = x.adapt;
        if (!a) { if (u.adaptPen) delete u.adaptPen; return; }
        if (u.pos !== a.para) { x.adapt = null; delete u.adaptPen; return; }
        if (u.les > 0) return;
        a.falta -= x.jogouEm === CarreiraExtra.agora(s) ? 1.5 : 1;
        if (a.falta <= 0) {
            x.adapt = null;
            delete u.adaptPen;
            const txt = `✅ Adaptação concluída: você já joga de ${POS_NOME[u.pos].toLowerCase()} como se tivesse nascido lá!`;
            Vida.log(s, txt, 'bom');
            CarreiraExtra.avisar(txt);
        } else u.adaptPen = Math.max(1, Math.round(PEN_ADAPT * a.falta / a.total));
    },

    // você pede para mudar (aba Carreira)
    async pedirPosicao(s) {
        const x = CarreiraExtra.estado(s), u = Jogador.p(s);
        const opcoes = TROCAS_POS[u.pos] || [];
        if (u.tid < 0 || !opcoes.length || x.adapt) return;
        const agora = CarreiraExtra.agora(s);
        if (x.posPedJog != null && agora - x.posPedJog < 8) return UI.toast('🔀 Você já falou disso com o técnico há pouco. Espere umas semanas.');
        const t = s.times[u.tid];
        const v = await UI.modal({
            titulo: '🔀 Mudar de posição',
            html: `<p>Você joga de <b>${POS_NOME[u.pos].toLowerCase()}</b>. Para qual posição quer pedir para mudar? O técnico decide (a confiança dele em você e as vagas no time contam).</p>
                <div class="cx-opcoes-pos">${opcoes.map(k => `<div><b>${UI.pos(k)} ${POS_NOME[k]}</b> <small class="cinza">lances: ${LANCES_DA_POS[k]}${CarreiraExtra.titularEm(s, t, u, k, 3) ? ' · <span class="verde">vaga no time</span>' : ''}</small></div>`).join('')}</div>`,
            botoes: opcoes.map(k => ({ txt: `${POS_NOME[k]}`, valor: k, classe: 'btn-opcao' })).concat([{ txt: 'Cancelar', valor: null, classe: 'btn-fantasma' }]),
        });
        if (!v || !POS_NOME[v]) return;
        x.posPedJog = agora;
        const h = CarreiraExtra.hst(s);
        const idade = TROCAS_IDADE[u.pos];
        const ch = U.clamp(0.35 + ((h ? h.tec : 50) - 50) / 100 + (CarreiraExtra.titularEm(s, t, u, v, 3) ? 0.3 : 0)
            + (idade && idade[0] === v && u.idade >= idade[1] - 1 ? 0.2 : 0), 0.1, 0.9);
        if (U.chance(ch)) {
            CarreiraExtra.iniciarAdaptacao(s, x, u, v);
            await UI.aviso('O técnico topou!', `🧑‍🏫 "Vamos tentar. A partir de agora você é ${POS_NOME[v].toLowerCase()}."<br><br>As próximas semanas são de adaptação: você rende um pouco menos até se acostumar.`, '🔀');
        } else {
            CarreiraExtra.clima(s, -2, 0);
            const txt = `🧑‍🏫 O técnico negou: "Eu preciso de você onde você está." (dá para tentar de novo daqui a umas semanas)`;
            Vida.log(s, txt, '');
            await UI.aviso('Pedido negado', txt, '🔀');
        }
    },

    // -----------------------------------------------------------------
    //  🔁 Empréstimo
    // -----------------------------------------------------------------
    async verEmprestimo(s, x, u) {
        if (x.empr || u.tid < 0 || u.les > 0 || u.idade > 33 || !Mundo.emJanela(s)) return false;
        const pedido = !!x.emprPed;
        if (!pedido) {
            if (!CarreiraExtra.quaseNaoJoga(s, x)) return false;
            if (x.emprSem != null && CarreiraExtra.agora(s) - x.emprSem < 12) return false;
            if (!U.chance(0.3)) return false;
        }
        x.emprSem = CarreiraExtra.agora(s);
        x.emprPed = false;
        return CarreiraExtra.ofertaEmprestimo(s, x, u, pedido);
    },

    // clubes menores que garantem vaga (de preferência no mesmo país)
    destinosEmprestimo(s, u, dono, n) {
        let lista = s.times.filter(t => t.liga && !t.selecao && t.id !== dono.id && Mundo.liga(s, t.liga)
            && t.rep <= Math.min(dono.rep - 2, u.ovr) && t.rep >= u.ovr - 13 && t.elenco.length < 30);
        const escolhidos = [];
        while (escolhidos.length < n && lista.length) {
            const t = U.pesado(lista, x => (x.pais === dono.pais ? 3 : 1) * (Mundo.liga(s, x.liga).nivel === 1 ? 1.5 : 1)
                / (1 + Math.abs(x.rep - (u.ovr - 5)) * 0.2));
            escolhidos.push(t);
            lista = lista.filter(x => x !== t);
        }
        return escolhidos;
    },

    async ofertaEmprestimo(s, x, u, pedido) {
        const dono = s.times[u.tid];
        const cands = CarreiraExtra.destinosEmprestimo(s, u, dono, pedido ? 3 : 1);
        if (!cands.length) {
            if (pedido) {
                const txt = '🔁 Nenhum clube se interessou pelo empréstimo nesta janela. Você continua no elenco.';
                Vida.log(s, txt, '');
                CarreiraExtra.avisar(txt);
            }
            return false;
        }
        const desc = t => `${UI.escudo(t)} <b>${U.esc(t.nome)}</b> <small class="cinza">(${U.esc(Mundo.liga(s, t.liga).curto)}, ${Mundo.posicaoNaLiga(s, t.id)}º · força ${UI.ovr(Math.round(Mundo.forca(s, t)))})</small>`;
        const regra = `Até o fim da temporada, com <b>vaga garantida no time titular</b>. O contrato e o salário continuam com o ${U.esc(dono.nome)}, e você volta para lá no fim do ano.`;
        let i, dest = null;
        if (pedido) {
            i = await UI.perguntar('Opções de empréstimo', `O ${U.esc(dono.nome)} topou te emprestar. Estes clubes querem você:<div class="cx-opcoes-pos">${cands.map(t => `<div>${desc(t)}</div>`).join('')}</div>${regra}`,
                cands.map(t => `🔁 ${U.esc(t.nome)}`).concat(['❌ Desistir e ficar']), '🔁');
            dest = cands[i] || null;
        } else {
            const motivo = x.semJogar >= 4 ? `${x.semJogar} jogos seguidos sem entrar em campo` : `só ${x.jj} jogos de ${x.jt} na temporada`;
            i = await UI.perguntar('Proposta de empréstimo', `Você quase não tem jogado (${motivo}). O ${U.esc(dono.nome)} acha que você precisa de minutos e quer te emprestar ao ${desc(cands[0])}.<br><br>${regra}`,
                ['✅ Aceitar o empréstimo', '❌ Ficar e brigar por posição'], '🔁');
            dest = i === 0 ? cands[0] : null;
        }
        if (!dest) {
            Vida.log(s, `🔁 Você preferiu ficar no ${dono.nome} e brigar por espaço.`, '');
            return true;
        }
        CarreiraExtra.emprestar(s, x, u, dono, dest);
        return true;
    },

    emprestar(s, x, u, dono, dest) {
        const h = CarreiraExtra.hst(s);
        x.empr = { de: dono.id, deNome: dono.nome, para: dest.id, paraNome: dest.nome, ano: s.ano, desde: CarreiraExtra.agora(s), tec: h ? h.tec : 50, j: 0, g: 0, ns: 0 };
        // sai do elenco do dono sem taxa nem contrato novo: o vínculo continua com ele
        dono.elenco = dono.elenco.filter(id => id !== u.id);
        if (dono.tit) dono.tit = dono.tit.map(id => (id === u.id ? null : id));
        dest.elenco.push(u.id);
        u.tid = dest.id;
        s.car.pedirTransf = false;
        if (s.car.clubes && s.car.clubes[s.car.clubes.length - 1] !== dest.id) s.car.clubes.push(dest.id);
        if (h) { h.tec = 62; Historia.clampClima(h); }   // técnico novo, que pediu você
        x.semJogar = 0;
        CarreiraExtra.garantirMinutos(s, x, u);
        Conquistas.contar(s, 'emprestimos');
        const txt = `🔁 Emprestado! Você vai jogar no ${dest.nome} até o fim da temporada, com vaga garantida. O ${dono.nome} continua pagando o seu salário.`;
        Vida.log(s, txt + Vida.mudar(s, { felicidade: 4 }), 'bom');
        Mundo.noticia(s, `🔁 ${dono.nome} empresta ${u.nome} ao ${dest.nome} até o fim da temporada.`, 'transfer');
        CarreiraExtra.avisar(txt);
    },

    // vaga garantida: o técnico do clube do empréstimo escala você
    garantirMinutos(s, x, u) {
        if (!x.empr || u.tid !== x.empr.para) return;
        u.bonusEscala = Math.max(u.bonusEscala || 0, 10);
        u.bonusEscalaSem = Math.max(u.bonusEscalaSem || 0, 2);
    },

    // fim da temporada: volta para o clube dono
    fimEmprestimo(s, x, u) {
        const e = x.empr;
        if (!e) return;
        x.empr = null;
        const dono = s.times[e.de];
        if (!dono) return;
        if (u.tid >= 0 && u.tid !== e.de && s.times[u.tid]) {
            const t = s.times[u.tid];
            t.elenco = t.elenco.filter(id => id !== u.id);
            if (t.tit) t.tit = t.tit.map(id => (id === u.id ? null : id));
        }
        if (dono.elenco.indexOf(u.id) < 0) dono.elenco.push(u.id);
        u.tid = dono.id;
        if ((u.bonusEscala || 0) > 0) { u.bonusEscala = 0; u.bonusEscalaSem = 0; }
        // a linha da temporada no histórico fica marcada como empréstimo
        const hh = s.car.hist[s.car.hist.length - 1];
        if (hh && hh.ano === e.ano && hh.time === e.paraNome) hh.time += ' (emp.)';
        const nota = e.j ? e.ns / e.j : 0;
        const bom = e.j >= 8 && nota >= 6.7;
        const h = CarreiraExtra.hst(s);
        if (h) { h.tec = bom ? Math.max(e.tec, 66) : e.tec; Historia.clampClima(h); }
        let txt = `🔁 Fim do empréstimo: você volta ao ${dono.nome} depois de ${e.j} jogo(s) e ${e.g} gol(s) pelo ${e.paraNome}${e.j ? ` (nota ${nota.toFixed(2).replace('.', ',')})` : ''}.`;
        if (bom) {
            Conquistas.contar(s, 'emprestimosBons');
            txt += ` O técnico acompanhou tudo e vai te dar mais chances!${Vida.mudar(s, { fama: 2, felicidade: 4 })}`;
        } else txt += ' Agora é brigar por espaço de novo.';
        Vida.log(s, txt, bom ? 'bom' : '');
        Mundo.noticia(s, `🔁 ${u.nome} volta ao ${dono.nome} depois do empréstimo ao ${e.paraNome}.`, 'transfer');
        UI.toast(txt);
        x.semJogar = 0;
    },

    // -----------------------------------------------------------------
    //  🌴 Aposentadoria dourada (MLS e Liga MX)
    // -----------------------------------------------------------------
    async verDourada(s, x, u) {
        if (u.idade < 32 || x.empr || x.dourAno === s.ano) return false;
        const liga = u.tid >= 0 ? s.times[u.tid].liga : null;
        if (liga === 'USA1' || liga === 'MEX1') return false;
        const livre = u.tid < 0;
        if (!livre && !Mundo.emJanela(s)) return false;
        if (u.ovr < 68 && s.pessoa.fama < 30) return false;   // só para quem tem nome ou bola
        const ch = livre ? 0.08 : 0.018 + s.pessoa.fama / 2500 + (u.ovr >= 78 ? 0.012 : 0);
        if (!U.chance(ch)) return false;
        x.dourAno = s.ano;
        return CarreiraExtra.ofertaDourada(s, x, u);
    },

    async ofertaDourada(s, x, u) {
        const ligas = ['USA1', 'MEX1'].map(id => Mundo.liga(s, id)).filter(Boolean);
        const times = [].concat.apply([], ligas.map(l => l.times)).map(id => s.times[id])
            .filter(t => t && t.id !== u.tid).sort((a, b) => b.rep - a.rep).slice(0, 10);
        if (!times.length) return false;
        const dest = U.escolha(times);
        const liga = Mundo.liga(s, dest.liga);
        const atual = u.tid >= 0 ? s.times[u.tid] : null;
        // bem acima do que a liga paga (um titular de lá ganha uns € 150–500 mil por ano)
        const base = Math.max(u.sal * U.rand(2.2, 3.4), 8e5 + s.pessoa.fama * 4e4 + Math.max(0, u.ovr - 62) * 1.5e5);
        let sal = U.redondo(Historia.salario(s, base));   // historia: empresário negociador
        const anos = u.idade >= 35 ? 1 : U.int(2, 3);
        const taxa = atual && u.contr > 1 ? U.redondo(Mundo.valor(u) * 0.8) : 0;
        const ficha = () => `<div class="ficha">
            <div><span>Salário</span><b>${U.dinheiro(sal)}/ano${u.sal > 0 && atual ? ` (${(sal / u.sal).toFixed(1).replace('.', ',')}× o atual)` : ''}</b></div>
            <div><span>Luvas na assinatura</span><b>${U.dinheiro(U.redondo(sal * 0.3))}</b></div>
            <div><span>Contrato</span><b>${anos} ano${anos > 1 ? 's' : ''}</b></div>
            ${taxa ? `<div><span>Taxa ao seu clube</span><b>${U.dinheiro(taxa)}</b></div>` : ''}
        </div>`;
        let i = await UI.perguntar('🌴 Aposentadoria dourada?', `O <b>${U.esc(dest.nome)}</b> (${U.esc(liga.nome)}) quer fazer de você a grande estrela do time — e paga uma fortuna por isso!${ficha()}
            <p class="cinza pequeno">🌴 Vida boa, praia e a conta cheia (mais felicidade toda semana)... mas lá você aparece bem menos na TV: a fama cai aos poucos e a seleção fica mais longe.</p>`,
        ['🌴 Aceitar os milhões', '💬 Pedir ainda mais', '⚽ Recusar: quero o futebol de ponta'], '💰');
        if (i === 1) {
            if (U.chance(0.55 + Historia.bonusPedido(s))) {
                sal = U.redondo(sal * 1.2);
                await UI.aviso('Fechado!', `O ${U.esc(dest.nome)} subiu para ${U.dinheiro(sal)}/ano. Vamos pra praia! 🌴`, '🤑');
                i = 0;
            } else {
                const k = await UI.perguntar('Proposta mantida', `O ${U.esc(dest.nome)} não subiu a oferta, mas ela continua de pé:${ficha()}`, ['🌴 Aceitar assim mesmo', '⚽ Recusar'], '💰');
                i = k === 0 ? 0 : 2;
            }
        }
        if (i !== 0) {
            const txt = `⚽ Você recusou os milhões do ${dest.nome}: ainda quer brilhar no futebol de ponta.${Vida.mudar(s, { fama: 1.5, felicidade: -1 })}`;
            Vida.log(s, txt, '');
            Mundo.noticia(s, `⚽ ${u.nome} recusa proposta milionária do ${dest.nome}.`, 'transfer');
            return true;
        }
        const luvas = U.redondo(sal * 0.3);
        Mundo.transferir(s, u, dest, taxa);
        u.sal = sal;
        u.contr = anos;
        s.car.pedirTransf = false;
        s.car.vaiSair = false;
        s.car.clubes.push(dest.id);
        Historia.aoTransferir(s, atual, dest, sal);   // historia: luvas do negociador, metas e rival
        x.dour = { tid: dest.id, ano: s.ano };
        Conquistas.contar(s, 'douradas');
        Conquistas.maximo(s, 'maiorVenda', taxa);
        Vida.log(s, `🌴 APOSENTADORIA DOURADA! Você assinou com o ${dest.nome} por ${U.dinheiro(sal)}/ano e ganhou ${U.dinheiro(luvas)} de luvas.${Vida.mudar(s, { felicidade: 10, fama: -5, dinheiro: luvas })}`, 'bom');
        Mundo.noticia(s, `🌴 ${u.nome} troca ${atual ? `o ${atual.nome}` : 'o mercado'} pelo ${dest.nome} num contrato milionário.`, 'transfer');
        await Jogador.cenaNovoClube(s, dest, 'Aposentadoria dourada: sol, praia e milhões na conta! 🌴');
        return true;
    },

    // a vida boa: mais felicidade e menos fama toda semana
    vidaDourada(s, x, u) {
        if (!x.dour) return;
        if (u.tid !== x.dour.tid) { x.dour = null; return; }
        Vida.mudar(s, { felicidade: 0.3, fama: -0.12 });
    },

    // -----------------------------------------------------------------
    //  🏟️ Lenda do clube
    // -----------------------------------------------------------------
    titulosNoClube(s, nome) {
        const fim = '(' + nome + ')';
        return s.pessoa.trofeus.filter(x => typeof x.txt === 'string' && x.txt.slice(-fim.length) === fim).length;
    },

    // lista dos clubes da carreira: { tid, nome, j, g, a, tit, anos, pts, nivel }
    lendasAtuais(s) {
        const x = CarreiraExtra.estado(s);
        return Object.keys(x.clubes).map(k => {
            const c = x.clubes[k], tit = CarreiraExtra.titulosNoClube(s, c.nome);
            const pts = c.j + c.g * 2 + c.a + tit * 30 + c.anos.length * 10;
            let nivel = 0;
            for (let n = 3; n >= 1; n--) if (pts >= NIVEIS_LENDA[n].min && c.j >= NIVEIS_LENDA[n].jogos) { nivel = n; break; }
            return { tid: +k, nome: c.nome, j: c.j, g: c.g, a: c.a, tit, anos: c.anos.length, pts, nivel };
        }).filter(l => l.j > 0).sort((a, b) => b.nivel - a.nivel || b.pts - a.pts);
    },

    rotuloLenda(l) {
        const n = NIVEIS_LENDA[l.nivel];
        return n ? `${n.icone} ${n.nome}` : '';
    },

    // aposentadoria (gancho em Jogador.aposentar): homenagens e jogo de despedida.
    // Devolve true se teve a festa (que já tem o "obrigado" da torcida)
    async aoAposentar(s) {
        if (s.modo !== 'jogador' || !s.car || s.car.pid == null) return false;
        const u = Jogador.p(s), x = CarreiraExtra.estado(s);
        x.empr = null; x.dour = null; x.adapt = null; x.posPed = null;
        delete u.adaptPen;
        const lendas = CarreiraExtra.lendasAtuais(s).filter(l => l.nivel > 0);
        s.pessoa.lendas = lendas.map(l => ({ tid: l.tid, nome: l.nome, nivel: l.nivel, j: l.j, g: l.g, tit: l.tit, anos: l.anos, camisa: s.car.camisa, ano: s.ano }));
        for (const l of lendas) {
            const txt = l.nivel >= 3 ? `🗿 O ${l.nome} vai erguer uma ESTÁTUA sua na frente do estádio!`
                : l.nivel === 2 ? `👕 O ${l.nome} aposentou a camisa ${s.car.camisa} em sua homenagem!`
                    : `🏛️ O ${l.nome} colocou você no Hall da Fama do clube!`;
            const noticia = l.nivel >= 3 ? `🗿 ${l.nome} vai erguer uma estátua de ${u.nome} na frente do estádio.`
                : l.nivel === 2 ? `👕 ${l.nome} aposenta a camisa ${s.car.camisa} de ${u.nome}.`
                    : `🏛️ ${u.nome} entra para o Hall da Fama do ${l.nome}.`;
            Vida.log(s, `${txt} (${l.j} jogos, ${l.g} gols, ${l.tit} título(s))`, 'titulo');
            Mundo.noticia(s, noticia, 'geral');
            Conquistas.contar(s, 'lendas');
            Conquistas.maximo(s, 'lendaMax', l.nivel);
        }
        if (!lendas.length) { Conquistas.verificar(s); return false; }
        const l = lendas[0], t = s.times[l.tid];
        const i = await UI.perguntar('🎉 Jogo de despedida', `O <b>${U.esc(t.nome)}</b> quer fazer um jogo de despedida em sua homenagem: estádio lotado, amigos, ídolos do clube e muita festa.<br><br>Homenagem do clube: <b>${CarreiraExtra.rotuloLenda(l)}</b> (${l.j} jogos, ${l.g} gols, ${l.tit} título(s)).`,
            ['🎉 Topar a festa', '🙏 Sair sem festa'], '🏟️');
        if (i !== 0) {
            Vida.log(s, `🙏 Você agradeceu, mas preferiu se despedir do ${t.nome} sem festa.`, '');
            Conquistas.verificar(s);
            return false;
        }
        await CarreiraExtra.cenaDespedida(s, t, l);
        Conquistas.contar(s, 'despedidas');
        Vida.log(s, `🎉 Jogo de despedida no ${t.nome}: estádio lotado, gol no fim e a torcida cantando o seu nome.${Vida.mudar(s, { fama: 3 + l.nivel * 2, felicidade: 15 })}`, 'titulo');
        Mundo.noticia(s, `🎉 Festa no estádio: ${u.nome} faz o jogo de despedida no ${t.nome}.`, 'geral');
        Conquistas.verificar(s);
        return true;
    },

    cenaDespedida(s, t, l) {
        const u = Jogador.p(s);
        const nome1 = U.esc(u.nome.split(' ')[0]), prim = nome1.toUpperCase();
        const comemora = U.esc(String(s.car.comemoracao || 'Correr para a torcida').toLowerCase());
        const cores = [t.c1, t.c2, '#ffd700', '#ffffff'];
        const n = NIVEIS_LENDA[l.nivel];
        return Cena.mostrar([
            {
                fundo: `radial-gradient(ellipse at 50% 120%, ${t.c1} 0%, #05070c 70%)`, classe: 'cs-estadio', auto: 2600, som: 'torcida',
                html: `<div class="holofotes"><i></i><i></i></div><div class="flashes">${'<i></i>'.repeat(12)}</div>
                    <div class="cena-mini">🏟️ Estádio lotado</div>
                    <div class="cena-titulo">JOGO DE DESPEDIDA</div>
                    <div class="cena-sub">${prim} e amigos x Lendas do ${U.esc(t.nome)}</div>`,
            },
            {
                fundo: `radial-gradient(circle at 50% 42%, ${t.c1} 0%, #05070c 72%)`, classe: 'cs-escudo', som: 'gol', confete: cores,
                html: `<div class="raios"></div><div class="icone-grande">⚽</div>
                    <div class="cena-titulo">O ÚLTIMO GOL!</div>
                    <div class="cena-sub">No último minuto, ${nome1} marca, faz a comemoração de sempre (${comemora}) e o estádio inteiro canta o seu nome.</div>`,
            },
            {
                fundo: `linear-gradient(160deg, ${t.c1} 0%, #0b1220 62%)`, classe: 'cs-info',
                html: `${Cena.camisa(t, u.nome, s.car.camisa)}
                    ${Cena.cartao([['Jogos pelo clube', l.j], ['Gols', l.g], ['Títulos', l.tit], ['Temporadas', l.anos], ['Homenagem', `${n.icone} ${n.nome}`]])}
                    <div class="cena-sub">${l.nivel >= 2 ? `A camisa ${s.car.camisa} nunca mais será usada no ${U.esc(t.nome)}.` : `Seu nome agora está no Hall da Fama do ${U.esc(t.nome)}.`}</div>`,
            },
            {
                fundo: 'radial-gradient(circle at 50% 40%, #6b5200 0%, #05070c 70%)', classe: 'cs-simples', som: 'titulo', confete: ['#ffd700', '#fff3b0', '#ffffff', t.c1],
                html: `<div class="icone-grande">${l.nivel >= 3 ? '🗿' : '👋'}</div><div class="cena-titulo brilho">OBRIGADO, ${prim}!</div>
                    <div class="cena-sub">${l.nivel >= 3 ? 'Uma estátua sua vai ficar para sempre na frente do estádio.' : 'A torcida aplaude de pé.'}</div>`,
            },
        ]);
    },

    // "🏟️ Ídolo em: ..." (perfil, resumo da aposentadoria e fim da vida)
    idolos(s) {
        const ps = s.pessoa;
        if (ps.lendas && ps.lendas.length) return ps.lendas;
        return CarreiraExtra.ativo(s) ? CarreiraExtra.lendasAtuais(s).filter(l => l.nivel > 0) : [];
    },

    htmlPerfil(s) {
        const ls = CarreiraExtra.idolos(s);
        if (!ls.length) return '';
        return `<div class="pequeno cx-idolo">🏟️ Ídolo em: ${ls.slice(0, 3).map(l => `<b>${U.esc(l.nome)}</b> ${NIVEIS_LENDA[l.nivel].icone}`).join(', ')}</div>`;
    },

    textoIdolo(s) {
        const ls = CarreiraExtra.idolos(s);
        if (!ls.length) return '';
        return `<br><br>🏟️ Ídolo em: ${ls.map(l => `<b>${U.esc(l.nome)}</b> (${CarreiraExtra.rotuloLenda(l)})`).join(', ')}.`;
    },

    // -----------------------------------------------------------------
    //  🔥 Polêmicas: continuações (só diário e aviso rápido, sem janela)
    // -----------------------------------------------------------------
    agendar(s, tipo, sub, semanas) {
        CarreiraExtra.estado(s).pend.push({ tipo, sub, quando: CarreiraExtra.agora(s) + semanas });
    },
    temPend(s, tipo) {
        const x = s.car && s.car.cx;
        return !!(x && x.pend && x.pend.some(p => p.tipo === tipo));
    },

    pendencias(s, x) {
        const agora = CarreiraExtra.agora(s);
        const prontas = x.pend.filter(p => p.quando <= agora);
        if (!prontas.length) return;
        x.pend = x.pend.filter(p => p.quando > agora);
        for (const pd of prontas) {
            const txt = CarreiraExtra.resolverPend(s, pd);
            if (!txt) continue;
            Vida.log(s, txt, 'evento');
            CarreiraExtra.avisar(txt);
        }
    },

    resolverPend(s, pd) {
        const u = Jogador.p(s), e = s.car.emp;
        const ajuda = e ? ` ${e.nome}, o seu empresário, cuidou da imprensa.` : '';
        if (pd.tipo === 'apostas') {
            if (pd.sub === 'colabora') {
                if (U.chance(0.92)) { CarreiraExtra.clima(s, 1, 4); return `✅ Caso das apostas arquivado: você foi inocentado e a imprensa pediu desculpas.${ajuda}${Vida.mudar(s, { fama: e ? 3 : 2, felicidade: 5 })}`; }
                const v = U.redondo(Math.max(5000, u.sal * 0.03));
                return `⚖️ A investigação achou apostas de um primo seu usando a sua conta. Você não foi punido, mas pagou multa de ${U.dinheiro(v)}.${Vida.mudar(s, { dinheiro: -v, fama: -3, felicidade: -4 })}`;
            }
            if (pd.sub === 'advogado') {
                if (U.chance(0.8)) return `✅ O advogado conseguiu arquivar o caso das apostas.${Vida.mudar(s, { felicidade: 3 })}`;
                u.susp = Math.max(u.susp, 3);
                CarreiraExtra.clima(s, -3, -3);
                return `🟥 A federação te suspendeu por 3 jogos por "falta de colaboração" no caso das apostas.${Vida.mudar(s, { fama: -4, felicidade: -5 })}`;
            }
            if (U.chance(0.55)) {
                const g = CarreiraExtra.ganharSeg(s, 0.03);
                return `📰 O site das apostas se retratou publicamente: você saiu por cima (+${g} seguidores)!${ajuda}${Vida.mudar(s, { fama: 3, felicidade: 4 })}`;
            }
            const v = U.redondo(Math.max(10000, u.sal * 0.04));
            CarreiraExtra.clima(s, -2, 0);
            return `⚖️ O site te processou por difamação e você fechou um acordo de ${U.dinheiro(v)}.${Vida.mudar(s, { dinheiro: -v, felicidade: -3 })}`;
        }
        if (pd.tipo === 'doping') {
            if (U.chance(0.88)) {
                CarreiraExtra.clima(s, 2, 3);
                return `🧪 A contraprova deu NEGATIVO: era erro do laboratório e você está liberado!${ajuda}${Vida.mudar(s, { fama: 3, felicidade: 6 })}`;
            }
            u.susp = Math.max(u.susp, 4);
            CarreiraExtra.clima(s, -3, -5);
            return `🧪 A contraprova confirmou: era um remédio de gripe proibido. Suspensão de 4 jogos.${Vida.mudar(s, { fama: -6, felicidade: -6 })}`;
        }
        return '';
    },

    companheiro(s) {
        const u = Jogador.p(s);
        const el = Mundo.elenco(s, s.times[u.tid]).filter(p => !p.user);
        const mesmo = el.filter(p => POS_GRUPO[p.pos] !== POS_GRUPO[u.pos]);   // quem dá a entrada é de outro setor
        return U.escolha(mesmo.length ? mesmo : el) || null;
    },

    // pancada do treino (às vezes tira você de uma semana)
    pancada(s) {
        const u = Jogador.p(s);
        if (u.les > 0 || !U.chance(0.15)) return '';
        u.les = U.int(1, 2);
        return ` A pancada ainda te deixou ${u.les} semana(s) fora. 🚑`;
    },

    rivalDoClube(s, t) {
        const pares = (DADOS.rivais || []).filter(r => r[0] === t.nome || r[1] === t.nome);
        if (!pares.length) return 'maior rival';
        const par = U.escolha(pares);
        return par[0] === t.nome ? par[1] : par[0];
    },

    // -----------------------------------------------------------------
    //  🏅 Prêmios extras (gancho em Mundo.fimDeTemporada, os dois modos)
    // -----------------------------------------------------------------
    premiosTemporada(s, resumo) {
        const ligaDe = {};
        for (const l of s.ligas) ligaDe[l.id] = l;
        const ativos = [];
        for (const id in s.jog) {
            const p = s.jog[id];
            if (p.tid < 0 || !p.j) continue;
            const t = s.times[p.tid];
            const liga = t && t.liga ? ligaDe[t.liga] : null;
            if (liga) ativos.push({ p, liga });
        }
        const extras = [CarreiraExtra.chuteira(s, ativos), CarreiraExtra.puskas(s, ativos)].filter(Boolean);
        for (const pr of extras) {
            const reg = { ano: pr.ano, tipo: pr.tipo, pid: pr.pid, nome: pr.nome, tid: pr.tid, info: pr.info };
            s.premios.push(reg);
            resumo.premios.push(reg);
        }
        // Seleção da Temporada: o mundo e a liga do usuário
        const meu = s.modo === 'jogador' ? (s.car && s.jog[s.car.pid] ? s.jog[s.car.pid].tid : -1) : (s.car && s.car.tid != null ? s.car.tid : -1);
        const lm = meu >= 0 && s.times[meu] && s.times[meu].liga ? ligaDe[s.times[meu].liga] : null;
        const mundo = CarreiraExtra.selecao(ativos, null);
        const xiLiga = lm ? CarreiraExtra.selecao(ativos, lm) : null;
        resumo.selecao = { mundo, liga: xiLiga ? { id: lm.id, nome: lm.nome, curto: lm.curto, nivel: lm.nivel, xi: xiLiga } : null };
        s.selTemp = { ano: s.ano, mundo: resumo.selecao.mundo, liga: resumo.selecao.liga };
        CarreiraExtra.notaTecnico(s, resumo, extras);
    },

    // Chuteira de Ouro: gols × peso da liga (como a europeia: as 5 grandes valem 2)
    chuteira(s, ativos) {
        const peso = l => (l.nivel === 1 ? (l.riqueza >= 1 ? 2 : 1.5) : l.nivel === 2 ? 1 : 0.75);
        let best = null;
        for (const x of ativos) {
            if (x.p.g < 5) continue;
            const pts = x.p.g * peso(x.liga);
            if (!best || pts > best.pts || (pts === best.pts && x.p.g > best.x.p.g)) best = { x, pts };
        }
        if (!best) return null;
        const p = best.x.p;
        return { ano: s.ano, tipo: 'Chuteira de Ouro', pid: p.id, nome: p.nome, tid: p.tid, info: `${p.g} gols na ${best.x.liga.curto} (${String(best.pts).replace('.', ',')} pontos)` };
    },

    // Prêmio Puskás: o golaço mais bonito da temporada (s.golacos, de js/partidaExtras.js)
    puskas(s, ativos) {
        const G = typeof GOLACOS !== 'undefined' ? GOLACOS : {};
        const tipoDe = txt => {
            for (const k in G) if (String(txt).indexOf(`${G[k].icone} ${G[k].nome}`) === 0) return k;
            return null;
        };
        let cands = (s.golacos || []).filter(g => g.ano === s.ano && s.jog[g.pid]).map(g => {
            const autor = s.jog[g.pid];
            return { pid: g.pid, nome: g.nome, tid: g.tid >= 0 && s.times[g.tid] ? g.tid : autor.tid, txt: g.txt,
                v: (PESO_GOLACO[tipoDe(g.txt)] || 6) * U.rand(0.75, 1.25) + Math.max(0, autor.ovr - 70) * 0.05 };
        });
        if (!cands.length) {
            // sem a lista de golaços (save antigo): um golaço plausível entre os goleadores
            const goleadores = ativos.filter(x => x.p.g >= 6 && x.p.pos !== 'GOL');
            const tipos = Object.keys(G).filter(k => k !== 'olimpico');
            for (let i = 0; i < 3 && goleadores.length && tipos.length; i++) {
                const x = U.pesado(goleadores, y => y.p.g * Math.pow(y.p.ovr / 70, 3));
                goleadores.splice(goleadores.indexOf(x), 1);
                const k = U.escolha(tipos);
                cands.push({ pid: x.p.id, nome: x.p.nome, tid: x.p.tid, txt: `${G[k].icone} ${G[k].nome} · pelo ${s.times[x.p.tid].nome}`, v: (PESO_GOLACO[k] || 6) * U.rand(0.75, 1.25) });
            }
        }
        if (!cands.length) return null;
        cands.sort((a, b) => b.v - a.v);
        const finalistas = [];
        for (const c of cands) if (finalistas.length < 3 && !finalistas.some(f => f.pid === c.pid)) finalistas.push({ pid: c.pid, nome: c.nome, tid: c.tid, txt: c.txt });
        const w = finalistas[0];
        return { ano: s.ano, tipo: 'Prêmio Puskás', pid: w.pid, nome: w.nome, tid: w.tid, info: w.txt, finalistas };
    },

    // os 11 melhores da temporada (liga = null: o mundo todo, com peso da liga)
    selecao(ativos, liga) {
        const pool = ativos.filter(x => (liga ? x.liga === liga && x.p.j >= 10 : x.p.j >= 14));
        const val = x => {
            const p = x.p, gr = POS_GRUPO[p.pos];
            let v = p.ovr + (p.ns / p.j - 6.5) * 7;
            v += gr === 'A' ? p.g * 0.3 + p.a * 0.12 : gr === 'M' ? p.g * 0.25 + p.a * 0.25 : gr === 'D' ? p.g * 0.2 + p.a * 0.15 : 0;
            if (!liga) v += -(x.liga.nivel - 1) * 8 + (x.liga.riqueza - 1) * 2;
            return v;
        };
        const ord = pool.map(x => ({ p: x.p, v: val(x) })).sort((a, b) => b.v - a.v);
        const usados = new Set(), xi = [];
        for (const pos of XI_TEMPORADA) {
            const e = ord.find(o => !usados.has(o.p.id) && o.p.pos === pos)
                || ord.find(o => !usados.has(o.p.id) && pos !== 'GOL' && o.p.pos !== 'GOL' && POS_GRUPO[o.p.pos] === POS_GRUPO[pos]);
            if (!e) return null;
            usados.add(e.p.id);
            xi.push({ pos, pid: e.p.id, nome: e.p.nome, tid: e.p.tid, nota: Math.round(e.p.ns / e.p.j * 100) / 100 });
        }
        return xi;
    },

    // técnico: aviso quando um jogador do seu time ganha (e motivação lá em cima)
    notaTecnico(s, resumo, extras) {
        if (s.modo !== 'tecnico' || !s.car || s.car.tid == null || s.car.tid < 0) return;
        const tid = s.car.tid;
        for (const pr of extras) {
            if (pr.tid !== tid) continue;
            const p = s.jog[pr.pid];
            if (p) Mot.mudar(p, 8);
            Vida.log(s, `🏅 ${pr.nome}, do seu time, ganhou o prêmio ${pr.tipo}! (${pr.info})`, 'bom');
        }
        const sel = resumo.selecao;
        const doTime = xi => (xi || []).filter(e => e.tid === tid);
        const nm = doTime(sel.mundo), nl = sel.liga ? doTime(sel.liga.xi) : [];
        for (const e of nm.concat(nl)) if (s.jog[e.pid]) Mot.mudar(s.jog[e.pid], 3);
        if (nm.length) Vida.log(s, `⭐ Na Seleção da Temporada do mundo: ${nm.map(e => e.nome).join(', ')}, do seu time!`, 'bom');
        if (nl.length) Vida.log(s, `⭐ Na Seleção da ${sel.liga.curto}: ${nl.map(e => e.nome).join(', ')}, do seu time.`, '');
    },

    // jogador: troféu e recompensa quando entra na Seleção da Temporada
    premiosSelecao(s, resumo, u) {
        const sel = resumo && resumo.selecao;
        if (!sel) return;
        const esta = xi => !!(xi && xi.some(e => e.pid === u.id));
        if (esta(sel.mundo)) {
            s.pessoa.trofeus.push({ ano: resumo.ano, txt: 'Seleção da Temporada (Mundo)' });
            s.car.pontos = (s.car.pontos || 0) + 1;
            Conquistas.contar(s, 'selecaoMundo');
            const txt = `⭐ Você está na SELEÇÃO DA TEMPORADA do mundo! (+1 ponto de habilidade)`;
            Vida.log(s, txt + Vida.mudar(s, { fama: 4, felicidade: 8 }), 'titulo');
            UI.toast(txt);
        }
        if (sel.liga && esta(sel.liga.xi)) {
            s.pessoa.trofeus.push({ ano: resumo.ano, txt: `Seleção da ${sel.liga.curto}` });
            Conquistas.contar(s, 'selecaoLiga');
            const txt = `⭐ Você entrou na Seleção da ${sel.liga.curto} da temporada!`;
            Vida.log(s, txt + Vida.mudar(s, { fama: sel.liga.nivel === 1 ? 2 : 1, felicidade: 4 }), 'bom');
            UI.toast(txt);
        }
    },

    // fim da temporada do jogador (gancho em Jogador.depoisFimTemporada, antes do contrato)
    async depoisFimTemporada(s, resumo) {
        if (!CarreiraExtra.ativo(s)) return;
        const x = CarreiraExtra.estado(s), u = Jogador.p(s);
        CarreiraExtra.premiosSelecao(s, resumo, u);
        CarreiraExtra.fimEmprestimo(s, x, u);
        x.semJogar = 0;
        if (x.posPed) x.posPed = null;
    },

    // -----------------------------------------------------------------
    //  Telas
    // -----------------------------------------------------------------
    ehMeu(s, pid, tid) {
        if (s.modo === 'jogador') return !!s.car && pid === s.car.pid;
        return !!s.car && s.car.tid != null && s.car.tid >= 0 && tid === s.car.tid;
    },

    nomeTime(s, tid) { return tid >= 0 && s.times[tid] ? s.times[tid].nome : ''; },

    // slide extra no fim da temporada (gancho em Cena.temporada)
    slideTemporada(s, r) {
        const extras = r.premios.filter(p => p.tipo === 'Chuteira de Ouro' || p.tipo === 'Prêmio Puskás');
        const sel = r.selecao;
        if (!extras.length && !(sel && sel.mundo)) return null;
        const card = (p, i) => `<div class="premio ${CarreiraExtra.ehMeu(s, p.pid, p.tid) ? 'meu' : ''}" style="animation-delay:${0.2 + i * 0.18}s">
            <span class="pr-icone">${p.tipo === 'Chuteira de Ouro' ? '👟' : '🎆'}</span><small>${U.esc(p.tipo)}</small><b>${U.esc(p.nome)}</b>
            <span class="cinza">${U.esc(CarreiraExtra.nomeTime(s, p.tid))}${p.tipo === 'Prêmio Puskás' ? ` · ${U.esc(String(p.info).split(' · ')[0])}` : ` · ${U.esc(p.info)}`}</span></div>`;
        let minha = '';
        if (sel && sel.liga) {
            const meus = sel.liga.xi.filter(e => CarreiraExtra.ehMeu(s, e.pid, e.tid));
            if (meus.length) minha = `<div class="cx-xi-minha">⭐ ${s.modo === 'jogador' ? 'Você está' : `${meus.length} do seu time ${meus.length > 1 ? 'estão' : 'está'}`} na Seleção da ${U.esc(sel.liga.curto)}!</div>`;
        }
        return {
            fundo: 'radial-gradient(circle at 50% 22%, #0f4d2e 0%, #05070c 72%)', classe: 'cs-premios cx-cena-xi', som: 'conquista',
            html: `<div class="cena-mini">🌟 Mais prêmios de ${r.ano}</div>
                ${extras.length ? `<div class="grade-premios cx-grade-extras">${extras.map(card).join('')}</div>` : ''}
                ${sel && sel.mundo ? `<div class="cx-xi-tit">⭐ Seleção da Temporada</div>${CarreiraExtra.campinho(s, sel.mundo)}` : ''}${minha}`,
        };
    },

    campinho(s, xi) {
        return `<div class="cx-campinho">${XI_LINHAS.map((linha, k) => `<div class="cx-xi-linha">${linha.map((i, n) => {
            const e = xi[i], t = s.times[e.tid];
            return `<div class="cx-xi-jog ${CarreiraExtra.ehMeu(s, e.pid, e.tid) ? 'meu' : ''}" style="animation-delay:${0.3 + (k * 3 + n) * 0.06}s">${UI.pos(e.pos)}<b>${U.esc(e.nome.split(' ').slice(-1)[0])}</b><small>${t ? U.esc(t.sigla) : ''}</small></div>`;
        }).join('')}</div>`).join('')}</div>`;
    },

    // resumo sem cutscene (gancho em Jogo.mostrarResumoTemporada)
    htmlResumo(s, r) {
        // (o que já apareceu na lista de prêmios do resumo não se repete)
        const ja = r.premios.slice(0, 6);
        const extras = r.premios.filter(p => (p.tipo === 'Chuteira de Ouro' || p.tipo === 'Prêmio Puskás') && ja.indexOf(p) < 0);
        const sel = r.selecao;
        if (!extras.length && !(sel && sel.mundo)) return '';
        const nomeXi = xi => xi.map(e => `${CarreiraExtra.ehMeu(s, e.pid, e.tid) ? '<b class="verde">' : ''}${U.esc(e.nome)}${CarreiraExtra.ehMeu(s, e.pid, e.tid) ? '</b>' : ''}`).join(', ');
        return `<h4>🌟 Mais prêmios</h4>${extras.map(p => `<div class="rs-linha">${p.tipo === 'Chuteira de Ouro' ? '👟' : '🎆'} ${U.esc(p.tipo)}: <b>${U.esc(p.nome)}</b> ${p.tid >= 0 && s.times[p.tid] ? `(${U.esc(s.times[p.tid].nome)})` : ''} — ${U.esc(p.info)}</div>`).join('')}
            ${sel && sel.mundo ? `<div class="rs-linha">⭐ Seleção da Temporada: ${nomeXi(sel.mundo)}</div>` : ''}
            ${sel && sel.liga ? `<div class="rs-linha">⭐ Seleção da ${U.esc(sel.liga.curto)}: ${nomeXi(sel.liga.xi)}</div>` : ''}`;
    },

    // aba Mundo: a última Seleção da Temporada
    cardMundo(s) {
        const st = s.selTemp;
        if (!st || !st.mundo) return '';
        const tabela = xi => `<table class="tabela cx-tab-xi"><tbody>${xi.map(e => `<tr class="${CarreiraExtra.ehMeu(s, e.pid, e.tid) ? 'destaque' : ''}"><td>${UI.pos(e.pos)}</td><td class="esq">${s.jog[e.pid] ? UI.jogador(s.jog[e.pid]) : U.esc(e.nome)}</td><td>${e.tid >= 0 && s.times[e.tid] ? `<a class="link-time" data-acao="verTime" data-tid="${e.tid}" title="${U.esc(s.times[e.tid].nome)}">${UI.escudo(s.times[e.tid])}</a>` : '-'}</td><td>${UI.nota(e.nota)}</td></tr>`).join('')}</tbody></table>`;
        return `<div class="cartao"><h3>⭐ Seleção da Temporada ${st.ano}</h3>${tabela(st.mundo)}
            ${st.liga ? `<details class="cx-det"><summary>⭐ Seleção da ${U.esc(st.liga.curto)}</summary>${tabela(st.liga.xi)}</details>` : ''}</div>`;
    },

    // aba Carreira: ídolo do clube e rumo da carreira (posição, empréstimo, aposentadoria dourada)
    painel(s) {
        if (!CarreiraExtra.ativo(s)) return '';
        const x = CarreiraExtra.estado(s), u = Jogador.p(s);
        return `<div class="grade-2 cx-painel">${CarreiraExtra.cardLenda(s, x, u)}${CarreiraExtra.cardRumo(s, x, u)}</div>`;
    },

    cardLenda(s, x, u) {
        const ls = CarreiraExtra.lendasAtuais(s).sort((a, b) => (b.tid === u.tid) - (a.tid === u.tid) || b.pts - a.pts).slice(0, 5);
        const corpo = ls.length ? ls.map(l => {
            const t = s.times[l.tid], prox = NIVEIS_LENDA[l.nivel + 1];
            const pct = prox ? U.clamp(Math.min(l.pts / prox.min, l.j / prox.jogos), 0, 1) : 1;
            const falta = prox ? [l.pts < prox.min ? `${prox.min - l.pts} pontos` : '', l.j < prox.jogos ? `${prox.jogos - l.j} jogos` : ''].filter(Boolean).join(' e ') : '';
            return `<div class="cx-clube ${l.tid === u.tid ? 'atual' : ''}">
                ${UI.escudo(t)}
                <div class="cx-clube-info">
                    <div class="cx-clube-topo"><b>${U.esc(l.nome)}</b>${l.nivel ? `<span class="cx-selo n${l.nivel}">${CarreiraExtra.rotuloLenda(l)}</span>` : ''}</div>
                    <small class="cinza">${l.j} jogos · ${l.g} gols · ${l.tit} título(s) · ${l.anos} temporada(s)</small>
                    <div class="stat-fundo pequeno"><div class="stat-preenche ${l.nivel >= 3 ? 'verde' : 'azul'}" style="width:${Math.round(pct * 100)}%"></div></div>
                    <small class="cinza">${prox ? `Faltam ${falta} para: ${prox.icone} ${prox.nome}` : '🗿 Homenagem máxima garantida!'}</small>
                </div>
            </div>`;
        }).join('') : '<p class="cinza pequeno">Entre em campo para começar a escrever a sua história nos clubes.</p>';
        return `<div class="cartao cx-lenda">
            <div class="cartao-topo"><h3>🏟️ Ídolo do clube</h3><span class="pequeno cinza">${ls.some(l => l.nivel) ? 'se parar hoje' : 'pontos por clube'}</span></div>
            ${corpo}
            <p class="cinza pequeno">Jogos, gols, títulos e temporadas em cada clube contam. Quando você se aposentar, os clubes te homenageiam com 🏛️ Hall da Fama, 👕 camisa aposentada ou 🗿 estátua — e o maior deles faz o seu jogo de despedida.</p>
        </div>`;
    },

    cardRumo(s, x, u) {
        const agora = CarreiraExtra.agora(s);
        const a = x.adapt, pp = x.posPed, e = x.empr;
        const opcoes = TROCAS_POS[u.pos] || [];
        const espera = x.posPedJog != null && agora - x.posPedJog < 8;
        let pos = `<div class="ficha"><div><span>Posição</span><b>${UI.pos(u.pos)} ${POS_NOME[u.pos]}</b></div>
            ${x.posHist && x.posHist.length > 1 ? `<div><span>Posições na carreira</span><b>${x.posHist.map(k => POS_NOME[k].toLowerCase()).join(', ')}</b></div>` : ''}</div>
            <small class="cinza">⚽ Seus lances: ${LANCES_DA_POS[u.pos]}.</small>`;
        if (a) {
            const pct = U.clamp(1 - a.falta / a.total, 0, 1);
            pos += `<div class="cx-adapt"><b>🔄 Adaptando-se: ${POS_NOME[a.de].toLowerCase()} → ${POS_NOME[a.para].toLowerCase()}</b>
                <div class="stat-fundo pequeno"><div class="stat-preenche amarelo" style="width:${Math.round(pct * 100)}%"></div></div>
                <small class="cinza">−${u.adaptPen || 1} de rendimento em campo por mais ~${Math.ceil(a.falta)} semana(s). Jogar acelera a adaptação.</small></div>`;
        } else if (pp) {
            pos += `<div class="cx-pedido"><b>🧑‍🏫 O técnico quer você como ${POS_NOME[pp.para].toLowerCase()}</b>
                <small>"${U.esc(pp.txt)}"</small>
                <div class="linha-botoes"><button class="btn btn-pequeno btn-primario" data-acao="cxPosResp" data-r="1">✅ Topar</button><button class="btn btn-pequeno" data-acao="cxPosResp" data-r="0">🙅 Recusar</button></div>
                <small class="cinza">O pedido vale até o fim da temporada.</small></div>`;
        } else if (opcoes.length && u.tid >= 0) {
            pos += `<div class="linha-botoes cx-linha"><button class="btn btn-pequeno" data-acao="cxPosicao" ${espera ? 'disabled' : ''}>🔀 Pedir para mudar de posição</button></div>
                <small class="cinza">${espera ? 'Você já pediu há pouco. Espere umas semanas.' : `Opções: ${opcoes.map(k => POS_NOME[k].toLowerCase()).join(', ')}.`}</small>`;
        }
        let emp;
        if (e) {
            const nota = e.j ? (e.ns / e.j).toFixed(2).replace('.', ',') : '-';
            emp = `<p class="pequeno">🔁 Emprestado pelo <b>${U.esc(e.deNome)}</b> ao <b>${U.esc(e.paraNome)}</b> até o fim da temporada, com vaga garantida (o ${U.esc(e.deNome)} paga o salário).</p>
                <div class="ficha"><div><span>Pelo ${U.esc(e.paraNome)}</span><b>${e.j} jogos · ${e.g} gols · nota ${nota}</b></div></div>
                <small class="cinza">Jogando bem (8+ jogos, nota 6,7+), o técnico do ${U.esc(e.deNome)} te dá mais chances na volta.</small>`;
        } else if (u.tid < 0) {
            emp = '<p class="cinza pequeno">Sem clube, sem empréstimo.</p>';
        } else if (x.emprPed) {
            emp = `<p class="pequeno">⏳ Pedido registrado: na próxima janela de transferências o ${U.esc(s.times[u.tid].nome)} procura um clube para te emprestar.</p>
                <div class="linha-botoes cx-linha"><button class="btn btn-pequeno" data-acao="cxEmpCancelar">✖ Desistir do pedido</button></div>`;
        } else {
            const jogos = x.semJogar ? `Você está há <b>${x.semJogar}</b> jogo(s) sem entrar em campo.` : 'Você tem jogado.';
            emp = `<p class="pequeno">${jogos} Quem quase não joga pode ir emprestado a um clube menor até o fim da temporada, com vaga garantida no time.</p>
                <div class="linha-botoes cx-linha"><button class="btn btn-pequeno" data-acao="cxEmprestimo" ${u.idade > 33 ? 'disabled' : ''}>🔁 Pedir empréstimo</button></div>`;
        }
        let dour = '';
        if (x.dour) dour = '<p class="pequeno">🌴 Vivendo a aposentadoria dourada: um pouco mais feliz e um pouco menos famoso a cada semana.</p>';
        else if (u.idade >= 30) dour = `<p class="cinza pequeno">🌴 ${u.idade >= 32 ? 'Nas janelas, clubes da MLS e da Liga MX podem aparecer com salários milionários.' : 'A partir dos 32 anos, clubes da MLS e da Liga MX podem aparecer com propostas milionárias.'}</p>`;
        return `<div class="cartao cx-rumo">
            <div class="cartao-topo"><h3>🧭 Rumo da carreira</h3></div>
            <h4>🔀 Posição</h4>${pos}
            <h4>🔁 Empréstimo</h4>${emp}
            ${dour ? `<h4>🌴 Fim de carreira</h4>${dour}` : ''}
        </div>`;
    },
};

// ---------------------------------------------------------------------
//  🔥 Polêmicas da carreira de jogador (entram nos eventos da vida)
// ---------------------------------------------------------------------
const POLEMICAS = [
    {
        titulo: 'Festa vazada', icone: '🎥', peso: 0.45, quando: s => CarreiraExtra.noClube(s) && s.pessoa.fama >= 8,
        texto: 'Na véspera do jogo, vazou um vídeo seu numa festa de madrugada. A imprensa já fala em "noitada" e a torcida cobra nas redes.',
        ops: [
            { txt: 'Pedir desculpas ao grupo', fn: s => { CarreiraExtra.clima(s, -2, -2); return `O técnico aceitou as desculpas, mas avisou: agora é mostrar em campo.${Vida.mudar(s, { felicidade: -2, fama: -0.5 })}`; } },
            {
                txt: '"Era o aniversário da minha avó!"', fn: s => {
                    if (U.chance(0.5)) { CarreiraExtra.clima(s, 0, 2); return `Colou! A vovó virou meme e todo mundo achou fofo.${Vida.mudar(s, { fama: 1, felicidade: 1 })}`; }
                    CarreiraExtra.clima(s, -3, -6);
                    return `A sua avó desmentiu ao vivo na TV: "Meu aniversário é em março!" 😬${Vida.mudar(s, { fama: -3, felicidade: -3 })}`;
                }
            },
            {
                txt: 'Postar "vida que segue" 😎', fn: s => {
                    const g = CarreiraExtra.ganharSeg(s, 0.04);
                    CarreiraExtra.clima(s, -7, -3);
                    if (U.chance(0.4)) {
                        const multa = U.redondo(Math.max(2000, meuJog(s).sal * 0.03));
                        return `+${g} seguidores, mas o clube não achou graça: multa de ${U.dinheiro(multa)}.${Vida.mudar(s, { dinheiro: -multa, fama: 1 })}`;
                    }
                    return `O post bombou (+${g} seguidores), mas o técnico ficou de cara feia.${Vida.mudar(s, { fama: 1.5, felicidade: 1 })}`;
                }
            },
        ],
    },
    {
        titulo: 'Briga no treino', icone: '🥊', peso: 0.45, quando: s => CarreiraExtra.noClube(s),
        prep: (s, c) => { c.p = CarreiraExtra.companheiro(s); c.nome = c.p ? c.p.nome : 'Um companheiro'; },
        texto: 'No rachão, {nome} te deu uma entrada criminosa. Vocês ficaram cara a cara e o treino parou.',
        ops: [
            { txt: 'Separar e conversar depois', fn: s => { CarreiraExtra.clima(s, 2, 0); return `Vocês se resolveram no vestiário e o grupo elogiou a sua maturidade.${CarreiraExtra.pancada(s)}${Vida.mudar(s, { felicidade: 1 })}`; } },
            {
                txt: 'Revidar na hora', fn: s => {
                    if (U.chance(0.5)) {
                        const u = meuJog(s);
                        u.susp = Math.max(u.susp, 1);
                        CarreiraExtra.clima(s, -6, -1);
                        const g = CarreiraExtra.ganharSeg(s, 0.02);
                        return `Virou confusão generalizada e o vídeo vazou (+${g} seguidores). O clube te afastou por 1 jogo.${Vida.mudar(s, { fama: 1, felicidade: -3 })}`;
                    }
                    CarreiraExtra.clima(s, -2, 0);
                    return `Empurra-empurra, a turma do deixa-disso separou e ficou por isso mesmo.${CarreiraExtra.pancada(s)}${Vida.mudar(s, { felicidade: 1 })}`;
                }
            },
            {
                txt: 'Reclamar com o técnico', fn: (s, c) => {
                    if (U.chance(0.55)) {
                        CarreiraExtra.clima(s, 3, 0);
                        if (c.p) Mot.mudar(c.p, -10);
                        return `O técnico multou ${c.nome} e elogiou a sua postura.${CarreiraExtra.pancada(s)}${Vida.mudar(s, { felicidade: 2 })}`;
                    }
                    CarreiraExtra.clima(s, 1, 0);
                    return `O técnico resolveu, mas parte do elenco te chamou de "X9". O clima no vestiário ficou estranho.${CarreiraExtra.pancada(s)}${Vida.mudar(s, { felicidade: -4 })}`;
                }
            },
        ],
    },
    {
        titulo: 'Convite para reality show', icone: '📺', peso: 0.35, quando: s => CarreiraExtra.noClube(s) && s.pessoa.fama >= 18,
        prep: (s, c) => {
            c.prog = U.escolha(['A Fazenda dos Boleiros', 'BBB: Edição Craques', 'Ilha da Tentação FC', 'Casamento às Cegas: Futebol', 'Largados e Pelados na Concentração']);
            c.cache = U.redondo(25000 + s.pessoa.fama * 2500 + Math.sqrt(s.pessoa.seg || 0) * 25);
            c.v = U.dinheiro(c.cache);
        },
        texto: 'A produção do reality "{prog}" te convidou para entrar na casa na pausa do campeonato. Cachê: {v}. O técnico, claro, não vai gostar nada...',
        ops: [
            {
                txt: 'Aceitar e virar celebridade', fn: (s, c) => {
                    const u = meuJog(s);
                    u.cond = Math.max(40, u.cond - 15);
                    CarreiraExtra.clima(s, -10, 0);
                    const g = CarreiraExtra.ganharSeg(s, 0.12), r = Math.random();
                    if (r < 0.5) return `Você virou o queridinho do país e foi até a final! +${g} seguidores, mas voltou fora de forma.${Vida.mudar(s, { dinheiro: c.cache, fama: 5, felicidade: 6 })}`;
                    if (r < 0.8) return `Eliminado no primeiro paredão... virou meme, mas faturou (+${g} seguidores).${Vida.mudar(s, { dinheiro: c.cache, fama: 2, felicidade: -2 })}`;
                    CarreiraExtra.clima(s, 0, -6);
                    return `Uma briga dentro da casa virou escândalo nacional e a torcida não perdoou (+${g} seguidores).${Vida.mudar(s, { dinheiro: c.cache, fama: -2, felicidade: -4 })}`;
                }
            },
            { txt: 'Só depois que eu me aposentar', fn: s => `A produção prometeu guardar a sua vaga. 😂${Vida.mudar(s, { fama: 0.5 })}` },
            { txt: 'Recusar: foco total no futebol', fn: s => { CarreiraExtra.clima(s, 3, 2); return `A torcida e o técnico gostaram da sua postura.${Vida.mudar(s, { felicidade: -1 })}`; } },
        ],
    },
    {
        titulo: 'Rumor de apostas', icone: '🎲', peso: 0.3, quando: s => CarreiraExtra.noClube(s) && s.pessoa.fama >= 10 && !CarreiraExtra.temPend(s, 'apostas'),
        texto: 'Um site publicou que você estaria envolvido num esquema de apostas. É mentira, mas a federação abriu uma investigação e o assunto domina os programas esportivos.',
        ops: [
            { txt: 'Abrir o celular e colaborar', fn: s => { CarreiraExtra.agendar(s, 'apostas', 'colabora', U.int(2, 4)); CarreiraExtra.clima(s, 1, -3); return `Você entregou tudo aos investigadores. Agora é esperar o resultado (algumas semanas).${Vida.mudar(s, { felicidade: -3 })}`; } },
            {
                txt: 'Deixar o advogado falar', fn: s => {
                    const v = U.redondo(Math.max(5000, meuJog(s).sal * 0.02));
                    CarreiraExtra.agendar(s, 'apostas', 'advogado', U.int(2, 4));
                    return `Um advogado famoso assumiu o caso. Honorários: ${U.dinheiro(v)}.${Vida.mudar(s, { dinheiro: -v, felicidade: -1 })}`;
                }
            },
            {
                txt: 'Atacar o site nas redes', fn: s => {
                    const g = CarreiraExtra.ganharSeg(s, 0.05);
                    CarreiraExtra.agendar(s, 'apostas', 'ataque', U.int(2, 4));
                    CarreiraExtra.clima(s, -3, 2);
                    return `O seu desabafo viralizou (+${g} seguidores). O site prometeu responder na Justiça...${Vida.mudar(s, { fama: 1 })}`;
                }
            },
        ],
    },
    {
        titulo: 'Exame antidoping', icone: '🧪', peso: 0.22, quando: s => CarreiraExtra.noClube(s) && !CarreiraExtra.temPend(s, 'doping'),
        texto: 'Bomba: o seu exame antidoping deu positivo! Você nunca tomou nada de errado... pode ter sido um falso positivo do laboratório.',
        ops: [
            {
                txt: 'Pedir a contraprova', fn: s => {
                    const u = meuJog(s);
                    u.susp = Math.max(u.susp, 1);
                    CarreiraExtra.agendar(s, 'doping', 'contraprova', 2);
                    return `Você está suspenso preventivamente até sair o resultado da contraprova (2 semanas).${Vida.mudar(s, { dinheiro: -3000, felicidade: -5 })}`;
                }
            },
            {
                txt: 'Culpar o suplemento', fn: s => {
                    const u = meuJog(s);
                    if (U.chance(0.5)) { u.susp = Math.max(u.susp, 1); return `O fabricante admitiu que o lote estava contaminado: você pegou só 1 jogo de gancho.${Vida.mudar(s, { felicidade: -1 })}`; }
                    u.susp = Math.max(u.susp, 3);
                    CarreiraExtra.clima(s, -2, -4);
                    return `Ninguém acreditou na desculpa: 3 jogos de suspensão.${Vida.mudar(s, { fama: -5, felicidade: -5 })}`;
                }
            },
            { txt: 'Aceitar a punição em silêncio', fn: s => { const u = meuJog(s); u.susp = Math.max(u.susp, 3); return `3 jogos de suspensão. Doeu, mas o assunto morreu rápido.${Vida.mudar(s, { fama: -3, felicidade: -4 })}`; } },
        ],
    },
    {
        titulo: 'Foto com a camisa do rival', icone: '📸', peso: 0.4, quando: s => CarreiraExtra.noClube(s) && s.pessoa.fama >= 5,
        prep: (s, c) => { const t = s.times[meuJog(s).tid]; c.clube = t.nome; c.rival = CarreiraExtra.rivalDoClube(s, t); },
        texto: 'Desenterraram uma foto sua de criança, todo orgulhoso com a camisa do {rival}. A torcida do {clube} está em pé de guerra nas redes!',
        ops: [
            { txt: 'Beijar o escudo e pedir desculpas', fn: s => { CarreiraExtra.clima(s, 0, -1); return `Você beijou o escudo no treino aberto e a torcida perdoou.${Vida.mudar(s, { fama: 0.5, felicidade: -1 })}`; } },
            {
                txt: '"Eu era criança, gente!"', fn: s => {
                    if (U.chance(0.6)) { CarreiraExtra.clima(s, 0, 1); return `A maioria entendeu e a foto virou meme carinhoso.${Vida.mudar(s, { fama: 1 })}`; }
                    CarreiraExtra.clima(s, 0, -6);
                    return `Parte da torcida não engoliu: vaias no próximo jogo.${Vida.mudar(s, { felicidade: -3 })}`;
                }
            },
            { txt: '"Torci mesmo, e daí?"', fn: s => { const g = CarreiraExtra.ganharSeg(s, 0.06); CarreiraExtra.clima(s, -2, -12); return `A torcida rival te adotou e a sua ficou furiosa. Engajamento nas alturas: +${g} seguidores.${Vida.mudar(s, { fama: 2, felicidade: -2 })}`; } },
        ],
    },
    {
        titulo: 'Treta com o rival nas redes', icone: '⚔️', peso: 0.4,
        quando: s => CarreiraExtra.noClube(s) && typeof Historia !== 'undefined' && Historia.ativo(s) && !!Historia.rival(s),
        prep: (s, c) => { const r = Historia.rival(s); c.nome = r ? r.nome : 'O seu rival'; },
        texto: '{nome}, o seu rival, postou um vídeo zoando aquele gol que você perdeu. Já são milhões de visualizações.',
        ops: [
            { txt: 'Responder com classe', fn: s => { CarreiraExtra.clima(s, 1, 1); return `A sua resposta educada foi elogiada até pelos torcedores dele.${Vida.mudar(s, { fama: 1, felicidade: 1 })}`; } },
            { txt: '"Me encontra no próximo duelo"', fn: s => { const g = CarreiraExtra.ganharSeg(s, 0.04); CarreiraExtra.clima(s, -1, 4); return `A provocação incendiou o duelo: +${g} seguidores e a torcida comprou a briga!${Vida.mudar(s, { fama: 1.5, felicidade: 2 })}`; } },
            { txt: 'Bloquear e seguir a vida', fn: s => `Você bloqueou, mas os prints já tinham rodado a internet.${Vida.mudar(s, { fama: -0.5, felicidade: -1 })}` },
        ],
    },
    {
        titulo: 'Empresário falastrão', icone: '💼', peso: 0.35, quando: s => CarreiraExtra.noClube(s) && !!s.car.emp,
        prep: (s, c) => { c.emp = s.car.emp.nome; c.clube = s.times[meuJog(s).tid].nome; },
        texto: 'O seu empresário, {emp}, disse numa entrevista que você "é grande demais para o {clube}" e que "está ouvindo propostas".',
        ops: [
            { txt: 'Desmentir publicamente', fn: (s, c) => { CarreiraExtra.clima(s, 3, 4); return `Você reafirmou o compromisso com o ${c.clube}. ${c.emp} ficou sem graça.${Vida.mudar(s, { felicidade: 1 })}`; } },
            { txt: 'Confirmar: quero sair', fn: (s, c) => { s.car.pedirTransf = true; CarreiraExtra.clima(s, -6, -10); return `A torcida se revoltou, mas o mercado se mexeu: ${c.emp} já está ouvindo propostas.${Vida.mudar(s, { fama: 1, felicidade: -1 })}`; } },
            { txt: 'Ficar quieto', fn: s => { CarreiraExtra.clima(s, 0, -3); return `O silêncio foi lido como concordância e a torcida ficou desconfiada.${Vida.mudar(s, { felicidade: -1 })}`; } },
        ],
    },
];
// cada polêmica resolvida conta para a conquista "Rei da polêmica"
for (const ev of POLEMICAS) {
    for (const o of ev.ops) {
        const fn = o.fn;
        o.fn = (s, c) => { Conquistas.contar(s, 'polemicas'); return fn(s, c); };
    }
}
EVENTOS.push.apply(EVENTOS, POLEMICAS);

// Os ganchos que rodam no meio da semana, no fim do jogo, no fim da temporada e
// nas telas nunca podem travar o jogo: um erro aqui só vira aviso no console.
(function () {
    const proteger = (k, padrao) => {
        const fn = CarreiraExtra[k];
        CarreiraExtra[k] = function () {
            const args = arguments;
            const falhou = e => { console.warn('carreiraExtra.' + k, e); return padrao(args); };
            try {
                const r = fn.apply(CarreiraExtra, args);
                return r && typeof r.then === 'function' ? r.catch(falhou) : r;
            } catch (e) {
                return falhou(e);
            }
        };
    };
    const vazio = () => '', nada = () => undefined;
    ['painel', 'htmlPerfil', 'textoIdolo', 'htmlResumo', 'cardMundo'].forEach(k => proteger(k, vazio));
    ['posJogo', 'semana', 'premiosTemporada', 'depoisFimTemporada'].forEach(k => proteger(k, nada));
    proteger('slideTemporada', () => null);
    proteger('aoAposentar', () => false);
    proteger('bloqueiaProposta', () => false);
    proteger('clubeDono', () => { const u = Jogador.p(Jogo.s); return u ? u.tid : -1; });
})();

Object.assign(ACOES, {
    async cxPosicao() {
        const s = Jogo.s;
        if (!CarreiraExtra.ativo(s)) return;
        await CarreiraExtra.pedirPosicao(s);
        Jogo.manterRolagem = true;
        Jogo.atualizar();
    },
    cxPosResp(d) {
        const s = Jogo.s;
        if (!CarreiraExtra.ativo(s)) return;
        const x = CarreiraExtra.estado(s), pp = x.posPed;
        if (!pp) return;
        CarreiraExtra.responderTecnico(s, x, Jogador.p(s), pp.para, d.r === '1');
        Jogo.manterRolagem = true;
        Jogo.atualizar();
    },
    async cxEmprestimo() {
        const s = Jogo.s;
        if (!CarreiraExtra.ativo(s)) return;
        const x = CarreiraExtra.estado(s), u = Jogador.p(s);
        if (u.tid < 0 || x.empr || x.emprPed) return;
        const st = Jogador.statusElenco(s);
        if (!CarreiraExtra.quaseNaoJoga(s, x) && /Titular/.test(st)) {
            return UI.aviso('Pedido negado', `🧑‍🏫 "Empréstimo? Você é ${st.replace(/^\S+\s/, '').toLowerCase()} aqui! Nem pensar."`, '🔁');
        }
        if (Mundo.emJanela(s)) {
            if (await CarreiraExtra.ofertaEmprestimo(s, x, u, true)) x.emprSem = CarreiraExtra.agora(s);
        } else {
            x.emprPed = true;
            const prox = JANELAS.map(j => j[0]).find(a => a > s.semana);
            const txt = `🔁 Pedido registrado: o clube vai procurar um empréstimo na ${prox != null ? `janela da semana ${prox + 1}` : 'próxima janela (começo da temporada)'}.`;
            Vida.log(s, txt, '');
            UI.toast(txt);
        }
        Jogo.manterRolagem = true;
        Jogo.atualizar();
    },
    cxEmpCancelar() {
        const s = Jogo.s;
        if (!CarreiraExtra.ativo(s)) return;
        CarreiraExtra.estado(s).emprPed = false;
        UI.toast('🔁 Você desistiu do empréstimo.');
        Jogo.manterRolagem = true;
        Jogo.atualizar();
    },
});
