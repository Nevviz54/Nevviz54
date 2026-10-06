'use strict';
// =====================================================================
//  CUTSCENES e EFEITOS VISUAIS
//  Cena.mostrar(slides) toca uma sequência de "slides" animados em tela
//  cheia. Clique (ou Espaço/Enter) avança, "Pular" (ou ESC) encerra.
// =====================================================================

const Cena = {
    ativa: false,

    ligada() {
        return typeof Jogo === 'undefined' || Jogo.opcoes.cenas !== false;
    },

    mostrar(slides) {
        slides = slides.filter(Boolean);
        if (!slides.length || !Cena.ligada()) return Promise.resolve();
        return new Promise(resolve => {
            const raiz = document.getElementById('cena');
            raiz.innerHTML = `<div class="cena">
                <canvas class="cena-confete"></canvas>
                <div class="cena-palco"></div>
                <div class="cena-pontos">${slides.map(() => '<i></i>').join('')}</div>
                <button class="cena-pular">Pular ⏭</button>
                <div class="cena-dica">clique para continuar ▸</div>
            </div>`;
            const el = raiz.firstElementChild;
            const palco = el.querySelector('.cena-palco');
            const canvas = el.querySelector('canvas');
            const pontos = el.querySelectorAll('.cena-pontos i');
            Cena.ativa = true;
            // avisos de conquista que já estavam na tela voltam depois da cena
            document.querySelectorAll('#conquistas .toast-conquista').forEach(t => {
                t.remove();
                if (t._conquista) UI.conquista(t._conquista);
            });
            let i = -1, timer = null, desde = 0, fim = false;

            const acabar = () => {
                if (fim) return;
                fim = true;
                clearTimeout(timer);
                document.removeEventListener('keydown', tecla, true);
                Cena.pararConfete();
                el.classList.add('saindo');
                setTimeout(() => { raiz.innerHTML = ''; Cena.ativa = false; resolve(); }, 380);
            };
            const proximo = () => {
                clearTimeout(timer);
                i++;
                if (i >= slides.length) return acabar();
                const sl = slides[i];
                pontos.forEach((p, k) => p.classList.toggle('ativo', k <= i));
                el.style.background = sl.fundo || '#05070c';
                palco.innerHTML = `<div class="cena-slide ${sl.classe || ''}">${sl.html}</div>`;
                desde = Date.now();
                if (sl.som) Som.tocar(sl.som);
                if (sl.confete) Cena.confete(canvas, sl.confete, sl.qtdConfete);
                Cena.animarContadores(palco);
                if (sl.depois) sl.depois(palco);
                if (sl.auto) timer = setTimeout(proximo, sl.auto);
            };
            const tecla = e => {
                if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); acabar(); }
                else if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault(); e.stopPropagation();
                    if (Date.now() - desde > 450) proximo();
                }
            };
            el.addEventListener('click', e => {
                if (e.target.closest('.cena-pular')) return acabar();
                if (Date.now() - desde < 450) return;
                proximo();
            });
            document.addEventListener('keydown', tecla, true);
            Som.tocar('cena');
            proximo();
        });
    },

    animarContadores(raiz) {
        raiz.querySelectorAll('[data-alvo]').forEach(e => {
            const alvo = parseFloat(e.dataset.alvo), casas = +(e.dataset.casas || 0);
            const ini = performance.now(), dur = 1100;
            const passo = agora => {
                const k = Math.min(1, (agora - ini) / dur);
                const v = alvo * (1 - Math.pow(1 - k, 3));
                e.textContent = casas ? v.toFixed(casas).replace('.', ',') : Math.round(v);
                if (k < 1 && document.body.contains(e)) requestAnimationFrame(passo);
            };
            requestAnimationFrame(passo);
        });
    },

    // ------------------------------------------------------------------
    //  Confete em canvas
    // ------------------------------------------------------------------
    _anim: null,
    confete(canvas, cores, qtd = 170) {
        if (!canvas) return;
        Cena.pararConfete();
        const r = canvas.parentElement.getBoundingClientRect();
        canvas.width = r.width; canvas.height = r.height;
        const ctx = canvas.getContext('2d');
        const ps = [];
        for (let i = 0; i < qtd; i++) {
            ps.push({
                x: canvas.width / 2 + U.rand(-80, 80), y: canvas.height * 0.45,
                vx: U.rand(-9, 9), vy: U.rand(-16, -4), g: U.rand(0.25, 0.4),
                w: U.rand(6, 12), h: U.rand(8, 16), a: U.rand(0, 6.28), va: U.rand(-0.3, 0.3),
                cor: U.escolha(cores),
            });
        }
        const ini = performance.now();
        const loop = agora => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            for (const p of ps) {
                p.vy += p.g; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.a += p.va;
                ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a);
                ctx.fillStyle = p.cor; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.a)));
                ctx.restore();
            }
            if (agora - ini < 4500) Cena._anim = requestAnimationFrame(loop);
            else ctx.clearRect(0, 0, canvas.width, canvas.height);
        };
        Cena._anim = requestAnimationFrame(loop);
    },

    pararConfete() {
        if (Cena._anim) cancelAnimationFrame(Cena._anim);
        Cena._anim = null;
    },

    // ------------------------------------------------------------------
    //  Peças visuais
    // ------------------------------------------------------------------
    escudo(t, classe = '') {
        return `<div class="escudo-cena ${classe}" style="background:${t.c1};color:${U.corTexto(t.c1)};border-color:${t.c2}">${U.esc(t.sigla)}</div>`;
    },

    camisa(t, nome, numero) {
        return `<div class="camisa-cena" style="--c1:${t.c1};--c2:${t.c2};color:${U.corTexto(t.c1)}">
            <span class="cm-nome">${U.esc(nome.split(' ').slice(-1)[0].toUpperCase())}</span><b>${numero}</b></div>`;
    },

    cartao(linhas) {
        return `<div class="cena-cartao">${linhas.map(([a, b], i) => `<div class="cc-linha" style="animation-delay:${0.25 + i * 0.15}s"><span>${a}</span><b>${b}</b></div>`).join('')}</div>`;
    },

    // ------------------------------------------------------------------
    //  Cutscenes prontas
    // ------------------------------------------------------------------

    // Assinatura com um clube novo (técnico ou jogador)
    novoClube(s, t, info) {
        const liga = Mundo.liga(s, t.liga);
        const cores = [t.c1, t.c2, '#ffd700', '#ffffff'];
        const titulo = info.papel === 'tecnico' ? 'NOVO TÉCNICO' : 'NOVO REFORÇO';
        return Cena.mostrar([
            {
                fundo: 'radial-gradient(ellipse at 50% 120%, #17402a 0%, #05070c 70%)', classe: 'cs-estadio', auto: 2600, som: 'torcida',
                html: `<div class="holofotes"><i></i><i></i></div><div class="flashes">${'<i></i>'.repeat(16)}</div>
                    <div class="cena-mini">📸 Apresentação oficial</div>
                    <div class="cena-titulo">${titulo}</div>
                    <div class="cena-sub">${Mundo.pais(t.pais).bandeira} ${U.esc(liga.nome)}</div>`,
            },
            {
                fundo: `radial-gradient(circle at 50% 42%, ${t.c1} 0%, #05070c 72%)`, classe: 'cs-escudo', som: 'impacto', confete: cores,
                html: `<div class="raios"></div>${Cena.escudo(t, 'gira-entra')}
                    <div class="cena-titulo">BEM-VINDO AO ${U.esc(t.nome.toUpperCase())}!</div>
                    <div class="cena-sub">${info.papel === 'tecnico' ? `${U.esc(info.nome)} assume o comando` : `${U.esc(info.nome)} veste a camisa`}</div>`,
            },
            {
                fundo: `linear-gradient(160deg, ${t.c1} 0%, #0b1220 62%)`, classe: 'cs-info',
                html: `${info.papel === 'tecnico' ? '<div class="prancheta">📋</div>' : Cena.camisa(t, info.nome, info.camisa || 10)}
                    ${Cena.cartao(info.linhas || [])}
                    <div class="cena-sub">${info.frase || 'Que comece a história!'}</div>`,
            },
        ]);
    },

    // Fim de uma temporada e começo da próxima
    temporada(s, r, dados) {
        const meu = dados.tid;
        const tMeu = meu >= 0 ? s.times[meu] : null;
        const ligaMeu = dados.ligaId ? r.campeoes.find(c => c.ligaId === dados.ligaId) : null;
        const sub = meu >= 0 ? r.subiram.find(x => x.tid === meu) : null;
        const des = meu >= 0 ? r.desceram.find(x => x.tid === meu) : null;
        const principais = r.campeoes.filter(c => c.nivel === 1);
        const premios = r.premios.filter(p => /Bola de Ouro|Revelação|Luva|Técnico do Ano/.test(p.tipo) || (dados.ligaCurto && p.tipo.includes(dados.ligaCurto)));
        const campeaoMeu = ligaMeu && ligaMeu.tid === meu;
        // copas internacionais sempre; nacionais e supercopas só do seu país (ou se você ganhou)
        const copas = r.copas.filter(c => !c.pais || (tMeu && c.pais === tMeu.pais) || c.tid === meu);
        const slides = [
            {
                fundo: 'linear-gradient(180deg, #ff8a3d 0%, #7a2f6f 45%, #0b1220 100%)', classe: 'cs-fim', som: 'apitoFinal', auto: 2800,
                html: `<div class="sol"></div><div class="cena-mini">🏁 Apito final</div>
                    <div class="cena-titulo">FIM DA TEMPORADA</div><div class="ano-grande">${r.ano}</div>`,
            },
            dados.html ? {
                fundo: tMeu ? `linear-gradient(135deg, ${tMeu.c1} 0%, #0b1220 70%)` : 'linear-gradient(135deg, #1c2a48, #0b1220)', classe: 'cs-resumo', som: 'virar',
                html: `<div class="cena-mini">📊 Sua temporada</div>${dados.html}`,
            } : null,
            {
                fundo: 'radial-gradient(circle at 50% 30%, #3a2a00 0%, #05070c 70%)', classe: 'cs-campeoes', som: campeaoMeu ? 'titulo' : 'torcida',
                confete: campeaoMeu ? [tMeu.c1, tMeu.c2, '#ffd700'] : null,
                html: `<div class="cena-mini">🏆 Os campeões de ${r.ano}</div>
                    ${ligaMeu ? `<div class="campeao-destaque">${Cena.escudo(s.times[ligaMeu.tid], 'pulsa')}<div><small>${U.esc(ligaMeu.liga)}</small><b>${U.esc(s.times[ligaMeu.tid].nome)}</b></div></div>` : ''}
                    <div class="grade-campeoes">${principais.filter(c => c !== ligaMeu).map((c, i) => `<div class="gc-item" style="animation-delay:${0.3 + i * 0.08}s">${UI.escudo(s.times[c.tid])}<span><small>${U.esc(c.liga)}</small>${U.esc(s.times[c.tid].nome)}</span></div>`).join('')}
                    ${copas.map((c, i) => `<div class="gc-item copa" style="animation-delay:${0.3 + (principais.length + i) * 0.08}s">${UI.escudo(s.times[c.tid])}<span><small>${c.icone} ${U.esc(c.nome)}</small>${U.esc(s.times[c.tid].nome)}</span></div>`).join('')}</div>`,
            },
            premios.length ? {
                fundo: 'radial-gradient(circle at 50% 20%, #5a4300 0%, #0b0a05 70%)', classe: 'cs-premios', som: 'conquista',
                html: `<div class="cena-mini">🏅 Prêmios da temporada</div>
                    <div class="grade-premios">${premios.slice(0, 6).map((p, i) => `<div class="premio ${i === 0 ? 'ouro' : ''} ${dados.ehMeu(p) ? 'meu' : ''}" style="animation-delay:${0.2 + i * 0.18}s">
                        <span class="pr-icone">${/Bola/.test(p.tipo) ? '⚽' : /Luva/.test(p.tipo) ? '🧤' : /Revela/.test(p.tipo) ? '🌟' : /Técnico/.test(p.tipo) ? '📋' : '👟'}</span>
                        <small>${U.esc(p.tipo)}</small><b>${U.esc(p.nome)}</b><span class="cinza">${p.tid >= 0 && s.times[p.tid] ? U.esc(s.times[p.tid].nome) : ''}</span></div>`).join('')}</div>`,
            } : null,
            sub ? {
                fundo: 'radial-gradient(circle at 50% 40%, #0f6b33 0%, #05070c 70%)', classe: 'cs-acesso', som: 'titulo', confete: [tMeu.c1, tMeu.c2, '#22c55e'],
                html: `<div class="seta-sobe">⬆️</div><div class="cena-titulo">ACESSO!</div><div class="cena-sub">O ${U.esc(tMeu.nome)} vai disputar a ${U.esc(sub.liga)}!</div>`,
            } : null,
            des ? {
                fundo: 'radial-gradient(circle at 50% 40%, #6b0f0f 0%, #05070c 70%)', classe: 'cs-rebaixa', som: 'triste',
                html: `<div class="seta-desce">⬇️</div><div class="cena-titulo">REBAIXADO</div><div class="cena-sub">O ${U.esc(tMeu.nome)} vai jogar a ${U.esc(des.liga)}. Hora de dar a volta por cima.</div>`,
            } : null,
            {
                fundo: 'radial-gradient(circle at 50% 50%, #12304a 0%, #05070c 75%)', classe: 'cs-novo-ano', som: 'impacto',
                html: `<div class="cena-mini">📅 Uma nova jornada</div>
                    <div class="flip"><span class="velho">${r.ano}</span><span class="novo">${r.ano + 1}</span></div>
                    <div class="cena-titulo">TEMPORADA ${r.ano + 1}</div>
                    <div class="cena-sub">${U.esc(dados.frase || 'Que comecem os jogos!')}</div>`,
            },
        ];
        return Cena.mostrar(slides);
    },

    // Levantando uma taça
    titulo(nomeComp, t, sub) {
        const cores = [t.c1, t.c2, '#ffd700', '#ffffff'];
        return Cena.mostrar([
            {
                fundo: `radial-gradient(circle at 50% 60%, ${t.c1} 0%, #05070c 70%)`, classe: 'cs-titulo', som: 'titulo', confete: cores, qtdConfete: 260,
                html: `<div class="raios dourado"></div><div class="trofeu-sobe">🏆</div>
                    <div class="cena-titulo brilho">CAMPEÃO!</div>
                    <div class="cena-sub">${U.esc(nomeComp)}</div>`,
            },
            {
                fundo: `linear-gradient(160deg, ${t.c1} 0%, #0b1220 65%)`, classe: 'cs-titulo2', confete: cores,
                html: `${Cena.escudo(t, 'gira-entra')}<div class="cena-titulo">${U.esc(t.nome.toUpperCase())}</div>
                    <div class="cena-sub">${U.esc(sub || 'A festa vai varar a madrugada!')}</div>`,
            },
        ]);
    },

    // Antes de clássicos e finais
    duelo(rotulo, th, ta, sub) {
        return Cena.mostrar([{
            fundo: '#05070c', classe: 'cs-duelo', som: 'impacto', auto: 2600,
            html: `<div class="duelo-lado esq" style="background:linear-gradient(120deg, ${th.c1}, ${th.c1}cc)">${Cena.escudo(th)}<b>${U.esc(th.nome)}</b></div>
                <div class="duelo-lado dir" style="background:linear-gradient(300deg, ${ta.c1}, ${ta.c1}cc)">${Cena.escudo(ta)}<b>${U.esc(ta.nome)}</b></div>
                <div class="duelo-vs">VS</div>
                <div class="duelo-rotulo">${rotulo}</div>
                ${sub ? `<div class="duelo-sub">${U.esc(sub)}</div>` : ''}`,
        }]);
    },

    // Um slide simples (aposentadoria, demissão, momentos marcantes)
    simples(icone, titulo, sub, fundo, som, confete) {
        return Cena.mostrar([{
            fundo: fundo || 'radial-gradient(circle at 50% 40%, #1c2a48 0%, #05070c 70%)', classe: 'cs-simples', som, confete,
            html: `<div class="icone-grande">${icone}</div><div class="cena-titulo">${titulo}</div><div class="cena-sub">${sub || ''}</div>`,
        }]);
    },
};

// =====================================================================
//  Efeitos rápidos (não bloqueiam o jogo)
// =====================================================================
const Efeitos = {
    ligado() {
        return typeof Jogo === 'undefined' || Jogo.opcoes.animacoes !== false;
    },

    // ondinha no lugar do clique
    ripple(el, x, y) {
        if (!Efeitos.ligado()) return;
        const r = el.getBoundingClientRect();
        const escala = r.width / (el.offsetWidth || r.width || 1);
        const d = document.createElement('span');
        d.className = 'ripple';
        const tam = Math.max(el.offsetWidth, el.offsetHeight) * 2;
        d.style.width = d.style.height = tam + 'px';
        d.style.left = ((x - r.left) / escala - tam / 2) + 'px';
        d.style.top = ((y - r.top) / escala - tam / 2) + 'px';
        el.appendChild(d);
        setTimeout(() => d.remove(), 600);
    },

    // GOOOL gigante na tela da partida
    gol(t, nosso) {
        if (!Efeitos.ligado()) return;
        const d = document.createElement('div');
        d.className = 'gol-overlay ' + (nosso ? 'nosso' : 'deles');
        d.style.setProperty('--c1', t.c1);
        d.style.setProperty('--c2', t.c2);
        d.innerHTML = `<span>GOOOL!</span><small>${U.esc(t.nome)}</small>`;
        document.getElementById('jogo').appendChild(d);
        setTimeout(() => d.remove(), 1700);
    },

    // texto que sobe e some (ex.: +€ 10 mil)
    flutuar(alvo, texto, classe = '') {
        if (!Efeitos.ligado() || !alvo) return;
        const d = document.createElement('span');
        d.className = 'flutua ' + classe;
        d.textContent = texto;
        alvo.appendChild(d);
        setTimeout(() => d.remove(), 1500);
    },
};

// Clique: ondinha + som em tudo que é botão
const SELETOR_CLICAVEL = '.btn, .aba, .chip-btn, .atividade, .card-clube, .card-modo, .item-loja, .jog-escalar, .btn-icone, .cand-base, .hab';
document.addEventListener('pointerdown', e => {
    const el = e.target.closest(SELETOR_CLICAVEL);
    if (!el || el.disabled) return;
    if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
    Efeitos.ripple(el, e.clientX, e.clientY);
    Som.tocar(el.classList.contains('aba') ? 'aba' : 'clique');
});
