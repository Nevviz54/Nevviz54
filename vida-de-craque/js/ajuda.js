'use strict';
// =====================================================================
//  NAVEGAÇÃO: abas agrupadas por assunto + ajuda de cada aba
//  A ajuda aparece sozinha só na primeira vez que a aba é aberta;
//  depois, o botão ❓ (ao lado das abas) mostra de novo.
// =====================================================================

// grupos (primeira linha da navegação); cada aba diz o seu em { grupo }
const GRUPOS_ABAS = {
    inicio: { nome: 'Início', icone: '🏠' },
    clube: { nome: 'Clube', icone: '🏟️' },
    time: { nome: 'Time', icone: '👥' },
    carreira: { nome: 'Carreira', icone: '⚽' },
    futebol: { nome: 'Futebol', icone: '🌍' },
    vida: { nome: 'Vida', icone: '❤️' },
    voce: { nome: 'Você', icone: '🙋' },
};

// textos de ajuda: [modo][aba] → { titulo, intro, itens }. Pode ser função (s) => {...}
const AJUDA_COMUM = {
    tabelas: { titulo: '📊 Campeonatos', intro: 'Classificação das ligas, rodadas, artilharia e as chaves das copas de todos os países do jogo.',
        itens: ['Troque a liga ou a copa nos seletores do alto da tela.', 'As cores da tabela mostram quem sobe, quem cai e quem vai para as copas.', 'Clique no nome de um time para ver o elenco dele.'] },
    noticias: { titulo: '📰 Notícias', intro: 'Tudo o que acontece no mundo do futebol: transferências, resultados, demissões, prêmios e o que a imprensa fala de você.',
        itens: ['As notícias mais novas ficam no alto.'] },
    mundo: { titulo: '🌟 Prêmios e craques', intro: 'Os melhores jogadores do mundo agora, a Bola de Ouro e os outros prêmios do ano, e as joias com até 21 anos.',
        itens: ['Bom lugar para achar reforços: clique no nome de um jogador para ver a ficha dele.'] },
    vida: { titulo: '❤️ Vida pessoal', intro: 'Sua vida fora do futebol, como no BitLife: atividades da semana, família e namoro, bens, investimentos e o diário.',
        itens: [`🎯 Atividades: até ${typeof Vida !== 'undefined' ? Vida.MAX_ACOES : 3} por semana. Mexem com felicidade, saúde, fama e dinheiro.`,
            '❤️ Relacionamentos: converse, dê presentes, namore, case e tenha filhos.',
            '🏠 Bens e 💹 Investimentos: carros, casas, aplicações e negócios próprios que rendem toda semana.',
            '🔁 Automático: as escolhas que você mandou o jogo lembrar (os eventos repetidos se resolvem sozinhos).'] },
    conquistas: { titulo: '🏅 Conquistas', intro: 'As conquistas que você já desbloqueou e as que ainda faltam.',
        itens: ['Cada conquista tem um objetivo (gols, títulos, vida pessoal...). Elas ficam guardadas mesmo se você começar outra carreira.'] },
    selecao: { titulo: '🌎 Seleção', intro: 'As seleções nacionais: convocados, últimos jogos e as competições de seleções.',
        itens: ['Com boa reputação, uma seleção pode te convidar para ser o técnico dela, junto com o clube.', 'Como técnico da seleção você escolhe os convocados, a formação e o estilo.'] },
};

const AJUDA_ABAS = {
    tecnico: Object.assign({}, AJUDA_COMUM, {
        inicio: s => s.car.tid < 0
            ? { titulo: '🏠 Início', intro: 'Você está sem clube. Aqui aparecem as propostas de emprego.',
                itens: ['Avance as semanas (botão ▶ no rodapé) para receber propostas.', 'Sua reputação define o tamanho dos clubes que te chamam.'] }
            : { titulo: '🏠 Resumo do clube', intro: 'A tela principal do seu clube: o que precisa da sua atenção, próximos jogos, últimos resultados, diretoria, caixa e a tabela.',
                itens: ['📝 Pendências: a lista do que precisa de você (contratos vencendo, jogadores desmotivados, lesões...). O botão de cada item leva direto para a aba certa.',
                    '👔 Diretoria: a confiança no seu trabalho. Abaixo de 30%, cuidado: você pode ser demitido.',
                    '📨 Propostas de outros clubes aparecem no alto desta tela.',
                    '▶ Avançar semana (rodapé) passa o tempo e joga as partidas. ⏩ 4 semanas simula direto.'] },
        calendario: { titulo: '📅 Calendário', intro: 'Todos os jogos do seu time na temporada, em todas as competições. A linha destacada é o jogo desta semana.',
            itens: ['O jogo acontece quando você avança a semana: abre a tela da partida, onde dá para mexer no time ao vivo.', 'Quer ir mais rápido? Em ⚙️ → Opções você pode simular os seus jogos direto.'] },
        clima: { titulo: '🎙️ Bastidores', intro: 'O que acontece fora de campo: torcida e preço do ingresso, objetivos da diretoria, técnicos rivais, coletivas, pré-temporada e o último dia da janela.',
            itens: ['🎟️ Ingresso barato enche o estádio e agrada a torcida; caro dá mais dinheiro, mas irrita.', '🎯 Cumprir os objetivos da diretoria aumenta a confiança no seu trabalho.', '👔 Veja o histórico contra cada técnico rival.'] },
        financas: { titulo: '💰 Finanças', intro: 'O dinheiro do clube: caixa, receita por semana, folha salarial e os maiores salários.',
            itens: ['Caixa negativo faz a diretoria perder a confiança toda semana.', 'Vender jogadores, ir bem nas copas e encher o estádio traz dinheiro. Salários altos e obras custam caro.'] },
        estrutura: { titulo: '🏗️ Estrutura', intro: 'As obras do clube: estádio, centro de treinamento e categoria de base.',
            itens: ['🏟️ Estádio: mais torcida e renda. 🏋️ CT: os jogadores evoluem mais rápido. 🌱 Base: garotos melhores.', 'Uma obra por vez, leva 6 semanas e o efeito é para sempre.'] },
        elenco: { titulo: '👥 Elenco', intro: 'Todos os seus jogadores: posição, idade, habilidade (OVR), potencial, motivação, forma física, números, contrato e salário.',
            itens: ['Clique no nome de um jogador para renovar, colocar à venda, emprestar ou dispensar.', '✍️ Renovação em lote: renove vários contratos de uma vez.', 'Linha destacada = titular · 🚑 lesionado · 🟥 suspenso · 🏷️ à venda.'] },
        tatica: { titulo: '📋 Tática', intro: 'Monte o time: formação, estilo de jogo, titulares, treino da semana e capitão.',
            itens: ['🔀 Trocar de posição: arraste um jogador do campo para cima de outro (ou toque num e depois no outro).',
                '🔁 Colocar um reserva: arraste da lista para o campo (ou toque na posição e depois no jogador da lista).',
                '✏️ Mover posições: arraste a bolinha para qualquer lugar do campo e crie a sua formação personalizada.',
                'Número vermelho = jogador fora da posição de origem (rende menos).',
                '🤖 Escalar automático: o time é montado sozinho antes de cada jogo (melhores, mais motivados ou rodízio).'] },
        vestiario: { titulo: '💬 Vestiário', intro: 'A motivação dos jogadores e as suas conversas com eles.',
            itens: ['Jogador motivado rende mais em campo; desmotivado rende menos e pode pedir para sair.', '💬 Uma conversa por jogador por semana. 📣 Conversar com todo o grupo fala com todo mundo de uma vez.', '🤝 Promessas (dar minutos, ser titular) precisam ser cumpridas no prazo.'] },
        comissao: { titulo: '🧑‍💼 Comissão técnica', intro: 'Seus profissionais: auxiliar técnico, preparador físico, médico e analista de desempenho.',
            itens: ['🧑‍💼 O auxiliar pode cuidar do treino, do vestiário, das renovações e da base por você, e dá sugestões no intervalo dos jogos.',
                '💪 Preparador: menos lesões · 🩺 Médico: lesões mais curtas · 📊 Analista: estuda o adversário.', 'Mais estrelas = melhor trabalho (e salário maior).'] },
        base: { titulo: '🌱 Base', intro: 'As categorias de base do clube: os garotos, os olheiros e as promoções para o time principal.',
            itens: ['🔭 Mande olheiros procurarem talentos em outros países e decida quem entra na base.', '⬆️ Suba para o profissional quem estiver pronto antes da idade limite.'] },
        mercado: { titulo: '💸 Mercado', intro: 'Compre e contrate jogadores. Filtre por posição, liga, habilidade, idade e preço, ou procure pelo nome.',
            itens: ['Com a janela fechada só dá para contratar jogadores sem clube.', 'Na proposta dá para oferecer empréstimo, troca ou percentual de revenda.'] },
        carreira: { titulo: '🏆 Minha carreira', intro: 'Sua carreira de técnico: reputação, títulos, histórico de temporadas e os desafios de carreira.',
            itens: ['A reputação sobe com bons resultados e define quais clubes te querem.', '🎯 Desafios de carreira: metas especiais (e você pode até fundar o seu clube).'] },
    }),
    jogador: Object.assign({}, AJUDA_COMUM, {
        inicio: { titulo: '🏠 Resumo', intro: 'Seu resumo: posição, habilidade, clube, forma física, os números da temporada e a sua história.',
            itens: ['Os atalhos levam direto para o Treino, a Vida pessoal e o Contrato.', '▶ Avançar semana (rodapé) passa o tempo e joga as partidas. ⏩ 4 semanas simula direto.'] },
        carreira: { titulo: '📄 Contrato e carreira', intro: 'Contrato, metas da temporada, rival, empresário, seleção, número da camisa, comemoração e o histórico.',
            itens: ['Peça mais chances ao técnico, aumento ou para ser negociado.', 'Propostas de outros clubes chegam nas janelas de transferência.', 'Escolha o número da camisa e a comemoração de gol.'] },
        treino: { titulo: '🏋️ Treino', intro: 'Escolha o treino da semana e acompanhe a sua evolução.',
            itens: ['Treino mais puxado = evolui mais rápido, mas cansa e pode machucar.', '⚡ Use os pontos de habilidade para liberar habilidades especiais.', '🤖 Treino automático: escolhe sozinho conforme a sua forma física.'] },
        clube: { titulo: '🏟️ Meu clube', intro: 'Seu time: companheiros de elenco, a tabela do campeonato e os jogos.',
            itens: ['Veja quem disputa posição com você e quando é o próximo jogo.'] },
    }),
};

const Ajuda = {
    // grupos na ordem em que aparecem nas abas
    grupos(abas) {
        const ids = [];
        for (const a of abas) if (!ids.includes(a.grupo)) ids.push(a.grupo);
        return ids.map(id => Object.assign({ id }, GRUPOS_ABAS[id] || { nome: id, icone: '•' }));
    },

    // as duas linhas da navegação (grupos e abas do grupo)
    nav(s, abas, atual) {
        const aba = abas.find(a => a.id === atual) || abas[0];
        const grupos = Ajuda.grupos(abas);
        const doGrupo = abas.filter(a => a.grupo === aba.grupo);
        Jogo.ui.abaGrupo = Jogo.ui.abaGrupo || {};
        Jogo.ui.abaGrupo[aba.grupo] = aba.id;   // volta na mesma aba quando abrir o grupo de novo
        return `<div class="navegacao">
            <nav class="abas-grupos">${grupos.map(g => `<button class="aba-grupo ${g.id === aba.grupo ? 'ativa' : ''}" data-acao="abaGrupo" data-g="${g.id}">${g.icone}<span>${g.nome}</span></button>`).join('')}</nav>
            <nav class="abas">${doGrupo.map(a => `<button class="aba ${a.id === aba.id ? 'ativa' : ''}" data-acao="aba" data-aba="${a.id}" title="${U.esc(a.desc || '')}">${a.icone}<span>${a.nome}</span></button>`).join('')}
                <span class="aba-desc">${U.esc(aba.desc || '')}</span>
                ${Ajuda.texto(s, aba.id) ? '<button class="aba-ajuda" data-acao="abaAjuda" title="Como funciona esta aba">❓</button>' : ''}</nav>
        </div>`;
    },

    texto(s, id) {
        const t = (AJUDA_ABAS[s.modo] || {})[id];
        return typeof t === 'function' ? t(s) : t || null;
    },

    chave: (s, id) => `${s.modo}:${id}`,

    vista(s, id) {
        const v = Jogo.opcoes.ajudaVista || {};
        return !!v[Ajuda.chave(s, id)];
    },

    marcar(s, id) {
        Jogo.opcoes.ajudaVista = Object.assign({}, Jogo.opcoes.ajudaVista, { [Ajuda.chave(s, id)]: 1 });
        Salvar.gravarOpcoes(Jogo.opcoes);
    },

    // chamada no fim de cada Jogo.atualizar(): primeira visita → mostra a ajuda
    // assim que não houver outra coisa na tela (cena, aviso, semana avançando)
    talvez() {
        Ajuda.mostrarAbaAtiva();
        const s = Jogo.s;
        if (!s || Jogo.opcoes.dicasAbas === false) return;
        const id = Jogo.aba;
        if (Ajuda.vista(s, id) || !Ajuda.texto(s, id) || Ajuda.esperando === id) return;
        Ajuda.esperando = id;
        let tentativas = 0;
        const checar = () => {
            const fim = () => { if (Ajuda.esperando === id) Ajuda.esperando = null; };
            if (Jogo.s !== s || Jogo.aba !== id || Ajuda.vista(s, id) || Jogo.opcoes.dicasAbas === false) return fim();
            const ocupada = Jogo.ocupado || (typeof Cena !== 'undefined' && Cena.ativa) || TelaPartida.ativo()
                || document.querySelector('#modais .modal-fundo') || document.getElementById('overlay').innerHTML || !document.querySelector('.shell');
            if (ocupada) {
                if (++tentativas < 120) setTimeout(checar, 700);
                else fim();
                return;
            }
            fim();
            Ajuda.mostrar(s, id, true);
        };
        setTimeout(checar, 350);
    },

    // celular: a linha de abas rola para o lado; deixa a aba aberta à vista
    mostrarAbaAtiva() {
        const nav = document.querySelector('.navegacao .abas'), at = nav && nav.querySelector('.aba.ativa');
        if (!at || nav.scrollWidth <= nav.clientWidth) return;
        const esq = at.offsetLeft - nav.offsetLeft, dir = esq + at.offsetWidth;
        if (esq < nav.scrollLeft) nav.scrollLeft = Math.max(0, esq - 24);
        else if (dir > nav.scrollLeft + nav.clientWidth - 40) nav.scrollLeft = dir - nav.clientWidth + 48;
    },

    async mostrar(s, id, primeira) {
        const t = Ajuda.texto(s, id);
        if (!t) return;
        Ajuda.marcar(s, id);
        let parar = false;
        await UI.modal({
            titulo: `<span class="modal-icone">💡</span>${t.titulo}`,
            html: `<div class="ajuda-aba">
                <p class="ajuda-intro">${t.intro}</p>
                ${t.itens && t.itens.length ? `<ul class="ajuda-itens">${t.itens.map(i => `<li>${i}</li>`).join('')}</ul>` : ''}
                ${primeira ? `<p class="cinza pequeno">Esta explicação aparece só na primeira vez. Para ver de novo, toque no ❓ ao lado das abas.</p>
                <label class="check ajuda-check"><input type="checkbox" id="ajuda-parar"> Não mostrar mais explicações das abas</label>` : ''}
            </div>`,
            botoes: [{ txt: 'Entendi 👍', valor: true, antes: f => { const c = f.querySelector('#ajuda-parar'); parar = !!(c && c.checked); } }],
            classe: 'modal-ajuda',
        });
        if (parar) {
            Jogo.opcoes.dicasAbas = false;
            Salvar.gravarOpcoes(Jogo.opcoes);
            UI.toast('💡 Explicações das abas desligadas. Dá para religar em ⚙️ → Opções.');
        }
    },

    // opções: ligar/desligar e mostrar todas de novo
    resetar() {
        Jogo.opcoes.ajudaVista = {};
        Jogo.opcoes.dicasAbas = true;
        Salvar.gravarOpcoes(Jogo.opcoes);
    },
};

Object.assign(ACOES, {
    abaGrupo(d) {
        const s = Jogo.s;
        if (!s) return;
        const abas = Jogo.modo().abas(s);
        const lembrada = (Jogo.ui.abaGrupo || {})[d.g];
        const alvo = abas.find(a => a.id === lembrada && a.grupo === d.g) || abas.find(a => a.grupo === d.g);
        if (alvo) ACOES.aba({ aba: alvo.id });
    },
    abaAjuda() {
        if (Jogo.s) Ajuda.mostrar(Jogo.s, Jogo.aba, false);
    },
    opDicasAbas(d, el) {
        Jogo.opcoes.dicasAbas = el.checked;
        Salvar.gravarOpcoes(Jogo.opcoes);
    },
    opDicasRever() {
        Ajuda.resetar();
        UI.toast('💡 As explicações vão aparecer de novo na primeira visita de cada aba.');
        const c = document.querySelector('[data-mudar="opDicasAbas"]');
        if (c) c.checked = true;
    },
});
