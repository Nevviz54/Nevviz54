'use strict';
// =====================================================================
//  CARREIRAS: DESAFIOS DE CARREIRA E O SEU PRÓPRIO CLUBE (técnico)
//  🎯 Desafios: cenários com um começo fixo, uma meta e um prazo (subir da
//     Série D até a Série A, salvar um gigante do rebaixamento no meio da
//     temporada, orçamento zero, só a base, reconstrução, copa continental,
//     acesso imediato e o pequeno no meio dos gigantes). A meta aparece na
//     tela do clube, ao lado dos objetivos da diretoria, e no fim sai a
//     cutscene de sucesso (reputação, bônus e conquista) ou de fracasso.
//  🛠️ Criar o seu clube: nome, sigla, cores (prévia do escudo), país,
//     estádio e perfil. Ele entra na última divisão do país no lugar do
//     clube mais fraco (a liga continua do mesmo tamanho), com um elenco de
//     nomes locais e força modesta, e depois é um clube como qualquer outro.
//
//  Nada aqui abre janela no avanço rápido (⏭️ / ⏩ / "simular os jogos"):
//  o fracasso no meio da temporada vira aviso rápido e linha no diário; o
//  resultado do fim da temporada sai depois da cutscene do ano (como os títulos).
//
//  Estado (criado na primeira vez que precisa: saves antigos abrem normal)
//    s.car.desafio  = { id, tid, clube, ano0, nivel0, temps: [registro da
//                       temporada], status: 'ativo' | 'ok' | 'falhou', txt, fim,
//                       vets: [ids], need }
//    s.car.desafios = [{ id, clube, ano0, ano, ok, txt, rep, premio }]  histórico
//    t.criado       = { ano, estadio, perfil, antigo, por }   clube criado por você
//  Ganchos: Jogo.formNovo (botões), Tecnico.iniciar (prepara o mundo),
//  Tecnico.expectativa, Tecnico.semana, Tecnico.inicio, Tecnico.mercado,
//  Tecnico.carreira, Tecnico.antesFimTemporada / depoisFimTemporada,
//  Negociacoes.bloqueioProposta / Tecnico.proposta (regras de contratação),
//  Clube.resolverDeadline e Comissao.pendencias.
// =====================================================================

const GRANDES_DSF = ['BRA1', 'ENG1', 'ESP1', 'ITA1', 'GER1', 'FRA1', 'ARG1'];

// Os desafios. temps = prazo em temporadas; dif = 1 a 5 (prêmio maior)
const DESAFIOS = {
    serieD: {
        nome: 'Da Série D à glória', icone: '🪜', dif: 5, temps: 5,
        desc: 'Um clube pequeno, sem dinheiro e sem holofote. Três acessos até a elite do futebol brasileiro.',
        meta: 'Chegar à Série A em até 5 temporadas',
        regras: ['Começa na Série D do Brasileirão: sobem os 4 primeiros de cada divisão.', 'Caixa pequeno: o clube cresce junto com você.'],
        cands: () => Desafios.sortear(Desafios.daLiga('BRA4').slice(0, 10), 3),
    },
    gigante: {
        nome: 'Salve o gigante', icone: '🆘', dif: 4, temps: 1,
        desc: 'Um dos maiores clubes do país afundou no primeiro turno. Elenco cabisbaixo, torcida revoltada e você chega na semana 17.',
        meta: 'Não ser rebaixado nesta temporada',
        regras: ['Começa na semana 17, com o time perto (ou dentro) da zona de rebaixamento.', 'Moral baixa, torcida na bronca e uma diretoria que só quer escapar da queda.'],
        cands: () => Desafios.sortear(Desafios.juntar(GRANDES_DSF.map(l => Desafios.daLiga(l).slice(0, 2))), 4),
    },
    orcamento: {
        nome: 'Orçamento zero', icone: '💸', dif: 3, temps: 3,
        desc: 'O clube está quebrado. Não há um centavo para taxas de transferência por três temporadas.',
        meta: 'Cumprir a meta da diretoria nas 3 temporadas',
        regras: ['Sem taxas de transferência: só jogadores livres, empréstimos e trocas sem dinheiro.', 'O caixa começa apertado (dá para vender, mas não para comprar).'],
        regra: { semTaxa: true },
        cands: () => Desafios.sortear(Desafios.juntar(GRANDES_DSF.map(l => Desafios.daLiga(l).filter(x => Math.abs(x.rank - Math.round(x.n / 2)) <= 1))), 3),
    },
    base: {
        nome: 'Só a base', icone: '🌱', dif: 4, temps: 4,
        desc: 'A diretoria quer um time com a cara do clube: garotos da base e jovens promessas.',
        meta: 'Terminar entre os 4 primeiros da liga em até 4 temporadas',
        regras: ['Só dá para contratar jogadores com até 21 anos (empréstimos e trocas também).', 'A categoria de base começa no nível 4: suba os garotos!'],
        regra: { maxIdade: 21 },
        cands: () => Desafios.sortear(Desafios.juntar(['NED1', 'BRA1', 'ARG1', 'FRA1', 'ESP1', 'ENG1', 'ITA1', 'GER1'].map(l => Desafios.daLiga(l).filter(x => x.rank >= 5 && x.rank <= 9))), 3),
    },
    reconstrucao: {
        nome: 'Reconstrução', icone: '🔨', dif: 4, temps: 3,
        desc: 'Um elenco forte, mas velho. Renove o time sem perder a ambição.',
        meta: 'Vender 4 veteranos na 1ª temporada e ganhar a liga em até 3',
        regras: ['Até o fim da 1ª temporada, 4 jogadores com 30 anos ou mais precisam sair (venda, troca ou dispensa).', 'Nada de contratar jogador com 29 anos ou mais.'],
        regra: { maxIdade: 28 },
        cands: () => {
            const l = Desafios.juntar(GRANDES_DSF.map(x => Desafios.daLiga(x).filter(c => c.rank >= 2 && c.rank <= 6)));
            l.sort((a, b) => Desafios.veteranos(b) - Desafios.veteranos(a));
            return Desafios.sortear(l.slice(0, 6), 3);
        },
    },
    continental: {
        nome: 'Rei do continente', icone: '🌍', dif: 5, temps: 3,
        desc: 'Um clube que entra na Liga dos Campeões ou na Libertadores pela porta dos fundos. Ninguém aposta um real nele.',
        meta: 'Ganhar a Liga dos Campeões ou a Libertadores em até 3 temporadas',
        regras: ['O clube entra na copa continental na última vaga do país.', 'Para tentar de novo nas temporadas seguintes, é preciso se classificar outra vez.'],
        cands: () => {
            const ucl = [['ENG1', 4], ['ESP1', 4], ['ITA1', 3], ['GER1', 3]].map(([l, k]) => Desafios.daLiga(l)[k - 1]).filter(Boolean);
            const lib = Desafios.juntar(['BRA1', 'ARG1'].map(l => Desafios.daLiga(l).slice(6, 8)));
            return Desafios.sortear(ucl, 2).concat(Desafios.sortear(lib, 2));
        },
    },
    acesso: {
        nome: 'Volta imediata', icone: '🔥', dif: 2, temps: 1,
        desc: 'Rebaixado, gigante demais para a segunda divisão e com a torcida cobrando na porta do CT.',
        meta: 'Subir de divisão na primeira temporada',
        regras: ['Começa na segunda divisão com um dos elencos mais caros da liga.', 'A diretoria e a torcida não aceitam nada menos que o acesso.'],
        cands: () => Desafios.sortear(['BRA2', 'ENG2', 'ESP2', 'ITA2', 'GER2', 'FRA2', 'NED2', 'ARG2'].map(l => Desafios.daLiga(l)[0]).filter(Boolean), 4),
    },
    zebra: {
        nome: 'Pequeno entre gigantes', icone: '🐭', dif: 3, temps: 2,
        desc: 'O elenco mais fraco de uma liga grande. Todo mundo já conta com a queda.',
        meta: 'Não ser rebaixado nas 2 primeiras temporadas',
        regras: ['Começa com o elenco mais fraco da 1ª divisão.', 'Uma queda em qualquer uma das duas temporadas encerra o desafio.'],
        cands: () => Desafios.sortear(['ENG1', 'ESP1', 'ITA1', 'GER1', 'BRA1', 'FRA1'].map(l => { const x = Desafios.daLiga(l); return x[x.length - 1]; }).filter(Boolean), 4),
    },
    // só aparece no "Criar o seu clube" (prazo calculado pelo número de divisões)
    fundador: {
        nome: 'Do zero ao topo', icone: '🛠️', dif: 5, temps: 6, oculto: true,
        desc: 'O clube que você fundou, da última divisão até a elite.',
        meta: 'Levar o seu clube à 1ª divisão',
        regras: ['O clube começa na última divisão do país, com elenco modesto.'],
    },
};
const ORDEM_DSF = ['serieD', 'gigante', 'orcamento', 'base', 'reconstrucao', 'continental', 'acesso', 'zebra'];

// Perfil do clube criado
const PERFIS_CLUBE = {
    povo: { nome: 'Clube do povo', icone: '📣', desc: 'Torcida apaixonada desde o primeiro jogo e um estádio um pouco maior.' },
    investidor: { nome: 'Investidor rico', icone: '💰', desc: 'Um empresário banca o começo: o triplo de caixa, mas a torcida ainda é pequena.' },
    formador: { nome: 'Formador de talentos', icone: '🌱', desc: 'Categoria de base nível 3 desde o primeiro dia: garotos bem melhores.' },
};
const CORES_CLUBE = [['#c8102e', '#ffffff'], ['#111111', '#ffffff'], ['#0b3d91', '#ffd200'], ['#006b3f', '#ffffff'],
    ['#5b2a86', '#f5b301'], ['#f97316', '#111827'], ['#7dd3fc', '#1e3a8a'], ['#7f1d1d', '#facc15'], ['#ffffff', '#0f766e']];
const PALAVRAS_GENERICAS = ['clube', 'club', 'esporte', 'sport', 'futebol', 'football', 'associacao', 'sociedade', 'gremio', 'real', 'atletico',
    'sporting', 'united', 'city', 'fc', 'ec', 'sc', 'ac', 'ca', 'de', 'do', 'da', 'dos', 'das', 'e'];
const SEMANA_GIGANTE = 16;   // "Salve o gigante" começa na semana 17

const Desafios = {
    // -----------------------------------------------------------------
    //  Básico
    // -----------------------------------------------------------------
    rapido() {
        return (typeof Ritmo !== 'undefined' && Ritmo.rodando) || !!(Jogo.opcoes && Jogo.opcoes.simularJogos);
    },

    avisar(txt) {
        if (typeof Ritmo !== 'undefined' && Ritmo.rodando) return;
        UI.toast(txt);
    },

    historico(s) {
        s.car.desafios = s.car.desafios || [];
        return s.car.desafios;
    },

    // o desafio em andamento (ou null)
    ativo(s) {
        const d = s && s.modo === 'tecnico' && s.car ? s.car.desafio : null;
        return d && d.status === 'ativo' && DESAFIOS[d.id] ? d : null;
    },

    // regra de contratação do desafio em andamento (só vale no clube do desafio)
    regra(s) {
        const d = Desafios.ativo(s);
        if (!d || s.car.tid !== d.tid) return null;
        return DESAFIOS[d.id].regra || null;
    },

    semTaxa(s) {
        const r = Desafios.regra(s);
        return !!(r && r.semTaxa);
    },

    // texto explicando por que não dá para contratar (ou '' se pode). taxa = valor da transferência
    bloqueioCompra(s, p, taxa) {
        const r = Desafios.regra(s);
        if (!r || !p) return '';
        const D = DESAFIOS[s.car.desafio.id];
        if (r.maxIdade && p.idade > r.maxIdade) return `No desafio <b>${D.icone} ${D.nome}</b> só dá para contratar jogadores com até ${r.maxIdade} anos (${U.esc(p.nome)} tem ${p.idade}).`;
        if (r.semTaxa && taxa > 0) return `No desafio <b>${D.icone} ${D.nome}</b> não há verba para taxas de transferência: só jogadores livres, empréstimos e trocas sem dinheiro.`;
        return '';
    },

    nomeMeta(s, d) {
        const D = DESAFIOS[d.id];
        if (d.id === 'fundador') {
            const t = s.times[d.tid];
            const topo = t ? s.ligas.filter(l => l.pais === t.pais).sort((a, b) => a.nivel - b.nivel)[0] : null;
            if (d.nivel0 <= 1) return `Ser campeão da ${topo ? topo.curto : 'liga'} em até ${d.temps} temporadas`;
            return `Chegar à ${topo ? topo.curto : '1ª divisão'} em até ${d.temps} temporadas`;
        }
        if (d.id === 'base') { const t = s.times[d.tid]; const l = t && Mundo.liga(s, d.liga0 || t.liga); return `Terminar entre os 4 primeiros da ${l ? l.curto : 'liga'} em até 4 temporadas`; }
        if (d.id === 'continental' && d.copa) return `Ganhar a ${d.copa} em até 3 temporadas`;
        return D.meta;
    },

    prazo(d) {
        return d.temps || DESAFIOS[d.id].temps;
    },

    // -----------------------------------------------------------------
    //  Clubes dos dados (antes do mundo existir)
    // -----------------------------------------------------------------
    dados() {
        if (Desafios._dados) return Desafios._dados;
        const lista = [];
        for (const pais of DADOS.paises) {
            for (const L of pais.ligas) {
                const ts = L.times.map((T, i) => ({ nome: T[0], sigla: T[1], forca: T[2], c1: T[3], c2: T[4], jstr: T[5] || '', liga: L.id, ligaNome: L.nome, curto: L.curto || L.nome, nivel: L.nivel, pais: pais.id, bnd: pais.bandeira, i }));
                // mesma ordem do jogo (reputação, empate fica na ordem dos dados)
                ts.slice().sort((a, b) => b.forca - a.forca || a.i - b.i).forEach((x, k) => { x.rank = k + 1; x.n = ts.length; });
                for (const x of ts) lista.push(x);
            }
        }
        Desafios._dados = lista;
        return lista;
    },

    daLiga(liga) {
        return Desafios.dados().filter(x => x.liga === liga).sort((a, b) => a.rank - b.rank);
    },

    juntar(listas) {
        return listas.reduce((a, l) => a.concat(l), []);
    },

    sortear(lista, n) {
        return U.embaralhar(lista.slice()).slice(0, n);
    },

    veteranos(x) {
        return String(x.jstr || '').split(',').filter(p => { const v = p.trim().split(':'); return v.length >= 4 && +v[2] >= 30; }).length;
    },

    // candidatos de cada desafio (sorteados uma vez por sessão; 🎲 sorteia de novo)
    candidatos(id) {
        Jogo.ui.dsfCands = Jogo.ui.dsfCands || {};
        if (!Jogo.ui.dsfCands[id]) {
            const l = (DESAFIOS[id].cands ? DESAFIOS[id].cands() : []).filter(Boolean);
            l.sort((a, b) => b.forca - a.forca);
            Jogo.ui.dsfCands[id] = l;
        }
        return Jogo.ui.dsfCands[id];
    },

    // -----------------------------------------------------------------
    //  Telas do novo jogo
    // -----------------------------------------------------------------
    // botões ao lado do "Escolher clube" (gancho em Jogo.formNovo)
    botoesNovo() {
        return '<button class="btn btn-grande" data-acao="dsfAbrir">🎯 Desafios</button><button class="btn btn-grande" data-acao="cclAbrir">🛠️ Criar o seu clube</button>';
    },

    tela() {
        const cards = ORDEM_DSF.map(id => {
            const D = DESAFIOS[id];
            return `<button class="dsf-card" data-acao="dsfVer" data-id="${id}">
                <span class="dsf-ic">${D.icone}</span>
                <span class="dsf-txt"><b>${D.nome}</b><small>${D.desc}</small>
                    <span class="dsf-tags"><span class="tag">🎯 ${D.meta}</span><span class="tag">⏳ ${D.temps === 1 ? '1 temporada' : `${D.temps} temporadas`}</span><span class="tag dsf-dif" title="Dificuldade">${U.estrelas(D.dif)}</span></span>
                </span>
            </button>`;
        }).join('');
        Jogo.telaSimples('🎯 Desafios de carreira', `<p class="cinza dsf-intro">Cada desafio tem um começo fixo, uma meta e um prazo. Cumpriu? Reputação, bônus da diretoria e uma conquista só sua. Não deu? A carreira continua normalmente, sem o desafio.</p>
            <div class="dsf-grade">${cards}</div>`, 'dsfVoltar');
    },

    async ver(id) {
        const D = DESAFIOS[id];
        if (!D || D.oculto) return;
        const cands = Desafios.candidatos(id);
        if (!cands.length) return UI.aviso(D.nome, 'Nenhum clube disponível para este desafio.', D.icone);
        const bt = x => `<span class="dsf-bt">${UI.escudo(x)}<span><b>${U.esc(x.nome)}</b><small>${x.bnd} ${U.esc(x.curto)} · ${U.estrelas((x.forca - 50) / 7)}${id === 'reconstrucao' ? ` · ${Desafios.veteranos(x)} veteranos` : ''}</small></span></span>`;
        const r = await UI.modal({
            titulo: `<span class="modal-icone">${D.icone}</span>${D.nome}`,
            classe: 'modal-evento dsf-modal',
            html: `<p class="texto-evento">${D.desc}</p>
                <div class="dsf-meta"><span>🎯 <b>${D.meta}</b></span> <span class="tag">⏳ ${D.temps === 1 ? '1 temporada' : `${D.temps} temporadas`}</span> <span class="tag" title="Dificuldade">${U.estrelas(D.dif)}</span></div>
                <ul class="dsf-regras">${D.regras.map(x => `<li>${x}</li>`).join('')}<li>Cumprindo: <b>+${4 + D.dif * 2} de reputação</b>, bônus em dinheiro e a conquista do desafio. Ser demitido ou sair do clube encerra o desafio.</li></ul>
                <p class="cinza pequeno">Escolha o clube:</p>`,
            botoes: cands.map(x => ({ txt: bt(x), valor: x.nome, classe: 'btn-opcao' })).concat([
                { txt: '🎲 Outros clubes', valor: '__sortear', classe: 'btn-fantasma' }, { txt: 'Voltar', valor: null, classe: 'btn-fantasma' }]),
        });
        if (r === '__sortear') { delete Jogo.ui.dsfCands[id]; return Desafios.ver(id); }
        if (!r) return;
        Desafios.comecar(id, r);
    },

    // começa uma carreira nova já no desafio
    comecar(id, nome) {
        const form = Jogo.formTmp || Jogo.lerForm();
        UI.render(`<div class="carregando">⚽ ${id === 'gigante' ? 'Montando o mundo e jogando o primeiro turno...' : 'Montando o mundo do futebol...'}</div>`);
        const extra = Desafios.extraDesafio(id, nome);
        setTimeout(() => Tecnico.iniciar(form, nome, extra).catch(e => { console.error(e); UI.toast('Ops! ' + e.message, 'erro'); Jogo.menu(); }), 30);
    },

    // o que Tecnico.iniciar faz a mais num desafio
    extraDesafio(id, nome) {
        const D = DESAFIOS[id];
        return {
            preparar: s => {
                const t = s.times.find(x => x.nome === nome && x.liga);
                if (id === 'gigante') Desafios.crise(s, t, SEMANA_GIGANTE);
                if (id === 'base') { const inf = Mundo.infra(t); inf.base = Math.max(4, inf.base); }
                return t;
            },
            depois: (s, t) => Desafios.iniciarDesafio(s, t, id),
            boasVindas: async (s, t) => {
                await Desafios.cenaIntro(s, t, id);
                await Tecnico.cenaNovoClube(s, t);
                await UI.aviso(`${D.icone} ${D.nome}`, Desafios.textoBoasVindas(s, t), '🎯');
            },
        };
    },

    // "Salve o gigante": o mundo joga as primeiras semanas com o gigante em crise
    crise(s, t, ate) {
        const liga = Mundo.liga(s, t.liga);
        const zona = liga.times.length - (liga.troca || 3);   // última posição fora da zona
        while (s.semana < ate) {
            const pos = Mundo.classificacao(s, liga).indexOf(t.id) + 1;
            const afunda = pos <= zona;
            t.moral = afunda ? 5 : 30;
            // o time joga bem abaixo do que pode só nos jogos desta semana (o OVR volta logo depois)
            const el = Mundo.elenco(s, t), nerf = afunda ? 9 : 0;
            for (const p of el) { p.cond = afunda ? 30 : 60; p.ovr -= nerf; }
            try { Mundo.simularSemana(s); } finally { for (const p of el) p.ovr += nerf; }
            Mundo.posSemana(s);
        }
        // o elenco que você herda: moral no chão, vestiário rachado e dois titulares no departamento médico
        t.moral = 15;
        const el = Mundo.elenco(s, t).sort((a, b) => b.ovr - a.ovr);
        for (const p of el) { p.cond = U.clamp(p.cond + 20, 75, 100); Mot.mudar(p, Math.min(0, U.int(18, 34) - Mot.valor(p))); }
        el.slice(0, 2).forEach(p => { p.les = Math.max(p.les || 0, U.int(2, 5)); });
        const pos = Mundo.posicaoNaLiga(s, t.id);
        Mundo.noticia(s, `🆘 Crise no ${t.nome}: ${pos}º lugar na ${liga.curto} depois de ${liga.tab[t.id].j} rodadas. A diretoria demite o técnico.`, 'clube');
    },

    iniciarDesafio(s, t, id, extra) {
        const liga = Mundo.liga(s, t.liga);
        const d = { id, tid: t.id, clube: t.nome, ano0: s.ano, nivel0: liga.nivel, liga0: liga.id, temps: DESAFIOS[id].temps, regs: [], status: 'ativo' };
        if (extra) Object.assign(d, extra);
        s.car.desafio = d;
        Desafios.historico(s);
        const q = typeof Clube !== 'undefined' ? Clube.estado(s) : null;
        if (id === 'gigante') {
            s.car.conf = 50;   // a diretoria sabe do tamanho do buraco: paciência normal
            if (q) q.torc = 22;
        } else if (id === 'acesso') {
            s.car.conf = 50;
            if (q) q.torc = 36;
        } else if (id === 'orcamento') {
            // clube quebrado: caixa para umas 8 semanas de salário
            t.saldo = Math.min(t.saldo, U.redondo(Tecnico.folha(s, t) / 52 * 8));
        } else if (id === 'reconstrucao') {
            d.vets = Mundo.elenco(s, t).filter(p => p.idade >= 30).map(p => p.id);
            d.need = Math.min(4, d.vets.length);
        } else if (id === 'continental') {
            const c = s.copas.find(x => x.tipo === 'continental' && x.times.indexOf(t.id) >= 0);
            if (c) d.copa = c.nome;
        }
        Vida.log(s, `🎯 Desafio aceito: ${DESAFIOS[id].icone} ${DESAFIOS[id].nome} com o ${t.nome} — ${Desafios.nomeMeta(s, d)}.`, 'bom');
        const meta = Desafios.nomeMeta(s, d);
        Mundo.noticia(s, `🎯 ${s.pessoa.nome} assume o ${t.nome} com uma missão: ${meta.charAt(0).toLowerCase() + meta.slice(1)}.`, 'clube');
        return d;
    },

    textoBoasVindas(s, t) {
        const d = s.car.desafio, D = DESAFIOS[d.id];
        const liga = Mundo.liga(s, t.liga);
        let extra = '';
        if (d.id === 'gigante') extra = `<br><br>📉 O ${U.esc(t.nome)} está em <b>${Mundo.posicaoNaLiga(s, t.id)}º lugar</b> na ${U.esc(liga.curto)} (${liga.tab[t.id].pts} pontos). A zona começa no ${liga.times.length - liga.troca + 1}º.`;
        if (d.id === 'reconstrucao') extra = `<br><br>👴 ${d.vets.length} jogadores com 30+ anos no elenco: ${d.need} precisam sair até o fim da temporada.`;
        if (d.id === 'continental' && !d.copa) extra = '<br><br>⚠️ O clube não entrou na copa continental desta temporada: classifique-se para tentar na próxima.';
        return `🎯 <b>${Desafios.nomeMeta(s, d)}</b>.<br><br>${D.regras.map(x => `• ${x}`).join('<br>')}${extra}<br><br>A meta e o progresso ficam na tela do clube, ao lado dos objetivos da diretoria.`;
    },

    cenaIntro(s, t, id) {
        const D = DESAFIOS[id];
        return Cena.mostrar([{
            fundo: 'radial-gradient(circle at 50% 35%, #4a3200 0%, #05070c 70%)', classe: 'cs-simples cs-desafio', som: 'impacto', auto: 3400,
            html: `<div class="cena-mini">🎯 Desafio de carreira</div><div class="icone-grande">${D.icone}</div>
                <div class="cena-titulo">${U.esc(D.nome.toUpperCase())}</div>
                <div class="cena-sub">${U.esc(Desafios.nomeMeta(s, s.car.desafio))}</div>`,
        }]);
    },

    // -----------------------------------------------------------------
    //  🛠️ Criar o seu clube
    // -----------------------------------------------------------------
    form() {
        const f = Jogo.formTmp || {};
        Jogo.ui.ccl = Jogo.ui.ccl || { nome: '', sigla: '', siglaManual: false, c1: CORES_CLUBE[2][0], c2: CORES_CLUBE[2][1], pais: f.pais && Mundo.pais(f.pais) ? f.pais : 'BRA', estadio: '', perfil: 'povo', desafio: true };
        return Jogo.ui.ccl;
    },

    siglaDe(nome) {
        const palavras = U.semAcento(nome).replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(Boolean);
        const w = palavras.find(x => x.length >= 3 && PALAVRAS_GENERICAS.indexOf(x) < 0) || palavras[0] || '';
        return w.slice(0, 3).toUpperCase();
    },

    // última divisão do país e o clube que sai para o seu entrar
    destinoClube(paisId) {
        const ligas = Desafios.dados().filter(x => x.pais === paisId);
        if (!ligas.length) return null;
        const nivel = Math.max.apply(null, ligas.map(x => x.nivel));
        const daLiga = ligas.filter(x => x.nivel === nivel);
        const sai = daLiga.slice().sort((a, b) => a.forca - b.forca || b.i - a.i)[0];
        const niveis = new Set(ligas.map(x => x.nivel)).size;
        return { liga: sai.liga, ligaNome: sai.ligaNome, curto: sai.curto, nivel, sai, n: daLiga.length, niveis };
    },

    prazoFundador(dest) {
        return dest.niveis <= 1 ? 5 : (dest.niveis - 1) * 2;
    },

    htmlPreview(f) {
        const dest = Desafios.destinoClube(f.pais);
        const pais = Mundo.pais(f.pais);
        const t = { c1: f.c1, c2: f.c2, sigla: f.sigla || '???' };
        return `<div class="cabecalho-clube ccl-cab" style="--c1:${t.c1};--c2:${t.c2}">
                ${UI.escudo(t, true)}
                <div><h2>${U.esc(f.nome || 'Seu clube')}</h2><span>${pais ? pais.bandeira : ''} ${dest ? U.esc(dest.curto) : ''} · 🏟️ ${U.esc(f.estadio || Desafios.estadioPadrao(f.nome))}</span></div>
            </div>
            ${dest ? `<p class="cinza pequeno">Começa na <b>${U.esc(dest.ligaNome)}</b> no lugar do <b>${U.esc(dest.sai.nome)}</b> (a liga continua com ${dest.n} clubes).</p>` : ''}`;
    },

    estadioPadrao(nome) {
        return nome ? `Arena ${String(nome).split(' ').filter(w => PALAVRAS_GENERICAS.indexOf(U.semAcento(w)) < 0).slice(-1)[0] || nome}` : 'Arena do Povo';
    },

    telaCriar() {
        const f = Desafios.form();
        const dest = Desafios.destinoClube(f.pais);
        const paises = DADOS.paises.map(p => `<option value="${p.id}" ${p.id === f.pais ? 'selected' : ''}>${p.bandeira} ${p.nome}</option>`).join('');
        const prazo = dest ? Desafios.prazoFundador(dest) : 6;
        const html = `<div class="ccl-grade ccl-form">
            <div>
                <label class="campo">Nome do clube<input id="ccl-nome" class="inp" maxlength="26" placeholder="Ex.: Atlético Nevviz" value="${U.esc(f.nome)}"></label>
                <div class="ccl-linha">
                    <label class="campo">Sigla (3 letras)<input id="ccl-sigla" class="inp ccl-sigla" maxlength="3" placeholder="NEV" value="${U.esc(f.sigla)}"></label>
                    <label class="campo">Cor 1<input id="ccl-c1" class="ccl-cor" type="color" value="${f.c1}"></label>
                    <label class="campo">Cor 2<input id="ccl-c2" class="ccl-cor" type="color" value="${f.c2}"></label>
                </div>
                <div class="ccl-paletas">${CORES_CLUBE.map(([a, b]) => `<button class="ccl-paleta ${a === f.c1 && b === f.c2 ? 'ativo' : ''}" data-acao="cclCores" data-c1="${a}" data-c2="${b}" title="${a} / ${b}" style="background:linear-gradient(135deg, ${a} 50%, ${b} 50%)"></button>`).join('')}</div>
                <label class="campo">País (o clube entra na última divisão)<select id="ccl-pais" class="sel">${paises}</select></label>
                <label class="campo">Estádio<input id="ccl-estadio" class="inp" maxlength="30" placeholder="${U.esc(Desafios.estadioPadrao(f.nome))}" value="${U.esc(f.estadio)}"></label>
            </div>
            <div>
                <div class="ccl-preview">${Desafios.htmlPreview(f)}</div>
                <h4>Perfil do clube</h4>
                <div class="ccl-perfis">${Object.keys(PERFIS_CLUBE).map(k => { const P = PERFIS_CLUBE[k]; return `<button class="atividade ${f.perfil === k ? 'ativa' : ''}" data-acao="cclPerfil" data-k="${k}"><span class="at-icone">${P.icone}</span><b>${P.nome}</b><small>${P.desc}</small></button>`; }).join('')}</div>
                <label class="campo check ccl-check"><input type="checkbox" id="ccl-desafio" ${f.desafio ? 'checked' : ''}> 🛠️ Desafio <b>Do zero ao topo</b>: <span class="ccl-meta">${dest && dest.niveis <= 1 ? `ser campeão em até ${prazo} temporadas` : `chegar à 1ª divisão em até ${prazo} temporadas`}</span></label>
            </div>
        </div>
        <p class="ccl-erro vermelho pequeno"></p>
        <div class="linha-botoes"><button class="btn btn-primario btn-grande" data-acao="cclFundar">🏟️ Fundar o clube ▶</button></div>`;
        Jogo.telaSimples('🛠️ Criar o seu clube', html, 'dsfVoltar');
    },

    // lê o formulário (a cada tecla) e atualiza só a prévia
    lerCriar() {
        const f = Desafios.form();
        const v = id => { const e = document.getElementById(id); return e ? e.value : ''; };
        const nome = v('ccl-nome');
        const siglaEl = document.getElementById('ccl-sigla');
        const sigla = U.semAcento(v('ccl-sigla')).replace(/[^a-z0-9]/g, '').toUpperCase().slice(0, 3);
        if (document.activeElement === siglaEl) f.siglaManual = sigla.length > 0;
        f.nome = nome;
        f.sigla = f.siglaManual ? sigla : Desafios.siglaDe(nome);
        if (siglaEl && document.activeElement !== siglaEl && siglaEl.value !== f.sigla) siglaEl.value = f.sigla;
        f.c1 = v('ccl-c1') || f.c1;
        f.c2 = v('ccl-c2') || f.c2;
        const paisAntes = f.pais;
        f.pais = v('ccl-pais') || f.pais;
        f.estadio = v('ccl-estadio');
        const chk = document.getElementById('ccl-desafio');
        if (chk) f.desafio = chk.checked;
        const pv = document.querySelector('.ccl-preview');
        if (pv) pv.innerHTML = Desafios.htmlPreview(f);
        const est = document.getElementById('ccl-estadio');
        if (est) est.placeholder = Desafios.estadioPadrao(f.nome);
        if (paisAntes !== f.pais) {
            const dest = Desafios.destinoClube(f.pais), meta = document.querySelector('.ccl-meta');
            if (meta && dest) { const pz = Desafios.prazoFundador(dest); meta.textContent = dest.niveis <= 1 ? `ser campeão em até ${pz} temporadas` : `chegar à 1ª divisão em até ${pz} temporadas`; }
        }
    },

    validarCriar(f) {
        const nome = String(f.nome || '').trim().replace(/\s+/g, ' ');
        if (nome.length < 3) return 'Dê um nome ao clube (pelo menos 3 letras).';
        const chave = U.semAcento(nome);
        if (Desafios.dados().some(x => U.semAcento(x.nome) === chave)) return `Já existe um clube chamado ${U.esc(nome)}. Escolha outro nome.`;
        if (!/^[A-Z0-9]{3}$/.test(f.sigla || '')) return 'A sigla precisa ter 3 letras (ou números).';
        if (!/^#[0-9a-fA-F]{6}$/.test(f.c1 || '') || !/^#[0-9a-fA-F]{6}$/.test(f.c2 || '')) return 'Escolha as duas cores do clube.';
        if (!Desafios.destinoClube(f.pais)) return 'Escolha o país.';
        return '';
    },

    async fundar() {
        Desafios.lerCriar();
        const f = Desafios.form();
        const erro = Desafios.validarCriar(f);
        const caixa = document.querySelector('.ccl-erro');
        if (erro) { if (caixa) caixa.innerHTML = '⚠️ ' + erro; UI.toast('⚠️ ' + erro.replace(/<[^>]+>/g, ''), 'erro'); return; }
        const cfg = {
            nome: f.nome.trim().replace(/\s+/g, ' '), sigla: f.sigla, c1: f.c1.toLowerCase(), c2: f.c2.toLowerCase(), pais: f.pais,
            estadio: String(f.estadio || '').trim() || Desafios.estadioPadrao(f.nome.trim()), perfil: PERFIS_CLUBE[f.perfil] ? f.perfil : 'povo', desafio: !!f.desafio,
        };
        const form = Jogo.formTmp || Jogo.lerForm();
        UI.render('<div class="carregando">⚽ Fundando o clube e montando o mundo do futebol...</div>');
        const extra = Desafios.extraClube(cfg);
        setTimeout(() => Tecnico.iniciar(form, cfg.nome, extra).catch(e => { console.error(e); UI.toast('Ops! ' + e.message, 'erro'); Jogo.menu(); }), 30);
    },

    // o que Tecnico.iniciar faz a mais com o clube criado
    extraClube(cfg) {
        return {
            preparar: s => Desafios.criarClube(s, cfg),
            depois: (s, t) => {
                const q = typeof Clube !== 'undefined' ? Clube.estado(s) : null;
                if (q) q.torc = cfg.perfil === 'povo' ? 68 : cfg.perfil === 'investidor' ? 42 : 52;
                s.car.conf = 60;   // a diretoria (você mesmo!) tem paciência
                Conquistas.contar(s, 'clubesCriados');
                if (cfg.desafio) {
                    const dest = Desafios.destinoClube(cfg.pais);
                    Desafios.iniciarDesafio(s, t, 'fundador', { temps: Desafios.prazoFundador(dest) });
                }
            },
            boasVindas: async (s, t) => {
                await Desafios.cenaFundacao(s, t);
                await Tecnico.cenaNovoClube(s, t);
                const d = Desafios.ativo(s);
                await UI.aviso(`O ${U.esc(t.nome)} nasceu!`, `Você fundou o <b>${U.esc(t.nome)}</b> e é o primeiro técnico da história do clube. Estádio: 🏟️ <b>${U.esc(t.criado.estadio)}</b>.<br><br>A diretoria espera o <b>${Tecnico.expectativa(s)}º lugar</b> na ${U.esc(Mundo.liga(s, t.liga).nome)}.${d ? `<br><br>🛠️ Desafio <b>Do zero ao topo</b>: ${U.esc(Desafios.nomeMeta(s, d))}.` : ''}<br><br>Dica: o elenco é modesto. Jogadores sem clube podem vir a qualquer momento e, na janela, dá para pedir emprestado.`, '🛠️');
            },
        };
    },

    // troca o clube mais fraco da última divisão do país pelo clube novo
    criarClube(s, cfg) {
        const ligas = s.ligas.filter(l => l.pais === cfg.pais).sort((a, b) => b.nivel - a.nivel);
        const liga = ligas[0];
        const t = liga.times.map(id => s.times[id]).sort((a, b) => a.rep - b.rep || b.id - a.id)[0];
        const pais = Mundo.pais(cfg.pais);
        // o elenco antigo: os jogadores reais vão para o mercado, os gerados somem
        for (const p of Mundo.elenco(s, t)) {
            if (p.real) { p.tid = -1; s.livres.push(p.id); } else delete s.jog[p.id];
        }
        const antigo = t.nome;
        const minRep = Math.min.apply(null, liga.times.map(id => s.times[id].rep));
        const rep = Math.max(40, Math.round(minRep) - 1);
        Object.assign(t, {
            nome: cfg.nome, sigla: cfg.sigla, c1: cfg.c1, c2: cfg.c2, rep, elenco: [], tit: null, tecnico: null, base: null,
            form: '4-3-3', estilo: 'equilibrado', moral: 55,
            infra: { estadio: cfg.perfil === 'povo' ? 2 : 1, ct: 1, base: cfg.perfil === 'formador' ? 3 : 1 },
            criado: { ano: s.ano, estadio: cfg.estadio, perfil: cfg.perfil, antigo, por: s.pessoa ? s.pessoa.nome : '' },
        });
        delete t.criterio;   // volta à escalação automática padrão
        Mundo.criarElenco(s, t, '', pais.nomes, rep, liga.riqueza);
        const somaValor = U.soma(t.elenco, id => Mundo.valor(s.jog[id]));
        t.saldo = U.redondo((somaValor * 0.07 + 3e6 * liga.riqueza) * (cfg.perfil === 'investidor' ? 3 : 1));
        Mundo.noticia(s, `🛠️ Nasce o ${t.nome} (${t.sigla}), que entra na ${liga.nome} no lugar do ${antigo}. Casa: ${t.criado.estadio}.`, 'clube');
        return t;
    },

    cenaFundacao(s, t) {
        const cores = [t.c1, t.c2, '#ffd700', '#ffffff'];
        return Cena.mostrar([
            {
                fundo: `radial-gradient(circle at 50% 42%, ${t.c1} 0%, #05070c 72%)`, classe: 'cs-escudo cs-fundacao', som: 'impacto', confete: cores,
                html: `<div class="cena-mini">🛠️ Fundação</div><div class="raios"></div>${Cena.escudo(t, 'gira-entra')}
                    <div class="cena-titulo">NASCE O ${U.esc(t.nome.toUpperCase())}</div>
                    <div class="cena-sub">Fundado em ${t.criado.ano} por ${U.esc(s.pessoa.nome)}</div>`,
            },
            {
                fundo: 'radial-gradient(ellipse at 50% 120%, #17402a 0%, #05070c 70%)', classe: 'cs-estadio', som: 'torcida', auto: 3000,
                html: `<div class="holofotes"><i></i><i></i></div><div class="cena-mini">🏟️ A casa do clube</div>
                    <div class="cena-titulo">${U.esc(t.criado.estadio.toUpperCase())}</div>
                    <div class="cena-sub">${PERFIS_CLUBE[t.criado.perfil] ? `${PERFIS_CLUBE[t.criado.perfil].icone} ${PERFIS_CLUBE[t.criado.perfil].nome}` : ''}</div>`,
            },
        ]);
    },

    // -----------------------------------------------------------------
    //  Durante a carreira
    // -----------------------------------------------------------------
    // meta da diretoria (gancho em Tecnico.expectativa): no "Salve o gigante" é só não cair
    expectativa(s, t) {
        const d = Desafios.ativo(s);
        if (!d || d.id !== 'gigante' || d.tid !== t.id || s.ano !== d.ano0) return 0;
        const liga = Mundo.liga(s, t.liga);
        return liga.times.length - (liga.troca || 0);
    },

    // posição, quantos sobem e quantos caem na liga do clube
    situacao(s, t) {
        const liga = Mundo.liga(s, t.liga);
        const ligasPais = s.ligas.filter(l => l.pais === liga.pais).sort((a, b) => a.nivel - b.nivel);
        const idx = ligasPais.indexOf(liga);
        return { liga, pos: Mundo.posicaoNaLiga(s, t.id), n: liga.times.length, sobem: idx > 0 ? ligasPais[idx - 1].troca : 0, caem: liga.troca || 0 };
    },

    vetsFora(s, t, d) {
        return (d.vets || []).filter(id => {
            const p = s.jog[id];
            if (!p) return true;
            if (p.empr && p.empr.de === t.id) return false;   // emprestado continua sendo do clube
            return p.tid !== t.id;
        }).length;
    },

    // progresso para a tela do clube: { pct, txt, risco }
    progresso(s, t, d) {
        const si = Desafios.situacao(s, t);
        const k = s.ano - d.ano0 + 1, N = Desafios.prazo(d);
        const tempTxt = N > 1 ? ` · temporada ${Math.min(k, N)}/${N}` : '';
        const ultima = k >= N;
        const zonaQueda = si.caem ? si.n - si.caem + 1 : 0;
        switch (d.id) {
            case 'serieD':
            case 'fundador': {
                if (d.id === 'fundador' && d.nivel0 <= 1) {
                    return { pct: Math.max(4, (si.n - si.pos + 1) / si.n * 100), txt: `${si.pos}º na ${U.esc(si.liga.curto)}${tempTxt}`, risco: ultima && si.pos > 1 };
                }
                const total = Math.max(1, d.nivel0 - 1), feito = d.nivel0 - si.liga.nivel;
                const sobe = si.sobem && si.pos <= si.sobem;
                const pct = (feito + (sobe ? 0.5 : 0)) / total * 100;
                return { pct: Math.max(4, pct), txt: `${U.esc(si.liga.curto)}: ${si.pos}º lugar${si.sobem ? ` (sobem ${si.sobem})` : ''} · faltam ${si.liga.nivel - 1} acesso${si.liga.nivel - 1 === 1 ? '' : 's'}${tempTxt}`, risco: ultima && !sobe };
            }
            case 'gigante':
            case 'zebra': {
                const fora = !zonaQueda || si.pos < zonaQueda;
                return { pct: U.clamp((si.n - si.pos + 1) / si.n * 100, 4, 100), txt: `${si.pos}º lugar${zonaQueda ? ` · a zona começa no ${zonaQueda}º` : ''}${tempTxt}`, risco: !fora };
            }
            case 'orcamento': {
                const esp = Tecnico.expectativa(s);
                return { pct: U.clamp((k - 1 + (si.pos <= esp ? 1 : 0.4)) / N * 100, 4, 100), txt: `${si.pos}º lugar · meta da diretoria: ${esp}º${tempTxt}`, risco: si.pos > esp && s.semana >= 30 };
            }
            case 'base':
                return { pct: U.clamp((si.n - si.pos + 1) / Math.max(1, si.n - 3) * 100, 4, 100), txt: `${si.pos}º lugar · precisa ficar entre os 4${tempTxt}`, risco: ultima && si.pos > 4 };
            case 'reconstrucao': {
                const fora = Desafios.vetsFora(s, t, d);
                const vetTxt = k <= 1 && d.need ? `👴 veteranos que saíram: ${Math.min(fora, d.need)}/${d.need} · ` : '';
                return { pct: si.pos === 1 ? 90 : U.clamp((si.n - si.pos + 1) / si.n * 70, 4, 80), txt: `${vetTxt}${si.pos}º lugar${tempTxt}`, risco: (k <= 1 && fora < d.need && s.semana >= 30) || (ultima && si.pos > 1) };
            }
            case 'continental': {
                const c = s.copas.find(x => x.tipo === 'continental' && x.times.indexOf(t.id) >= 0);
                if (!c) return { pct: 4, txt: `fora da copa continental nesta temporada${tempTxt}`, risco: ultima };
                const fases = Mundo.fasesCopa(c);
                let ult = 0, fora = false;
                c.jogos.forEach((jogos, f) => {
                    const j = jogos.find(x => x[0] === t.id || x[1] === t.id);
                    if (!j) return;
                    ult = f;
                    const r = (c.res[f] || []).find(x => x.h === j[0] && x.a === j[1]);
                    if (r && r.venc !== t.id) fora = true;
                });
                if (c.campeao === t.id) return { pct: 100, txt: `🏆 campeão da ${U.esc(c.nome)}!`, risco: false };
                return { pct: U.clamp((ult + (fora ? 0 : 0.5)) / fases.length * 100, 4, 96), txt: `${U.esc(c.nome)}: ${fora ? `eliminado (${fases[ult]})` : fases[ult]}${tempTxt}`, risco: fora && ultima };
            }
            case 'acesso': {
                const sobe = si.sobem && si.pos <= si.sobem;
                return { pct: U.clamp((si.n - si.pos + 1) / Math.max(1, si.n - si.sobem + 1) * 100, 4, 100), txt: `${si.pos}º lugar · sobem ${si.sobem}`, risco: !sobe && s.semana >= 20 };
            }
        }
        return { pct: 0, txt: '', risco: false };
    },

    // semana (gancho no começo de Tecnico.semana): saiu do clube = desafio encerrado
    async semana(s) {
        const d = Desafios.ativo(s);
        if (!d || s.car.tid === d.tid) return;
        await Desafios.encerrar(s, d, false, Desafios.motivoSaida(s, d), Desafios.rapido());
    },

    motivoSaida(s, d) {
        const h = s.car.hist[s.car.hist.length - 1];
        if (h && h.time === d.clube && /Demitido/.test(h.obs || '')) return `a diretoria do ${d.clube} te demitiu`;
        if (s.car.tid >= 0 && s.times[s.car.tid]) return `você trocou o ${d.clube} pelo ${s.times[s.car.tid].nome}`;
        return `você deixou o ${d.clube} antes do fim`;
    },

    // fim da temporada, antes da virada do ano (gancho em Tecnico.antesFimTemporada)
    registrarTemporada(s, t) {
        // clube criado por você campeão da 1ª divisão (conquista "Sonho realizado")
        if (t.criado && Mundo.posicaoNaLiga(s, t.id) === 1 && Mundo.liga(s, t.liga).nivel === 1) Conquistas.contar(s, 'criadoCampeao');
        const d = Desafios.ativo(s);
        if (!d || d.tid !== t.id) return;
        d.regs = d.regs || [];
        if (d.regs.length && d.regs[d.regs.length - 1].ano === s.ano) return;
        const si = Desafios.situacao(s, t);
        d.regs.push({
            ano: s.ano, liga: si.liga.id, curto: si.liga.curto, nivel: si.liga.nivel, pos: si.pos, n: si.n, esp: Tecnico.expectativa(s),
            campeao: si.pos === 1, caiu: !!si.caem && si.pos > si.n - si.caem, subiu: !!si.sobem && si.pos <= si.sobem,
            cont: !!(s.car.titTemp && s.car.titTemp.cont), fora: d.vets ? Desafios.vetsFora(s, t, d) : 0,
        });
    },

    // veredito depois da virada do ano (gancho no começo de Tecnico.depoisFimTemporada)
    async fimTemporada(s, resumo) {
        const d = Desafios.ativo(s);
        if (!d) return;
        if (s.car.tid !== d.tid) return Desafios.encerrar(s, d, false, Desafios.motivoSaida(s, d));
        const r = d.regs && d.regs[d.regs.length - 1];
        if (!r || (resumo && r.ano !== resumo.ano)) return;
        const t = s.times[d.tid];
        const v = Desafios.avaliar(s, d, r, t);
        if (v) return Desafios.encerrar(s, d, v.ok, v.txt);
        // ainda no prazo: uma linha no diário com o andamento
        const N = Desafios.prazo(d), k = d.regs.length;
        Vida.log(s, `🎯 Desafio ${DESAFIOS[d.id].nome}: temporada ${k}/${N} — ${Desafios.textoParcial(s, d, r, t)}`, '');
    },

    textoParcial(s, d, r, t) {
        const liga = Mundo.liga(s, t.liga);
        if (d.id === 'serieD' || d.id === 'fundador') {
            if (d.nivel0 <= 1) return `${r.pos}º lugar. Vamos de novo!`;
            return r.subiu ? `ACESSO! Agora é a ${liga.curto} (faltam ${liga.nivel - 1}).` : `${r.pos}º na ${r.curto}. Ainda na ${liga.curto}.`;
        }
        if (d.id === 'orcamento') return `${r.pos}º lugar, meta ${r.esp}º ✅`;
        if (d.id === 'zebra') return `${r.pos}º lugar, ficou na ${r.curto} ✅`;
        if (d.id === 'reconstrucao' && d.regs.length === 1) return `${r.fora}/${d.need} veteranos saíram ✅ · ${r.pos}º lugar.`;
        return `${r.pos}º lugar na ${r.curto}.`;
    },

    // { ok, txt } quando o desafio acaba nesta temporada; null = continua
    avaliar(s, d, r, t) {
        const N = Desafios.prazo(d), k = d.regs.length;
        const liga = Mundo.liga(s, t.liga);   // liga da temporada nova (depois do acesso/rebaixamento)
        const acabou = k >= N;
        const anos = k === 1 ? 'na primeira temporada' : `em ${k} temporadas`;
        switch (d.id) {
            case 'serieD':
            case 'fundador':
                if (d.nivel0 <= 1) {
                    if (r.campeao) return { ok: true, txt: `o ${t.nome} foi campeão da ${r.curto} ${anos}` };
                    return acabou ? { ok: false, txt: `${N} temporadas e nenhum título (${r.pos}º no último ano)` } : null;
                }
                if (liga.nivel === 1) return { ok: true, txt: `o ${t.nome} chegou à ${liga.curto} ${anos}` };
                return acabou ? { ok: false, txt: `o prazo acabou com o ${t.nome} na ${liga.curto}` } : null;
            case 'gigante':
                return r.caiu ? { ok: false, txt: `o ${t.nome} terminou em ${r.pos}º e foi rebaixado` } : { ok: true, txt: `o ${t.nome} escapou: ${r.pos}º lugar na ${r.curto}` };
            case 'zebra':
                if (r.caiu) return { ok: false, txt: `o ${t.nome} terminou em ${r.pos}º e caiu` };
                return acabou ? { ok: true, txt: `${N} temporadas sem cair (${r.pos}º no último ano)` } : null;
            case 'orcamento':
                if (r.pos > r.esp) return { ok: false, txt: `${r.pos}º lugar na temporada ${k}, a meta era ${r.esp}º` };
                return acabou ? { ok: true, txt: `metas cumpridas nas ${N} temporadas sem gastar um centavo em taxas` } : null;
            case 'base':
                if (r.nivel === 1 && r.pos <= 4) return { ok: true, txt: `${r.pos}º lugar na ${r.curto} ${anos}, com a garotada` };
                return acabou ? { ok: false, txt: `o prazo acabou (${r.pos}º no último ano)` } : null;
            case 'reconstrucao':
                if (k === 1 && r.fora < (d.need || 0)) return { ok: false, txt: `só ${r.fora} de ${d.need} veteranos saíram na primeira temporada` };
                if (r.campeao && r.nivel === 1) return { ok: true, txt: `elenco renovado e campeão da ${r.curto} ${anos}` };
                return acabou ? { ok: false, txt: `o título não veio em ${N} temporadas` } : null;
            case 'continental':
                if (r.cont) return { ok: true, txt: `campeão continental ${anos}` };
                return acabou ? { ok: false, txt: `${N} temporadas sem a taça continental` } : null;
            case 'acesso':
                return r.subiu ? { ok: true, txt: `acesso de primeira com o ${t.nome} (${r.pos}º)` } : { ok: false, txt: `${r.pos}º lugar: o ${t.nome} não subiu` };
        }
        return acabou ? { ok: false, txt: 'o prazo acabou' } : null;
    },

    async encerrar(s, d, ok, txt, semCena) {
        if (d.status !== 'ativo') return;
        const D = DESAFIOS[d.id];
        d.status = ok ? 'ok' : 'falhou';
        d.txt = txt;
        const ano = d.regs && d.regs.length ? d.regs[d.regs.length - 1].ano : s.ano;
        d.fim = ano;
        let rep = 0, premio = 0;
        const t = s.times[d.tid];
        if (ok) {
            rep = 4 + D.dif * 2;
            premio = U.redondo(Math.max(5e4, (s.car.sal || 0) * (0.15 + D.dif * 0.07)));
            s.car.rep = U.clamp(s.car.rep + rep, 0, 100);
            s.pessoa.dinheiro += premio;
            if (s.car.tid === d.tid) s.car.conf = U.clamp(s.car.conf + 10, 0, 100);
            Vida.mudar(s, { felicidade: 12 + D.dif * 2, fama: 2 + D.dif * 1.5 });
            Conquistas.contar(s, 'dsf_' + d.id);
            Conquistas.contar(s, 'desafiosCumpridos');
            Vida.log(s, `🎯 DESAFIO CUMPRIDO: ${D.icone} ${D.nome} — ${txt}! (+${rep} de reputação, bônus de ${U.dinheiro(premio)})`, 'titulo');
            Mundo.noticia(s, `🎯 Missão cumprida: ${s.pessoa.nome} e o ${d.clube} — ${txt}.`, 'titulo');
        } else {
            s.car.rep = U.clamp(s.car.rep - 3, 0, 100);
            Vida.mudar(s, { felicidade: -6 });
            Vida.log(s, `🎯 Desafio fracassado: ${D.icone} ${D.nome} — ${txt}. A carreira continua, agora sem o desafio.`, 'ruim');
        }
        Desafios.historico(s).unshift({ id: d.id, clube: d.clube, ano0: d.ano0, ano, ok, txt, rep, premio });
        if (s.car.desafios.length > 12) s.car.desafios.length = 12;
        if (semCena) { Desafios.avisar(`${ok ? '🎯 Desafio cumprido' : '💔 Desafio fracassado'}: ${D.nome} — ${txt}.`); return; }
        if (ok) await Desafios.cenaSucesso(s, d, t, txt, rep, premio);
        else await Cena.simples('💔', 'DESAFIO FRACASSADO', `${D.icone} ${U.esc(D.nome)}: ${U.esc(txt)}. A carreira continua — agora sem o desafio.`, 'radial-gradient(circle at 50% 40%, #4a0f0f 0%, #05070c 70%)', 'triste');
    },

    cenaSucesso(s, d, t, txt, rep, premio) {
        const D = DESAFIOS[d.id];
        const c1 = t ? t.c1 : '#1c2a48', c2 = t ? t.c2 : '#ffd700';
        const cores = [c1, c2, '#ffd700', '#ffffff'];
        const temps = d.regs ? d.regs.length : 1;
        return Cena.mostrar([
            {
                fundo: `radial-gradient(circle at 50% 45%, ${c1} 0%, #05070c 72%)`, classe: 'cs-simples cs-desafio', som: 'titulo', confete: cores, qtdConfete: 240,
                html: `<div class="cena-mini">🎯 Desafio de carreira</div><div class="raios dourado"></div><div class="icone-grande">${D.icone}</div>
                    <div class="cena-titulo brilho">DESAFIO CUMPRIDO!</div><div class="cena-sub">${U.esc(D.nome)} · ${U.esc(d.clube)}</div>`,
            },
            {
                fundo: `linear-gradient(160deg, ${c1} 0%, #0b1220 65%)`, classe: 'cs-info cs-desafio2', confete: cores,
                html: `${t ? Cena.escudo(t, 'gira-entra') : ''}
                    ${Cena.cartao([['Desafio', `${D.icone} ${U.esc(D.nome)}`], ['Temporadas', String(temps)], ['Reputação', `+${rep}`], ['Bônus da diretoria', U.dinheiro(premio)]])}
                    <div class="cena-sub">${U.esc(txt.charAt(0).toUpperCase() + txt.slice(1))}!</div>`,
            },
        ]);
    },

    // -----------------------------------------------------------------
    //  Telas da carreira
    // -----------------------------------------------------------------
    // ao lado dos objetivos da diretoria (gancho em Tecnico.inicio)
    htmlInicio(s, t) {
        const d = s.car.desafio;
        let html = '';
        if (d && d.tid === t.id && DESAFIOS[d.id]) {
            const D = DESAFIOS[d.id];
            if (d.status === 'ativo') {
                const pr = Desafios.progresso(s, t, d);
                const N = Desafios.prazo(d), k = Math.min(N, s.ano - d.ano0 + 1);
                const r = D.regra;
                const regra = r ? (r.semTaxa ? 'sem taxas de transferência' : `só contratar jogadores até ${r.maxIdade} anos`) : '';
                html += `<div class="clb-objs compacto dsf-inicio"><h4>${D.icone} Desafio: ${U.esc(D.nome)}</h4>
                    <div class="clb-obj clb-obj-and">
                        <div class="clb-obj-topo"><span>🎯 ${U.esc(Desafios.nomeMeta(s, d))}</span><b title="Temporada do desafio">⏳ ${k}/${N}</b></div>
                        <div class="stat-fundo"><div class="stat-preenche ${pr.risco ? 'vermelho' : pr.pct >= 70 ? 'verde' : 'amarelo'}" style="width:${Math.round(pr.pct)}%"></div></div>
                        <small class="${pr.risco ? 'vermelho' : 'cinza'}">${pr.txt}</small>
                        ${regra ? `<small class="dsf-regra">📜 Regra: ${regra}</small>` : ''}
                    </div></div>`;
            } else if (d.fim >= s.ano - 1) {
                html += `<p class="pequeno dsf-fim">${d.status === 'ok' ? '✅' : '❌'} Desafio ${D.icone} ${U.esc(D.nome)}: ${U.esc(d.txt || '')}.</p>`;
            }
        }
        if (t.criado) html += `<p class="pequeno ccl-info">🛠️ Fundado por você em ${t.criado.ano} · 🏟️ ${U.esc(t.criado.estadio)}</p>`;
        return html;
    },

    // aviso da regra do desafio no alto do mercado (gancho em Tecnico.mercado)
    bannerMercado(s) {
        const r = Desafios.regra(s);
        if (!r) return '';
        const D = DESAFIOS[s.car.desafio.id];
        return `<div class="cartao dsf-banner">${D.icone} <span><b>Desafio ${U.esc(D.nome)}:</b> ${r.semTaxa ? 'sem verba para taxas de transferência. Dá para contratar jogadores livres, pedir emprestado e propor trocas sem dinheiro.' : `só dá para contratar jogadores com até ${r.maxIdade} anos (vale para empréstimos e trocas).`}</span></div>`;
    },

    // aba Carreira
    htmlCarreira(s) {
        const hist = Desafios.historico(s);
        const d = Desafios.ativo(s);
        const criados = s.times.filter(t => t.criado && t.liga);
        if (!hist.length && !d && !criados.length) return '';
        const linhaH = h => { const D = DESAFIOS[h.id] || { icone: '🎯', nome: h.id }; return `<div class="dsf-hist ${h.ok ? 'ok' : 'falhou'}"><span class="dsf-hist-ic">${h.ok ? '🏅' : '❌'}</span><span><span><b>${D.icone} ${U.esc(D.nome)}</b> · ${U.esc(h.clube)} (${h.ano0}${h.ano !== h.ano0 ? `–${h.ano}` : ''})</span><small>${U.esc(h.txt)}${h.ok ? ` · +${h.rep} de reputação, ${U.dinheiro(h.premio)}` : ''}</small></span></div>`; };
        return `<div class="cartao dsf-carreira">
            <div class="cartao-topo"><h3>🎯 Desafios de carreira</h3><span class="cinza pequeno">${hist.filter(h => h.ok).length} cumprido(s)</span></div>
            ${d ? `<p>Em andamento: <b>${DESAFIOS[d.id].icone} ${U.esc(DESAFIOS[d.id].nome)}</b> com o ${U.esc(d.clube)} — ${U.esc(Desafios.nomeMeta(s, d))}.</p>` : ''}
            ${hist.length ? hist.map(linhaH).join('') : '<p class="cinza pequeno">Nenhum desafio terminado ainda.</p>'}
            ${criados.length ? `<h4>🛠️ Clubes que você fundou</h4>${criados.map(t => `<div class="dsf-hist ok"><span class="dsf-hist-ic">${UI.escudo(t)}</span><span><span><b>${U.esc(t.nome)}</b> · fundado em ${t.criado.ano}</span><small>🏟️ ${U.esc(t.criado.estadio)} · hoje na ${U.esc(Mundo.liga(s, t.liga).nome)} (${Mundo.posicaoNaLiga(s, t.id)}º)</small></span></div>`).join('')}` : ''}
        </div>`;
    },

    // 📝 Pendências (gancho em Comissao.pendencias)
    pendencias(s, t, add) {
        const d = Desafios.ativo(s);
        if (!d || d.tid !== t.id) return;
        const D = DESAFIOS[d.id];
        const pr = Desafios.progresso(s, t, d);
        if (d.id === 'reconstrucao' && s.ano === d.ano0 && d.need) {
            const fora = Desafios.vetsFora(s, t, d);
            if (fora < d.need) add(s.semana >= 30 ? 'urgente' : 'aviso', '👴', `Desafio: faltam ${d.need - fora} veterano${d.need - fora > 1 ? 's' : ''} para sair`, 'Venda, troque ou dispense jogadores com 30+ anos até o fim da temporada.', { txt: 'Elenco', aba: 'elenco' });
        }
        add(pr.risco ? 'aviso' : 'info', D.icone, `Desafio: ${U.esc(Desafios.nomeMeta(s, d))}`, pr.txt, { txt: 'Ver', aba: 'inicio', rolar: '.dsf-inicio' });
    },
};

// Os ganchos chamados por outros módulos nunca podem quebrar o jogo: um erro
// aqui vira só um aviso no console (as funções assíncronas também).
[['semana', undefined], ['registrarTemporada', undefined], ['fimTemporada', undefined], ['expectativa', 0], ['htmlInicio', ''],
    ['bannerMercado', ''], ['htmlCarreira', ''], ['pendencias', undefined], ['bloqueioCompra', ''], ['regra', null], ['semTaxa', false]].forEach(([k, padrao]) => {
    const fn = Desafios[k];
    Desafios[k] = function () {
        try {
            const r = fn.apply(Desafios, arguments);
            if (r && typeof r.then === 'function') return r.catch(e => { console.warn('desafios.' + k, e); return padrao; });
            return r;
        } catch (e) {
            console.warn('desafios.' + k, e);
            return padrao;
        }
    };
});

Object.assign(ACOES, {
    dsfAbrir() { Jogo.formTmp = Jogo.lerForm(); Desafios.tela(); },
    // volta para o formulário do técnico, com o que já estava preenchido
    dsfVoltar() {
        const f = Jogo.formTmp;
        Jogo.formNovo('tecnico');
        if (!f) return;
        const por = (id, v) => { const e = document.getElementById(id); if (e && v != null) e.value = v; };
        por('nv-nome', f.nome === 'Davi Felippe' ? '' : f.nome);
        por('nv-idade', f.idade);
        por('nv-pais', f.pais);
        por('nv-rep', f.rep);
    },
    dsfVer(d) { Desafios.ver(d.id); },
    cclAbrir() { Jogo.formTmp = Jogo.lerForm(); Desafios.telaCriar(); },
    cclCores(d) {
        const f = Desafios.form();
        Desafios.lerCriar();
        f.c1 = d.c1; f.c2 = d.c2;
        Desafios.telaCriar();
    },
    cclPerfil(d) {
        Desafios.lerCriar();
        if (PERFIS_CLUBE[d.k]) Desafios.form().perfil = d.k;
        Desafios.telaCriar();
    },
    cclFundar() { Desafios.fundar(); },
});

// a prévia do escudo acompanha o que é digitado (sem redesenhar a tela)
['input', 'change'].forEach(ev => document.addEventListener(ev, e => {
    if (e.target && e.target.closest && e.target.closest('.ccl-form')) Desafios.lerCriar();
}));
