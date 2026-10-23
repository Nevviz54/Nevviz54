'use strict';
// =====================================================================
//  RITMO: o tempo anda mais rápido e com menos cliques (os dois modos)
//  - ⏭️ "Até algo importante": simula semana a semana (o mesmo caminho do
//    "4 semanas") e para quando aparece uma decisão, um jogo grande, a janela
//    abre/fecha, a temporada acaba... Depois mostra o resumo do que rolou.
//  - 🤖 Treino automático (carreira de jogador).
//  - 🔁 "Lembrar minha escolha" nos eventos da vida que se repetem e
//    ⚡ menos eventos aleatórios.
//  - 🗓️ Resumo da semana no perfil (abas Vida / Atividades).
//
//  Estado no save (criado aos poucos, saves antigos abrem normalmente):
//    s.ritmo = { lembrar: { chave: { i, txt, titulo, icone, n } },
//                semana: resumo da última semana, salto: resumo do último
//                avanço longo, grande: semana do jogo grande que fez parar }
//    s.car.treinoAuto / s.car.treinoMotivo (jogador)
//  Opções globais (Jogo.opcoes): ritmoGrandes, ritmoMax, menosEventos.
// =====================================================================

const RITMO_LIMITES = [6, 12, 20, 46];   // semanas no máximo por clique em ⏭️

const Ritmo = {
    rodando: false,       // uma sessão de várias semanas está em andamento
    pedidoParar: false,   // o botão ⏹ foi apertado
    contagem: 0,          // semanas já simuladas na sessão atual
    sessao: null,         // acumulado da sessão (resultados, gols, dinheiro...)
    modais: [],           // títulos dos modais que abriram na semana simulada
    calado: 0,            // > 0: os modais que abrirem agora não fazem parar
    liberado: null,       // semana (ano*100+sem) cujo jogo grande pode ser simulado
    foto0: null,          // fotografia do começo da semana (para o resumo semanal)
    marcado: false,       // caixinha "Lembrar minha escolha" do modal aberto
    ultimoAviso: '',      // texto do último resumo (também ajuda nos testes)
    naSemana: false,      // Jogo.avancar da sessão rodando (só os modais dele contam)
    inicio: 0,            // quando a sessão começou (duplo clique não vira ⏹)

    estado(s) {
        s.ritmo = s.ritmo || {};
        const r = s.ritmo;
        r.lembrar = r.lembrar || {};
        if (r.semana === undefined) r.semana = null;
        if (r.salto === undefined) r.salto = null;
        if (r.grande === undefined) r.grande = null;
        return r;
    },

    opcao(k, padrao) { return U.def(Jogo.opcoes ? Jogo.opcoes[k] : null, padrao); },
    limite() {
        const v = +Ritmo.opcao('ritmoMax', 12);
        return RITMO_LIMITES.indexOf(v) >= 0 ? v : 12;
    },
    fatorEventos() { return Ritmo.opcao('menosEventos', false) ? 0.35 : 1; },
    limpo: txt => String(txt == null ? '' : txt).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim(),
    agora: s => s.ano * 100 + s.semana,

    // -----------------------------------------------------------------
    //  ⏭️ Avançar até algo importante
    // -----------------------------------------------------------------
    botaoRodape() {
        if (Ritmo.rodando) {
            return `<button class="btn btn-perigo btn-ritmo-parar" data-acao="rtParar" title="Para no fim da semana que está sendo simulada">⏹ Parar <small>(${Ritmo.contagem} sem.)</small></button>`;
        }
        return `<button class="btn btn-fantasma btn-ritmo" data-acao="rtAvancarAte" title="Simula semana a semana e para quando acontecer algo importante: uma decisão, clássico ou final, janela de transferências, fim da temporada (no máximo ${Ritmo.limite()} semanas)">⏭️ <span class="rt-longo">Até algo importante</span><span class="rt-curto">Importante</span></button>`;
    },

    // jogo grande do usuário numa semana (final ou clássico): { tipo, txt } ou null
    jogoGrandeNa(s, sem) {
        const meu = Jogo.modo().meuTime(s);
        if (meu == null || meu < 0 || sem >= TOTAL_SEMANAS) return null;
        for (const j of Mundo.partidasDaSemana(s, sem)) {
            if (j.h !== meu && j.a !== meu) continue;
            const adv = s.times[j.h === meu ? j.a : j.h];
            if (!adv) continue;
            if (Mundo.ehFinal(s, j)) return { tipo: 'final', txt: `🏆 Final da ${Mundo.nomeCompeticao(s, j.comp)} contra o ${adv.nome}` };
            if (Mundo.classico(s, j.h, j.a)) return { tipo: 'classico', txt: `🔥 Clássico contra o ${adv.nome}` };
        }
        return null;
    },

    // o ⏭️ deve parar antes desta semana para o usuário jogar ao vivo? (rótulo ou '')
    jogoGrande(s) {
        if (!Ritmo.opcao('ritmoGrandes', true)) return '';
        if (s.modo === 'jogador') {
            const p = Jogador.p(s);
            if (!p || p.les > 0 || p.susp > 0) return '';   // você nem vai jogar
        }
        const g = Ritmo.jogoGrandeNa(s, s.semana);
        return g ? g.txt : Historia.jogoGrande(s);   // historia: o duelo com o seu rival também faz parar
    },

    lesionadosSerios(s) {
        const t = s.modo === 'tecnico' ? Tecnico.time(s) : null;
        if (!t) return [];
        return Mundo.elenco(s, t).sort((a, b) => b.ovr - a.ovr).slice(0, 13).filter(p => p.les >= 3).map(p => p.id);
    },

    // fotografia do que importa antes de simular uma semana
    foto(s) {
        const f = { ano: s.ano, sem: s.semana, modo: s.modo, trof: s.pessoa.trofeus.length, janela: Mundo.emJanela(s) };
        if (s.modo === 'jogador') {
            const p = Jogador.p(s);
            f.tid = p ? p.tid : -1;
            f.les = p ? p.les : 0;
        } else {
            f.tid = s.car.tid;
            f.ofertas = (s.car.ofertas || []).length;
            f.conf = s.car.conf;
            f.lesionados = Ritmo.lesionadosSerios(s);
        }
        return f;
    },

    // por que parar depois desta semana? ('' = pode seguir). Junta os motivos
    // (ex.: uma proposta e a janela fechando na mesma semana).
    motivoParada(s, a, importante) {
        if (s.ano !== a.ano) return '🏁 A temporada terminou.';
        if (s.modo !== a.modo) return '📋 Começou uma nova fase da carreira.';
        if (!importante) return '';
        const m = [];
        const titulos = Ritmo.modais.filter((t, i) => Ritmo.modais.indexOf(t) === i);
        if (titulos.length) m.push(titulos.slice(0, 2).join(' · ') + (titulos.length > 2 ? ` e mais ${titulos.length - 2}` : ''));
        if (s.pessoa.trofeus.length > a.trof) m.push('🏆 Título conquistado!');
        if (s.modo === 'jogador') {
            const p = Jogador.p(s);
            if (p && p.tid !== a.tid) m.push(p.tid >= 0 ? `✍️ Você agora joga no ${s.times[p.tid].nome}.` : '😶 Você está sem clube.');
            else if (p && p.les > 0 && a.les <= 0) m.push(`🚑 Você se machucou: ${p.les} semana(s) fora.`);
            return m.join(' · ');
        }
        if (s.car.tid !== a.tid) m.push(s.car.tid >= 0 ? `✍️ Você assumiu o ${s.times[s.car.tid].nome}.` : '🚪 Você está sem clube.');
        if ((s.car.ofertas || []).length > a.ofertas) m.push('📨 Chegou uma proposta de emprego.');
        if (s.car.tid >= 0 && s.car.tid === a.tid) {
            const janela = Mundo.emJanela(s);
            if (janela !== a.janela) m.push(janela ? '🔄 A janela de transferências abriu.' : '🔒 A janela de transferências fechou.');
            const novo = Ritmo.lesionadosSerios(s).find(id => a.lesionados.indexOf(id) < 0);
            if (novo != null) m.push(`🚑 ${s.jog[novo].nome} se machucou feio (${s.jog[novo].les} sem.).`);
            if (s.car.conf < 25 && a.conf >= 25) m.push('⚠️ A diretoria está perdendo a paciência.');
        }
        return m.join(' · ');
    },

    // o menu de pausa (ESC) aberto também segura a sessão
    pausado() {
        const o = document.getElementById('overlay');
        return !!(o && o.innerHTML.trim());
    },

    novaSessao(s) {
        const p = s.modo === 'jogador' ? Jogador.p(s) : null;
        return {
            semanas: 0, v: 0, e: 0, d: 0, gf: 0, gc: 0, g: 0, a: 0, din: 0,
            ovr0: p ? p.ovr : null, conf0: s.modo === 'tecnico' && s.car.tid >= 0 ? s.car.conf : null,
            trof: s.pessoa.trofeus.length, modo: s.modo,
        };
    },

    // Simula até max semanas. importante = para nas coisas importantes (⏭️);
    // senão só para no fim da temporada (o "⏩ 4 semanas").
    async rodar(max, importante) {
        const s = Jogo.s;
        if (!s || s.pessoa.morto || Ritmo.rodando || Jogo.ocupado || TelaPartida.ativo()) return;
        const r = Ritmo.estado(s);
        const ses = Ritmo.novaSessao(s);
        let motivo = '';
        Ritmo.rodando = true;
        Ritmo.inicio = Date.now();
        Ritmo.pedidoParar = false;
        Ritmo.contagem = 0;
        Ritmo.sessao = ses;
        // Jogo.ocupado fica ligado durante a sessão inteira: nenhum outro clique
        // avança o tempo no meio (só é desligado na hora de chamar Jogo.avancar)
        Jogo.ocupado = true;
        try {
            Jogo.manterRolagem = true;
            Jogo.atualizar();
            for (let i = 0; i < max; i++) {
                if (Jogo.s !== s || s.pessoa.morto) break;
                if (Ritmo.pedidoParar) { motivo = '⏹ Você parou.'; break; }
                if (Ritmo.pausado()) { motivo = '⏸ Jogo pausado.'; break; }
                if (importante) {
                    const g = Ritmo.jogoGrande(s);
                    const chave = Ritmo.agora(s);
                    if (g && Ritmo.liberado !== chave) {
                        // para uma vez; se clicar em ⏭️ de novo, simula esse jogo
                        Ritmo.liberado = chave;
                        r.grande = chave;
                        motivo = `${g} é o próximo jogo! Jogue ao vivo em <b>▶ Avançar semana</b> (ou toque em ⏭️ de novo para simular).`;
                        break;
                    }
                }
                const antes = Ritmo.foto(s);
                Ritmo.modais = [];
                Jogo.ocupado = false;
                Ritmo.naSemana = true;
                try {
                    await Jogo.avancar(true);
                } finally {
                    Ritmo.naSemana = false;
                }
                if (Jogo.s !== s) break;   // carregou outro jogo ou voltou ao menu
                Jogo.ocupado = true;
                if (s.ano === antes.ano && s.semana === antes.sem) { motivo = '⚠️ A semana não andou.'; break; }   // erro: evita laço infinito
                Ritmo.contagem++;
                if (s.pessoa.morto) break;
                motivo = Ritmo.motivoParada(s, antes, importante);
                if (motivo) break;
                if (i === max - 1) { if (importante) motivo = `⏱️ Chegou ao limite de ${max} semanas.`; break; }
                // respiro para a tela redesenhar e o ⏹ poder ser clicado
                await new Promise(ok => setTimeout(ok, 70));
            }
        } catch (e) {
            console.error(e);
            motivo = '⚠️ Aconteceu um erro: ' + U.esc(e.message);
        } finally {
            Ritmo.rodando = false;
            Ritmo.sessao = null;
            Ritmo.modais = [];
            if (Jogo.s === s) Jogo.ocupado = false;
        }
        if (Jogo.s !== s || s.pessoa.morto) return;
        Ritmo.fecharSessao(s, ses, motivo, importante);
        Jogo.atualizar();
    },

    partesSessao(s, ses) {
        const partes = [];
        if (ses.v + ses.e + ses.d) partes.push(`${ses.v}V ${ses.e}E ${ses.d}D <small>(${ses.gf} x ${ses.gc})</small>`);
        if (ses.modo === 'jogador' && (ses.g || ses.a)) partes.push(`⚽ ${ses.g} gol${ses.g === 1 ? '' : 's'}${ses.a ? `, ${ses.a} assist.` : ''}`);
        const p = s.modo === 'jogador' && ses.modo === 'jogador' ? Jogador.p(s) : null;
        if (p && ses.ovr0 != null && p.ovr !== ses.ovr0) partes.push(`${p.ovr > ses.ovr0 ? '📈' : '📉'} OVR ${ses.ovr0} → ${p.ovr}`);
        if (s.modo === 'tecnico' && s.car.tid >= 0 && ses.conf0 != null && Math.round(s.car.conf) !== Math.round(ses.conf0)) {
            partes.push(`🤝 ${Math.round(ses.conf0)}% → ${Math.round(s.car.conf)}%`);
        }
        if (Math.abs(ses.din) >= 1000) partes.push(`💰 ${ses.din > 0 ? '+' : ''}${U.dinheiro(ses.din)}`);
        const tr = s.pessoa.trofeus.length - ses.trof;
        if (tr > 0) partes.push(`🏆 ${tr} título${tr > 1 ? 's' : ''}`);
        if (ses.modo === 'jogador') partes.push.apply(partes, Historia.partesSessao(ses));   // historia: duelos e metas
        return partes;
    },

    fecharSessao(s, ses, motivo, importante) {
        const n = ses.semanas;
        const partes = Ritmo.partesSessao(s, ses);
        const icone = importante ? '⏭️' : '⏩';
        const cab = n ? `${icone} <b>${n} semana${n > 1 ? 's' : ''}</b>${partes.length ? ' · ' + partes.join(' · ') : ''}` : '';
        const html = [cab, motivo ? `<span class="rt-motivo">⏸️ ${motivo}</span>` : ''].filter(Boolean).join('<br>');
        if (n) {
            if (importante) Conquistas.contar(s, 'ritmoSemanas', n);
            if (n >= 2) {
                Vida.log(s, `${icone} Você avançou ${n} semanas${partes.length ? ': ' + partes.join(' · ') : '.'}`, '');
                // resumo do salto no perfil (some quando a próxima semana andar)
                Ritmo.estado(s).salto = { ano: s.ano, sem: s.semana, txt: cab + (motivo ? ` <span class="cinza">· parou: ${motivo}</span>` : '') };
            }
        }
        if (html) Ritmo.aviso(html);
    },

    // aviso mais longo que o toast comum (some sozinho ou com um toque)
    aviso(html) {
        Ritmo.ultimoAviso = html;
        const raiz = document.getElementById('toasts');
        if (!raiz) return;
        // só o resumo mais recente fica na tela
        raiz.querySelectorAll('.toast-ritmo').forEach(x => x.remove());
        const d = document.createElement('div');
        d.className = 'toast toast-ritmo';
        d.innerHTML = html;
        raiz.appendChild(d);
        let foi = false;
        const tirar = () => {
            if (foi) return;
            foi = true;
            d.classList.add('sumindo');
            setTimeout(() => d.remove(), 550);
        };
        d.addEventListener('click', tirar);
        setTimeout(tirar, 7500);
    },

    // -----------------------------------------------------------------
    //  🗓️ Resumo da semana (ganchos em Jogo.avancar)
    // -----------------------------------------------------------------
    inicioSemana(s) {
        const p = s.pessoa, j = s.modo === 'jogador' ? Jogador.p(s) : null;
        Ritmo.foto0 = {
            ano: s.ano, sem: s.semana, modo: s.modo,
            din: p.dinheiro, fel: p.felicidade, sau: p.saude, fama: p.fama,
            ovr: j ? j.ovr : null, g: j ? j.g : 0, a: j ? j.a : 0,
            conf: s.modo === 'tecnico' && s.car.tid >= 0 ? s.car.conf : null,
            log: p.log.length ? p.log[p.log.length - 1] : null,
            jogos: [], gs: 0, as: 0,
        };
    },

    resultadoDe(s, jg) {
        const c = jg.tipo === 'liga' ? Mundo.liga(s, jg.comp) : Mundo.copa(s, jg.comp);
        const lista = c && c.res ? c.res[jg.r] : null;
        return lista ? lista.find(x => x.h === jg.h && x.a === jg.a) : null;
    },

    // depois dos jogos do usuário na semana (ao vivo ou simulados)
    aposJogos(s, meus, meu, simulado) {
        const f = Ritmo.foto0;
        if (!f || meu == null || meu < 0) return;
        const r = Ritmo.estado(s);
        for (const jg of meus) {
            const res = Ritmo.resultadoDe(s, jg);
            if (!res) continue;
            const casa = jg.h === meu;
            const gf = casa ? res.gh : res.ga, gc = casa ? res.ga : res.gh;
            let v = gf > gc ? 'V' : gf < gc ? 'D' : 'E';
            if (res.venc != null && gf === gc) v = res.venc === meu ? 'V' : 'D';
            const adv = s.times[casa ? jg.a : jg.h];
            const grande = Mundo.ehFinal(s, jg) || Mundo.classico(s, jg.h, jg.a);
            f.jogos.push({ r: v, gf, gc, adv: adv ? adv.nome : '?', pen: !!res.pen });
            // 🔥 Hora H: o ⏭️ parou antes do jogo grande e você venceu ao vivo
            if (!simulado && grande && v === 'V' && r.grande === Ritmo.agora(s)) Conquistas.contar(s, 'horaH');
        }
        if (r.grande === Ritmo.agora(s)) r.grande = null;
        const j = s.modo === 'jogador' ? Jogador.p(s) : null;
        if (j && f.modo === 'jogador') { f.gs = Math.max(0, j.g - f.g); f.as = Math.max(0, j.a - f.a); }
    },

    fimSemana(s) {
        const f = Ritmo.foto0;
        Ritmo.foto0 = null;
        if (!f) return;
        const p = s.pessoa, log = p.log;
        const k = f.log ? log.lastIndexOf(f.log) : -1;
        const novos = f.log && k < 0 ? log.slice(-12) : log.slice(k + 1);
        const d = { din: p.dinheiro - f.din, fel: p.felicidade - f.fel, sau: p.saude - f.sau, fama: p.fama - f.fama };
        if (f.ovr != null && s.modo === 'jogador') { d.ovr0 = f.ovr; d.ovr = Jogador.p(s).ovr; }
        if (f.conf != null && s.modo === 'tecnico' && s.car.tid >= 0) d.conf = s.car.conf - f.conf;
        const resumo = { ano: f.ano, sem: f.sem, jogos: f.jogos, g: f.gs, a: f.as, d, itens: novos.slice(-8).map(l => l.txt), n: novos.length };
        Ritmo.estado(s).semana = resumo;
        const ses = Ritmo.sessao;
        if (ses) {
            ses.semanas++;
            for (const jg of resumo.jogos) {
                ses[jg.r === 'V' ? 'v' : jg.r === 'E' ? 'e' : 'd']++;
                ses.gf += jg.gf;
                ses.gc += jg.gc;
            }
            ses.g += resumo.g;
            ses.a += resumo.a;
            ses.din += d.din;
        }
    },

    // bloco "Esta semana" que aparece no perfil (abas Vida e Atividades)
    htmlSemana(s) {
        const r = Ritmo.estado(s), w = r.semana;
        const salto = r.salto && r.salto.ano === s.ano && r.salto.sem === s.semana ? r.salto : null;
        if (!w && !salto) return '';
        let corpo = '';
        if (w) {
            const chips = [];
            const chip = (txt, cls) => chips.push(`<span class="rt-chip ${cls || ''}">${txt}</span>`);
            for (const j of w.jogos) chip(`${j.r === 'V' ? '✅' : j.r === 'E' ? '➖' : '❌'} ${j.gf}x${j.gc}${j.pen ? ' (pên.)' : ''} ${U.esc(j.adv)}`, 'rt-' + j.r);
            if (w.g) chip(`⚽ ${w.g} gol${w.g > 1 ? 's' : ''}`, 'rt-V');
            if (w.a) chip(`🅰️ ${w.a} assist.`);
            const d = w.d || {};
            if (d.ovr != null && d.ovr !== d.ovr0) chip(`${d.ovr > d.ovr0 ? '📈' : '📉'} OVR ${d.ovr}`, d.ovr > d.ovr0 ? 'rt-V' : 'rt-D');
            if (d.conf != null && Math.abs(d.conf) >= 0.5) chip(`🤝 ${d.conf > 0 ? '+' : ''}${Math.round(d.conf)}`, d.conf > 0 ? 'rt-V' : 'rt-D');
            if (Math.abs(d.din || 0) >= 1) chip(`💰 ${d.din > 0 ? '+' : ''}${U.dinheiro(d.din)}`, d.din > 0 ? 'rt-V' : 'rt-D');
            const at = (v, ic) => { if (Math.abs(v || 0) >= 1) chip(`${ic} ${v > 0 ? '+' : ''}${Math.round(v)}`, v > 0 ? 'rt-V' : 'rt-D'); };
            at(d.fel, '😊');
            at(d.sau, '❤️');
            at(d.fama, '⭐');
            corpo = `<div class="rt-semana-topo"><b>🗓️ Esta semana</b><small class="cinza">semana ${w.sem + 1}${w.ano !== s.ano ? ` de ${w.ano}` : ''}</small></div>
                <div class="rt-chips">${chips.join('') || '<span class="cinza pequeno">Semana tranquila, nada demais.</span>'}</div>
                ${w.itens.length ? `<details class="rt-detalhes"><summary>📔 ${w.n} novidade${w.n > 1 ? 's' : ''} no diário</summary>${w.itens.map(t => `<div class="diario-item">${t}</div>`).join('')}</details>` : ''}`;
        }
        return `<div class="rt-semana">${corpo}${salto ? `<div class="rt-salto pequeno">${salto.txt}</div>` : ''}</div>`;
    },

    // -----------------------------------------------------------------
    //  Eventos da vida: ⚡ menos eventos e 🔁 respostas lembradas
    // -----------------------------------------------------------------
    // o evento aleatório da semana (os modais dele não fazem o ⏭️ parar)
    async eventoDaSemana(s, rapido) {
        if (!U.chance((rapido ? 0.18 : 0.3) * Ritmo.fatorEventos())) return;
        Ritmo.calado++;
        try {
            await Vida.eventoAleatorio(s);
        } finally {
            Ritmo.calado--;
        }
    },

    modalAberto(titulo) {
        // só conta o que abriu dentro da semana simulada (não o que o usuário abriu
        // entre uma semana e outra) e nunca os eventos da vida
        if (!Ritmo.rodando || !Ritmo.naSemana || Ritmo.calado) return;
        // "<span class="modal-icone">📱</span>📱 Mensagem de X" -> "📱 Mensagem de X"
        const ic = String(titulo || '').match(/<span class="modal-icone">([\s\S]*?)<\/span>/);
        const resto = Ritmo.limpo(String(titulo || '').replace(/<span class="modal-icone">[\s\S]*?<\/span>/, ''));
        const comIcone = /^[A-Za-zÀ-ÿ0-9"'(]/.test(resto) ? `${ic ? Ritmo.limpo(ic[1]) : '📨'} ${resto}` : resto;
        Ritmo.modais.push(resto ? comIcone : '📨 Uma decisão apareceu');
    },

    // índice da resposta lembrada para esta pergunta (-1 = não tem)
    lembrada(s, chave, opcoes) {
        const lem = Ritmo.estado(s).lembrar[chave];
        if (!lem) return -1;
        let i = opcoes.findIndex(o => Ritmo.limpo(o) === lem.txt);
        if (i < 0 && lem.i >= 0 && lem.i < opcoes.length) i = lem.i;   // o texto mudou (valor no botão, por exemplo)
        if (i < 0) return -1;
        lem.n = (lem.n || 0) + 1;
        Conquistas.contar(s, 'respostasAuto');
        return i;
    },

    lembrar(s, chave, rotulo, icone, opcoes, i) {
        const txt = Ritmo.limpo(opcoes[i]);
        Ritmo.estado(s).lembrar[chave] = { i, txt, titulo: Ritmo.limpo(rotulo), icone: icone || '🔁', n: 0 };
        UI.toast(`🔁 Escolha lembrada: <b>${U.esc(txt)}</b>. Para mudar, vá em Vida → 🔁 Automático.`);
    },

    htmlLembrar() {
        return `<label class="rt-lembrar"><input type="checkbox" data-mudar="rtLembrar"> 🔁 Lembrar minha escolha <small>(da próxima vez responde sozinho)</small></label>`;
    },

    // Pergunta com a caixinha "🔁 Lembrar minha escolha". Se a resposta já foi
    // lembrada, nem abre: registra no diário e devolve o índice dela.
    async perguntar(s, chave, titulo, texto, opcoes, icone, rotulo) {
        const k = Ritmo.lembrada(s, chave, opcoes);
        if (k >= 0) {
            Vida.log(s, `${icone || '🔁'} ${U.esc(rotulo || Ritmo.limpo(titulo))}: 🔁 ${U.esc(Ritmo.limpo(opcoes[k]))}`, '');
            return k;
        }
        Ritmo.marcado = false;
        const i = await UI.perguntar(titulo, `${texto}${Ritmo.htmlLembrar()}`, opcoes, icone);
        if (Ritmo.marcado && typeof i === 'number' && opcoes[i] != null) Ritmo.lembrar(s, chave, rotulo || titulo, icone, opcoes, i);
        Ritmo.marcado = false;
        return i;
    },

    // gancho de Vida.eventoAleatorio: { i, auto } (auto = sem abrir nada)
    async escolherEvento(s, ev, texto) {
        const ops = ev.ops.map(o => o.txt);
        if (ops.length === 1) return { i: 0, auto: true, unica: true };   // não há o que decidir
        const chave = 'ev:' + ev.titulo;
        const k = Ritmo.lembrada(s, chave, ops);
        if (k >= 0) return { i: k, auto: true };
        Ritmo.marcado = false;
        let i = await UI.perguntar(ev.titulo, `${texto}${Ritmo.htmlLembrar()}`, ops, ev.icone);
        if (typeof i !== 'number' || !ev.ops[i]) i = 0;
        if (Ritmo.marcado) Ritmo.lembrar(s, chave, ev.titulo, ev.icone, ops, i);
        Ritmo.marcado = false;
        return { i, auto: false };
    },

    // evento resolvido sozinho: só um aviso rápido e a linha no diário
    eventoAutomatico(s, ev, r, res, texto) {
        const corpo = r.unica ? `${texto} ${res || ''}` : `🔁 <i>${U.esc(ev.ops[r.i].txt)}</i> → ${res || 'feito.'}`;
        Vida.log(s, `${ev.icone} <b>${U.esc(ev.titulo)}:</b> ${corpo}`, 'evento');
        UI.toast(`${ev.icone} <b>${U.esc(ev.titulo)}</b><br>${corpo}`);
    },

    // -----------------------------------------------------------------
    //  🤖 Treino automático (carreira de jogador)
    // -----------------------------------------------------------------
    // o melhor treino para esta semana: { k, motivo }
    treinoIdeal(s, p) {
        const hab = id => (s.car.habs || []).indexOf(id) >= 0;
        const teto = 65 + s.pessoa.felicidade * 0.35;   // Jogador.semana não deixa a forma passar disso
        // forma prevista no próximo jogo com cada treino (+18 da recuperação da semana)
        const prev = k => Math.min(100, Math.min(teto, U.clamp(p.cond + TREINOS[k].cond + (hab('motorzinho') ? 5 : 0), 30, 100)) + 18);
        const evolui = p.idade <= 30 && (p.ovr < p.pot || p.idade < 24);
        if (p.les > 0) return { k: 'leve', motivo: 'lesionado: só recuperação' };
        if (p.recaida > 0) return { k: 'leve', motivo: 'ainda tem risco de recaída da lesão' };
        if (s.pessoa.saude < 45) return { k: 'leve', motivo: 'sua saúde está baixa' };
        if (prev('normal') < 80) return { k: 'leve', motivo: `forma física baixa (${Math.round(p.cond)}%)` };
        if (!evolui) return { k: 'leve', motivo: p.idade > 30 ? 'depois dos 30 o treino pesado não faz evoluir: poupar o corpo' : 'você já chegou no seu teto: foco no físico' };
        const grande = Ritmo.jogoGrandeNa(s, s.semana + 1);
        if (grande && prev('intenso') < 100) return { k: 'normal', motivo: `poupando o físico para ${grande.tipo === 'final' ? 'a final' : 'o clássico'} da semana que vem` };
        const minimo = hab('blindado') ? 80 : 85;
        const seq = s.car.treinoSeq || 0;   // semanas seguidas no intenso
        if (p.idade <= 27 && seq >= (p.idade <= 24 ? 3 : 1)) return { k: 'normal', motivo: 'semana de recuperação depois da carga pesada (menos risco de lesão)' };
        if (p.idade <= 24 && prev('intenso') >= minimo) return { k: 'intenso', motivo: 'jovem e inteiro: hora de pegar pesado' };
        if (p.idade <= 27 && prev('intenso') >= minimo + 8) return { k: 'intenso', motivo: 'inteiro e ainda com margem para evoluir' };
        return { k: 'normal', motivo: p.idade >= 28 ? 'nessa idade o intenso rende pouco: equilíbrio' : 'equilíbrio entre evolução e descanso' };
    },

    // gancho do começo de Jogador.semana
    escolherTreino(s, p) {
        if (!s.car.treinoAuto || !p) return;
        const t = Ritmo.treinoIdeal(s, p);
        const antes = s.car.treino;
        s.car.treino = t.k;
        s.car.treinoMotivo = t.motivo;
        s.car.treinoSeq = t.k === 'intenso' ? (s.car.treinoSeq || 0) + 1 : 0;
        Conquistas.contar(s, 'treinosAuto');
        if (antes !== t.k && !Ritmo.rodando) UI.toast(`🤖 Treino automático: ${TREINOS[t.k].icone} ${TREINOS[t.k].nome} (${t.motivo})`);
    },

    htmlTreinoAuto(s) {
        const on = !!s.car.treinoAuto;
        const tr = TREINOS[s.car.treino] || TREINOS.normal;
        return `<div class="rt-treino-auto">
            <button class="atividade ${on ? 'ativa' : ''}" data-acao="rtTreinoAuto">
                <span class="at-icone">🤖</span><b>Treino automático${on ? ' <small class="tag">ligado</small>' : ''}</b>
                <small>Escolhe sozinho toda semana: descansa quando você está cansado, lesionado ou com risco de recaída e pega pesado quando está inteiro e jovem.</small>
            </button>
            ${on ? `<p class="pequeno">🤖 Escolha da semana: <b>${tr.icone} ${tr.nome}</b>${s.car.treinoMotivo ? ` — ${U.esc(s.car.treinoMotivo)}` : ''}</p>` : ''}
        </div>`;
    },

    // -----------------------------------------------------------------
    //  Telas: Vida → 🔁 Automático e Opções
    // -----------------------------------------------------------------
    htmlOpcoesRitmo() {
        const o = Jogo.opcoes;
        return `<label class="campo check"><input type="checkbox" data-mudar="rtOpGrandes" ${o.ritmoGrandes !== false ? 'checked' : ''}> ⏭️ "Até algo importante" para antes de clássicos, finais e duelos com o seu rival (para você jogar ao vivo)</label>
            <label class="campo">⏭️ Máximo de semanas por vez no "Até algo importante"
                <select class="sel" data-mudar="rtOpMax">${RITMO_LIMITES.map(v => `<option value="${v}" ${Ritmo.limite() === v ? 'selected' : ''}>${v === 46 ? 'Até o fim da temporada' : v + ' semanas'}</option>`).join('')}</select>
            </label>
            <label class="campo check"><input type="checkbox" data-mudar="rtOpMenos" ${o.menosEventos ? 'checked' : ''}> ⚡ Menos eventos aleatórios da vida (aparecem bem menos)</label>`;
    },

    htmlOpcoes() {
        const s = Jogo.s;
        const n = s ? Object.keys(Ritmo.estado(s).lembrar).length : 0;
        return Ritmo.htmlOpcoesRitmo() + (s ? `<div class="campo check rt-op-lembradas"><span>🔁 Respostas lembradas: <b>${n}</b> <small class="cinza">(lista em Vida → 🔁 Automático)</small></span>
            <button class="btn btn-pequeno" data-acao="rtEsquecerTodas" ${n ? '' : 'disabled'}>Esquecer todas</button></div>` : '');
    },

    telaVida(s) {
        const r = Ritmo.estado(s);
        const lista = Object.keys(r.lembrar).map(k => Object.assign({ k }, r.lembrar[k]));
        return `<p class="cinza pequeno">Marque <b>🔁 Lembrar minha escolha</b> num evento que se repete e, da próxima vez, ele se resolve sozinho: só aparece um aviso rápido e uma linha no diário. Eventos com uma opção só já viram aviso rápido.</p>
            <h4>🔁 Respostas lembradas</h4>
            ${lista.length ? `<div class="lista-bens">${lista.map(x => `<div class="bem rt-item"><span>${x.icone} <b>${U.esc(x.titulo)}</b><small>→ ${U.esc(x.txt)}${x.n ? ` · usada ${x.n}x` : ''}</small></span>
                <button class="btn btn-pequeno" data-acao="rtEsquecer" data-k="${U.esc(x.k)}">Esquecer</button></div>`).join('')}</div>
                ${lista.length > 1 ? '<div class="linha-botoes"><button class="btn btn-pequeno btn-perigo" data-acao="rtEsquecerTodas">🗑️ Esquecer todas</button></div>' : ''}`
            : '<p class="cinza">Nenhuma escolha lembrada ainda.</p>'}
            <h4>⚙️ Ritmo do jogo</h4>
            <div class="form-opcoes rt-opcoes">${Ritmo.htmlOpcoesRitmo()}</div>
            ${s.modo === 'jogador' && s.car.pid != null && Jogador.p(s) && !Jogador.p(s).aposentado ? `<h4>🤖 Treino</h4>${Ritmo.htmlTreinoAuto(s)}` : ''}`;
    },
};

// Os ganchos que rodam no meio de Jogo.avancar/Jogador.semana e no perfil nunca
// podem quebrar a semana nem a tela: um erro aqui só vira aviso no console.
['inicioSemana', 'aposJogos', 'fimSemana', 'escolherTreino', 'htmlSemana'].forEach(k => {
    const fn = Ritmo[k];
    Ritmo[k] = function () {
        try {
            return fn.apply(Ritmo, arguments);
        } catch (e) {
            console.warn('ritmo.' + k, e);
            return '';
        }
    };
});

// todo modal que abre passa por aqui (js/ui.js): é assim que o ⏭️ sabe que
// apareceu uma decisão no meio da semana simulada
UI.aoAbrirModal = titulo => Ritmo.modalAberto(titulo);

Object.assign(ACOES, {
    rtAvancarAte: () => Ritmo.rodar(Ritmo.limite(), true),
    rtParar() {
        if (!Ritmo.rodando || Date.now() - Ritmo.inicio < 450) return;   // duplo clique no ⏭️ não para
        Ritmo.pedidoParar = true;
        UI.toast('⏹ Parando no fim desta semana...');
    },
    rtLembrar: (d, el) => { Ritmo.marcado = !!el.checked; },
    rtEsquecer(d) {
        const s = Jogo.s;
        if (!s) return;
        delete Ritmo.estado(s).lembrar[d.k];
        UI.toast('🔁 Escolha esquecida: da próxima vez você decide de novo.');
        Jogo.manterRolagem = true;
        Jogo.atualizar();
    },
    async rtEsquecerTodas() {
        const s = Jogo.s;
        if (!s) return;
        if (!(await UI.confirmar('Esquecer todas as respostas lembradas? Os eventos voltam a perguntar.', 'Esquecer todas'))) return;
        Ritmo.estado(s).lembrar = {};
        UI.toast('🔁 Todas as respostas foram esquecidas.');
        if (Jogo.subPausa === 'opcoes' && document.getElementById('overlay').innerHTML) Jogo.abrirPausa('opcoes');
        Jogo.manterRolagem = true;
        Jogo.atualizar();
    },
    rtTreinoAuto() {
        const s = Jogo.s;
        if (!s || s.modo !== 'jogador') return;
        s.car.treinoAuto = !s.car.treinoAuto;
        if (s.car.treinoAuto) {
            const t = Ritmo.treinoIdeal(s, Jogador.p(s));
            s.car.treino = t.k;
            s.car.treinoMotivo = t.motivo;
            UI.toast(`🤖 Treino automático ligado: esta semana ${TREINOS[t.k].icone} ${TREINOS[t.k].nome}.`);
        } else UI.toast('🤖 Treino automático desligado: o treino fica o que estiver marcado.');
        Jogo.manterRolagem = true;
        Jogo.atualizar();
    },
    rtOpGrandes: (d, el) => { Jogo.opcoes.ritmoGrandes = el.checked; Jogo.gravarOpcoes(); },
    rtOpMax: (d, el) => { Jogo.opcoes.ritmoMax = +el.value; Jogo.gravarOpcoes(); },
    rtOpMenos: (d, el) => { Jogo.opcoes.menosEventos = el.checked; Jogo.gravarOpcoes(); },
});
