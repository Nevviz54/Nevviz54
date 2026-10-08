'use strict';
// =====================================================================
//  SALVAR / CARREGAR
//  Os saves vão para o melhor lugar disponível:
//    ☁️ nuvem      — jogo aberto pelo link do Claude (banco de dados da conta)
//    💾 navegador  — IndexedDB (ou localStorage, se não houver IndexedDB)
//    ⚠️ memória    — quando o navegador bloqueia tudo (visualizador de
//                    arquivos do celular/app). Aí só exportando.
//  Exportar/importar funcionam por arquivo, compartilhamento ou código.
// =====================================================================

const PREFIXO_SAVE = 'vdc_';

// ---------------- Backends ----------------
const ArmLocal = {
    nome: 'local',
    async iniciar() {
        const k = PREFIXO_SAVE + 'teste';
        localStorage.setItem(k, '1');
        localStorage.removeItem(k);
        return true;
    },
    async ler(k) { return localStorage.getItem(PREFIXO_SAVE + k); },
    async gravar(k, v) { localStorage.setItem(PREFIXO_SAVE + k, v); },
    async apagar(k) { localStorage.removeItem(PREFIXO_SAVE + k); },
};

const ArmIdb = {
    nome: 'idb',
    db: null,
    iniciar() {
        return new Promise((resolve, reject) => {
            if (typeof indexedDB === 'undefined') return reject(new Error('sem IndexedDB'));
            const tempo = setTimeout(() => reject(new Error('IndexedDB não respondeu')), 3000);
            let r;
            try { r = indexedDB.open('vida-de-craque', 1); } catch (e) { clearTimeout(tempo); return reject(e); }
            r.onupgradeneeded = () => r.result.createObjectStore('saves');
            r.onsuccess = () => {
                clearTimeout(tempo);
                ArmIdb.db = r.result;
                // gravação de teste: alguns navegadores abrem mas não deixam gravar (ou
                // nunca terminam). Um IndexedDB só lento continua valendo: o menu abre
                // antes (Jogo.iniciar não espera mais que 6s) e os saves aparecem depois.
                const tempoTeste = setTimeout(() => reject(new Error('IndexedDB não grava')), 15000);
                ArmIdb.gravar('teste', '1').then(() => { clearTimeout(tempoTeste); resolve(true); }, e => { clearTimeout(tempoTeste); reject(e); });
            };
            r.onerror = () => { clearTimeout(tempo); reject(r.error || new Error('IndexedDB falhou')); };
            r.onblocked = () => { clearTimeout(tempo); reject(new Error('IndexedDB bloqueado')); };
        });
    },
    tx(modo, fn) {
        return new Promise((resolve, reject) => {
            const t = ArmIdb.db.transaction('saves', modo);
            const req = fn(t.objectStore('saves'));
            t.oncomplete = () => resolve(req ? req.result : undefined);
            t.onerror = () => reject(t.error);
            t.onabort = () => reject(t.error || new Error('gravação cancelada'));
        });
    },
    ler(k) { return ArmIdb.tx('readonly', st => st.get(k)).then(v => v == null ? null : v); },
    gravar(k, v) { return ArmIdb.tx('readwrite', st => st.put(v, k)); },
    apagar(k) { return ArmIdb.tx('readwrite', st => st.delete(k)); },
};

const ArmMemoria = {
    nome: 'memoria',
    dados: new Map(),
    async iniciar() { return true; },
    async ler(k) { return ArmMemoria.dados.has(k) ? ArmMemoria.dados.get(k) : null; },
    async gravar(k, v) { ArmMemoria.dados.set(k, v); },
    async apagar(k) { ArmMemoria.dados.delete(k); },
};

// Nuvem: banco de dados do Claude (só existe quando o jogo é aberto pelo link).
// Cada documento aceita até 256 KiB, então o save é dividido em partes. As
// partes novas são gravadas num conjunto alternado (a/b) e só depois o
// "meta" passa a apontar para elas: se a gravação cair no meio, o save
// anterior continua inteiro.
const ArmNuvem = {
    nome: 'nuvem',
    db: null,
    uid: null,
    TAM_PARTE: 180000,
    async iniciar() {
        if (typeof window === 'undefined' || !window.claude || typeof window.claude.use !== 'function') return false;
        const [db, user] = await Promise.all([window.claude.use('db'), window.claude.use('user')]);
        if (!db || !user) return false;
        const uid = await user.id();
        if (!uid) return false;
        ArmNuvem.db = db;
        ArmNuvem.uid = uid;
        return true;
    },
    doc(id) { return ArmNuvem.db.collection('data/users/' + ArmNuvem.uid).doc(id); },
    async tentar(fn) {
        try { return await fn(); } catch (e) {
            if (e && e.code === 'unavailable') {
                await new Promise(r => setTimeout(r, 400 + Math.random() * 800));
                return await fn();
            }
            throw e;
        }
    },
    async lerMeta(slot) {
        const d = await ArmNuvem.tentar(() => ArmNuvem.doc('m_' + slot).get());
        return d.exists ? d.data() : null;
    },
    async lerSave(slot) {
        const m = await ArmNuvem.lerMeta(slot);
        if (!m) return null;
        const partes = [];
        for (let i = 0; i < m.partes; i++) {
            const d = await ArmNuvem.tentar(() => ArmNuvem.doc(`p_${slot}_${m.conj}_${i}`).get());
            if (!d.exists || d.data().versao !== m.versao) throw new Error('o save da nuvem está incompleto');
            partes.push(d.data().d);
        }
        return partes.join('');
    },
    async gravarSave(slot, dados, meta) {
        const antigo = await ArmNuvem.lerMeta(slot);
        const conj = antigo && antigo.conj === 'a' ? 'b' : 'a';
        const versao = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
        const n = Math.ceil(dados.length / ArmNuvem.TAM_PARTE);
        for (let i = 0; i < n; i++) {
            const d = dados.slice(i * ArmNuvem.TAM_PARTE, (i + 1) * ArmNuvem.TAM_PARTE);
            await ArmNuvem.tentar(() => ArmNuvem.doc(`p_${slot}_${conj}_${i}`).set({ versao, d }));
        }
        await ArmNuvem.tentar(() => ArmNuvem.doc('m_' + slot).set({ meta, partes: n, conj, versao }));
        // limpa o conjunto antigo (não é crítico se falhar)
        if (antigo) {
            for (let i = 0; i < antigo.partes; i++) {
                await ArmNuvem.doc(`p_${slot}_${antigo.conj}_${i}`).delete().catch(() => {});
            }
        }
    },
    async apagarSave(slot) {
        const m = await ArmNuvem.lerMeta(slot);
        await ArmNuvem.tentar(() => ArmNuvem.doc('m_' + slot).delete());
        if (m) for (let i = 0; i < m.partes; i++) await ArmNuvem.doc(`p_${slot}_${m.conj}_${i}`).delete().catch(() => {});
    },
};

// ---------------- Interface usada pelo jogo ----------------
const Salvar = {
    SLOTS: ['auto', '1', '2', '3', '4', '5'],
    nav: ArmMemoria,        // armazenamento do navegador em uso
    nuvem: false,           // nuvem disponível?
    metas: {},              // slot -> { nav: meta, nuvem: meta }
    filas: {},              // gravações em série por slot
    ultimaNuvemAuto: 0,
    pendenteNuvemAuto: null,
    aoMudar: null,          // a interface se registra aqui para redesenhar

    nomeSlot: slot => slot === 'auto' ? 'Salvamento automático' : `Slot ${slot}`,

    // onde os saves estão ficando, para mostrar ao jogador
    onde() {
        if (Salvar.nuvem) return 'nuvem';
        return Salvar.nav === ArmMemoria ? 'memoria' : 'navegador';
    },

    async iniciar() {
        for (const arm of [ArmIdb, ArmLocal]) {
            try {
                if (await arm.iniciar()) { Salvar.nav = arm; break; }
            } catch (e) { /* tenta o próximo */ }
        }
        if (Salvar.nav === ArmIdb) await Salvar.migrarLocal();
        await Salvar.lerMetas('nav');
        // se o menu já abriu sem os saves (armazenamento lento), redesenha
        if (Salvar.aoMudar) Salvar.aoMudar();
        // a nuvem chega depois (só existe quando o jogo é aberto pelo link).
        // O jogo começa antes do 'load'; se o Claude ainda não preparou a página,
        // a nuvem é procurada de novo quando ela terminar de carregar.
        const ligarNuvem = () => ArmNuvem.iniciar().then(async ok => {
            if (!ok) return;
            Salvar.nuvem = true;
            await Salvar.lerMetas('nuvem');
            if (Salvar.aoMudar) Salvar.aoMudar();
        }).catch(e => console.warn('nuvem indisponível', e));
        if (window.claude || document.readyState === 'complete') ligarNuvem();
        else window.addEventListener('load', ligarNuvem, { once: true });
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') Salvar.enviarNuvemPendente();
        });
    },

    // Saves do localStorage passam para o IndexedDB, que tem muito mais espaço.
    // Eles aparecem quando o IndexedDB falhou numa sessão (o jogo usou o
    // localStorage). Nada é apagado sem antes estar copiado: se o mesmo slot
    // existe nos dois, o mais novo fica no slot e o outro vai para um slot livre.
    async migrarLocal() {
        let L;
        try { L = window.localStorage; if (!L) return; } catch (e) { return; }
        const data = m => {
            try { return ((typeof m === 'string' ? JSON.parse(m) : m) || {}).data || 0; } catch (e) { return 0; }
        };
        const livre = async () => {
            for (const s of Salvar.SLOTS) {
                if (s === 'auto') continue;
                if (!(await ArmIdb.ler('save_' + s)) && !L.getItem(PREFIXO_SAVE + 'save_' + s)) return s;
            }
            return null;
        };
        const gravarIdb = async (slot, save, meta) => {
            await ArmIdb.gravar('save_' + slot, save);
            if (meta) await ArmIdb.gravar('meta_' + slot, meta);
        };
        for (const slot of Salvar.SLOTS) {
            try {
                const save = L.getItem(PREFIXO_SAVE + 'save_' + slot);
                if (!save) continue;
                const meta = L.getItem(PREFIXO_SAVE + 'meta_' + slot);
                const saveIdb = await ArmIdb.ler('save_' + slot);
                if (!saveIdb) {
                    await gravarIdb(slot, save, meta);
                } else if (saveIdb !== save) {
                    const metaIdb = await ArmIdb.ler('meta_' + slot);
                    const outro = await livre();
                    if (data(meta) > data(metaIdb)) {
                        // o do navegador é mais novo: fica no slot; o antigo vai para um livre
                        if (outro) await gravarIdb(outro, saveIdb, metaIdb);
                        else if (slot !== 'auto') continue;   // sem espaço: tenta de novo depois
                        await gravarIdb(slot, save, meta);
                    } else {
                        // o do IndexedDB é mais novo: o do navegador vai para um slot livre
                        if (!outro) continue;
                        await gravarIdb(outro, save, meta);
                    }
                }
                L.removeItem(PREFIXO_SAVE + 'save_' + slot);
                L.removeItem(PREFIXO_SAVE + 'meta_' + slot);
            } catch (e) { /* fica no localStorage e tenta de novo na próxima vez */ }
        }
    },

    async lerMetas(origem) {
        for (const slot of Salvar.SLOTS) {
            let meta = null;
            try {
                if (origem === 'nuvem') {
                    const m = await ArmNuvem.lerMeta(slot);
                    meta = m ? m.meta : null;
                } else {
                    const txt = await Salvar.nav.ler('meta_' + slot);
                    meta = txt ? JSON.parse(txt) : null;
                }
            } catch (e) { meta = null; }
            Salvar.metas[slot] = Object.assign(Salvar.metas[slot] || {}, { [origem]: meta });
        }
    },

    // meta mais recente do slot (nuvem ou navegador)
    metaDe(slot) {
        const m = Salvar.metas[slot] || {};
        if (m.nav && m.nuvem) return m.nuvem.data > m.nav.data ? m.nuvem : m.nav;
        return m.nav || m.nuvem || null;
    },

    listar() {
        return Salvar.SLOTS.map(slot => ({ slot, meta: Salvar.metaDe(slot) }));
    },

    ultimo() {
        let melhor = null;
        for (const { slot, meta } of Salvar.listar()) {
            if (meta && (!melhor || meta.data > melhor.meta.data)) melhor = { slot, meta };
        }
        return melhor ? melhor.slot : null;
    },

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
        str = String(str || '').replace(/^﻿/, '').trim();
        if (str[0] === '{') return str;
        if (str[0] === 'J') return str.slice(1);
        if (str[0] !== 'G') throw new Error('isso não parece um save do Vida de Craque');
        if (typeof DecompressionStream === 'undefined') throw new Error('este navegador é antigo demais para abrir saves compactados');
        // códigos colados podem vir com quebras de linha/espaços
        const bin = atob(str.slice(1).replace(/\s+/g, ''));
        const buf = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
        const stream = new Blob([buf]).stream().pipeThrough(new DecompressionStream('gzip'));
        return await new Response(stream).text();
    },

    // Os ~10 mil jogadores são guardados por colunas (sem repetir o nome de
    // cada campo), o que deixa o save cerca de 1/3 menor.
    empacotarJog(jog) {
        const grupos = {};
        for (const id in jog) {
            const p = jog[id];
            const k = Object.keys(p).filter(c => p[c] !== undefined);
            const sig = k.join(',');
            const g = grupos[sig] || (grupos[sig] = { k, ids: [], c: k.map(() => []) });
            g.ids.push(id);
            k.forEach((c, i) => g.c[i].push(p[c]));
        }
        return Object.values(grupos);
    },

    desempacotarJog(grupos) {
        const jog = {};
        for (const g of grupos) {
            g.ids.forEach((id, n) => {
                const p = {};
                g.k.forEach((c, i) => { p[c] = g.c[i][n]; });
                jog[id] = p;
            });
        }
        return jog;
    },

    // estado do jogo -> texto compactado
    async codificar(s) {
        const resto = Object.assign({}, s);
        delete resto.jog;
        resto._jogCol = Salvar.empacotarJog(s.jog);
        return Salvar.compactar(JSON.stringify(resto));
    },

    // texto -> estado do jogo (com validação)
    async decodificar(str) {
        let s;
        try {
            s = JSON.parse(await Salvar.descompactar(str));
        } catch (e) {
            throw new Error(/save do Vida|antigo demais/.test(e.message) ? e.message : 'o arquivo/código está incompleto ou corrompido');
        }
        if (s && s._jogCol) {
            s.jog = Salvar.desempacotarJog(s._jogCol);
            delete s._jogCol;
        }
        if (!s || !s.times || !s.pessoa || !s.jog) throw new Error('isso não parece um save do Vida de Craque');
        return s;
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

    descreverErro(e) {
        if (!e) return 'erro desconhecido';
        if (e.name === 'QuotaExceededError' || /quota/i.test(e.message || '')) return 'o espaço do navegador acabou (apague saves antigos ou exporte)';
        if (e.code === 'quota_exceeded') return 'o espaço na nuvem acabou (apague saves antigos)';
        if (e.code === 'resource_exhausted') return 'muitas gravações seguidas, tente de novo em alguns segundos';
        if (e.code === 'revoked' || e.code === 'not_granted') return 'a nuvem não está disponível nesta janela';
        return e.message || String(e);
    },

    // grava em série por slot para duas gravações não se misturarem
    emFila(slot, fn) {
        const ant = Salvar.filas[slot] || Promise.resolve();
        const p = ant.catch(() => {}).then(fn);
        Salvar.filas[slot] = p;
        return p;
    },

    // Salva no navegador e na nuvem. Devolve { ok, nav, nuvem, erro }.
    // No salvamento automático a nuvem é atualizada no máximo 1x por minuto.
    async salvar(s, slot) {
        const dados = await Salvar.codificar(s);
        const meta = Salvar.meta(s);
        const r = { ok: false, nav: false, nuvem: false, erro: '' };
        await Salvar.emFila(slot, async () => {
            try {
                await Salvar.nav.gravar('save_' + slot, dados);
                await Salvar.nav.gravar('meta_' + slot, JSON.stringify(meta));
                Salvar.metas[slot] = Object.assign(Salvar.metas[slot] || {}, { nav: meta });
                r.nav = true;
            } catch (e) {
                console.error(e);
                r.erro = Salvar.descreverErro(e);
            }
        });
        if (Salvar.nuvem) {
            if (slot === 'auto' && Date.now() - Salvar.ultimaNuvemAuto < 60000) {
                Salvar.pendenteNuvemAuto = { dados, meta };
                r.nuvem = 'depois';
            } else {
                const e = await Salvar.enviarNuvem(slot, dados, meta);
                r.nuvem = !e;
                if (e && !r.erro) r.erro = e;
            }
        }
        r.ok = r.nav || r.nuvem === true;
        return r;
    },

    async enviarNuvem(slot, dados, meta) {
        if (slot === 'auto') { Salvar.ultimaNuvemAuto = Date.now(); Salvar.pendenteNuvemAuto = null; }
        try {
            await Salvar.emFila('nuvem_' + slot, () => ArmNuvem.gravarSave(slot, dados, meta));
            Salvar.metas[slot] = Object.assign(Salvar.metas[slot] || {}, { nuvem: meta });
            return '';
        } catch (e) {
            console.error(e);
            if (slot === 'auto') Salvar.ultimaNuvemAuto = 0;
            return Salvar.descreverErro(e);
        }
    },

    // envia o último salvamento automático que ficou esperando
    enviarNuvemPendente() {
        const p = Salvar.pendenteNuvemAuto;
        if (!Salvar.nuvem || !p) return Promise.resolve('');
        return Salvar.enviarNuvem('auto', p.dados, p.meta);
    },

    async carregar(slot) {
        const m = Salvar.metas[slot] || {};
        const ordem = m.nuvem && (!m.nav || m.nuvem.data > m.nav.data) ? ['nuvem', 'nav'] : ['nav', 'nuvem'];
        let erro = null;
        for (const o of ordem) {
            if (!m[o]) continue;
            try {
                const txt = o === 'nuvem' ? await ArmNuvem.lerSave(slot) : await Salvar.nav.ler('save_' + slot);
                if (txt) return await Salvar.decodificar(txt);
            } catch (e) { console.error(e); erro = e; }
        }
        throw new Error(erro ? Salvar.descreverErro(erro) : 'save não encontrado');
    },

    async apagar(slot) {
        const m = Salvar.metas[slot] || {};
        try {
            await Salvar.nav.apagar('save_' + slot);
            await Salvar.nav.apagar('meta_' + slot);
        } catch (e) { console.error(e); }
        if (Salvar.nuvem && m.nuvem) {
            try { await ArmNuvem.apagarSave(slot); } catch (e) { console.error(e); }
        }
        if (slot === 'auto') Salvar.pendenteNuvemAuto = null;
        Salvar.metas[slot] = {};
    },

    // ---------------- Exportar / importar ----------------
    nomeArquivo(s) {
        const nome = s.pessoa.nome.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w]+/g, '-').toLowerCase();
        return `vida-de-craque-${nome}-${s.ano}.txt`;
    },

    podeCompartilhar() {
        if (window.claude) return false; // a página do Claude não deixa compartilhar; lá o download já abre o menu do celular
        try {
            return !!(navigator.share && navigator.canShare && navigator.canShare({ files: [new File(['x'], 'x.txt', { type: 'text/plain' })] }));
        } catch (e) { return false; }
    },

    // baixa o arquivo. Pelo link do Claude usa o recurso de downloads da página.
    async baixar(nome, dados) {
        const blob = new Blob([dados], { type: 'text/plain' });
        if (window.claude && typeof window.claude.use === 'function') {
            const dl = await window.claude.use('downloads').catch(() => null);
            if (dl) {
                try {
                    await dl.save({ filename: nome, data: blob });
                    return { ok: true };
                } catch (e) {
                    if (e && e.code === 'declined') return { ok: false, erro: 'download cancelado' };
                    if (e && e.code === 'rate_limited') return { ok: false, erro: 'já existe um download aberto, tente de novo' };
                    // outros erros: tenta o jeito normal abaixo
                }
            }
        }
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = nome;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 4000);
        return { ok: true, incerto: true };
    },

    async compartilhar(nome, dados) {
        try {
            await navigator.share({ files: [new File([dados], nome, { type: 'text/plain' })], title: 'Save — Vida de Craque' });
            return { ok: true };
        } catch (e) {
            if (e && e.name === 'AbortError') return { ok: false, erro: 'compartilhamento cancelado' };
            return { ok: false, erro: 'este navegador não deixou compartilhar' };
        }
    },

    async copiar(texto, area) {
        try {
            await navigator.clipboard.writeText(texto);
            return true;
        } catch (e) {
            if (!area) return false;
            area.focus();
            area.select();
            try { return document.execCommand('copy'); } catch (e2) { return false; }
        }
    },

    // Opções do jogo (resolução, velocidade etc.) — ficam só neste navegador
    opcoesPadrao: { resolucao: 'auto', escala: 100, velocidade: 2, autosave: true, tema: 'escuro', som: true, volume: 60, cenas: true, animacoes: true },

    lerOpcoes() {
        try {
            return Object.assign({}, Salvar.opcoesPadrao, JSON.parse(localStorage.getItem(PREFIXO_SAVE + 'opcoes') || '{}'));
        } catch (e) {
            return Object.assign({}, Salvar.opcoesPadrao);
        }
    },

    gravarOpcoes(o) {
        try { localStorage.setItem(PREFIXO_SAVE + 'opcoes', JSON.stringify(o)); } catch (e) { /* sem acesso */ }
    },
};
