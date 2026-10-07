'use strict';
// =====================================================================
//  VIDA (estilo BitLife): atributos, família, relacionamentos, bens,
//  atividades e eventos aleatórios. Vale para técnico e jogador.
// =====================================================================

const BENS = {
    carro: [
        { nome: 'Fusca 1978', valor: 9000, feliz: 2 },
        { nome: 'Hyundai HB20', valor: 16000, feliz: 3 },
        { nome: 'Toyota Corolla', valor: 32000, feliz: 4 },
        { nome: 'Jeep Compass', valor: 45000, feliz: 5 },
        { nome: 'BMW M3', valor: 95000, feliz: 7 },
        { nome: 'Porsche 911', valor: 190000, feliz: 9 },
        { nome: 'Lamborghini Huracán', valor: 280000, feliz: 11 },
        { nome: 'Ferrari SF90', valor: 520000, feliz: 13 },
        { nome: 'Rolls-Royce Cullinan', valor: 450000, feliz: 12 },
        { nome: 'Bugatti Chiron', valor: 3200000, feliz: 18 },
    ],
    casa: [
        { nome: 'Casa simples no bairro', valor: 90000, feliz: 4 },
        { nome: 'Apartamento confortável', valor: 180000, feliz: 6 },
        { nome: 'Casa em condomínio', valor: 650000, feliz: 9 },
        { nome: 'Apartamento de luxo', valor: 1200000, feliz: 11 },
        { nome: 'Casa de praia', valor: 1800000, feliz: 12 },
        { nome: 'Mansão com campo de futebol', valor: 5500000, feliz: 16 },
        { nome: 'Cobertura em Mônaco', valor: 16000000, feliz: 20 },
        { nome: 'Ilha particular', valor: 45000000, feliz: 25 },
    ],
    luxo: [
        { nome: 'Corrente de ouro', valor: 12000, feliz: 2 },
        { nome: 'Relógio Rolex', valor: 35000, feliz: 3 },
        { nome: 'Videogame de última geração', valor: 800, feliz: 2 },
        { nome: 'Cavalo de corrida', valor: 220000, feliz: 6 },
        { nome: 'Iate', valor: 6500000, feliz: 15 },
        { nome: 'Jatinho particular', valor: 28000000, feliz: 20 },
    ],
};

const DESTINOS = [
    { nome: 'Praia no Nordeste', custo: 2500, feliz: 10 },
    { nome: 'Disney, em Orlando', custo: 9000, feliz: 14 },
    { nome: 'Paris', custo: 12000, feliz: 15 },
    { nome: 'Dubai', custo: 25000, feliz: 18 },
    { nome: 'Maldivas', custo: 40000, feliz: 22 },
];

// Investimentos e negócios próprios
const APLICACOES = {
    poup: { nome: 'Poupança', icone: '🏦', desc: 'Rende pouco, mas é seguro (~4% ao ano).' },
    acoes: { nome: 'Bolsa de valores', icone: '📈', desc: 'Sobe e desce. No longo prazo costuma render ~8% ao ano.' },
    cripto: { nome: 'Criptomoedas', icone: '🪙', desc: 'Montanha-russa: pode explodir... ou derreter.' },
};
const NEGOCIOS = [
    { nome: 'Lanchonete', icone: '🍔', custo: 80000 },
    { nome: 'Lava-jato', icone: '🚿', custo: 120000 },
    { nome: 'Loja de roupas', icone: '👕', custo: 250000 },
    { nome: 'Escolinha de futebol', icone: '⚽', custo: 300000, fama: true },
    { nome: 'Academia', icone: '🏋️', custo: 650000 },
    { nome: 'Restaurante chique', icone: '🍷', custo: 1500000 },
    { nome: 'Prédio para alugar', icone: '🏢', custo: 5000000 },
    { nome: 'Rede de hotéis', icone: '🏨', custo: 20000000 },
];

const MARCAS = ['Nike', 'Adidas', 'Puma', 'Umbro', 'Mizuno', 'Red Bull', 'Gatorade', 'Pepsi', 'EA Sports', 'Samsung', 'Rexona', 'Head & Shoulders', 'Gillette', 'Kappa', 'Topper', 'Penalty', 'Betano', 'Guaraná Antarctica'];

const Vida = {
    // -----------------------------------------------------------------
    //  Criação da pessoa
    // -----------------------------------------------------------------
    criarPessoa({ nome, idade, pais, sexo = 'm' }) {
        const p = {
            nome, idade, pais, sexo,
            dinheiro: idade < 20 ? 300 : 20000,
            felicidade: 70, saude: 90, fama: idade < 20 ? 2 : 10, aparencia: U.int(35, 90),
            rel: [], bens: [], log: [], trofeus: [], patrocinios: [],
            acoes: 0, morto: false, seq: 1,
            seg: idade < 20 ? 120 : 2500, inv: { poup: 0, acoes: 0, cripto: 0 }, negocios: [],
        };
        const sobrenome = nome.split(' ').slice(-1)[0];
        p.rel.push({ id: p.seq++, tipo: 'pai', nome: Nomes.pessoa('m') + ' ' + sobrenome, sexo: 'm', idade: idade + U.int(22, 38), relacao: U.int(55, 90), vivo: true });
        p.rel.push({ id: p.seq++, tipo: 'mae', nome: Nomes.pessoa('f') + ' ' + sobrenome, sexo: 'f', idade: idade + U.int(20, 35), relacao: U.int(65, 95), vivo: true });
        for (let i = 0; i < U.int(0, 2); i++) {
            const sx = U.chance(0.5) ? 'm' : 'f';
            p.rel.push({ id: p.seq++, tipo: 'irmao', nome: Nomes.pessoa(sx) + ' ' + sobrenome, sexo: sx, idade: U.clamp(idade + U.int(-8, 8), 1, 90), relacao: U.int(40, 90), vivo: true });
        }
        for (let i = 0; i < 2; i++) {
            const sx = U.chance(0.7) ? 'm' : 'f';
            p.rel.push({ id: p.seq++, tipo: 'amigo', nome: Nomes.pessoa(sx) + ' ' + U.escolha(NOMES.br.s), sexo: sx, idade: idade + U.int(-2, 3), relacao: U.int(50, 85), vivo: true });
        }
        if (idade >= 26) {
            p.rel.push({ id: p.seq++, tipo: 'conjuge', nome: Nomes.pessoa('f') + ' ' + U.escolha(NOMES.br.s), sexo: 'f', idade: idade + U.int(-4, 2), relacao: U.int(60, 90), vivo: true });
            for (let i = 0; i < U.int(0, 2); i++) {
                const sx = U.chance(0.5) ? 'm' : 'f';
                p.rel.push({ id: p.seq++, tipo: 'filho', nome: Nomes.pessoa(sx) + ' ' + sobrenome, sexo: sx, idade: U.int(1, Math.max(1, idade - 25)), relacao: U.int(70, 95), vivo: true });
            }
        }
        return p;
    },

    TIPO_REL: { pai: 'Pai', mae: 'Mãe', irmao: 'Irmão(ã)', amigo: 'Amigo(a)', parceiro: 'Namorada(o)', conjuge: 'Esposa(o)', filho: 'Filho(a)', ex: 'Ex', pet: 'Pet', agente: 'Empresário' },

    rotuloRel(r) {
        if (r.tipo === 'irmao') return r.sexo === 'f' ? 'Irmã' : 'Irmão';
        if (r.tipo === 'filho') return r.sexo === 'f' ? 'Filha' : 'Filho';
        if (r.tipo === 'amigo') return r.sexo === 'f' ? 'Amiga' : 'Amigo';
        if (r.tipo === 'parceiro') return r.sexo === 'f' ? 'Namorada' : 'Namorado';
        if (r.tipo === 'conjuge') return r.sexo === 'f' ? 'Esposa' : 'Marido';
        return Vida.TIPO_REL[r.tipo] || r.tipo;
    },

    // -----------------------------------------------------------------
    //  Atributos
    // -----------------------------------------------------------------
    log(s, txt, tipo = '') {
        const p = s.pessoa;
        p.log.push({ ano: s.ano, idade: p.idade, sem: s.semana, txt, tipo });
        if (p.log.length > 350) p.log.splice(0, p.log.length - 350);
    },

    // muda atributos e devolve um resuminho tipo "(+5 😊, -2 ❤️)"
    mudar(s, d) {
        const p = s.pessoa;
        const partes = [];
        const icones = { felicidade: '😊', saude: '❤️', fama: '⭐', aparencia: '💅' };
        if (d.fama > 0 && s.modo === 'jogador' && s.car && (s.car.habs || []).includes('estrela')) d.fama *= 1.3;
        for (const k of ['felicidade', 'saude', 'fama', 'aparencia']) {
            if (!d[k]) continue;
            const antes = p[k];
            p[k] = U.clamp(p[k] + d[k], 0, 100);
            const dif = Math.round(p[k] - antes);
            if (dif) partes.push(`${dif > 0 ? '+' : ''}${dif} ${icones[k]}`);
        }
        if (d.dinheiro) {
            p.dinheiro += d.dinheiro;
            partes.push(`${d.dinheiro > 0 ? '+' : ''}${U.dinheiro(d.dinheiro)}`);
        }
        return partes.length ? ` <span class="efeitos">(${partes.join(', ')})</span>` : '';
    },

    vivos: (s, tipo) => s.pessoa.rel.filter(r => r.vivo && (!tipo || r.tipo === tipo)),

    patrimonio(s) {
        const p = s.pessoa, inv = p.inv || {};
        return p.dinheiro + U.soma(p.bens, b => b.valor) + (inv.poup || 0) + (inv.acoes || 0) + (inv.cripto || 0) + U.soma(p.negocios || [], n => n.valor);
    },

    numero(n) {
        n = Math.round(n);
        if (n >= 1e9) return (n / 1e9).toFixed(1).replace('.', ',') + ' bi';
        if (n >= 1e6) return (n / 1e6).toFixed(1).replace('.', ',') + ' mi';
        if (n >= 1e3) return Math.round(n / 1e3) + ' mil';
        return String(n);
    },
    parceiro: s => s.pessoa.rel.find(r => r.vivo && (r.tipo === 'parceiro' || r.tipo === 'conjuge')),

    salarioAnual(s) {
        if (s.modo === 'jogador') {
            const j = s.jog[s.car.pid];
            return j && j.tid >= 0 ? j.sal : 0;
        }
        return s.car && s.car.tid >= 0 ? s.car.sal : 0;
    },

    // -----------------------------------------------------------------
    //  Passagem do tempo
    // -----------------------------------------------------------------
    semana(s) {
        const p = s.pessoa;
        const sal = Vida.salarioAnual(s) / 52;
        let renda = sal;
        for (const pt of p.patrocinios) renda += pt.semana;
        const manut = U.soma(p.bens, b => b.valor) * 0.0005;
        const gastos = sal * 0.12 + manut + 80;
        p.dinheiro += Math.round(renda - gastos);
        p.acoes = 0;

        // felicidade tende a um alvo
        const par = Vida.parceiro(s);
        let alvo = 52 + Math.min(16, U.soma(p.bens, b => b.feliz) * 0.6)
            + (par ? (par.relacao - 50) * 0.2 : -3)
            + Vida.vivos(s, 'filho').length * 2 + (Vida.vivos(s, 'pet').length ? 3 : 0)
            + (p.dinheiro < 0 ? -15 : 0);
        p.felicidade += (U.clamp(alvo, 10, 95) - p.felicidade) * 0.04;
        // saúde
        const alvoS = p.idade < 30 ? 92 : p.idade < 50 ? 85 - (p.idade - 30) * 0.5 : 75 - (p.idade - 50) * 1.1;
        p.saude += (U.clamp(alvoS, 5, 100) - p.saude) * 0.03;
        if (p.felicidade < 20) p.saude -= 0.3;
        p.saude = U.clamp(p.saude, 0, 100);
        p.felicidade = U.clamp(p.felicidade, 0, 100);
        // relacionamentos esfriam se você não cuida
        for (const r of p.rel) if (r.vivo && r.tipo !== 'pet') r.relacao = U.clamp(r.relacao - 0.25, 0, 100);
        // fama cai devagar sem novidades
        p.fama = U.clamp(p.fama - 0.05, 0, 100);
        Vida.semanaInvestimentos(s);
        // seguidores acompanham a fama
        const alvoSeg = Math.pow(10, 2 + p.fama * 0.065);
        p.seg = Math.max(0, (p.seg || 0) + (alvoSeg - (p.seg || 0)) * 0.08);
        if (p.dinheiro < -50000 && U.chance(0.08)) {
            Vida.log(s, '💳 Suas dívidas estão crescendo. O banco está ligando todo dia.', 'ruim');
            Vida.mudar(s, { felicidade: -4 });
        }
    },

    semanaInvestimentos(s) {
        const p = s.pessoa;
        p.inv = p.inv || { poup: 0, acoes: 0, cripto: 0 };
        p.negocios = p.negocios || [];
        const inv = p.inv;
        inv.poup *= 1.0008;
        inv.acoes *= 1 + U.normal(0.0015, 0.022);
        if (inv.cripto > 0) {
            const r = Math.random();
            if (r < 0.005) { inv.cripto *= 0.4; Vida.log(s, '🪙 As criptomoedas DESPENCARAM 60% em uma semana!', 'ruim'); Vida.mudar(s, { felicidade: -6 }); }
            else if (r < 0.01) { inv.cripto *= 2.5; Vida.log(s, '🪙 Suas criptomoedas foram PARA A LUA! +150%!', 'bom'); Vida.mudar(s, { felicidade: 8 }); }
            else inv.cripto *= 1 + U.normal(0.0025, 0.08);
        }
        for (const k of Object.keys(inv)) inv[k] = Math.max(0, inv[k]);
        // negócios: renda semanal com risco de falência
        for (const n of p.negocios.slice()) {
            if (U.chance(0.0015)) {
                p.negocios = p.negocios.filter(x => x !== n);
                Vida.log(s, `📉 Seu negócio "${n.nome}" faliu. Você perdeu o investimento.`, 'ruim');
                Vida.mudar(s, { felicidade: -8 });
                continue;
            }
            const renda = Math.round(n.valor * 0.0028 * U.rand(0.4, 1.6));
            p.dinheiro += renda;
            n.lucro = (n.lucro || 0) + renda;
            if (n.fama) p.fama = U.clamp(p.fama + 0.03, 0, 100);
        }
    },

    async aplicar(s, k, resgatar) {
        const p = s.pessoa, inv = p.inv;
        const base = resgatar ? inv[k] : p.dinheiro;
        if (base < 100) return UI.toast(resgatar ? 'Não há nada aplicado aqui.' : 'Você não tem dinheiro para aplicar.', 'erro');
        const ap = APLICACOES[k];
        const pc = await UI.modal({
            titulo: `${ap.icone} ${resgatar ? 'Resgatar de' : 'Aplicar em'} ${ap.nome}`,
            html: `<p>${resgatar ? `Aplicado: <b>${U.dinheiro(inv[k])}</b>` : `Seu dinheiro: <b>${U.dinheiro(p.dinheiro)}</b>`}</p>`,
            botoes: [10, 25, 50, 100].map(v => ({ txt: `${v}% (${U.dinheiro(base * v / 100)})`, valor: v, classe: 'btn-opcao' })).concat([{ txt: 'Cancelar', valor: -1, classe: 'btn-fantasma' }]),
        });
        if (pc == null || pc < 0) return;
        const v = Math.round(base * pc / 100);
        if (resgatar) { inv[k] -= v; p.dinheiro += v; } else { inv[k] += v; p.dinheiro -= v; }
        Vida.log(s, `${ap.icone} Você ${resgatar ? 'resgatou' : 'aplicou'} ${U.dinheiro(v)} ${resgatar ? 'de' : 'em'} ${ap.nome}.`, '');
        Som.tocar('moeda');
        Jogo.manterRolagem = true;
        Jogo.atualizar();
    },

    async abrirNegocio(s, i) {
        const p = s.pessoa, n = NEGOCIOS[i];
        if (p.dinheiro < n.custo) return UI.toast('Dinheiro insuficiente!', 'erro');
        if (!(await UI.confirmar(`Abrir <b>${n.icone} ${n.nome}</b> por <b>${U.dinheiro(n.custo)}</b>?<br><small>Rende por volta de ${U.dinheiro(n.custo * 0.0028)} por semana, mas negócios podem falir.</small>`, 'Abrir negócio'))) return;
        p.dinheiro -= n.custo;
        p.negocios.push({ id: p.seq++, nome: n.nome, icone: n.icone, valor: n.custo, fama: !!n.fama, ano: s.ano, lucro: 0 });
        const txt = `🏪 Você abriu um negócio: ${n.icone} ${n.nome}!${Vida.mudar(s, { felicidade: 4, fama: 1 })}`;
        Vida.log(s, txt, 'compra');
        UI.toast(txt);
        Som.tocar('moeda');
        Jogo.manterRolagem = true;
        Jogo.atualizar();
    },

    async venderNegocio(s, id) {
        const p = s.pessoa, n = p.negocios.find(x => x.id === id);
        if (!n) return;
        const v = Math.round(n.valor * U.rand(0.7, 0.95));
        if (!(await UI.confirmar(`Vender <b>${n.nome}</b> por <b>${U.dinheiro(v)}</b>?`, 'Vender'))) return;
        p.negocios = p.negocios.filter(x => x !== n);
        p.dinheiro += v;
        Vida.log(s, `💼 Você vendeu ${n.nome} por ${U.dinheiro(v)}.`, '');
        Jogo.manterRolagem = true;
        Jogo.atualizar();
    },

    // Lesão séria: tratamento normal, cirurgia ou infiltração (risco de recaída)
    async decisaoLesao(s, p, { custo, pagar, quem, proprio }) {
        const quemTxt = proprio ? 'Você' : p.nome;
        const i = await UI.perguntar('Departamento médico', `${proprio ? 'Você sofreu' : `<b>${U.esc(p.nome)}</b> sofreu`} uma lesão séria: <b>${p.les} semanas</b> fora. O que fazer?`, [
            '🩺 Tratamento normal (sem custo)',
            `🔪 Cirurgia com especialista (${U.dinheiro(custo)}, pago por ${quem})`,
            '💉 Infiltração para voltar logo (risco de recaída)',
        ], '🚑');
        let txt;
        if (i === 1) {
            pagar(custo);
            let n = Math.max(1, Math.ceil(p.les * 0.55));
            if (U.chance(0.1)) { n += 3; txt = `🔪 A cirurgia teve uma complicação. ${quemTxt} volta em ${n} semanas.`; }
            else txt = `🔪 Cirurgia um sucesso! ${quemTxt} volta em ${n} semanas em vez de ${p.les}.`;
            p.les = n;
        } else if (i === 2) {
            p.les = Math.max(1, Math.floor(p.les * 0.35));
            p.recaida = 4;
            txt = `💉 Infiltração feita. ${quemTxt} volta em ${p.les} semana(s), mas pode ter recaída.`;
            if (proprio) Vida.mudar(s, { saude: -5 });
        } else {
            txt = `🩺 Tratamento normal: ${p.les} semanas de recuperação.`;
        }
        Vida.log(s, txt, '');
        UI.toast(txt);
    },

    anoNovo(s) {
        const p = s.pessoa;
        p.idade++;
        Vida.log(s, `🎂 Você fez ${p.idade} anos.`, 'idade');
        p.patrocinios = p.patrocinios.filter(pt => pt.ate > s.ano);
        for (const r of p.rel) {
            if (!r.vivo) continue;
            r.idade++;
            const risco = r.tipo === 'pet' ? (r.idade > 10 ? 0.25 : 0.02) : (r.idade > 60 ? Math.pow((r.idade - 60) / 40, 2.2) : 0.001);
            if (U.chance(risco)) {
                r.vivo = false;
                Vida.log(s, `🕊️ ${Vida.rotuloRel(r) === 'Pet' ? 'Seu pet' : 'Seu/Sua ' + Vida.rotuloRel(r).toLowerCase()} ${r.nome} faleceu aos ${r.idade} anos.`, 'ruim');
                Vida.mudar(s, { felicidade: r.tipo === 'amigo' ? -8 : -18 });
            }
            if (r.tipo === 'filho' && r.idade === 18) Vida.log(s, `🎓 ${r.nome} completou 18 anos!`, 'bom');
        }
        // morte por velhice
        if (p.idade >= 65) {
            const risco = Math.pow((p.idade - 60) / 45, 2.5) * (1.6 - p.saude / 100);
            if (U.chance(risco) || p.saude <= 0) return Vida.morrer(s, 'de causas naturais');
        }
        return null;
    },

    morrer(s, causa) {
        const p = s.pessoa;
        p.morto = true;
        Vida.log(s, `⚰️ Você morreu ${causa}, aos ${p.idade} anos.`, 'ruim');
        return causa;
    },

    // -----------------------------------------------------------------
    //  Atividades (limite de 3 por semana)
    // -----------------------------------------------------------------
    MAX_ACOES: 3,

    atividades(s) {
        const jog = s.modo === 'jogador' ? s.jog[s.car.pid] : null;
        return [
            { id: 'academia', icone: '🏋️', nome: 'Academia', desc: 'Saúde e forma física', custo: 0 },
            { id: 'meditar', icone: '🧘', nome: 'Meditar', desc: 'Acalma a mente', custo: 0 },
            { id: 'medico', icone: '🩺', nome: 'Médico', desc: jog && jog.les > 0 ? 'Acelera a volta da lesão' : 'Check-up completo', custo: 300 },
            jog ? { id: 'fisio', icone: '💆', nome: 'Fisioterapia particular', desc: 'Recupera o físico', custo: 1500 } : null,
            { id: 'psicologo', icone: '🛋️', nome: 'Psicólogo', desc: 'Cuida da cabeça', custo: 400 },
            { id: 'balada', icone: '🎉', nome: 'Balada', desc: 'Diversão... e riscos', custo: 600 },
            { id: 'viajar', icone: '✈️', nome: 'Viajar', desc: 'Férias merecidas', custo: 2500 },
            { id: 'redes', icone: '📱', nome: 'Postar nas redes', desc: 'Ganhar seguidores', custo: 0 },
            { id: 'entrevista', icone: '🎙️', nome: 'Dar entrevista', desc: 'Aparecer na mídia', custo: 0 },
            { id: 'caridade', icone: '🤝', nome: 'Doar para caridade', desc: 'Ajudar quem precisa', custo: 0 },
            { id: 'cassino', icone: '🎰', nome: 'Cassino', desc: 'Apostar a sorte', custo: 0 },
            { id: 'tatuagem', icone: '🖋️', nome: 'Fazer tatuagem', desc: 'Arte na pele', custo: 400 },
            { id: 'estudar', icone: '📚', nome: 'Estudar', desc: s.modo === 'jogador' ? 'Curso de treinador (licença)' : 'Curso de táticas', custo: 800 },
            { id: 'namoro', icone: '💘', nome: 'Procurar namoro', desc: 'Conhecer alguém', custo: 0 },
        ].filter(Boolean);
    },

    async fazerAtividade(s, id) {
        const p = s.pessoa;
        if (p.acoes >= Vida.MAX_ACOES) return UI.toast('Você já fez muitas coisas essa semana. Avance o tempo!', 'erro');
        const at = Vida.atividades(s).find(a => a.id === id);
        if (at.custo && p.dinheiro < at.custo) return UI.toast('Dinheiro insuficiente!', 'erro');
        const jog = s.modo === 'jogador' ? s.jog[s.car.pid] : null;
        let txt = '';
        p.acoes++;
        switch (id) {
            case 'academia':
                if (jog) jog.cond = Math.min(100, jog.cond + 6);
                txt = `🏋️ Você malhou pesado na academia.${Vida.mudar(s, { saude: U.int(2, 5), felicidade: 1, aparencia: U.chance(0.3) ? 1 : 0 })}`;
                break;
            case 'meditar':
                txt = `🧘 Você meditou por uma hora e se sentiu em paz.${Vida.mudar(s, { felicidade: U.int(2, 5) })}`;
                break;
            case 'medico':
                if (jog && jog.les > 0) {
                    const r = U.chance(0.6) ? U.int(1, 2) : 0;
                    jog.les = Math.max(0, jog.les - r);
                    txt = r ? `🩺 O médico acelerou sua recuperação em ${r} semana(s)!` : '🩺 O médico disse que é preciso ter paciência com a lesão.';
                    txt += Vida.mudar(s, { dinheiro: -at.custo, saude: 3 });
                } else txt = `🩺 Check-up feito: tudo certo com você.${Vida.mudar(s, { dinheiro: -at.custo, saude: U.int(3, 7) })}`;
                break;
            case 'fisio':
                jog.cond = Math.min(100, jog.cond + 15);
                if (jog.les > 1 && U.chance(0.35)) jog.les--;
                txt = `💆 Sessão de fisioterapia: seu corpo agradece.${Vida.mudar(s, { dinheiro: -at.custo, saude: 2 })}`;
                break;
            case 'psicologo':
                txt = `🛋️ Você conversou com o psicólogo sobre a pressão do futebol.${Vida.mudar(s, { dinheiro: -at.custo, felicidade: U.int(4, 8) })}`;
                break;
            case 'balada': {
                txt = `🎉 Você curtiu a noite toda!${Vida.mudar(s, { dinheiro: -at.custo, felicidade: U.int(5, 10), saude: -2 })}`;
                if (U.chance(0.15)) {
                    txt += `<br>📸 Fotos suas na balada vazaram e viraram polêmica!${Vida.mudar(s, { fama: -3 })}`;
                    if (s.modo === 'tecnico' && s.car.tid >= 0) s.car.conf = U.clamp(s.car.conf - 5, 0, 100);
                    if (jog) jog.cond = Math.max(40, jog.cond - 15);
                } else if (U.chance(0.12)) {
                    const sx = U.chance(0.85) ? 'f' : 'm';
                    const nome = Nomes.pessoa(sx) + ' ' + U.escolha(NOMES.br.s);
                    if (!Vida.parceiro(s)) {
                        p.rel.push({ id: p.seq++, tipo: 'parceiro', nome, sexo: sx, idade: p.idade + U.int(-3, 3), relacao: 55, vivo: true });
                        txt += `<br>💘 Você conheceu ${nome} e começaram a namorar!`;
                    } else txt += `<br>😏 Alguém tentou te paquerar, mas você foi fiel.`;
                }
                break;
            }
            case 'viajar': {
                const i = await UI.modal({
                    titulo: '✈️ Para onde você quer viajar?',
                    html: '<p>Escolha o destino:</p>',
                    botoes: DESTINOS.map((d, k) => ({ txt: `${d.nome} (${U.dinheiro(d.custo)})`, valor: k, desativado: p.dinheiro < d.custo, classe: 'btn-opcao' })).concat([{ txt: 'Cancelar', valor: -1, classe: 'btn-fantasma' }]),
                });
                if (i == null || i < 0) { p.acoes--; return; }
                const d = DESTINOS[i];
                Conquistas.contar(s, 'viagens');
                txt = `✈️ Você viajou para ${d.nome} e voltou renovado.${Vida.mudar(s, { dinheiro: -d.custo, felicidade: d.feliz, saude: 2 })}`;
                const par = Vida.parceiro(s);
                if (par) { par.relacao = U.clamp(par.relacao + 10, 0, 100); txt += ` ${par.nome} adorou a viagem.`; }
                break;
            }
            case 'redes': {
                const r = Math.random();
                p.seg = p.seg || 0;
                if (r < 0.08) { p.seg *= 0.95; txt = `📱 Seu post foi mal interpretado e você foi cancelado por um dia. Perdeu seguidores.${Vida.mudar(s, { fama: -4, felicidade: -3 })}`; }
                else if (r < 0.2) { const ganho = Math.round(p.seg * U.rand(0.1, 0.3) + 500); p.seg += ganho; txt = `📱 Seu post VIRALIZOU! +${Vida.numero(ganho)} seguidores.${Vida.mudar(s, { fama: U.int(3, 6), felicidade: 3 })}`; }
                else { const ganho = Math.round(p.seg * U.rand(0.005, 0.03) + 20); p.seg += ganho; txt = `📱 Você postou uma foto treinando. ${Vida.numero(Math.max(30, p.seg * U.rand(0.02, 0.12)))} curtidas e +${Vida.numero(ganho)} seguidores.${Vida.mudar(s, { fama: U.chance(0.5) ? 1 : 0.5, felicidade: 1 })}`; }
                break;
            }
            case 'entrevista': {
                const i = await UI.perguntar('🎙️ Entrevista', 'O repórter pergunta sobre a temporada. Como você responde?', ['Com humildade, valorizando o grupo', 'Com confiança: "vamos ser campeões!"', 'Polemizando com o rival'], '🎙️');
                if (i === 0) txt = `🎙️ Entrevista elogiada pela humildade.${Vida.mudar(s, { fama: 1, felicidade: 1 })}`;
                else if (i === 1) txt = `🎙️ Sua confiança animou a torcida.${Vida.mudar(s, { fama: 2 })}`;
                else {
                    if (U.chance(0.5)) txt = `🎙️ A provocação bombou na internet!${Vida.mudar(s, { fama: 5 })}`;
                    else {
                        txt = `🎙️ A provocação pegou mal e você levou uma bronca do clube.${Vida.mudar(s, { fama: -2, felicidade: -3 })}`;
                        if (s.modo === 'tecnico') s.car.conf = U.clamp(s.car.conf - 4, 0, 100);
                    }
                }
                break;
            }
            case 'caridade': {
                if (p.dinheiro <= 0) { p.acoes--; return UI.toast('Você não tem dinheiro para doar.', 'erro'); }
                const i = await UI.modal({
                    titulo: '🤝 Quanto você quer doar?', html: `<p>Seu dinheiro: <b>${U.dinheiro(p.dinheiro)}</b></p>`,
                    botoes: [1, 5, 10, 25].map(pc => ({ txt: `${pc}% (${U.dinheiro(p.dinheiro * pc / 100)})`, valor: pc, classe: 'btn-opcao' })).concat([{ txt: 'Cancelar', valor: -1, classe: 'btn-fantasma' }]),
                });
                if (i == null || i < 0) { p.acoes--; return; }
                const v = Math.round(p.dinheiro * i / 100);
                Conquistas.contar(s, 'doado', v);
                txt = `🤝 Você doou ${U.dinheiro(v)} para um hospital infantil.${Vida.mudar(s, { dinheiro: -v, felicidade: 2 + i / 3, fama: Math.min(8, 1 + i / 4) })}`;
                break;
            }
            case 'cassino': {
                if (p.dinheiro < 100) { p.acoes--; return UI.toast('Você precisa de pelo menos € 100.', 'erro'); }
                const valores = [100, 1000, 10000, 100000, 1000000].filter(v => v <= p.dinheiro);
                const i = await UI.modal({
                    titulo: '🎰 Quanto você vai apostar?', html: '<p>Roleta: 47% de chance de dobrar.</p>',
                    botoes: valores.map(v => ({ txt: U.dinheiro(v), valor: v, classe: 'btn-opcao' })).concat([{ txt: 'Desistir', valor: -1, classe: 'btn-fantasma' }]),
                });
                if (i == null || i < 0) { p.acoes--; return; }
                if (U.chance(0.47)) txt = `🎰 Você GANHOU ${U.dinheiro(i)} na roleta!${Vida.mudar(s, { dinheiro: i, felicidade: 5 })}`;
                else txt = `🎰 Você perdeu ${U.dinheiro(i)} na roleta...${Vida.mudar(s, { dinheiro: -i, felicidade: -4 })}`;
                if (i >= 100000 && U.chance(0.3)) txt += `<br>📰 A imprensa descobriu suas apostas altas.${Vida.mudar(s, { fama: -2 })}`;
                break;
            }
            case 'tatuagem':
                txt = `🖋️ Você fez uma tatuagem ${U.escolha(['de leão nas costas', 'com o nome da sua mãe', 'do escudo do clube', 'tribal no braço', 'com a data do seu primeiro gol', 'de asas no pescoço'])}.${Vida.mudar(s, { dinheiro: -at.custo, felicidade: 3, aparencia: U.int(-3, 4) })}`;
                break;
            case 'estudar':
                s.car.estudo = (s.car.estudo || 0) + 1;
                if (s.modo === 'jogador') {
                    txt = `📚 Você assistiu a mais um módulo do curso de treinador (${Math.min(10, s.car.estudo)}/10).`;
                    if (s.car.estudo === 10) txt += ' 🎓 Você tirou a LICENÇA DE TREINADOR! Quando se aposentar, vai começar mais respeitado.';
                } else {
                    s.car.rep = U.clamp(s.car.rep + 0.4, 0, 100);
                    txt = '📚 Você estudou novas táticas e sente que está evoluindo como treinador.';
                }
                txt += Vida.mudar(s, { dinheiro: -at.custo, felicidade: -1 });
                break;
            case 'namoro':
                p.acoes--;
                return Vida.procurarNamoro(s);
        }
        Vida.log(s, txt, 'acao');
        UI.toast(txt);
        Jogo.atualizar();
    },

    async procurarNamoro(s) {
        const p = s.pessoa;
        if (Vida.parceiro(s)) {
            const ok = await UI.confirmar('Você já tem alguém. Procurar outra pessoa pode acabar com o seu relacionamento. Continuar mesmo assim?', 'Continuar', 'Melhor não');
            if (!ok) return;
        }
        const cands = [0, 1, 2].map(() => {
            const sx = U.chance(0.85) ? 'f' : 'm';
            return { nome: Nomes.pessoa(sx) + ' ' + U.escolha(NOMES.br.s.concat(NOMES.es.s)), sexo: sx, idade: U.clamp(p.idade + U.int(-5, 4), 18, 90), apar: U.int(20, 100), prof: U.escolha(['Modelo', 'Médica', 'Advogada', 'Influencer', 'Professora', 'Estudante', 'Jornalista', 'Cantora', 'Atriz', 'Empresária', 'Personal trainer', 'Arquiteta', 'Dentista', 'Enfermeira']) };
        });
        const i = await UI.modal({
            titulo: '💘 Encontros', html: '<p>Você foi apresentado a algumas pessoas. Quem você chama para sair?</p>' + cands.map(c =>
                `<div class="cand"><b>${U.esc(c.nome)}</b>, ${c.idade} anos — ${c.prof}<br><small>Aparência: ${U.estrelas(c.apar / 20)}</small></div>`).join(''),
            botoes: cands.map((c, k) => ({ txt: `Chamar ${c.nome.split(' ')[0]}`, valor: k, classe: 'btn-opcao' })).concat([{ txt: 'Ninguém', valor: -1, classe: 'btn-fantasma' }]),
        });
        if (i == null || i < 0) return;
        p.acoes++;
        const c = cands[i];
        const chance = U.clamp(0.35 + p.fama / 200 + p.aparencia / 250 - Math.max(0, c.apar - 60) / 150, 0.15, 0.9);
        let txt;
        if (U.chance(chance)) {
            const antigo = Vida.parceiro(s);
            if (antigo) {
                antigo.tipo = 'ex';
                antigo.relacao = 10;
                txt = `💔 ${antigo.nome} descobriu e terminou com você. `;
            } else txt = '';
            p.rel.push({ id: p.seq++, tipo: 'parceiro', nome: c.nome, sexo: c.sexo, idade: c.idade, relacao: 60, vivo: true });
            txt += `💘 O encontro com ${c.nome} foi incrível! Vocês estão namorando.${Vida.mudar(s, { felicidade: 10 })}`;
        } else {
            txt = `😶 ${c.nome} não quis um segundo encontro.${Vida.mudar(s, { felicidade: -3 })}`;
        }
        Vida.log(s, txt, 'rel');
        await UI.aviso('Encontro', txt, '💘');
        Jogo.atualizar();
    },

    // -----------------------------------------------------------------
    //  Relacionamentos
    // -----------------------------------------------------------------
    acoesRel(r) {
        const a = [['conversar', '💬 Conversar'], ['tempo', '⏳ Passar tempo junto'], ['presente', '🎁 Dar presente']];
        if (r.tipo === 'pai' || r.tipo === 'mae') a.push(['pedirDinheiro', '💸 Pedir dinheiro']);
        if (r.tipo === 'parceiro') a.push(['casar', '💍 Pedir em casamento'], ['terminar', '💔 Terminar']);
        if (r.tipo === 'conjuge') a.push(['filho', '👶 Ter um filho'], ['divorcio', '⚖️ Pedir divórcio']);
        if (r.tipo === 'parceiro') a.push(['filho', '👶 Ter um filho']);
        if (r.tipo === 'filho') a.push(['mesada', '💰 Dar mesada']);
        if (r.tipo !== 'pet') a.push(['discutir', '😤 Discutir']);
        return a;
    },

    async acaoRel(s, rid, acao) {
        const p = s.pessoa;
        const r = p.rel.find(x => x.id === rid);
        if (!r || !r.vivo) return;
        if (p.acoes >= Vida.MAX_ACOES + 2) return UI.toast('Chega por essa semana! Avance o tempo.', 'erro');
        let txt = '';
        p.acoes++;
        const mudaRel = v => { r.relacao = U.clamp(r.relacao + v, 0, 100); };
        switch (acao) {
            case 'conversar':
                mudaRel(U.int(2, 6));
                txt = `💬 Você conversou com ${r.nome} ${U.escolha(['sobre a vida', 'sobre futebol', 'por horas', 'sobre o futuro', 'e deram muita risada'])}.${Vida.mudar(s, { felicidade: 1 })}`;
                break;
            case 'tempo':
                mudaRel(U.int(5, 10));
                txt = `⏳ Você passou o dia com ${r.nome} ${U.escolha(['no cinema', 'num churrasco', 'jogando videogame', 'no shopping', 'num parque', 'num restaurante'])}.${Vida.mudar(s, { felicidade: 3 })}`;
                break;
            case 'presente': {
                const v = U.int(50, 400) * (p.dinheiro > 1e6 ? 20 : 1);
                if (p.dinheiro < v) { p.acoes--; return UI.toast('Sem dinheiro para presente.', 'erro'); }
                mudaRel(U.int(6, 14));
                txt = `🎁 Você deu ${U.escolha(['um perfume', 'um relógio', 'flores', 'um celular novo', 'uma camisa autografada', 'uma bolsa de grife'])} para ${r.nome}.${Vida.mudar(s, { dinheiro: -v, felicidade: 1 })}`;
                break;
            }
            case 'pedirDinheiro': {
                if (U.chance(0.25 + r.relacao / 250)) {
                    const v = U.int(50, 800);
                    mudaRel(-3);
                    txt = `💸 ${r.nome} te deu ${U.dinheiro(v)}.${Vida.mudar(s, { dinheiro: v })}`;
                } else {
                    mudaRel(-6);
                    txt = `💸 ${r.nome} disse que você já é grandinho para pedir dinheiro.`;
                }
                break;
            }
            case 'mesada': {
                const v = 500;
                if (p.dinheiro < v) { p.acoes--; return UI.toast('Sem dinheiro.', 'erro'); }
                mudaRel(8);
                txt = `💰 Você deu ${U.dinheiro(v)} de mesada para ${r.nome}.${Vida.mudar(s, { dinheiro: -v })}`;
                break;
            }
            case 'discutir':
                mudaRel(-U.int(8, 18));
                txt = `😤 Você discutiu feio com ${r.nome}.${Vida.mudar(s, { felicidade: -4 })}`;
                if ((r.tipo === 'parceiro' || r.tipo === 'conjuge') && r.relacao < 20 && U.chance(0.5)) {
                    r.tipo = 'ex';
                    txt += ` ${r.nome} terminou com você!`;
                }
                break;
            case 'casar': {
                if (r.relacao >= 60 && U.chance(0.4 + r.relacao / 200)) {
                    const custo = Math.min(Math.max(5000, p.dinheiro * 0.05), 2e6);
                    r.tipo = 'conjuge';
                    mudaRel(15);
                    Conquistas.contar(s, 'casamentos');
                    txt = `💍 ${r.nome} disse SIM! Vocês fizeram uma festa de casamento linda.${Vida.mudar(s, { dinheiro: -Math.round(custo), felicidade: 15, fama: 2 })}`;
                } else {
                    mudaRel(-15);
                    txt = `💍 ${r.nome} disse que ainda não está pronta(o) para casar...${Vida.mudar(s, { felicidade: -8 })}`;
                }
                break;
            }
            case 'terminar':
                r.tipo = 'ex';
                r.relacao = 15;
                txt = `💔 Você terminou o namoro com ${r.nome}.${Vida.mudar(s, { felicidade: -6 })}`;
                break;
            case 'divorcio': {
                const perda = Math.max(0, Math.round(p.dinheiro * 0.35));
                r.tipo = 'ex';
                r.relacao = 5;
                txt = `⚖️ O divórcio com ${r.nome} saiu caro: metade dos bens foi para a partilha.${Vida.mudar(s, { dinheiro: -perda, felicidade: -12, fama: 1 })}`;
                break;
            }
            case 'filho': {
                if (r.relacao < 45) { txt = `👶 ${r.nome} acha que o relacionamento não está bom o suficiente para ter um filho agora.`; break; }
                if (U.chance(0.55)) {
                    const sx = U.chance(0.5) ? 'm' : 'f';
                    const sobrenome = p.nome.split(' ').slice(-1)[0];
                    const nome = Nomes.pessoa(sx) + ' ' + sobrenome;
                    p.rel.push({ id: p.seq++, tipo: 'filho', nome, sexo: sx, idade: 0, relacao: 100, vivo: true });
                    mudaRel(10);
                    txt = `👶 Nasceu ${sx === 'f' ? 'sua filha' : 'seu filho'} ${nome}! Que emoção!${Vida.mudar(s, { felicidade: 18 })}`;
                } else txt = '👶 Vocês estão tentando... ainda não foi dessa vez.';
                break;
            }
        }
        Vida.log(s, txt, 'rel');
        UI.toast(txt);
        Jogo.atualizar();
    },

    // -----------------------------------------------------------------
    //  Bens
    // -----------------------------------------------------------------
    async comprar(s, tipo, i) {
        const p = s.pessoa;
        const b = BENS[tipo][i];
        if (p.dinheiro < b.valor) return UI.toast('Dinheiro insuficiente!', 'erro');
        if (!(await UI.confirmar(`Comprar <b>${b.nome}</b> por <b>${U.dinheiro(b.valor)}</b>?`, 'Comprar'))) return;
        p.bens.push({ id: p.seq++, tipo, nome: b.nome, valor: b.valor, feliz: b.feliz, ano: s.ano });
        const txt = `🛍️ Você comprou: ${b.nome}!${Vida.mudar(s, { dinheiro: -b.valor, felicidade: b.feliz, fama: b.valor > 1e6 ? 2 : 0 })}`;
        Vida.log(s, txt, 'compra');
        UI.toast(txt);
        Jogo.atualizar();
    },

    async vender(s, id) {
        const p = s.pessoa;
        const b = p.bens.find(x => x.id === id);
        if (!b) return;
        const fator = b.tipo === 'casa' ? U.rand(0.85, 1.25) : b.tipo === 'carro' ? Math.max(0.35, 0.85 - (s.ano - b.ano) * 0.08) : U.rand(0.5, 0.9);
        const v = Math.round(b.valor * fator);
        if (!(await UI.confirmar(`Vender <b>${b.nome}</b> por <b>${U.dinheiro(v)}</b>?`, 'Vender'))) return;
        p.bens = p.bens.filter(x => x !== b);
        const txt = `💰 Você vendeu ${b.nome}.${Vida.mudar(s, { dinheiro: v, felicidade: -2 })}`;
        Vida.log(s, txt, 'compra');
        UI.toast(txt);
        Jogo.atualizar();
    },

    // -----------------------------------------------------------------
    //  Eventos aleatórios da semana
    // -----------------------------------------------------------------
    async eventoAleatorio(s) {
        const lista = EVENTOS.filter(e => !e.quando || e.quando(s));
        if (!lista.length) return;
        const ev = U.pesado(lista, e => e.peso || 1);
        const texto = typeof ev.texto === 'function' ? ev.texto(s) : ev.texto;
        const ctx = {};
        if (ev.prep) ev.prep(s, ctx);
        const t = texto.replace(/\{(\w+)\}/g, (_, k) => (ctx[k] != null ? ctx[k] : ''));
        const i = await UI.perguntar(ev.titulo, t, ev.ops.map(o => o.txt), ev.icone);
        const res = ev.ops[i].fn(s, ctx) || '';
        if (res) {
            Vida.log(s, `${ev.icone} ${res}`, 'evento');
            await UI.aviso(ev.titulo, res, ev.icone);
        }
    },
};

// ---------------------------------------------------------------------
//  Eventos (o coração "BitLife" do jogo)
// ---------------------------------------------------------------------
const ehJogador = s => s.modo === 'jogador';
const ehTecnico = s => s.modo === 'tecnico' && s.car.tid >= 0;
const meuJog = s => s.jog[s.car.pid];

const EVENTOS = [
    {
        titulo: 'Fã na rua', icone: '🤳', quando: s => s.pessoa.fama >= 8, peso: 2,
        texto: 'Um fã te reconheceu no shopping e pediu uma foto.',
        ops: [
            { txt: 'Tirar foto e dar autógrafo', fn: s => `Você fez a alegria do fã.${Vida.mudar(s, { fama: 1, felicidade: 2 })}` },
            { txt: 'Fingir que não é você', fn: s => `O fã postou que você foi grosso.${Vida.mudar(s, { fama: -1 })}` },
        ],
    },
    {
        titulo: 'Amigo precisando', icone: '🫂', quando: s => Vida.vivos(s, 'amigo').length > 0 && s.pessoa.dinheiro > 2000,
        prep: (s, c) => { c.amigo = U.escolha(Vida.vivos(s, 'amigo')); c.valor = U.redondo(Math.max(1000, s.pessoa.dinheiro * 0.03)); c.nome = c.amigo.nome; c.v = U.dinheiro(c.valor); },
        texto: 'Seu amigo {nome} pediu {v} emprestado para pagar umas dívidas.',
        ops: [
            {
                txt: 'Emprestar', fn: (s, c) => {
                    c.amigo.relacao = U.clamp(c.amigo.relacao + 15, 0, 100);
                    if (U.chance(0.5)) return `${c.nome} te agradeceu muito e prometeu pagar... mas sumiu com o dinheiro.${Vida.mudar(s, { dinheiro: -c.valor })}`;
                    return `${c.nome} pagou tudo certinho depois de um mês.${Vida.mudar(s, { felicidade: 2 })}`;
                }
            },
            { txt: 'Recusar', fn: (s, c) => { c.amigo.relacao = U.clamp(c.amigo.relacao - 15, 0, 100); return `${c.nome} ficou chateado com você.`; } },
        ],
    },
    {
        titulo: 'Festa na véspera do jogo', icone: '🍾', quando: s => ehJogador(s) && meuJog(s).tid >= 0, peso: 2,
        texto: 'Uns colegas do time te chamaram pra uma festa hoje à noite. Amanhã tem jogo.',
        ops: [
            {
                txt: 'Ir pra festa', fn: s => {
                    meuJog(s).cond = Math.max(40, meuJog(s).cond - 20);
                    if (U.chance(0.3)) return `A festa foi ótima, mas um vídeo seu dançando de madrugada vazou. O técnico não gostou.${Vida.mudar(s, { felicidade: 6, fama: -3 })}`;
                    return `Que noite! Mas você acordou um bagaço.${Vida.mudar(s, { felicidade: 7, saude: -2 })}`;
                }
            },
            { txt: 'Ficar em casa descansando', fn: s => { meuJog(s).cond = Math.min(100, meuJog(s).cond + 5); return `Você dormiu cedo e está 100% para o jogo.${Vida.mudar(s, { saude: 1 })}`; } },
        ],
    },
    {
        titulo: 'Repórter provocador', icone: '🎤', quando: s => s.pessoa.fama >= 15,
        texto: 'Na saída do treino, um repórter pergunta o que você acha do maior rival do clube.',
        ops: [
            { txt: '"Respeito muito eles."', fn: s => `Resposta educada. Nada de manchete.${Vida.mudar(s, { fama: 0.5 })}` },
            { txt: '"Time pequeno. Vamos atropelar."', fn: s => U.chance(0.55) ? `A torcida AMOU! Você virou ídolo nas redes.${Vida.mudar(s, { fama: 5, felicidade: 3 })}` : `Pegou muito mal. Até sua mãe te ligou brava.${Vida.mudar(s, { fama: -3, felicidade: -3 })}` },
            { txt: 'Ignorar e seguir andando', fn: s => `O vídeo de você ignorando virou meme.${Vida.mudar(s, { fama: U.chance(0.5) ? 1 : -1 })}` },
        ],
    },
    {
        titulo: 'Investimento "garantido"', icone: '🪙', quando: s => s.pessoa.dinheiro > 5000,
        prep: (s, c) => { c.valor = U.redondo(s.pessoa.dinheiro * 0.2); c.v = U.dinheiro(c.valor); c.coisa = U.escolha(['uma criptomoeda nova', 'uma rede de hamburguerias', 'uma fazenda de gado', 'uma startup de apostas', 'um time da várzea', 'uma marca de roupas']); },
        texto: 'Um conhecido te oferece investir {v} em {coisa}. "Retorno garantido", ele diz.',
        ops: [
            {
                txt: 'Investir', fn: (s, c) => {
                    const r = Math.random();
                    if (r < 0.35) return `Deu MUITO certo! O investimento multiplicou.${Vida.mudar(s, { dinheiro: Math.round(c.valor * U.rand(1.5, 3)), felicidade: 6 })}`;
                    if (r < 0.55) return `Você recuperou o dinheiro, mais um troquinho.${Vida.mudar(s, { dinheiro: Math.round(c.valor * 0.15) })}`;
                    return `Era golpe. Você perdeu tudo que investiu.${Vida.mudar(s, { dinheiro: -c.valor, felicidade: -8 })}`;
                }
            },
            { txt: 'Recusar', fn: () => 'Você preferiu não arriscar.' },
        ],
    },
    {
        titulo: 'Gripe forte', icone: '🤒', peso: 1,
        texto: 'Você acordou com febre e dor no corpo.',
        ops: [
            { txt: 'Ir ao médico (€ 300)', fn: s => `Remédio certo, você melhorou rápido.${Vida.mudar(s, { dinheiro: -300, saude: -1 })}` },
            {
                txt: 'Tomar um chá e torcer', fn: s => {
                    if (ehJogador(s)) meuJog(s).cond = Math.max(40, meuJog(s).cond - 15);
                    return U.chance(0.3) ? `Piorou e virou uma sinusite chata.${Vida.mudar(s, { saude: -10, felicidade: -3 })}` : `Passou sozinho em dois dias.${Vida.mudar(s, { saude: -3 })}`;
                }
            },
        ],
    },
    {
        titulo: 'Seus pais precisam de ajuda', icone: '🏠', quando: s => Vida.vivos(s).some(r => r.tipo === 'pai' || r.tipo === 'mae') && s.pessoa.dinheiro > 3000,
        prep: (s, c) => { c.r = U.escolha(Vida.vivos(s).filter(r => r.tipo === 'pai' || r.tipo === 'mae')); c.nome = c.r.nome; c.valor = U.redondo(Math.max(2000, s.pessoa.dinheiro * 0.05)); c.v = U.dinheiro(c.valor); c.motivo = U.escolha(['reformar a casa', 'pagar uma cirurgia', 'quitar dívidas antigas', 'abrir um pequeno negócio']); },
        texto: '{nome} pediu {v} para {motivo}.',
        ops: [
            { txt: 'Ajudar, claro', fn: (s, c) => { c.r.relacao = U.clamp(c.r.relacao + 15, 0, 100); return `${c.nome} chorou de emoção. Família é tudo.${Vida.mudar(s, { dinheiro: -c.valor, felicidade: 5 })}`; } },
            { txt: 'Dizer que não pode agora', fn: (s, c) => { c.r.relacao = U.clamp(c.r.relacao - 18, 0, 100); return `${c.nome} ficou muito magoado(a).${Vida.mudar(s, { felicidade: -3 })}`; } },
        ],
    },
    {
        titulo: 'Cachorro abandonado', icone: '🐶', quando: s => !Vida.vivos(s, 'pet').length, peso: 0.6,
        texto: 'Um cachorrinho de rua te seguiu até em casa e não quer ir embora.',
        ops: [
            {
                txt: 'Adotar', fn: s => {
                    const nome = U.escolha(['Bolinha', 'Thor', 'Pelé', 'Mel', 'Paçoca', 'Zico', 'Luna', 'Toddy', 'Messi', 'Pipoca']);
                    s.pessoa.rel.push({ id: s.pessoa.seq++, tipo: 'pet', nome, sexo: 'm', idade: U.int(0, 4), relacao: 100, vivo: true });
                    return `Você adotou o ${nome}! A casa ficou mais feliz.${Vida.mudar(s, { felicidade: 8 })}`;
                }
            },
            { txt: 'Levar para um abrigo', fn: s => `Você levou o cachorro para um abrigo de animais.${Vida.mudar(s, { felicidade: 1 })}` },
        ],
    },
    {
        titulo: 'Convite da TV', icone: '📺', quando: s => s.pessoa.fama >= 30, peso: 0.8,
        prep: (s, c) => { c.prog = U.escolha(['um programa de auditório', 'um reality show de culinária', 'uma mesa-redonda de futebol', 'um podcast famoso', 'um programa de humor']); c.cache = U.redondo(2000 + s.pessoa.fama * 300); c.v = U.dinheiro(c.cache); },
        texto: 'Você foi convidado para participar de {prog}. Cachê: {v}.',
        ops: [
            { txt: 'Aceitar', fn: (s, c) => U.chance(0.8) ? `Você foi muito bem e a audiência bombou!${Vida.mudar(s, { dinheiro: c.cache, fama: 4, felicidade: 3 })}` : `Você travou ao vivo e virou meme.${Vida.mudar(s, { dinheiro: c.cache, fama: -2, felicidade: -3 })}` },
            { txt: 'Recusar, foco no futebol', fn: () => 'Você recusou o convite educadamente.' },
        ],
    },
    {
        titulo: 'Proposta de patrocínio', icone: '🤑', quando: s => s.pessoa.fama >= 20 && s.pessoa.patrocinios.length < 3, peso: 1.4,
        prep: (s, c) => { c.marca = U.escolha(MARCAS.filter(m => !s.pessoa.patrocinios.some(p => p.marca === m))); c.semana = U.redondo((150 + Math.pow(s.pessoa.fama, 2.1) * 4 + Math.sqrt(s.pessoa.seg || 0) * 1.5) * ((s.car && (s.car.habs || []).includes('estrela')) ? 1.3 : 1)); c.v = U.dinheiro(c.semana); },
        texto: 'A {marca} quer você como garoto-propaganda! Oferecem {v} por semana durante 2 temporadas.',
        ops: [
            { txt: 'Aceitar', fn: (s, c) => { s.pessoa.patrocinios.push({ marca: c.marca, semana: c.semana, ate: s.ano + 2 }); return `Contrato assinado com a ${c.marca}!${Vida.mudar(s, { fama: 2, felicidade: 4 })}`; } },
            {
                txt: 'Pedir o dobro', fn: (s, c) => {
                    if (U.chance(0.35 + s.pessoa.fama / 300)) { s.pessoa.patrocinios.push({ marca: c.marca, semana: c.semana * 2, ate: s.ano + 2 }); return `A ${c.marca} topou pagar o dobro! (${U.dinheiro(c.semana * 2)}/semana)${Vida.mudar(s, { fama: 2, felicidade: 6 })}`; }
                    return `A ${c.marca} desistiu e fechou com outro jogador.${Vida.mudar(s, { felicidade: -3 })}`;
                }
            },
            { txt: 'Recusar', fn: (s, c) => `Você recusou a proposta da ${c.marca}.` },
        ],
    },
    {
        titulo: 'Raspadinha', icone: '🎟️', peso: 0.5,
        texto: 'Na padaria, o atendente te oferece uma raspadinha de € 10.',
        ops: [
            {
                txt: 'Comprar', fn: s => {
                    const r = Math.random();
                    if (r < 0.01) return `INACREDITÁVEL! Você ganhou € 100 mil!${Vida.mudar(s, { dinheiro: 100000 - 10, felicidade: 15 })}`;
                    if (r < 0.15) return `Você ganhou € 50!${Vida.mudar(s, { dinheiro: 40, felicidade: 2 })}`;
                    return `Não ganhou nada.${Vida.mudar(s, { dinheiro: -10 })}`;
                }
            },
            { txt: 'Dispensar', fn: () => '' },
        ],
    },
    {
        titulo: 'Visita ao hospital', icone: '🏥', quando: s => s.pessoa.fama >= 20, peso: 0.7,
        texto: 'Um menino internado no hospital infantil pediu para te conhecer.',
        ops: [
            { txt: 'Ir visitar pessoalmente', fn: s => `Você passou a tarde com as crianças. Foi emocionante.${Vida.mudar(s, { felicidade: 8, fama: 3 })}` },
            { txt: 'Mandar um vídeo', fn: s => `O vídeo fez o menino sorrir.${Vida.mudar(s, { felicidade: 2, fama: 1 })}` },
            { txt: 'Não tenho tempo', fn: s => `A notícia de que você recusou se espalhou.${Vida.mudar(s, { fama: -3 })}` },
        ],
    },
    {
        titulo: 'Tweet antigo', icone: '🐦', quando: s => s.pessoa.fama >= 25, peso: 0.6,
        texto: 'Acharam um tweet seu de 2015 falando mal do clube que hoje você defende.',
        ops: [
            { txt: 'Pedir desculpas publicamente', fn: s => `A torcida aceitou as desculpas.${Vida.mudar(s, { fama: -1 })}` },
            { txt: 'Dizer que foi hackeado', fn: s => U.chance(0.5) ? `Colou!${Vida.mudar(s, { fama: 0 })}` : `Ninguém acreditou. Virou piada nacional.${Vida.mudar(s, { fama: -4, felicidade: -4 })}` },
        ],
    },
    {
        titulo: 'Relacionamento em crise', icone: '💔', quando: s => !!Vida.parceiro(s), peso: 1,
        prep: (s, c) => { c.r = Vida.parceiro(s); c.nome = c.r.nome; },
        texto: '{nome} reclama que você só pensa em futebol e não dá atenção.',
        ops: [
            { txt: 'Jantar romântico (€ 250)', fn: (s, c) => { c.r.relacao = U.clamp(c.r.relacao + 12, 0, 100); return `O jantar foi perfeito.${Vida.mudar(s, { dinheiro: -250, felicidade: 3 })}`; } },
            { txt: 'Viagem surpresa (€ 4.000)', fn: (s, c) => { c.r.relacao = U.clamp(c.r.relacao + 25, 0, 100); return `${c.nome} amou a surpresa!${Vida.mudar(s, { dinheiro: -4000, felicidade: 6 })}`; } },
            {
                txt: '"Futebol é minha vida."', fn: (s, c) => {
                    c.r.relacao = U.clamp(c.r.relacao - 20, 0, 100);
                    if (c.r.relacao < 35 && U.chance(0.5)) { c.r.tipo = 'ex'; return `${c.nome} fez as malas e foi embora.${Vida.mudar(s, { felicidade: -12 })}`; }
                    return `Vocês brigaram feio.${Vida.mudar(s, { felicidade: -5 })}`;
                }
            },
        ],
    },
    {
        titulo: 'Herança', icone: '📜', peso: 0.25,
        prep: (s, c) => { c.valor = U.redondo(U.rand(3000, 80000)); c.v = U.dinheiro(c.valor); },
        texto: 'Um tio-avô que você mal conhecia faleceu e deixou {v} para você.',
        ops: [{ txt: 'Que surpresa...', fn: (s, c) => `Você recebeu a herança.${Vida.mudar(s, { dinheiro: c.valor, felicidade: 2 })}` }],
    },
    {
        titulo: 'Assalto', icone: '🔫', quando: s => s.pessoa.bens.some(b => b.tipo === 'carro'), peso: 0.4,
        prep: (s, c) => { c.b = U.escolha(s.pessoa.bens.filter(b => b.tipo === 'carro')); c.carro = c.b.nome; },
        texto: 'Dois homens armados te abordaram no semáforo e mandaram você sair do seu {carro}!',
        ops: [
            { txt: 'Entregar o carro', fn: (s, c) => { s.pessoa.bens = s.pessoa.bens.filter(b => b !== c.b); return `Levaram seu ${c.carro}, mas você está vivo.${Vida.mudar(s, { felicidade: -10 })}`; } },
            { txt: 'Acelerar e fugir', fn: (s, c) => U.chance(0.6) ? `Você conseguiu fugir! Que susto.${Vida.mudar(s, { felicidade: -3 })}` : `Você bateu o carro na fuga e se machucou.${(s.pessoa.bens = s.pessoa.bens.filter(b => b !== c.b), '')}${Vida.mudar(s, { saude: -20, felicidade: -10 })}` },
        ],
    },
    // ---------------- Jogador ----------------
    {
        titulo: 'Briga no vestiário', icone: '🥊', quando: s => ehJogador(s) && meuJog(s).tid >= 0, peso: 0.6,
        prep: (s, c) => { const el = Mundo.elenco(s, s.times[meuJog(s).tid]).filter(p => !p.user); c.p = U.escolha(el); c.nome = c.p ? c.p.nome : 'um companheiro'; },
        texto: '{nome} te provocou no vestiário depois do treino.',
        ops: [
            { txt: 'Deixar pra lá', fn: s => `Você manteve a calma. O grupo respeitou.${Vida.mudar(s, { felicidade: -1 })}` },
            { txt: 'Partir pra cima', fn: (s, c) => { meuJog(s).susp = Math.max(meuJog(s).susp, 1); return `Saiu briga! O clube te afastou por 1 jogo.${Vida.mudar(s, { fama: 2, felicidade: -2 })}`; } },
            { txt: 'Resolver numa conversa', fn: s => `Vocês se entenderam e viraram parceiros.${Vida.mudar(s, { felicidade: 2 })}` },
        ],
    },
    {
        titulo: 'Proposta indecente', icone: '🕵️', quando: s => ehJogador(s) && meuJog(s).tid >= 0, peso: 0.25,
        prep: (s, c) => { c.valor = U.redondo(Math.max(5000, meuJog(s).sal * 0.3)); c.v = U.dinheiro(c.valor); },
        texto: 'Um sujeito ligado a sites de apostas te oferece {v} para levar um cartão amarelo no próximo jogo.',
        ops: [
            { txt: 'Recusar e denunciar', fn: s => `Você denunciou o esquema. A imprensa te chamou de exemplo.${Vida.mudar(s, { fama: 4, felicidade: 3 })}` },
            {
                txt: 'Aceitar o dinheiro', fn: (s, c) => {
                    if (U.chance(0.3)) { meuJog(s).susp = 10; return `A polícia descobriu o esquema! Você foi suspenso por 10 jogos e virou manchete negativa.${Vida.mudar(s, { fama: -20, felicidade: -15 })}`; }
                    return `Ninguém percebeu... por enquanto.${Vida.mudar(s, { dinheiro: c.valor, felicidade: -3 })}`;
                }
            },
        ],
    },
    {
        titulo: 'Treino extra', icone: '⏱️', quando: s => ehJogador(s) && meuJog(s).tid >= 0 && meuJog(s).les <= 0, peso: 1,
        texto: 'O preparador físico te convidou para um treino extra no domingo.',
        ops: [
            { txt: 'Topar', fn: s => { s.car.bonusTreino = (s.car.bonusTreino || 0) + 0.25; return `Você suou a camisa no domingo.${Vida.mudar(s, { saude: 1, felicidade: -2 })}`; } },
            { txt: 'Domingo é sagrado', fn: s => `Você curtiu o domingo em família.${Vida.mudar(s, { felicidade: 3 })}` },
        ],
    },
    {
        titulo: 'Elogio do técnico', icone: '👏', quando: s => ehJogador(s) && meuJog(s).tid >= 0 && meuJog(s).j > 3, peso: 0.8,
        texto: 'O técnico te parou no corredor: "Você está evoluindo muito, garoto. Continua assim."',
        ops: [{ txt: 'Valeu, professor!', fn: s => `A confiança lá em cima!${Vida.mudar(s, { felicidade: 5 })}` }],
    },
    {
        titulo: 'Clube rival te sonda', icone: '👀', quando: s => ehJogador(s) && meuJog(s).ovr >= 70, peso: 0.4,
        texto: 'Um dirigente do maior rival te mandou mensagem perguntando se você "toparia uma conversa".',
        ops: [
            { txt: 'Responder interessado', fn: s => { s.car.pedirTransf = true; return `Seu empresário vai ficar de olho em propostas.${Vida.mudar(s, { fama: 1 })}`; } },
            { txt: 'Expor o print nas redes', fn: s => `A torcida do seu clube te idolatra agora!${Vida.mudar(s, { fama: 4, felicidade: 3 })}` },
        ],
    },
    // ---------------- Técnico ----------------
    {
        titulo: 'Jogador insatisfeito', icone: '😠', quando: s => ehTecnico(s), peso: 1.2,
        prep: (s, c) => {
            const t = s.times[s.car.tid];
            const el = Mundo.elenco(s, t).filter(p => p.j <= Math.max(1, s.semana / 4) && p.ovr >= t.rep - 8);
            c.p = el.length ? U.escolha(el) : U.escolha(Mundo.elenco(s, t));
            c.nome = c.p.nome;
        },
        texto: '{nome} reclamou na imprensa que não está tendo chances no time.',
        ops: [
            { txt: 'Prometer mais minutos', fn: (s, c) => { s.times[s.car.tid].moral += 2; return `${c.nome} ficou mais tranquilo.`; } },
            { txt: 'Multar o jogador', fn: (s, c) => { s.times[s.car.tid].moral -= 4; s.car.conf = U.clamp(s.car.conf + 2, 0, 100); return `A diretoria aprovou sua postura dura. O elenco nem tanto.`; } },
            { txt: 'Colocar na lista de transferências', fn: (s, c) => { if (!s.car.venda.includes(c.p.id)) s.car.venda.push(c.p.id); return `${c.nome} está à venda.`; } },
        ],
    },
    {
        titulo: 'Protesto da torcida', icone: '📢', quando: s => ehTecnico(s) && s.times[s.car.tid].moral < 40, peso: 2,
        texto: 'Após os maus resultados, torcedores protestam no CT pedindo raça.',
        ops: [
            { txt: 'Conversar com os líderes da torcida', fn: s => { s.times[s.car.tid].moral += 5; return `A conversa acalmou os ânimos.${Vida.mudar(s, { fama: 1, felicidade: -2 })}`; } },
            { txt: 'Ignorar e fechar os portões', fn: s => { s.car.conf = U.clamp(s.car.conf - 5, 0, 100); return `A diretoria não gostou da repercussão.${Vida.mudar(s, { felicidade: -4 })}`; } },
            { txt: 'Treino aberto ao público', fn: s => { s.times[s.car.tid].moral += 8; return `O treino aberto foi uma festa e o elenco se motivou!${Vida.mudar(s, { fama: 2 })}`; } },
        ],
    },
    {
        titulo: 'Reunião com a diretoria', icone: '👔', quando: s => ehTecnico(s) && s.semana > 6, peso: 0.7,
        texto: 'O presidente te chamou para uma reunião. Ele quer saber suas metas para a temporada.',
        ops: [
            { txt: 'Prometer título', fn: s => { s.car.promessa = 'titulo'; s.car.conf = U.clamp(s.car.conf + 6, 0, 100); return 'O presidente adorou a ambição. Agora vai cobrar!'; } },
            { txt: 'Prometer trabalho e evolução', fn: s => { s.car.conf = U.clamp(s.car.conf + 2, 0, 100); return 'Uma resposta sensata. A diretoria confia em você.'; } },
            { txt: 'Pedir mais dinheiro para contratar', fn: s => { const t = s.times[s.car.tid]; if (s.car.conf >= 60 && U.chance(0.5)) { const v = U.redondo(Math.max(5e5, t.saldo * 0.15)); t.saldo += v; return `Aprovado! O clube liberou mais ${U.dinheiro(v)}.`; } s.car.conf = U.clamp(s.car.conf - 3, 0, 100); return 'O presidente disse que não tem dinheiro sobrando.'; } },
        ],
    },
    {
        titulo: 'Craque quer renovar', icone: '✍️', quando: s => ehTecnico(s) && Mundo.elenco(s, s.times[s.car.tid]).some(p => p.contr <= 1 && p.ovr >= s.times[s.car.tid].rep), peso: 0.8,
        prep: (s, c) => { c.p = Mundo.elenco(s, s.times[s.car.tid]).filter(p => p.contr <= 1 && p.ovr >= s.times[s.car.tid].rep).sort((a, b) => b.ovr - a.ovr)[0]; c.nome = c.p.nome; c.novo = U.redondo(c.p.sal * 1.3); c.v = U.dinheiro(c.novo); },
        texto: 'O empresário de {nome} diz que ele quer renovar, mas pede salário de {v} por ano.',
        ops: [
            { txt: 'Renovar por 3 anos', fn: (s, c) => { c.p.sal = c.novo; c.p.contr = 3; return `${c.nome} renovou até ${s.ano + 3}!`; } },
            { txt: 'Deixar para depois', fn: (s, c) => `${c.nome} vai esperar... mas o contrato está acabando.` },
        ],
    },
];
