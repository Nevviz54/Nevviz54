'use strict';
// =====================================================================
//  CARREIRA DE JOGADOR (o lado "BitLife" do jogo)
// =====================================================================

const TREINOS = {
    leve: { nome: 'Leve', icone: '🚶', mult: 0.5, cond: 12, les: 0.003, desc: 'Evolui pouco, mas recupera o físico.' },
    normal: { nome: 'Normal', icone: '🏃', mult: 1.0, cond: 4, les: 0.008, desc: 'Equilíbrio entre evolução e descanso.' },
    intenso: { nome: 'Intenso', icone: '🔥', mult: 1.5, cond: -8, les: 0.022, desc: 'Evolui rápido, cansa e pode lesionar.' },
};

const FORCA_SELECAO = { BRA: 88, ARG: 89, FRA: 89, ESP: 90, ENG: 87, GER: 85, ITA: 83, NED: 84 };

// Habilidades especiais: compradas com pontos de habilidade
const HABILIDADES = {
    finalizador: { nome: 'Finalizador', icone: '🎯', custo: 4, desc: '+15% de chance de gol nos chutes.' },
    cabeceio: { nome: 'Cabeça de ouro', icone: '🤕', custo: 3, desc: '+25% nos lances de cabeça.' },
    garcom: { nome: 'Garçom', icone: '🍽️', custo: 4, desc: '+15% nas assistências.' },
    batedor: { nome: 'Batedor oficial', icone: '🌀', custo: 3, desc: '+20% em faltas e pênaltis.' },
    driblador: { nome: 'Driblador', icone: '🕺', custo: 3, desc: '+20% nas jogadas de efeito (drible, cavadinha...).' },
    paredao: { nome: 'Paredão', icone: '🧤', custo: 4, desc: '+15% nas defesas (goleiros).' },
    xerife: { nome: 'Xerife', icone: '🛡️', custo: 4, desc: '+12% nos desarmes e metade dos cartões.' },
    decisivo: { nome: 'Decisivo', icone: '⏱️', custo: 4, desc: '+20% em todos os lances depois dos 75 minutos.' },
    motorzinho: { nome: 'Motorzinho', icone: '🔋', custo: 3, desc: 'Cansa menos e recupera o físico mais rápido.' },
    blindado: { nome: 'Corpo blindado', icone: '🦾', custo: 4, desc: 'Metade das lesões.' },
    lider: { nome: 'Líder', icone: '©️', custo: 4, desc: 'O técnico confia mais em você: mais chances de ser titular.' },
    estrela: { nome: 'Estrela da mídia', icone: '📸', custo: 3, desc: '+30% de fama e patrocínios mais gordos.' },
};

const COMEMORACOES = ['Correr para a torcida', 'Robozinho', 'Dancinha', 'Siuuu', 'Mão no ouvido', 'Coraçãozinho com as mãos',
    'Cambalhota', 'Arqueiro', 'Dormir no gramado', 'Beijo para a câmera', 'Ajoelhar e apontar para o céu', 'Tirar a camisa'];
const CAMISA_PADRAO = { GOL: 1, ZAG: 4, LAT: 2, VOL: 5, MEI: 10, PON: 11, ATA: 9 };

const Jogador = {
    p: s => s.jog[s.car.pid],
    meuTime: s => { const p = s.jog[s.car.pid]; return p ? p.tid : -1; },

    abas() {
        return [
            { id: 'inicio', nome: 'Vida', icone: '🏠', render: Jogador.inicio },
            { id: 'carreira', nome: 'Carreira', icone: '⚽', render: Jogador.carreira },
            { id: 'treino', nome: 'Treino', icone: '🏋️', render: Jogador.treino },
            { id: 'vida', nome: 'Atividades', icone: '🎯', render: Comum.vida },
            { id: 'clube', nome: 'Meu clube', icone: '🏟️', render: Jogador.clube },
            { id: 'conquistas', nome: 'Conquistas', icone: '🏅', render: Conquistas.tela },
            { id: 'tabelas', nome: 'Tabelas', icone: '📊', render: Comum.tabelas },
            { id: 'noticias', nome: 'Notícias', icone: '📰', render: Comum.noticias },
            { id: 'mundo', nome: 'Mundo', icone: '🌍', render: Comum.mundo },
        ];
    },

    // -----------------------------------------------------------------
    //  Começo: a peneira
    // -----------------------------------------------------------------
    telaPeneira(form) {
        UI.render('<div class="carregando">⚽ Montando o mundo do futebol...</div>');
        setTimeout(() => {
            const s = Mundo.criar(ANO_INICIAL);
            Jogo.sTmp = s;
            const ligas = s.ligas.filter(l => l.pais === form.pais).sort((a, b) => a.nivel - b.nivel);
            const cands = [];
            const seg = ligas[1] || ligas[0];
            const porNivel = ligas.length >= 3 ? [ligas[1], ligas[2], ligas[ligas.length - 1], ligas[0]] : [seg, seg, seg, ligas[0]];
            porNivel.forEach((liga, i) => {
                let opcoes = liga.times.filter(id => !cands.includes(id));
                if (i === 3) opcoes = opcoes.sort((a, b) => s.times[a].rep - s.times[b].rep).slice(0, 6);
                cands.push(U.escolha(opcoes));
            });
            Jogo.ui.peneira = cands;
            Jogo.telaSimples('⚽ A peneira', `
                <p>Você tem <b>17 anos</b> e fez peneira em vários clubes. Estes gostaram do seu futebol e oferecem um contrato de base:</p>
                <div class="grade-clubes grande">${cands.map(tid => {
                const t = s.times[tid];
                const liga = Mundo.liga(s, t.liga);
                return `<button class="card-clube" data-acao="jgEscolherClube" data-tid="${tid}">${UI.escudo(t, true)}<span><b>${U.esc(t.nome)}</b><small>${U.esc(liga.nome)}</small><small>${U.estrelas((t.rep - 50) / 7)}</small></span></button>`;
            }).join('')}</div>
                <p class="cinza pequeno">Dica: num clube menor você joga mais cedo. Num grande, aprende com craques, mas pode ficar no banco.</p>`, 'menuNovo');
        }, 30);
    },

    async iniciar(form, tid) {
        const s = Jogo.sTmp;
        Jogo.sTmp = null;
        s.modo = 'jogador';
        s.pessoa = Vida.criarPessoa({ nome: form.nome, idade: 17, pais: form.pais });
        const t = s.times[tid];
        const pot = U.clamp(Math.round(70 + Math.abs(U.normal(0, 9)) + U.int(0, 6)), 70, 97);
        const ovr = U.clamp(Math.round(t.rep) - U.int(5, 9), 48, 66);
        const p = Mundo.novoJogador(s, { nome: form.nome, pos: form.pos, idade: 17, ovr, pot: Math.max(pot, ovr + 12), tid, real: false }, Mundo.liga(s, t.liga).riqueza);
        p.user = true;
        p.contr = 3;
        p.sal = U.redondo(Math.max(6000, p.sal * 0.6));
        s.car = {
            tipo: 'jogador', pid: p.id, treino: 'normal', hist: [], prog: 0, selecao: { jogos: 0, gols: 0 }, pedirTransf: false, aumentoAno: -1, estudo: 0, clubes: [t.id],
            habs: [], pontos: 2, camisa: CAMISA_PADRAO[form.pos] || 10, comemoracao: 'Correr para a torcida',
        };
        Jogo.migrar(s);
        Vida.log(s, `👶 Você nasceu ${Jogador.noPais(form.pais)}. Desde pequeno, só pensava em bola.`, '');
        Vida.log(s, `✍️ Aos 17 anos, você assinou seu primeiro contrato com o ${t.nome}! Salário: ${U.dinheiro(p.sal)}/ano.`, 'bom');
        Mundo.noticia(s, `🌱 ${t.nome} contrata o jovem ${form.nome}, de 17 anos.`, 'clube');
        Jogo.s = s;
        Jogo.aba = 'inicio';
        Jogo.atualizar();
        await Jogador.cenaNovoClube(s, t, 'Seu primeiro contrato profissional!');
        await UI.aviso('Sua vida começa agora!', `Bem-vindo ao <b>${U.esc(t.nome)}</b>, ${U.esc(form.nome)}!<br><br>Escolha seu treino na aba <b>Treino</b> (lá também ficam as <b>habilidades especiais</b>), faça atividades, cuide da família e clique em <b>Avançar semana</b>. Nos jogos, você vai decidir alguns lances!`, '⚽');
    },

    cenaNovoClube(s, t, frase) {
        const p = Jogador.p(s);
        return Cena.novoClube(s, t, {
            papel: 'jogador', nome: p.nome, camisa: s.car.camisa,
            linhas: [['Posição', POS_NOME[p.pos]], ['Camisa', s.car.camisa], ['Contrato', `até ${s.ano + p.contr - 1}`], ['Salário', `${U.dinheiro(p.sal)}/ano`]],
            frase: frase || 'Agora é mostrar serviço!',
        });
    },

    noPais(id) {
        const pais = Mundo.pais(id);
        return (id === 'BRA' ? 'no ' : 'na ') + pais.nome;
    },

    rodape(s) {
        const p = Jogador.p(s);
        if (p.tid < 0) return '😶 Sem clube — esperando propostas.';
        if (p.les > 0) return `🚑 Lesionado: ${p.les} semana(s) para voltar.`;
        const prox = Mundo.calendarioDoTime(s, p.tid).find(j => !j.res && j.sem >= s.semana);
        if (!prox) return 'Sem mais jogos nesta temporada.';
        const casa = prox.h === p.tid;
        const adv = s.times[casa ? prox.a : prox.h];
        return `${prox.sem === s.semana ? '<b class="verde">JOGO ESTA SEMANA</b>' : `Semana ${prox.sem + 1}`} · ${U.esc(prox.nomeComp)} · ${casa ? '🏠' : '✈️'} vs ${UI.escudo(adv)} <b>${U.esc(adv.nome)}</b>`;
    },

    // -----------------------------------------------------------------
    //  Telas
    // -----------------------------------------------------------------
    inicio(s) {
        const p = Jogador.p(s);
        const t = p.tid >= 0 ? s.times[p.tid] : null;
        const media = p.j ? (p.ns / p.j) : null;
        return `<div class="grade-vida">
            <div>
                <div class="cartao">
                    ${Comum.perfil(s)}
                    <div class="sep"></div>
                    <div class="perfil-jog">
                        <div>${UI.pos(p.pos)} <b>${POS_NOME[p.pos]}</b></div>
                        <div>Habilidade ${UI.ovr(p.ovr)}</div>
                        <div>${t ? UI.time(s, t.id) : '<span class="cinza">Sem clube</span>'}</div>
                    </div>
                    ${UI.barra('Forma física', p.cond, '💪')}
                    <div class="mini-stats">
                        <div><b>${p.j}</b><span>Jogos</span></div><div><b>${p.g}</b><span>Gols</span></div><div><b>${p.a}</b><span>Assist.</span></div><div><b>${media ? media.toFixed(1) : '-'}</b><span>Nota</span></div>
                    </div>
                </div>
                <div class="cartao acoes-rapidas">
                    <button class="btn" data-acao="aba" data-aba="treino">🏋️ Treino: ${TREINOS[s.car.treino].nome}</button>
                    <button class="btn" data-acao="aba" data-aba="vida">🎯 Atividades (${s.pessoa.acoes}/${Vida.MAX_ACOES})</button>
                    <button class="btn" data-acao="aba" data-aba="carreira">📄 Contrato e propostas</button>
                </div>
            </div>
            <div class="cartao">
                <h3>📔 Sua história</h3>
                ${Comum.diario(s, 80)}
            </div>
        </div>`;
    },

    carreira(s) {
        const p = Jogador.p(s);
        const t = p.tid >= 0 ? s.times[p.tid] : null;
        const hist = s.car.hist.slice().reverse();
        const totG = U.soma(s.car.hist, h => h.g) + p.g, totJ = U.soma(s.car.hist, h => h.j) + p.j;
        return `<div class="grade-2">
            <div class="cartao"><h3>📄 Contrato</h3>
                ${t ? `<div class="ficha">
                    <div><span>Clube</span><b>${UI.time(s, t.id)}</b></div>
                    <div><span>Liga</span><b>${U.esc(Mundo.liga(s, t.liga).nome)}</b></div>
                    <div><span>Salário</span><b>${U.dinheiro(p.sal)}/ano (${U.dinheiro(p.sal / 52)}/semana)</b></div>
                    <div><span>Contrato até</span><b>${s.ano + p.contr - 1}</b></div>
                    <div><span>Valor de mercado</span><b>${U.dinheiro(Mundo.valor(p))}</b></div>
                    <div><span>Sua posição no elenco</span><b>${Jogador.statusElenco(s)}</b></div>
                </div>` : '<p>Você está <b>sem clube</b>. Propostas podem chegar a qualquer momento.</p>'}
                <div class="botoes-carreira">
                    ${t ? `<button class="btn" data-acao="jgConversarTecnico">🗣️ Pedir mais chances ao técnico</button>
                    <button class="btn" data-acao="jgAumento" ${s.car.aumentoAno === s.ano ? 'disabled' : ''}>💰 Pedir aumento</button>
                    <button class="btn ${s.car.pedirTransf ? 'ativo' : ''}" data-acao="jgTransf">${s.car.pedirTransf ? '✅ Empresário buscando clube' : '🔄 Pedir para ser negociado'}</button>` : ''}
                    <button class="btn btn-perigo" data-acao="jgAposentar">👴 Aposentar</button>
                </div>
                <h3>🇺🇳 Seleção</h3>
                <p>${s.car.selecao.jogos ? `${s.car.selecao.jogos} jogos e ${s.car.selecao.gols} gols pela seleção ${Mundo.pais(s.pessoa.pais).bandeira}.` : 'Ainda não foi convocado. Continue evoluindo!'}</p>
                <h3>👕 Sua identidade</h3>
                <div class="identidade">
                    ${t ? Cena.camisa(t, p.nome, s.car.camisa) : ''}
                    <div class="form-identidade">
                        <label class="campo">Número da camisa<input class="inp curto" type="number" min="1" max="99" value="${s.car.camisa}" data-mudar="jgCamisa"></label>
                        <label class="campo">Comemoração de gol<select class="sel" data-mudar="jgComemora">${COMEMORACOES.map(c => `<option ${s.car.comemoracao === c ? 'selected' : ''}>${c}</option>`).join('')}</select></label>
                        <small class="cinza">Sua comemoração aparece na narração e deixa você mais famoso. Tirar a camisa dá cartão amarelo!</small>
                    </div>
                </div>
            </div>
            <div class="cartao"><h3>📜 Histórico</h3>
                <p>Carreira: <b>${totJ}</b> jogos · <b>${totG}</b> gols</p>
                <table class="tabela"><thead><tr><th>Ano</th><th class="esq">Clube</th><th>Idade</th><th>OVR</th><th>J</th><th>G</th><th>A</th><th>Nota</th></tr></thead>
                <tbody><tr class="destaque"><td>${s.ano}</td><td class="esq">${t ? U.esc(t.nome) : '-'}</td><td>${p.idade}</td><td>${p.ovr}</td><td>${p.j}</td><td>${p.g}</td><td>${p.a}</td><td>${p.j ? (p.ns / p.j).toFixed(2) : '-'}</td></tr>
                ${hist.map(h => `<tr><td>${h.ano}</td><td class="esq">${U.esc(h.time)}</td><td>${h.idade}</td><td>${h.ovr}</td><td>${h.j}</td><td>${h.g}</td><td>${h.a}</td><td>${h.nota || '-'}</td></tr>`).join('')}</tbody></table>
                <h4>🏆 Troféus</h4>
                <div class="lista-trofeus">${s.pessoa.trofeus.map(x => `<span class="trofeu">🏆 ${U.esc(x.txt)} (${x.ano})</span>`).join('') || '<span class="cinza">Nenhum ainda.</span>'}</div>
            </div>
        </div>`;
    },

    statusElenco(s) {
        const p = Jogador.p(s);
        if (p.tid < 0) return '-';
        const t = s.times[p.tid];
        const mesmos = Mundo.elenco(s, t).filter(x => POS_GRUPO[x.pos] === POS_GRUPO[p.pos]).sort((a, b) => b.ovr - a.ovr);
        const rank = mesmos.indexOf(p) + 1;
        const vagas = { G: 1, D: 4, M: 3, A: 3 }[POS_GRUPO[p.pos]];
        if (rank <= vagas - 1) return '⭐ Titular absoluto';
        if (rank <= vagas) return '✅ Titular';
        if (rank <= vagas + 2) return '🔄 Briga por posição';
        return '🪑 Reserva';
    },

    treino(s) {
        const p = Jogador.p(s);
        return `<div class="grade-2">
            <div class="cartao"><h3>🏋️ Treino da semana</h3>
                <div class="grade-treinos">${Object.entries(TREINOS).map(([k, t]) => `
                    <button class="atividade ${s.car.treino === k ? 'ativa' : ''}" data-acao="jgTreino" data-t="${k}">
                        <span class="at-icone">${t.icone}</span><b>${t.nome}</b><small>${t.desc}</small></button>`).join('')}</div>
                <p class="cinza pequeno">O treino escolhido vale para todas as semanas até você mudar.</p>
            </div>
            <div class="cartao"><h3>📈 Evolução</h3>
                <div class="ficha">
                    <div><span>Habilidade atual</span><b>${UI.ovr(p.ovr)}</b></div>
                    <div><span>Potencial (olheiros)</span><b>${Jogo.potencialTxt(s, p)}</b></div>
                    <div><span>Progresso p/ próximo ponto</span><b>${Math.round((s.car.prog || 0) * 100)}%</b></div>
                </div>
                <div class="stat-fundo"><div class="stat-preenche azul" style="width:${Math.round((s.car.prog || 0) * 100)}%"></div></div>
                <p class="cinza pequeno">Jovens evoluem mais rápido. Felicidade alta e jogar partidas ajudam. Depois dos 30, o corpo começa a cobrar a conta.</p>
            </div>
        </div>
        <div class="cartao">
            <div class="cartao-topo"><h3>⚡ Habilidades especiais</h3><span class="pontos-hab">Pontos: <b>${s.car.pontos || 0}</b></span></div>
            <p class="cinza pequeno">Você ganha pontos quando sua habilidade sobe, quando é o melhor em campo e quando faz hat-trick.</p>
            <div class="grade-habs">${Object.entries(HABILIDADES).map(([k, h]) => {
            const tem = (s.car.habs || []).includes(k);
            return `<button class="hab ${tem ? 'tem' : ''}" data-acao="jgHab" data-h="${k}" ${tem || (s.car.pontos || 0) < h.custo ? 'disabled' : ''}>
                    <span class="hab-icone">${h.icone}</span><b>${h.nome}</b><small>${h.desc}</small><span class="hab-custo">${tem ? '✔ Desbloqueada' : `${h.custo} pontos`}</span></button>`;
        }).join('')}</div>
        </div>`;
    },

    clube(s) {
        const p = Jogador.p(s);
        if (p.tid < 0) return '<div class="cartao"><p>Você está sem clube.</p></div>';
        const t = s.times[p.tid];
        const liga = Mundo.liga(s, t.liga);
        const el = Mundo.elenco(s, t).sort((a, b) => POSICOES.indexOf(a.pos) - POSICOES.indexOf(b.pos) || b.ovr - a.ovr);
        const cal = Mundo.calendarioDoTime(s, t.id);
        return `<div class="cabecalho-clube" style="--c1:${t.c1};--c2:${t.c2}">${UI.escudo(t, true)}<div><h2>${U.esc(t.nome)}</h2><span>${U.esc(liga.nome)} · ${Mundo.posicaoNaLiga(s, t.id)}º lugar</span></div></div>
        <div class="grade-2">
            <div class="cartao"><h3>👥 Companheiros</h3>
                <table class="tabela tabela-elenco"><thead><tr><th>Pos</th><th class="esq">Jogador</th><th>Idade</th><th>OVR</th><th>J</th><th>G</th></tr></thead>
                <tbody>${el.map(x => `<tr class="${x.user ? 'destaque' : ''}"><td>${UI.pos(x.pos)}</td><td class="esq">${UI.jogador(x)}</td><td>${x.idade}</td><td>${UI.ovr(x.ovr)}</td><td>${x.j}</td><td>${x.g}</td></tr>`).join('')}</tbody></table>
            </div>
            <div>
                <div class="cartao"><h3>📊 ${U.esc(liga.curto)}</h3>${UI.tabela(s, liga, t.id, true)}</div>
                <div class="cartao"><h3>📅 Jogos</h3>${cal.map(j => `<div class="${j.sem === s.semana ? 'destaque' : ''}">${Tecnico.linhaJogo(s, t.id, j)}</div>`).join('')}</div>
            </div>
        </div>`;
    },

    // -----------------------------------------------------------------
    //  Semana
    // -----------------------------------------------------------------
    async semana(s) {
        const p = Jogador.p(s);
        const tr = TREINOS[s.car.treino];
        const pessoa = s.pessoa;
        if (p.bonusEscala > 0) { p.bonusEscalaSem = (p.bonusEscalaSem || 0) - 1; if (p.bonusEscalaSem <= 0) p.bonusEscala = 0; }

        // evolução
        if (p.les <= 0) {
            const i = p.idade;
            const ageF = i <= 19 ? 1.25 : i <= 21 ? 1.1 : i <= 24 ? 0.85 : i <= 27 ? 0.4 : i <= 30 ? 0.15 : 0;
            const felF = 0.7 + pessoa.felicidade / 200;
            const gap = Math.max(0, p.pot - p.ovr);
            s.car.prog = (s.car.prog || 0) + gap * 0.0042 * tr.mult * ageF * felF + (s.car.bonusTreino || 0) + (p.tid >= 0 && Jogador.jogouSemana ? 0.02 : 0);
            s.car.bonusTreino = 0;
            while (s.car.prog >= 1) {
                s.car.prog -= 1;
                if (p.ovr < p.pot || p.idade < 24) {
                    p.ovr++;
                    if (p.ovr > p.pot) p.pot = p.ovr;
                    s.car.pontos = (s.car.pontos || 0) + 1;
                    Vida.log(s, `📈 Sua habilidade subiu para ${p.ovr}! (+1 ponto de habilidade)`, 'bom');
                    UI.toast(`📈 Habilidade ${p.ovr}! +1 ponto de habilidade`);
                }
            }
            const hab = id => (s.car.habs || []).includes(id);
            p.cond = U.clamp(p.cond + tr.cond + (hab('motorzinho') ? 5 : 0), 30, 100);
            if (U.chance(tr.les * (p.idade > 30 ? 1.5 : 1) * (hab('blindado') ? 0.5 : 1))) {
                p.les = U.int(1, 6);
                Vida.log(s, `🚑 Você se lesionou no treino. Vai ficar ${p.les} semana(s) fora.`, 'ruim');
                Vida.mudar(s, { felicidade: -5, saude: -3 });
                UI.toast('🚑 Lesão no treino!', 'erro');
                await Jogador.lesaoSeria(s);
            }
            if (s.car.treino === 'intenso') pessoa.saude = U.clamp(pessoa.saude - 0.3, 0, 100);
        }
        Jogador.jogouSemana = false;
        p.cond = Math.min(p.cond, 65 + pessoa.felicidade * 0.35);
        if (p.recaida > 0) {
            p.recaida--;
            if (p.les <= 0 && U.chance(0.2)) {
                p.les = U.int(3, 8);
                Vida.log(s, `🚑 RECAÍDA! A lesão voltou e você vai ficar ${p.les} semanas fora.`, 'ruim');
                Vida.mudar(s, { felicidade: -8, saude: -4 });
                UI.toast('🚑 Recaída da lesão!', 'erro');
            }
        }

        // seleção
        if ((s.semana === 10 || s.semana === 32) && p.tid >= 0 && p.les <= 0) await Jogador.convocacao(s);
        // renovação
        if (s.semana === 30 && p.tid >= 0 && p.contr === 1) await Jogador.renovacao(s);
        // propostas
        if (p.tid < 0) {
            if (U.chance(0.45)) await Jogador.proposta(s, true);
        } else if (Mundo.emJanela(s)) {
            const t = s.times[p.tid];
            const ch = 0.12 + (s.car.pedirTransf ? 0.3 : 0) + pessoa.fama / 400 + Math.max(0, p.ovr - t.rep) * 0.03;
            if (U.chance(ch)) await Jogador.proposta(s, false);
        }
        // aposentadoria forçada
        if (p.idade >= 41) await Jogador.aposentar(s, true);
    },

    async lesaoSeria(s) {
        const p = Jogador.p(s);
        if (p.les < 3) return;
        const custo = U.redondo(Math.max(5000, p.sal * 0.06));
        await Vida.decisaoLesao(s, p, { custo, pagar: v => { s.pessoa.dinheiro -= v; }, quem: 'você', proprio: true });
    },

    async convocacao(s) {
        const p = Jogador.p(s);
        const forte = FORCA_SELECAO[s.pessoa.pais] || 80;
        const corte = forte - 12;
        if (p.ovr < corte) return;
        const ch = U.clamp((p.ovr - corte) * 0.09 + s.pessoa.fama / 300, 0, 0.95);
        if (!U.chance(ch)) return;
        const i = await UI.perguntar('Convocado para a seleção!', `O técnico da seleção ${Mundo.pais(s.pessoa.pais).bandeira} te convocou para os jogos das Eliminatórias!`, ['🙌 Aceitar com orgulho', '🙅 Pedir dispensa (cansaço)'], '📞');
        if (i === 1) {
            Vida.log(s, '🙅 Você pediu dispensa da seleção.', '');
            Vida.mudar(s, { fama: -2 });
            return;
        }
        const jogos = 2;
        let gols = 0;
        for (let k = 0; k < jogos; k++) gols += U.chance({ G: 0, D: 0.05, M: 0.15, A: 0.35 }[POS_GRUPO[p.pos]] * (p.ovr / 80)) ? 1 : 0;
        s.car.selecao.jogos += jogos;
        s.car.selecao.gols += gols;
        p.cond = Math.max(40, p.cond - 10);
        const txt = `🇺🇳 Você defendeu a seleção em ${jogos} jogos${gols ? ` e marcou ${gols} gol(s)!` : '.'}`;
        Vida.log(s, txt, 'bom');
        Vida.mudar(s, { fama: 3 + gols * 2, felicidade: 6 });
        await UI.aviso('Seleção', txt, '🇺🇳');
    },

    async renovacao(s) {
        const p = Jogador.p(s), t = s.times[p.tid];
        const el = Mundo.elenco(s, t).sort((a, b) => b.ovr - a.ovr);
        const rank = el.indexOf(p);
        const quer = rank < 16 || (p.idade <= 21 && p.pot >= t.rep);
        if (!quer) {
            Vida.log(s, `📄 O ${t.nome} avisou que não vai renovar seu contrato. Você sai livre no fim da temporada.`, 'ruim');
            await UI.aviso('Sem renovação', `O ${U.esc(t.nome)} não vai renovar seu contrato. No fim da temporada você estará livre para assinar com qualquer clube.`, '📄');
            return;
        }
        let sal = U.redondo(Math.max(p.sal * 1.1, Mundo.salarioPedido(p, Mundo.riquezaDoTime(s, t))));
        const i = await UI.perguntar('Proposta de renovação', `O ${U.esc(t.nome)} quer renovar por mais 3 anos com salário de <b>${U.dinheiro(sal)}/ano</b> (hoje: ${U.dinheiro(p.sal)}).`, ['✍️ Assinar', '💬 Pedir 30% a mais', '👋 Recusar e sair livre'], '📄');
        if (i === 1) {
            if (U.chance(0.4 + Math.max(0, rank < 5 ? 0.3 : 0))) {
                sal = U.redondo(sal * 1.3);
                await UI.aviso('Aceito!', `O clube topou: ${U.dinheiro(sal)}/ano!`, '🤑');
            } else {
                await UI.aviso('Negativa', 'O clube não aceitou e manteve a proposta original. Você assinou mesmo assim.', '😐');
            }
        } else if (i === 2) {
            s.car.vaiSair = true;
            Vida.log(s, `👋 Você recusou renovar com o ${t.nome}.`, '');
            return;
        }
        p.sal = sal;
        p.contr = 4;
        Vida.log(s, `✍️ Você renovou com o ${t.nome} até ${s.ano + 3}. Salário: ${U.dinheiro(sal)}/ano.`, 'bom');
    },

    async proposta(s, livre) {
        const p = Jogador.p(s);
        const atual = p.tid >= 0 ? s.times[p.tid] : null;
        const minRep = livre ? p.ovr - 14 : Math.max(p.ovr - 9, atual ? atual.rep - 6 : 0);
        const maxRep = p.ovr + (livre ? 0 : 4);
        const cands = s.times.filter(t => t.id !== p.tid && t.rep >= minRep && t.rep <= maxRep);
        if (!cands.length) return;
        const dest = U.escolha(cands);
        const liga = Mundo.liga(s, dest.liga);
        const taxa = livre ? 0 : U.redondo(Mundo.valor(p) * U.rand(0.9, 1.25));
        let sal = U.redondo(Math.max(p.sal * (livre ? 0.9 : 1.08), Mundo.salarioPedido(p, liga.riqueza) * U.rand(0.95, 1.3)));
        const anos = U.int(2, 5);
        const i = await UI.perguntar('Proposta de transferência!', `O <b>${U.esc(dest.nome)}</b> (${U.esc(liga.nome)}, ${Mundo.posicaoNaLiga(s, dest.id)}º lugar) quer te contratar!<br>
            <div class="ficha"><div><span>Salário</span><b>${U.dinheiro(sal)}/ano</b></div><div><span>Contrato</span><b>${anos} anos</b></div>${taxa ? `<div><span>Taxa ao seu clube</span><b>${U.dinheiro(taxa)}</b></div>` : ''}<div><span>Força do time</span><b>${U.estrelas((dest.rep - 50) / 7)}</b></div></div>`,
            ['✅ Aceitar', '💬 Pedir salário maior', '❌ Recusar'], '📨');
        if (i === 2) { Vida.log(s, `❌ Você recusou proposta do ${dest.nome}.`, ''); return; }
        if (i === 1) {
            if (U.chance(0.5)) { sal = U.redondo(sal * 1.2); await UI.aviso('Topa!', `O ${U.esc(dest.nome)} aumentou para ${U.dinheiro(sal)}/ano.`, '🤝'); }
            else { await UI.aviso('Desistiram', `O ${U.esc(dest.nome)} achou que você pediu demais e desistiu.`, '🚪'); return; }
        }
        if (atual) {
            const rank = Mundo.elenco(s, atual).sort((a, b) => b.ovr - a.ovr).indexOf(p);
            if (rank < 3 && !s.car.pedirTransf && U.chance(0.4)) {
                Vida.log(s, `🚫 O ${atual.nome} recusou vender você para o ${dest.nome}.`, 'ruim');
                Vida.mudar(s, { felicidade: -5 });
                return UI.aviso('Seu clube vetou', `O ${U.esc(atual.nome)} disse que você é inegociável e recusou a proposta.`, '🚫');
            }
        }
        Mundo.transferir(s, p, dest, taxa);
        p.sal = sal;
        p.contr = anos;
        s.car.pedirTransf = false;
        s.car.vaiSair = false;
        s.car.clubes.push(dest.id);
        Mundo.noticia(s, atual ? `💸 ${p.nome} deixa o ${atual.nome} e assina com o ${dest.nome}${taxa ? ` por ${U.dinheiro(taxa)}` : ''}.` : `✍️ ${dest.nome} contrata ${p.nome}, que estava livre.`, 'transfer');
        Vida.log(s, `✍️ Você assinou com o ${dest.nome}! Salário: ${U.dinheiro(sal)}/ano.`, 'bom');
        Vida.mudar(s, { felicidade: 8, fama: 2 });
        Conquistas.maximo(s, 'maiorVenda', taxa);
        await Jogador.cenaNovoClube(s, dest, taxa ? `Uma transferência de ${U.dinheiro(taxa)}!` : 'Chegou de graça e quer mostrar serviço!');
    },

    jogouSemana: false,

    async posJogo(s, jogo, m, r) {
        const p = Jogador.p(s);
        const st = m.st[p.id];
        const t = s.times[p.tid];
        const lado = jogo.h === p.tid ? 0 : 1;
        const adv = s.times[lado === 0 ? jogo.a : jogo.h];
        const gf = lado === 0 ? r.gh : r.ga, gc = lado === 0 ? r.ga : r.gh;
        const venceu = r.venc === p.tid || (r.venc == null && gf > gc);
        const empate = r.venc == null && gf === gc;
        const resTxt = venceu ? 'vitória' : empate ? 'empate' : 'derrota';
        const naRes = (empate ? 'no ' : 'na ') + resTxt;
        if (st) {
            Jogador.jogouSemana = true;
            const n = r.notas[p.id];
            let txt = `⚽ ${st.entrou > 0 ? `Entrou aos ${st.entrou}' ${naRes}` : `Jogou ${empate ? 'o' : 'a'} ${resTxt}`} por ${gf} x ${gc} contra o ${adv.nome} (nota ${n.toFixed(1)})`;
            if (st.g) txt += ` e marcou ${st.g} gol${st.g > 1 ? 's' : ''}${st.g >= 3 ? ' — HAT-TRICK!' : '!'}`;
            if (st.a) txt += ` ${st.g ? 'Deu' : 'e deu'} ${st.a} assistência${st.a > 1 ? 's' : ''}.`;
            if (st.vm) txt += ' 🟥 Foi expulso.';
            if (r.melhor === p.id) { txt += ' ⭐ Melhor em campo! (+1 ponto de habilidade)'; s.car.pontos = (s.car.pontos || 0) + 1; Conquistas.contar(s, 'mvps'); }
            if (st.g >= 3) { Conquistas.contar(s, 'hattricks'); s.car.pontos = (s.car.pontos || 0) + 1; }
            const classico = Mundo.classico(s, jogo.h, jogo.a);
            if (classico) txt += venceu ? ' 🔥 Vitória no CLÁSSICO!' : '';
            Vida.log(s, txt, n >= 7.5 ? 'bom' : n < 6 ? 'ruim' : '');
            const kc = classico ? 2 : 1;
            Vida.mudar(s, { fama: (Math.max(0, st.g * 0.6 + st.a * 0.3 + (n - 6.8) * 0.4) * (Mundo.liga(s, t.liga).nivel === 1 ? 1 : 0.5) + (st.comemorou || 0) * 0.3) * kc, felicidade: ((venceu ? 1.5 : empate ? 0 : -1.5) + (n - 6.5)) * kc });
            if (st.comemorou && /ouvido/i.test(s.car.comemoracao) && lado === 1 && U.chance(0.25)) {
                Vida.log(s, '🙉 Sua comemoração "mão no ouvido" provocou a torcida rival e virou polêmica!', '');
                Vida.mudar(s, { fama: 2 });
            }
        } else {
            const noBanco = m.banco.some(b => b.includes(p.id));
            const motivo = p.les > 0 ? 'lesionado' : p.susp > 0 ? 'suspenso' : noBanco ? 'no banco' : 'fora dos relacionados';
            Vida.log(s, `🪑 Você ficou ${motivo} ${naRes} por ${gf} x ${gc} contra o ${adv.nome}.`, '');
            if (motivo === 'no banco' || motivo === 'fora dos relacionados') Vida.mudar(s, { felicidade: -1.5 });
        }
        if (st && st.les && p.les >= 3) await Jogador.lesaoSeria(s);
        if (Mundo.ehFinal(s, jogo) && venceu) {
            const c = Mundo.copa(s, jogo.comp);
            s.pessoa.trofeus.push({ ano: s.ano, txt: `${c.nome} (${t.nome})` });
            Vida.mudar(s, { felicidade: 20, fama: c.pais ? 6 : 10 });
            Vida.log(s, `🏆 CAMPEÃO: ${c.nome.toUpperCase()}!`, 'titulo');
            await Cena.titulo(c.nome, t, `${p.nome} levanta a taça!`);
            return '<div class="rf-linha destaque-bom">🏆 VOCÊ É CAMPEÃO!</div>';
        }
        return '';
    },

    async antesFimTemporada(s) {
        const p = Jogador.p(s);
        const t = p.tid >= 0 ? s.times[p.tid] : null;
        s.car.hist.push({ ano: s.ano, time: t ? t.nome : 'Sem clube', idade: p.idade, ovr: p.ovr, j: p.j, g: p.g, a: p.a, nota: p.j ? (p.ns / p.j).toFixed(2) : null });
        if (t && Mundo.posicaoNaLiga(s, t.id) === 1 && p.j >= 5) {
            const liga = Mundo.liga(s, t.liga);
            s.pessoa.trofeus.push({ ano: s.ano, txt: `${liga.nome} (${t.nome})` });
            Vida.mudar(s, { felicidade: 15, fama: liga.nivel === 1 ? 8 : 3 });
            Vida.log(s, `🏆 CAMPEÃO DA ${liga.nome.toUpperCase()} com o ${t.nome}!`, 'titulo');
            await Cena.titulo(liga.nome, t, `${p.nome} é campeão com o ${t.nome}!`);
        }
        Vida.log(s, `📊 Temporada ${s.ano}: ${p.j} jogos, ${p.g} gols, ${p.a} assistências.`, '');
    },

    resumoTemporada(s) {
        const p = Jogador.p(s);
        const t = p.tid >= 0 ? s.times[p.tid] : null;
        const liga = t ? Mundo.liga(s, t.liga) : null;
        const inicio = s.car.ovrInicioTemp || p.ovr;
        return {
            tid: t ? t.id : -1, ligaId: liga ? liga.id : null, ligaCurto: liga ? liga.curto : null,
            ehMeu: pr => pr.pid === p.id,
            frase: p.idade < 23 ? 'O futuro é seu, garoto!' : p.idade < 31 ? 'No auge. Bora fazer história!' : 'A experiência vale ouro.',
            html: `${t ? Cena.camisa(t, p.nome, s.car.camisa) : ''}<div class="cena-titulo">${U.esc(p.nome)}</div>
                <div class="grade-numeros">
                    <div><b data-alvo="${p.j}">0</b><small>jogos</small></div>
                    <div><b data-alvo="${p.g}">0</b><small>gols</small></div>
                    <div><b data-alvo="${p.a}">0</b><small>assistências</small></div>
                    <div><b data-alvo="${p.j ? (p.ns / p.j).toFixed(2) : 0}" data-casas="1">0</b><small>nota média</small></div>
                </div>
                <div class="cena-sub">Habilidade: ${inicio} → <b>${p.ovr}</b> ${p.ovr > inicio ? '📈' : p.ovr < inicio ? '📉' : ''}</div>`,
        };
    },

    async depoisFimTemporada(s, resumo) {
        const p = Jogador.p(s);
        for (const pr of resumo.premios) {
            if (pr.pid !== p.id) continue;
            s.pessoa.trofeus.push({ ano: resumo.ano, txt: pr.tipo });
            Vida.mudar(s, { fama: pr.tipo === 'Bola de Ouro' ? 25 : 6, felicidade: 15 });
            Vida.log(s, `🏅 Você ganhou o prêmio: ${pr.tipo}!`, 'titulo');
            s.car.pontos = (s.car.pontos || 0) + 2;
            await Cena.simples(pr.tipo === 'Bola de Ouro' ? '⚽' : '🏅', U.esc(pr.tipo).toUpperCase(), `${U.esc(p.nome)} — ${U.esc(pr.info || '')} (+2 pontos de habilidade)`, 'radial-gradient(circle at 50% 35%, #6b5200 0%, #05070c 70%)', 'titulo', ['#ffd700', '#fff3b0', '#ffffff']);
        }
        // torneio de seleções
        if (s.car.selecao.jogos > 0 && (resumo.ano % 2 === 0)) await Jogador.torneioSelecoes(s, resumo.ano);
        // envelhecimento (a pessoa faz aniversário logo depois, em Vida.anoNovo)
        p.idade++;
        if (p.idade >= 31) {
            const d = U.rand(1, 3.5) * (p.idade >= 34 ? 1.5 : 1) * (1.3 - s.pessoa.saude / 100 * 0.6);
            const antes = p.ovr;
            p.ovr = Math.max(35, Math.round(p.ovr - d));
            if (p.ovr < antes) Vida.log(s, `📉 A idade pesa: sua habilidade caiu para ${p.ovr}.`, 'ruim');
        }
        // contrato
        if (p.tid >= 0) {
            p.contr--;
            if (p.contr <= 0) {
                const t = s.times[p.tid];
                Mundo.liberar(s, p);
                Vida.log(s, `📄 Seu contrato com o ${t.nome} terminou. Você está livre no mercado.`, '');
            }
        }
        s.car.vaiSair = false;
        s.car.ovrInicioTemp = p.ovr;
        if (p.idade >= 36 && p.ovr < 60) {
            const i = await UI.perguntar('Fim da linha?', `Você tem ${p.idade} anos e seu corpo já não responde como antes. Pensa em se aposentar?`, ['👴 Sim, pendurar as chuteiras', '💪 Ainda tenho lenha pra queimar'], '🤔');
            if (i === 0) await Jogador.aposentar(s, false, true);
        }
    },

    async torneioSelecoes(s, ano) {
        const p = Jogador.p(s);
        const pais = s.pessoa.pais;
        const forte = FORCA_SELECAO[pais] || 80;
        if (p.ovr < forte - 10) return;
        const nome = ano % 4 === 2 ? 'Copa do Mundo' : (pais === 'BRA' || pais === 'ARG') ? 'Copa América' : 'Eurocopa';
        const fases = ['fase de grupos', 'oitavas de final', 'quartas de final', 'semifinal', 'final'];
        let f = 0;
        if (U.chance(0.85)) {
            f = 1;
            while (f < 5) {
                const pv = U.clamp(0.5 + (forte - 86) * 0.04 + (p.ovr - 80) * 0.01, 0.2, 0.8);
                if (!U.chance(pv)) break;
                f++;
            }
        }
        const gols = U.int(0, { G: 0, D: 1, M: 2, A: 4 }[POS_GRUPO[p.pos]]);
        s.car.selecao.jogos += 3 + f;
        s.car.selecao.gols += gols;
        let txt;
        if (f === 5) {
            txt = `🏆 VOCÊ É CAMPEÃO DA ${nome.toUpperCase()} ${ano}! ${gols} gol(s) no torneio.`;
            s.pessoa.trofeus.push({ ano, txt: `${nome} (seleção)` });
            Vida.mudar(s, { fama: nome === 'Copa do Mundo' ? 25 : 12, felicidade: 25 });
        } else {
            txt = `🇺🇳 Na ${nome} ${ano}, sua seleção caiu na ${fases[f]}. Você marcou ${gols} gol(s).`;
            Vida.mudar(s, { fama: 3 + f, felicidade: f >= 3 ? 0 : -5 });
        }
        Vida.log(s, txt, f === 5 ? 'titulo' : '');
        await UI.aviso(nome, txt, f === 5 ? '🏆' : '🇺🇳');
    },

    async aposentar(s, forcado, jaDecidiu) {
        const p = Jogador.p(s);
        if (!forcado && !jaDecidiu && !(await UI.confirmar(`Tem certeza que quer se aposentar aos ${p.idade} anos?`, 'Aposentar', 'Ainda não'))) return;
        if (forcado) await UI.aviso('Aposentadoria', `Aos ${p.idade} anos, chegou a hora. Seu corpo pede para parar.`, '👴');
        const t = p.tid >= 0 ? s.times[p.tid] : null;
        if (p.j > 0 || t) s.car.hist.push({ ano: s.ano, time: t ? t.nome : 'Sem clube', idade: p.idade, ovr: p.ovr, j: p.j, g: p.g, a: p.a, nota: p.j ? (p.ns / p.j).toFixed(2) : null });
        const totG = U.soma(s.car.hist, h => h.g), totJ = U.soma(s.car.hist, h => h.j);
        if (t) Mundo.liberar(s, p);
        p.aposentado = true;
        Mundo.noticia(s, `👋 ${p.nome} se aposenta aos ${p.idade} anos, com ${totG} gols em ${totJ} jogos.`, 'geral');
        Vida.log(s, `👋 Você se aposentou do futebol: ${totJ} jogos, ${totG} gols e ${s.pessoa.trofeus.length} títulos.`, 'titulo');
        await Cena.simples('👋', `OBRIGADO, ${U.esc(p.nome.split(' ')[0].toUpperCase())}!`, `${totJ} jogos · ${totG} gols · ${s.pessoa.trofeus.length} títulos. A torcida aplaude de pé.`, 'radial-gradient(circle at 50% 40%, #233a5e 0%, #05070c 70%)', 'torcida');
        const i = await UI.perguntar('E agora?', `Fim da carreira de jogador: <b>${totJ} jogos</b>, <b>${totG} gols</b>, <b>${s.pessoa.trofeus.length} títulos</b>.<br><br>O que você quer fazer da vida?`, ['📋 Virar técnico de futebol', '🏖️ Curtir a aposentadoria (encerrar)'], '🤔');
        if (i === 0) {
            Tecnico.iniciarAposentado(s);
            Jogo.aba = 'inicio';
            await UI.aviso('Nova carreira', 'Você agora é técnico! Os clubes interessados aparecem na aba <b>Início</b>. Avance as semanas se nenhum aparecer.', '📋');
        } else {
            while (!s.pessoa.morto && s.pessoa.idade < 110) {
                s.pessoa.dinheiro += U.soma(s.pessoa.patrocinios, x => x.semana) * 52;
                s.ano++;
                if (U.chance(0.3)) Vida.log(s, U.escolha(['🏖️ Você passou o ano viajando pelo mundo.', '⚽ Você jogou uma pelada com os amigos e ainda deu caneta em todo mundo.', '📺 Você virou comentarista de TV por uma temporada.', '👨‍👧 Você curtiu muito a família.', '🎣 Você descobriu a pesca como hobby.', '🏫 Você abriu uma escolinha de futebol.']), '');
                Vida.anoNovo(s);
            }
        }
    },

    // -----------------------------------------------------------------
    //  Ações em outros jogadores (só olhar)
    // -----------------------------------------------------------------
    acoesJogador() { return []; },
};

Object.assign(ACOES, {
    jgEscolherClube: async d => {
        const s = Jogo.sTmp;
        const t = s.times[+d.tid];
        if (!(await UI.confirmar(`Assinar com o <b>${U.esc(t.nome)}</b>?`, 'Assinar'))) return;
        Jogador.iniciar(Jogo.formTmp, +d.tid);
    },
    jgHab: d => {
        const s = Jogo.s, h = HABILIDADES[d.h];
        s.car.habs = s.car.habs || [];
        if (s.car.habs.includes(d.h) || (s.car.pontos || 0) < h.custo) return;
        s.car.pontos -= h.custo;
        s.car.habs.push(d.h);
        if (d.h === 'lider') Jogador.p(s).bonusFixo = 1.5;
        Vida.log(s, `⚡ Nova habilidade especial: ${h.icone} ${h.nome}!`, 'bom');
        UI.toast(`⚡ Você desbloqueou ${h.icone} <b>${h.nome}</b>!`);
        Som.tocar('conquista');
        Jogo.manterRolagem = true;
        Jogo.atualizar();
    },
    jgCamisa: (d, el) => { Jogo.s.car.camisa = U.clamp(Math.round(+el.value || 10), 1, 99); Jogo.manterRolagem = true; Jogo.atualizar(); },
    jgComemora: (d, el) => { Jogo.s.car.comemoracao = el.value; UI.toast(`🎉 Nova comemoração: ${el.value}`); },
    jgTreino: d => { Jogo.s.car.treino = d.t; Jogo.manterRolagem = true; Jogo.atualizar(); UI.toast(`Treino: ${TREINOS[d.t].nome}`); },
    async jgConversarTecnico() {
        const s = Jogo.s, p = Jogador.p(s);
        if (s.car.conversaSem === s.ano * 100 + s.semana) return UI.toast('Você já falou com o técnico esta semana.');
        s.car.conversaSem = s.ano * 100 + s.semana;
        const t = s.times[p.tid];
        const media = Mundo.elenco(s, t).filter(x => POS_GRUPO[x.pos] === POS_GRUPO[p.pos]).sort((a, b) => b.ovr - a.ovr);
        const ok = p.ovr >= (media[3] ? media[3].ovr : 0) - 3 && U.chance(0.55);
        let txt;
        if (ok) {
            p.bonusEscala = 3; p.bonusEscalaSem = 4;
            txt = '🗣️ O técnico gostou da sua atitude e prometeu te dar mais chances nas próximas semanas.';
        } else {
            txt = '🗣️ O técnico disse: "Treina mais que a chance aparece, garoto."';
            Vida.mudar(s, { felicidade: -2 });
        }
        Vida.log(s, txt, ok ? 'bom' : '');
        await UI.aviso('Conversa com o técnico', txt, '🗣️');
        Jogo.atualizar();
    },
    async jgAumento() {
        const s = Jogo.s, p = Jogador.p(s);
        s.car.aumentoAno = s.ano;
        const t = s.times[p.tid];
        const merecido = Mundo.salarioPedido(p, Mundo.riquezaDoTime(s, t));
        const bom = p.j >= 8 && p.ns / p.j >= 6.8;
        let txt;
        if ((merecido > p.sal * 1.1 || bom) && U.chance(0.6)) {
            const novo = U.redondo(Math.max(merecido, p.sal * U.rand(1.15, 1.35)));
            txt = `💰 O clube aceitou! Seu salário subiu de ${U.dinheiro(p.sal)} para ${U.dinheiro(novo)} por ano.`;
            p.sal = novo;
            Vida.mudar(s, { felicidade: 6 });
        } else {
            txt = '💰 A diretoria negou o aumento. "Mostra em campo primeiro."';
            Vida.mudar(s, { felicidade: -3 });
        }
        Vida.log(s, txt, '');
        await UI.aviso('Pedido de aumento', txt, '💰');
        Jogo.atualizar();
    },
    jgTransf: () => {
        const s = Jogo.s;
        s.car.pedirTransf = !s.car.pedirTransf;
        if (s.car.pedirTransf) {
            Vida.log(s, '🔄 Você pediu ao seu empresário para buscar um novo clube.', '');
            UI.toast('Seu empresário vai procurar propostas (elas chegam nas janelas de transferência).');
        }
        Jogo.atualizar();
    },
    async jgAposentar() {
        await Jogador.aposentar(Jogo.s, false);
        if (Jogo.s.pessoa.morto) Jogo.fimDeVida(); else Jogo.atualizar();
    },
});
