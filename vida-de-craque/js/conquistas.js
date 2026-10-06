'use strict';
// =====================================================================
//  CONQUISTAS — objetivos que destravam ao longo da vida
// =====================================================================

const cont = (s, k) => (s.cont && s.cont[k]) || 0;
const jogU = s => (s.car && s.car.pid != null ? s.jog[s.car.pid] || null : null);
const golsCarreira = s => {
    const p = s.car && s.car.pid != null ? s.jog[s.car.pid] : null;
    return p ? p.cg + p.g : 0;
};

const CONQUISTAS = [
    // ---------------- Vida ----------------
    { id: 'milionario', icone: '💰', nome: 'Milionário', desc: 'Ter € 1 milhão na conta.', teste: s => s.pessoa.dinheiro >= 1e6 },
    { id: 'magnata', icone: '🤑', nome: 'Magnata', desc: 'Patrimônio total de € 50 milhões.', teste: s => Vida.patrimonio(s) >= 5e7 },
    { id: 'famoso', icone: '⭐', nome: 'Celebridade', desc: 'Chegar a 80% de fama.', teste: s => s.pessoa.fama >= 80 },
    { id: 'seguidores', icone: '📱', nome: 'Influencer', desc: 'Ter 1 milhão de seguidores.', teste: s => (s.pessoa.seg || 0) >= 1e6 },
    { id: 'casado', icone: '💍', nome: 'Casamento', desc: 'Se casar.', teste: s => cont(s, 'casamentos') >= 1 },
    { id: 'familia', icone: '👨‍👩‍👧‍👦', nome: 'Família grande', desc: 'Ter 3 filhos.', teste: s => s.pessoa.rel.filter(r => r.tipo === 'filho').length >= 3 },
    { id: 'pet', icone: '🐶', nome: 'Melhor amigo', desc: 'Adotar um pet.', teste: s => s.pessoa.rel.some(r => r.tipo === 'pet') },
    { id: 'colecionador', icone: '🛍️', nome: 'Colecionador', desc: 'Ter 5 bens ao mesmo tempo.', teste: s => s.pessoa.bens.length >= 5 },
    { id: 'bugatti', icone: '🏎️', nome: 'Carro dos sonhos', desc: 'Comprar um Bugatti.', teste: s => s.pessoa.bens.some(b => /Bugatti/.test(b.nome)) },
    { id: 'ilha', icone: '🏝️', nome: 'Dono de uma ilha', desc: 'Comprar uma ilha particular.', teste: s => s.pessoa.bens.some(b => /Ilha/.test(b.nome)) },
    { id: 'viajante', icone: '✈️', nome: 'Viajante', desc: 'Fazer 5 viagens.', teste: s => cont(s, 'viagens') >= 5 },
    { id: 'caridoso', icone: '🤝', nome: 'Coração de ouro', desc: 'Doar € 100 mil para caridade.', teste: s => cont(s, 'doado') >= 1e5 },
    { id: 'investidor', icone: '💹', nome: 'Empreendedor', desc: 'Abrir um negócio próprio.', teste: s => (s.pessoa.negocios || []).length >= 1 },
    { id: 'titulo1', icone: '🏆', nome: 'Primeira taça', desc: 'Ganhar o primeiro título.', teste: s => s.pessoa.trofeus.length >= 1 },
    { id: 'titulos10', icone: '👑', nome: 'Galeria cheia', desc: 'Ganhar 10 títulos.', teste: s => s.pessoa.trofeus.length >= 10 },
    { id: 'supercampeao', icone: '🛡️', nome: 'Supercampeão', desc: 'Ganhar uma supercopa (nacional, Supercopa da UEFA ou Recopa).', teste: s => cont(s, 'supercopas') >= 1 },
    { id: 'segundaCopa', icone: '🟠', nome: 'Rei das copas', desc: 'Ganhar a Liga Europa ou a Copa Sul-Americana.', teste: s => cont(s, 'secundarias') >= 1 },
    { id: 'mundialClubes', icone: '🌐', nome: 'Campeão do mundo de clubes', desc: 'Ganhar o Mundial de Clubes.', teste: s => cont(s, 'mundiais') >= 1 },
    { id: 'campeaoSelecao', icone: '🎖️', nome: 'Glória pela seleção', desc: 'Ganhar um torneio com a seleção (jogador ou técnico).', teste: s => s.pessoa.trofeus.some(t => /\(seleção\)/.test(t.txt)) || cont(s, 'titulosSelecao') >= 1 },
    { id: 'centenario', icone: '🎂', nome: 'Centenário', desc: 'Viver até os 100 anos.', teste: s => s.pessoa.idade >= 100 },

    // ---------------- Técnico ----------------
    { id: 'vitoria1', modo: 'tecnico', icone: '✅', nome: 'Primeira vitória', desc: 'Vencer o primeiro jogo como técnico.', teste: s => cont(s, 'vitorias') >= 1 },
    { id: 'vitorias100', modo: 'tecnico', icone: '💯', nome: 'Centenário de vitórias', desc: '100 vitórias como técnico.', teste: s => cont(s, 'vitorias') >= 100 },
    { id: 'goleada', modo: 'tecnico', icone: '🔥', nome: 'Atropelo', desc: 'Vencer por 5 gols de diferença.', teste: s => cont(s, 'goleadas') >= 1 },
    { id: 'invicto', modo: 'tecnico', icone: '🛡️', nome: 'Invencível', desc: '15 jogos seguidos sem perder.', teste: s => cont(s, 'maiorInvicto') >= 15 },
    { id: 'classico5', modo: 'tecnico', icone: '😈', nome: 'Rei do clássico', desc: 'Vencer 5 clássicos.', teste: s => cont(s, 'classicosVencidos') >= 5 },
    { id: 'acesso', modo: 'tecnico', icone: '⬆️', nome: 'Acesso!', desc: 'Subir de divisão.', teste: s => cont(s, 'acessos') >= 1 },
    { id: 'campeaoNacional', modo: 'tecnico', icone: '🥇', nome: 'Campeão nacional', desc: 'Ganhar uma liga de 1ª divisão.', teste: s => cont(s, 'ligasPrincipais') >= 1 },
    { id: 'copeiro', modo: 'tecnico', icone: '🏆', nome: 'Copeiro', desc: 'Ganhar uma copa nacional.', teste: s => cont(s, 'copasNacionais') >= 1 },
    { id: 'continental', modo: 'tecnico', icone: '🌍', nome: 'Dono do continente', desc: 'Ganhar a Liga dos Campeões, a Libertadores ou a Concachampions.', teste: s => cont(s, 'continentais') >= 1 },
    { id: 'triplice', modo: 'tecnico', icone: '👑', nome: 'Tríplice coroa', desc: 'Liga, copa nacional e copa continental na mesma temporada.', teste: s => cont(s, 'triplices') >= 1 },
    { id: 'tecnicoAno', modo: 'tecnico', icone: '📋', nome: 'Técnico do Ano', desc: 'Ser eleito o técnico do ano.', teste: s => cont(s, 'tecnicoAno') >= 1 },
    { id: 'demitido', modo: 'tecnico', icone: '🚪', nome: 'Faz parte', desc: 'Ser demitido.', teste: s => cont(s, 'demissoes') >= 1 },
    { id: 'rodado', modo: 'tecnico', icone: '🧳', nome: 'Rodado', desc: 'Treinar 5 clubes diferentes.', teste: s => (s.car.clubesTreinados || []).length >= 5 },
    { id: 'construtor', modo: 'tecnico', icone: '🏗️', nome: 'Construtor', desc: 'Levar uma estrutura do clube ao nível 5.', teste: s => cont(s, 'obras5') >= 1 },
    { id: 'tecnicoSelecao', modo: 'tecnico', icone: '🌎', nome: 'Professor da seleção', desc: 'Ser técnico de uma seleção.', teste: s => cont(s, 'selecoesTreinadas') >= 1 },
    { id: 'joia', modo: 'tecnico', icone: '💎', nome: 'Olho clínico', desc: 'Aprovar 3 garotos na peneira da base.', teste: s => cont(s, 'joias') >= 3 },
    { id: 'crias', modo: 'tecnico', icone: '🌱', nome: 'Cria da casa', desc: 'Subir 5 garotos da base para o profissional.', teste: s => cont(s, 'crias') >= 5 },
    { id: 'olheiro5', modo: 'tecnico', icone: '🔭', nome: 'Rede de olheiros', desc: 'Contratar um olheiro 5 estrelas.', teste: s => cont(s, 'olheiro5') >= 1 },
    { id: 'garimpo', modo: 'tecnico', icone: '⛏️', nome: 'Garimpeiro', desc: 'Levar para a base um garoto com teto 95+ achado por um olheiro.', teste: s => cont(s, 'garimpo') >= 1 },

    // ---------------- Jogador ----------------
    { id: 'estreia', modo: 'jogador', icone: '👟', nome: 'Estreia', desc: 'Jogar a primeira partida profissional.', teste: s => { const p = jogU(s); return p && p.cj + p.j >= 1; } },
    { id: 'gol1', modo: 'jogador', icone: '⚽', nome: 'Primeiro gol', desc: 'Marcar o primeiro gol da carreira.', teste: s => golsCarreira(s) >= 1 },
    { id: 'hattrick', modo: 'jogador', icone: '🎩', nome: 'Hat-trick', desc: 'Fazer 3 gols num jogo.', teste: s => cont(s, 'hattricks') >= 1 },
    { id: 'gols100', modo: 'jogador', icone: '💯', nome: 'Centenário', desc: '100 gols na carreira.', teste: s => golsCarreira(s) >= 100 },
    { id: 'gols300', modo: 'jogador', icone: '🐐', nome: 'Artilheiro histórico', desc: '300 gols na carreira.', teste: s => golsCarreira(s) >= 300 },
    { id: 'mvp10', modo: 'jogador', icone: '⭐', nome: 'Protagonista', desc: 'Ser o melhor em campo 10 vezes.', teste: s => cont(s, 'mvps') >= 10 },
    { id: 'penalti', modo: 'jogador', icone: '🧤', nome: 'Paredão', desc: 'Defender um pênalti.', teste: s => cont(s, 'penaltisDefendidos') >= 1 },
    { id: 'selecao', modo: 'jogador', icone: '🇺🇳', nome: 'Convocado', desc: 'Jogar pela seleção.', teste: s => s.car.selecao && s.car.selecao.jogos > 0 },
    { id: 'mundial', modo: 'jogador', icone: '🌎', nome: 'Campeão do mundo', desc: 'Ganhar a Copa do Mundo.', teste: s => s.pessoa.trofeus.some(t => /Copa do Mundo/.test(t.txt)) },
    { id: 'bola', modo: 'jogador', icone: '🏅', nome: 'O melhor do mundo', desc: 'Ganhar a Bola de Ouro.', teste: s => s.pessoa.trofeus.some(t => t.txt === 'Bola de Ouro') },
    { id: 'ovr85', modo: 'jogador', icone: '💪', nome: 'Craque', desc: 'Chegar a 85 de habilidade.', teste: s => { const p = jogU(s); return p && p.ovr >= 85; } },
    { id: 'ovr90', modo: 'jogador', icone: '🌟', nome: 'Lenda viva', desc: 'Chegar a 90 de habilidade.', teste: s => { const p = jogU(s); return p && p.ovr >= 90; } },
    { id: 'transfer50', modo: 'jogador', icone: '💸', nome: 'Negócio milionário', desc: 'Ser vendido por € 50 milhões ou mais.', teste: s => cont(s, 'maiorVenda') >= 5e7 },
    { id: 'habilidades', modo: 'jogador', icone: '⚡', nome: 'Jogador completo', desc: 'Ter 5 habilidades especiais.', teste: s => (s.car.habs || []).length >= 5 },
];

// Peso de cada tipo de taça: fama, felicidade e reputação do técnico
const PESO_TACA = {
    nacional: { fama: 6, fel: 18, rep: 6, cont: 'copasNacionais' },
    supercopa: { fama: 4, fel: 10, rep: 3, cont: 'supercopas' },
    secundaria: { fama: 8, fel: 20, rep: 9, cont: 'secundarias' },
    continental: { fama: 12, fel: 25, rep: 15, cont: 'continentais' },
    mundial: { fama: 15, fel: 25, rep: 12, cont: 'mundiais' },
};

const Conquistas = {
    tipoCopa: c => c.tipo || (c.pais ? 'nacional' : 'continental'),

    // registra uma taça de copa (os dois modos): devolve o peso dela
    tituloCopa(s, c) {
        const peso = PESO_TACA[Conquistas.tipoCopa(c)] || PESO_TACA.nacional;
        Conquistas.contar(s, peso.cont);
        return peso;
    },

    contar(s, chave, n = 1) {
        s.cont = s.cont || {};
        s.cont[chave] = (s.cont[chave] || 0) + n;
    },

    maximo(s, chave, valor) {
        s.cont = s.cont || {};
        s.cont[chave] = Math.max(s.cont[chave] || 0, valor);
    },

    disponiveis(s) {
        // conquistas do modo atual + as da carreira de jogador, se a pessoa já foi jogador
        return CONQUISTAS.filter(c => !c.modo || c.modo === s.modo || (c.modo === 'jogador' && s.car && s.car.pid != null));
    },

    verificar(s) {
        if (!s || !s.pessoa) return;
        s.conq = s.conq || {};
        for (const c of Conquistas.disponiveis(s)) {
            if (s.conq[c.id]) continue;
            let ok = false;
            try { ok = c.teste(s); } catch (e) { ok = false; }
            if (ok) Conquistas.desbloquear(s, c);
        }
    },

    desbloquear(s, c) {
        s.conq[c.id] = { ano: s.ano, idade: s.pessoa.idade };
        Vida.log(s, `🏅 Conquista desbloqueada: ${c.icone} ${c.nome}!`, 'titulo');
        UI.conquista(c);
    },

    tela(s) {
        s.conq = s.conq || {};
        const lista = CONQUISTAS;
        const feitas = lista.filter(c => s.conq[c.id]).length;
        const grupo = (titulo, itens) => `<h4>${titulo}</h4><div class="grade-conquistas">${itens.map(c => {
            const ok = s.conq[c.id];
            return `<div class="conquista ${ok ? 'ok' : ''}"><span class="cq-icone">${ok ? c.icone : '🔒'}</span><div><b>${c.nome}</b><small>${c.desc}</small>${ok ? `<small class="cq-quando">✔ ${ok.ano} · ${ok.idade} anos</small>` : ''}</div></div>`;
        }).join('')}</div>`;
        return `<div class="cartao">
            <div class="cartao-topo"><h3>🏅 Conquistas</h3><b>${feitas}/${lista.length}</b></div>
            <div class="stat-fundo"><div class="stat-preenche azul" style="width:${Math.round(feitas / lista.length * 100)}%"></div></div>
            ${grupo('❤️ Vida', lista.filter(c => !c.modo))}
            ${grupo('📋 Técnico', lista.filter(c => c.modo === 'tecnico'))}
            ${grupo('⚽ Jogador', lista.filter(c => c.modo === 'jogador'))}
        </div>`;
    },
};
