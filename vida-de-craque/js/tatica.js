'use strict';
// =====================================================================
//  TÁTICA LIVRE (aba Tática do técnico)
//  - arrastar um jogador do campo para outro: os dois trocam de posição
//  - arrastar um jogador da lista para o campo: entra no lugar de quem estava lá
//    (tocar numa posição e depois em outra / num jogador da lista faz o mesmo)
//  - ✏️ Mover posições: a bolinha vai para qualquer lugar do campo e vira a
//    formação "Personalizada" (salva em s.car.formPers, a posição muda conforme o lugar)
// =====================================================================

const Tatica = {
    arraste: null,
    fimArraste: 0,

    // a formação personalizada é do técnico (vale para o clube e para a seleção)
    registrar(s) {
        const pers = s && s.modo === 'tecnico' && s.car && Array.isArray(s.car.formPers) && s.car.formPers.length === 11 ? s.car.formPers : null;
        if (pers) FORMACOES.Personalizada = pers;
        else delete FORMACOES.Personalizada;
        if (!s || !s.times) return;
        // nenhum time pode ficar com uma formação que não existe neste save
        for (const t of s.times) if (t && t.form && !FORMACOES[t.form]) { t.form = '4-3-3'; t.tit = null; }
        if (s.car && s.car.sel && s.car.sel.form && !FORMACOES[s.car.sel.form]) s.car.sel.form = '4-3-3';
    },

    // a posição de quem está naquele lugar do campo (x: esquerda→direita, y: defesa→ataque)
    posDe(x, y) {
        const aberto = x < 22 || x > 78;
        if (y < 32) return aberto ? 'LAT' : 'ZAG';
        if (y < 50) return x < 18 || x > 82 ? 'LAT' : 'VOL';
        if (y < 72) return aberto ? 'PON' : 'MEI';
        return x < 26 || x > 74 ? 'PON' : 'ATA';
    },

    // troca os jogadores de duas posições do campo
    trocar(s, t, i, j) {
        if (i === j) return;
        const tit = Escalacao.doTime(s, t);
        const a = tit[i];
        tit[i] = tit[j];
        tit[j] = a;
        t.tit = tit;
        const slots = FORMACOES[t.form];
        const pa = s.jog[tit[j]], pb = s.jog[tit[i]];
        if (pa && pb) UI.toast(`🔀 ${U.esc(Tatica.curto(pa))} vai para ${slots[j][0]} e ${U.esc(Tatica.curto(pb))} para ${slots[i][0]}.`);
    },

    // coloca um jogador numa posição (se ele já estava em campo, troca com quem estava lá)
    colocar(s, t, pid, j) {
        const p = s.jog[pid];
        if (!p || !Escalacao.disponivel(p)) return UI.toast(p && p.les > 0 ? '🚑 Ele está machucado.' : '🟥 Ele não pode jogar.', 'erro');
        const tit = Escalacao.doTime(s, t);
        const k = tit.indexOf(pid);
        if (k === j) return;
        const sai = tit[j] != null ? s.jog[tit[j]] : null;
        if (k >= 0) tit[k] = tit[j];
        tit[j] = pid;
        t.tit = tit;
        const slot = FORMACOES[t.form][j][0];
        UI.toast(k >= 0 ? `🔀 ${U.esc(Tatica.curto(p))} agora joga de ${slot}.` : `🔁 Entra ${U.esc(Tatica.curto(p))}${sai ? `, sai ${U.esc(Tatica.curto(sai))}` : ''} (${slot}).`);
    },

    // ✏️ move uma posição para (x, y) e salva como formação Personalizada
    moverSlot(s, t, i, x, y) {
        if (i === 0) return UI.toast('🧤 O goleiro fica no gol.');
        x = Math.round(U.clamp(x, 6, 94));
        y = Math.round(U.clamp(y, 14, 92));
        const tit = Escalacao.doTime(s, t);   // fixa a escalação: quem estava ali continua ali
        const nova = FORMACOES[t.form].map(sl => sl.slice());
        const antes = nova[i][0], pos = Tatica.posDe(x, y);
        nova[i] = [pos, x, y];
        s.car.formPers = nova;
        FORMACOES.Personalizada = nova;
        t.form = 'Personalizada';
        t.tit = tit;
        const p = s.jog[tit[i]];
        if (pos !== antes) UI.toast(`✏️ ${p ? U.esc(Tatica.curto(p)) + ' agora' : 'A posição agora'} joga de <b>${POS_NOME[pos]}</b>.`);
    },

    curto: p => p.nome.split(' ').slice(-1)[0],

    // ---------------------------------------------------------------
    //  Arrastar e soltar (mouse e toque)
    // ---------------------------------------------------------------
    ativo: () => !!(Jogo.s && Jogo.s.modo === 'tecnico' && Jogo.aba === 'tatica' && !TelaPartida.ativo()),

    inicio(e) {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        const el = e.target.closest('[data-arrastar]');
        if (!el || el.disabled || !Tatica.ativo()) return;
        Tatica.arraste = { el, tipo: el.dataset.arrastar, i: +el.dataset.i, pid: +el.dataset.pid, x0: e.clientX, y0: e.clientY, id: e.pointerId, toque: e.pointerType !== 'mouse', ativo: false };
    },

    mover(e) {
        const a = Tatica.arraste;
        if (!a || e.pointerId !== a.id) return;
        const dx = e.clientX - a.x0, dy = e.clientY - a.y0;
        if (!a.ativo) {
            if (Math.abs(dx) + Math.abs(dy) < 8) return;
            // na lista, no celular, arrastar para cima/baixo é rolar a lista
            if (a.tipo === 'jog' && a.toque && Math.abs(dy) > Math.abs(dx)) { Tatica.arraste = null; return; }
            a.ativo = true;
            a.editar = a.tipo === 'slot' && !!Jogo.ui.editarForm;
            a.campo = document.querySelector('.campinho');
            if (!a.editar) {
                a.fantasma = document.createElement('div');
                a.fantasma.className = 'arraste-fantasma';
                a.fantasma.textContent = a.el.dataset.nome || '';
                document.body.appendChild(a.fantasma);
            }
            a.el.classList.add('arrastando');
            document.body.classList.add('arrastando-tatica');
        }
        if (e.cancelable) e.preventDefault();
        if (a.editar) {
            // a própria bolinha anda pelo campo, mostrando a posição que vai virar
            const r = a.campo.getBoundingClientRect();
            const x = U.clamp((e.clientX - r.left) / r.width * 100, 6, 94), y = U.clamp(100 - (e.clientY - r.top) / r.height * 100, 14, 92);
            a.el.style.left = x + '%';
            a.el.style.top = (100 - y) + '%';
            const rot = a.el.querySelector('.slot-pos');
            if (rot && a.i !== 0) rot.textContent = Tatica.posDe(x, y);
            return;
        }
        a.fantasma.style.left = e.clientX + 'px';
        a.fantasma.style.top = e.clientY + 'px';
        const alvo = Tatica.alvo(e.clientX, e.clientY);
        if (alvo !== a.alvo) {
            if (a.alvo) a.alvo.classList.remove('alvo');
            if (alvo && alvo !== a.el) alvo.classList.add('alvo');
            a.alvo = alvo;
        }
    },

    alvo(x, y) {
        const el = document.elementFromPoint(x, y);
        return el ? el.closest('.campinho .slot') : null;
    },

    fim(e, cancelado) {
        const a = Tatica.arraste;
        if (!a || e.pointerId !== a.id) return;
        Tatica.arraste = null;
        if (!a.ativo) return;   // foi um toque: o clique normal cuida (tcSlot / tcEscolherJog)
        Tatica.fimArraste = Date.now();
        if (a.fantasma) a.fantasma.remove();
        if (a.alvo) a.alvo.classList.remove('alvo');
        a.el.classList.remove('arrastando');
        document.body.classList.remove('arrastando-tatica');
        const s = Jogo.s, t = s && Tecnico.time(s);
        if (!cancelado && t && Tatica.ativo()) {
            if (a.editar) {
                const r = a.campo.getBoundingClientRect();
                if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) {
                    Tatica.moverSlot(s, t, a.i, (e.clientX - r.left) / r.width * 100, 100 - (e.clientY - r.top) / r.height * 100);
                }
            } else {
                const alvo = Tatica.alvo(e.clientX, e.clientY);
                if (alvo) {
                    const j = +alvo.dataset.i;
                    if (a.tipo === 'slot') Tatica.trocar(s, t, a.i, j);
                    else if (a.tipo === 'jog') Tatica.colocar(s, t, a.pid, j);
                }
            }
        }
        Jogo.ui.slotSel = null;
        Jogo.manterRolagem = true;
        Jogo.atualizar();
    },
};

document.addEventListener('pointerdown', e => Tatica.inicio(e));
document.addEventListener('pointermove', e => Tatica.mover(e), { passive: false });
document.addEventListener('pointerup', e => Tatica.fim(e, false));
document.addEventListener('pointercancel', e => Tatica.fim(e, true));
// depois de arrastar, o navegador ainda manda um "clique": ele não pode virar seleção
document.addEventListener('click', e => {
    if (Date.now() - Tatica.fimArraste < 400 && e.target.closest && e.target.closest('.grade-tatica')) { e.stopPropagation(); e.preventDefault(); }
}, true);

Object.assign(ACOES, {
    tcEditarForm() {
        Jogo.ui.editarForm = !Jogo.ui.editarForm;
        Jogo.ui.slotSel = null;
        Jogo.manterRolagem = true;
        Jogo.atualizar();
        if (Jogo.ui.editarForm) UI.toast('✏️ Arraste as bolinhas para qualquer lugar do campo. A posição muda conforme o lugar.');
    },
});
