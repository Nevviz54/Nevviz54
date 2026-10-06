'use strict';
// =====================================================================
//  CATEGORIA DE BASE E OLHEIROS (carreira de técnico)
//  Os garotos da base ficam em s.jog com tid = -2 e p.base = id do clube.
//  Eles treinam toda semana (cada um rende mais em um tipo de treino) e,
//  quando sobem, viram jogadores normais do elenco profissional.
// =====================================================================

// Treinos da base. "encaixe" = posições que aproveitam melhor o treino.
const TREINOS_BASE = {
    tecnico: { nome: 'Técnico', icone: '🎯', desc: 'Passe, domínio e drible.' },
    fisico: { nome: 'Físico', icone: '💪', desc: 'Força, velocidade e resistência.' },
    tatico: { nome: 'Tático', icone: '🧠', desc: 'Posicionamento e leitura de jogo.' },
    finalizacao: { nome: 'Finalização', icone: '⚽', desc: 'Chutes e cabeceios. Rende mais para atacantes.', encaixe: ['MEI', 'PON', 'ATA'] },
    defensivo: { nome: 'Defensivo', icone: '🛡️', desc: 'Marcação e desarme. Rende mais para defensores.', encaixe: ['ZAG', 'LAT', 'VOL'] },
    goleiro: { nome: 'Goleiros', icone: '🧤', desc: 'Reflexo e saída do gol. Só serve para goleiros.', encaixe: ['GOL'] },
    mental: { nome: 'Mental', icone: '🧘', desc: 'Confiança, frieza e liderança.' },
};

// O que o olheiro pode procurar
const GRUPOS_OLH = {
    GOL: { nome: 'Goleiro', icone: '🧤', pos: ['GOL'] },
    ZAG: { nome: 'Zagueiro', icone: '🧱', pos: ['ZAG'] },
    LAT: { nome: 'Lateral', icone: '↔️', pos: ['LAT'] },
    MEI: { nome: 'Meio-campo', icone: '🎯', pos: ['VOL', 'MEI'] },
    ATA: { nome: 'Ataque', icone: '⚽', pos: ['PON', 'ATA'] },
};

// Países por região: [id, nome, bandeira, nomes, talento 1-5]
const REGIOES_OLH = {
    'América do Sul': [
        ['BRA', 'Brasil', '🇧🇷', 'br', 5], ['ARG', 'Argentina', '🇦🇷', 'ar', 5], ['URU', 'Uruguai', '🇺🇾', 'ar', 4], ['COL', 'Colômbia', '🇨🇴', 'es', 4],
        ['EQU', 'Equador', '🇪🇨', 'es', 4], ['PAR', 'Paraguai', '🇵🇾', 'es', 3], ['CHI', 'Chile', '🇨🇱', 'es', 3], ['PER', 'Peru', '🇵🇪', 'es', 2],
        ['VEN', 'Venezuela', '🇻🇪', 'es', 2], ['BOL', 'Bolívia', '🇧🇴', 'es', 1],
    ],
    'América do Norte': [
        ['USA', 'Estados Unidos', '🇺🇸', 'en', 3], ['MEX', 'México', '🇲🇽', 'es', 3], ['CAN', 'Canadá', '🇨🇦', 'en', 3],
    ],
    'América Central': [
        ['CRC', 'Costa Rica', '🇨🇷', 'es', 2], ['PAN', 'Panamá', '🇵🇦', 'es', 2], ['HON', 'Honduras', '🇭🇳', 'es', 2], ['JAM', 'Jamaica', '🇯🇲', 'en', 2],
        ['HAI', 'Haiti', '🇭🇹', 'fr', 1], ['SLV', 'El Salvador', '🇸🇻', 'es', 1], ['GUA', 'Guatemala', '🇬🇹', 'es', 1],
    ],
    'Europa': [
        ['FRA', 'França', '🇫🇷', 'fr', 5], ['ESP', 'Espanha', '🇪🇸', 'es', 5], ['ENG', 'Inglaterra', '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'en', 4], ['POR', 'Portugal', '🇵🇹', 'pt', 4],
        ['GER', 'Alemanha', '🇩🇪', 'de', 4], ['NED', 'Holanda', '🇳🇱', 'nl', 4], ['ITA', 'Itália', '🇮🇹', 'it', 4], ['BEL', 'Bélgica', '🇧🇪', 'nl', 4],
        ['CRO', 'Croácia', '🇭🇷', 'bal', 4], ['SRB', 'Sérvia', '🇷🇸', 'bal', 3], ['NOR', 'Noruega', '🇳🇴', 'nor', 3], ['DEN', 'Dinamarca', '🇩🇰', 'nor', 3],
        ['SWE', 'Suécia', '🇸🇪', 'nor', 3], ['TUR', 'Turquia', '🇹🇷', 'tr', 3], ['POL', 'Polônia', '🇵🇱', 'pl', 3], ['SUI', 'Suíça', '🇨🇭', 'de', 3],
        ['AUT', 'Áustria', '🇦🇹', 'de', 3],
    ],
    'África': [
        ['NGA', 'Nigéria', '🇳🇬', 'afr', 4], ['SEN', 'Senegal', '🇸🇳', 'afr', 4], ['CIV', 'Costa do Marfim', '🇨🇮', 'afr', 4], ['MAR', 'Marrocos', '🇲🇦', 'arab', 4],
        ['GHA', 'Gana', '🇬🇭', 'afr', 3], ['CMR', 'Camarões', '🇨🇲', 'afr', 3], ['ALG', 'Argélia', '🇩🇿', 'arab', 3], ['EGY', 'Egito', '🇪🇬', 'arab', 3],
        ['MLI', 'Mali', '🇲🇱', 'afr', 3], ['RSA', 'África do Sul', '🇿🇦', 'en', 2],
    ],
    'Ásia': [
        ['JPN', 'Japão', '🇯🇵', 'jp', 3], ['KOR', 'Coreia do Sul', '🇰🇷', 'kr', 3], ['KSA', 'Arábia Saudita', '🇸🇦', 'arab', 2], ['IRN', 'Irã', '🇮🇷', 'ir', 2],
        ['QAT', 'Catar', '🇶🇦', 'arab', 2], ['UZB', 'Uzbequistão', '🇺🇿', 'ir', 2], ['CHN', 'China', '🇨🇳', 'ch', 2],
    ],
    'Oceania': [
        ['AUS', 'Austrália', '🇦🇺', 'en', 2], ['NZL', 'Nova Zelândia', '🇳🇿', 'en', 2], ['FIJ', 'Fiji', '🇫🇯', 'en', 1], ['TAH', 'Taiti', '🇵🇫', 'fr', 1],
    ],
};
const PAISES_OLH = {};
for (const [reg, lista] of Object.entries(REGIOES_OLH)) {
    for (const [id, nome, bnd, cod, tal] of lista) PAISES_OLH[id] = { id, nome, bnd, cod, tal, reg };
}

// Olheiros e diretores famosos por revelar talentos: [nome, bandeira, estrelas, especialidade]
const OLHEIROS_REAIS = [
    ['Juni Calafat', '🇪🇸', 5, 'América do Sul'], ['Piet de Visser', '🇳🇱', 5, 'América do Sul'], ['Monchi', '🇪🇸', 5, 'Europa'],
    ['Luís Campos', '🇵🇹', 5, 'Europa'], ['Michael Edwards', '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 5, 'Europa'], ['John Steen Olsen', '🇩🇰', 5, 'Europa'],
    ['Giovanni Sartori', '🇮🇹', 5, 'Europa'], ['Ramón Maddoni', '🇦🇷', 5, 'América do Sul'],
    ['Sven Mislintat', '🇩🇪', 4, 'Ásia'], ['Steve Walsh', '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 4, 'Europa'], ['Francis Cagigao', '🇪🇸', 4, 'Europa'],
    ['Walter Sabatini', '🇮🇹', 4, 'América do Sul'], ['Ariedo Braida', '🇮🇹', 4, 'América do Sul'], ['Paul Mitchell', '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 4, 'Europa'],
    ['Andrea Berta', '🇮🇹', 4, 'Europa'], ['Txiki Begiristain', '🇪🇸', 4, 'Europa'], ['Damien Comolli', '🇫🇷', 4, 'Europa'],
    ['Rasmus Ankersen', '🇩🇰', 4, 'Europa'], ['Marcel Brands', '🇳🇱', 4, 'Europa'], ['Christoph Freund', '🇦🇹', 4, 'África'],
    ['Jean-Marc Guillou', '🇫🇷', 4, 'África'], ['José Boto', '🇵🇹', 4, 'Europa'], ['Dan Ashworth', '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 4, 'Europa'],
    ['Max Eberl', '🇩🇪', 4, 'Europa'], ['Markus Krösche', '🇩🇪', 4, 'Europa'], ['Hugo Tocalli', '🇦🇷', 4, 'América do Sul'],
    ['Antero Henrique', '🇵🇹', 4, 'América do Sul'],
    ['Rodrigo Caetano', '🇧🇷', 3, 'América do Sul'], ['Alexandre Mattos', '🇧🇷', 3, 'América do Sul'], ['Anderson Barros', '🇧🇷', 3, 'América do Sul'],
    ['Edu Gaspar', '🇧🇷', 3, 'América do Sul'], ['Paulo Bracks', '🇧🇷', 3, 'América do Sul'], ['Mateu Alemany', '🇪🇸', 3, 'Europa'],
    ['Lee Congerton', '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 3, 'Europa'], ['Michael Zorc', '🇩🇪', 3, 'Europa'], ['Earnie Stewart', '🇺🇸', 3, 'América do Norte'],
    ['Tab Ramos', '🇺🇸', 3, 'América do Norte'], ['Jesús Ramírez', '🇲🇽', 3, 'América do Norte'],
];

const SAL_OLH = [0, 1500, 3500, 7000, 13000, 22000];   // salário semanal por estrelas
const DUR_MISSAO = [0, 4, 4, 3, 3, 2];                 // semanas de viagem por estrelas
const MAX_OLHEIROS = 3;
const MAX_BASE = 30;
const COMPOSICAO_BASE = { GOL: 2, ZAG: 3, LAT: 3, VOL: 2, MEI: 2, PON: 2, ATA: 2 };
const REGIAO_CLUBE = { BRA: 'América do Sul', ARG: 'América do Sul', USA: 'América do Norte', MEX: 'América do Norte' };

const Base = {
    // -----------------------------------------------------------------
    //  Estado
    // -----------------------------------------------------------------
    estado(s) {
        const c = s.car;
        if (!c.olheiros) c.olheiros = [];
        if (!c.relat) c.relat = [];
        if (!c.olhHist) c.olhHist = [];
        if (!c.olhMerc) c.olhMerc = { prox: 0, lista: [] };
        return c;
    },

    garotos(s, t) {
        return (t.base || []).map(id => s.jog[id]).filter(p => p && p.base === t.id);
    },

    // Cria a base do clube na primeira vez (garotos reais quando houver)
    garantir(s, t) {
        if (t.base) return;
        t.base = [];
        const usados = new Set(Object.values(s.jog).map(p => p.nome));
        const cont = { GOL: 0, ZAG: 0, LAT: 0, VOL: 0, MEI: 0, PON: 0, ATA: 0 };
        const reais = (DADOS.base && DADOS.base[t.nome]) || '';
        for (const parte of reais.split(',')) {
            const [nome, pos, idade, ovr] = parte.trim().split(':');
            if (!nome || !POS_NOME[pos] || usados.has(nome)) continue;
            const i = +idade, o = +ovr;
            const pot = U.chance(0.06) ? U.int(90, 99) : U.clamp(o + U.int(10, 22) + (19 - i) * 2, o + 4, 97);
            Base.novoGaroto(s, t, { nome, pos, idade: i, ovr: o, pot, real: true, nac: t.pais });
            cont[pos]++;
        }
        const nb = Mundo.infra(t).base;
        for (const pos of POSICOES) {
            while (cont[pos] < COMPOSICAO_BASE[pos]) {
                const idade = U.pesado([14, 15, 16, 17, 18], i => i === 14 ? 1 : 2);
                const pot = U.chance(0.03) ? U.int(88, 97) : U.clamp(Math.round(t.rep - 4 + (nb - 3) * 2.5 + U.normal(0, 7)), 52, 95);
                const ovr = U.clamp(Math.round(pot - (32 - (idade - 14) * 4) + U.normal(0, 3)), 38, 70);
                Base.novoGaroto(s, t, { nome: Nomes.gerar(Mundo.pais(t.pais).nomes), pos, idade, ovr, pot, real: false, nac: t.pais });
                cont[pos]++;
            }
        }
    },

    novoGaroto(s, t, d) {
        const p = Mundo.novoJogador(s, { nome: d.nome, pos: d.pos, idade: d.idade, ovr: d.ovr, pot: d.pot, tid: -2, real: d.real }, 0.3);
        Base.matricular(s, t, p, d);
        // quem já estava na base chegou faz tempo (pode cobrar uma chance logo)
        p.sb = d.recem ? 0 : U.int(0, Math.max(0, (p.idade - 13) * 40));
        return p;
    },

    // transforma um jogador (novo) em garoto da base do clube
    matricular(s, t, p, d = {}) {
        p.tid = -2;
        p.base = t.id;
        p.nac = d.nac || t.pais;
        p.bnd = d.bnd || (PAISES_OLH[p.nac] ? PAISES_OLH[p.nac].bnd : Mundo.pais(t.pais).bandeira);
        p.sal = U.redondo(3000 + Math.max(0, p.ovr - 45) * 600);
        p.contr = 3;
        p.ovr0 = p.ovr;
        p.pg = 0;
        p.sb = 0;
        p.st = 0;
        p.tb = p.pos === 'GOL' ? 'goleiro' : U.escolha(['tecnico', 'fisico', 'tatico']);
        const tipos = Object.keys(TREINOS_BASE).filter(k => k !== 'goleiro');
        p.af = U.escolha(p.pos === 'GOL' ? tipos.concat(['goleiro', 'goleiro']) : tipos);
        p.ruim = U.escolha(tipos.filter(k => k !== p.af));
        p.conhec = {};
        Base.faixa(p, d.largura != null ? d.largura : 4 + (5 - Mundo.infra(t).base) * 2);
        t.base = t.base || [];
        if (!t.base.includes(p.id)) t.base.push(p.id);
    },

    // faixa de potencial que aparece para o usuário (o potencial real fica escondido no meio)
    faixa(p, w) {
        w = Math.max(2, Math.round(w));
        p.pmin = U.clamp(p.pot - U.int(0, w), Math.min(p.pot, p.ovr + 1), 99);
        p.pmax = Math.max(p.pot, Math.min(99, p.pmin + w));
    },

    // multiplicador de evolução de um treino para o garoto
    rendimento(p, k) {
        const tr = TREINOS_BASE[k];
        let m = k === p.af ? 1.8 : k === p.ruim ? 0.5 : 1;
        if (tr.encaixe) m *= tr.encaixe.includes(p.pos) ? 1.15 : (k === 'goleiro' ? 0.35 : 0.8);
        else if (p.pos === 'GOL' && k !== 'fisico' && k !== 'mental') m *= 0.8;
        return m;
    },

    rotuloRend(m) {
        return m >= 1.5 ? '<span class="rend rend-alto">🔥 Rende muito</span>'
            : m <= 0.7 ? '<span class="rend rend-baixo">🐢 Rende pouco</span>'
                : '<span class="rend">👍 Normal</span>';
    },

    custoSemanal(s, t) {
        const kids = U.soma(Base.garotos(s, t), p => p.sal) / 52;
        const olh = U.soma(Base.estado(s).olheiros, o => o.sal);
        return Math.round(kids + olh);
    },

    // -----------------------------------------------------------------
    //  Semana
    // -----------------------------------------------------------------
    async semana(s, t) {
        Base.garantir(s, t);
        Base.estado(s);
        Base.treinar(s, t);
        t.saldo -= Base.custoSemanal(s, t);
        Base.atualizarMercado(s);
        for (const o of s.car.olheiros) {
            if (!o.missao) continue;
            o.missao.falta--;
            if (o.missao.falta <= 0) await Base.concluirMissao(s, o);
        }
        await Base.reclamacao(s, t);
    },

    treinar(s, t) {
        const nb = Mundo.infra(t).base;
        for (const p of Base.garotos(s, t)) {
            p.sb = (p.sb || 0) + 1;
            p.st = (p.st || 0) + 1;
            if (p.st >= 3 && !p.conhec[p.tb]) p.conhec[p.tb] = 1;
            const idadeF = p.idade <= 15 ? 1.35 : p.idade === 16 ? 1.25 : p.idade === 17 ? 1.15 : p.idade === 18 ? 1 : 0.9;
            const gapF = U.clamp((p.pot - p.ovr) / 12, 0.2, 1.1);
            p.pg = (p.pg || 0) + 0.13 * idadeF * Base.rendimento(p, p.tb) * (0.75 + nb * 0.1) * U.rand(0.7, 1.3) * gapF;
            while (p.pg >= 1) {
                p.pg -= 1;
                if (p.ovr < p.pot) p.ovr++;
            }
            if (p.ovr >= p.pmin) p.pmin = Math.min(p.pot, p.ovr + (p.ovr < p.pot ? 1 : 0));
            // com o tempo a comissão técnica conhece melhor o garoto
            if (p.sb % 8 === 0) {
                p.pmin += Math.ceil((p.pot - p.pmin) / 3);
                p.pmax -= Math.ceil((p.pmax - p.pot) / 3);
            }
            p.sal = U.redondo(3000 + Math.max(0, p.ovr - 45) * 600);
        }
    },

    // garoto de 17+ que está há muito tempo na base pede uma chance
    async reclamacao(s, t) {
        const agora = Mot.agora(s);
        if (s.car.baseMsg && agora - s.car.baseMsg < 5) return;
        const cand = Base.garotos(s, t).filter(p => p.idade >= 17 && p.sb >= 20 && p.promB == null && !(p.msgB && agora - p.msgB < 12));
        const p = U.embaralhar(cand).find(x => U.chance(x.ovr >= t.rep - 14 ? 0.05 : 0.03));
        if (!p) return;
        p.msgB = s.car.baseMsg = agora;
        const anos = Math.max(1, Math.round(p.sb / TOTAL_SEMANAS));
        const i = await UI.perguntar(`📱 Mensagem de ${U.esc(p.nome)} (base)`,
            `${UI.pos(p.pos)} <b>${U.esc(p.nome)}</b> · ${p.idade} anos · OVR ${p.ovr} · potencial ${p.pmin}–${p.pmax}<br><br>
            <i>"Professor, já são ${anos > 1 ? `${anos} anos` : 'muitos meses'} na base e eu sinto que não estou sendo aproveitado. Se eu não tiver uma chance no profissional, vou procurar outro clube."</i>`,
            ['⬆️ "Pode subir: a partir de hoje você treina com o profissional."', '🤝 "Até o fim da temporada você sobe, prometo."', '⏳ "Tenha paciência, sua hora vai chegar."', '👋 "Se quer ir embora, pode ir."'], '🌱');
        if (i === 0) return Base.promover(s, p, t);
        if (i === 1) {
            p.promB = s.ano;
            Vida.log(s, `🤝 Você prometeu subir ${p.nome} ao profissional até o fim da temporada.`, '');
            UI.toast(`🤝 ${p.nome} vai esperar até o fim da temporada. Não esqueça de subir ele!`);
            return;
        }
        if (i === 2) {
            if (U.chance(0.5)) {
                UI.toast(`⏳ ${p.nome} aceitou esperar mais um pouco.`);
                return;
            }
            await UI.aviso('Ele não quis esperar', `<b>${U.esc(p.nome)}</b> respondeu: <i>"Já esperei demais, professor. Obrigado por tudo."</i><br>Ele deixou a base do ${U.esc(t.nome)}.`, '🚪');
            return Base.liberar(s, p, t, 'cansou de esperar uma chance');
        }
        return Base.liberar(s, p, t, 'foi liberado');
    },

    limpar(p) {
        for (const k of ['base', 'nac', 'bnd', 'ovr0', 'pg', 'sb', 'st', 'tb', 'af', 'ruim', 'conhec', 'pmin', 'pmax', 'promB', 'msgB']) delete p[k];
    },

    promover(s, p, t) {
        const liga = Mundo.liga(s, t.liga);
        t.base = (t.base || []).filter(id => id !== p.id);
        Base.limpar(p);
        p.tid = -1;
        Mundo.transferir(s, p, t, 0);
        p.contr = 3;
        p.sal = U.redondo(Mundo.salarioPedido(p, liga.riqueza) * 0.5);
        Conquistas.contar(s, 'crias');
        Vida.log(s, `⬆️ Você subiu ${p.nome} (${p.pos}, ${p.idade} anos, OVR ${p.ovr}) da base para o profissional.`, 'bom');
        Mundo.noticia(s, `🌱 ${t.nome} promove ${p.nome}, de ${p.idade} anos, ao time principal.`, 'clube');
        UI.toast(`⬆️ ${p.nome} agora faz parte do elenco profissional!`);
    },

    liberar(s, p, t, motivo) {
        t.base = (t.base || []).filter(id => id !== p.id);
        Base.limpar(p);
        p.tid = -1;
        p.contr = 1;
        p.sal = Mundo.salarioPedido(p, 0.3);
        s.livres.push(p.id);
        Vida.log(s, `🚪 ${p.nome} deixou a base do ${t.nome} (${motivo}).`, 'ruim');
        Mundo.noticia(s, `🚪 ${p.nome}, ${p.idade} anos, deixa a base do ${t.nome}.`, 'clube');
    },

    // técnico saiu do clube: a diretoria cuida da base (sobem os melhores)
    deixar(s, t) {
        if (!t || !t.base) return;
        const kids = Base.garotos(s, t).sort((a, b) => b.ovr - a.ovr);
        kids.forEach((p, i) => {
            if (i < 2 && p.idade >= 17) {
                Base.limpar(p);
                p.tid = -1;
                Mundo.transferir(s, p, t, 0);
            } else delete s.jog[p.id];
        });
        t.base = null;
    },

    // -----------------------------------------------------------------
    //  Fim de temporada: promessas, garotos de 20 anos e novos meninos
    // -----------------------------------------------------------------
    async fimTemporada(s) {
        const t = Tecnico.time(s);
        if (!t) return;
        Base.garantir(s, t);
        for (const p of Base.garotos(s, t)) {
            if (p.promB != null && p.promB < s.ano) {
                await UI.aviso('Promessa quebrada', `<b>${U.esc(p.nome)}</b>: <i>"Você me prometeu uma chance no profissional e não cumpriu. Vou embora."</i><br>Ele deixou a base do ${U.esc(t.nome)}.`, '💔');
                Base.liberar(s, p, t, 'promessa não cumprida');
            }
        }
        for (const p of Base.garotos(s, t)) {
            if (p.idade < 20) continue;
            const i = await UI.perguntar('Fim do ciclo na base', `${UI.pos(p.pos)} <b>${U.esc(p.nome)}</b> fez ${p.idade} anos e não pode mais jogar na base.<br>OVR ${p.ovr} · potencial ${p.pmin}–${p.pmax}`,
                ['⬆️ Subir para o profissional', '👋 Liberar'], '🎓');
            if (i === 0) Base.promover(s, p, t); else Base.liberar(s, p, t, 'idade limite');
        }
        // meninos do sub-15 que sobem para a base
        const nb = Mundo.infra(t).base;
        const novos = [];
        for (let k = 0, n = U.int(2, 3); k < n; k++) {
            const pot = U.chance(0.02 + nb * 0.01) ? U.int(88, 97) : U.clamp(Math.round(t.rep - 5 + (nb - 3) * 3 + U.normal(0, 7)), 50, 94);
            const ovr = U.clamp(Math.round(pot - 32 + U.normal(0, 3)), 38, 62);
            novos.push(Base.novoGaroto(s, t, { nome: Nomes.gerar(Mundo.pais(t.pais).nomes), pos: U.escolha(POSICOES.concat(['ZAG', 'MEI', 'ATA'])), idade: 14, ovr, pot, real: false, nac: t.pais, recem: true }));
        }
        Vida.log(s, `🌱 Subiram do sub-15 para a base: ${novos.map(p => `${p.nome} (${p.pos})`).join(', ')}.`, '');
    },

    // -----------------------------------------------------------------
    //  Olheiros
    // -----------------------------------------------------------------
    gerarOlheiro(s, ocupados) {
        if (U.chance(0.3)) {
            const livres = OLHEIROS_REAIS.filter(o => !ocupados.has(o[0]));
            const r = livres.length && U.pesado(livres, o => o[2] === 5 ? 1 : o[2] === 4 ? 2.5 : 4);
            if (r) {
                const est = r[2];
                return { id: s.seqJ++, nome: r[0], bnd: r[1], est, esp: r[3], real: true, sal: Math.round(SAL_OLH[est] * 1.3), mis: 0, ach: 0, somaPot: 0, joias: 0, assin: 0, missao: null };
            }
        }
        const est = U.pesado([1, 2, 3, 4], e => [0, 30, 36, 24, 10][e]);
        const reg = U.escolha(Object.keys(REGIOES_OLH));
        const pais = U.escolha(REGIOES_OLH[reg]);
        return {
            id: s.seqJ++, nome: Nomes.gerar(pais[3], true), bnd: pais[2], est, esp: reg, real: false,
            sal: Math.round(SAL_OLH[est] * U.rand(0.85, 1.15) / 100) * 100, mis: 0, ach: 0, somaPot: 0, joias: 0, assin: 0, missao: null,
        };
    },

    atualizarMercado(s) {
        const c = Base.estado(s);
        const agora = Mot.agora(s);
        if (agora < c.olhMerc.prox && c.olhMerc.lista.length >= 3) return;
        const ocupados = new Set(c.olheiros.map(o => o.nome).concat(c.olhMerc.lista.map(o => o.nome)));
        // troca 1 ou 2 candidatos (ou completa a lista)
        const troca = c.olhMerc.lista.length >= 3 ? U.int(1, 2) : 0;
        for (let k = 0; k < troca; k++) c.olhMerc.lista.splice(U.int(0, c.olhMerc.lista.length - 1), 1);
        while (c.olhMerc.lista.length < 3) {
            const o = Base.gerarOlheiro(s, ocupados);
            ocupados.add(o.nome);
            c.olhMerc.lista.push(o);
        }
        c.olhMerc.prox = agora + 6;
    },

    // estrelas de resultado: média de potencial do que ele já achou
    resultado(o) {
        if (!o.ach) return null;
        return U.clamp((o.somaPot / o.ach - 58) / 5.5 + o.joias * 0.25, 0.5, 5);
    },

    custoMissao(s, o, paisId) {
        const t = Tecnico.time(s);
        const reg = PAISES_OLH[paisId].reg;
        const casa = REGIAO_CLUBE[t ? t.pais : 'BRA'] || 'Europa';
        return U.redondo((reg === casa ? 20000 : 55000) * (0.7 + o.est * 0.15));
    },

    async enviarMissao(s, o) {
        const regs = Object.keys(REGIOES_OLH);
        const opcoesPais = reg => REGIOES_OLH[reg].map(([id, nome, bnd, , tal]) =>
            `<option value="${id}">${bnd} ${nome} · talento ${'★'.repeat(tal)}${'☆'.repeat(5 - tal)} · ${U.dinheiro(Base.custoMissao(s, o, id))}</option>`).join('');
        const reg0 = o.esp;
        let escolha = null;
        const html = `<p>Para onde <b>${o.bnd} ${U.esc(o.nome)}</b> ${Base.estrelasHtml(o.est)} vai viajar? A viagem leva <b>${DUR_MISSAO[o.est]} semanas</b> e ele volta com <b>5 garotos</b> para você avaliar.</p>
            <p class="cinza pequeno">🌍 Especialidade dele: <b>${U.esc(o.esp)}</b> (acha garotos melhores lá).</p>
            <div class="form-missao">
                <label>Continente <select class="sel" id="mRegiao" data-mudar="olhRegiao" data-oid="${o.id}">${regs.map(r => `<option ${r === reg0 ? 'selected' : ''}>${r}</option>`).join('')}</select></label>
                <label>País <select class="sel" id="mPais">${opcoesPais(reg0)}</select></label>
                <div><span class="cinza pequeno">Posição procurada</span>
                <div class="chips-pos">${Object.entries(GRUPOS_OLH).map(([k, g], i) => `<label class="chip-btn chip-radio"><input type="radio" name="mGrupo" value="${k}" ${i === 4 ? 'checked' : ''}> ${g.icone} ${g.nome}</label>`).join('')}</div></div>
            </div>`;
        Base._opcoesPais = opcoesPais;
        const ok = await UI.modal({
            titulo: '🔭 Enviar olheiro', html, largo: true,
            botoes: [
                {
                    txt: '🛫 Enviar', valor: true, antes: fundo => {
                        const pais = fundo.querySelector('#mPais').value;
                        const g = fundo.querySelector('input[name="mGrupo"]:checked');
                        escolha = { pais, grupo: g ? g.value : 'ATA' };
                    },
                },
                { txt: 'Cancelar', valor: false, classe: 'btn-fantasma' },
            ],
        });
        Base._opcoesPais = null;
        if (!ok || !escolha) return;
        const t = Tecnico.time(s);
        const custo = Base.custoMissao(s, o, escolha.pais);
        if (t.saldo < custo) return UI.toast('💸 O clube não tem caixa para essa viagem.', 'erro');
        t.saldo -= custo;
        o.missao = { pais: escolha.pais, grupo: escolha.grupo, falta: DUR_MISSAO[o.est] };
        const P = PAISES_OLH[escolha.pais];
        Vida.log(s, `🛫 ${o.nome} viajou para ${P.nome} atrás de ${GRUPOS_OLH[escolha.grupo].nome.toLowerCase()}s (${U.dinheiro(custo)}).`, '');
        UI.toast(`🛫 ${o.nome} embarcou para ${P.bnd} ${P.nome}. Volta em ${o.missao.falta} semanas.`);
    },

    prospecto(s, o, paisId, grupo) {
        const P = PAISES_OLH[paisId];
        const ef = Math.min(5.5, o.est + (P.reg === o.esp ? 0.7 : 0));
        const idade = U.pesado([15, 16, 17], i => i === 16 ? 4 : 3);
        let pot;
        if (U.chance(0.015 + ef * 0.012 + P.tal * 0.006)) pot = U.pesado([88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99], v => 100 - v + 1);
        else pot = U.clamp(Math.round(54 + P.tal * 3 + ef * 2.6 + U.normal(0, 7)), 52, 96);
        const ovr = U.clamp(Math.round(pot - (30 - (idade - 15) * 4) + U.normal(0, 3)), 40, 72);
        const pos = U.escolha(GRUPOS_OLH[grupo].pos);
        const x = { nome: Nomes.gerar(P.cod, true), pos, idade, ovr, pot, nac: P.id, bnd: P.bnd };
        const w = (5.5 - ef) * 3 + U.int(0, 3);
        Base.faixa(x, w);
        x.custo = U.redondo(15000 + 25000 * Math.pow(1.1, (x.pmin + x.pmax) / 2 - 60));
        x.st = null;   // null = aguardando, 'ok' = foi para a base, 'nao' = dispensado
        return x;
    },

    async concluirMissao(s, o) {
        const { pais, grupo } = o.missao;
        o.missao = null;
        const cands = [0, 1, 2, 3, 4].map(() => Base.prospecto(s, o, pais, grupo));
        o.mis++;
        o.ach += cands.length;
        o.somaPot += U.soma(cands, x => x.pot);
        o.joias += cands.filter(x => x.pot >= 88).length;
        const r = { oid: o.id, olheiro: o.nome, obnd: o.bnd, pais, grupo, ano: s.ano, sem: s.semana, cands };
        s.car.relat.unshift(r);
        if (s.car.relat.length > 6) s.car.relat.length = 6;
        const P = PAISES_OLH[pais];
        Vida.log(s, `📋 ${o.nome} voltou de ${P.nome} com 5 garotos (${GRUPOS_OLH[grupo].nome.toLowerCase()}).`, 'bom');
        const ver = await UI.modal({
            titulo: `📋 Relatório de ${U.esc(o.nome)}`,
            html: `<p>${o.bnd} <b>${U.esc(o.nome)}</b> voltou de <b>${P.bnd} ${P.nome}</b> com 5 garotos (${GRUPOS_OLH[grupo].icone} ${GRUPOS_OLH[grupo].nome}). Decida quem vai para a sua base na aba <b>🌱 Base</b>.</p>
                <div class="grade-prosp">${cands.map(x => Base.cardProspecto(x)).join('')}</div>`,
            largo: true,
            botoes: [{ txt: '🌱 Ver na aba Base', valor: true }, { txt: 'Depois', valor: false, classe: 'btn-fantasma' }],
        });
        if (ver) Jogo.aba = 'base';
    },

    cardProspecto(x, botoes = '') {
        return `<div class="cand-base prosp ${x.st ? 'prosp-' + x.st : ''}">${UI.pos(x.pos)}<b>${x.bnd} ${U.esc(x.nome)}</b>
            <small>${x.idade} anos · ${POS_NOME[x.pos]}</small>
            <div>OVR ${UI.ovr(x.ovr)}</div>
            <div class="pot-faixa"><span>Potencial</span> <b>${x.pmin}</b> <span>até</span> <b class="teto">${x.pmax}</b></div>
            <div class="estrelas-pot">${U.estrelas(((x.pmin + x.pmax) / 2 - 55) / 8)}</div>
            ${x.custo != null ? `<small>Luvas: <b>${U.dinheiro(x.custo)}</b></small>` : ''}${botoes}</div>`;
    },

    assinar(s, ri, k) {
        const t = Tecnico.time(s);
        const r = s.car.relat[ri];
        const x = r && r.cands[k];
        if (!x || x.st) return;
        if (Base.garotos(s, t).length >= MAX_BASE) return UI.toast(`A base já tem ${MAX_BASE} garotos. Suba ou libere alguém antes.`, 'erro');
        if (t.saldo < x.custo) return UI.toast('💸 O clube não tem caixa para pagar as luvas.', 'erro');
        t.saldo -= x.custo;
        x.st = 'ok';
        const p = Mundo.novoJogador(s, { nome: x.nome, pos: x.pos, idade: x.idade, ovr: x.ovr, pot: x.pot, tid: -2, real: false }, 0.3);
        Base.matricular(s, t, p, { nac: x.nac, bnd: x.bnd });
        p.pmin = x.pmin;
        p.pmax = x.pmax;
        const o = s.car.olheiros.find(y => y.id === r.oid);
        if (o) o.assin++;
        if (x.pmax >= 95) Conquistas.contar(s, 'garimpo');
        Vida.log(s, `✍️ ${p.nome} (${p.pos}, ${p.idade} anos, ${PAISES_OLH[x.nac].nome}) chegou à base do ${t.nome}.`, 'bom');
        UI.toast(`✍️ ${x.bnd} ${x.nome} agora é da sua base!`);
        Base.limparRelatorios(s);
    },

    limparRelatorios(s) {
        s.car.relat = s.car.relat.filter(r => r.cands.some(x => !x.st));
    },

    estrelasHtml(n) {
        return `<span class="estrelas-olh">${U.estrelas(n)}</span>`;
    },

    // -----------------------------------------------------------------
    //  Aba "Base"
    // -----------------------------------------------------------------
    tela(s) {
        const t = Tecnico.time(s);
        Base.garantir(s, t);
        const c = Base.estado(s);
        if (!c.olhMerc.lista.length) Base.atualizarMercado(s);
        const nb = Mundo.infra(t).base;
        const kids = Base.garotos(s, t).sort((a, b) => POSICOES.indexOf(a.pos) - POSICOES.indexOf(b.pos) || b.ovr - a.ovr);
        const opcoesTreino = sel => Object.entries(TREINOS_BASE).map(([k, tr]) => `<option value="${k}" ${k === sel ? 'selected' : ''}>${tr.icone} ${tr.nome}</option>`).join('');
        const linha = p => {
            const conhecido = p.conhec && p.conhec[p.tb];
            const sabidos = Object.keys(p.conhec || {}).map(k => `${TREINOS_BASE[k].nome}: ${Base.rendimento(p, k) >= 1.5 ? 'rende muito' : Base.rendimento(p, k) <= 0.7 ? 'rende pouco' : 'normal'}`).join(' · ');
            const ganho = p.ovr - (p.ovr0 || p.ovr);
            return `<tr>
                <td>${UI.pos(p.pos)}</td>
                <td class="esq"><b>${p.bnd || ''} ${U.esc(p.nome)}</b>${p.promB != null ? ' <span class="tag-prom" title="Você prometeu subir até o fim da temporada">🤝</span>' : ''}</td>
                <td>${p.idade}</td>
                <td>${UI.ovr(p.ovr)}${ganho > 0 ? ` <small class="verde">+${ganho}</small>` : ''}</td>
                <td class="pot-faixa"><b>${p.pmin}</b>–<b class="teto">${p.pmax}</b></td>
                <td><select class="sel sel-mini" data-mudar="baseTreino" data-pid="${p.id}">${opcoesTreino(p.tb)}</select></td>
                <td title="${U.esc(sabidos)}">${conhecido ? Base.rotuloRend(Base.rendimento(p, p.tb)) : `<span class="rend cinza">❓ em ${Math.max(1, 3 - (p.st || 0))} sem.</span>`}</td>
                <td class="nowrap"><button class="btn btn-pequeno btn-primario" data-acao="baseSubir" data-pid="${p.id}" title="Subir para o profissional">⬆️</button>
                    <button class="btn btn-pequeno btn-fantasma" data-acao="baseDispensar" data-pid="${p.id}" title="Liberar">✖</button></td>
            </tr>`;
        };
        const relat = c.relat.map((r, ri) => {
            const P = PAISES_OLH[r.pais];
            return `<div class="relatorio"><div class="cartao-topo"><h4>${r.obnd} ${U.esc(r.olheiro)} em ${P.bnd} ${P.nome} · ${GRUPOS_OLH[r.grupo].icone} ${GRUPOS_OLH[r.grupo].nome}</h4>
                <button class="btn btn-pequeno btn-fantasma" data-acao="baseDescartar" data-r="${ri}">Dispensar o resto</button></div>
                <div class="grade-prosp">${r.cands.map((x, k) => Base.cardProspecto(x, x.st === 'ok' ? '<b class="verde">✅ Na base</b>' : x.st === 'nao' ? '<span class="cinza">Dispensado</span>'
                : `<div class="linha-botoes"><button class="btn btn-pequeno btn-primario" data-acao="baseAssinar" data-r="${ri}" data-k="${k}">✍️ Levar para a base</button><button class="btn btn-pequeno btn-fantasma" data-acao="baseRecusar" data-r="${ri}" data-k="${k}">✖</button></div>`)).join('')}</div></div>`;
        }).join('');
        const cardOlh = (o, contratado) => {
            const res = Base.resultado(o);
            const m = o.missao;
            return `<div class="olheiro ${o.real ? 'olheiro-real' : ''}">
                <div class="olh-topo"><span class="olh-band">${o.bnd}</span><span><b>${U.esc(o.nome)}</b>${o.real ? ' <small class="tag-real">lenda</small>' : ''}<br><small class="cinza">🌍 ${U.esc(o.esp)}</small></span></div>
                <div class="ficha">
                    <div><span>Competência</span><b>${Base.estrelasHtml(o.est)}</b></div>
                    <div><span>Resultado das buscas</span><b>${res == null ? '<span class="cinza">sem missões</span>' : Base.estrelasHtml(res)}</b></div>
                    ${contratado ? `<div><span>Missões</span><b>${o.mis} (${o.ach} garotos)</b></div><div><span>Joias · na base</span><b>${o.joias} 💎 · ${o.assin} ✍️</b></div>` : ''}
                    <div><span>Salário</span><b>${U.dinheiro(o.sal)}/sem.</b></div>
                </div>
                ${contratado
                    ? (m ? `<p class="destaque-bom">🛫 Em ${PAISES_OLH[m.pais].bnd} ${PAISES_OLH[m.pais].nome} atrás de ${GRUPOS_OLH[m.grupo].nome.toLowerCase()} · volta em ${m.falta} sem.</p>`
                        : `<div class="linha-botoes"><button class="btn btn-primario btn-pequeno" data-acao="olhMissao" data-oid="${o.id}">🔭 Enviar em missão</button><button class="btn btn-fantasma btn-pequeno" data-acao="olhDemitir" data-oid="${o.id}">Demitir</button></div>`)
                    : `<button class="btn btn-pequeno ${t.saldo >= o.sal * 8 && c.olheiros.length < MAX_OLHEIROS ? 'btn-primario' : ''}" data-acao="olhContratar" data-oid="${o.id}" ${c.olheiros.length >= MAX_OLHEIROS ? 'disabled' : ''}>Contratar · luvas ${U.dinheiro(o.sal * 8)}</button>`}
            </div>`;
        };
        const ranking = c.olheiros.concat(c.olhHist).filter(o => o.ach).sort((a, b) => Base.resultado(b) - Base.resultado(a));
        return `
        <div class="cartao">
            <div class="cartao-topo"><h3>🌱 Categoria de base do ${U.esc(t.nome)}</h3><span>Estrutura da base: ${'⭐'.repeat(nb)}</span></div>
            <div class="base-resumo">
                <div><span>Garotos</span><b>${kids.length}/${MAX_BASE}</b></div>
                <div><span>Custo da base + olheiros</span><b>${U.dinheiro(Base.custoSemanal(s, t))}/sem.</b></div>
                <div><span>Caixa do clube</span><b class="${t.saldo < 0 ? 'vermelho' : 'verde'}">${U.dinheiro(t.saldo)}</b></div>
                <label><span>Treino de todos</span><select class="sel" data-mudar="baseTreinoTodos"><option value="">— escolher —</option>${opcoesTreino('')}</select></label>
            </div>
            <p class="cinza pequeno">Cada garoto rende mais em um tipo de treino (e menos em outro). Depois de 3 semanas num treino você descobre como ele está rendendo. O <b>potencial</b> mostra o mínimo e o <b>teto</b> (até 99); a faixa fica mais precisa com o tempo. Com 17 anos ou mais, quem fica muito tempo na base pode pedir para subir — ou ir embora.</p>
            <div class="rolavel"><table class="tabela tabela-elenco tabela-base"><thead><tr><th>Pos</th><th class="esq">Garoto</th><th>Idade</th><th>OVR</th><th>Potencial</th><th>Treino</th><th>Rendimento</th><th></th></tr></thead>
            <tbody>${kids.map(linha).join('') || '<tr><td colspan="8" class="cinza">Nenhum garoto na base.</td></tr>'}</tbody></table></div>
        </div>
        ${relat ? `<div class="cartao"><h3>📋 Relatórios dos olheiros</h3>${relat}</div>` : ''}
        <div class="cartao">
            <div class="cartao-topo"><h3>🔭 Seus olheiros (${c.olheiros.length}/${MAX_OLHEIROS})</h3></div>
            ${c.olheiros.length ? `<div class="grade-olh">${c.olheiros.map(o => cardOlh(o, true)).join('')}</div>` : '<p class="cinza">Você ainda não tem olheiros. Contrate até 3 e mande cada um procurar garotos pelo mundo.</p>'}
            <h4>Disponíveis para contratar</h4>
            <div class="grade-olh">${c.olhMerc.lista.map(o => cardOlh(o, false)).join('')}</div>
            <p class="cinza pequeno">A lista muda a cada 6 semanas. Olheiros com mais estrelas acham garotos melhores, voltam mais rápido e dão uma faixa de potencial mais precisa.</p>
            ${ranking.length ? `<h4>🏅 Ranking de olheiros</h4><table class="tabela"><thead><tr><th class="esq">Olheiro</th><th>Competência</th><th>Resultado</th><th>Missões</th><th>💎</th></tr></thead><tbody>
                ${ranking.map(o => `<tr><td class="esq">${o.bnd} ${U.esc(o.nome)}${c.olheiros.includes(o) ? '' : ' <small class="cinza">(ex)</small>'}</td><td>${Base.estrelasHtml(o.est)}</td><td>${Base.estrelasHtml(Base.resultado(o))}</td><td>${o.mis}</td><td>${o.joias}</td></tr>`).join('')}</tbody></table>` : ''}
        </div>`;
    },
};

Object.assign(ACOES, {
    baseTreino(d, el) {
        const p = Jogo.s.jog[+d.pid];
        if (!p || p.base == null) return;
        p.tb = el.value;
        p.st = 0;
        UI.toast(`${TREINOS_BASE[p.tb].icone} ${p.nome}: treino ${TREINOS_BASE[p.tb].nome}`);
        Jogo.atualizar();
    },
    baseTreinoTodos(d, el) {
        const k = el.value;
        if (!k) return;
        const s = Jogo.s, t = Tecnico.time(s);
        for (const p of Base.garotos(s, t)) {
            if (k === 'goleiro' && p.pos !== 'GOL') continue;
            if (p.tb !== k) { p.tb = k; p.st = 0; }
        }
        UI.toast(`${TREINOS_BASE[k].icone} Base inteira no treino ${TREINOS_BASE[k].nome}${k === 'goleiro' ? ' (só goleiros)' : ''}`);
        Jogo.atualizar();
    },
    async baseSubir(d) {
        const s = Jogo.s, t = Tecnico.time(s), p = s.jog[+d.pid];
        if (!p || p.base !== t.id) return;
        if (!(await UI.confirmar(`Subir <b>${U.esc(p.nome)}</b> (${p.pos}, ${p.idade} anos, OVR ${p.ovr}) para o elenco profissional?`, '⬆️ Subir'))) return;
        Base.promover(s, p, t);
        Jogo.atualizar();
    },
    async baseDispensar(d) {
        const s = Jogo.s, t = Tecnico.time(s), p = s.jog[+d.pid];
        if (!p || p.base !== t.id) return;
        if (!(await UI.confirmar(`Liberar <b>${U.esc(p.nome)}</b> da base? Ele fica livre para assinar com outro clube.`, 'Liberar'))) return;
        Base.liberar(s, p, t, 'foi liberado');
        Jogo.atualizar();
    },
    baseAssinar(d) {
        Base.assinar(Jogo.s, +d.r, +d.k);
        Jogo.atualizar();
    },
    baseRecusar(d) {
        const r = Jogo.s.car.relat[+d.r];
        if (r && r.cands[+d.k] && !r.cands[+d.k].st) r.cands[+d.k].st = 'nao';
        Base.limparRelatorios(Jogo.s);
        Jogo.atualizar();
    },
    baseDescartar(d) {
        const r = Jogo.s.car.relat[+d.r];
        if (r) for (const x of r.cands) if (!x.st) x.st = 'nao';
        Base.limparRelatorios(Jogo.s);
        Jogo.atualizar();
    },
    async olhContratar(d) {
        const s = Jogo.s, t = Tecnico.time(s), c = Base.estado(s);
        const i = c.olhMerc.lista.findIndex(o => o.id === +d.oid);
        if (i < 0) return;
        const o = c.olhMerc.lista[i];
        if (c.olheiros.length >= MAX_OLHEIROS) return UI.toast(`Você já tem ${MAX_OLHEIROS} olheiros. Demita um para contratar outro.`, 'erro');
        const luvas = o.sal * 8;
        if (t.saldo < luvas) return UI.toast('💸 O clube não tem caixa para as luvas.', 'erro');
        if (!(await UI.confirmar(`Contratar <b>${o.bnd} ${U.esc(o.nome)}</b> (${U.estrelas(o.est)})?<br>Luvas: <b>${U.dinheiro(luvas)}</b> · salário <b>${U.dinheiro(o.sal)}/semana</b>.`, '✍️ Contratar'))) return;
        t.saldo -= luvas;
        c.olhMerc.lista.splice(i, 1);
        c.olheiros.push(o);
        if (o.est >= 5) Conquistas.contar(s, 'olheiro5');
        Vida.log(s, `🔭 Você contratou o olheiro ${o.nome} (${o.est} estrelas).`, 'bom');
        UI.toast(`🔭 ${o.nome} contratado! Mande ele em uma missão.`);
        Jogo.atualizar();
    },
    async olhDemitir(d) {
        const s = Jogo.s, t = Tecnico.time(s), c = Base.estado(s);
        const o = c.olheiros.find(x => x.id === +d.oid);
        if (!o) return;
        const multa = o.sal * 4;
        if (!(await UI.confirmar(`Demitir <b>${U.esc(o.nome)}</b>? A multa é de ${U.dinheiro(multa)}.`, 'Demitir'))) return;
        t.saldo -= multa;
        c.olheiros = c.olheiros.filter(x => x !== o);
        if (o.ach) { c.olhHist.unshift(o); c.olhHist.length = Math.min(c.olhHist.length, 10); }
        Vida.log(s, `👋 Você demitiu o olheiro ${o.nome}.`, '');
        Jogo.atualizar();
    },
    async olhMissao(d) {
        const s = Jogo.s, o = Base.estado(s).olheiros.find(x => x.id === +d.oid);
        if (!o || o.missao) return;
        await Base.enviarMissao(s, o);
        Jogo.atualizar();
    },
    // troca a lista de países quando muda o continente (dentro do modal)
    olhRegiao(d, el) {
        const sel = el.closest('.modal') && el.closest('.modal').querySelector('#mPais');
        if (sel && Base._opcoesPais) sel.innerHTML = Base._opcoesPais(el.value);
    },
});
