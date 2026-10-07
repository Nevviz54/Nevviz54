'use strict';
// =====================================================================
//  CONTROLADOR PRINCIPAL: menus, opções, pausa, avanço do tempo
// =====================================================================

const RESOLUCOES = [
    ['auto', 'Ajustar à janela (recomendado)'],
    ['1024x768', '1024 × 768'],
    ['1280x720', '1280 × 720 (HD)'],
    ['1366x768', '1366 × 768'],
    ['1600x900', '1600 × 900'],
    ['1920x1080', '1920 × 1080 (Full HD)'],
    ['2560x1440', '2560 × 1440 (2K)'],
];

const ANO_INICIAL = 2026;

const Jogo = {
    s: null,
    opcoes: Salvar.lerOpcoes(),
    aba: 'inicio',
    ui: { liga: null, rodada: null, subVida: 'atividades', subTab: 'tabela', filtro: {} },
    ocupado: false,

    modo() {
        return this.s && this.s.modo === 'tecnico' ? Tecnico : Jogador;
    },

    async iniciar(retomar = {}) {
        this.aplicarOpcoes();
        // o armazenamento nunca pode prender o jogo na tela de carregamento:
        // se demorar, o menu abre e os saves aparecem quando ele responder
        try {
            await Promise.race([Salvar.iniciar(), new Promise(r => setTimeout(r, 6000))]);
        } catch (e) { console.warn('saves indisponíveis', e); }
        Salvar.aoMudar = () => this.atualizarSaves();
        window.addEventListener('resize', () => this.aplicarOpcoes());
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape') {
                if (Cena.ativa) return;
                if (document.querySelector('#modais .modal-fundo')) return;
                if (!this.s) return;
                if (document.getElementById('overlay').innerHTML) this.fecharPausa();
                else this.abrirPausa();
            }
        });
        this.menu();
        window.__vdcOk = true;
        Jogo.carregarFontes();
        if (retomar.continuar && Salvar.ultimo()) ACOES.menuContinuar();
    },

    // As fontes do Google entram depois que o jogo já abriu: assim uma rede
    // lenta ou bloqueada nunca segura o carregamento (sem elas, fonte do sistema).
    carregarFontes() {
        if (document.querySelector('link[data-fontes]')) return;
        const l = document.createElement('link');
        l.rel = 'stylesheet';
        l.href = 'https://fonts.googleapis.com/css2?family=Oswald:wght@500;700&family=Inter:wght@400;600;800&display=swap';
        l.setAttribute('data-fontes', '1');
        document.head.appendChild(l);
    },

    // -----------------------------------------------------------------
    //  Opções: resolução, escala, tema
    // -----------------------------------------------------------------
    aplicarOpcoes() {
        const o = this.opcoes;
        const el = document.getElementById('jogo');
        document.documentElement.style.setProperty('--escala', o.escala / 100);
        document.body.dataset.tema = o.tema;
        document.body.classList.toggle('sem-anim', o.animacoes === false);
        if (o.resolucao === 'auto') {
            Object.assign(el.style, { width: '', height: '', transform: 'none', left: '', top: '' });
            document.body.classList.remove('res-fixa');
        } else {
            const [w, h] = o.resolucao.split('x').map(Number);
            const k = Math.min(window.innerWidth / w, window.innerHeight / h);
            Object.assign(el.style, {
                width: w + 'px', height: h + 'px', transform: `scale(${k})`,
                left: Math.max(0, (window.innerWidth - w * k) / 2) + 'px', top: Math.max(0, (window.innerHeight - h * k) / 2) + 'px',
            });
            document.body.classList.add('res-fixa');
        }
    },

    telaCheia() {
        // navegadores antigos (Safari) só têm as versões com prefixo webkit
        const el = document.documentElement;
        if (!(document.fullscreenElement || document.webkitFullscreenElement)) {
            const pedir = el.requestFullscreen || el.webkitRequestFullscreen;
            const r = pedir ? pedir.call(el) : null;
            if (!pedir) UI.toast('Seu navegador não tem tela cheia.', 'erro');
            else if (r && r.catch) r.catch(() => UI.toast('Seu navegador bloqueou a tela cheia.', 'erro'));
        } else {
            const sair = document.exitFullscreen || document.webkitExitFullscreen;
            if (sair) sair.call(document);
        }
    },

    htmlOpcoes() {
        const o = this.opcoes;
        return `
        <div class="form-opcoes">
            <label class="campo">🖥️ Resolução
                <select class="sel" data-mudar="opResolucao">${RESOLUCOES.map(([v, n]) => `<option value="${v}" ${o.resolucao === v ? 'selected' : ''}>${n}</option>`).join('')}</select>
            </label>
            <div class="campo">⛶ Tela cheia <button class="btn btn-pequeno" data-acao="opTelaCheia">${document.fullscreenElement || document.webkitFullscreenElement ? 'Sair da tela cheia' : 'Entrar em tela cheia'}</button></div>
            <label class="campo">🔠 Tamanho da interface: <b id="op-escala-v">${o.escala}%</b>
                <input type="range" min="70" max="150" step="5" value="${o.escala}" data-mudar="opEscala" oninput="document.getElementById('op-escala-v').textContent=this.value+'%'">
            </label>
            <label class="campo">⏱️ Velocidade das partidas
                <select class="sel" data-mudar="opVelocidade">${[1, 2, 3, 4].map(v => `<option value="${v}" ${o.velocidade === v ? 'selected' : ''}>${['', 'Lenta (1x)', 'Normal (2x)', 'Rápida (4x)', 'Turbo (8x)'][v]}</option>`).join('')}</select>
            </label>
            <label class="campo">🎨 Tema
                <select class="sel" data-mudar="opTema"><option value="escuro" ${o.tema === 'escuro' ? 'selected' : ''}>Escuro</option><option value="claro" ${o.tema === 'claro' ? 'selected' : ''}>Claro</option></select>
            </label>
            <label class="campo check"><input type="checkbox" data-mudar="opSom" ${o.som !== false ? 'checked' : ''}> 🔊 Efeitos sonoros</label>
            <label class="campo">🔉 Volume: <b id="op-vol-v">${o.volume != null ? o.volume : 60}%</b>
                <input type="range" min="0" max="100" step="5" value="${o.volume != null ? o.volume : 60}" data-mudar="opVolume" oninput="document.getElementById('op-vol-v').textContent=this.value+'%'">
            </label>
            <label class="campo check"><input type="checkbox" data-mudar="opCenas" ${o.cenas !== false ? 'checked' : ''}> 🎬 Cutscenes (novo clube, títulos, fim de temporada...)</label>
            <label class="campo check"><input type="checkbox" data-mudar="opAnim" ${o.animacoes !== false ? 'checked' : ''}> ✨ Animações (cliques, gols, transições)</label>
            <label class="campo check"><input type="checkbox" data-mudar="opAutosave" ${o.autosave ? 'checked' : ''}> 💾 Salvamento automático toda semana</label>
        </div>`;
    },

    gravarOpcoes() {
        Salvar.gravarOpcoes(this.opcoes);
        this.aplicarOpcoes();
    },

    // -----------------------------------------------------------------
    //  Menu principal
    // -----------------------------------------------------------------
    menu() {
        this.s = null;
        this.fecharPausa();
        const ult = Salvar.ultimo();
        const meta = ult ? Salvar.metaDe(ult) : null;
        UI.render(`
        <div class="tela-menu">
            <div class="menu-fundo"></div>
            <div class="menu-painel">
                <div class="menu-bola">⚽</div>
                <h1 class="menu-titulo">VIDA DE <span>CRAQUE</span></h1>
                <p class="menu-sub">Futebol Manager × Simulador de Vida</p>
                <div class="menu-botoes">
                    ${meta ? `<button class="btn btn-primario btn-grande" data-acao="menuContinuar">▶ Continuar<small>${U.esc(meta.nome)} · ${U.esc(meta.clube)} · ${meta.ano}</small></button>` : ''}
                    <button class="btn btn-grande ${meta ? '' : 'btn-primario'}" data-acao="menuNovo">✨ Novo jogo</button>
                    <button class="btn btn-grande" data-acao="menuCarregar">📂 Carregar jogo</button>
                    <button class="btn btn-grande" data-acao="menuOpcoes">⚙️ Opções</button>
                    <button class="btn btn-grande" data-acao="menuAjuda">📖 Como jogar</button>
                </div>
                ${Salvar.onde() === 'memoria' ? `<div class="aviso-save">${this.textoOndeSalva()}</div>` : ''}
                ${Salvar.onde() === 'nuvem' ? '<p class="menu-nuvem">☁️ Saves na nuvem da sua conta</p>' : ''}
                <p class="menu-rodape">D.F.B.G PRODUCTIONS · ${DADOS.paises.reduce((t, p) => t + p.ligas.length, 0)} ligas · ${DADOS.paises.reduce((t, p) => t + p.ligas.reduce((u, l) => u + l.times.length, 0), 0)} clubes</p>
            </div>
        </div>`);
    },

    telaSimples(titulo, html, voltar = 'menuVoltar') {
        UI.render(`
        <div class="tela-menu">
            <div class="menu-fundo"></div>
            <div class="menu-painel menu-largo">
                <h2 class="secao-titulo">${titulo}</h2>
                ${html}
                <div class="linha-botoes"><button class="btn btn-fantasma" data-acao="${voltar}">← Voltar</button></div>
            </div>
        </div>`);
    },

    telaSaves(modoSalvar) {
        const slots = Salvar.listar();
        const html = `
        <div class="lista-saves">${slots.map(({ slot, meta }) => `
            <div class="save ${meta ? '' : 'vazio'}">
                <div class="save-info">
                    <b>${Salvar.nomeSlot(slot)}</b>
                    ${meta ? `<span>${meta.modo === 'tecnico' ? '📋 Técnico' : '⚽ Jogador'} · ${U.esc(meta.nome)} (${meta.idade} anos)${meta.morto ? ' ⚰️' : ''}</span>
                        <span>${U.esc(meta.clube)} · Temporada ${meta.ano}, semana ${meta.semana + 1}</span>
                        <small>Salvo em ${new Date(meta.data).toLocaleString('pt-BR')}</small>` : '<span class="cinza">Vazio</span>'}
                </div>
                <div class="save-acoes">
                    ${modoSalvar && slot !== 'auto' ? `<button class="btn btn-primario btn-pequeno" data-acao="saveSalvar" data-slot="${slot}">💾 Salvar aqui</button>` : ''}
                    ${meta ? `<button class="btn btn-pequeno ${modoSalvar ? '' : 'btn-primario'}" data-acao="saveCarregar" data-slot="${slot}">📂 Carregar</button>
                        <button class="btn btn-pequeno btn-perigo" data-acao="saveApagar" data-slot="${slot}" data-salvar="${modoSalvar ? 1 : 0}">🗑️</button>` : ''}
                </div>
            </div>`).join('')}
        </div>
        <div class="linha-botoes">
            ${modoSalvar ? '<button class="btn" data-acao="saveExportar">📤 Exportar (arquivo ou código)</button>' : ''}
            <button class="btn" data-acao="saveImportar">📥 Importar (arquivo ou código)</button>
        </div>
        <div class="${Salvar.onde() === 'memoria' ? 'aviso-save' : 'cinza pequeno'}">${this.textoOndeSalva()}</div>`;
        return html;
    },

    textoOndeSalva() {
        const onde = Salvar.onde();
        if (onde === 'nuvem') return '☁️ Seus jogos ficam salvos na nuvem (na sua conta Claude) e também neste aparelho: dá para continuar no celular ou no PC. Use "Exportar" para guardar uma cópia extra.';
        if (onde === 'navegador') return '💾 Os jogos ficam salvos neste navegador. Use "Exportar" para guardar uma cópia ou levar para outro aparelho.';
        return '⚠️ <b>Este visualizador está bloqueando o salvamento</b> — os saves só duram até você fechar a página. '
            + 'Para não perder nada, use <b>📤 Exportar</b> (baixar arquivo ou copiar o código) e depois <b>📥 Importar</b>. '
            + 'Ou abra o jogo pelo link online ou direto no navegador (Chrome, Edge, Safari) em vez do visualizador de arquivos.';
    },

    // redesenha a tela que mostra saves quando a lista muda (ex.: a nuvem conectou)
    atualizarSaves() {
        if (document.querySelector('#overlay .lista-saves')) return this.abrirPausa(this.subPausa);
        if (document.querySelector('#app .lista-saves')) return ACOES.menuCarregar();
        if (!this.s && document.querySelector('#app .menu-titulo')) this.menu();
    },

    // Exportar: baixar arquivo, compartilhar (celular) ou copiar o código do save
    async telaExportar() {
        const s = this.s;
        if (!s) return;
        if (TelaPartida.ativo()) return UI.toast('Termine a partida antes de exportar.', 'erro');
        const dados = await Salvar.codificar(s);
        const nome = Salvar.nomeArquivo(s);
        const promessa = UI.modal({
            titulo: '📤 Exportar jogo',
            largo: true,
            html: `<p>Guarde uma cópia do seu jogo (${Math.max(1, Math.round(dados.length / 1024))} KB). Escolha um jeito:</p>
                <div class="exp-opcoes">
                    <button class="btn btn-primario" data-exp="baixar">💾 Baixar arquivo</button>
                    ${Salvar.podeCompartilhar() ? '<button class="btn" data-exp="compartilhar">📤 Compartilhar / salvar no celular</button>' : ''}
                    <button class="btn" data-exp="copiar">📋 Copiar código do save</button>
                </div>
                <p class="exp-status"></p>
                <textarea class="codigo-save" readonly hidden></textarea>
                <p class="cinza pequeno">Para continuar depois: <b>Carregar jogo → 📥 Importar</b> e escolha o arquivo ou cole o código.
                ${Salvar.onde() === 'memoria' ? '<br>⚠️ Neste visualizador o download pode ser bloqueado. Se nenhum arquivo aparecer, use <b>Copiar código</b> e cole num bloco de notas, e-mail ou WhatsApp.' : ''}</p>`,
            botoes: [{ txt: 'Fechar', classe: 'btn-fantasma' }],
        });
        const raiz = document.querySelector('#modais .modal-fundo:last-child');
        const status = raiz.querySelector('.exp-status');
        const area = raiz.querySelector('.codigo-save');
        raiz.addEventListener('click', async e => {
            const b = e.target.closest('[data-exp]');
            if (!b) return;
            if (b.dataset.exp === 'baixar') {
                const r = await Salvar.baixar(nome, dados);
                status.textContent = r.ok ? `✅ Arquivo "${nome}" enviado para os downloads.${r.incerto ? ' Se ele não aparecer, use "Copiar código".' : ''}` : '⚠️ ' + r.erro + '.';
            } else if (b.dataset.exp === 'compartilhar') {
                const r = await Salvar.compartilhar(nome, dados);
                status.textContent = r.ok ? '✅ Save compartilhado!' : '⚠️ ' + r.erro + '. Tente "Copiar código".';
            } else {
                area.hidden = false;
                area.value = dados;
                const ok = await Salvar.copiar(dados, area);
                status.textContent = ok ? '✅ Código copiado! Cole num lugar seguro (bloco de notas, e-mail, WhatsApp...).'
                    : '👇 Selecione todo o texto abaixo e copie (Ctrl+A e Ctrl+C, ou segure o dedo e "Copiar").';
                if (!ok) { area.focus(); area.select(); }
            }
        });
        await promessa;
    },

    // Importar: escolher o arquivo exportado ou colar o código
    async telaImportar() {
        let raiz = null;
        const promessa = UI.modal({
            titulo: '📥 Importar jogo',
            largo: true,
            html: `<p>Abra um save que você exportou antes:</p>
                <div class="exp-opcoes"><button class="btn btn-primario" data-imp="arquivo">📂 Escolher arquivo</button></div>
                <input type="file" class="imp-arquivo" hidden>
                <p>…ou cole aqui o código do save:</p>
                <textarea class="codigo-save" placeholder="Cole o código aqui (ele começa com G...)"></textarea>
                <p class="exp-status"></p>`,
            botoes: [
                { txt: '📥 Carregar código', antes: () => { abrir(raiz.querySelector('.codigo-save').value, 'o código'); return false; } },
                { txt: 'Cancelar', valor: null, classe: 'btn-fantasma' },
            ],
        });
        raiz = document.querySelector('#modais .modal-fundo:last-child');
        const status = raiz.querySelector('.exp-status');
        const inp = raiz.querySelector('.imp-arquivo');
        const abrir = async (txt, origem) => {
            if (!String(txt || '').trim()) { status.textContent = '⚠️ Cole o código do save primeiro.'; return; }
            status.textContent = '⏳ Lendo o save...';
            let s;
            try {
                s = await Salvar.decodificar(txt);
            } catch (e) {
                status.textContent = `⚠️ Não deu para abrir ${origem}: ${e.message}.`;
                return;
            }
            raiz._fechar(true);
            await Jogo.carregarEstado(s);
            await Salvar.salvar(s, 'auto');
        };
        raiz.querySelector('[data-imp=arquivo]').addEventListener('click', () => inp.click());
        inp.addEventListener('change', async () => {
            const f = inp.files[0];
            if (!f) return;
            let txt = '';
            try { txt = await f.text(); } catch (e) { status.textContent = '⚠️ Não deu para ler esse arquivo.'; return; }
            inp.value = '';
            abrir(txt, 'o arquivo');
        });
        await promessa;
    },

    // Completa campos novos em saves de versões antigas
    migrar(s) {
        s.cont = s.cont || {};
        s.conq = s.conq || {};
        const p = s.pessoa;
        if (p) {
            if (p.seg == null) p.seg = Math.pow(10, 2 + (p.fama || 0) * 0.065);
            p.inv = p.inv || { poup: 0, acoes: 0, cripto: 0 };
            p.negocios = p.negocios || [];
        }
        for (const c of s.copas || []) {
            if (!c.semanas) { c.semanas = SEMANAS_COPA; c.fases = FASES_COPA; }
            if (!c.tipo) c.tipo = c.pais ? 'nacional' : 'continental';
        }
        const car = s.car;
        if (car && s.modo === 'tecnico') {
            if (!car.treinoTime) car.treinoTime = 'equilibrado';
            if (car.capitao === undefined) car.capitao = null;
            if (car.obra === undefined) car.obra = null;
            car.clubesTreinados = car.clubesTreinados || (car.tid >= 0 ? [s.times[car.tid].nome] : []);
            car.titTemp = car.titTemp || {};
            if (car.invicto == null) car.invicto = 0;
        }
        if (car && s.modo === 'jogador') {
            car.habs = car.habs || [];
            if (car.pontos == null) car.pontos = 2;
            const j = s.jog[car.pid];
            if (!car.camisa) car.camisa = (j && CAMISA_PADRAO[j.pos]) || 10;
            if (!car.comemoracao) car.comemoracao = 'Correr para a torcida';
            if (car.ovrInicioTemp == null && j) car.ovrInicioTemp = j.ovr;
        }
        s.versao = 2;
        return s;
    },

    async carregarEstado(s) {
        if (!s || !s.times || !s.pessoa) return UI.aviso('Erro', 'Esse arquivo de save não é válido.', '⚠️');
        Jogo.migrar(s);
        UI.fecharModais();
        this.fecharPausa();
        if (TelaPartida.m) { TelaPartida.parar(); TelaPartida.m = null; TelaPartida.fase = 'fora'; TelaPartida.resolve = null; }
        this.ocupado = false;
        this.s = s;
        this.aba = 'inicio';
        if (s.pessoa.morto) return this.fimDeVida();
        this.atualizar();
        UI.toast('📂 Jogo carregado!');
    },

    // -----------------------------------------------------------------
    //  Novo jogo
    // -----------------------------------------------------------------
    novoJogo() {
        this.telaSimples('✨ Novo jogo — escolha sua carreira', `
            <div class="cards-modo">
                <button class="card-modo" data-acao="novoModo" data-modo="tecnico">
                    <div class="cm-icone">📋</div><h3>Carreira de Técnico</h3>
                    <p>Escolha qualquer clube das ${DADOS.paises.reduce((t, p) => t + p.ligas.length, 0)} ligas, monte o elenco, contrate, escale e dispute títulos. E cuide da sua vida fora de campo: família, dinheiro, fama.</p>
                </button>
                <button class="card-modo" data-acao="novoModo" data-modo="jogador">
                    <div class="cm-icone">⚽</div><h3>Carreira de Jogador</h3>
                    <p>Comece aos 17 anos, saído da peneira. Treine, decida os lances dentro de campo, negocie contratos, fique famoso, namore, compre carrões... e um dia vire técnico.</p>
                </button>
            </div>`);
    },

    formNovo(modo) {
        const paises = DADOS.paises.map(p => `<option value="${p.id}">${p.bandeira} ${p.nome}</option>`).join('');
        const html = modo === 'tecnico' ? `
            <div class="form">
                <label class="campo">Seu nome<input id="nv-nome" class="inp" maxlength="30" placeholder="Ex.: Davi Felippe" value=""></label>
                <label class="campo">Idade<select id="nv-idade" class="sel">${[28, 32, 35, 38, 40, 45, 50, 55].map(i => `<option ${i === 38 ? 'selected' : ''}>${i}</option>`).join('')}</select></label>
                <label class="campo">Nacionalidade<select id="nv-pais" class="sel">${paises}</select></label>
                <label class="campo">Reputação inicial<select id="nv-rep" class="sel">
                    <option value="20">Desconhecido (difícil)</option><option value="45" selected>Promissor</option><option value="70">Renomado</option><option value="90">Lenda (fácil)</option></select></label>
            </div>
            <div class="linha-botoes"><button class="btn btn-primario btn-grande" data-acao="novoTecnicoClube">Escolher clube ▶</button></div>` : `
            <div class="form">
                <label class="campo">Nome de jogador<input id="nv-nome" class="inp" maxlength="30" placeholder="Ex.: Davi Felippe"></label>
                <label class="campo">Nacionalidade<select id="nv-pais" class="sel">${paises}</select></label>
                <label class="campo">Posição<select id="nv-pos" class="sel">${POSICOES.map(p => `<option value="${p}" ${p === 'ATA' ? 'selected' : ''}>${POS_NOME[p]}</option>`).join('')}</select></label>
                <label class="campo">Idade para começar<select id="nv-idade" class="sel">${Array.from({ length: 20 }, (_, k) => 16 + k).map(i => `<option value="${i}" ${i === 17 ? 'selected' : ''}>${i} anos${i === 16 ? ' (mais potencial)' : i >= 26 ? ' (mais pronto, menos potencial)' : ''}</option>`).join('')}</select></label>
            </div>
            <p class="cinza pequeno">Começar mais novo dá mais tempo para evoluir e mais potencial. Começar mais velho já te deixa mais pronto, mas sobra menos tempo de carreira.</p>
            <div class="linha-botoes"><button class="btn btn-primario btn-grande" data-acao="novoJogadorPeneira">Ir para a peneira ▶</button></div>`;
        this.telaSimples(modo === 'tecnico' ? '📋 Novo técnico' : '⚽ Novo jogador', html, 'menuNovo');
    },

    lerForm() {
        const v = id => { const e = document.getElementById(id); return e ? e.value.trim() : ''; };
        return { nome: v('nv-nome') || 'Davi Felippe', idade: +v('nv-idade') || 17, pais: v('nv-pais') || 'BRA', pos: v('nv-pos') || 'ATA', rep: +v('nv-rep') || 45 };
    },

    // -----------------------------------------------------------------
    //  Pausa (menu de opções dentro do jogo)
    // -----------------------------------------------------------------
    abrirPausa(sub = 'principal') {
        if (!this.s) return;
        if (TelaPartida.rodando) { TelaPartida.parar(); TelaPartida.estavaRodando = true; TelaPartida.atualizar(); }
        TelaPartida.pausaMenu = true;
        let corpo = '';
        if (sub === 'principal') {
            corpo = `<h2 class="secao-titulo">⏸ Jogo pausado</h2>
                <div class="menu-botoes">
                    <button class="btn btn-primario btn-grande" data-acao="pausaFechar">▶ Continuar</button>
                    <button class="btn btn-grande" data-acao="pausaSub" data-sub="salvar">💾 Salvar jogo</button>
                    <button class="btn btn-grande" data-acao="pausaSub" data-sub="carregar">📂 Carregar jogo</button>
                    <button class="btn btn-grande" data-acao="pausaSub" data-sub="opcoes">⚙️ Opções</button>
                    <button class="btn btn-grande" data-acao="pausaSub" data-sub="ajuda">📖 Como jogar</button>
                    <button class="btn btn-grande btn-perigo" data-acao="pausaMenu">🏠 Voltar ao menu principal</button>
                </div>`;
        } else if (sub === 'salvar' || sub === 'carregar') {
            corpo = `<h2 class="secao-titulo">${sub === 'salvar' ? '💾 Salvar jogo' : '📂 Carregar jogo'}</h2>${this.telaSaves(sub === 'salvar')}`;
        } else if (sub === 'opcoes') {
            corpo = `<h2 class="secao-titulo">⚙️ Opções</h2>${this.htmlOpcoes()}`;
        } else if (sub === 'ajuda') {
            corpo = `<h2 class="secao-titulo">📖 Como jogar</h2>${this.htmlAjuda()}`;
        }
        document.getElementById('overlay').innerHTML = `
            <div class="overlay-fundo"><div class="menu-painel menu-largo">${corpo}
                ${sub !== 'principal' ? '<div class="linha-botoes"><button class="btn btn-fantasma" data-acao="pausaSub" data-sub="principal">← Voltar</button></div>' : ''}
            </div></div>`;
        this.subPausa = sub;
    },

    fecharPausa() {
        const o = document.getElementById('overlay');
        if (o) o.innerHTML = '';
        TelaPartida.pausaMenu = false;
        if (TelaPartida.estavaRodando) {
            TelaPartida.estavaRodando = false;
            if (TelaPartida.m && TelaPartida.fase === 'jogo') TelaPartida.iniciar();
        }
    },

    htmlAjuda() {
        return `<div class="ajuda">
            <p><b>Vida de Craque</b> mistura um <b>Football Manager</b> com o <b>BitLife</b>: você cuida da carreira dentro de campo e da vida fora dele.</p>
            <h4>⏩ O tempo</h4>
            <p>Cada temporada tem ${TOTAL_SEMANAS} semanas. Clique em <b>Avançar semana</b> para o tempo passar. Quando seu time joga, a partida abre ao vivo. Além da liga, tem a <b>copa nacional</b> de cada país (Copa do Brasil, FA Cup, Copa del Rey...), as <b>supercopas</b> no começo da temporada, as copas continentais (Liga dos Campeões, Libertadores, Concachampions, Liga Europa e Sul-Americana), a Supercopa da UEFA, a Recopa e, no fim do ano, o <b>Mundial de Clubes</b>. Jogos contra o rival são <b>clássicos 🔥</b>: valem mais moral, fama e confiança.</p>
            <p><b>💬 Vestiário (técnico)</b>: cada jogador tem uma motivação (🔥 muito motivado, 😀 motivado, 😐 normal, 😕 desmotivado, 😠 muito desmotivado). Ela muda com os resultados, com o tempo de jogo e com as suas conversas, e quanto mais motivado, melhor ele joga. Converse com cada um (uma vez por semana), pergunte por que está desmotivado e cumpra as promessas de tempo de jogo: promessa quebrada pesa muito.</p>
            <h4>📋 Carreira de técnico</h4>
            <ul><li>Escale o time na aba <b>Tática</b> (clique numa posição do campinho e depois no jogador).</li>
            <li>Compre e venda na aba <b>Mercado</b> durante as janelas (semanas 1–6 e 22–26). Jogadores sem clube podem ser contratados a qualquer momento.</li>
            <li>Fique de olho na <b>confiança da diretoria</b>: se ela zerar, você é demitido.</li>
            <li>No jogo ao vivo você pode substituir, mudar a postura e falar com o time no intervalo.</li>
            <li>Escolha o <b>treino da semana</b> e o <b>capitão</b> na aba Tática. Invista em <b>estádio, CT e base</b> na aba Estrutura.</li>
            <li>Todo fim de temporada tem a <b>peneira da base</b>: você escolhe uma joia para subir ao profissional.</li></ul>
            <h4>⚽ Carreira de jogador</h4>
            <ul><li>Escolha o <b>treino</b> da semana: mais intenso = evolui mais rápido, mas cansa e pode lesionar.</li>
            <li>Nas partidas, aparecem <b>lances</b> em que você decide: chutar, driblar, tocar, dar o carrinho...</li>
            <li>Propostas de outros clubes chegam nas janelas. Você também pode pedir para ser negociado.</li>
            <li>Ganhe <b>pontos de habilidade</b> (subindo de nível, sendo o melhor em campo, fazendo hat-trick) e desbloqueie <b>habilidades especiais</b> na aba Treino.</li>
            <li>Escolha o número da camisa e a sua <b>comemoração de gol</b> na aba Carreira.</li>
            <li>Quando se aposentar, pode virar técnico com a mesma pessoa!</li></ul>
            <h4>❤️ Vida</h4>
            <p>Felicidade, saúde, fama e dinheiro. Faça até ${Vida.MAX_ACOES} atividades por semana, cuide da família, namore, case, tenha filhos, compre carros e mansões, invista na bolsa ou abra seu próprio negócio. Eventos aleatórios vão aparecer — suas escolhas têm consequências. E tem mais de 40 <b>conquistas</b> para desbloquear!</p>
            <h4>⌨️ Atalhos</h4>
            <p><b>ESC</b>: abre/fecha o menu de pausa (salvar, carregar, opções, voltar ao menu).</p>
            <p><b>Saves</b>: o jogo salva sozinho toda semana. Pelo link online do Claude os saves vão para a nuvem da sua conta (celular e PC). Para guardar uma cópia, use <b>📤 Exportar</b> (arquivo ou código) e depois <b>📥 Importar</b>.</p>
        </div>`;
    },

    // -----------------------------------------------------------------
    //  Casca do jogo (cabeçalho, abas, rodapé)
    // -----------------------------------------------------------------
    atualizar() {
        if (!this.s || TelaPartida.ativo()) return;
        if (this.s.pessoa.morto) return;
        const s = this.s, modo = this.modo();
        Conquistas.verificar(s);
        const trocouAba = this.abaAnterior !== this.aba;
        this.abaAnterior = this.aba;
        const dinAntes = this.dinheiroAntes;
        this.dinheiroAntes = Math.round(s.pessoa.dinheiro);
        const abas = modo.abas(s);
        if (!abas.find(a => a.id === this.aba)) this.aba = abas[0].id;
        const aba = abas.find(a => a.id === this.aba);
        const cont = document.querySelector('.conteudo');
        const rolagem = (cont && cont.scrollTop) || 0;
        UI.render(`
        <div class="shell">
            <header class="topo">
                <div class="topo-esq">
                    <span class="logo">⚽ <b>Vida de Craque</b></span>
                    <span class="data">${UI.dataJogo(s)}${Mundo.emJanela(s) ? ' · <span class="janela">🔄 Janela aberta</span>' : ''}</span>
                </div>
                <div class="topo-dir">
                    <span class="chip">${s.pessoa.sexo === 'f' ? '👩' : '👨'} ${U.esc(s.pessoa.nome)}, ${s.pessoa.idade} anos</span>
                    <span class="chip dinheiro ${s.pessoa.dinheiro < 0 ? 'neg' : ''}">💰 ${U.dinheiro(s.pessoa.dinheiro)}</span>
                    <button class="btn-icone" data-acao="pausaAbrir" title="Menu (ESC)">⚙️</button>
                </div>
            </header>
            <nav class="abas">${abas.map(a => `<button class="aba ${a.id === this.aba ? 'ativa' : ''}" data-acao="aba" data-aba="${a.id}">${a.icone}<span>${a.nome}</span></button>`).join('')}</nav>
            <main class="conteudo ${trocouAba ? 'entrar' : ''}">${aba.render(s)}</main>
            <footer class="rodape">
                <div class="rodape-info">${modo.rodape(s)}</div>
                <div class="rodape-botoes">
                    <button class="btn btn-fantasma" data-acao="avancarRapido" title="Simula 4 semanas sem abrir as partidas">⏩ 4 semanas</button>
                    <button class="btn btn-avancar" data-acao="avancar">▶ Avançar semana</button>
                </div>
            </footer>
        </div>`);
        const c = document.querySelector('.conteudo');
        if (c && this.manterRolagem) c.scrollTop = rolagem;
        this.manterRolagem = false;
        if (dinAntes != null && dinAntes !== this.dinheiroAntes) {
            const chip = document.querySelector('.chip.dinheiro');
            const dif = this.dinheiroAntes - dinAntes;
            if (chip) {
                chip.classList.add(dif > 0 ? 'pulsa-mais' : 'pulsa-menos');
                Efeitos.flutuar(chip, `${dif > 0 ? '+' : ''}${U.dinheiro(dif)}`, dif > 0 ? 'mais' : 'menos');
            }
        }
    },

    // -----------------------------------------------------------------
    //  Passagem do tempo
    // -----------------------------------------------------------------
    async avancar(rapido = false) {
        if (this.ocupado || !this.s) return;
        this.ocupado = true;
        try {
            const s = this.s, modo = this.modo();
            if (modo.antesDaSemana && (await modo.antesDaSemana(s)) === false) return;
            const meu = modo.meuTime(s);
            const meus = meu >= 0 ? Mundo.partidasDaSemana(s).filter(j => j.h === meu || j.a === meu) : [];
            Mundo.simularSemana(s, j => j.h === meu || j.a === meu);
            for (const jogo of meus) {
                if (rapido) {
                    const opts = s.modo === 'tecnico' ? { controle: jogo.h === meu ? 0 : 1 } : { usuario: s.car.pid };
                    const m = Partida.criar(s, jogo, opts);
                    Partida.simularAteOFim(m);
                    const r = Partida.finalizar(s, m);
                    Mundo.registrar(s, jogo, r);
                    if (modo.posJogo) await modo.posJogo(s, jogo, m, r, true);
                } else {
                    await TelaPartida.jogar(s, jogo);
                }
            }
            await modo.semana(s);
            Jogo.ui.rodada = null;
            Vida.semana(s);
            if (U.chance(rapido ? 0.18 : 0.3)) await Vida.eventoAleatorio(s);
            Mundo.posSemana(s);
            if (s.semana >= TOTAL_SEMANAS) await this.fimTemporada();
            if (s.pessoa.morto) { this.ocupado = false; return this.fimDeVida(); }
            if (this.opcoes.autosave) {
                const r = await Salvar.salvar(s, 'auto');
                if (!r.ok && !this.avisouAutosave) {
                    this.avisouAutosave = true;
                    UI.toast('⚠️ O salvamento automático falhou: ' + r.erro + '. Use Exportar para não perder o progresso.', 'erro');
                }
            }
        } catch (e) {
            console.error(e);
            UI.toast('Ops! Aconteceu um erro: ' + e.message, 'erro');
        } finally {
            this.ocupado = false;
        }
        if (this.s && !this.s.pessoa.morto) this.atualizar();
    },

    async avancarVarias(n) {
        for (let i = 0; i < n; i++) {
            if (!this.s || this.s.pessoa.morto) break;
            const ano = this.s.ano;
            await this.avancar(true);
            if (!this.s || this.s.ano !== ano) break;
        }
    },

    async fimTemporada() {
        const s = this.s, modo = this.modo();
        const dados = modo.resumoTemporada ? modo.resumoTemporada(s) : { tid: -1, ehMeu: () => false };
        if (modo.antesFimTemporada) await modo.antesFimTemporada(s);
        const resumo = Mundo.fimDeTemporada(s);
        if (Cena.ligada()) await Cena.temporada(s, resumo, dados);
        else await this.mostrarResumoTemporada(resumo);
        if (modo.depoisFimTemporada) await modo.depoisFimTemporada(s, resumo);
        if (!s.pessoa.morto) await Selecoes.fimTemporada(s, resumo.ano);
        const morte = Vida.anoNovo(s);
        Conquistas.verificar(s);
        if (morte) return;
    },

    async mostrarResumoTemporada(r) {
        const s = this.s;
        const meu = this.modo().meuTime(s);
        const campeoes = r.campeoes.map(c => `<div class="rs-linha">${U.esc(c.liga)}: ${UI.time(s, c.tid)}</div>`).join('');
        const premios = r.premios.slice(0, 6).map(p => `<div class="rs-linha">🏅 ${U.esc(p.tipo)}: <b>${U.esc(p.nome)}</b> ${p.tid >= 0 ? `(${U.esc(s.times[p.tid].nome)})` : ''} — ${p.info}</div>`).join('');
        let meuTxt = '';
        if (meu >= 0) {
            const sub = r.subiram.find(x => x.tid === meu), des = r.desceram.find(x => x.tid === meu);
            if (sub) meuTxt = `<p class="destaque-bom">🎉 Seu time subiu para a ${U.esc(sub.liga)}!</p>`;
            if (des) meuTxt = `<p class="destaque-ruim">😢 Seu time foi rebaixado para a ${U.esc(des.liga)}.</p>`;
        }
        await UI.modal({
            titulo: `🏁 Fim da temporada ${r.ano}`,
            html: `${meuTxt}<h4>🏆 Campeões</h4><div class="rs-grade">${campeoes}</div><h4>🏅 Prêmios</h4>${premios}`,
            largo: true,
            botoes: [{ txt: `Começar ${r.ano + 1} ▶`, valor: true }],
        });
    },

    fimDeVida() {
        const s = this.s, p = s.pessoa;
        const j = s.modo === 'jogador' ? s.jog[s.car.pid] : null;
        const hist = s.car.hist || [];
        UI.render(`
        <div class="tela-menu">
            <div class="menu-fundo"></div>
            <div class="menu-painel menu-largo">
                <div class="menu-bola">⚰️</div>
                <h2 class="secao-titulo">Descanse em paz, ${U.esc(p.nome)}</h2>
                <p>${U.esc(p.log.length ? p.log[p.log.length - 1].txt : '')}</p>
                <div class="grade-resumo">
                    <div><span>Idade</span><b>${p.idade} anos</b></div>
                    <div><span>Patrimônio</span><b>${U.dinheiro(p.dinheiro + U.soma(p.bens, b => b.valor))}</b></div>
                    <div><span>Fama</span><b>${Math.round(p.fama)}%</b></div>
                    <div><span>Títulos</span><b>${p.trofeus.length}</b></div>
                    ${j ? `<div><span>Gols na carreira</span><b>${j.cg + j.g}</b></div>` : ''}
                    <div><span>Temporadas</span><b>${hist.length}</b></div>
                </div>
                <h4>🏆 Troféus</h4>
                <div class="lista-trofeus">${p.trofeus.map(t => `<span class="trofeu">🏆 ${U.esc(t.txt)} (${t.ano})</span>`).join('') || '<span class="cinza">Nenhum título.</span>'}</div>
                <h4>👨‍👩‍👧 Família</h4>
                <p>${p.rel.filter(r => r.vivo && ['conjuge', 'filho', 'pet'].includes(r.tipo)).map(r => `${Vida.rotuloRel(r)}: ${U.esc(r.nome)}`).join(' · ') || 'Você partiu sozinho.'}</p>
                <div class="linha-botoes"><button class="btn btn-primario btn-grande" data-acao="menuVoltar">🏠 Menu principal</button></div>
            </div>
        </div>`);
    },

    // -----------------------------------------------------------------
    //  Modais de time e jogador
    // -----------------------------------------------------------------
    async verTime(tid) {
        const s = this.s, t = s.times[tid];
        const liga = Mundo.liga(s, t.liga);
        const el = Mundo.elenco(s, t).sort((a, b) => POSICOES.indexOf(a.pos) - POSICOES.indexOf(b.pos) || b.ovr - a.ovr);
        const titulos = Object.entries(s.campeoes).flatMap(([comp, l]) => l.filter(x => x.tid === tid).map(x => `${Mundo.nomeCompeticao(s, comp)} ${x.ano}`));
        await UI.modal({
            titulo: `${UI.escudo(t, true)} ${U.esc(t.nome)}`,
            largo: true,
            html: `<div class="info-time">
                <span>${Mundo.pais(t.pais).bandeira} ${U.esc(liga.nome)} · ${Mundo.posicaoNaLiga(s, tid)}º lugar</span>
                <span>Força: ${UI.ovr(Math.round(Mundo.forca(s, t)))} ${U.estrelas((Mundo.forca(s, t) - 50) / 7)}</span>
                <span>Caixa: ${U.dinheiro(t.saldo)}</span>
                <span>Formação: ${t.form}</span>
            </div>
            ${titulos.length ? `<p class="pequeno">🏆 ${titulos.map(U.esc).join(' · ')}</p>` : ''}
            <table class="tabela tabela-elenco"><thead><tr><th>Pos</th><th class="esq">Jogador</th><th>Idade</th><th>OVR</th><th>J</th><th>G</th><th>A</th><th>Nota</th><th>Valor</th></tr></thead>
            <tbody>${el.map(p => `<tr class="${p.user ? 'destaque' : ''}"><td>${UI.pos(p.pos)}</td><td class="esq">${UI.jogador(p)}${p.les > 0 ? ' 🚑' : ''}</td><td>${p.idade}</td><td>${UI.ovr(p.ovr)}</td><td>${p.j}</td><td>${p.g}</td><td>${p.a}</td><td>${p.j ? UI.nota(p.ns / p.j) : '-'}</td><td>${U.dinheiro(Mundo.valor(p))}</td></tr>`).join('')}</tbody></table>`,
            botoes: [{ txt: 'Fechar', valor: true }],
        });
    },

    async verJogador(pid) {
        const s = this.s, p = s.jog[pid];
        if (!p) return;
        const t = p.tid >= 0 ? s.times[p.tid] : null;
        const extras = this.modo().acoesJogador ? this.modo().acoesJogador(s, p) : [];
        const r = await UI.modal({
            titulo: `${UI.pos(p.pos)} ${U.esc(p.nome)} ${UI.ovr(p.ovr)}`,
            html: `<div class="ficha">
                <div><span>Clube</span><b>${t ? UI.escudo(t) + ' ' + U.esc(t.nome) : 'Sem clube'}</b></div>
                <div><span>Posição</span><b>${POS_NOME[p.pos]}</b></div>
                <div><span>Idade</span><b>${p.idade} anos</b></div>
                <div><span>Potencial</span><b>${this.potencialTxt(s, p)}</b></div>
                <div><span>Valor de mercado</span><b>${U.dinheiro(Mundo.valor(p))}</b></div>
                <div><span>Salário</span><b>${U.dinheiro(p.sal)}/ano</b></div>
                <div><span>Contrato</span><b>${p.tid >= 0 ? `até ${s.ano + p.contr - 1}` : '—'}</b></div>
                ${p.user ? '' : `<div><span>Motivação</span><b>${Mot.badge(p)}</b></div>`}
                <div><span>Condição</span><b>${p.les > 0 ? `🚑 Lesionado (${p.les} sem.)` : p.susp > 0 ? `🟥 Suspenso (${p.susp})` : `${Math.round(p.cond)}%`}</b></div>
            </div>
            <div class="ficha ficha-stats">
                <div><span>Temporada</span><b>${p.j} jogos · ${p.g} gols · ${p.a} assist. · nota ${p.j ? (p.ns / p.j).toFixed(2) : '-'}</b></div>
                <div><span>Carreira (antes)</span><b>${p.cj} jogos · ${p.cg} gols · ${p.ca} assist.</b></div>
            </div>`,
            botoes: extras.map(e => ({ txt: e.txt, valor: e.id, classe: e.classe || 'btn-opcao', desativado: e.desativado })).concat([{ txt: 'Fechar', valor: null, classe: 'btn-fantasma' }]),
        });
        if (r && this.modo().acaoJogador) await this.modo().acaoJogador(s, p, r);
    },

    potencialTxt(s, p) {
        if (p.user) return U.estrelas((p.pot - 55) / 8) + ' (estimado)';
        if (p.idade >= 27) return 'Já atingido';
        const min = Math.max(p.ovr, p.pot - 4), max = Math.min(99, p.pot + 3);
        return `${min}–${max}`;
    },
};

// =====================================================================
//  Abas compartilhadas pelos dois modos
// =====================================================================
const Comum = {
    tabelas(s) {
        const ui = Jogo.ui;
        const meu = Jogo.modo().meuTime(s);
        if (!ui.liga) ui.liga = meu >= 0 ? s.times[meu].liga : s.ligas[0].id;
        const copa = Mundo.copa(s, ui.liga);
        const seletor = `<div class="seletor-ligas">${DADOS.paises.map(p => `
            <div class="sl-pais"><span>${p.bandeira}</span>${s.ligas.filter(l => l.pais === p.id).map(l => `<button class="chip-btn ${ui.liga === l.id ? 'ativo' : ''}" data-acao="selLiga" data-liga="${l.id}">${U.esc(l.curto)}</button>`).join('')}${s.copas.filter(c => c.pais === p.id).map(c => `<button class="chip-btn copa ${ui.liga === c.id ? 'ativo' : ''}" data-acao="selLiga" data-liga="${c.id}">${c.icone} ${U.esc(c.nome)}</button>`).join('')}</div>`).join('')}
            <div class="sl-pais"><span>🌍</span>${s.copas.filter(c => !c.pais).map(c => `<button class="chip-btn ${ui.liga === c.id ? 'ativo' : ''}" data-acao="selLiga" data-liga="${c.id}">${c.icone} ${U.esc(c.nome)}</button>`).join('')}</div>
        </div>`;
        if (copa) return seletor + Comum.copa(s, copa);
        const liga = Mundo.liga(s, ui.liga);
        if (ui.rodada == null || ui.rodadaLiga !== liga.id) {
            // mostra a última rodada jogada (ou a primeira, se nada foi jogado)
            const prox = liga.res.findIndex(r => r.length === 0);
            ui.rodada = prox < 0 ? liga.rodadas.length - 1 : Math.max(0, prox - 1);
            ui.rodadaLiga = liga.id;
        }
        ui.rodada = U.clamp(ui.rodada, 0, liga.rodadas.length - 1);
        const r = ui.rodada;
        const jogos = liga.rodadas[r].map(([h, a]) => {
            const res = liga.res[r].find(x => x.h === h && x.a === a);
            return `<div class="jogo-linha ${h === meu || a === meu ? 'destaque' : ''}"><span class="jl-time dir">${UI.time(s, h)}</span><b class="jl-placar">${res ? `${res.gh} x ${res.ga}` : 'x'}${Mundo.classico(s, h, a) ? '<small class="selo-mini">🔥</small>' : ''}</b><span class="jl-time">${UI.time(s, a)}</span></div>`;
        }).join('');
        const art = liga.times.flatMap(tid => Mundo.elenco(s, s.times[tid])).filter(p => p.g > 0).sort((a, b) => b.g - a.g || a.j - b.j).slice(0, 10);
        const camp = (s.campeoes[liga.id] || []).slice(-5).reverse();
        return seletor + `
        <div class="grade-2">
            <div class="cartao">
                <h3>${Mundo.pais(liga.pais).bandeira} ${U.esc(liga.nome)}</h3>
                ${UI.tabela(s, liga, meu)}
                <div class="legenda"><span class="z-campeao">Campeão</span><span class="z-copa">Copa continental</span><span class="z-sobe">Acesso</span><span class="z-desce">Rebaixamento</span></div>
            </div>
            <div>
                <div class="cartao">
                    <div class="cartao-topo"><button class="btn btn-pequeno" data-acao="rodada" data-d="-1" ${r <= 0 ? 'disabled' : ''}>◀</button><h3>Rodada ${r + 1} <small>(semana ${liga.sem[r] + 1})</small></h3><button class="btn btn-pequeno" data-acao="rodada" data-d="1" ${r >= liga.rodadas.length - 1 ? 'disabled' : ''}>▶</button></div>
                    ${jogos}
                </div>
                <div class="cartao">
                    <h3>⚽ Artilharia</h3>
                    ${art.length ? `<table class="tabela"><tbody>${art.map((p, i) => `<tr class="${p.user ? 'destaque' : ''}"><td>${i + 1}</td><td class="esq">${UI.jogador(p)}</td><td class="esq">${UI.time(s, p.tid, true)}</td><td><b>${p.g}</b></td></tr>`).join('')}</tbody></table>` : '<p class="cinza">Ninguém marcou ainda.</p>'}
                </div>
                ${camp.length ? `<div class="cartao"><h3>🏆 Últimos campeões</h3>${camp.map(c => `<div class="rs-linha">${c.ano}: ${UI.time(s, c.tid)}</div>`).join('')}</div>` : ''}
            </div>
        </div>`;
    },

    copa(s, c) {
        const meu = Jogo.modo().meuTime(s);
        const fases = c.jogos.map((jogos, f) => `
            <div class="cartao"><h3>${Mundo.fasesCopa(c)[f]} <small>(semana ${Mundo.semanasCopa(c)[f] + 1})</small></h3>
            ${jogos.map(([h, a]) => {
            const res = (c.res[f] || []).find(x => x.h === h && x.a === a);
            return `<div class="jogo-linha ${h === meu || a === meu ? 'destaque' : ''}"><span class="jl-time dir">${UI.time(s, h)}</span><b class="jl-placar">${res ? `${res.gh} x ${res.ga}${res.pen ? `<small> (${res.pen} pên.)</small>` : ''}` : 'x'}${Mundo.classico(s, h, a) ? '<small class="selo-mini">🔥</small>' : ''}</b><span class="jl-time">${UI.time(s, a)}</span></div>`;
        }).join('')}</div>`).join('');
        const camp = (s.campeoes[c.id] || []).slice(-5).reverse();
        return `<div class="cartao"><h3>${c.icone} ${U.esc(c.nome)} ${s.ano}</h3>${c.campeao != null ? `<p class="destaque-bom">🏆 Campeão: ${UI.time(s, c.campeao)}</p>` : '<p class="cinza">Mata-mata em jogo único. Empate vai para os pênaltis.</p>'}</div>
            <div class="grade-2">${fases}</div>
            ${camp.length ? `<div class="cartao"><h3>Campeões anteriores</h3>${camp.map(x => `<div class="rs-linha">${x.ano}: ${UI.time(s, x.tid)}</div>`).join('')}</div>` : ''}`;
    },

    noticias(s) {
        return `<div class="cartao"><h3>📰 Notícias do mundo do futebol</h3>
            ${s.noticias.length ? s.noticias.map(n => `<div class="noticia n-${n.tipo}"><small>${n.ano} · sem. ${n.sem + 1}</small> ${n.txt}</div>`).join('') : '<p class="cinza">Nada de novo por enquanto.</p>'}</div>`;
    },

    mundo(s) {
        const bolas = s.premios.filter(p => p.tipo === 'Bola de Ouro').slice().reverse();
        const top = Object.values(s.jog).filter(p => p.tid >= 0).sort((a, b) => b.ovr - a.ovr).slice(0, 25);
        const jovens = Object.values(s.jog).filter(p => p.tid >= 0 && p.idade <= 21).sort((a, b) => b.ovr - a.ovr).slice(0, 10);
        return `<div class="grade-2">
            <div class="cartao"><h3>🌟 Melhores jogadores do mundo</h3>
                <table class="tabela"><tbody>${top.map((p, i) => `<tr class="${p.user ? 'destaque' : ''}"><td>${i + 1}</td><td>${UI.pos(p.pos)}</td><td class="esq">${UI.jogador(p)}</td><td class="esq">${UI.time(s, p.tid, true)}</td><td>${p.idade}</td><td>${UI.ovr(p.ovr)}</td></tr>`).join('')}</tbody></table>
            </div>
            <div>
                <div class="cartao"><h3>🏅 Bola de Ouro</h3>${bolas.length ? bolas.map(b => `<div class="rs-linha">${b.ano}: <b>${U.esc(b.nome)}</b> (${b.tid >= 0 && s.times[b.tid] ? U.esc(s.times[b.tid].nome) : '-'}) — ${b.info}</div>`).join('') : '<p class="cinza">Entregue no fim de cada temporada.</p>'}</div>
                ${s.premios.some(p => /Revelação|Luva|Técnico do Ano/.test(p.tipo)) ? `<div class="cartao"><h3>🌟 Outros prêmios</h3>${s.premios.filter(p => /Revelação|Luva|Técnico do Ano/.test(p.tipo)).slice(-12).reverse().map(p => `<div class="rs-linha">${p.ano} · ${U.esc(p.tipo)}: <b>${U.esc(p.nome)}</b> ${p.pid != null && p.tid >= 0 && s.times[p.tid] ? `(${U.esc(s.times[p.tid].nome)})` : ''}</div>`).join('')}</div>` : ''}
                <div class="cartao"><h3>🌱 Joias (até 21 anos)</h3>
                    <table class="tabela"><tbody>${jovens.map(p => `<tr class="${p.user ? 'destaque' : ''}"><td>${UI.pos(p.pos)}</td><td class="esq">${UI.jogador(p)}</td><td class="esq">${UI.time(s, p.tid, true)}</td><td>${p.idade}</td><td>${UI.ovr(p.ovr)}</td></tr>`).join('')}</tbody></table>
                </div>
            </div>
        </div>`;
    },

    // ---------------- Vida (BitLife) ----------------
    vida(s) {
        const p = s.pessoa, sub = Jogo.ui.subVida;
        const subs = [['atividades', '🎯 Atividades'], ['relacoes', '❤️ Relacionamentos'], ['bens', '🏠 Bens'], ['invest', '💹 Investimentos'], ['diario', '📔 Diário']];
        let corpo = '';
        if (sub === 'atividades') {
            corpo = `<p class="cinza">Ações nesta semana: <b>${p.acoes}/${Vida.MAX_ACOES}</b></p>
            <div class="grade-atividades">${Vida.atividades(s).map(a => `
                <button class="atividade" data-acao="atividade" data-id="${a.id}" ${p.acoes >= Vida.MAX_ACOES && a.id !== 'namoro' ? 'disabled' : ''}>
                    <span class="at-icone">${a.icone}</span><b>${a.nome}</b><small>${a.desc}${a.custo ? ` · ${U.dinheiro(a.custo)}` : ''}</small>
                </button>`).join('')}</div>`;
        } else if (sub === 'relacoes') {
            const vivos = p.rel.filter(r => r.vivo && r.tipo !== 'ex');
            const outros = p.rel.filter(r => !r.vivo || r.tipo === 'ex');
            corpo = `<div class="lista-rel">${vivos.map(r => `
                <div class="rel">
                    <div class="rel-info"><b>${U.esc(r.nome)}</b><small>${Vida.rotuloRel(r)} · ${r.idade} anos</small>
                    ${r.tipo !== 'pet' ? `<div class="stat-fundo pequeno"><div class="stat-preenche ${r.relacao >= 60 ? 'verde' : r.relacao >= 30 ? 'amarelo' : 'vermelho'}" style="width:${r.relacao}%"></div></div>` : ''}</div>
                    <div class="rel-acoes">${r.tipo === 'pet' ? `<button class="btn btn-pequeno" data-acao="relAcao" data-rid="${r.id}" data-a="tempo">🐾 Brincar</button>` : Vida.acoesRel(r).map(([id, txt]) => `<button class="btn btn-pequeno" data-acao="relAcao" data-rid="${r.id}" data-a="${id}">${txt}</button>`).join('')}</div>
                </div>`).join('')}</div>
                <button class="btn" data-acao="atividade" data-id="namoro">💘 Procurar namoro</button>
                ${outros.length ? `<h4>Lembranças</h4><p class="cinza pequeno">${outros.map(r => `${U.esc(r.nome)} (${r.vivo ? 'ex' : '🕊️ ' + Vida.rotuloRel(r).toLowerCase()})`).join(' · ')}</p>` : ''}`;
        } else if (sub === 'bens') {
            const meus = p.bens.length ? `<div class="lista-bens">${p.bens.map(b => `<div class="bem"><span>${b.tipo === 'carro' ? '🚗' : b.tipo === 'casa' ? '🏠' : '💎'} <b>${U.esc(b.nome)}</b> <small>comprado em ${b.ano} por ${U.dinheiro(b.valor)}</small></span><button class="btn btn-pequeno" data-acao="vender" data-id="${b.id}">Vender</button></div>`).join('')}</div>` : '<p class="cinza">Você ainda não tem nenhum bem.</p>';
            const loja = Object.entries(BENS).map(([tipo, lista]) => `
                <h4>${tipo === 'carro' ? '🚗 Concessionária' : tipo === 'casa' ? '🏠 Imobiliária' : '💎 Luxo'}</h4>
                <div class="grade-loja">${lista.map((b, i) => `<button class="item-loja" data-acao="comprar" data-tipo="${tipo}" data-i="${i}" ${p.dinheiro < b.valor ? 'disabled' : ''}><b>${b.nome}</b><span>${U.dinheiro(b.valor)}</span></button>`).join('')}</div>`).join('');
            corpo = `<h4>Seus bens</h4>${meus}<p class="cinza pequeno">Manter bens custa ~0,05% do valor por semana.</p>${loja}`;
        } else if (sub === 'invest') {
            const inv = p.inv || {};
            corpo = `<div class="ficha"><div><span>Patrimônio total</span><b class="verde">${U.dinheiro(Vida.patrimonio(s))}</b></div><div><span>Dinheiro em conta</span><b>${U.dinheiro(p.dinheiro)}</b></div></div>
                <h4>📊 Aplicações</h4>
                <div class="grade-3">${Object.entries(APLICACOES).map(([k, a]) => `<div class="aplicacao"><div class="infra-icone">${a.icone}</div><b>${a.nome}</b>
                    <span class="grande">${U.dinheiro(inv[k] || 0)}</span><small class="cinza">${a.desc}</small>
                    <div class="linha-botoes"><button class="btn btn-pequeno btn-primario" data-acao="invAplicar" data-k="${k}">Aplicar</button><button class="btn btn-pequeno" data-acao="invResgatar" data-k="${k}">Resgatar</button></div></div>`).join('')}</div>
                <h4>🏪 Seus negócios</h4>
                ${(p.negocios || []).length ? `<div class="lista-bens">${p.negocios.map(n => `<div class="bem"><span>${n.icone} <b>${U.esc(n.nome)}</b> <small>desde ${n.ano} · já rendeu ${U.dinheiro(n.lucro || 0)}</small></span><button class="btn btn-pequeno" data-acao="negVender" data-id="${n.id}">Vender</button></div>`).join('')}</div>` : '<p class="cinza">Nenhum negócio ainda. Eles dão renda toda semana, mas podem falir.</p>'}
                <h4>💼 Abrir um negócio</h4>
                <div class="grade-loja">${NEGOCIOS.map((n, i) => `<button class="item-loja" data-acao="negAbrir" data-i="${i}" ${p.dinheiro < n.custo ? 'disabled' : ''}><b>${n.icone} ${n.nome}</b><span>${U.dinheiro(n.custo)}</span><small class="cinza">~${U.dinheiro(n.custo * 0.0028)}/semana</small></button>`).join('')}</div>`;
        } else {
            corpo = Comum.diario(s, 200);
        }
        return `<div class="grade-vida">
            <div class="cartao">${Comum.perfil(s)}</div>
            <div class="cartao">
                <div class="sub-abas">${subs.map(([id, n]) => `<button class="chip-btn ${sub === id ? 'ativo' : ''}" data-acao="subVida" data-sub="${id}">${n}</button>`).join('')}</div>
                ${corpo}
            </div>
        </div>`;
    },

    perfil(s) {
        const p = s.pessoa;
        const patr = p.patrocinios.length ? `<div class="pequeno">🤝 Patrocínios: ${p.patrocinios.map(x => `${x.marca} (${U.dinheiro(x.semana)}/sem)`).join(', ')}</div>` : '';
        return `<div class="perfil">
            <div class="avatar">${p.sexo === 'f' ? '👩' : '👨'}<span class="avatar-selo">${s.modo === 'tecnico' ? '📋' : '⚽'}</span></div>
            <div><b class="perfil-nome">${U.esc(p.nome)}</b><div class="cinza">${p.idade} anos · ${Mundo.pais(p.pais) ? Mundo.pais(p.pais).bandeira : ''} · ${U.dinheiro(p.dinheiro)}</div></div>
        </div>
        ${UI.barra('Felicidade', p.felicidade, '😊')}
        ${UI.barra('Saúde', p.saude, '❤️')}
        ${UI.barra('Fama', p.fama, '⭐', 'azul')}
        ${UI.barra('Aparência', p.aparencia, '💅', 'roxo')}
        <div class="perfil-extra"><span>📱 <b>${Vida.numero(p.seg || 0)}</b> seguidores</span><span>💎 Patrimônio <b>${U.dinheiro(Vida.patrimonio(s))}</b></span></div>
        ${patr}
        ${p.trofeus.length ? `<div class="pequeno">🏆 ${p.trofeus.length} título(s)</div>` : ''}`;
    },

    diario(s, n = 60) {
        const log = s.pessoa.log.slice(-n).reverse();
        let html = '', idade = null;
        for (const l of log) {
            if (l.idade !== idade) { idade = l.idade; html += `<div class="diario-idade">Idade: ${idade} anos</div>`; }
            html += `<div class="diario-item d-${l.tipo}">${l.txt}</div>`;
        }
        return `<div class="diario">${html || '<p class="cinza">Sua história começa agora.</p>'}</div>`;
    },
};

// =====================================================================
//  Ações dos botões
// =====================================================================
Object.assign(ACOES, {
    menuVoltar: () => Jogo.menu(),
    menuNovo: () => Jogo.novoJogo(),
    menuAjuda: () => Jogo.telaSimples('📖 Como jogar', Jogo.htmlAjuda()),
    menuOpcoes: () => Jogo.telaSimples('⚙️ Opções', Jogo.htmlOpcoes() + `<div class="linha-botoes"><button class="btn btn-perigo btn-pequeno" data-acao="apagarTudo">🗑️ Apagar todos os saves</button></div>`),
    menuCarregar: () => Jogo.telaSimples('📂 Carregar jogo', Jogo.telaSaves(false)),
    async menuContinuar() {
        const slot = Salvar.ultimo();
        if (!slot) return;
        await ACOES.saveCarregar({ slot }, null, null, true);
    },
    async apagarTudo() {
        if (!(await UI.confirmar('Apagar TODOS os jogos salvos? Isso não pode ser desfeito.', 'Apagar tudo'))) return;
        for (const slot of Salvar.SLOTS) await Salvar.apagar(slot);
        UI.toast('Saves apagados.');
    },
    novoModo: d => Jogo.formNovo(d.modo),
    novoTecnicoClube: () => { Jogo.formTmp = Jogo.lerForm(); Tecnico.telaEscolherClube(Jogo.formTmp); },
    novoJogadorPeneira: () => { Jogo.formTmp = Jogo.lerForm(); Jogador.telaPeneira(Jogo.formTmp); },

    // opções
    opResolucao: (d, el) => { Jogo.opcoes.resolucao = el.value; Jogo.gravarOpcoes(); },
    opEscala: (d, el) => { Jogo.opcoes.escala = +el.value; Jogo.gravarOpcoes(); },
    opVelocidade: (d, el) => { Jogo.opcoes.velocidade = +el.value; Jogo.gravarOpcoes(); },
    opTema: (d, el) => { Jogo.opcoes.tema = el.value; Jogo.gravarOpcoes(); },
    opAutosave: (d, el) => { Jogo.opcoes.autosave = el.checked; Jogo.gravarOpcoes(); },
    opSom: (d, el) => { Jogo.opcoes.som = el.checked; Jogo.gravarOpcoes(); Som.tocar('moeda'); },
    opVolume: (d, el) => { Jogo.opcoes.volume = +el.value; Jogo.gravarOpcoes(); Som.tocar('moeda'); },
    opCenas: (d, el) => { Jogo.opcoes.cenas = el.checked; Jogo.gravarOpcoes(); },
    opAnim: (d, el) => { Jogo.opcoes.animacoes = el.checked; Jogo.gravarOpcoes(); },
    opTelaCheia: (d, el) => { Jogo.telaCheia(); setTimeout(() => { el.textContent = document.fullscreenElement || document.webkitFullscreenElement ? 'Sair da tela cheia' : 'Entrar em tela cheia'; }, 300); },

    // pausa
    pausaAbrir: () => Jogo.abrirPausa(),
    pausaFechar: () => Jogo.fecharPausa(),
    pausaSub: d => Jogo.abrirPausa(d.sub),
    async pausaMenu() {
        if (!(await UI.confirmar('Voltar ao menu principal? O progresso desde o último salvamento será perdido.', 'Voltar ao menu', 'Cancelar'))) return;
        if (TelaPartida.m) { TelaPartida.parar(); TelaPartida.m = null; TelaPartida.fase = 'fora'; TelaPartida.resolve = null; }
        Jogo.ocupado = false;
        Salvar.enviarNuvemPendente();
        Jogo.menu();
    },

    // saves
    async saveSalvar(d) {
        const s = Jogo.s;
        if (!s) return;
        if (TelaPartida.ativo()) return UI.toast('Termine a partida antes de salvar.', 'erro');
        const meta = Salvar.metaDe(d.slot);
        if (meta && !(await UI.confirmar(`Sobrescrever o ${Salvar.nomeSlot(d.slot)}?`, 'Sobrescrever'))) return;
        UI.toast('💾 Salvando...');
        const r = await Salvar.salvar(s, d.slot);
        if (!r.ok) UI.toast('⚠️ Não foi possível salvar: ' + r.erro + '. Use 📤 Exportar para guardar o jogo.', 'erro');
        else if (Salvar.onde() === 'memoria') UI.toast('⚠️ Salvo só até fechar a página (este visualizador bloqueia o salvamento). Use 📤 Exportar!', 'erro');
        else if (Salvar.nuvem && r.nuvem !== true) UI.toast('💾 Salvo neste aparelho, mas a nuvem falhou: ' + r.erro, 'erro');
        else UI.toast(Salvar.nuvem ? '☁️ Jogo salvo na nuvem!' : '💾 Jogo salvo!');
        if (Jogo.subPausa) Jogo.abrirPausa(Jogo.subPausa);
    },
    async saveCarregar(d, el, ev, semConfirmar) {
        if (Jogo.s && !semConfirmar && !(await UI.confirmar('Carregar este jogo? O progresso não salvo será perdido.', 'Carregar'))) return;
        UI.toast('📂 Carregando...');
        try {
            Jogo.carregarEstado(await Salvar.carregar(d.slot));
        } catch (e) {
            UI.aviso('Não deu para carregar', `O ${Salvar.nomeSlot(d.slot)} não abriu: ${U.esc(e.message)}.`, '⚠️');
        }
    },
    async saveApagar(d) {
        if (!(await UI.confirmar(`Apagar o ${Salvar.nomeSlot(d.slot)}?`, 'Apagar'))) return;
        await Salvar.apagar(d.slot);
        if (Jogo.s && document.getElementById('overlay').innerHTML) Jogo.abrirPausa(d.salvar === '1' ? 'salvar' : 'carregar');
        else ACOES.menuCarregar();
    },
    saveExportar: () => Jogo.telaExportar(),
    saveImportar: () => Jogo.telaImportar(),

    // casca
    aba: d => { Jogo.aba = d.aba; Jogo.atualizar(); const c = document.querySelector('.conteudo'); if (c) c.scrollTop = 0; },
    avancar: () => Jogo.avancar(false),
    avancarRapido: () => Jogo.avancarVarias(4),
    verTime: d => Jogo.verTime(+d.tid),
    verJogador: d => Jogo.verJogador(+d.pid),
    selLiga: d => { Jogo.ui.liga = d.liga; Jogo.ui.rodada = null; Jogo.atualizar(); },
    rodada: d => { Jogo.ui.rodada += +d.d; Jogo.manterRolagem = true; Jogo.atualizar(); },
    subVida: d => { Jogo.ui.subVida = d.sub; Jogo.manterRolagem = true; Jogo.atualizar(); },
    atividade: d => Vida.fazerAtividade(Jogo.s, d.id),
    relAcao: d => { Jogo.manterRolagem = true; Vida.acaoRel(Jogo.s, +d.rid, d.a); },
    comprar: d => { Jogo.manterRolagem = true; Vida.comprar(Jogo.s, d.tipo, +d.i); },
    vender: d => { Jogo.manterRolagem = true; Vida.vender(Jogo.s, +d.id); },
    invAplicar: d => Vida.aplicar(Jogo.s, d.k, false),
    invResgatar: d => Vida.aplicar(Jogo.s, d.k, true),
    negAbrir: d => Vida.abrirNegocio(Jogo.s, +d.i),
    negVender: d => Vida.venderNegocio(Jogo.s, +d.id),
});

// Começa assim que este script roda (é o último da página, então a tela já
// existe). Não espera o evento 'load': ele fica preso quando algum recurso
// externo não responde. Na página publicada no Claude, o "hot" guarda se
// havia um jogo aberto para continuar dele depois de uma atualização.
(function () {
    let iniciado = false;
    const comecar = dados => {
        if (iniciado) return;
        iniciado = true;
        Jogo.iniciar(dados || {}).catch(e => {
            console.error(e);
            if (window.__vdcFalha) window.__vdcFalha(e);
        });
    };
    try {
        const hot = window.claude && window.claude.hot;
        if (hot && hot.snapshot) hot.snapshot(() => ({ continuar: !!(Jogo.s && !Jogo.s.pessoa.morto) }));
        if (hot && hot.ready) {
            hot.ready(comecar);
            setTimeout(() => comecar(hot.data), 2500);   // se o "ready" nunca responder
        } else comecar(hot && hot.data);
    } catch (e) {
        comecar({});
    }
})();
