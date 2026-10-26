'use strict';
// =====================================================================
//  TELA DA PARTIDA AO VIVO
// =====================================================================

const VELOCIDADES = { 1: 650, 2: 300, 3: 120, 4: 35 };

const TelaPartida = {
    m: null, jogo: null, timer: null, fase: 'pre', resolve: null, rodando: false,

    jogar(s, jogo) {
        return new Promise(async resolve => {
            this.resolve = resolve;
            this.jogo = jogo;
            this.criarPartida(s);
            this.fase = 'pre';
            this.resultado = null;
            this.extraFim = '';
            this.vistos = 0;
            PartidaExtras.novaTela(this);   // [partida] modo destaques e estado da tela
            const m = this.m, th = s.times[m.h], ta = s.times[m.a];
            if (m.final) await Cena.duelo('🏆 GRANDE FINAL', th, ta, Mundo.nomeCompeticao(s, jogo.comp));
            else if (m.classico) await Cena.duelo('🔥 CLÁSSICO', th, ta, Mundo.nomeCompeticao(s, jogo.comp));
            this.render();
        });
    },

    criarPartida(s) {
        const jogo = this.jogo;
        const opts = {};
        if (jogo.controle != null || jogo.usuario != null) {
            // jogo de seleção: quem o usuário controla vem no próprio jogo
            if (jogo.controle != null) opts.controle = jogo.controle;
            if (jogo.usuario != null) opts.usuario = jogo.usuario;
        } else if (s.modo === 'tecnico') opts.controle = jogo.h === s.car.tid ? 0 : 1;
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
        const comp = this.jogo.rotulo || Mundo.nomeCompeticao(s, this.jogo.comp) + (this.jogo.tipo === 'copa' ? ` · ${Mundo.fasesCopa(Mundo.copa(s, this.jogo.comp))[this.jogo.r]}` : ` · Rodada ${this.jogo.r + 1}`);
        const selo = m.final ? '<div class="selo-jogo final">🏆 FINAL</div>' : m.classico ? '<div class="selo-jogo classico">🔥 CLÁSSICO</div>' : '';
        UI.render(`
        <div class="tela-partida ${m.controle === 1 || (m.controle < 0 && Partida.ladoDoUsuario(m) === 1) ? 'meu-lado-1' : ''}">
            <div class="placar">
                <div class="placar-time">${UI.escudo(th, true)}<span>${U.esc(th.nome)}</span><small>${th.form} · ${ESTILOS[m.estilo[0]].nome}</small></div>
                <div class="placar-centro">
                    <div class="placar-comp">${U.esc(comp)}</div>${selo}${PartidaExtras.selo(m)}
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
        // só redesenha o que mudou (os botões não somem no meio do clique quando o relógio corre rápido)
        const set = (id, html) => { const e = document.getElementById(id); if (e && e._html !== html) { e.innerHTML = html; e._html = html; } };
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
        const aoVivo = this.fase !== 'pre';
        // técnico: tocar num jogador do seu time em campo abre "substituir / trocar de posição"
        const mexe = m.controle === lado && this.fase === 'jogo' && !m.terminou && !PartidaExtras.bloqueado(m);
        const linha = (pid, slot, emCampo) => {
            const p = s.jog[pid], st = m.st[pid];
            let ic = '';
            if (st) {
                ic += '⚽'.repeat(st.g) + '🅰️'.repeat(st.a);
                if (st.am === 1 && !st.vm) ic += '🟨';
                if (st.vm) ic += '🟥';
                if (st.les) ic += '🚑';
                if (st.entrou > 0) ic += '🔼';
                if (st.saiu != null && !st.vm) ic += '🔽';
                if (emCampo && aoVivo && Partida.folego(m, p) < 70) ic += '<span title="Cansado">🥵</span>';
            }
            // nota ao vivo ao lado do nome (a mesma conta da nota do fim do jogo)
            const nota = aoVivo && st ? `<span class="pl-nota" title="Nota no jogo até agora">${UI.nota(Partida.nota(m, pid))}</span>` : '';
            const clique = mexe && emCampo ? ` data-acao="plJogador" data-pid="${pid}" title="Substituir ou trocar de posição"` : '';
            return `<div class="pl-jog ${p.user ? 'eu' : ''} ${st && st.saiu != null ? 'saiu' : ''} ${clique ? 'clicavel' : ''}"${clique}>
                ${UI.pos(slot || p.pos)}${p.user ? '' : Mot.icone(p)}<span class="pl-nome">${U.esc(p.nome)}</span>${nota}${UI.ovr(p.ovr)}<span class="pl-ic">${ic}</span></div>`;
        };
        const campo = m.esc[lado].map((pid, i) => pid != null ? linha(pid, m.slots[lado][i], true) : `<div class="pl-jog vazio">${UI.pos(m.slots[lado][i])}<span class="pl-nome">— (vago)</span></div>`).join('');
        const sairam = Object.entries(m.st).filter(([pid, st]) => st.lado === lado && st.saiu != null && !m.esc[lado].includes(+pid)).map(([pid]) => linha(+pid)).join('');
        const banco = m.banco[lado].map(pid => linha(pid)).join('');
        return `<div class="pl-titulo">Em campo${aoVivo ? ' <small>nota · OVR</small>' : ''}${mexe ? ' <small class="pl-dica">toque para mexer</small>' : ''}</div>${campo}
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
        // [partida] e.cls: classe extra do evento (golaço, gol anulado...)
        if (this.fase === 'pre') return this.preJogo() + evs.map(e => `<div class="ev ev-${e.tipo} ${e.cls || ''}">${U.esc(e.txt)}</div>`).join('');
        if (!evs.length) return '<div class="ev ev-apito">⚽ A bola vai rolar!</div>';
        const vistos = this.vistos || 0;
        this.vistos = m.eventos.length;
        const total = m.eventos.length;
        return evs.map((e, i) => `<div class="ev ev-${e.tipo} ${e.cls || ''} ${total - i > vistos ? 'ev-novo' : ''}"><span class="ev-min">${e.min}'</span> ${U.esc(e.txt)}</div>`).join('');
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
            txt = `📋 Seu time vai a campo no <b>${s.times[lado === 0 ? m.h : m.a].form}</b>, estilo <b>${ESTILOS[m.estilo[lado]].nome}</b>.<br>
                ${rel > 3 ? '💪 Seu time é favorito.' : rel < -3 ? `⚠️ O ${U.esc(adv.nome)} é favorito.` : '⚖️ Jogo equilibrado.'}`;
        }
        return `<div class="pre-jogo">${txt}${PartidaExtras.htmlPreJogo(m)}${Comissao.htmlPreJogo(m) /* comissao: relatório do analista */}${Clube.htmlPreJogo(m) /* clima: técnico rival, torcida, duplas e coletiva */}</div>`;   // [partida] clima e dicas
    },

    controles() {
        const m = this.m, s = m.s;
        if (this.fase === 'pre') {
            const fora = s.modo === 'jogador' && this.situacaoUsuario() === 'fora';
            return `${s.modo === 'tecnico' ? '<button class="btn" data-acao="plTatica">📋 Alterar tática</button>' : ''}
                <button class="btn btn-primario btn-grande" data-acao="plComecar">▶ ${fora ? 'Assistir ao jogo' : 'Começar partida'}</button>
                <button class="btn" data-acao="plSimular">⏩ Simular resultado</button>
                ${PartidaExtras.botaoDestaques(this)}`;
        }
        if (this.fase === 'fim') {
            return `<div class="resumo-fim">${this.resumoFim()}</div><button class="btn btn-primario btn-grande" data-acao="plSair">Continuar ▶</button>`;
        }
        const vel = Jogo.opcoes.velocidade;
        if (this.noIntervalo) {
            // janela do vestiário minimizada: mexa no time e volte para conversar e começar o 2º tempo
            const n = m.subs[m.controle];
            return `<button class="btn btn-primario btn-grande pl-volta-vest" data-acao="plMaximizar">🗣️ Voltar ao vestiário e começar o 2º tempo</button>
                <button class="btn" data-acao="plSub" ${n >= 5 ? 'disabled' : ''}>🔁 Substituir (${n}/5)</button>
                <select data-mudar="plEstilo" class="sel">${Object.entries(ESTILOS).map(([k, e]) => `<option value="${k}" ${m.estilo[m.controle] === k ? 'selected' : ''}>${e.nome}</option>`).join('')}</select>
                <div class="px-linha cinza pequeno">⏸️ Intervalo: toque num jogador do seu time para substituir ou trocar de posição. As notas mostram quem está bem e quem está mal.</div>
                ${PartidaExtras.htmlControles(this)}`;
        }
        let html = `<button class="btn ${this.rodando ? '' : 'btn-primario'}" data-acao="plPausar">${this.rodando ? '⏸ Pausar' : '▶ Continuar'}</button>
            <div class="vel">${[1, 2, 3, 4].map(v => `<button class="btn btn-pequeno ${vel === v ? 'ativo' : ''}" data-acao="plVel" data-v="${v}">${['', '1x', '2x', '4x', '8x'][v]}</button>`).join('')}</div>
            ${PartidaExtras.botaoDestaques(this)}`;
        if (m.controle >= 0) {
            const travado = PartidaExtras.bloqueado(m);   // [partida] técnico expulso: sem trocas nem mudança de estilo
            html += `<button class="btn" data-acao="plSub" ${m.subs[m.controle] >= 5 || travado ? 'disabled' : ''}>🔁 Substituir (${m.subs[m.controle]}/5)</button>
                <select data-mudar="plEstilo" class="sel" ${travado ? 'disabled' : ''}>${Object.entries(ESTILOS).map(([k, e]) => `<option value="${k}" ${m.estilo[m.controle] === k ? 'selected' : ''}>${e.nome}</option>`).join('')}</select>`;
        }
        html += '<button class="btn btn-fantasma" data-acao="plPular">⏭ Pular para o fim</button>';
        return html + PartidaExtras.htmlControles(this) + Comissao.htmlDica(m);   // [partida] instruções, reclamação e expulsão · comissao: dica do analista
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
        return html + PartidaExtras.htmlFim(m) + (this.extraFim || '');   // [partida] golaços, VAR, clima, expulsão
    },

    // ---------------------------------------------------------------
    //  Relógio do jogo
    // ---------------------------------------------------------------
    iniciar() {
        if (this.rodando || this.m.terminou) return;
        this.rodando = true;
        this.agendar(null);
        this.atualizar();
    },

    // [partida] relógio com atraso variável: o modo destaques acelera e segura nos lances importantes
    agendar(r) {
        clearTimeout(this.timer);
        this.timer = setTimeout(() => this.tick(), PartidaExtras.atraso(this, r));
    },

    parar() {
        this.rodando = false;
        clearTimeout(this.timer);
        this.timer = null;
    },

    tick() {
        if (!this.rodando) return;
        const r = PartidaExtras.passos(this);   // [partida] 1 minuto (ou alguns, no modo destaques)
        if (r.pausa) this.parar();
        this.atualizar();
        const gol = r.eventos.find(e => e.tipo === 'gol' && !e.anulado);
        if (gol) {
            const g = document.getElementById('pl-gols');
            if (g) { g.classList.remove('pisca'); void g.offsetWidth; g.classList.add('pisca'); }
            TelaPartida.festaGol(gol);
        }
        PartidaExtras.depoisDoTick(this, r);   // [partida] VAR, lance polêmico, avisos do modo destaques
        if (r.pausa === 'intervalo') Som.tocar('apito');
        if (r.pausa === 'fim') Som.tocar('apitoFinal');
        if (r.pausa === 'intervalo') this.intervalo();
        else if (r.pausa === 'lance') this.lance();
        else if (r.pausa === 'fim') this.fim();
        else if (this.rodando) this.agendar(r);
    },

    // overlay e som quando sai gol
    festaGol(ev) {
        if (PartidaExtras.festa(this, ev)) return;   // [partida] golaço ou gol decisivo no fim: comemoração especial
        const m = this.m, s = m.s;
        const t = s.times[ev.lado ? m.a : m.h];
        let nosso = false;
        if (m.controle >= 0) nosso = ev.lado === m.controle;
        else if (m.usuario != null) nosso = ev.lado === Partida.ladoDoUsuario(m);
        Efeitos.gol(t, nosso || (m.controle < 0 && m.usuario == null));
        Som.tocar(nosso ? 'gol' : 'golContra');
    },

    async intervalo() {
        const m = this.m, s = m.s;
        if (m.controle >= 0 && !PartidaExtras.bloqueado(m)) {
            const lado = m.controle;
            const t = s.times[lado === 0 ? m.h : m.a];
            const dif = m.gols[lado] - m.gols[1 - lado];
            // [partida] a conversa do vestiário também deixa mudar as instruções para o 2º tempo
            // a janela pode ser minimizada para ver as notas e mexer no time (plMinimizar)
            this.noIntervalo = true;
            let i;
            try { i = await PartidaExtras.perguntaIntervalo(m); } finally { this.noIntervalo = false; }
            document.body.classList.remove('vestiario-minimizado');
            if (this.m !== m) return;
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
            if (m.controle >= 0) UI.toast('🟥 Sem você no vestiário: o auxiliar conversa com o time.');
            setTimeout(() => { if (this.fase === 'jogo' && !this.pausaMenu && this.m === m) this.iniciar(); }, 900);
        }
    },

    // ---------------------------------------------------------------
    //  Intervalo: o auxiliar técnico analisa o 1º tempo
    // ---------------------------------------------------------------
    // trocas sugeridas: quem está mal (nota), pendurado, cansado ou fora de posição
    sugestoesAux(m) {
        const s = m.s, lado = m.controle;
        const aux = Comissao.membro(s, 'aux');
        const est = aux ? aux.est : 1;
        const vagas = Math.min(5 - m.subs[lado], est >= 4 ? 3 : est >= 2 ? 2 : 1);
        if (vagas <= 0 || !m.banco[lado].length) return [];
        const cands = [];
        m.esc[lado].forEach((pid, i) => {
            if (pid == null) return;
            const p = s.jog[pid], slot = m.slots[lado][i], st = m.st[pid];
            if (p.user || !st) return;
            const nota = Partida.nota(m, pid), fol = Partida.folego(m, p);
            const motivos = [];
            let peso = 0;
            if (nota <= 6.0) { motivos.push(`📉 nota ${nota.toFixed(1)}`); peso += (6.4 - nota) * 2.5; }
            if (st.am >= 1 && slot !== 'GOL' && PESO_CARTAO[slot] >= 2) { motivos.push('🟨 pendurado, pode ser expulso'); peso += 2; }
            if (fol < 75) { motivos.push(`🥵 cansado (${Math.round(fol)}% de fôlego)`); peso += (75 - fol) / 6; }
            const pen = penalidadePos(p.pos, slot);
            if (pen >= 6) { motivos.push(`🔀 ${POS_NOME[p.pos].toLowerCase()} improvisado de ${POS_NOME[slot].toLowerCase()}`); peso += pen / 5; }
            if (!peso) return;
            // auxiliar fraco às vezes lê mal o jogo (o "erro" é fixo por jogador, não muda a cada olhada)
            peso += (((pid * 9301 + 49297) % 233280) / 233280 - 0.5) * (5 - est) * 1.2;
            cands.push({ p, slot, motivos, peso });
        });
        cands.sort((a, b) => b.peso - a.peso);
        const usados = new Set(), res = [];
        for (const c of cands) {
            if (res.length >= vagas) break;
            let entra = null, bv = -1e9;
            for (const id of m.banco[lado]) {
                const b = s.jog[id];
                if (usados.has(id) || (c.slot !== 'GOL' && b.pos === 'GOL') || (c.slot === 'GOL' && b.pos !== 'GOL')) continue;
                const v = Escalacao.efetivo(b, c.slot) + (POS_GRUPO[b.pos] === POS_GRUPO[c.slot] ? 3 : 0);
                if (v > bv) { bv = v; entra = b; }
            }
            if (!entra) continue;
            const ganho = Escalacao.efetivo(entra, c.slot) - Escalacao.efetivo(c.p, c.slot);
            if (ganho < -8 || (ganho < -5 && c.peso < 2.5)) continue;   // a troca pioraria demais o time
            usados.add(entra.id);
            res.push({ sai: c.p, entra, slot: c.slot, motivos: c.motivos });
        }
        return res;
    },

    // dicas de postura: placar, finalizações e (auxiliar bom) o estilo que encaixa contra o deles
    dicasAux(m) {
        const s = m.s, l = m.controle, o = 1 - l;
        const aux = Comissao.membro(s, 'aux'), est = aux ? aux.est : 1;
        const dif = m.gols[l] - m.gols[o];
        const d = [];
        if (dif <= -2) d.push({ txt: 'Perdendo por dois ou mais: é hora de arriscar tudo.', estilo: 'tudo' });
        else if (dif === -1) d.push({ txt: 'Estamos atrás no placar: dá para ir mais pra cima.', estilo: 'ofensivo' });
        else if (dif === 1) d.push({ txt: 'Vantagem mínima: cuidado para não tomar o empate.', estilo: 'defensivo' });
        else if (dif >= 2) d.push({ txt: 'Jogo na mão: dá para administrar sem correr riscos.', estilo: 'equilibrado' });
        else d.push({ txt: 'Empate: o jogo está aberto, paciência e atenção atrás.' });
        if (est >= 2) {
            if (m.fin[o] >= m.fin[l] + 3) d.push({ txt: `Eles finalizaram ${m.fin[o]} vezes contra ${m.fin[l]} nossas: a defesa está sofrendo.` });
            else if (m.fin[l] >= m.fin[o] + 3 && dif <= 0) d.push({ txt: `Criamos ${m.fin[l]} chances contra ${m.fin[o]}: o gol está amadurecendo.` });
        }
        if (est >= 3) {
            const adv = m.estilo[o];
            let melhor = null, bv = 0.9;
            for (const [k, e] of Object.entries(ESTILOS)) {
                const v = (e.vs && e.vs[adv]) || {};
                const g = (v.ata || 0) + (v.def || 0);
                if (g > bv) { bv = g; melhor = k; }
            }
            if (melhor && melhor !== m.estilo[l]) d.push({ txt: `Eles jogam no estilo ${ESTILOS[adv].nome}: o ${ESTILOS[melhor].nome} encaixa bem contra isso.`, estilo: melhor });
        }
        return d;
    },

    htmlAux(m) {
        const s = m.s, l = m.controle, aux = Comissao.membro(s, 'aux');
        const quem = aux ? `🧑‍💼 ${Comissao.nome(aux)} <span class="estrelas-olh">${U.estrelas(aux.est)}</span>` : '🧑‍💼 Auxiliar do clube';
        const sug = this.sugestoesAux(m), dicas = this.dicasAux(m), n = m.subs[l];
        return `<div class="aux-intervalo" id="aux-intervalo">
            <div class="aux-topo"><b>${quem}</b><small class="cinza">análise do 1º tempo</small></div>
            ${sug.length ? `<div class="aux-trocas">${sug.map(x => `<div class="aux-troca">
                <div class="aux-sai"><span>🔽 ${UI.pos(x.slot)} <b>${U.esc(x.sai.nome)}</b> ${UI.nota(Partida.nota(m, x.sai.id))}</span><small>${x.motivos.join(' · ')}</small></div>
                <div class="aux-entra"><span>🔼 <b>${U.esc(x.entra.nome)}</b> ${UI.ovr(Math.round(Escalacao.efetivo(x.entra, x.slot)))}</span><small>${x.entra.pos === x.slot ? 'mesma posição' : `${POS_NOME[x.entra.pos].toLowerCase()} improvisado`}</small></div>
                <button class="btn btn-pequeno btn-primario" data-acao="plSugTroca" data-sai="${x.sai.id}" data-entra="${x.entra.id}" ${n >= 5 ? 'disabled' : ''}>✅ Fazer a troca</button>
            </div>`).join('')}</div>`
            : `<p class="aux-ok">✅ ${n >= 5 ? 'Já fizemos as 5 trocas.' : 'Ninguém precisa sair: o time está bem.'}</p>`}
            ${dicas.map(d => `<div class="aux-dica">💡 ${d.txt}${d.estilo && d.estilo !== m.estilo[l] ? ` <button class="chip-btn" data-acao="plSugEstilo" data-e="${d.estilo}">📋 Mudar para ${ESTILOS[d.estilo].nome}</button>` : ''}</div>`).join('')}
            ${aux ? '' : '<small class="cinza">Contrate um auxiliar técnico (👥 Time → 🧑‍💼 Comissão técnica) para análises melhores.</small>'}
        </div>`;
    },

    // depois de mexer no time no intervalo, a janela do vestiário mostra o time novo
    atualizarVestiario() {
        const m = this.m;
        if (!m || !this.noIntervalo) return;
        const box = document.getElementById('aux-intervalo');
        if (box) box.outerHTML = this.htmlAux(m);
        const ins = document.getElementById('px-instr-intervalo');
        if (ins) ins.innerHTML = PartidaExtras.chipsInstr(m, m.controle, true);
    },

    async lance() {
        const m = this.m;
        const lance = Partida.sortearLance(m);
        const ops = lance.ops.map(o => o.txt + Partida.textoChance(Partida.chanceOpcao(m, lance, o)));
        // [partida] notaLance: marcação individual e clima que pesam no lance
        const i = await UI.perguntar(`Seu lance! ${m.min}'`, `${lance.txt}<br><small class="cinza">As chances já levam em conta a sua habilidade e as suas habilidades especiais.</small>${PartidaExtras.notaLance(m, lance)}`, ops, '⭐');
        const r = Partida.resolverLance(m, lance, i);
        this.atualizar();
        const gol = r.eventos.find(e => e.tipo === 'gol');
        if (gol) TelaPartida.festaGol(gol);
        // [partida] no modo destaques o resultado do lance aparece rápido, sem clique
        if (!PartidaExtras.avisoLance(this, r)) await UI.aviso(r.bom ? 'Boa!' : 'Que pena...', r.txt, r.bom ? '🔥' : '😓');
        if (m.min >= 90) this.fim();
        else this.iniciar();
    },

    async fim() {
        const m = this.m, s = m.s;
        if (this.resultado) return;
        this.parar();
        const r = Partida.finalizar(s, m);
        this.resultado = r;
        if (this.jogo.tipo !== 'selecao') Mundo.registrar(s, this.jogo, r);
        this.fase = 'fim';
        this.atualizar();
        const modo = Jogo.modo();
        if (this.jogo.aoFim) this.extraFim = (await this.jogo.aoFim(m, r)) || '';
        else if (modo.posJogo) this.extraFim = (await modo.posJogo(s, this.jogo, m, r)) || '';
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

ACOES.plComecar = () => { TelaPartida.fase = 'jogo'; TelaPartida.render(); Som.tocar('apito'); TelaPartida.iniciar(); };
ACOES.plSimular = () => {
    TelaPartida.fase = 'jogo';
    Partida.simularAteOFim(TelaPartida.m);
    TelaPartida.render();
    TelaPartida.fim();
};
ACOES.plPular = () => {
    if (TelaPartida.noIntervalo) return ACOES.plMaximizar();
    TelaPartida.parar();
    Partida.simularAteOFim(TelaPartida.m);
    TelaPartida.atualizar();
    TelaPartida.fim();
};
ACOES.plPausar = () => {
    if (TelaPartida.noIntervalo) return ACOES.plMaximizar();
    if (TelaPartida.rodando) { TelaPartida.parar(); TelaPartida.atualizar(); } else TelaPartida.iniciar();
};
ACOES.plVel = d => {
    Jogo.opcoes.velocidade = +d.v;
    Salvar.gravarOpcoes(Jogo.opcoes);
    if (TelaPartida.rodando) { TelaPartida.parar(); TelaPartida.iniciar(); } else TelaPartida.atualizar();
};
ACOES.plEstilo = (d, el) => {
    const m = TelaPartida.m;
    if (PartidaExtras.bloqueado(m)) { UI.toast('🟥 Você foi expulso: só o auxiliar pode mexer no time.', 'erro'); TelaPartida.atualizar(); return; }
    m.estilo[m.controle] = el.value;
    m.s.times[m.controle === 0 ? m.h : m.a].estilo = el.value;
    Partida.recalcular(m);
    Partida.evento(m, { tipo: 'apito', txt: `📋 Você mudou a postura do time para "${ESTILOS[el.value].nome}".` });
    TelaPartida.atualizar();
    TelaPartida.atualizarVestiario();
};
ACOES.plSub = async () => {
    const m = TelaPartida.m, s = m.s, lado = m.controle;
    if (PartidaExtras.bloqueado(m)) return UI.toast('🟥 Você foi expulso: só o auxiliar pode mexer no time.', 'erro');
    if (m.subs[lado] >= 5 || !m.banco[lado].length) return UI.toast('Sem substituições disponíveis.', 'erro');
    const estava = TelaPartida.rodando;
    TelaPartida.parar();
    const campo = m.esc[lado].map((id, i) => id == null ? null : { p: s.jog[id], slot: m.slots[lado][i] }).filter(Boolean);
    const banco = m.banco[lado].map(id => s.jog[id]);
    let escolha = null;
    const r = await UI.modal({
        titulo: '🔁 Substituição',
        html: `<label class="campo">Sai:<select id="sub-sai" class="sel">${campo.map(c => `<option value="${c.p.id}">${c.slot} · ${U.esc(c.p.nome)} (${c.p.ovr}) · nota ${Partida.nota(m, c.p.id).toFixed(1)} · 💨${Math.round(Partida.folego(m, c.p))}%${m.st[c.p.id].am ? ' 🟨' : ''}</option>`).join('')}</select></label>
            <label class="campo">Entra:<select id="sub-entra" class="sel">${banco.map(p => `<option value="${p.id}">${p.pos} · ${U.esc(p.nome)} (${p.ovr})</option>`).join('')}</select></label>`,
        botoes: [{ txt: 'Confirmar', valor: 'ok', antes: f => { escolha = [+f.querySelector('#sub-sai').value, +f.querySelector('#sub-entra').value]; } }, { txt: 'Cancelar', valor: false, classe: 'btn-fantasma' }],
    });
    if (r === 'ok' && escolha) Partida.substituir(m, lado, escolha[0], escolha[1], false);
    TelaPartida.atualizar();
    TelaPartida.atualizarVestiario();
    if (estava) TelaPartida.iniciar();
};
// toque num jogador do seu time em campo: substituir ou trocar de posição
ACOES.plJogador = async d => {
    const t = TelaPartida, m = t.m;
    if (!m || m.terminou || m.controle < 0) return;
    if (PartidaExtras.bloqueado(m)) return UI.toast('🟥 Você foi expulso: só o auxiliar pode mexer no time.', 'erro');
    const s = m.s, lado = m.controle, pid = +d.pid;
    const i = m.esc[lado].indexOf(pid);
    if (i < 0) return;
    const p = s.jog[pid], slot = m.slots[lado][i];
    const estava = t.rodando;
    t.parar();
    t.atualizar();
    const banco = m.banco[lado].map(id => s.jog[id]).sort((a, b) => Escalacao.efetivo(b, slot) - Escalacao.efetivo(a, slot));
    const outros = m.esc[lado].map((id, j) => id != null && id !== pid ? { p: s.jog[id], slot: m.slots[lado][j] } : null).filter(Boolean);
    const podeSub = m.subs[lado] < 5 && banco.length > 0;
    let esc = null;
    const r = await UI.modal({
        titulo: `${UI.pos(slot)}&nbsp;${U.esc(p.nome)}`,
        html: `<div class="pj-ficha">Nota ${UI.nota(Partida.nota(m, pid))} · OVR ${UI.ovr(p.ovr)} · rende <b>${Math.round(Escalacao.efetivo(p, slot))}</b> de ${POS_NOME[slot].toLowerCase()} · 💨 ${Math.round(Partida.folego(m, p))}%${m.st[pid].am ? ' · 🟨 pendurado' : ''}</div>
            <label class="campo">🔁 Substituir por:<select id="pj-entra" class="sel" ${podeSub ? '' : 'disabled'}>${banco.map(b => `<option value="${b.id}">${b.pos} · ${U.esc(b.nome)} — rende ${Math.round(Escalacao.efetivo(b, slot))} de ${slot}</option>`).join('') || '<option value="">banco vazio</option>'}</select></label>
            <label class="campo">🔀 Ou trocar de posição com:<select id="pj-troca" class="sel"><option value="">— escolha com quem trocar —</option>${outros.map(o => `<option value="${o.p.id}">${o.slot} · ${U.esc(o.p.nome)} (${o.p.pos})</option>`).join('')}</select></label>
            <p class="cinza pequeno">Trocar de posição não gasta substituição. Trocas feitas: ${m.subs[lado]}/5.</p>`,
        botoes: [
            { txt: '🔁 Substituir', valor: 'sub', desativado: !podeSub, antes: f => { esc = +f.querySelector('#pj-entra').value; } },
            { txt: '🔀 Trocar de posição', valor: 'troca', classe: 'btn', antes: f => {
                esc = +f.querySelector('#pj-troca').value;
                if (!esc) { UI.toast('Escolha com quem ele troca de posição.'); return false; }
            } },
            { txt: 'Cancelar', valor: false, classe: 'btn-fantasma' },
        ],
    });
    let ev = null;
    if (r === 'sub' && esc) ev = Partida.substituir(m, lado, pid, esc, false);
    else if (r === 'troca' && esc) ev = Partida.trocarPosicao(m, lado, pid, esc);
    if (ev) UI.toast(ev.txt);
    t.atualizar();
    t.atualizarVestiario();
    if (estava) t.iniciar();
};
// intervalo: sugestões do auxiliar com um toque
ACOES.plSugTroca = d => {
    const t = TelaPartida, m = t.m;
    if (!m || m.controle < 0 || m.terminou) return;
    if (PartidaExtras.bloqueado(m)) return UI.toast('🟥 Você foi expulso: só o auxiliar pode mexer no time.', 'erro');
    const lado = m.controle;
    if (!m.esc[lado].includes(+d.sai) || !m.banco[lado].includes(+d.entra)) { t.atualizarVestiario(); return; }
    const ev = Partida.substituir(m, lado, +d.sai, +d.entra, false);
    if (ev) UI.toast(ev.txt);
    t.atualizar();
    t.atualizarVestiario();
};
ACOES.plSugEstilo = d => {
    const m = TelaPartida.m;
    if (!m || !ESTILOS[d.e]) return;
    ACOES.plEstilo({}, { value: d.e });
    UI.toast(`📋 Postura do time: ${ESTILOS[d.e].nome}.`);
    TelaPartida.atualizarVestiario();
};
// esconde a janela do vestiário para ver o jogo (notas, placar, eventos) e mexer no time
ACOES.plMinimizar = () => {
    const box = document.querySelector('#modais .modal-intervalo');
    const fundo = box && box.closest('.modal-fundo');
    if (!fundo) return;
    fundo.classList.add('minimizado');
    document.body.classList.add('vestiario-minimizado');
    TelaPartida.atualizar();
    const c = document.getElementById('pl-controles');
    if (c && c.scrollIntoView) c.scrollIntoView({ block: 'nearest' });
};
ACOES.plMaximizar = () => {
    const box = document.querySelector('#modais .modal-intervalo');
    const fundo = box && box.closest('.modal-fundo');
    if (!fundo) return;
    TelaPartida.atualizarVestiario();
    fundo.classList.remove('minimizado');
    document.body.classList.remove('vestiario-minimizado');
};
ACOES.plTatica = async () => {
    const m = TelaPartida.m, s = m.s;
    const t = s.times[m.controle === 0 ? m.h : m.a];
    let esc = null;
    const r = await UI.modal({
        titulo: '📋 Tática para o jogo',
        html: `<label class="campo">Formação:<select id="tt-form" class="sel">${Object.keys(FORMACOES).map(f => `<option ${t.form === f ? 'selected' : ''}>${f}</option>`).join('')}</select></label>
            <label class="campo">Estilo:<select id="tt-est" class="sel">${Object.entries(ESTILOS).map(([k, e]) => `<option value="${k}" ${t.estilo === k ? 'selected' : ''}>${e.nome}</option>`).join('')}</select></label>
            <label class="campo">Escalação:<select id="tt-crit" class="sel">
                <option value="">${t.tit ? 'Manter a escalação manual' : `Manter (automática: ${CRITERIOS_ESCALA[t.criterio || 'ovr'].nome})`}</option>
                ${Object.entries(CRITERIOS_ESCALA).map(([k, c]) => `<option value="${k}">🤖 Automática: ${c.icone} ${c.nome}</option>`).join('')}
            </select></label>
            <p class="cinza">Mudar a formação refaz a escalação automaticamente. Para escolher os titulares um por um, use a aba <b>Tática</b> antes do jogo.</p>`,
        botoes: [{ txt: 'Aplicar', valor: 'ok', antes: f => { esc = [f.querySelector('#tt-form').value, f.querySelector('#tt-est').value, f.querySelector('#tt-crit').value]; } }, { txt: 'Cancelar', valor: false, classe: 'btn-fantasma' }],
    });
    if (r !== 'ok') return;
    if (esc[0] !== t.form) { t.form = esc[0]; t.tit = null; }
    if (esc[2] && CRITERIOS_ESCALA[esc[2]]) { t.criterio = esc[2]; t.tit = null; }
    t.estilo = esc[1];
    TelaPartida.criarPartida(s);
    TelaPartida.render();
};
ACOES.plSair = () => TelaPartida.sair();
