'use strict';
// =====================================================================
//  TELA DA PARTIDA AO VIVO
// =====================================================================

const VELOCIDADES = { 1: 650, 2: 300, 3: 120, 4: 35 };

const TelaPartida = {
    m: null, jogo: null, timer: null, fase: 'pre', resolve: null, rodando: false,

    jogar(s, jogo) {
        return new Promise(resolve => {
            this.resolve = resolve;
            this.jogo = jogo;
            this.criarPartida(s);
            this.fase = 'pre';
            this.resultado = null;
            this.extraFim = '';
            this.vistos = 0;
            this.render();
        });
    },

    criarPartida(s) {
        const jogo = this.jogo;
        const opts = {};
        if (s.modo === 'tecnico') opts.controle = jogo.h === s.car.tid ? 0 : 1;
        else opts.usuario = s.car.pid;
        this.m = Partida.criar(s, jogo, opts);
    },

    ativo() {
        return !!this.m && this.fase !== 'fora';
    },

    situacaoUsuario() {
        const m = this.m;
        if (m.usuario == null) return null;
        if (m.esc.some(e => e.includes(m.usuario))) return 'titular';
        if (m.banco.some(b => b.includes(m.usuario))) return 'banco';
        return 'fora';
    },

    // ---------------------------------------------------------------
    render() {
        const m = this.m, s = m.s;
        const th = s.times[m.h], ta = s.times[m.a];
        const comp = Mundo.nomeCompeticao(s, this.jogo.comp) + (this.jogo.tipo === 'copa' ? ` · ${FASES_COPA[this.jogo.r]}` : ` · Rodada ${this.jogo.r + 1}`);
        UI.render(`
        <div class="tela-partida">
            <div class="placar">
                <div class="placar-time">${UI.escudo(th, true)}<span>${U.esc(th.nome)}</span><small>${th.form} · ${ESTILOS[m.estilo[0]].nome}</small></div>
                <div class="placar-centro">
                    <div class="placar-comp">${U.esc(comp)}</div>
                    <div class="placar-gols" id="pl-gols">${m.gols[0]} <i>x</i> ${m.gols[1]}</div>
                    <div class="placar-min" id="pl-min">${this.textoMin()}</div>
                </div>
                <div class="placar-time">${UI.escudo(ta, true)}<span>${U.esc(ta.nome)}</span><small>${ta.form} · ${ESTILOS[m.estilo[1]].nome}</small></div>
            </div>
            <div class="barra-tempo"><div id="pl-barra" style="width:${m.min / 90 * 100}%"></div></div>
            <div class="partida-corpo">
                <div class="partida-lado" id="pl-lado0">${this.lado(0)}</div>
                <div class="partida-centro">
                    <div class="partida-stats" id="pl-stats">${this.stats()}</div>
                    <div class="partida-eventos" id="pl-eventos">${this.eventos()}</div>
                </div>
                <div class="partida-lado" id="pl-lado1">${this.lado(1)}</div>
            </div>
            <div class="partida-controles" id="pl-controles">${this.controles()}</div>
        </div>`);
    },

    atualizar() {
        const m = this.m;
        const set = (id, html) => { const e = document.getElementById(id); if (e) e.innerHTML = html; };
        set('pl-gols', `${m.gols[0]} <i>x</i> ${m.gols[1]}`);
        set('pl-min', this.textoMin());
        set('pl-lado0', this.lado(0));
        set('pl-lado1', this.lado(1));
        set('pl-stats', this.stats());
        set('pl-eventos', this.eventos());
        set('pl-controles', this.controles());
        const b = document.getElementById('pl-barra');
        if (b) b.style.width = `${m.min / 90 * 100}%`;
    },

    textoMin() {
        const m = this.m;
        if (this.fase === 'pre') return 'Pré-jogo';
        if (m.terminou) return 'Encerrado';
        if (m.min === 45 && !this.rodando) return 'Intervalo';
        return `${m.min}'`;
    },

    lado(lado) {
        const m = this.m, s = m.s;
        const linha = (pid, slot) => {
            const p = s.jog[pid], st = m.st[pid];
            let ic = '';
            if (st) {
                ic += '⚽'.repeat(st.g) + '🅰️'.repeat(st.a);
                if (st.am === 1 && !st.vm) ic += '🟨';
                if (st.vm) ic += '🟥';
                if (st.les) ic += '🚑';
                if (st.entrou > 0) ic += '🔼';
                if (st.saiu != null && !st.vm) ic += '🔽';
            }
            return `<div class="pl-jog ${p.user ? 'eu' : ''} ${st && st.saiu != null ? 'saiu' : ''}">
                ${UI.pos(slot || p.pos)}<span class="pl-nome">${U.esc(p.nome)}</span>${UI.ovr(p.ovr)}<span class="pl-ic">${ic}</span></div>`;
        };
        const campo = m.esc[lado].map((pid, i) => pid != null ? linha(pid, m.slots[lado][i]) : `<div class="pl-jog vazio">${UI.pos(m.slots[lado][i])}<span class="pl-nome">— (vago)</span></div>`).join('');
        const sairam = Object.entries(m.st).filter(([pid, st]) => st.lado === lado && st.saiu != null && !m.esc[lado].includes(+pid)).map(([pid]) => linha(+pid)).join('');
        const banco = m.banco[lado].map(pid => linha(pid)).join('');
        return `<div class="pl-titulo">Em campo</div>${campo}
            ${sairam ? `<div class="pl-titulo">Saíram</div>${sairam}` : ''}
            <div class="pl-titulo">Banco (${m.subs[lado]}/5 trocas)</div><div class="pl-banco">${banco || '<small class="cinza">vazio</small>'}</div>`;
    },

    stats() {
        const m = this.m;
        const total = m.posse[0] + m.posse[1];
        const p0 = Math.round(m.posse[0] / total * 100);
        const linha = (rot, a, b) => `<div class="ps-linha"><b>${a}</b><span>${rot}</span><b>${b}</b></div>`;
        const forca = lado => Math.round((m.R[lado].ata + m.R[lado].def) / 2);
        return linha('Posse de bola', p0 + '%', (100 - p0) + '%') + linha('Finalizações', m.fin[0], m.fin[1]) + linha('Força em campo', forca(0), forca(1));
    },

    eventos() {
        const m = this.m;
        const evs = m.eventos.slice().reverse();
        if (!evs.length) {
            if (this.fase === 'pre') return this.preJogo();
            return '<div class="ev ev-apito">⚽ A bola vai rolar!</div>';
        }
        const vistos = this.vistos || 0;
        this.vistos = m.eventos.length;
        const total = m.eventos.length;
        return evs.map((e, i) => `<div class="ev ev-${e.tipo} ${total - i > vistos ? 'ev-novo' : ''}"><span class="ev-min">${e.min}'</span> ${U.esc(e.txt)}</div>`).join('');
    },

    preJogo() {
        const m = this.m, s = m.s;
        let txt = '';
        if (s.modo === 'jogador') {
            const sit = this.situacaoUsuario();
            const p = s.jog[s.car.pid];
            if (p.les > 0) txt = `🚑 Você está lesionado (${p.les} semana(s) fora) e vai assistir da arquibancada.`;
            else if (p.susp > 0) txt = '🟥 Você está suspenso e não pode jogar.';
            else if (sit === 'titular') txt = '✅ Você é <b>TITULAR</b> hoje! Fique atento: em alguns lances você vai decidir o que fazer.';
            else if (sit === 'banco') txt = '🪑 Você começa no <b>banco de reservas</b>. Pode entrar no segundo tempo.';
            else txt = '😕 O técnico não te relacionou para este jogo.';
        } else {
            const lado = m.controle;
            const adv = s.times[lado === 0 ? m.a : m.h];
            const rel = Math.round((m.R[lado].ata + m.R[lado].def) / 2) - Math.round((m.R[1 - lado].ata + m.R[1 - lado].def) / 2);
            txt = `📋 Seu time vai a campo no <b>${s.times[s.car.tid].form}</b>, estilo <b>${ESTILOS[m.estilo[lado]].nome}</b>.<br>
                ${rel > 3 ? '💪 Seu time é favorito.' : rel < -3 ? `⚠️ O ${U.esc(adv.nome)} é favorito.` : '⚖️ Jogo equilibrado.'}`;
        }
        return `<div class="pre-jogo">${txt}</div>`;
    },

    controles() {
        const m = this.m, s = m.s;
        if (this.fase === 'pre') {
            const fora = s.modo === 'jogador' && this.situacaoUsuario() === 'fora';
            return `${s.modo === 'tecnico' ? '<button class="btn" data-acao="plTatica">📋 Alterar tática</button>' : ''}
                <button class="btn btn-primario btn-grande" data-acao="plComecar">▶ ${fora ? 'Assistir ao jogo' : 'Começar partida'}</button>
                <button class="btn" data-acao="plSimular">⏩ Simular resultado</button>`;
        }
        if (this.fase === 'fim') {
            return `<div class="resumo-fim">${this.resumoFim()}</div><button class="btn btn-primario btn-grande" data-acao="plSair">Continuar ▶</button>`;
        }
        const vel = Jogo.opcoes.velocidade;
        let html = `<button class="btn ${this.rodando ? '' : 'btn-primario'}" data-acao="plPausar">${this.rodando ? '⏸ Pausar' : '▶ Continuar'}</button>
            <div class="vel">${[1, 2, 3, 4].map(v => `<button class="btn btn-pequeno ${vel === v ? 'ativo' : ''}" data-acao="plVel" data-v="${v}">${['', '1x', '2x', '4x', '8x'][v]}</button>`).join('')}</div>`;
        if (m.controle >= 0) {
            html += `<button class="btn" data-acao="plSub" ${m.subs[m.controle] >= 5 ? 'disabled' : ''}>🔁 Substituir (${m.subs[m.controle]}/5)</button>
                <select data-mudar="plEstilo" class="sel">${Object.entries(ESTILOS).map(([k, e]) => `<option value="${k}" ${m.estilo[m.controle] === k ? 'selected' : ''}>${e.nome}</option>`).join('')}</select>`;
        }
        html += '<button class="btn btn-fantasma" data-acao="plPular">⏭ Pular para o fim</button>';
        return html;
    },

    resumoFim() {
        const m = this.m, s = m.s, r = this.resultado;
        if (!r) return '';
        const melhor = s.jog[r.melhor];
        let html = `<div class="rf-linha">⭐ Melhor em campo: <b>${melhor ? U.esc(melhor.nome) : '-'}</b> ${melhor ? UI.nota(r.notas[r.melhor]) : ''}</div>`;
        if (r.pen) html += `<div class="rf-linha">🥅 Pênaltis: ${r.pen}</div>`;
        if (s.modo === 'jogador') {
            const n = r.notas[s.car.pid];
            html += n != null ? `<div class="rf-linha">📝 Sua nota: ${UI.nota(n)}</div>` : '<div class="rf-linha">Você não entrou em campo.</div>';
        } else {
            const lado = m.controle;
            const notas = Object.entries(m.st).filter(([, st]) => st.lado === lado).map(([pid]) => s.jog[pid]).filter(Boolean)
                .sort((a, b) => (r.notas[b.id] || 0) - (r.notas[a.id] || 0));
            html += `<div class="rf-notas">${notas.map(p => `<span>${U.esc(p.nome.split(' ').slice(-1)[0])} ${UI.nota(r.notas[p.id])}</span>`).join('')}</div>`;
        }
        return html + (this.extraFim || '');
    },

    // ---------------------------------------------------------------
    //  Relógio do jogo
    // ---------------------------------------------------------------
    iniciar() {
        if (this.rodando || this.m.terminou) return;
        this.rodando = true;
        clearInterval(this.timer);
        this.timer = setInterval(() => this.tick(), VELOCIDADES[Jogo.opcoes.velocidade] || 300);
        this.atualizar();
    },

    parar() {
        this.rodando = false;
        clearInterval(this.timer);
        this.timer = null;
    },

    tick() {
        if (!this.rodando) return;
        const r = Partida.passo(this.m);
        if (r.pausa) this.parar();
        this.atualizar();
        if (r.eventos.some(e => e.tipo === 'gol')) {
            const g = document.getElementById('pl-gols');
            if (g) { g.classList.remove('pisca'); void g.offsetWidth; g.classList.add('pisca'); }
        }
        if (r.pausa === 'intervalo') this.intervalo();
        else if (r.pausa === 'lance') this.lance();
        else if (r.pausa === 'fim') this.fim();
    },

    async intervalo() {
        const m = this.m, s = m.s;
        if (m.controle >= 0) {
            const lado = m.controle;
            const t = s.times[s.car.tid];
            const dif = m.gols[lado] - m.gols[1 - lado];
            const i = await UI.perguntar('Intervalo — vestiário', `Placar: <b>${Partida.placarTxt(m)}</b>.<br>O que você fala para o time?`, ['👏 Elogiar o time', '😡 Dar uma bronca', '🧘 Pedir calma e foco'], '🗣️');
            let txt;
            if (i === 0) { const v = dif >= 0 ? 6 : -2; t.moral += v; txt = v > 0 ? 'O time voltou motivado!' : 'Os jogadores acharam estranho ser elogiados perdendo...'; }
            else if (i === 1) { const v = dif < 0 ? (U.chance(0.65) ? 8 : -5) : -4; t.moral += v; txt = v > 0 ? 'A bronca acordou o time!' : 'A bronca pegou mal no vestiário.'; }
            else { t.moral += 3; txt = 'O time voltou concentrado.'; }
            t.moral = U.clamp(t.moral, 5, 99);
            Partida.recalcular(m);
            Partida.evento(m, { tipo: 'apito', txt: `🗣️ ${txt}` });
            UI.toast(txt);
            this.iniciar();
        } else {
            setTimeout(() => { if (this.fase === 'jogo' && !this.pausaMenu) this.iniciar(); }, 900);
        }
    },

    async lance() {
        const m = this.m;
        const lance = Partida.sortearLance(m);
        const i = await UI.perguntar(`Seu lance! ${m.min}'`, lance.txt, lance.ops.map(o => o.txt), '⭐');
        const r = Partida.resolverLance(m, lance, i);
        this.atualizar();
        await UI.aviso(r.bom ? 'Boa!' : 'Que pena...', r.txt, r.bom ? '🔥' : '😓');
        if (m.min >= 90) this.fim();
        else this.iniciar();
    },

    async fim() {
        const m = this.m, s = m.s;
        if (this.resultado) return;
        this.parar();
        const r = Partida.finalizar(s, m);
        this.resultado = r;
        Mundo.registrar(s, this.jogo, r);
        this.fase = 'fim';
        this.atualizar();
        const modo = Jogo.modo();
        if (modo.posJogo) this.extraFim = (await modo.posJogo(s, this.jogo, m, r)) || '';
        this.atualizar();
    },

    sair() {
        this.parar();
        const res = this.resolve;
        this.m = null;
        this.fase = 'fora';
        this.resolve = null;
        if (res) res();
    },
};

ACOES.plComecar = () => { TelaPartida.fase = 'jogo'; TelaPartida.render(); TelaPartida.iniciar(); };
ACOES.plSimular = () => {
    TelaPartida.fase = 'jogo';
    Partida.simularAteOFim(TelaPartida.m);
    TelaPartida.render();
    TelaPartida.fim();
};
ACOES.plPular = () => {
    TelaPartida.parar();
    Partida.simularAteOFim(TelaPartida.m);
    TelaPartida.atualizar();
    TelaPartida.fim();
};
ACOES.plPausar = () => {
    if (TelaPartida.rodando) { TelaPartida.parar(); TelaPartida.atualizar(); } else TelaPartida.iniciar();
};
ACOES.plVel = d => {
    Jogo.opcoes.velocidade = +d.v;
    Salvar.gravarOpcoes(Jogo.opcoes);
    if (TelaPartida.rodando) { TelaPartida.parar(); TelaPartida.iniciar(); } else TelaPartida.atualizar();
};
ACOES.plEstilo = (d, el) => {
    const m = TelaPartida.m;
    m.estilo[m.controle] = el.value;
    m.s.times[m.s.car.tid].estilo = el.value;
    Partida.recalcular(m);
    Partida.evento(m, { tipo: 'apito', txt: `📋 Você mudou a postura do time para "${ESTILOS[el.value].nome}".` });
    TelaPartida.atualizar();
};
ACOES.plSub = async () => {
    const m = TelaPartida.m, s = m.s, lado = m.controle;
    if (m.subs[lado] >= 5 || !m.banco[lado].length) return UI.toast('Sem substituições disponíveis.', 'erro');
    const estava = TelaPartida.rodando;
    TelaPartida.parar();
    const campo = m.esc[lado].map((id, i) => id == null ? null : { p: s.jog[id], slot: m.slots[lado][i] }).filter(Boolean);
    const banco = m.banco[lado].map(id => s.jog[id]);
    let escolha = null;
    const r = await UI.modal({
        titulo: '🔁 Substituição',
        html: `<label class="campo">Sai:<select id="sub-sai" class="sel">${campo.map(c => `<option value="${c.p.id}">${c.slot} · ${U.esc(c.p.nome)} (${c.p.ovr})${m.st[c.p.id].am ? ' 🟨' : ''}</option>`).join('')}</select></label>
            <label class="campo">Entra:<select id="sub-entra" class="sel">${banco.map(p => `<option value="${p.id}">${p.pos} · ${U.esc(p.nome)} (${p.ovr})</option>`).join('')}</select></label>`,
        botoes: [{ txt: 'Confirmar', valor: 'ok', antes: f => { escolha = [+f.querySelector('#sub-sai').value, +f.querySelector('#sub-entra').value]; } }, { txt: 'Cancelar', valor: false, classe: 'btn-fantasma' }],
    });
    if (r === 'ok' && escolha) Partida.substituir(m, lado, escolha[0], escolha[1], false);
    TelaPartida.atualizar();
    if (estava) TelaPartida.iniciar();
};
ACOES.plTatica = async () => {
    const m = TelaPartida.m, s = m.s;
    const t = s.times[s.car.tid];
    let esc = null;
    const r = await UI.modal({
        titulo: '📋 Tática para o jogo',
        html: `<label class="campo">Formação:<select id="tt-form" class="sel">${Object.keys(FORMACOES).map(f => `<option ${t.form === f ? 'selected' : ''}>${f}</option>`).join('')}</select></label>
            <label class="campo">Estilo:<select id="tt-est" class="sel">${Object.entries(ESTILOS).map(([k, e]) => `<option value="${k}" ${t.estilo === k ? 'selected' : ''}>${e.nome}</option>`).join('')}</select></label>
            <p class="cinza">Mudar a formação refaz a escalação automaticamente. Para escolher os titulares um por um, use a aba <b>Tática</b> antes do jogo.</p>`,
        botoes: [{ txt: 'Aplicar', valor: 'ok', antes: f => { esc = [f.querySelector('#tt-form').value, f.querySelector('#tt-est').value]; } }, { txt: 'Cancelar', valor: false, classe: 'btn-fantasma' }],
    });
    if (r !== 'ok') return;
    if (esc[0] !== t.form) { t.form = esc[0]; t.tit = null; }
    t.estilo = esc[1];
    TelaPartida.criarPartida(s);
    TelaPartida.render();
};
ACOES.plSair = () => TelaPartida.sair();
