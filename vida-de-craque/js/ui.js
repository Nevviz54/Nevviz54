'use strict';
// =====================================================================
//  Interface: modais, avisos, componentes reutilizáveis e cliques
// =====================================================================

// Todas as ações de botões ficam registradas aqui: <button data-acao="nome">
const ACOES = {};

document.addEventListener('click', e => {
    const b = e.target.closest('[data-acao]');
    if (!b || b.disabled) return;
    const fn = ACOES[b.dataset.acao];
    if (fn) {
        e.preventDefault();
        fn(b.dataset, b, e);
    }
});
document.addEventListener('change', e => {
    const b = e.target.closest('[data-mudar]');
    if (!b) return;
    const fn = ACOES[b.dataset.mudar];
    if (fn) fn(b.dataset, b, e);
});

const UI = {
    app: () => document.getElementById('app'),

    render(html) {
        UI.app().innerHTML = html;
    },

    // ---------------------------------------------------------------
    //  Modal genérico. Devolve uma Promise com o valor do botão clicado
    // ---------------------------------------------------------------
    modal({ titulo = '', html = '', botoes = [{ txt: 'OK', valor: true }], fechavel = true, largo = false, classe = '' }) {
        return new Promise(resolve => {
            const raiz = document.getElementById('modais');
            const fundo = document.createElement('div');
            fundo.className = 'modal-fundo';
            fundo.innerHTML = `
                <div class="modal ${largo ? 'modal-largo' : ''} ${classe}">
                    ${titulo ? `<div class="modal-titulo">${titulo}</div>` : ''}
                    <div class="modal-corpo">${html}</div>
                    ${botoes.length ? `<div class="modal-botoes">${botoes.map((b, i) =>
                        `<button class="btn ${b.classe || (i === 0 ? 'btn-primario' : '')}" data-i="${i}" ${b.desativado ? 'disabled' : ''}>${b.txt}</button>`).join('')}</div>` : ''}
                </div>`;
            const fechar = valor => {
                fundo.remove();
                document.removeEventListener('keydown', tecla);
                resolve(valor);
            };
            const tecla = e => {
                if (e.key === 'Escape' && fechavel) { e.stopPropagation(); fechar(null); }
            };
            fundo.addEventListener('click', e => {
                const b = e.target.closest('.modal-botoes [data-i]');
                if (b) {
                    const bt = botoes[+b.dataset.i];
                    if (bt.antes && bt.antes(fundo) === false) return;
                    fechar(bt.valor !== undefined ? bt.valor : +b.dataset.i);
                } else if (e.target === fundo && fechavel) fechar(null);
            });
            document.addEventListener('keydown', tecla);
            raiz.appendChild(fundo);
            fundo._fechar = fechar;
            const foco = fundo.querySelector('input, select');
            if (foco) foco.focus();
        });
    },

    fecharModais() {
        document.querySelectorAll('#modais .modal-fundo').forEach(m => m._fechar ? m._fechar(null) : m.remove());
    },

    // Pergunta com opções (estilo BitLife)
    async perguntar(titulo, texto, opcoes, icone = '') {
        const i = await UI.modal({
            titulo: `${icone ? `<span class="modal-icone">${icone}</span>` : ''}${titulo}`,
            html: `<p class="texto-evento">${texto}</p>`,
            botoes: opcoes.map((o, k) => ({ txt: typeof o === 'string' ? o : o.txt, valor: k, classe: 'btn-opcao' })),
            fechavel: false,
            classe: 'modal-evento',
        });
        return i;
    },

    async aviso(titulo, texto, icone = '') {
        await UI.modal({
            titulo: `${icone ? `<span class="modal-icone">${icone}</span>` : ''}${titulo}`,
            html: `<p class="texto-evento">${texto}</p>`,
            botoes: [{ txt: 'OK', valor: true }],
        });
    },

    async confirmar(texto, sim = 'Sim', nao = 'Cancelar') {
        const r = await UI.modal({ html: `<p class="texto-evento">${texto}</p>`, botoes: [{ txt: sim, valor: true }, { txt: nao, valor: false, classe: 'btn-fantasma' }] });
        return r === true;
    },

    toast(txt, tipo = '') {
        const raiz = document.getElementById('toasts');
        const d = document.createElement('div');
        d.className = 'toast ' + tipo;
        d.innerHTML = txt;
        raiz.appendChild(d);
        setTimeout(() => d.classList.add('sumindo'), 2600);
        setTimeout(() => d.remove(), 3200);
    },

    // ---------------------------------------------------------------
    //  Componentes
    // ---------------------------------------------------------------
    escudo(t, grande) {
        if (!t) return '<span class="escudo escudo-vazio">—</span>';
        return `<span class="escudo ${grande ? 'escudo-grande' : ''}" style="background:${t.c1};color:${U.corTexto(t.c1)};border-color:${t.c2}">${U.esc(t.sigla)}</span>`;
    },

    time(s, tid, curto) {
        const t = s.times[tid];
        if (!t) return '<span class="cinza">Sem clube</span>';
        return `<a class="link-time" data-acao="verTime" data-tid="${tid}">${UI.escudo(t)} ${U.esc(curto ? t.sigla : t.nome)}</a>`;
    },

    jogador(p) {
        return `<a class="link-jog ${p.user ? 'eu' : ''}" data-acao="verJogador" data-pid="${p.id}">${U.esc(p.nome)}</a>`;
    },

    ovr(o) {
        return `<span class="ovr ${U.corOvr(o)}">${o}</span>`;
    },

    pos(p) {
        return `<span class="pos pos-${POS_GRUPO[p]}">${p}</span>`;
    },

    barra(rotulo, valor, icone, cor) {
        const v = U.clamp(Math.round(valor), 0, 100);
        const c = cor || (v >= 70 ? 'verde' : v >= 40 ? 'amarelo' : 'vermelho');
        return `<div class="stat-barra">
            <div class="stat-rotulo"><span>${icone || ''} ${rotulo}</span><b>${v}%</b></div>
            <div class="stat-fundo"><div class="stat-preenche ${c}" style="width:${v}%"></div></div>
        </div>`;
    },

    nota(n) {
        if (n == null || isNaN(n)) return '<span class="nota">-</span>';
        const c = n >= 8 ? 'n-otima' : n >= 7 ? 'n-boa' : n >= 6 ? 'n-media' : 'n-ruim';
        return `<span class="nota ${c}">${n.toFixed(1)}</span>`;
    },

    forma(ult) {
        return `<span class="forma">${(ult || []).map(r => `<i class="f-${r}">${r}</i>`).join('')}</span>`;
    },

    dataJogo(s) {
        return `Temporada ${s.ano} · Semana ${Math.min(s.semana + 1, TOTAL_SEMANAS)}/${TOTAL_SEMANAS}`;
    },

    // Tabela de classificação de uma liga
    tabela(s, liga, destaque, compacta) {
        const cl = Mundo.classificacao(s, liga);
        const ligasPais = s.ligas.filter(l => l.pais === liga.pais).sort((a, b) => a.nivel - b.nivel);
        const idx = ligasPais.indexOf(liga);
        const sobe = idx > 0 ? ligasPais[idx - 1].troca : 0;
        const desce = liga.troca;
        let vagasCopa = 0;
        for (const c of COPAS_DEF) if (c.vagas[liga.id]) vagasCopa = c.vagas[liga.id];
        let linhas = cl;
        if (compacta) {
            const pos = cl.indexOf(destaque);
            const ini = U.clamp(pos - 3, 0, Math.max(0, cl.length - 7));
            linhas = cl.slice(ini, ini + 7);
        }
        return `<table class="tabela ${compacta ? 'compacta' : ''}">
            <thead><tr><th>#</th><th class="esq">Time</th><th>P</th><th>J</th>${compacta ? '' : '<th>V</th><th>E</th><th>D</th><th>GP</th><th>GC</th>'}<th>SG</th>${compacta ? '' : '<th>Forma</th>'}</tr></thead>
            <tbody>${linhas.map(tid => {
            const i = cl.indexOf(tid), r = liga.tab[tid];
            let zona = '';
            if (i < sobe || (liga.nivel === 1 && i === 0)) zona = 'z-sobe';
            if (liga.nivel === 1 && i < vagasCopa) zona = 'z-copa';
            if (liga.nivel === 1 && i === 0) zona = 'z-campeao';
            if (sobe && i < sobe) zona = 'z-sobe';
            if (desce && i >= cl.length - desce) zona = 'z-desce';
            return `<tr class="${zona} ${tid === destaque ? 'destaque' : ''}">
                    <td>${i + 1}</td><td class="esq">${UI.time(s, tid)}</td><td><b>${r.pts}</b></td><td>${r.j}</td>
                    ${compacta ? '' : `<td>${r.v}</td><td>${r.e}</td><td>${r.d}</td><td>${r.gp}</td><td>${r.gc}</td>`}
                    <td>${r.gp - r.gc}</td>${compacta ? '' : `<td>${UI.forma(r.ult)}</td>`}</tr>`;
        }).join('')}</tbody></table>`;
    },
};
