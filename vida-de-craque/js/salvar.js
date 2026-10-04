'use strict';
// =====================================================================
//  SALVAR / CARREGAR — slots no navegador + exportar/importar arquivo
// =====================================================================

const Salvar = {
    PREFIXO: 'vdc_',
    SLOTS: ['auto', '1', '2', '3', '4', '5'],

    nomeSlot: slot => slot === 'auto' ? 'Salvamento automático' : `Slot ${slot}`,

    async compactar(txt) {
        if (typeof CompressionStream === 'undefined') return 'J' + txt;
        try {
            const stream = new Blob([txt]).stream().pipeThrough(new CompressionStream('gzip'));
            const buf = new Uint8Array(await new Response(stream).arrayBuffer());
            let bin = '';
            for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode.apply(null, buf.subarray(i, i + 0x8000));
            return 'G' + btoa(bin);
        } catch (e) {
            return 'J' + txt;
        }
    },

    async descompactar(str) {
        if (str[0] === '{') return str;
        if (str[0] === 'J') return str.slice(1);
        const bin = atob(str.slice(1));
        const buf = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
        const stream = new Blob([buf]).stream().pipeThrough(new DecompressionStream('gzip'));
        return await new Response(stream).text();
    },

    meta(s) {
        const p = s.pessoa;
        let clube = 'Sem clube';
        if (s.modo === 'tecnico' && s.car.tid >= 0) clube = s.times[s.car.tid].nome;
        if (s.modo === 'jogador') {
            const j = s.jog[s.car.pid];
            if (j && j.tid >= 0) clube = s.times[j.tid].nome;
        }
        return {
            nome: p.nome, idade: p.idade, modo: s.modo, clube, ano: s.ano, semana: s.semana,
            data: Date.now(), morto: !!p.morto,
        };
    },

    async salvar(s, slot) {
        try {
            const dados = await Salvar.compactar(JSON.stringify(s));
            localStorage.setItem(Salvar.PREFIXO + 'save_' + slot, dados);
            localStorage.setItem(Salvar.PREFIXO + 'meta_' + slot, JSON.stringify(Salvar.meta(s)));
            localStorage.setItem(Salvar.PREFIXO + 'ultimo', slot);
            return true;
        } catch (e) {
            console.error(e);
            return false;
        }
    },

    listar() {
        return Salvar.SLOTS.map(slot => {
            let meta = null;
            try { meta = JSON.parse(localStorage.getItem(Salvar.PREFIXO + 'meta_' + slot) || 'null'); } catch (e) { /* vazio */ }
            return { slot, meta };
        });
    },

    ultimo() {
        try {
            const slot = localStorage.getItem(Salvar.PREFIXO + 'ultimo');
            if (slot && localStorage.getItem(Salvar.PREFIXO + 'save_' + slot)) return slot;
        } catch (e) { /* sem acesso */ }
        return null;
    },

    async carregar(slot) {
        const d = localStorage.getItem(Salvar.PREFIXO + 'save_' + slot);
        if (!d) return null;
        const s = JSON.parse(await Salvar.descompactar(d));
        localStorage.setItem(Salvar.PREFIXO + 'ultimo', slot);
        return s;
    },

    apagar(slot) {
        localStorage.removeItem(Salvar.PREFIXO + 'save_' + slot);
        localStorage.removeItem(Salvar.PREFIXO + 'meta_' + slot);
        if (localStorage.getItem(Salvar.PREFIXO + 'ultimo') === slot) localStorage.removeItem(Salvar.PREFIXO + 'ultimo');
    },

    async exportar(s) {
        const dados = await Salvar.compactar(JSON.stringify(s));
        const blob = new Blob([dados], { type: 'text/plain' });
        const a = document.createElement('a');
        const nome = s.pessoa.nome.normalize('NFD').replace(/[^\w]+/g, '-').toLowerCase();
        a.href = URL.createObjectURL(blob);
        a.download = `vida-de-craque-${nome}-${s.ano}.vdc`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    },

    importar() {
        return new Promise(resolve => {
            const inp = document.createElement('input');
            inp.type = 'file';
            inp.accept = '.vdc,.json,.txt';
            inp.onchange = async () => {
                const f = inp.files[0];
                if (!f) return resolve(null);
                try {
                    const txt = await f.text();
                    resolve(JSON.parse(await Salvar.descompactar(txt.trim())));
                } catch (e) {
                    console.error(e);
                    resolve(null);
                }
            };
            inp.click();
        });
    },

    // Opções do jogo (resolução, velocidade etc.)
    opcoesPadrao: { resolucao: 'auto', escala: 100, velocidade: 2, autosave: true, tema: 'escuro' },

    lerOpcoes() {
        try {
            return Object.assign({}, Salvar.opcoesPadrao, JSON.parse(localStorage.getItem(Salvar.PREFIXO + 'opcoes') || '{}'));
        } catch (e) {
            return Object.assign({}, Salvar.opcoesPadrao);
        }
    },

    gravarOpcoes(o) {
        try { localStorage.setItem(Salvar.PREFIXO + 'opcoes', JSON.stringify(o)); } catch (e) { /* sem acesso */ }
    },
};
