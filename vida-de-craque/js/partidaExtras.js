'use strict';
// =====================================================================
//  PARTIDA AO VIVO: EXTRAS
//  - Modo destaques: o relógio corre e só segura nos lances importantes
//  - Instruções do técnico durante o jogo: marcar o craque deles, jogar
//    pelas pontas, segurar o resultado e pressão total (a IA também usa)
//  - Clima e gramado, VAR (gol anulado / pênalti depois da revisão),
//    lances polêmicos e "reclamar com o árbitro" (o técnico pode ser
//    expulso: multa e suspensão no jogo seguinte)
//  - Golaços com narração e comemoração especiais. Todos os golaços do
//    mundo ficam em s.golacos = [{ ano, sem, pid, nome, tid, txt }]
//    (os ~300 mais recentes) — o prêmio Puskás usa essa lista.
//  O estado de cada partida fica em m.px (criado em PartidaExtras.criar).
// =====================================================================

const MAX_GOLACOS = 300;
const PX_VAR_GOL = 0.06;      // chance de um gol ir para a revisão do VAR
const PX_VAR_ANULA = 0.45;    // gols revisados que acabam anulados
const PX_VAR_PEN = 0.0009;    // por minuto: o VAR chama o árbitro e marca pênalti

// Clima e gramado no dia do jogo (sorteado quando a partida é criada)
const CLIMAS = {
    sol: { nome: 'Sol e gramado perfeito', curto: 'Tempo bom', icone: '☀️', desc: 'Condições ideais para o futebol.' },
    calor: { nome: 'Calor forte', curto: 'Calor', icone: '🥵', desc: 'O ritmo cai no 2º tempo e o elenco sai mais cansado.' },
    chuva: { nome: 'Chuva forte', curto: 'Chuva', icone: '🌧️', desc: 'Bola molhada: os goleiros falham mais e sai mais gol de erro.' },
    neblina: { nome: 'Neblina', curto: 'Neblina', icone: '🌫️', desc: 'Pouca visibilidade: menos finalizações e quase nenhum chute de longe.' },
    frio: { nome: 'Frio intenso', curto: 'Frio', icone: '🥶', desc: 'Músculos travados: mais risco de lesão.' },
    gramado: { nome: 'Gramado ruim', curto: 'Gramado ruim', icone: '🟫', desc: 'A bola quica: a diferença técnica entre os times diminui.' },
};

const FRASES_CLIMA = {
    sol: {
        intro: ['☀️ Tarde bonita e gramado impecável. Clima perfeito para o futebol!', '☀️ Céu limpo, estádio cheio e gramado tinindo. Bola pra frente!'],
        jogo: [],
    },
    calor: {
        intro: ['🥵 Calor de rachar! Os termômetros marcam mais de 35 graus na beira do campo.', '🥵 Sol a pino e um calor sufocante. Quem tiver mais fôlego leva.'],
        jogo: ['🥵 O calor castiga: os jogadores andam em campo.', '🥵 O ritmo caiu muito, o calor está cobrando a conta.'],
    },
    chuva: {
        intro: ['🌧️ Chove forte! O gramado está encharcado e a bola não rola direito.', '🌧️ Temporal sobre o estádio. Vai ser jogo de bola molhada e escorregão.'],
        jogo: ['🌧️ A chuva aperta e a bola para numa poça no meio do campo!', '🌧️ Escorregão na lateral... o gramado está um sabão.'],
    },
    neblina: {
        intro: ['🌫️ Neblina densa! Da arquibancada mal dá para ver o outro gol.', '🌫️ Uma neblina forte cobre o estádio. O árbitro pensa em parar, mas o jogo segue.'],
        jogo: ['🌫️ A neblina engole o campo: a torcida só ouve o barulho da bola.', '🌫️ Ninguém arrisca de longe com essa neblina.'],
    },
    frio: {
        intro: ['🥶 Frio intenso, perto de zero grau. Tem jogador de luva e meia-calça.', '🥶 Noite gelada! A respiração dos jogadores vira fumaça.'],
        jogo: ['🥶 O frio trava a musculatura: o fisioterapeuta não para no banco.', '🥶 Os reservas se aquecem enrolados em cobertores.'],
    },
    gramado: {
        intro: ['🟫 O gramado está em péssimo estado: buracos, tufos e muita areia.', '🟫 Gramado esburacado. A bola vai quicar de jeito estranho hoje.'],
        jogo: ['🟫 A bola quica num buraco e engana o marcador!', '🟫 Mais um passe que morre no gramado ruim.'],
    },
};

// Instruções durante o jogo (técnico). "plano" = só um por vez (marcar soma com qualquer plano).
// Diferente dos estilos (ESTILOS), que valem o jogo todo: são ajustes de momento, com custo.
const INSTRUCOES = {
    marcar: { nome: 'Marcar o craque deles', curto: 'Craque', icone: '🎯', desc: 'Um volante cola no melhor jogador do adversário: ele finaliza bem menos e o ataque deles perde força. O marcador pode levar cartão.' },
    pontas: { nome: 'Jogar pelas pontas', curto: 'Pontas', icone: '↔️', plano: true, desc: 'Mais cruzamentos e gols de cabeça (rende mais com pontas e laterais bons), mas o time fica um pouco exposto ao contra-ataque.' },
    segurar: { nome: 'Segurar o resultado', curto: 'Segurar', icone: '🧱', plano: true, desc: 'Time recuado e muita cera: bem menos chances para os dois lados. Pode sair amarelo por retardar o jogo.' },
    pressao: { nome: 'Pressão total', curto: 'Pressão', icone: '⚡', plano: true, desc: 'Pressão alta na saída de bola: muito mais força no ataque, mas o fôlego acaba em uns 20 minutos (depois o time rende menos) e o elenco sai cansado. Ideal para a reta final.' },
};

// Golaços: peso = chance por posição de quem marca
const GOLACOS = {
    bicicleta: {
        nome: 'Bicicleta', icone: '🚲', chamada: 'DE BICICLETA!', peso: { ATA: 3, PON: 2, MEI: 1, VOL: 0.4, LAT: 0.3, ZAG: 0.6 },
        txt: ['acerta uma BICICLETA espetacular! O estádio vem abaixo!', 'de BICICLETA! Que plasticidade, que pintura!', 'se joga no ar e manda uma bicicleta no ângulo! INACREDITÁVEL!'],
    },
    voleio: {
        nome: 'Voleio', icone: '🦶', chamada: 'DE VOLEIO!', peso: { ATA: 3, PON: 2, MEI: 2, VOL: 1.2, LAT: 1, ZAG: 0.6 },
        txt: ['pega de VOLEIO, sem deixar a bola cair, e explode a rede!', 'emenda um voleio de primeira, o goleiro nem viu a cor da bola!', 'acerta um voleio cruzado perfeito, no ângulo!'],
    },
    fora: {
        nome: 'Chute de fora da área', icone: '🚀', chamada: 'DE FORA DA ÁREA!', peso: { MEI: 3, VOL: 3, PON: 2, ATA: 1.2, LAT: 1.5, ZAG: 0.6 },
        txt: ['solta uma BOMBA de fora da área! Golaço!', 'arrisca de muito longe... E ENTRA! QUE GOLAÇO!', 'acerta um foguete de 30 metros no ângulo!'],
    },
    falta: {
        nome: 'Falta no ângulo', icone: '🌀', chamada: 'NO ÂNGULO!', semAssist: true, peso: { MEI: 3, PON: 1.5, ATA: 1, VOL: 1.2, LAT: 1, ZAG: 0.4 },
        txt: ['cobra a falta com efeito e coloca NO ÂNGULO! Onde a coruja dorme!', 'bate a falta por cima da barreira... na gaveta! Golaço!', 'cobra a falta com perfeição, a bola morre no ângulo!'],
    },
    chapeu: {
        nome: 'Chapéu no goleiro', icone: '🎩', chamada: 'DE CHAPÉU!', peso: { ATA: 3, PON: 2, MEI: 1.5, VOL: 0.3, LAT: 0.3, ZAG: 0.1 },
        txt: ['dá um CHAPÉU no goleiro e só empurra! Que categoria!', 'encobre o goleiro com uma cavadinha de craque!', 'aplica um lençol no goleiro e marca um golaço!'],
    },
    individual: {
        nome: 'Jogada individual', icone: '🕺', chamada: 'QUE JOGADA!', semAssist: true, peso: { PON: 3, ATA: 2, MEI: 2, LAT: 0.8, VOL: 0.5, ZAG: 0.2 },
        txt: ['arranca do meio-campo, dribla meio time e marca! GOLAÇO!', 'passa por três marcadores e toca na saída do goleiro! Que jogada!', 'faz fila na defesa e finaliza com classe!'],
    },
    calcanhar: {
        nome: 'De calcanhar', icone: '👠', chamada: 'DE CALCANHAR!', peso: { ATA: 1.2, PON: 0.7, MEI: 0.5 },
        txt: ['marca DE CALCANHAR! Ousadia e alegria!', 'desvia de calcanhar e engana todo mundo! Que gol!'],
    },
    olimpico: {
        nome: 'Gol olímpico', icone: '🌈', chamada: 'GOL OLÍMPICO!', semAssist: true, peso: { MEI: 0.15, PON: 0.15, LAT: 0.05 },
        txt: ['cobra o escanteio direto... GOL OLÍMPICO! Que raridade!'],
    },
};

// Jogada escolhida no lance do jogador -> [opção, golaço, chance de golaço, narração comum, narração do golaço]
const LANCE_JEITOS = [
    [/cobertura/i, 'chapeu', 0.35, 'toca por cobertura, a bola quica e entra!'],
    [/no ângulo/i, 'falta', 0.6, 'cobra a falta no canto do goleiro!'],
    [/fora da área/i, 'fora', 0.55, 'arrisca de fora da área e a bola entra rasteira!'],
    [/olímpico/i, 'olimpico', 1],
    [/Driblar o goleiro/i, 'individual', 0.25, 'dribla o goleiro e entra com bola e tudo!'],
    [/Driblar o zagueiro|Ir sozinho|Conduzir|Cortar para dentro/i, 'individual', 0.28, 'deixa o marcador para trás e bate no canto!'],
    [/peito/i, 'voleio', 0.35, 'mata no peito e bate firme, sem chance!'],
    [/Girar/i, 'individual', 0.25, 'gira em cima do zagueiro e bate no canto!', 'gira em cima do zagueiro e acerta o ângulo! QUE GOLAÇO!'],
    [/Bater de primeira|Encher o pé|Ajeitar e chutar/i, 'fora', 0.25, 'bate firme e a bola entra no canto!'],
    [/Chutar cruzado|Avançar e chutar/i, 'fora', 0.18, 'chuta cruzado e a bola morre no canto!'],
    [/barreira/i, null, 0, 'bate forte por baixo da barreira e engana o goleiro!'],
    [/cavadinha/i, null, 0, 'cobra de CAVADINHA! Que frieza!'],
    [/Bater no canto/i, null, 0, 'cobra o pênalti no canto, o goleiro foi do outro lado!'],
    [/abece/i, null, 0, 'cabeceia firme, no contrapé do goleiro!'],
    [/Empurrar de primeira/i, null, 0, 'empurra de primeira para o fundo da rede!'],
    [/Dominar e escolher/i, null, 0, 'domina com calma e escolhe o canto!'],
    [/Chutar rasteiro/i, null, 0, 'bate rasteiro no canto, sem chance para o goleiro!'],
    [/Chutar colocado|Bater colocado/i, null, 0, 'bate colocado, no cantinho!'],
];
// gol do companheiro depois do passe do jogador
const LANCE_ASSIST = [
    [/Cruzar|cruzar|Cobrar fechado|Cobrar aberto|Escorar/, 'sobe mais que a zaga e cabeceia para o gol depois do cruzamento!'],
    [/calcanhar/i, 'recebe o toque de calcanhar e bate na saída do goleiro!'],
    [/profundidade|corrida|Enfiar|por cima da zaga|Devolver/i, 'recebe o passe açucarado e toca na saída do goleiro!'],
    [/centroavante|no meio/i, 'só empurra para o gol vazio depois do passe na medida!'],
];

const PartidaExtras = {
    // -----------------------------------------------------------------
    //  Criação da partida
    // -----------------------------------------------------------------
    criar(m) {
        const s = m.s;
        // o clima fica guardado no jogo: refazer a tática antes do jogo não muda o tempo
        if (!m.jogo.clima || !CLIMAS[m.jogo.clima]) m.jogo.clima = PartidaExtras.sortearClima(s, m);
        const px = m.px = {
            clima: m.jogo.clima, ver: m.controle >= 0 || m.usuario != null,
            instr: [null, null], marca: [null, null], gas: [100, 100], minPressao: [0, 0], pontas: [0, 0],
            raca: [0, 0], tecExpulso: [false, false], tecAmarelo: [false, false], tecSusp: false, reclamacoes: 0,
            instrPerdendo: [false, false], revisar: [], penalti: null, cobranca: false,
            golacos: [], decisivos: [], vars: { anulados: 0, confirmados: 0, penaltis: 0 }, multa: 0,
            // suspensão do técnico: a do clube (s.car.suspTec) não vale na seleção (s.car.suspTecSel) e vice-versa
            chaveSusp: m.jogo.tipo === 'selecao' ? 'suspTecSel' : 'suspTec',
        };
        if (px.ver) Partida.evento(m, { tipo: 'clima', txt: U.escolha(FRASES_CLIMA[px.clima].intro) });
        // técnico suspenso (foi expulso no jogo anterior): vê da tribuna
        if (m.controle >= 0 && s.modo === 'tecnico' && s.car && s.car[px.chaveSusp] > 0) {
            px.tecSusp = true;
            px.tecExpulso[m.controle] = true;
            Partida.evento(m, { tipo: 'tecnico', lado: m.controle, txt: '🟥 Você cumpre suspensão e vê o jogo da tribuna. O auxiliar comanda o time (sem substituições nem instruções).' });
        }
    },

    sortearClima(s, m) {
        const t = s.times[m.h];
        const pais = (t && t.pais) || 'BRA';
        const w = s.semana;
        const europa = ['ENG', 'ESP', 'ITA', 'GER', 'FRA', 'NED'].indexOf(pais) >= 0;
        const sul = ['BRA', 'ARG', 'URU', 'PAR', 'CHI', 'AUS', 'RSA', 'NZL'].indexOf(pais) >= 0;
        const liga = t && t.liga ? Mundo.liga(s, t.liga) : null;
        let calor, frio;
        if (sul) {
            const verao = w >= 15 && w <= 30;          // dezembro a fevereiro
            const inverno = w <= 5 || w >= 38;         // junho a agosto
            calor = verao ? 15 : 6;
            frio = inverno ? (pais === 'BRA' ? 3 : 7) : 1;
        } else {
            const inverno = w >= 13 && w <= 30;
            const verao = w <= 5 || w >= 38;
            calor = inverno ? 0 : verao ? 9 : 3;
            frio = inverno ? (europa ? 16 : 4) : 1;
        }
        const pesos = {
            sol: 58,
            chuva: ['ENG', 'NED'].indexOf(pais) >= 0 ? 20 : 13,
            calor, frio,
            neblina: 4,
            gramado: liga ? (liga.nivel >= 3 ? 11 : liga.nivel === 2 ? 6 : 2) : 3,
        };
        return U.pesado(Object.keys(pesos), k => pesos[k]);
    },

    // -----------------------------------------------------------------
    //  Força em campo (chamado no fim de Partida.recalcular)
    // -----------------------------------------------------------------
    ajustar(m) {
        const px = m.px;
        if (!px || !m.R) return;
        const R = m.R;
        if (px.clima === 'chuva') { R[0].gol -= 3; R[1].gol -= 3; }
        else if (px.clima === 'neblina') { R[0].def += 2.5; R[1].def += 2.5; }
        else if (px.clima === 'calor' && m.min >= 60) {
            for (const x of R) { x.ata -= 1; x.def -= 0.5; }
        } else if (px.clima === 'gramado') {
            const M = (R[0].ata + R[1].ata + R[0].def + R[1].def) / 4;
            for (const x of R) { x.ata -= (x.ata - M) * 0.18; x.def -= (x.def - M) * 0.18; }
        }
        for (let l = 0; l < 2; l++) {
            const b = PartidaExtras.bonusInstr(m, l);
            R[l].ata += b.ata; R[l].def += b.def; R[l].meio += b.meio;
            R[1 - l].ata += b.rivalAta; R[1 - l].def += b.rivalDef;
        }
    },

    fatorPressao: gas => (gas >= 40 ? 1 : gas / 40 * 1.8 - 0.8),

    bonusInstr(m, l) {
        const px = m.px;
        const b = { ata: 0, def: 0, meio: 0, rivalAta: 0, rivalDef: 0 };
        if (px.tecExpulso[l]) { b.ata -= 0.4; b.def -= 0.4; }
        if (px.raca[l] && m.min < px.raca[l]) { b.ata += 1.5; b.def += 1; }   // raça depois da reclamação
        const I = px.instr[l];
        if (!I) return b;
        if (I.marcar && px.marca[l]) { b.rivalAta -= px.marca[l].impacto; b.ata -= 0.4; }
        if (I.plano === 'pontas') { b.ata += px.pontas[l]; b.def -= 1.2; }   // laterais lá na frente: contra-ataque nas costas
        else if (I.plano === 'segurar') { b.ata -= 3; b.def += 11; b.rivalDef += 4; }   // a cera tira chances dos dois lados
        else if (I.plano === 'pressao') {
            const f = PartidaExtras.fatorPressao(px.gas[l]);
            b.ata += 5 * f; b.def += 0.5 * f; b.meio += 3 * f;
            b.rivalAta += 1;   // time adiantado: sobra espaço para o contra-ataque
        }
        return b;
    },

    // o craque marcado individualmente finaliza menos; jogando pelas pontas, mais gol de cabeça
    pesoAutor(m, lado, p) {
        const px = m.px;
        if (!px) return 1;
        const I2 = px.instr[1 - lado], mk = px.marca[1 - lado];
        if (I2 && I2.marcar && mk && mk.alvo === p.id) return 0.45;
        const I = px.instr[lado];
        if (I && I.plano === 'pontas') {
            const sl = Partida.slotDe(m, lado, p.id);
            if (sl === 'ATA' || sl === 'ZAG') return 1.2;
        }
        return 1;
    },

    // lances do jogador (modo jogador): marcação individual em cima dele e o clima mudam a chance
    // (chamado em Partida.multHab, então a porcentagem mostrada no botão já vem certa)
    multLance(m, lance, o, p) {
        const px = m.px;
        if (!px) return 1;
        let k = 1;
        const lu = Partida.ladoDoUsuario(m);
        const mk = lu >= 0 ? px.marca[1 - lu] : null;
        if (mk && mk.alvo === m.usuario && !lance.defesa) k *= 0.9;
        const c = px.clima;
        if (o.estilo && (c === 'chuva' || c === 'gramado')) k *= 0.9;
        if (c === 'chuva' && lance.defesa && p.pos === 'GOL') k *= 0.94;
        if (c === 'neblina' && /fora da área|longo|Lançamento|Inverter/i.test(o.txt)) k *= 0.85;
        if (c === 'calor' && m.min >= 70 && !Partida.hab(m, 'motorzinho')) k *= 0.95;
        return k;
    },

    // aviso curto no lance: o que está pesando contra
    notaLance(m, lance) {
        const px = m.px;
        if (!px) return '';
        const avisos = [];
        const lu = Partida.ladoDoUsuario(m);
        const mk = lu >= 0 ? px.marca[1 - lu] : null;
        if (mk && mk.alvo === m.usuario && !lance.defesa) avisos.push(`🎯 ${U.esc(m.s.jog[mk.marcador].nome)} está te marcando individualmente`);
        const c = px.clima, p = m.s.jog[m.usuario];
        const temEstilo = lance.ops.some(o => o.estilo);
        if ((c === 'chuva' || c === 'gramado') && temEstilo) avisos.push(`${CLIMAS[c].icone} ${c === 'chuva' ? 'Chuva' : 'Gramado ruim'}: jogadas de efeito mais difíceis`);
        else if (c === 'chuva' && lance.defesa && p && p.pos === 'GOL') avisos.push('🌧️ Bola molhada: mais difícil de segurar');
        else if (c === 'neblina' && lance.ops.some(o => /fora da área|longo|Lançamento|Inverter/i.test(o.txt))) avisos.push('🌫️ Neblina: bola longa e chute de longe mais difíceis');
        if (c === 'calor' && m.min >= 70 && !Partida.hab(m, 'motorzinho')) avisos.push('🥵 Calor: o cansaço pesa na reta final');
        return avisos.length ? `<br><small class="px-nota-lance">${avisos.join(' · ')}</small>` : '';
    },

    // -----------------------------------------------------------------
    //  Um minuto de jogo (chamado no fim de Partida.passo)
    // -----------------------------------------------------------------
    passo(m, novos) {
        const px = m.px;
        if (!px) return [];
        const evs = [];
        // VAR: gols do minuto anterior que estavam sendo revisados
        if (px.revisar.length) {
            const lista = px.revisar;
            px.revisar = [];
            for (const ev of lista) PartidaExtras.revisarGol(m, ev, evs);
        }
        for (const ev of novos) {
            if (ev.tipo !== 'gol' || ev.semVar || ev.anulado || !U.chance(PX_VAR_GOL)) continue;
            ev.semVar = true;
            if (m.min >= 90) PartidaExtras.revisarGol(m, ev, evs);   // no último minuto revisa na hora
            else px.revisar.push(ev);
        }
        // pênalti marcado pelo VAR: a cobrança sai no minuto seguinte
        if (px.penalti && px.penalti.min < m.min) PartidaExtras.cobrarPenalti(m, evs);
        if (!px.penalti && ((m.min >= 4 && m.min <= 43) || (m.min >= 47 && m.min <= 86)) && U.chance(PX_VAR_PEN)) PartidaExtras.varPenalti(m, evs);
        // frio: músculos travados, mais lesões
        if (px.clima === 'frio') for (let l = 0; l < 2; l++) if (U.chance(0.0005)) PartidaExtras.lesaoFrio(m, l, evs);
        if (px.clima === 'calor' && m.min === 60) Partida.recalcular(m);
        if (!px.ver) return evs;

        // ---- daqui para baixo, só nas partidas do usuário ----
        for (const ev of novos) if (ev.tipo === 'vermelho' && /direto/.test(ev.txt) && U.chance(0.45)) ev.polemica = ev.lado;
        PartidaExtras.polemicas(m, evs);
        PartidaExtras.narrarClima(m, evs);
        for (let l = 0; l < 2; l++) {
            if (l !== m.controle) PartidaExtras.iaTecnico(m, l, evs);
            PartidaExtras.instrucoesMinuto(m, l, evs);
        }
        return evs;
    },

    revisarGol(m, ev, evs) {
        const px = m.px, s = m.s;
        if (ev.anulado || !m.st[ev.pid]) return;
        const autor = s.jog[ev.pid];
        const l = ev.lado;
        if (U.chance(PX_VAR_ANULA)) {
            m.gols[l] = Math.max(0, m.gols[l] - 1);
            m.st[ev.pid].g = Math.max(0, m.st[ev.pid].g - 1);
            if (ev.pid2 != null && m.st[ev.pid2]) m.st[ev.pid2].a = Math.max(0, m.st[ev.pid2].a - 1);
            if (ev.golaco) { m.bonus[ev.pid] = (m.bonus[ev.pid] || 0) - 0.3; PartidaExtras.desfazerGolaco(m, ev); }
            ev.anulado = true;
            ev.decisivo = null;
            ev.cls = 'ev-anulado';
            ev.txt = `❌ ${ev.txt} (ANULADO PELO VAR)`;
            px.vars.anulados++;
            const companheiros = Partida.emCampo(m, l);
            const quem = companheiros.length ? U.escolha(companheiros) : autor;
            const motivo = U.escolha([`impedimento milimétrico de ${quem.nome}`, `falta de ${quem.nome} no começo da jogada`, `toque de mão de ${quem.nome}`, 'a bola ter saído antes do cruzamento']);
            evs.push(Partida.evento(m, { tipo: 'var', var: 'anulado', lado: l, polemica: l, pid: ev.pid, txt: `📺 VAR! O árbitro vai ao monitor rever o gol de ${autor.nome}... GOL ANULADO por ${motivo}! ${Partida.placarTxt(m)}.` }));
        } else {
            px.vars.confirmados++;
            evs.push(Partida.evento(m, { tipo: 'var', var: 'confirmado', lado: l, pid: ev.pid, txt: `📺 O VAR checa o gol de ${autor.nome}... ✅ Gol confirmado! A festa continua.` }));
        }
    },

    varPenalti(m, evs) {
        const px = m.px;
        const l = U.chance(U.clamp(0.5 + (m.R[0].ata - m.R[1].ata) * 0.012, 0.25, 0.75)) ? 0 : 1;   // quem sofre o pênalti
        const defs = Partida.emCampo(m, 1 - l).filter(p => Partida.slotDe(m, 1 - l, p.id) !== 'GOL');
        const atac = Partida.sortearAutor(m, l);
        if (!defs.length || !atac) return;
        const def = U.escolha(defs);
        px.penalti = { lado: l, min: m.min };
        px.vars.penaltis++;
        const motivo = U.chance(0.5) ? `Toque de mão de ${def.nome} dentro da área.` : `${def.nome} acertou ${atac.nome} dentro da área.`;
        evs.push(Partida.evento(m, { tipo: 'var', var: 'penalti', lado: l, polemica: 1 - l, txt: `📺 VAR! O árbitro é chamado ao monitor... PÊNALTI para o ${Partida.nomeTime(m, l)}! ${motivo}` }));
    },

    // lance do usuário no pênalti (modo jogador): ele bate pelo time ou é o goleiro que vai defender
    lancePenaltiUsuario(m, l) {
        if (m.usuario == null || !m.s.jog[m.usuario] || !Partida.usuarioEmCampo(m)) return null;
        const lu = Partida.ladoDoUsuario(m);
        const slot = Partida.slotDe(m, lu, m.usuario);
        if (lu === l && (['ATA', 'PON', 'MEI'].indexOf(slot) >= 0 || Partida.hab(m, 'batedor'))) return LANCES.A.find(x => /Pênalti para o seu time/.test(x.txt)) || null;
        if (lu !== l && slot === 'GOL') return LANCES.G.find(x => x.penalti) || null;
        return null;
    },

    cobrarPenalti(m, evs) {
        const px = m.px, pen = px.penalti;
        px.penalti = null;
        const l = pen.lado;
        // o jogador decide no lance deste minuto (Partida.passo pausa em seguida)
        const lance = PartidaExtras.lancePenaltiUsuario(m, l);
        if (lance) {
            m.lanceForcado = lance;
            if (m.lancesMin.indexOf(m.min) < 0) m.lancesMin.push(m.min);
            return;
        }
        const ordem = { ATA: 6, MEI: 5, PON: 4, VOL: 2, LAT: 1, ZAG: 1, GOL: -50 };
        const cand = Partida.emCampo(m, l).filter(p => p.id !== m.usuario)
            .sort((a, b) => (b.ovr + ordem[Partida.slotDe(m, l, b.id)]) - (a.ovr + ordem[Partida.slotDe(m, l, a.id)]));
        const batedor = cand[0];
        if (!batedor) return;
        const gk = Partida.goleiro(m, 1 - l);
        const prob = U.clamp(0.78 - ((gk ? gk.ovr : 50) - 70) * 0.006 + (batedor.ovr - 75) * 0.003, 0.6, 0.9);
        if (U.chance(prob)) {
            px.cobranca = true;
            const gevs = Partida.gol(m, l, batedor, false);
            px.cobranca = false;
            for (const e of gevs) if (e.tipo === 'gol') e.semVar = true;
            evs.push(...gevs);
        } else {
            const g = gk ? gk.nome : 'O goleiro';
            evs.push(Partida.evento(m, { tipo: 'chance', lado: l, txt: U.escolha([`🧤 ${g} DEFENDE o pênalti de ${batedor.nome}!`, `😱 ${batedor.nome} manda o pênalti na trave!`, `😬 ${batedor.nome} isola a cobrança do pênalti!`]) }));
        }
    },

    lesaoFrio(m, l, evs) {
        const p = U.escolha(Partida.emCampo(m, l));
        if (!p || (p.id === m.usuario && Partida.hab(m, 'blindado') && U.chance(0.5))) return;
        m.st[p.id].les = true;
        evs.push(Partida.evento(m, { tipo: 'lesao', lado: l, pid: p.id, txt: `🥶 ${p.nome} sente a musculatura travar no frio e pede para sair.` }));
        const entra = Partida.melhorReserva(m, l, Partida.slotDe(m, l, p.id));
        const sub = entra && m.subs[l] < 5 ? Partida.substituir(m, l, p.id, entra.id, true) : null;
        if (sub) evs.push(sub);
        else {
            const i = m.esc[l].indexOf(p.id);
            if (i >= 0) m.esc[l][i] = null;
            m.st[p.id].saiu = m.min;
            Partida.recalcular(m);
        }
    },

    // lances polêmicos sem VAR (só nas partidas do usuário)
    polemicas(m, evs) {
        for (let l = 0; l < 2; l++) {
            if (U.chance(0.0005)) {
                const vits = Partida.emCampo(m, l).filter(p => ['ATA', 'PON', 'MEI'].indexOf(Partida.slotDe(m, l, p.id)) >= 0);
                if (!vits.length) continue;
                const v = U.escolha(vits);
                evs.push(Partida.evento(m, {
                    tipo: 'polemica', lado: l, polemica: l, pid: v.id,
                    txt: v.id === m.usuario ? '😤 Você é derrubado dentro da área... e o árbitro manda seguir! O VAR fica em silêncio.'
                        : `😤 ${v.nome} é derrubado na área e o árbitro manda o jogo seguir! O ${Partida.nomeTime(m, l)} inteiro reclama e o VAR não chama.`,
                }));
            } else if (U.chance(0.00025)) {
                const lista = Partida.emCampo(m, l);
                if (!lista.length) continue;
                const p = U.escolha(lista);
                evs.push(Partida.evento(m, { tipo: 'polemica', lado: l, polemica: l, pid: p.id, txt: `😤 Dividida normal de ${p.nome}... e o árbitro mostra o cartão! Exagero!` }));
                evs.push(...Partida.cartao(m, l, p, false));
            }
        }
    },

    narrarClima(m, evs) {
        const c = m.px.clima;
        if (c === 'calor' && (m.min === 30 || m.min === 75)) {
            evs.push(Partida.evento(m, { tipo: 'clima', txt: '💧 Parada técnica para hidratação. Os jogadores correm para o banco atrás de água.' }));
        } else if (FRASES_CLIMA[c].jogo.length && U.chance(0.012)) {
            evs.push(Partida.evento(m, { tipo: 'clima', txt: U.escolha(FRASES_CLIMA[c].jogo) }));
        }
    },

    // -----------------------------------------------------------------
    //  Instruções do técnico
    // -----------------------------------------------------------------
    bloqueado(m) {
        return !!(m && m.px && m.controle >= 0 && m.px.tecExpulso[m.controle]);
    },

    bonusPontas(m, l) {
        const campo = m.esc[l].map((pid, i) => (pid != null ? { p: m.s.jog[pid], slot: m.slots[l][i] } : null)).filter(Boolean);
        const abertos = campo.filter(x => x.slot === 'PON' || x.slot === 'LAT');
        if (!abertos.length) return 0.3;
        const media = U.media(campo.filter(x => x.slot !== 'GOL'), x => x.p.ovr);
        return U.clamp(1 + (U.media(abertos, x => x.p.ovr) - media) * 0.18, 0.3, 2.4);
    },

    // o craque de um time (quem a marcação individual persegue): o melhor do meio para a frente
    craque(m, o) {
        const slot = p => Partida.slotDe(m, o, p.id);
        let rivais = Partida.emCampo(m, o).filter(p => ['GOL', 'ZAG'].indexOf(slot(p)) < 0);
        if (!rivais.length) rivais = Partida.emCampo(m, o).filter(p => slot(p) !== 'GOL');
        return rivais.sort((a, b) => (b.ovr + PESO_GOL[slot(b)] * 0.5) - (a.ovr + PESO_GOL[slot(a)] * 0.5))[0] || null;
    },

    definirMarcacao(m, l, auto, evs) {
        const o = 1 - l;
        const slot = (lado, p) => Partida.slotDe(m, lado, p.id);
        const alvo = PartidaExtras.craque(m, o);
        const meus = Partida.emCampo(m, l).filter(p => slot(l, p) !== 'GOL');
        if (!alvo || !meus.length) { m.px.marca[l] = null; return null; }
        const ordem = { VOL: 0, ZAG: 1, LAT: 2, MEI: 3, PON: 4, ATA: 5 };
        const marcador = meus.slice().sort((a, b) => (ordem[slot(l, a)] - ordem[slot(l, b)]) || (b.ovr - a.ovr))[0];
        const media = U.media(Partida.emCampo(m, o), p => p.ovr);
        const impacto = U.clamp(1.1 + (alvo.ovr - media) * 0.18, 1.1, 3);
        m.px.marca[l] = { alvo: alvo.id, marcador: marcador.id, impacto };
        Partida.recalcular(m);
        if (auto && evs) evs.push(Partida.evento(m, { tipo: 'instr', lado: l, txt: `🎯 Marcação individual: agora ${marcador.nome} cola em ${alvo.nome}.` }));
        return m.px.marca[l];
    },

    // liga/desliga uma instrução; devolve o evento da narração
    instruir(m, l, id) {
        const px = m.px, def = INSTRUCOES[id];
        if (!px || !def || l < 0 || px.tecExpulso[l] || m.terminou) return null;
        const I = px.instr[l] = px.instr[l] || { marcar: false, plano: null };
        const adv = Partida.nomeTime(m, 1 - l);
        let liga, txt;
        if (id === 'marcar') {
            I.marcar = !I.marcar;
            liga = I.marcar;
            if (liga) {
                const mk = PartidaExtras.definirMarcacao(m, l, false, null);
                if (!mk) { I.marcar = false; return null; }
                txt = `📣 Marcação individual! ${m.s.jog[mk.marcador].nome} vai colar em ${m.s.jog[mk.alvo].nome}, o craque do ${adv}.`;
            } else px.marca[l] = null;
        } else {
            liga = I.plano !== id;
            I.plano = liga ? id : null;
            if (liga && id === 'pontas') px.pontas[l] = PartidaExtras.bonusPontas(m, l);
            if (liga) {
                txt = {
                    pontas: '📣 Jogar pelas pontas! Laterais e pontas abertos, é cruzamento na área.',
                    segurar: '📣 Segurar o resultado! Time recuado, toque de lado e muita cera.',
                    pressao: `📣 Pressão total! Ninguém do ${adv} sai jogando.${px.gas[l] < 60 ? ' (o fôlego ainda não voltou todo)' : ''}`,
                }[id];
            }
        }
        if (!liga) txt = `📣 Instrução cancelada: ${def.nome.toLowerCase()}.`;
        if (liga && m.gols[l] < m.gols[1 - l]) px.instrPerdendo[l] = true;
        Partida.recalcular(m);
        return Partida.evento(m, { tipo: 'instr', lado: l, txt });
    },

    // instruções em andamento (dos dois lados): fôlego da pressão, marcação, cera e narração
    instrucoesMinuto(m, l, evs) {
        const px = m.px, s = m.s;
        const meu = l === m.controle;
        const nome = Partida.nomeTime(m, l);
        const add = txt => evs.push(Partida.evento(m, { tipo: 'instr', lado: l, txt }));
        const fala = meu ? 1 : 0.5;   // narra menos o que o time da IA faz
        const I = px.instr[l];
        // fôlego da pressão total
        const pressionando = !!(I && I.plano === 'pressao');
        const g0 = px.gas[l];
        if (pressionando) {
            px.gas[l] = Math.max(0, g0 - 3.5);
            px.minPressao[l]++;
            if (g0 > 40 && px.gas[l] <= 40) add(meu ? '😮‍💨 O time começa a sentir o desgaste da pressão...' : `😮‍💨 O ${nome} começa a cansar de tanto pressionar.`);
            if (meu && g0 > 0 && px.gas[l] <= 0) add('🥵 O time não aguenta mais pressionar! Melhor mudar a instrução.');
            if (px.gas[l] < 40 && (m.min % 2 === 0 || g0 >= 40)) Partida.recalcular(m);
        } else px.gas[l] = Math.min(100, g0 + 1.5);
        // a raça da reclamação acabou
        if (px.raca[l] && m.min >= px.raca[l]) { px.raca[l] = 0; Partida.recalcular(m); }
        // técnico expulso: o auxiliar faz as trocas
        if (meu && px.tecExpulso[l] && m.subsIA.indexOf(m.min) >= 0) {
            const ev = Partida.subIA(m, l);
            if (ev) evs.push(ev);
        }
        if (!I) return;
        if (I.marcar) {
            const mk = px.marca[l];
            if (!mk || m.esc[1 - l].indexOf(mk.alvo) < 0 || m.esc[l].indexOf(mk.marcador) < 0) PartidaExtras.definirMarcacao(m, l, true, evs);
            const mk2 = px.marca[l];
            if (mk2) {
                const marc = s.jog[mk2.marcador], alvo = s.jog[mk2.alvo];
                if (U.chance(0.003)) {
                    add(`🎯 ${marc.nome} chega atrasado em ${alvo.nome} na marcação individual...`);
                    evs.push(...Partida.cartao(m, l, marc, false));
                } else if (U.chance(0.025 * fala)) {
                    add(U.escolha(mk2.alvo === m.usuario
                        ? [`🎯 ${marc.nome} não te deixa respirar: marcação colada.`, `🎯 ${marc.nome} gruda em você de novo...`]
                        : [`🎯 ${alvo.nome} não consegue se livrar de ${marc.nome}.`, `🎯 ${alvo.nome} reclama da marcação colada de ${marc.nome}.`, `🎯 ${marc.nome} desarma ${alvo.nome} mais uma vez!`]));
                }
            }
        }
        if (I.plano === 'segurar') {
            if (U.chance(0.004)) {
                const gk = Partida.goleiro(m, l);
                const lista = Partida.emCampo(m, l);
                const p = gk && U.chance(0.6) ? gk : U.escolha(lista);
                if (p) {
                    add(`⏳ O árbitro perde a paciência com a cera de ${p.nome}...`);
                    evs.push(...Partida.cartao(m, l, p, false));
                }
            } else if (U.chance(0.03 * fala)) {
                const gk = Partida.goleiro(m, l);
                add(U.escolha([`⏳ ${gk ? gk.nome : 'O goleiro'} demora uma eternidade para repor a bola.`, `⏳ Toque de lado, toque para trás... a torcida vaia a cera do ${nome}.`, '⏳ Mais uma substituição lenta, sai caminhando devagar.']));
            }
        } else if (I.plano === 'pontas' && U.chance(0.03 * fala)) {
            const abertos = m.esc[l].map((pid, i) => (pid != null && (m.slots[l][i] === 'PON' || m.slots[l][i] === 'LAT') ? s.jog[pid] : null)).filter(Boolean);
            if (abertos.length) add(`↔️ ${U.escolha(abertos).nome} vai até a linha de fundo e cruza na área!`);
        } else if (pressionando && U.chance(0.03 * fala)) {
            add(`⚡ O ${nome} sufoca a saída de bola do ${Partida.nomeTime(m, 1 - l)}!`);
        } else if (pressionando && U.chance(0.003)) {
            const p = U.escolha(Partida.emCampo(m, l).filter(x => Partida.slotDe(m, l, x.id) !== 'GOL'));
            if (p) {
                add(`⚡ Na pressão, ${p.nome} chega atrasado e faz falta.`);
                evs.push(...Partida.cartao(m, l, p, false));
            }
        }
    },

    // técnicos da IA (só nas partidas do usuário): usam as mesmas instruções e reagem ao placar
    iaTecnico(m, l, evs) {
        const px = m.px;
        if (px.tecExpulso[l]) return;
        const I = px.instr[l] = px.instr[l] || { marcar: false, plano: null };
        const nome = Partida.nomeTime(m, l);
        const add = txt => evs.push(Partida.evento(m, { tipo: 'instr', lado: l, txt }));
        // no começo: às vezes manda marcar o craque do outro time (pode ser você!)
        if (m.min === 1 && !I.marcar && U.chance(0.2)) {
            const o = 1 - l;
            const melhor = PartidaExtras.craque(m, o);
            if (melhor && melhor.ovr >= U.media(Partida.emCampo(m, o), p => p.ovr) + 3.5) {
                I.marcar = true;
                const mk = PartidaExtras.definirMarcacao(m, l, false, null);
                if (!mk) I.marcar = false;
                else {
                    const marc = m.s.jog[mk.marcador].nome;
                    add(mk.alvo === m.usuario ? `🎯 O técnico do ${nome} colocou ${marc} para marcar VOCÊ individualmente! Vai ser jogo duro.`
                        : `🎯 O técnico do ${nome} escalou ${marc} para marcar ${m.s.jog[mk.alvo].nome} individualmente.`);
                }
            }
        }
        const dif = m.gols[l] - m.gols[1 - l];
        let novo = I.plano;
        if (I.plano === 'pressao' && (dif >= 0 || px.gas[l] < 15)) novo = null;            // empatou/virou ou cansou
        else if (I.plano === 'segurar' && dif <= 0) novo = dif < 0 && m.min <= 86 ? 'pressao' : null;
        else if (!I.plano && m.min >= 65 && m.min <= 86 && dif < 0 && dif >= -2 && U.chance(0.07)) novo = 'pressao';
        else if (!I.plano && m.min >= 78 && dif === 1 && U.chance(0.07)) novo = 'segurar';
        if (novo === I.plano) return;
        I.plano = novo;
        Partida.recalcular(m);
        if (novo === 'pressao') add(`📣 O técnico do ${nome} manda o time pra cima: pressão total!`);
        else if (novo === 'segurar') add(`🧱 O ${nome} se fecha atrás para segurar o resultado.`);
        else add(`📋 O ${nome} volta a jogar no ritmo normal.`);
    },

    // reclamar com o árbitro depois de um lance polêmico (técnico)
    reclamar(m, l) {
        const px = m.px;
        px.reclamacoes++;
        const r = Math.random();
        let tipo, txt;
        if (r < 0.42) {
            tipo = 'ok';
            txt = '🗣️ Você esbraveja na beira do campo! O árbitro só manda você voltar para a área técnica. O time e a torcida compram a briga!';
        } else if (r < 0.75 && !px.tecAmarelo[l]) {
            tipo = 'amarelo';
            txt = '🟨 Você reclama demais e o árbitro mostra o AMARELO para você! Mas o time sentiu a sua raça.';
        } else {
            tipo = 'vermelho';
            txt = px.tecAmarelo[l] && r < 0.75
                ? '🟨🟥 Segundo amarelo! Você está EXPULSO e vai para o vestiário. O auxiliar assume o time.'
                : '🟥 EXPULSO! O árbitro perde a paciência e manda você para o vestiário. O auxiliar assume o time.';
        }
        if (tipo === 'amarelo') px.tecAmarelo[l] = true;
        if (tipo === 'vermelho') { px.tecExpulso[l] = true; px.raca[l] = 0; }
        else px.raca[l] = m.min + 15;
        Partida.recalcular(m);
        const ev = Partida.evento(m, { tipo: 'tecnico', lado: l, cls: tipo === 'vermelho' ? 'ev-tec-expulso' : '', txt });
        return { tipo, ev };
    },

    // -----------------------------------------------------------------
    //  Gols: jeito, golaços e gols decisivos
    // -----------------------------------------------------------------
    chanceGolaco(m, autor) {
        // ~220 golaços por temporada no mundo todo (cabem em s.golacos)
        let p = 0.0028 + Math.max(0, autor.ovr - 64) * 0.001;
        if (m.px.ver) p *= 2;   // nas partidas do usuário a câmera está ligada
        return p;
    },

    jeitoGol(m, lado, autor) {
        const px = m.px;
        const res = { txt: '', golaco: null, semAssist: false };
        if (!px) { res.txt = U.escolha(JEITOS_GOL); return res; }
        if (px.cobranca) {
            res.txt = U.escolha(['cobra o pênalti marcado pelo VAR e não perdoa!', 'bate o pênalti com força, no alto!', 'desloca o goleiro na cobrança do pênalti!']);
            res.semAssist = true;
            return res;
        }
        const la = m.lanceAtual;
        if (la && autor.id === m.usuario && la.o.gol) {
            // gol do próprio jogador: o jeito segue a jogada escolhida
            for (const [re, tipo, chance, comum, txtGolaco] of LANCE_JEITOS) {
                if (!re.test(la.o.txt)) continue;
                if (tipo && U.chance(chance * U.clamp(0.7 + (autor.ovr - 60) * 0.015, 0.7, 1.3))) {
                    res.golaco = tipo;
                    res.txt = txtGolaco || U.escolha(GOLACOS[tipo].txt);
                    res.semAssist = true;
                    return res;
                }
                if (comum) { res.txt = comum; return res; }
                break;
            }
            res.txt = U.escolha(JEITOS_GOL);
            return res;
        }
        if (la && la.o.ass && m.usuario != null && lado === Partida.ladoDoUsuario(m)) {
            for (const [re, txt] of LANCE_ASSIST) if (re.test(la.o.txt)) { res.txt = txt; return res; }
            res.txt = U.escolha(JEITOS_GOL);
            return res;
        }
        // gols da simulação: às vezes sai um golaço
        if (!la && U.chance(PartidaExtras.chanceGolaco(m, autor))) {
            const slot = Partida.slotDe(m, lado, autor.id);
            const tipo = U.pesado(Object.keys(GOLACOS), k => (GOLACOS[k].peso[slot] || 0) * (k === 'fora' ? (px.clima === 'neblina' ? 0.2 : px.clima === 'chuva' ? 1.4 : 1) : 1));
            if (GOLACOS[tipo].peso[slot]) {
                res.golaco = tipo;
                res.txt = U.escolha(GOLACOS[tipo].txt);
                res.semAssist = !!GOLACOS[tipo].semAssist;
                return res;
            }
        }
        // gol comum: o clima e as instruções mudam a narração
        const c = px.clima, I = px.instr[lado];
        if (c === 'chuva' && U.chance(0.3)) res.txt = U.escolha(['aproveita a bola que escorregou das mãos do goleiro na chuva!', 'chuta, a bola quica na poça e engana o goleiro!', 'pega a sobra depois que o zagueiro escorregou no gramado molhado!']);
        else if (c === 'gramado' && U.chance(0.25)) res.txt = 'chuta, a bola quica num buraco do gramado e engana o goleiro!';
        else if (c === 'neblina' && U.chance(0.2)) res.txt = 'aparece do meio da neblina e marca!';
        else if (I && I.plano === 'pontas' && U.chance(0.4)) res.txt = U.escolha(['sobe mais alto que a zaga e cabeceia após cruzamento da ponta!', 'completa de cabeça o cruzamento que veio da linha de fundo!']);
        else res.txt = U.escolha(JEITOS_GOL);
        return res;
    },

    // depois de criado o evento do gol: golaço e gol decisivo no fim
    marcarGol(m, ev, jeito) {
        const px = m.px;
        if (!px) return;
        if (m.lanceAtual || px.cobranca) ev.semVar = true;
        if (jeito.golaco) {
            ev.golaco = jeito.golaco;
            ev.cls = 'ev-golaco';
            m.bonus[ev.pid] = (m.bonus[ev.pid] || 0) + 0.3;
            PartidaExtras.registrarGolaco(m, ev);
        }
        const l = ev.lado;
        if ((m.final || m.classico) && m.min >= 80) {
            const d = m.gols[l] - m.gols[1 - l];
            if (d === 1 || (d === 0 && m.copa)) {
                ev.decisivo = d === 1 ? 'frente' : 'empate';
                px.decisivos.push(ev);
            }
        }
    },

    registrarGolaco(m, ev) {
        const s = m.s, G = GOLACOS[ev.golaco], autor = s.jog[ev.pid];
        if (!G || !autor) return;
        const selecao = m.jogo.tipo === 'selecao';
        const t = s.times[ev.lado ? m.a : m.h];
        // em jogo de seleção o time é temporário: guarda o clube do jogador
        const reg = {
            ano: s.ano, sem: s.semana, pid: autor.id, nome: autor.nome,
            tid: selecao ? (autor.tid >= 0 ? autor.tid : -1) : t.id,
            txt: `${G.icone} ${G.nome} · ${s.times[m.h].nome} x ${s.times[m.a].nome}, aos ${m.min}'`,
        };
        s.golacos = s.golacos || [];
        s.golacos.push(reg);
        if (s.golacos.length > MAX_GOLACOS) s.golacos.splice(0, s.golacos.length - MAX_GOLACOS);
        m.px.golacos.push({ pid: autor.id, nome: autor.nome, tipo: ev.golaco, lado: ev.lado, min: m.min, ev, reg });
    },

    desfazerGolaco(m, ev) {
        const i = m.px.golacos.findIndex(g => g.ev === ev);
        if (i < 0) return;
        const g = m.px.golacos[i];
        const k = (m.s.golacos || []).lastIndexOf(g.reg);
        if (k >= 0) m.s.golacos.splice(k, 1);
        m.px.golacos.splice(i, 1);
    },

    // -----------------------------------------------------------------
    //  Fim do jogo (chamado no fim de Partida.finalizar)
    // -----------------------------------------------------------------
    finalizar(s, m, r) {
        const px = m.px;
        if (!px) return;
        // cansaço extra: calor e pressão total
        for (const pid of Object.keys(m.st)) {
            const st = m.st[pid], p = s.jog[pid];
            if (!p) continue;
            const minutos = (st.saiu != null ? st.saiu : 90) - st.entrou;
            let extra = 0;
            if (px.clima === 'calor') extra += minutos / 90 * 5;
            if (px.minPressao[st.lado]) extra += Math.min(px.minPressao[st.lado], minutos) / 90 * 9;
            if (extra >= 1) p.cond = Math.max(30, p.cond - Math.round(extra));
        }
        const golacos = px.golacos.filter(g => !g.ev.anulado);
        const nomeJogo = `${s.times[m.h].nome} x ${s.times[m.a].nome}`;
        if (px.ver && m.jogo.tipo !== 'selecao') {
            for (const g of golacos) Mundo.noticia(s, `🌟 Golaço de ${g.nome} (${GOLACOS[g.tipo].nome.toLowerCase()}) em ${nomeJogo}.`, 'geral');
        }
        const ctl = m.controle;
        if (s.modo === 'tecnico' && s.car && ctl >= 0) {
            const meu = ctl === 0 ? m.h : m.a;
            const ch = px.chaveSusp, daSelecao = ch === 'suspTecSel' ? ' da seleção' : '';
            if (px.tecSusp) {
                s.car[ch] = Math.max(0, (s.car[ch] || 0) - 1);
                Vida.log(s, `✅ Você cumpriu a suspensão${daSelecao} (viu o jogo da tribuna).`, '');
            } else if (px.tecExpulso[ctl]) {
                px.multa = U.redondo(Math.max(5000, (s.car.sal || 0) * 0.02));
                s.pessoa.dinheiro -= px.multa;
                s.car[ch] = 1;
                // a diretoria do clube não gosta; na seleção, quem reclama é a federação (só a multa)
                if (!daSelecao) s.car.conf = U.clamp((s.car.conf != null ? s.car.conf : 50) - 2, 0, 100);
                Conquistas.contar(s, 'expulsoesTecnico');
                Vida.log(s, `🟥 Você foi expulso reclamando com o árbitro (${nomeJogo}): multa de ${U.dinheiro(px.multa)} e suspensão no próximo jogo${daSelecao}.`, 'ruim');
            }
            if (r.venc === meu) {
                if (px.instrPerdendo[ctl]) Conquistas.contar(s, 'viradasTaticas');
                if (px.decisivos.some(e => !e.anulado && e.lado === ctl)) Conquistas.contar(s, 'vitoriasNoFim');
            }
        }
        if (s.modo === 'jogador' && s.car && m.usuario != null && m.usuario === s.car.pid) {
            const lu = Partida.ladoDoUsuario(m);
            const meu = lu === 0 ? m.h : m.a;
            if (r.venc === meu && px.decisivos.some(e => !e.anulado && e.pid === m.usuario)) Conquistas.contar(s, 'golsDecisivos');
            for (const g of golacos) {
                if (g.pid !== m.usuario) continue;
                Conquistas.contar(s, 'golacos');
                if (g.tipo === 'bicicleta') Conquistas.contar(s, 'bicicletas');
                Vida.mudar(s, { fama: 1.5 });
                Vida.log(s, `🌟 GOLAÇO (${GOLACOS[g.tipo].nome.toLowerCase()}) no jogo ${nomeJogo}! O vídeo do seu gol viralizou nas redes.`, 'bom');
            }
        }
    },

    // =================================================================
    //  TELA DA PARTIDA
    // =================================================================
    novaTela(tela) {
        tela.destaques = Jogo.opcoes.destaques !== false;
        tela.reclamar = null;
        tela.segurar = 0;
        tela.avisouReta = false;
    },

    // modo destaques: corre enquanto não acontece nada importante
    turbo(tela) {
        if (!tela.destaques) return false;
        const m = tela.m;
        // técnico: a reta final de jogo apertado volta ao ritmo normal
        if (m.controle >= 0 && m.min >= 80 && Math.abs(m.gols[0] - m.gols[1]) <= 1 && !PartidaExtras.bloqueado(m)) return false;
        // dá tempo de reclamar do lance polêmico
        if (PartidaExtras.reclamacaoAtiva(tela)) return false;
        return true;
    },

    importante(tela, evs) {
        const m = tela.m;
        return evs.some(e => e.tipo === 'gol' || e.tipo === 'var' || e.tipo === 'vermelho' || e.tipo === 'tecnico' || e.polemica != null
            || (m.controle >= 0 && e.tipo === 'lesao')
            || (m.controle >= 0 && e.tipo === 'instr' && e.lado !== m.controle)   // o técnico rival mudou o jeito de jogar
            || (m.usuario != null && e.pid === m.usuario && (e.tipo === 'sub' || e.tipo === 'lesao' || e.tipo === 'amarelo')));
    },

    // avança 1 minuto (ou alguns, no modo destaques, até acontecer algo)
    passos(tela) {
        const m = tela.m;
        const max = PartidaExtras.turbo(tela) ? 3 : 1;
        const r = { eventos: [], pausa: null };
        for (let k = 0; k < max; k++) {
            const x = Partida.passo(m);
            r.eventos.push(...x.eventos);
            r.pausa = x.pausa;
            if (x.pausa || PartidaExtras.importante(tela, x.eventos) || !PartidaExtras.turbo(tela)) break;
        }
        return r;
    },

    // tempo até o próximo minuto: segura a tela nos lances importantes
    atraso(tela, r) {
        const m = tela.m;
        const base = VELOCIDADES[Jogo.opcoes.velocidade] || 300;
        let espera = tela.segurar || 0;
        tela.segurar = 0;
        if (r && r.eventos.length) {
            const evs = r.eventos;
            const gol = evs.some(e => e.tipo === 'gol' && !e.anulado);
            if (evs.some(e => e.tipo === 'var')) espera = Math.max(espera, 2500 + (gol ? 1700 : 0));
            if (tela.destaques) {
                if (gol) espera = Math.max(espera, 1800);
                else if (PartidaExtras.importante(tela, evs)) espera = Math.max(espera, 1100);
            }
            if (tela.reclamar && evs.indexOf(tela.reclamar.ev) >= 0) espera = Math.max(espera, 2400);
        }
        // janela para reclamar: o relógio anda devagar (em qualquer velocidade)
        if (PartidaExtras.reclamacaoAtiva(tela)) espera = Math.max(espera, 800);
        if (PartidaExtras.turbo(tela)) return Math.max(espera, 40);
        return Math.max(espera, base);
    },

    depoisDoTick(tela, r) {
        const m = tela.m, px = m.px;
        if (!px) return;
        const v = r.eventos.filter(e => e.tipo === 'var').pop();
        if (v) PartidaExtras.overlayVar(m, v, r.eventos.some(e => e.tipo === 'gol') ? 1700 : 0);
        const l = m.controle;
        if (l >= 0 && !px.tecExpulso[l] && px.reclamacoes < 2) {
            const pol = r.eventos.find(e => e.polemica === l);
            if (pol) { tela.reclamar = { ev: pol, min: m.min }; tela.atualizar(); }
        }
        if (m.usuario != null && r.eventos.some(e => e.tipo === 'sub' && e.pid === m.usuario)) UI.toast('🔼 Você entrou em campo! Agora é com você.');
        if (tela.destaques && l >= 0 && !tela.avisouReta && m.min >= 80 && !m.terminou && !PartidaExtras.turbo(tela)) {
            tela.avisouReta = true;
            UI.toast('⏱️ Reta final com jogo apertado: o relógio volta ao ritmo normal.');
        }
    },

    reclamacaoAtiva(tela) {
        const r = tela.reclamar, m = tela.m;
        return !!(r && m && !m.terminou && !PartidaExtras.bloqueado(m) && m.min <= r.min + 3);
    },

    // resultado do lance do jogador sem modal (modo destaques)
    avisoLance(tela, r) {
        if (!tela.destaques) return false;
        UI.toast(`${r.bom ? '🔥' : '😓'} ${r.txt}`);
        tela.segurar = Math.max(tela.segurar || 0, r.eventos.some(e => e.tipo === 'gol') ? 1800 : 1300);
        return true;
    },

    // comemoração especial: golaço do usuário ou gol decisivo no fim de final/clássico
    festa(tela, ev) {
        const m = tela.m;
        if (!m.px || ev.anulado || (!ev.golaco && !ev.decisivo)) return false;
        // técnico: qualquer gol especial do time · jogador: golaço só se for dele; gol decisivo do time também vale festa
        let nosso = false;
        if (m.controle >= 0) nosso = ev.lado === m.controle;
        else if (m.usuario != null) nosso = ev.pid === m.usuario || (!!ev.decisivo && ev.lado === Partida.ladoDoUsuario(m));
        if (!nosso) return false;
        const t = m.s.times[ev.lado ? m.a : m.h];
        PartidaExtras.overlayFesta(t, m.s.jog[ev.pid], ev);
        tela.segurar = Math.max(tela.segurar || 0, 3000);
        return true;
    },

    overlayFesta(t, autor, ev) {
        const G = ev.golaco ? GOLACOS[ev.golaco] : null;
        const selo = G ? (ev.decisivo ? '🌟 GOLAÇO NO FIM!' : '🌟 GOLAÇO!') : ev.decisivo === 'empate' ? '⏱️ EMPATOU NO FIM!' : '⏱️ NO FIM DO JOGO!';
        const sub = G ? `${G.icone} ${G.chamada}` : `⏱️ AOS ${ev.min} MINUTOS!`;
        Som.tocar('gol');
        setTimeout(() => Som.tocar(G ? 'conquista' : 'torcida'), 400);
        const nome = autor ? autor.nome : '';
        if (!Efeitos.ligado()) { UI.toast(`${selo} ${U.esc(nome)} — ${sub}`); return; }
        const d = document.createElement('div');
        d.className = 'gol-overlay nosso px-festa';
        d.style.setProperty('--c1', t.c1);
        d.style.setProperty('--c2', t.c2);
        d.innerHTML = `<canvas class="px-confete"></canvas><div class="px-festa-selo">${selo}</div><span>GOOOL!</span>
            <b class="px-festa-tipo">${sub}</b><small>${U.esc(nome)} · ${U.esc(t.nome)}</small>`;
        const raiz = document.getElementById('jogo');
        if (!raiz) return;
        raiz.appendChild(d);
        const cv = d.querySelector('canvas');
        if (cv) Cena.confete(cv, [t.c1, t.c2, '#ffd700', '#ffffff'], 150);
        setTimeout(() => d.remove(), 3000);
    },

    overlayVar(m, v, atraso) {
        const res = { anulado: ['❌', 'GOL ANULADO'], confirmado: ['✅', 'GOL CONFIRMADO'], penalti: ['⚠️', 'PÊNALTI!'] }[v.var];
        if (!res) return;
        const lu = m.controle >= 0 ? m.controle : Partida.ladoDoUsuario(m);
        const nosso = v.lado === lu;
        const mostrar = () => {
            if (TelaPartida.m !== m) return;
            Som.tocar('virar');
            const somFim = v.var === 'penalti' ? 'apito' : (v.var === 'anulado') === nosso ? 'golContra' : 'torcida';
            setTimeout(() => Som.tocar(somFim), 1200);
            if (!Efeitos.ligado()) { UI.toast(`📺 VAR: ${res[0]} ${res[1]}`); return; }
            const d = document.createElement('div');
            d.className = `px-var px-var-${v.var}`;
            d.innerHTML = `<div class="px-var-caixa"><div class="px-var-topo">📺 <b>VAR</b></div>
                <div class="px-var-checando">Revisando o lance<i>.</i><i>.</i><i>.</i></div>
                <div class="px-var-res">${res[0]} ${res[1]}</div><div class="px-var-barra"></div></div>`;
            const raiz = document.getElementById('jogo');
            if (!raiz) return;
            raiz.appendChild(d);
            setTimeout(() => d.remove(), 2500);
        };
        if (atraso) setTimeout(mostrar, atraso); else mostrar();
    },

    overlayExpulsao() {
        Som.tocar('apito');
        if (!Efeitos.ligado()) return;
        const d = document.createElement('div');
        d.className = 'px-var px-var-expulso';
        d.innerHTML = '<div class="px-cartao-vermelho"></div><div class="px-var-caixa"><div class="px-var-res">🟥 TÉCNICO EXPULSO!</div></div>';
        const raiz = document.getElementById('jogo');
        if (!raiz) return;
        raiz.appendChild(d);
        setTimeout(() => d.remove(), 2200);
    },

    // -----------------------------------------------------------------
    //  Pedaços da tela
    // -----------------------------------------------------------------
    selo(m) {
        const c = m.px && CLIMAS[m.px.clima];
        return c ? `<div class="px-selo-clima" title="${U.esc(c.desc)}">${c.icone} ${c.curto}</div>` : '';
    },

    htmlPreJogo(m) {
        const px = m.px;
        if (!px) return '';
        const c = CLIMAS[px.clima];
        let html = `<div class="px-clima"><span class="px-clima-ic">${c.icone}</span><div><b>${c.nome}</b><small>${c.desc}</small></div></div>`;
        const l = m.controle;
        if (l >= 0) {
            const cq = PartidaExtras.craque(m, 1 - l);
            if (cq) html += `<p class="pequeno">⭐ Craque deles: <b>${U.esc(cq.nome)}</b> (${cq.pos}, OVR ${cq.ovr})</p>`;
            if (px.tecSusp) html += '<p class="px-aviso-susp">🟥 Você está suspenso: vê o jogo da tribuna e o auxiliar comanda o time (sem trocas nem instruções).</p>';
            else html += '<p class="cinza pequeno">📣 Durante o jogo dá para dar <b>instruções</b>: marcar o craque deles, jogar pelas pontas, segurar o resultado ou pressão total.</p>';
        }
        return `<div class="px-pre">${html}</div>`;
    },

    botaoDestaques(tela) {
        return `<button class="btn btn-pequeno px-destaques ${tela.destaques ? 'ativo' : ''}" data-acao="pxDestaques" title="Modo destaques: o jogo corre e só para nos lances importantes (gols, VAR, expulsões e os seus lances)">🎬 <span class="px-dest-txt">Destaques</span> <span class="px-onoff">${tela.destaques ? 'ON' : 'OFF'}</span></button>`;
    },

    iconeGas(g) {
        return g >= 70 ? '💨' : g >= 40 ? '😮‍💨' : '🥵';
    },

    chipsInstr(m, l, semRotulo) {
        const px = m.px;
        const I = px.instr[l] || {};
        const chips = Object.keys(INSTRUCOES).map(k => {
            const d = INSTRUCOES[k];
            const on = k === 'marcar' ? !!I.marcar : I.plano === k;
            let longo = d.nome, curto = d.curto, tit = d.desc;
            if (k === 'marcar' && on && px.marca[l]) {
                const alvo = m.s.jog[px.marca[l].alvo], marc = m.s.jog[px.marca[l].marcador];
                longo = `Marcando ${alvo.nome.split(' ').slice(-1)[0]}`;
                tit = `${marc.nome} está colado em ${alvo.nome}. ${d.desc}`;
            }
            const gas = k === 'pressao' && (on || px.gas[l] < 100) ? ` <small class="px-gas" title="Fôlego do time">${PartidaExtras.iconeGas(px.gas[l])}</small>` : '';
            return `<button class="chip-btn px-chip ${on ? 'ativo' : ''}" data-acao="pxInstr" data-i="${k}" title="${U.esc(tit)}">${d.icone} <span class="px-longo">${U.esc(longo)}</span><span class="px-curto">${U.esc(curto)}</span>${gas}</button>`;
        }).join('');
        return (semRotulo ? '' : '<span class="px-rot">📣 Instruções:</span>') + chips;
    },

    // linhas extras dos controles (técnico): instruções, polêmica e expulsão
    htmlControles(tela) {
        const m = tela.m, px = m.px, l = m.controle;
        if (!px || l < 0) return '';
        if (px.tecExpulso[l]) {
            return `<div class="px-linha px-expulso">${px.tecSusp ? '🟥 Suspenso: você vê o jogo da tribuna. O auxiliar comanda o time.' : '🟥 Você foi expulso! O auxiliar comanda o time: sem substituições nem instruções.'}</div>`;
        }
        let html = '';
        if (PartidaExtras.reclamacaoAtiva(tela)) {
            html += `<div class="px-linha px-polemica"><span>😤 Lance polêmico contra o seu time!</span>
                <button class="btn btn-pequeno btn-perigo" data-acao="pxReclamar" title="Pode dar raça ao time... ou cartão para você">😤 Reclamar com o árbitro</button></div>`;
        }
        return html + `<div class="px-linha px-instr">${PartidaExtras.chipsInstr(m, l)}</div>`;
    },

    htmlFim(m) {
        const px = m.px;
        if (!px) return '';
        const linhas = [];
        if (px.clima !== 'sol') linhas.push(`${CLIMAS[px.clima].icone} ${CLIMAS[px.clima].nome}`);
        const gs = px.golacos.filter(g => !g.ev.anulado);
        if (gs.length) linhas.push('🌟 ' + gs.map(g => `Golaço de <b>${U.esc(g.nome)}</b> (${GOLACOS[g.tipo].nome.toLowerCase()}, ${g.min}')`).join(' · '));
        const v = px.vars;
        if (v.anulados || v.penaltis) linhas.push(`📺 VAR: ${[v.anulados ? `${v.anulados} gol(s) anulado(s)` : '', v.penaltis ? `${v.penaltis} pênalti(s) marcado(s)` : ''].filter(Boolean).join(', ')}`);
        if (px.multa) linhas.push(`<span class="vermelho">🟥 Você foi expulso: multa de ${U.dinheiro(px.multa)} e suspensão no próximo jogo${px.chaveSusp === 'suspTecSel' ? ' da seleção' : ''}.</span>`);
        return linhas.map(x => `<div class="rf-linha">${x}</div>`).join('');
    },

    // vestiário no intervalo: conversa + instruções para o 2º tempo
    perguntaIntervalo(m) {
        const l = m.controle;
        return UI.modal({
            titulo: '<span class="modal-icone">🗣️</span>Intervalo — vestiário',
            html: `<p class="texto-evento">Placar: <b>${U.esc(Partida.placarTxt(m))}</b>.<br>O que você fala para o time?</p>
                <div class="px-intervalo"><small class="cinza">📣 Instruções para o 2º tempo (opcional):</small>
                <div class="px-instr" id="px-instr-intervalo">${PartidaExtras.chipsInstr(m, l, true)}</div></div>`,
            botoes: ['👏 Elogiar o time', '😡 Dar uma bronca', '🧘 Pedir calma e foco'].map((txt, k) => ({ txt, valor: k, classe: 'btn-opcao' })),
            fechavel: false,
            classe: 'modal-evento',
        });
    },
};

Object.assign(ACOES, {
    pxDestaques() {
        const t = TelaPartida;
        if (!t.m) return;
        t.destaques = !t.destaques;
        Jogo.opcoes.destaques = t.destaques;
        Salvar.gravarOpcoes(Jogo.opcoes);
        UI.toast(t.destaques ? '🎬 Modo destaques: o jogo corre e para só nos lances importantes.' : '🎬 Modo destaques desligado: minuto a minuto.');
        if (t.rodando) { t.parar(); t.iniciar(); } else t.atualizar();
    },
    pxInstr(d) {
        const t = TelaPartida, m = t.m;
        if (!m || m.controle < 0 || m.terminou) return;
        if (PartidaExtras.bloqueado(m)) return UI.toast('🟥 Você foi expulso: só o auxiliar pode mexer no time.', 'erro');
        const ev = PartidaExtras.instruir(m, m.controle, d.i);
        if (ev) UI.toast(ev.txt);
        const box = document.getElementById('px-instr-intervalo');
        if (box) box.innerHTML = PartidaExtras.chipsInstr(m, m.controle, true);
        t.atualizar();
    },
    pxReclamar() {
        const t = TelaPartida, m = t.m;
        if (!m) return;
        if (!PartidaExtras.reclamacaoAtiva(t)) { t.reclamar = null; t.atualizar(); return UI.toast('O lance já passou...'); }
        t.reclamar = null;
        const r = PartidaExtras.reclamar(m, m.controle);
        UI.toast(r.ev.txt, r.tipo === 'vermelho' ? 'erro' : '');
        if (r.tipo === 'vermelho') PartidaExtras.overlayExpulsao();
        t.atualizar();
    },
    opDestaques: (d, el) => { Jogo.opcoes.destaques = el.checked; Jogo.gravarOpcoes(); },
});
