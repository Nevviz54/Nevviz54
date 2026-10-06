'use strict';
// =====================================================================
//  CARREIRA DE TÉCNICO
// =====================================================================

// Treino coletivo da semana
const TREINOS_TIME = {
    equilibrado: { nome: 'Equilibrado', icone: '⚖️', ata: 0, def: 0, cond: 0, desc: 'Sem bônus nem cansaço extra.' },
    ataque: { nome: 'Finalização', icone: '🎯', ata: 1.5, def: -0.5, cond: 0, desc: '+ataque, um pouco menos de defesa.' },
    defesa: { nome: 'Marcação', icone: '🛡️', ata: -0.5, def: 1.5, cond: 0, desc: '+defesa, um pouco menos de ataque.' },
    tatico: { nome: 'Tático', icone: '🧠', ata: 0.8, def: 0.8, cond: -4, desc: 'Melhora tudo, mas cansa o elenco.' },
    fisico: { nome: 'Físico', icone: '💪', ata: 0, def: 0, cond: 8, desc: 'Elenco recupera mais o físico.' },
    descanso: { nome: 'Descanso', icone: '😴', ata: -0.6, def: -0.6, cond: 15, desc: 'Recupera muito, mas o time perde ritmo.' },
};

const Tecnico = {
    meuTime: s => s.car.tid,
    time: s => s.car.tid >= 0 ? s.times[s.car.tid] : null,

    abas(s) {
        if (s.car.tid < 0) {
            return [
                { id: 'inicio', nome: 'Início', icone: '🏠', render: Tecnico.inicio },
                { id: 'tabelas', nome: 'Tabelas', icone: '📊', render: Comum.tabelas },
                { id: 'vida', nome: 'Vida', icone: '❤️', render: Comum.vida },
                { id: 'carreira', nome: 'Carreira', icone: '🏆', render: Tecnico.carreira },
                { id: 'selecao', nome: 'Seleção', icone: '🌎', render: Selecoes.tela },
                { id: 'conquistas', nome: 'Conquistas', icone: '🏅', render: Conquistas.tela },
                { id: 'noticias', nome: 'Notícias', icone: '📰', render: Comum.noticias },
                { id: 'mundo', nome: 'Mundo', icone: '🌍', render: Comum.mundo },
            ];
        }
        return [
            { id: 'inicio', nome: 'Clube', icone: '🏟️', render: Tecnico.inicio },
            { id: 'elenco', nome: 'Elenco', icone: '👥', render: Tecnico.elenco },
            { id: 'vestiario', nome: 'Vestiário', icone: '💬', render: Mot.tela },
            { id: 'tatica', nome: 'Tática', icone: '📋', render: Tecnico.tatica },
            { id: 'mercado', nome: 'Mercado', icone: '💸', render: Tecnico.mercado },
            { id: 'calendario', nome: 'Jogos', icone: '📅', render: Tecnico.calendario },
            { id: 'tabelas', nome: 'Tabelas', icone: '📊', render: Comum.tabelas },
            { id: 'financas', nome: 'Finanças', icone: '💰', render: Tecnico.financas },
            { id: 'estrutura', nome: 'Estrutura', icone: '🏗️', render: Tecnico.estrutura },
            { id: 'vida', nome: 'Vida', icone: '❤️', render: Comum.vida },
            { id: 'carreira', nome: 'Carreira', icone: '🏆', render: Tecnico.carreira },
            { id: 'selecao', nome: 'Seleção', icone: '🌎', render: Selecoes.tela },
            { id: 'conquistas', nome: 'Conquistas', icone: '🏅', render: Conquistas.tela },
            { id: 'noticias', nome: 'Notícias', icone: '📰', render: Comum.noticias },
            { id: 'mundo', nome: 'Mundo', icone: '🌍', render: Comum.mundo },
        ];
    },

    // -----------------------------------------------------------------
    //  Começo de carreira
    // -----------------------------------------------------------------
    telaEscolherClube(form, sJaExiste) {
        Jogo.ui.paisClube = Jogo.ui.paisClube || form.pais || 'BRA';
        const pais = DADOS.paises.find(p => p.id === Jogo.ui.paisClube);
        const abas = DADOS.paises.map(p => `<button class="chip-btn ${p.id === pais.id ? 'ativo' : ''}" data-acao="tcPais" data-pais="${p.id}">${p.bandeira} ${p.nome}</button>`).join('');
        const ligas = pais.ligas.map(L => {
            const times = L.times.map(T => ({ nome: T[0], sigla: T[1], forca: T[2], c1: T[3], c2: T[4] })).sort((a, b) => b.forca - a.forca);
            return `<h4>${U.esc(L.nome)}</h4><div class="grade-clubes">${times.map(t => `
                <button class="card-clube" data-acao="tcEscolher" data-nome="${U.esc(t.nome)}">
                    ${UI.escudo(t)} <span><b>${U.esc(t.nome)}</b><small>${U.estrelas((t.forca - 50) / 7)}</small></span>
                </button>`).join('')}</div>`;
        }).join('');
        Jogo.telaSimples('🏟️ Escolha seu clube', `<p class="cinza">Clubes maiores cobram resultados mais rápido. Começar por baixo é mais desafiador (e divertido).</p>
            <div class="sub-abas">${abas}</div>${ligas}`, sJaExiste ? 'menuVoltar' : 'menuNovo');
    },

    async iniciar(form, nomeClube) {
        const s = Mundo.criar(ANO_INICIAL);
        s.modo = 'tecnico';
        s.pessoa = Vida.criarPessoa({ nome: form.nome, idade: form.idade, pais: form.pais });
        s.pessoa.dinheiro = 20000 + form.rep * 4000;
        s.pessoa.fama = form.rep * 0.4;
        s.car = Tecnico.novaCarreira(form.rep);
        const t = s.times.find(x => x.nome === nomeClube);
        Vida.log(s, `📋 ${form.nome} começa a carreira de treinador aos ${form.idade} anos.`, 'bom');
        Jogo.migrar(s);
        Tecnico.contratar(s, t.id);
        Jogo.s = s;
        Jogo.aba = 'inicio';
        Jogo.atualizar();
        await Tecnico.cenaNovoClube(s, t);
        await UI.aviso(`Bem-vindo ao ${t.nome}!`, `A diretoria espera que o time termine em <b>${Tecnico.expectativa(s)}º lugar</b> na ${U.esc(Mundo.liga(s, t.liga).nome)}.<br><br>Dica: veja o <b>Elenco</b>, ajuste a <b>Tática</b> (treino da semana e capitão também!) e clique em <b>Avançar semana</b>.`, '🤝');
    },

    cenaNovoClube(s, t) {
        return Cena.novoClube(s, t, {
            papel: 'tecnico', nome: s.pessoa.nome,
            linhas: [['Cargo', 'Técnico'], ['Contrato', `até ${s.ano + s.car.contr - 1}`], ['Salário', `${U.dinheiro(s.car.sal)}/ano`],
                ['Meta da diretoria', `${Tecnico.expectativa(s)}º lugar`], ['Caixa do clube', U.dinheiro(t.saldo)]],
            frase: 'A torcida está de olho. Boa sorte, professor!',
        });
    },

    novaCarreira(rep) {
        return {
            tipo: 'tecnico', tid: -1, rep, conf: 55, sal: 0, contr: 2, receita: 0, venda: [], ofertas: [], hist: [], titulos: 0, v: 0, e: 0, d: 0, verbaPedida: -1, recusas: {},
            treinoTime: 'equilibrado', capitao: null, obra: null, clubesTreinados: [], invicto: 0, titTemp: {},
        };
    },

    // vem da carreira de jogador
    iniciarAposentado(s) {
        const fama = s.pessoa.fama;
        const rep = U.clamp(Math.round(15 + fama * 0.6 + (s.car.estudo >= 10 ? 15 : 0)), 10, 90);
        const antigo = s.car;
        s.modo = 'tecnico';
        s.car = Tecnico.novaCarreira(rep);
        s.car.histJogador = antigo.hist;
        s.car.estudo = antigo.estudo;
        s.car.ofertas = Tecnico.gerarOfertas(s, 3);
        Vida.log(s, `📋 Você pendurou as chuteiras e agora quer ser técnico. Reputação inicial: ${rep}.`, 'bom');
    },

    contratar(s, tid) {
        const t = s.times[tid];
        const liga = Mundo.liga(s, t.liga);
        s.car.tid = tid;
        s.car.conf = 55;
        s.car.contr = 2;
        s.car.sal = U.redondo((50000 + Math.pow(t.rep, 2) * 260 * (0.4 + liga.riqueza * 0.6)) * (0.6 + s.car.rep / 120));
        s.car.receita = Tecnico.receita(s, t);
        s.car.venda = [];
        s.car.ofertas = [];
        s.car.promessa = null;
        s.car.inicioNoClube = { ano: s.ano, sem: s.semana };
        s.car.v = s.car.e = s.car.d = 0;
        s.car.capitao = null;
        s.car.obra = null;
        s.car.invicto = 0;
        s.car.clubesTreinados = s.car.clubesTreinados || [];
        if (!s.car.clubesTreinados.includes(t.nome)) s.car.clubesTreinados.push(t.nome);
        t.tit = null;
        Mundo.noticia(s, `📋 ${s.pessoa.nome} é o novo técnico do ${t.nome}.`, 'clube');
        Vida.log(s, `🤝 Você assinou com o ${t.nome} por 2 temporadas. Salário: ${U.dinheiro(s.car.sal)}/ano.`, 'bom');
    },

    receita(s, t) {
        const liga = Mundo.liga(s, t.liga);
        return U.redondo(Math.pow(t.rep / 50, 4) * 140000 * (0.1 + liga.riqueza * 0.9) * (0.8 + Mundo.infra(t).estadio * 0.1));
    },

    folha(s, t) {
        return U.soma(Mundo.elenco(s, t), p => p.sal);
    },

    expectativa(s) {
        const t = Tecnico.time(s);
        if (!t) return 0;
        const liga = Mundo.liga(s, t.liga);
        const f = Mundo.forca(s, t);
        return 1 + liga.times.filter(id => id !== t.id && Mundo.forca(s, s.times[id]) > f).length;
    },

    rodape(s) {
        const t = Tecnico.time(s);
        if (!t) return '😶 Você está desempregado. Aguarde propostas na aba Início.';
        const prox = Mundo.calendarioDoTime(s, t.id).find(j => !j.res && j.sem >= s.semana);
        if (!prox) return 'Sem mais jogos nesta temporada.';
        const casa = prox.h === t.id;
        const adv = s.times[casa ? prox.a : prox.h];
        return `${prox.sem === s.semana ? '<b class="verde">HOJE</b>' : `Semana ${prox.sem + 1}`} · ${U.esc(prox.nomeComp)} · ${casa ? '🏠' : '✈️'} vs ${UI.escudo(adv)} <b>${U.esc(adv.nome)}</b>`;
    },

    // -----------------------------------------------------------------
    //  Telas
    // -----------------------------------------------------------------
    inicio(s) {
        const t = Tecnico.time(s);
        if (!t) {
            return `<div class="grade-2">
                <div class="cartao"><h3>😶 Desempregado</h3>
                    <p>Clubes que se interessaram por você:</p>
                    ${s.car.ofertas.length ? s.car.ofertas.map((o, i) => {
                const ot = s.times[o.tid];
                return `<div class="oferta">${UI.escudo(ot)} <span class="of-info"><b>${U.esc(ot.nome)}</b><small>${U.esc(Mundo.liga(s, ot.liga).nome)} · ${Mundo.posicaoNaLiga(s, ot.id)}º lugar · força ${Math.round(Mundo.forca(s, ot))}</small></span>
                            <button class="btn btn-primario btn-pequeno" data-acao="tcAceitarOferta" data-i="${i}">Aceitar</button></div>`;
            }).join('') : '<p class="cinza">Nenhuma proposta no momento. Avance as semanas — elas vão aparecer.</p>'}
                    <p class="cinza pequeno">Sua reputação: ${Math.round(s.car.rep)}/100</p>
                </div>
                <div class="cartao">${Comum.perfil(s)}</div>
            </div>`;
        }
        const liga = Mundo.liga(s, t.liga);
        const cal = Mundo.calendarioDoTime(s, t.id);
        const prox = cal.filter(j => !j.res && j.sem >= s.semana).slice(0, 3);
        const ult = cal.filter(j => j.res).slice(-5).reverse();
        const pos = Mundo.posicaoNaLiga(s, t.id);
        const ofertas = s.car.ofertas.length ? `<div class="cartao"><h3>📨 Propostas de emprego</h3>${s.car.ofertas.map((o, i) => {
            const ot = s.times[o.tid];
            return `<div class="oferta">${UI.escudo(ot)} <span class="of-info"><b>${U.esc(ot.nome)}</b><small>${U.esc(Mundo.liga(s, ot.liga).nome)}</small></span><button class="btn btn-pequeno" data-acao="tcAceitarOferta" data-i="${i}">Aceitar</button><button class="btn btn-pequeno btn-fantasma" data-acao="tcRecusarOferta" data-i="${i}">Recusar</button></div>`;
        }).join('')}</div>` : '';
        return `
        <div class="cabecalho-clube" style="--c1:${t.c1};--c2:${t.c2}">
            ${UI.escudo(t, true)}
            <div><h2>${U.esc(t.nome)}</h2><span>${Mundo.pais(t.pais).bandeira} ${U.esc(liga.nome)} · ${pos}º lugar · Força ${Math.round(Mundo.forca(s, t))}</span></div>
            <div class="cc-moral">Moral do elenco<b>${t.moral >= 65 ? '😄 Alta' : t.moral >= 40 ? '🙂 Normal' : '😟 Baixa'}</b></div>
        </div>
        ${ofertas}
        <div class="grade-3">
            <div class="cartao">
                <h3>📅 Próximos jogos</h3>
                ${prox.map(j => Tecnico.linhaJogo(s, t.id, j)).join('') || '<p class="cinza">Temporada encerrada.</p>'}
                <h3>📋 Últimos resultados</h3>
                ${ult.map(j => Tecnico.linhaJogo(s, t.id, j)).join('') || '<p class="cinza">Nenhum jogo ainda.</p>'}
            </div>
            <div class="cartao">
                <h3>👔 Diretoria</h3>
                ${UI.barra('Confiança', s.car.conf, '🤝')}
                <p>Meta: terminar em <b>${Tecnico.expectativa(s)}º</b> ou melhor.${s.car.promessa === 'titulo' ? ' <b>Você prometeu o título!</b>' : ''}</p>
                <p class="pequeno">Contrato até ${s.ano + s.car.contr - 1} · Salário ${U.dinheiro(s.car.sal)}/ano</p>
                <p class="pequeno">Campanha: ${s.car.v}V ${s.car.e}E ${s.car.d}D</p>
                <h3>💰 Caixa do clube</h3>
                <p class="grande ${t.saldo < 0 ? 'vermelho' : 'verde'}">${U.dinheiro(t.saldo)}</p>
            </div>
            <div class="cartao">
                <h3>📊 ${U.esc(liga.curto)}</h3>
                ${UI.tabela(s, liga, t.id, true)}
                <button class="btn btn-pequeno" data-acao="aba" data-aba="tabelas">Ver tabela completa</button>
            </div>
        </div>
        <div class="cartao"><h3>📰 Últimas notícias</h3>${s.noticias.slice(0, 8).map(n => `<div class="noticia n-${n.tipo}"><small>sem. ${n.sem + 1}</small> ${n.txt}</div>`).join('') || '<p class="cinza">Nada por enquanto.</p>'}</div>`;
    },

    linhaJogo(s, tid, j) {
        const casa = j.h === tid;
        const adv = s.times[casa ? j.a : j.h];
        let res = '';
        if (j.res) {
            const gf = casa ? j.res.gh : j.res.ga, gc = casa ? j.res.ga : j.res.gh;
            let r = gf > gc ? 'V' : gf < gc ? 'D' : 'E';
            if (j.res.venc != null && gf === gc) r = j.res.venc === tid ? 'V' : 'D';
            res = `<i class="f-${r}">${r}</i> <b>${gf} x ${gc}</b>${j.res.pen ? ` <small>(pên. ${j.res.pen})</small>` : ''}`;
        }
        return `<div class="linha-jogo"><small>S${j.sem + 1}</small> <span class="lj-comp">${U.esc(j.nomeComp)}</span> ${casa ? '🏠' : '✈️'} ${UI.time(s, adv.id)} <span class="lj-res">${res}</span></div>`;
    },

    elenco(s) {
        const t = Tecnico.time(s);
        const el = Mundo.elenco(s, t).sort((a, b) => POSICOES.indexOf(a.pos) - POSICOES.indexOf(b.pos) || b.ovr - a.ovr);
        const titulares = new Set(Escalacao.doTime(s, t));
        return `<div class="cartao">
            <div class="cartao-topo"><h3>👥 Elenco do ${U.esc(t.nome)} (${el.length} jogadores)</h3><span class="cinza pequeno">Clique no nome para renovar, vender ou dispensar.</span></div>
            <div class="rolavel"><table class="tabela tabela-elenco">
            <thead><tr><th>Pos</th><th class="esq">Jogador</th><th>Idade</th><th>OVR</th><th>Pot.</th><th>Mot.</th><th>Cond.</th><th>J</th><th>G</th><th>A</th><th>Nota</th><th>Contrato</th><th>Salário</th><th>Valor</th></tr></thead>
            <tbody>${el.map(p => `<tr class="${titulares.has(p.id) ? 'titular' : ''}">
                <td>${UI.pos(p.pos)}</td>
                <td class="esq">${UI.jogador(p)} ${titulares.has(p.id) ? '<small class="tag">titular</small>' : ''}${p.les > 0 ? ` 🚑${p.les}` : ''}${p.susp > 0 ? ' 🟥' : ''}${s.car.venda.includes(p.id) ? ' 🏷️' : ''}</td>
                <td>${p.idade}</td><td>${UI.ovr(p.ovr)}</td><td class="pequeno">${Jogo.potencialTxt(s, p)}</td><td>${Mot.badge(p, true)}</td>
                <td>${Math.round(p.cond)}%</td><td>${p.j}</td><td>${p.g}</td><td>${p.a}</td><td>${p.j ? UI.nota(p.ns / p.j) : '-'}</td>
                <td class="${p.contr <= 1 ? 'vermelho' : ''}">${s.ano + p.contr - 1}</td><td>${U.dinheiro(p.sal)}</td><td>${U.dinheiro(Mundo.valor(p))}</td></tr>`).join('')}</tbody></table></div>
        </div>`;
    },

    tatica(s) {
        const t = Tecnico.time(s);
        const slots = FORMACOES[t.form];
        const esc = Escalacao.doTime(s, t);
        const sel = Jogo.ui.slotSel;
        const campo = slots.map(([pos, x, y], i) => {
            const p = s.jog[esc[i]];
            const ef = p ? Math.round(Escalacao.efetivo(p, pos)) : 0;
            const fora = p && p.pos !== pos;
            return `<button class="slot ${sel === i ? 'sel' : ''} ${fora ? 'fora-pos' : ''}" style="left:${x}%;top:${100 - y}%" data-acao="tcSlot" data-i="${i}">
                <span class="slot-pos">${pos}${p && s.car.capitao === p.id ? ' ©' : ''}</span><span class="slot-camisa" style="background:${t.c1};color:${t.c2}">${p ? ef : '?'}</span><span class="slot-nome">${p ? U.esc(p.nome.split(' ').slice(-1)[0]) : '—'}</span></button>`;
        }).join('');
        const usados = new Set(esc);
        const slotPos = sel != null ? slots[sel][0] : null;
        const lista = Mundo.elenco(s, t).sort(slotPos
            ? (a, b) => Escalacao.efetivo(b, slotPos) - Escalacao.efetivo(a, slotPos)
            : (a, b) => POSICOES.indexOf(a.pos) - POSICOES.indexOf(b.pos) || b.ovr - a.ovr);
        return `<div class="grade-tatica">
            <div class="cartao">
                <div class="tatica-controles">
                    <label>Formação <select class="sel" data-mudar="tcForm">${Object.keys(FORMACOES).map(f => `<option ${f === t.form ? 'selected' : ''}>${f}</option>`).join('')}</select></label>
                    <label>Estilo <select class="sel" data-mudar="tcEstilo">${Object.entries(ESTILOS).map(([k, e]) => `<option value="${k}" ${k === t.estilo ? 'selected' : ''}>${e.nome}</option>`).join('')}</select></label>
                    <button class="btn btn-pequeno" data-acao="tcAuto">🤖 Escalar automático</button>
                </div>
                <div class="campinho">${campo}<div class="campo-linha-meio"></div><div class="campo-circulo"></div><div class="campo-area cima"></div><div class="campo-area baixo"></div></div>
                <p class="cinza pequeno">${sel != null ? `Escolha na lista quem vai jogar de <b>${POS_NOME[slotPos]}</b>.` : 'Clique numa posição do campo e depois no jogador da lista. Números em vermelho = jogador fora de posição.'}</p>
                <h3>🏋️ Treino da semana</h3>
                <div class="grade-treino-time">${Object.entries(TREINOS_TIME).map(([k, tr]) => `<button class="atividade ${s.car.treinoTime === k ? 'ativa' : ''}" data-acao="tcTreino" data-t="${k}"><span class="at-icone">${tr.icone}</span><b>${tr.nome}</b><small>${tr.desc}</small></button>`).join('')}</div>
                <h3>©️ Capitão</h3>
                <select class="sel" data-mudar="tcCapitao"><option value="">— sem capitão —</option>${Mundo.elenco(s, t).sort((a, b) => b.ovr - a.ovr).map(p => `<option value="${p.id}" ${s.car.capitao === p.id ? 'selected' : ''}>${p.pos} · ${U.esc(p.nome)} (${p.ovr}, ${p.idade} anos)</option>`).join('')}</select>
                <p class="cinza pequeno">Com o capitão em campo o time joga melhor. Veteranos e craques são os melhores líderes.</p>
            </div>
            <div class="cartao">
                <h3>Jogadores ${t.tit ? '<small class="tag">escalação manual</small>' : '<small class="tag">automática</small>'}</h3>
                <div class="rolavel lista-escalar">${lista.map(p => {
            const disp = Escalacao.disponivel(p);
            const ef = slotPos ? Math.round(Escalacao.efetivo(p, slotPos)) : p.ovr;
            return `<button class="jog-escalar ${usados.has(p.id) ? 'em-campo' : ''}" data-acao="tcEscolherJog" data-pid="${p.id}" ${disp ? '' : 'disabled'}>
                    ${UI.pos(p.pos)} ${Mot.icone(p)}<span class="je-nome">${U.esc(p.nome)}</span> ${!disp ? (p.les > 0 ? '🚑' : '🟥') : ''} <span class="pequeno">${Math.round(p.cond)}%</span> ${UI.ovr(slotPos ? ef : p.ovr)}</button>`;
        }).join('')}</div>
            </div>
        </div>`;
    },

    mercado(s) {
        const f = Object.assign({ pos: '', liga: '', ovr: 60, idade: 40, preco: 0, nome: '', livres: false }, Jogo.ui.filtro);
        const t = Tecnico.time(s);
        let lista = Object.values(s.jog).filter(p => !p.user && p.tid !== t.id && p.tid >= -1);
        // Buscando pelo nome, procura em TODOS os jogadores (com ou sem clube): os filtros de
        // OVR, idade e valor só valem para a busca sem nome.
        const nome = U.semAcento(f.nome);
        if (f.livres) lista = lista.filter(p => p.tid < 0);
        if (f.pos) lista = lista.filter(p => p.pos === f.pos);
        if (f.liga) lista = lista.filter(p => p.tid >= 0 && s.times[p.tid].liga === f.liga);
        if (nome) {
            const partes = nome.split(/\s+/);
            lista = lista.filter(p => { const n = U.semAcento(p.nome); return partes.every(x => n.includes(x)); });
        } else {
            if (f.ovr) lista = lista.filter(p => p.ovr >= f.ovr);
            if (f.idade) lista = lista.filter(p => p.idade <= f.idade);
            if (f.preco) lista = lista.filter(p => Mundo.valor(p) <= f.preco);
        }
        lista.sort((a, b) => b.ovr - a.ovr || a.idade - b.idade);
        const total = lista.length;
        lista = lista.slice(0, 80);
        return `<div class="cartao">
            <div class="cartao-topo"><h3>💸 Mercado de transferências</h3><span>${Mundo.emJanela(s) ? '<b class="verde">Janela ABERTA</b>' : '<b class="vermelho">Janela fechada</b> — só jogadores sem clube'} · Caixa: <b>${U.dinheiro(t.saldo)}</b></span></div>
            <div class="filtros">
                <select class="sel" id="f-pos"><option value="">Todas as posições</option>${POSICOES.map(p => `<option value="${p}" ${f.pos === p ? 'selected' : ''}>${POS_NOME[p]}</option>`).join('')}</select>
                <select class="sel" id="f-liga"><option value="">Todas as ligas</option>${s.ligas.map(l => `<option value="${l.id}" ${f.liga === l.id ? 'selected' : ''}>${Mundo.pais(l.pais).bandeira} ${U.esc(l.nome)}</option>`).join('')}</select>
                <label>OVR mín. <input class="inp curto" id="f-ovr" type="number" min="40" max="99" value="${f.ovr}"></label>
                <label>Idade máx. <input class="inp curto" id="f-idade" type="number" min="16" max="50" value="${f.idade}"></label>
                <select class="sel" id="f-preco"><option value="0">Qualquer valor</option>${[5e5, 2e6, 5e6, 1e7, 2e7, 5e7, 1e8].map(v => `<option value="${v}" ${f.preco === v ? 'selected' : ''}>até ${U.dinheiro(v)}</option>`).join('')}</select>
                <input class="inp" id="f-nome" placeholder="Nome..." value="${U.esc(f.nome)}">
                <label class="check"><input type="checkbox" id="f-livres" ${f.livres ? 'checked' : ''}> Só sem clube</label>
                <button class="btn btn-primario" data-acao="tcFiltrar">🔍 Buscar</button>
            </div>
            <p class="cinza pequeno">${total} jogadores encontrados${total > 80 ? ' (mostrando os 80 melhores)' : ''}.${nome ? ' Buscando pelo nome em todos os jogadores, com ou sem clube (OVR, idade e valor não contam).' : ''}${nome && !total ? ' Confira a grafia ou tente só o sobrenome.' : ''}</p>
            <div class="rolavel"><table class="tabela tabela-elenco">
                <thead><tr><th>Pos</th><th class="esq">Jogador</th><th>Idade</th><th>OVR</th><th class="esq">Clube</th><th>Valor</th><th>Salário</th><th></th></tr></thead>
                <tbody>${lista.map(p => `<tr><td>${UI.pos(p.pos)}</td><td class="esq">${UI.jogador(p)}</td><td>${p.idade}</td><td>${UI.ovr(p.ovr)}</td>
                    <td class="esq">${p.tid >= 0 ? UI.time(s, p.tid) : '<span class="verde">Livre</span>'}</td><td>${U.dinheiro(Mundo.valor(p))}</td><td>${U.dinheiro(p.sal)}</td>
                    <td><button class="btn btn-pequeno" data-acao="tcProposta" data-pid="${p.id}">${p.tid >= 0 ? 'Proposta' : 'Contratar'}</button></td></tr>`).join('')}</tbody>
            </table></div>
        </div>`;
    },

    calendario(s) {
        const t = Tecnico.time(s);
        const cal = Mundo.calendarioDoTime(s, t.id);
        return `<div class="cartao"><h3>📅 Jogos do ${U.esc(t.nome)} em ${s.ano}</h3>
            ${cal.map(j => `<div class="${j.sem === s.semana ? 'destaque' : ''}">${Tecnico.linhaJogo(s, t.id, j)}</div>`).join('')}</div>`;
    },

    financas(s) {
        const t = Tecnico.time(s);
        const folha = Tecnico.folha(s, t);
        const semanal = s.car.receita - folha / 52;
        const top = Mundo.elenco(s, t).sort((a, b) => b.sal - a.sal).slice(0, 10);
        return `<div class="grade-2">
            <div class="cartao"><h3>💰 Finanças do ${U.esc(t.nome)}</h3>
                <div class="ficha">
                    <div><span>Caixa</span><b class="${t.saldo < 0 ? 'vermelho' : 'verde'}">${U.dinheiro(t.saldo)}</b></div>
                    <div><span>Receita semanal (bilheteria, TV, patrocínio)</span><b>${U.dinheiro(s.car.receita)}</b></div>
                    <div><span>Folha salarial semanal</span><b>${U.dinheiro(folha / 52)}</b></div>
                    <div><span>Folha salarial anual</span><b>${U.dinheiro(folha)}</b></div>
                    <div><span>Resultado por semana</span><b class="${semanal < 0 ? 'vermelho' : 'verde'}">${U.dinheiro(semanal)}</b></div>
                </div>
                <p class="cinza pequeno">No fim da temporada o clube recebe premiação de acordo com a posição na liga. Caixa negativo derruba a confiança da diretoria.</p>
                <button class="btn" data-acao="tcVerba" ${s.car.verbaPedida === s.ano ? 'disabled' : ''}>🙏 Pedir mais verba à diretoria</button>
            </div>
            <div class="cartao"><h3>Maiores salários</h3>
                <table class="tabela"><tbody>${top.map(p => `<tr><td>${UI.pos(p.pos)}</td><td class="esq">${UI.jogador(p)}</td><td>${U.dinheiro(p.sal)}/ano</td></tr>`).join('')}</tbody></table>
            </div>
        </div>`;
    },

    carreira(s) {
        const c = s.car;
        const hist = c.hist.slice().reverse();
        return `<div class="grade-2">
            <div class="cartao"><h3>🏆 Sua carreira de técnico</h3>
                ${UI.barra('Reputação', c.rep, '⭐', 'azul')}
                <div class="ficha">
                    <div><span>Títulos</span><b>${c.titulos}</b></div>
                    <div><span>Temporadas</span><b>${c.hist.length}</b></div>
                    <div><span>Vitórias na carreira</span><b>${(s.cont && s.cont.vitorias) || 0}</b></div>
                    <div><span>Clássicos vencidos</span><b>${(s.cont && s.cont.classicosVencidos) || 0}</b></div>
                    <div><span>Clubes treinados</span><b>${(c.clubesTreinados || []).length}</b></div>
                </div>
                <h4>Troféus</h4>
                <div class="lista-trofeus">${s.pessoa.trofeus.map(t => `<span class="trofeu">🏆 ${U.esc(t.txt)} (${t.ano})</span>`).join('') || '<span class="cinza">Ainda nenhum. Vamos mudar isso!</span>'}</div>
                <div class="linha-botoes"><button class="btn btn-perigo" data-acao="tcAposentar">🏖️ Aposentar-se</button></div>
            </div>
            <div class="cartao"><h3>📜 Histórico</h3>
                <table class="tabela"><thead><tr><th>Ano</th><th class="esq">Clube</th><th class="esq">Liga</th><th>Pos.</th><th>V-E-D</th><th class="esq">Obs.</th></tr></thead>
                <tbody>${hist.map(h => `<tr><td>${h.ano}</td><td class="esq">${U.esc(h.time)}</td><td class="esq">${U.esc(h.liga)}</td><td>${h.pos}º</td><td>${h.v}-${h.e}-${h.d}</td><td class="esq pequeno">${U.esc(h.obs || '')}</td></tr>`).join('') || '<tr><td colspan="6" class="cinza">Primeira temporada em andamento.</td></tr>'}</tbody></table>
                ${c.histJogador && c.histJogador.length ? `<h4>Como jogador</h4><p class="pequeno">${c.histJogador.length} temporadas · ${U.soma(c.histJogador, h => h.g)} gols</p>` : ''}
            </div>
        </div>`;
    },

    // -----------------------------------------------------------------
    //  Semana
    // -----------------------------------------------------------------
    async semana(s) {
        // seleção: jogos nas Datas FIFA e convites (mesmo sem clube)
        await Selecoes.dataFifa(s);
        if (s.semana === 24) await Selecoes.convite(s, 0.25);
        const t = Tecnico.time(s);
        if (!t) {
            s.car.ofertas = s.car.ofertas.filter(o => o.ate > s.semana || o.ano > s.ano);
            if (U.chance(0.35) && s.car.ofertas.length < 4) s.car.ofertas.push(...Tecnico.gerarOfertas(s, 1));
            return;
        }
        // treino coletivo
        const tr = TREINOS_TIME[s.car.treinoTime] || TREINOS_TIME.equilibrado;
        for (const p of Mundo.elenco(s, t)) {
            p.cond = U.clamp(p.cond + tr.cond + (Mundo.infra(t).ct - 3), 30, 100);
            if (p.recaida > 0) {
                p.recaida--;
                if (p.les <= 0 && U.chance(0.18)) {
                    p.les = U.int(3, 8);
                    Vida.log(s, `🚑 Recaída! ${p.nome} voltou a sentir a lesão (${p.les} semanas).`, 'ruim');
                }
            }
        }
        if (s.car.treinoTime === 'descanso') t.moral = U.clamp(t.moral + 1, 5, 99);
        // motivação: promessas, problemas pessoais e cobranças por tempo de jogo
        await Mot.semana(s, t);
        // obras na estrutura
        if (s.car.obra) {
            s.car.obra.falta--;
            if (s.car.obra.falta <= 0) {
                const inf = Mundo.infra(t), k = s.car.obra.tipo;
                inf[k] = Math.min(5, inf[k] + 1);
                s.car.obra = null;
                if (k === 'estadio') s.car.receita = Tecnico.receita(s, t);
                if (inf[k] >= 5) Conquistas.contar(s, 'obras5');
                Vida.log(s, `🏗️ Obra concluída: ${INFRA[k].nome} agora é nível ${inf[k]}!`, 'bom');
                await Cena.simples(INFRA[k].icone, 'OBRA CONCLUÍDA!', `${INFRA[k].nome} do ${U.esc(t.nome)} agora é nível ${inf[k]} ${'⭐'.repeat(inf[k])}`, `radial-gradient(circle at 50% 40%, ${t.c1}, #05070c 70%)`, 'conquista', [t.c1, t.c2, '#ffd700']);
            }
        }
        // finanças
        const folha = Tecnico.folha(s, t);
        t.saldo += Math.round(s.car.receita - folha / 52);
        if (t.saldo < 0) s.car.conf = U.clamp(s.car.conf - 0.8, 0, 100);
        // propostas pelos seus jogadores
        if (Mundo.emJanela(s) && U.chance(s.car.venda.length ? 0.6 : 0.3)) await Tecnico.propostaRecebida(s);
        // demissão
        if (s.car.conf <= 8 && s.semana >= 6) await Tecnico.demitir(s, 'Os maus resultados custaram seu emprego.');
    },

    async propostaRecebida(s) {
        const t = Tecnico.time(s);
        const el = Mundo.elenco(s, t);
        if (el.length <= 18) return;
        const listados = el.filter(p => s.car.venda.includes(p.id));
        const p = listados.length && U.chance(0.75) ? U.escolha(listados) : U.pesado(el, p => Math.pow(Math.max(1, p.ovr - 55), 3));
        const valor = Mundo.valor(p);
        const comprador = U.escolha(s.times.filter(x => x.id !== t.id && x.rep >= p.ovr - 7 && x.saldo >= valor * 0.8));
        if (!comprador) return;
        let oferta = U.redondo(valor * (s.car.venda.includes(p.id) ? U.rand(0.75, 1.1) : U.rand(0.9, 1.35)));
        const i = await UI.perguntar('Proposta recebida!', `O <b>${U.esc(comprador.nome)}</b> (${U.esc(Mundo.liga(s, comprador.liga).curto)}) oferece <b>${U.dinheiro(oferta)}</b> por <b>${U.esc(p.nome)}</b> (${p.pos}, ${p.idade} anos, OVR ${p.ovr}).<br><small>Valor de mercado: ${U.dinheiro(valor)}</small>`,
            ['✅ Aceitar', '💬 Pedir 25% a mais', '❌ Recusar'], '💰');
        if (i === 1) {
            if (U.chance(0.45)) {
                oferta = U.redondo(oferta * 1.25);
                await UI.aviso('Negócio fechado', `O ${U.esc(comprador.nome)} topou pagar ${U.dinheiro(oferta)}!`, '🤝');
            } else {
                await UI.aviso('Negociação encerrada', `O ${U.esc(comprador.nome)} achou caro demais e desistiu.`, '🚪');
                return;
            }
        } else if (i === 2) {
            Vida.log(s, `❌ Você recusou ${U.dinheiro(oferta)} do ${comprador.nome} por ${p.nome}.`, '');
            return;
        }
        Mundo.transferir(s, p, comprador, oferta);
        s.car.venda = s.car.venda.filter(id => id !== p.id);
        Mundo.noticia(s, `💸 ${p.nome} deixa o ${t.nome} e vai para o ${comprador.nome} por ${U.dinheiro(oferta)}.`, 'transfer');
        Vida.log(s, `💸 Você vendeu ${p.nome} ao ${comprador.nome} por ${U.dinheiro(oferta)}.`, 'bom');
    },

    async demitir(s, motivo) {
        const t = Tecnico.time(s);
        Conquistas.contar(s, 'demissoes');
        s.car.capitao = null;
        s.car.obra = null;
        s.car.hist.push(Tecnico.linhaHist(s, t, 'Demitido'));
        s.car.rep = U.clamp(s.car.rep - 6, 0, 100);
        Mundo.noticia(s, `🚪 ${t.nome} demite o técnico ${s.pessoa.nome}.`, 'clube');
        Vida.log(s, `🚪 Você foi demitido do ${t.nome}. ${motivo}`, 'ruim');
        Vida.mudar(s, { felicidade: -15, fama: -3 });
        const multa = U.redondo(s.car.sal * 0.25);
        s.pessoa.dinheiro += multa;
        s.car.tid = -1;
        s.car.venda = [];
        t.tit = null;
        s.car.ofertas = Tecnico.gerarOfertas(s, U.int(0, 2));
        await Cena.simples('🚪', 'DEMITIDO', `O ${U.esc(t.nome)} encerrou seu trabalho. ${motivo}`, 'radial-gradient(circle at 50% 40%, #4a0f0f 0%, #05070c 70%)', 'triste');
        await UI.aviso('Demitido!', `A diretoria do <b>${U.esc(t.nome)}</b> decidiu te demitir. ${motivo}<br>Você recebeu ${U.dinheiro(multa)} de multa rescisória.<br><br>Fique de olho nas propostas de outros clubes.`, '🚪');
        Jogo.aba = 'inicio';
    },

    gerarOfertas(s, n) {
        const max = 52 + s.car.rep * 0.36;
        const atual = s.car.tid;
        const cand = s.times.filter(t => t.id !== atual && t.rep <= max + 2 && t.rep >= max - 14 && !s.car.ofertas.some(o => o.tid === t.id));
        const res = [];
        for (let i = 0; i < n && cand.length; i++) {
            const t = cand.splice(Math.floor(Math.random() * cand.length), 1)[0];
            res.push({ tid: t.id, ano: s.ano, ate: s.semana + 4 });
        }
        return res;
    },

    linhaHist(s, t, obs) {
        const liga = Mundo.liga(s, t.liga);
        return { ano: s.ano, time: t.nome, liga: liga.nome, pos: Mundo.posicaoNaLiga(s, t.id), v: s.car.v, e: s.car.e, d: s.car.d, obs };
    },

    async posJogo(s, jogo, m, r, rapido) {
        const t = Tecnico.time(s);
        if (!t) return '';
        const lado = jogo.h === t.id ? 0 : 1;
        const adv = s.times[lado === 0 ? jogo.a : jogo.h];
        const gf = lado === 0 ? r.gh : r.ga, gc = lado === 0 ? r.ga : r.gh;
        const venceu = r.venc === t.id || (r.venc == null && gf > gc);
        const empate = r.venc == null && gf === gc;
        if (venceu) s.car.v++; else if (empate) s.car.e++; else s.car.d++;
        const classico = Mundo.classico(s, jogo.h, jogo.a);
        if (venceu) {
            Conquistas.contar(s, 'vitorias');
            if (gf - gc >= 5) Conquistas.contar(s, 'goleadas');
            if (classico) Conquistas.contar(s, 'classicosVencidos');
        }
        s.car.invicto = venceu || empate ? (s.car.invicto || 0) + 1 : 0;
        Conquistas.maximo(s, 'maiorInvicto', s.car.invicto);
        let dc;
        if (jogo.tipo === 'liga') {
            const d = (Mundo.forca(s, t) - Mundo.forca(s, adv)) / 10 + (lado === 0 ? 0.25 : -0.25);
            const E = U.clamp(1.35 + d * 0.9, 0.3, 2.6);
            dc = ((venceu ? 3 : empate ? 1 : 0) - E) * 2.2;
        } else {
            const tipo = Conquistas.tipoCopa(Mundo.copa(s, jogo.comp));
            dc = venceu ? (Mundo.ehFinal(s, jogo) ? (tipo === 'supercopa' ? 6 : 15) : 3) : (Mundo.forca(s, t) > Mundo.forca(s, adv) ? -6 : -2);
        }
        if (classico) dc *= 1.6;
        s.car.conf = U.clamp(s.car.conf + dc, 0, 100);
        const res = venceu ? 'Vitória' : empate ? 'Empate' : 'Derrota';
        Vida.log(s, `${venceu ? '✅' : empate ? '➖' : '❌'} ${res}${classico ? ' no CLÁSSICO' : ''} contra o ${adv.nome}: ${gf} x ${gc} (${Mundo.nomeCompeticao(s, jogo.comp)}).`, venceu ? 'bom' : empate ? '' : 'ruim');
        const k = classico ? 2.5 : 1;
        if (venceu) Vida.mudar(s, { felicidade: 1.5 * k, fama: 0.3 * k }); else if (!empate) Vida.mudar(s, { felicidade: -1.5 * k });
        if (Mundo.ehFinal(s, jogo) && venceu) {
            const c = Mundo.copa(s, jogo.comp);
            s.pessoa.trofeus.push({ ano: s.ano, txt: `${c.nome} (${t.nome})` });
            s.car.titulos++;
            s.car.titTemp = s.car.titTemp || {};
            const peso = Conquistas.tituloCopa(s, c);
            const tipo = Conquistas.tipoCopa(c);
            if (tipo === 'nacional') s.car.titTemp.nac = true;
            if (tipo === 'continental') s.car.titTemp.cont = true;
            s.car.rep = U.clamp(s.car.rep + peso.rep, 0, 100);
            Vida.mudar(s, { felicidade: peso.fel, fama: peso.fama });
            Vida.log(s, `🏆 CAMPEÃO: ${c.nome.toUpperCase()}!`, 'titulo');
            await Cena.titulo(c.nome, t, `${U.esc(s.pessoa.nome)} leva o ${t.nome} ao título!`);
        }
        await Tecnico.departamentoMedico(s, t, m, rapido);
        // coletiva de imprensa
        if (!rapido && U.chance(0.22)) {
            const opcoes = venceu ? ['👏 "O mérito é todo dos jogadores."', '😎 "Eu avisei que ia dar certo."', '🎯 "Ainda temos muito a melhorar."']
                : ['🤝 "A culpa é minha, eu assumo."', '😡 "A arbitragem nos prejudicou!"', '🗣️ "Faltou atitude de alguns jogadores."'];
            const i = await UI.perguntar('Coletiva de imprensa', `Repórteres perguntam sobre ${venceu ? 'a vitória' : empate ? 'o empate' : 'a derrota'} contra o ${U.esc(adv.nome)}.`, opcoes, '🎙️');
            let txt;
            if (venceu) {
                if (i === 0) { t.moral += 4; txt = 'O elenco adorou ser valorizado.'; }
                else if (i === 1) { Vida.mudar(s, { fama: 2 }); txt = 'Sua confiança virou manchete.'; }
                else { s.car.conf = U.clamp(s.car.conf + 2, 0, 100); txt = 'A diretoria gostou da sua cobrança.'; }
            } else {
                if (i === 0) { s.car.conf = U.clamp(s.car.conf + 1, 0, 100); t.moral += 3; txt = 'Você protegeu o grupo. Respeito.'; }
                else if (i === 1) { Vida.mudar(s, { fama: 2 }); s.car.conf = U.clamp(s.car.conf - 2, 0, 100); txt = 'Você pode ser multado pela federação...'; }
                else { t.moral -= 6; txt = 'Os jogadores não gostaram nada de serem expostos.'; }
            }
            t.moral = U.clamp(t.moral, 5, 99);
            UI.toast('🎙️ ' + txt);
        }
        return `<div class="rf-linha">🤝 Confiança da diretoria: ${Math.round(s.car.conf)}% <span class="${dc >= 0 ? 'verde' : 'vermelho'}">(${dc >= 0 ? '+' : ''}${dc.toFixed(1)})</span></div>`;
    },

    async antesFimTemporada(s) {
        const t = Tecnico.time(s);
        if (!t) return;
        Tecnico.titulosPendentes = null;
        const liga = Mundo.liga(s, t.liga);
        const pos = Mundo.posicaoNaLiga(s, t.id);
        const esp = Tecnico.expectativa(s);
        const n = liga.times.length;
        const obs = [];
        if (pos === 1) {
            s.pessoa.trofeus.push({ ano: s.ano, txt: `${liga.nome} (${t.nome})` });
            s.car.titulos++;
            s.car.rep = U.clamp(s.car.rep + (liga.nivel === 1 ? 12 : 6 - liga.nivel), 0, 100);
            s.car.conf = U.clamp(s.car.conf + 30, 0, 100);
            Vida.mudar(s, { felicidade: 20, fama: liga.nivel === 1 ? 12 : 5 });
            Vida.log(s, `🏆 CAMPEÃO DA ${liga.nome.toUpperCase()} com o ${t.nome}!`, 'titulo');
            obs.push('Campeão');
            s.car.titTemp = s.car.titTemp || {};
            if (liga.nivel === 1) { Conquistas.contar(s, 'ligasPrincipais'); s.car.titTemp.liga = true; }
            Tecnico.titulosPendentes = [liga.nome, t];
        }
        if (s.car.titTemp && s.car.titTemp.liga && s.car.titTemp.nac && s.car.titTemp.cont) {
            Conquistas.contar(s, 'triplices');
            Vida.log(s, '👑 TRÍPLICE COROA! Liga, copa nacional e copa continental na mesma temporada!', 'titulo');
        }
        const ligasPais = s.ligas.filter(l => l.pais === liga.pais).sort((a, b) => a.nivel - b.nivel);
        const idx = ligasPais.indexOf(liga);
        if (idx > 0 && pos <= ligasPais[idx - 1].troca) { s.car.conf = U.clamp(s.car.conf + 25, 0, 100); s.car.rep += 4; obs.push('Acesso'); Vida.mudar(s, { felicidade: 12, fama: 4 }); Conquistas.contar(s, 'acessos'); }
        if (liga.troca && pos > n - liga.troca) { s.car.conf = U.clamp(s.car.conf - 35, 0, 100); s.car.rep -= 6; obs.push('Rebaixado'); Vida.mudar(s, { felicidade: -15 }); }
        s.car.conf = U.clamp(s.car.conf + (esp - pos) * 3, 0, 100);
        s.car.rep = U.clamp(s.car.rep + (esp - pos) * 0.7, 0, 100);
        if (s.car.promessa === 'titulo' && pos !== 1) { s.car.conf = U.clamp(s.car.conf - 15, 0, 100); obs.push('Promessa não cumprida'); }
        s.car.hist.push(Tecnico.linhaHist(s, t, obs.join(', ')));
        Vida.log(s, `📊 Temporada ${s.ano}: ${pos}º lugar na ${liga.nome} (meta era ${esp}º).`, pos <= esp ? 'bom' : 'ruim');
        if (Tecnico.titulosPendentes) await Cena.titulo(Tecnico.titulosPendentes[0], t, `${s.pessoa.nome} é campeão com o ${t.nome}!`);
    },

    // dados do slide "Sua temporada" da cutscene de fim de ano
    resumoTemporada(s) {
        const t = Tecnico.time(s);
        if (!t) return { tid: -1, html: '', ehMeu: () => false };
        const liga = Mundo.liga(s, t.liga);
        const pos = Mundo.posicaoNaLiga(s, t.id), esp = Tecnico.expectativa(s);
        const tab = liga.tab[t.id];
        return {
            tid: t.id, ligaId: liga.id, ligaCurto: liga.curto,
            ehMeu: p => p.tipo === 'Técnico do Ano' && p.tid === t.id,
            frase: pos <= esp ? 'A diretoria está feliz. Bora repetir a dose!' : 'Ano difícil. A próxima temporada é para dar a volta por cima.',
            html: `${Cena.escudo(t, 'pequeno')}<div class="cena-titulo">${U.esc(t.nome)}</div>
                <div class="grade-numeros">
                    <div><b data-alvo="${pos}">0</b><small>º lugar</small></div>
                    <div><b data-alvo="${tab.pts}">0</b><small>pontos</small></div>
                    <div><b data-alvo="${s.car.v}">0</b><small>vitórias</small></div>
                    <div><b data-alvo="${tab.gp}">0</b><small>gols marcados</small></div>
                </div>
                <div class="cena-sub">${pos <= esp ? '✅' : '❌'} Meta da diretoria: ${esp}º lugar</div>`,
        };
    },

    async depoisFimTemporada(s, resumo) {
        const t = Tecnico.time(s);
        s.car.v = s.car.e = s.car.d = 0;
        s.car.promessa = null;
        s.car.titTemp = {};
        if (!t) return;
        const tec = resumo && resumo.premios.find(p => p.tipo === 'Técnico do Ano');
        if (tec && tec.tid === t.id) {
            s.pessoa.trofeus.push({ ano: resumo.ano, txt: 'Técnico do Ano' });
            s.car.rep = U.clamp(s.car.rep + 5, 0, 100);
            Conquistas.contar(s, 'tecnicoAno');
            Vida.mudar(s, { fama: 8, felicidade: 10 });
            Vida.log(s, '📋 Você foi eleito o TÉCNICO DO ANO!', 'titulo');
        }
        // premiação da liga (já está na nova liga, usa a classificação final antiga)
        const ligaAntiga = Object.keys(s.classifFinal).find(id => s.classifFinal[id].includes(t.id));
        const L = Mundo.liga(s, ligaAntiga);
        const cl = s.classifFinal[ligaAntiga];
        const premio = U.redondo(L.riqueza * 9e6 * (1.4 - cl.indexOf(t.id) / cl.length));
        t.saldo += premio;
        Vida.log(s, `💰 O clube recebeu ${U.dinheiro(premio)} de premiação pela temporada.`, '');
        s.car.receita = Tecnico.receita(s, t);
        t.rep = Math.round((t.rep * 0.8 + Mundo.forca(s, t) * 0.2) * 10) / 10;
        s.car.contr--;
        if (s.car.conf < 25) return Tecnico.demitir(s, 'A diretoria não ficou satisfeita com a temporada.');
        if (s.car.contr <= 0) {
            if (s.car.conf >= 45) {
                const novo = U.redondo(s.car.sal * (1 + s.car.conf / 300));
                const i = await UI.perguntar('Renovação de contrato', `Seu contrato com o ${U.esc(t.nome)} acabou. A diretoria quer renovar por mais 2 temporadas com salário de <b>${U.dinheiro(novo)}/ano</b>.`, ['✍️ Renovar', '👋 Sair do clube'], '📄');
                if (i === 0) { s.car.contr = 2; s.car.sal = novo; Vida.log(s, `✍️ Você renovou com o ${t.nome}.`, 'bom'); }
                else { s.car.hist[s.car.hist.length - 1].obs += ' (saiu)'; Tecnico.sair(s, t); return; }
            } else {
                await UI.aviso('Fim de contrato', `A diretoria do ${U.esc(t.nome)} decidiu não renovar seu contrato.`, '📄');
                Tecnico.sair(s, t);
                return;
            }
        }
        // propostas de clubes maiores
        if (U.chance(0.3 + s.car.rep / 200)) {
            const ofs = Tecnico.gerarOfertas(s, U.int(1, 2)).filter(o => s.times[o.tid].rep > t.rep);
            for (const o of ofs) { o.ate = s.semana + 6; o.ano = s.ano; }
            s.car.ofertas = ofs;
            if (ofs.length) UI.toast('📨 Você recebeu propostas de outros clubes! Veja na aba Clube.');
        }
        s.car.conf = U.clamp(50 + (s.car.conf - 50) * 0.5, 0, 100);
        await Tecnico.peneiraBase(s);
    },

    // -----------------------------------------------------------------
    //  Peneira anual da base: escolha 1 de 3 joias
    // -----------------------------------------------------------------
    async peneiraBase(s) {
        const t = Tecnico.time(s);
        if (!t) return;
        const base = Mundo.infra(t).base;
        const liga = Mundo.liga(s, t.liga);
        const cands = [0, 1, 2].map(() => {
            const p = Mundo.gerarJogador(s, null, U.escolha(POSICOES.concat(['ATA', 'MEI', 'ZAG'])), Mundo.pais(t.pais).nomes, t.rep + (base - 3) * 3 + 4, liga.riqueza, true);
            p.pot = U.clamp(p.ovr + U.int(10, 16 + base * 3), p.ovr, 96);
            return p;
        });
        const html = `<p>Os olheiros da base (nível ${base} ${'⭐'.repeat(base)}) selecionaram 3 garotos. Você pode promover <b>um</b> ao profissional.</p>
            <div class="grade-base">${cands.map(p => `<div class="cand-base">${UI.pos(p.pos)}<b>${U.esc(p.nome)}</b><small>${p.idade} anos · ${POS_NOME[p.pos]}</small>
                <div>Habilidade ${UI.ovr(p.ovr)}</div><div class="estrelas-pot">Potencial ${U.estrelas((p.pot - 55) / 8)}</div></div>`).join('')}</div>`;
        const i = await UI.modal({
            titulo: '🌱 Peneira da base', html, largo: true, fechavel: false,
            botoes: cands.map((p, k) => ({ txt: `Promover ${p.nome.split(' ')[0]}`, valor: k, classe: 'btn-opcao' })).concat([{ txt: 'Nenhum', valor: -1, classe: 'btn-fantasma' }]),
        });
        cands.forEach((p, k) => {
            if (k === i) {
                Mundo.transferir(s, p, t, 0);
                p.contr = 4;
                p.sal = U.redondo(Mundo.salarioPedido(p, liga.riqueza) * 0.5);
                Conquistas.contar(s, 'joias');
                Vida.log(s, `🌱 Você promoveu ${p.nome} (${p.pos}, ${p.idade} anos) da base para o profissional.`, 'bom');
                Mundo.noticia(s, `🌱 ${t.nome} promove a joia ${p.nome} ao time principal.`, 'clube');
            } else delete s.jog[p.id];
        });
    },

    // -----------------------------------------------------------------
    //  Departamento médico: decisão quando um titular se machuca feio
    // -----------------------------------------------------------------
    async departamentoMedico(s, t, m, rapido) {
        const top = new Set(Mundo.elenco(s, t).sort((a, b) => b.ovr - a.ovr).slice(0, 13).map(p => p.id));
        const lesionado = Object.keys(m.st).map(Number).map(id => s.jog[id]).find(p => p && p.tid === t.id && m.st[p.id].les && p.les >= 4 && top.has(p.id));
        if (!lesionado) return;
        if (rapido) return;
        const custo = U.redondo(Math.max(50000, lesionado.sal * 0.15));
        await Vida.decisaoLesao(s, lesionado, { custo, pagar: v => { t.saldo -= v; }, quem: 'o clube' });
    },

    // -----------------------------------------------------------------
    //  Estrutura do clube
    // -----------------------------------------------------------------
    custoObra(s, t, tipo) {
        const n = Mundo.infra(t)[tipo];
        return U.redondo(Math.max(3e5, Tecnico.receita(s, t)) * 10 * Math.pow(n + 1, 1.5));
    },

    estrutura(s) {
        const t = Tecnico.time(s);
        const inf = Mundo.infra(t);
        const obra = s.car.obra;
        return `<div class="cartao"><div class="cartao-topo"><h3>🏗️ Estrutura do ${U.esc(t.nome)}</h3><span>Caixa: <b class="${t.saldo < 0 ? 'vermelho' : 'verde'}">${U.dinheiro(t.saldo)}</b></span></div>
            ${obra ? `<p class="destaque-bom">🚧 Obra em andamento: ${INFRA[obra.tipo].nome} → nível ${inf[obra.tipo] + 1} (faltam ${obra.falta} semanas)</p>` : '<p class="cinza">Investir na estrutura é pensar no longo prazo. Só dá para fazer uma obra por vez (leva 6 semanas).</p>'}
            <div class="grade-3">${Object.entries(INFRA).map(([k, d]) => {
            const n = inf[k], custo = Tecnico.custoObra(s, t, k);
            return `<div class="infra"><div class="infra-icone">${d.icone}</div><h3>${d.nome}</h3>
                    <div class="infra-nivel">${[1, 2, 3, 4, 5].map(i => `<i class="${i <= n ? 'on' : ''}"></i>`).join('')}</div>
                    <p class="cinza pequeno">${d.desc}</p>
                    ${n >= 5 ? '<b class="verde">Nível máximo!</b>' : `<button class="btn ${t.saldo >= custo && !obra ? 'btn-primario' : ''}" data-acao="tcObra" data-tipo="${k}" ${obra || t.saldo < custo ? 'disabled' : ''}>Melhorar para nível ${n + 1} · ${U.dinheiro(custo)}</button>`}
                </div>`;
        }).join('')}</div></div>`;
    },

    sair(s, t) {
        Vida.log(s, `👋 Você deixou o ${t.nome}.`, '');
        s.car.tid = -1;
        s.car.venda = [];
        t.tit = null;
        s.car.ofertas = Tecnico.gerarOfertas(s, U.int(1, 3));
        Jogo.aba = 'inicio';
    },

    // -----------------------------------------------------------------
    //  Ações em jogadores
    // -----------------------------------------------------------------
    acoesJogador(s, p) {
        const t = Tecnico.time(s);
        if (!t) return [];
        if (p.tid === t.id) {
            return [
                { id: 'conversar', txt: '💬 Conversar', classe: 'btn-primario' },
                { id: 'capitao', txt: s.car.capitao === p.id ? '©️ Já é o capitão' : '©️ Fazer capitão', desativado: s.car.capitao === p.id },
                { id: 'renovar', txt: '✍️ Renovar contrato', desativado: p.contr > 2 },
                { id: 'venda', txt: s.car.venda.includes(p.id) ? '🏷️ Tirar da lista de venda' : '🏷️ Colocar à venda' },
                { id: 'dispensar', txt: '🚪 Dispensar', classe: 'btn-perigo' },
            ];
        }
        return [{ id: 'proposta', txt: p.tid >= 0 ? '💸 Fazer proposta' : '✍️ Contratar (sem clube)' }];
    },

    async acaoJogador(s, p, id) {
        const t = Tecnico.time(s);
        if (id === 'proposta') return Tecnico.proposta(s, p);
        if (id === 'conversar') return Mot.conversar(s, p);
        if (id === 'capitao') { s.car.capitao = p.id; UI.toast(`©️ ${p.nome} é o novo capitão!`); }
        if (id === 'venda') {
            if (s.car.venda.includes(p.id)) s.car.venda = s.car.venda.filter(x => x !== p.id);
            else s.car.venda.push(p.id);
            UI.toast(s.car.venda.includes(p.id) ? `🏷️ ${p.nome} está à venda. Propostas chegam durante a janela.` : `${p.nome} saiu da lista de venda.`);
        }
        if (id === 'dispensar') {
            const custo = U.redondo(p.sal * p.contr * 0.5);
            if (!(await UI.confirmar(`Dispensar ${U.esc(p.nome)}? O clube vai pagar <b>${U.dinheiro(custo)}</b> de rescisão.`, 'Dispensar'))) return;
            t.saldo -= custo;
            Mundo.liberar(s, p);
            s.car.venda = s.car.venda.filter(x => x !== p.id);
            Vida.log(s, `🚪 Você dispensou ${p.nome}.`, '');
        }
        if (id === 'renovar') {
            const pede = U.redondo(Math.max(p.sal * 1.08, Mundo.salarioPedido(p, Mundo.riquezaDoTime(s, t))) * (1 + Math.max(0, p.ovr - t.rep) * 0.015));
            if (p.ovr > t.rep + 7 && U.chance(0.35)) return UI.aviso('Renovação recusada', `${U.esc(p.nome)} acha que merece um clube maior e não quer renovar.`, '🙅');
            const i = await UI.perguntar('Renovação', `${U.esc(p.nome)} aceita renovar por <b>${U.dinheiro(pede)}/ano</b> (hoje ganha ${U.dinheiro(p.sal)}).`, ['3 temporadas', '1 temporada', 'Cancelar'], '✍️');
            if (i === 2) return;
            p.sal = pede;
            p.contr = (i === 0 ? 3 : 1) + 1;
            Vida.log(s, `✍️ ${p.nome} renovou até ${s.ano + p.contr - 1}.`, 'bom');
        }
        Jogo.manterRolagem = true;
        Jogo.atualizar();
    },

    async proposta(s, p) {
        const t = Tecnico.time(s);
        const dono = p.tid >= 0 ? s.times[p.tid] : null;
        if (dono && !Mundo.emJanela(s)) return UI.aviso('Janela fechada', 'A janela de transferências está fechada. Ela abre nas semanas 1–6 e 22–26. Jogadores sem clube podem ser contratados a qualquer momento.', '🔒');
        if (t.elenco.length >= 34) return UI.aviso('Elenco cheio', 'Seu elenco já tem jogadores demais. Venda ou dispense alguém antes.', '👥');
        const chave = `${p.id}`;
        if (s.car.recusas[chave] && s.car.recusas[chave] > s.ano * 100 + s.semana - 4) return UI.aviso('Sem interesse', `${U.esc(p.nome)} já disse que não quer conversar agora.`, '🙅');
        const riq = Mundo.riquezaDoTime(s, t);
        const salario = U.redondo(Math.max(p.sal * (dono ? 1.15 : 1), Mundo.salarioPedido(p, riq)));
        const repDele = dono ? dono.rep : p.ovr - 6;
        const dif = repDele - t.rep;
        if (dif > 5 && U.chance(Math.min(0.92, (dif - 5) * 0.11))) {
            s.car.recusas[chave] = s.ano * 100 + s.semana;
            return UI.aviso('Proposta recusada', `${U.esc(p.nome)} não tem interesse em jogar no ${U.esc(t.nome)}. Ele acha o clube pequeno para ele.`, '🙅');
        }
        const valor = Mundo.valor(p);
        let pedido = 0;
        if (dono) {
            const rank = Mundo.elenco(s, dono).sort((a, b) => b.ovr - a.ovr).indexOf(p);
            let mult = rank < 3 ? 1.45 : rank < 11 ? 1.2 : 1;
            if (dono.elenco.length < 20) mult += 0.15;
            pedido = U.redondo(valor * mult);
        }
        let oferta = null;
        const r = await UI.modal({
            titulo: `${dono ? '💸 Proposta por' : '✍️ Contratar'} ${U.esc(p.nome)}`,
            html: `<div class="ficha">
                <div><span>Jogador</span><b>${p.pos} · ${p.idade} anos · OVR ${p.ovr}</b></div>
                <div><span>Clube</span><b>${dono ? U.esc(dono.nome) : 'Sem clube'}</b></div>
                <div><span>Valor de mercado</span><b>${U.dinheiro(valor)}</b></div>
                <div><span>Salário pedido</span><b>${U.dinheiro(salario)}/ano</b></div>
                <div><span>Seu caixa</span><b>${U.dinheiro(t.saldo)}</b></div>
            </div>
            ${dono ? `<label class="campo">Sua oferta (€):<input id="pr-valor" class="inp" type="number" min="0" step="50000" value="${valor}"></label>
            <p class="cinza pequeno">Titulares e craques custam mais caro que o valor de mercado.</p>` : '<p>Ele está livre: não há taxa de transferência, só o salário.</p>'}`,
            botoes: [{ txt: dono ? 'Enviar proposta' : 'Contratar', valor: 'ok', antes: f => { const i = f.querySelector('#pr-valor'); oferta = i ? Math.max(0, +i.value || 0) : 0; } }, { txt: 'Cancelar', valor: false, classe: 'btn-fantasma' }],
        });
        if (r !== 'ok') return;
        if (oferta > t.saldo) return UI.aviso('Sem dinheiro', 'O clube não tem caixa para essa oferta.', '💸');
        if (dono) {
            if (oferta < pedido * 0.85) {
                s.car.recusas[chave] = s.ano * 100 + s.semana - 2;
                return UI.aviso('Recusada', `O ${U.esc(dono.nome)} recusou na hora. Nem respondeu o e-mail direito.`, '❌');
            }
            if (oferta < pedido) {
                const i = await UI.perguntar('Contraproposta', `O ${U.esc(dono.nome)} pede <b>${U.dinheiro(pedido)}</b> para liberar ${U.esc(p.nome)}.`, [`Pagar ${U.dinheiro(pedido)}`, 'Desistir'], '💬');
                if (i !== 0) return;
                if (pedido > t.saldo) return UI.aviso('Sem dinheiro', 'O clube não tem caixa para isso.', '💸');
                oferta = pedido;
            }
        }
        const de = dono ? dono.nome : null;
        Mundo.transferir(s, p, t, oferta);
        p.sal = salario;
        p.contr = 3 + 1;
        Mundo.noticia(s, dono ? `💸 ${t.nome} contrata ${p.nome} do ${de} por ${U.dinheiro(oferta)}.` : `✍️ ${t.nome} contrata ${p.nome}, que estava livre.`, 'transfer');
        Vida.log(s, `✍️ Você contratou ${p.nome} (${p.pos}, OVR ${p.ovr})${dono ? ` por ${U.dinheiro(oferta)}` : ''}.`, 'bom');
        await UI.aviso('Contratado!', `${U.esc(p.nome)} é o novo reforço do ${U.esc(t.nome)}! Contrato até ${s.ano + 3}.`, '🎉');
        Jogo.manterRolagem = true;
        Jogo.atualizar();
    },
};

// =====================================================================
//  Ações
// =====================================================================
Object.assign(ACOES, {
    tcPais: d => { Jogo.ui.paisClube = d.pais; Tecnico.telaEscolherClube(Jogo.formTmp || {}, !!Jogo.formTmp?.existente); },
    async tcEscolher(d) {
        if (Jogo.formTmp && Jogo.formTmp.aposentado) {
            return;
        }
        if (!(await UI.confirmar(`Assumir o <b>${U.esc(d.nome)}</b>?`, 'Assinar contrato'))) return;
        UI.render('<div class="carregando">⚽ Montando o mundo do futebol...</div>');
        setTimeout(() => Tecnico.iniciar(Jogo.formTmp, d.nome), 30);
    },
    tcSlot: d => {
        const i = +d.i;
        Jogo.ui.slotSel = Jogo.ui.slotSel === i ? null : i;
        Jogo.manterRolagem = true;
        Jogo.atualizar();
    },
    tcEscolherJog: d => {
        const s = Jogo.s, t = Tecnico.time(s);
        const sel = Jogo.ui.slotSel;
        if (sel == null) return UI.toast('Primeiro clique numa posição do campo.');
        const tit = Escalacao.doTime(s, t);
        const pid = +d.pid;
        const j = tit.indexOf(pid);
        if (j >= 0) tit[j] = tit[sel];
        tit[sel] = pid;
        t.tit = tit;
        Jogo.ui.slotSel = null;
        Jogo.manterRolagem = true;
        Jogo.atualizar();
    },
    tcAuto: () => { const t = Tecnico.time(Jogo.s); t.tit = null; Jogo.ui.slotSel = null; Jogo.atualizar(); UI.toast('🤖 Escalação automática ativada.'); },
    tcForm: (d, el) => { const t = Tecnico.time(Jogo.s); t.form = el.value; t.tit = null; Jogo.ui.slotSel = null; Jogo.atualizar(); },
    tcEstilo: (d, el) => { Tecnico.time(Jogo.s).estilo = el.value; Jogo.atualizar(); },
    tcFiltrar: () => {
        const v = id => document.getElementById(id);
        Jogo.ui.filtro = { pos: v('f-pos').value, liga: v('f-liga').value, ovr: +v('f-ovr').value || 0, idade: +v('f-idade').value || 0, preco: +v('f-preco').value || 0, nome: v('f-nome').value.trim(), livres: v('f-livres').checked };
        Jogo.atualizar();
    },
    tcProposta: d => Tecnico.proposta(Jogo.s, Jogo.s.jog[+d.pid]),
    async tcAceitarOferta(d) {
        const s = Jogo.s;
        const o = s.car.ofertas[+d.i];
        if (!o) return;
        const t = s.times[o.tid];
        if (!(await UI.confirmar(`Assumir o <b>${U.esc(t.nome)}</b>?`, 'Assinar'))) return;
        const atual = Tecnico.time(s);
        if (atual) { s.car.hist.push(Tecnico.linhaHist(s, atual, 'Saiu para o ' + t.nome)); atual.tit = null; }
        Tecnico.contratar(s, t.id);
        Jogo.aba = 'inicio';
        Jogo.atualizar();
        await Tecnico.cenaNovoClube(s, t);
    },
    tcRecusarOferta: d => { Jogo.s.car.ofertas.splice(+d.i, 1); Jogo.atualizar(); },
    tcTreino: d => { Jogo.s.car.treinoTime = d.t; Jogo.manterRolagem = true; Jogo.atualizar(); UI.toast(`${TREINOS_TIME[d.t].icone} Treino da semana: ${TREINOS_TIME[d.t].nome}`); },
    tcCapitao: (d, el) => { Jogo.s.car.capitao = el.value ? +el.value : null; Jogo.manterRolagem = true; Jogo.atualizar(); if (el.value) UI.toast(`©️ ${Jogo.s.jog[+el.value].nome} é o novo capitão!`); },
    async tcObra(d) {
        const s = Jogo.s, t = Tecnico.time(s);
        const custo = Tecnico.custoObra(s, t, d.tipo);
        if (s.car.obra || t.saldo < custo) return;
        if (!(await UI.confirmar(`Investir <b>${U.dinheiro(custo)}</b> para melhorar ${INFRA[d.tipo].icone} <b>${INFRA[d.tipo].nome}</b>? A obra leva 6 semanas.`, 'Começar obra'))) return;
        t.saldo -= custo;
        s.car.obra = { tipo: d.tipo, falta: 6 };
        s.car.conf = U.clamp(s.car.conf + 2, 0, 100);
        Vida.log(s, `🏗️ Você iniciou uma obra: ${INFRA[d.tipo].nome} (${U.dinheiro(custo)}).`, '');
        Som.tocar('moeda');
        Jogo.manterRolagem = true;
        Jogo.atualizar();
    },
    async tcAposentar() {
        const s = Jogo.s;
        if (!(await UI.confirmar(`Encerrar a carreira de técnico aos ${s.pessoa.idade} anos? Sua vida será simulada até o fim.`, 'Aposentar', 'Ainda não'))) return;
        const t = Tecnico.time(s);
        if (t) { s.car.hist.push(Tecnico.linhaHist(s, t, 'Aposentou-se')); t.tit = null; s.car.tid = -1; }
        Vida.log(s, `🏖️ Você se aposentou do futebol com ${s.car.titulos} título(s) como técnico.`, 'titulo');
        while (!s.pessoa.morto && s.pessoa.idade < 110) {
            s.ano++;
            s.pessoa.dinheiro += U.soma(s.pessoa.patrocinios, x => x.semana) * 52;
            if (U.chance(0.3)) Vida.log(s, U.escolha(['🏖️ Você passou o ano viajando pelo mundo.', '📺 Você virou comentarista de TV.', '👨‍👧 Você curtiu muito a família.', '📖 Você lançou um livro com suas memórias do futebol.', '🎣 Você descobriu a pesca como hobby.', '🏫 Você abriu uma escolinha de futebol.']), '');
            Vida.anoNovo(s);
        }
        Jogo.fimDeVida();
    },
    async tcVerba() {
        const s = Jogo.s, t = Tecnico.time(s);
        s.car.verbaPedida = s.ano;
        if (s.car.conf >= 65 && U.chance(0.6)) {
            const v = U.redondo(Math.max(5e5, s.car.receita * U.int(4, 12)));
            t.saldo += v;
            await UI.aviso('Verba aprovada', `O presidente liberou mais <b>${U.dinheiro(v)}</b> para reforços.`, '🤑');
        } else {
            s.car.conf = U.clamp(s.car.conf - 3, 0, 100);
            await UI.aviso('Pedido negado', 'O presidente disse que o clube não tem dinheiro sobrando e que você precisa trabalhar com o que tem.', '🙅');
        }
        Jogo.atualizar();
    },
});

// Enter nos filtros do mercado também busca
document.addEventListener('keydown', e => {
    if (e.key === 'Enter' && e.target && /^f-/.test(e.target.id || '') && document.querySelector('[data-acao=tcFiltrar]')) ACOES.tcFiltrar();
});
