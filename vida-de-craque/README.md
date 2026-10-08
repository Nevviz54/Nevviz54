# ⚽ Vida de Craque

Um **Football Manager** misturado com **BitLife**: você cuida da carreira dentro de campo
(como técnico ou como jogador) e da vida fora dele — família, namoro, dinheiro, fama,
carrões, mansões, polêmicas... Feito em HTML, CSS e JavaScript puro, sem instalar nada.

## ▶️ Como jogar

Abra o arquivo `index.html` com dois cliques. Roda direto no navegador (Chrome, Edge,
Firefox), inclusive sem internet.

Também dá para jogar pela **página publicada no Claude** (link privado da sua conta): lá os
saves ficam na nuvem e funcionam no celular e no PC.

> ⚠️ Visualizadores de arquivo (o do app do Claude, o "abrir arquivo" do celular) bloqueiam o
> salvamento e os downloads. O jogo avisa quando isso acontece; nesse caso use
> **Exportar → Copiar código** ou abra pelo link online / direto no navegador.

### 📤 Mandando o jogo para um amigo

Gere o arquivo único com `python3 ferramentas/build.py` (sai em `dist/vida-de-craque.html`)
e mande para o amigo. O jogo roda em navegadores de 2017 para cá (iPhone com iOS 11+, Chrome 58+)
e não depende de internet para abrir. (Só importar um save feito em outro aparelho pede um
navegador mais novo: iOS 16.4+ ou Chrome 80+.) O que pode dar errado é **onde** o arquivo é aberto:

- **Android**: o WhatsApp/Telegram/Arquivos às vezes abre o `.html` no “HTML Viewer” /
  “Leitor de HTML”, que não roda jogos. Toque em **⋮ → Abrir com → Chrome**.
- **iPhone**: o iPhone não roda arquivos `.html` baixados (a pré-visualização não executa o
  jogo). Mande um **link**: a página publicada no Claude com o compartilhamento ligado
  (Compartilhar → qualquer pessoa com o link) ou o jogo hospedado no GitHub Pages.
- **Computador**: baixe o arquivo e abra com dois cliques no Chrome, Edge, Firefox ou Safari.

Se o jogo não abrir em alguns segundos, a própria tela de carregamento mostra essas instruções
(e, se for erro do navegador, o detalhe técnico e um botão **Tentar de novo**).

## 🌍 O mundo

**22 ligas, 462 clubes e quase 5.000 jogadores reais** (elencos de outubro de 2026):

| País | Divisões |
|------|----------|
| 🇧🇷 Brasil | Série A, B, C e D |
| 🏴 Inglaterra | Premier League, Championship, League One e League Two |
| 🇪🇸 Espanha | LaLiga e LaLiga 2 |
| 🇮🇹 Itália | Serie A e Serie B |
| 🇩🇪 Alemanha | Bundesliga e 2. Bundesliga |
| 🇫🇷 França | Ligue 1 e Ligue 2 |
| 🇳🇱 Holanda | Eredivisie e Eerste Divisie |
| 🇦🇷 Argentina | Liga Profesional e Primera Nacional |
| 🇲🇽 México | Liga MX |
| 🇺🇸 Estados Unidos | MLS (30 clubes, com os do Canadá) |

Tem acesso e rebaixamento entre as divisões (Liga MX e MLS não têm rebaixamento), Bola de
Ouro, artilheiros, jogadores que envelhecem, se aposentam e jovens da base que surgem a cada
temporada. Jogadores reais **sem clube** também aparecem no mercado.

**Taças em disputa** (valem tanto na carreira de técnico quanto na de jogador):

| Tipo | Competições |
|------|-------------|
| Continentais | **Liga dos Campeões**, **Copa Libertadores** (Brasil + Argentina), **Concachampions** (México + EUA) |
| Segunda linha | **Liga Europa** e **Copa Sul-Americana** |
| Supercopas continentais | **Supercopa da UEFA** (Champions x Liga Europa) e **Recopa Sul-Americana** (Libertadores x Sul-Americana) |
| Mundial | **Mundial de Clubes** no fim da temporada: Libertadores x Concachampions na semifinal, e o campeão europeu na final |
| Copas nacionais | Copa do Brasil, FA Cup, Copa del Rey, Coppa Italia, DFB-Pokal, Coupe de France, KNVB Beker, Copa Argentina e US Open Cup |
| Supercopas nacionais | Supercopa do Brasil, Community Shield, Supercopa de España, Supercoppa Italiana, DFL-Supercup, Trophée des Champions, Johan Cruijff Schaal, Supercopa Argentina e Campeón de Campeones |

- **Clássicos** 🔥: cerca de 100 rivalidades reais (Fla-Flu, Grenal, El Clásico, Derby della
  Madonnina, Superclásico...). Clima mais quente, mais cartões e moral em dobro para quem vence.
- **Prêmios** no fim de cada temporada: Bola de Ouro, Prêmio Revelação, Luva de Ouro e Técnico do Ano.

### 🌎 Seleções

**50 seleções** com convocações feitas a partir dos jogadores reais (inclusive os que jogam fora
das ligas do jogo, como Ederson e Bento). Os jogos de seleção são **jogáveis**, tanto na carreira
de jogador quanto na de técnico:

- **Datas FIFA** (semanas 11, 21 e 33): dois jogos de eliminatórias ou amistosos.
- **Torneios no fim da temporada**: **Copa do Mundo** (48 seleções, a cada 4 anos), **Eurocopa** e
  **Copa América** (no ano anterior à Copa), e **Copa Ouro**, **Copa Africana de Nações** e
  **Copa da Ásia** nos anos ímpares. Fase de grupos + mata-mata, com pênaltis.
- Cada jogo pode ser jogado **ao vivo** (com os seus lances, se você for o jogador) ou simulado.

## 📋 Carreira de Técnico

- Escolha **qualquer clube** das 22 ligas.
- **Elenco**: veja overall, potencial, condição, contrato e valor de cada jogador. Renove, venda ou dispense.
- **Tática**: 7 formações, 5 estilos de jogo e escalação manual no campinho (clique na posição e depois no jogador).
- **Mercado**: busque jogadores no mundo todo (filtros por posição, liga, overall, idade, preço) e faça propostas nas janelas de transferência. A busca por nome procura em todos os jogadores, com ou sem clube, sem ligar para acento ("nene" acha o Nenê). Outros clubes também fazem propostas pelos seus jogadores.
- **Finanças**: caixa, receita, folha salarial, premiação.
- **Diretoria**: a confiança sobe e desce com os resultados. Se zerar, você é demitido — e vai ter que esperar propostas de outros clubes.
- **Jogo ao vivo**: narração minuto a minuto, substituições, mudança de postura e conversa no intervalo. Também dá para simular direto.
- **Treino do time**: equilibrado, ataque, defesa, tático, físico ou descanso — cada um dá um bônus diferente nos jogos.
- **Capitão**: escolha o líder do elenco — com ele em campo o time joga melhor (mais ainda se for experiente).
- **Estrutura do clube**: invista em estádio (mais renda e força em casa), CT (jogadores evoluem mais rápido) e categorias de base (joias melhores), do nível 1 ao 5.
- **🌱 Categoria de base**: cada clube já começa com a base formada (nos ~70 maiores clubes, com
  garotos reais do sub-17 e do sub-20). Na aba **Base** você vê o OVR de cada garoto e a faixa de
  **potencial**: o mínimo e o **teto** (que pode chegar a 99). A faixa fica mais precisa com o tempo.
  - **Treino individual**: técnico, físico, tático, finalização, defensivo, goleiros ou mental. Cada
    garoto rende muito mais em um tipo de treino (🔥) e pouco em outro (🐢) — é sorteado para cada um
    e você descobre depois de 3 semanas.
  - Com **17 anos ou mais**, quem fica muito tempo na base pode mandar **mensagem** pedindo uma chance
    no profissional. Suba, prometa uma chance até o fim da temporada, peça paciência ou libere — se
    você não cumprir, ele vai embora. Aos 20 anos é preciso decidir: sobe ou sai.
  - **Subir** ou **liberar** garotos a qualquer momento; todo ano chegam meninos do sub-15.
  - **Peneira**: no fim de cada temporada aparecem 3 garotos; leve um deles para a base.
- **🔭 Olheiros**: contrate até **3 olheiros**, de 1 a 5 estrelas de **competência**. Aparecem
  aleatoriamente para contratar (a lista muda a cada 6 semanas), incluindo nomes reais como Juni
  Calafat, Piet de Visser, Monchi, Luís Campos e Ramón Maddoni. Mande cada um para um país da
  **América do Sul, do Norte, Central, Europa, África, Ásia ou Oceania**, escolhendo a posição
  (**goleiro, zagueiro, lateral, meio ou ataque**). Ele volta com **5 garotos** e você decide quem vai
  para a base. Cada olheiro ganha estrelas de **resultado** conforme a qualidade do que acha, e há
  um ranking de olheiros.
- **🌎 Técnico de seleção**: técnicos bem avaliados recebem convites de seleções — quanto maior a
  sua reputação, maior a seleção. Você comanda a seleção nas Datas FIFA e nos torneios (pode
  acumular com o clube) e pode ser demitido se o aproveitamento for ruim.
- **Departamento médico**: em lesões sérias, decida se paga um tratamento caro para o jogador voltar antes.
- **💬 Vestiário e motivação**: cada jogador tem uma motivação — 🔥 muito motivado, 😀 motivado,
  😐 normal, 😕 desmotivado ou 😠 muito desmotivado — que aparece no elenco e antes de cada partida.
  Quanto mais motivado, melhor ele joga (de −4 a +3,5 de habilidade em campo). O resultado do
  último jogo, o tempo de jogo e as suas conversas mexem na motivação.
- **Conversas individuais**: converse com cada jogador (uma vez por semana). Se ele estiver
  desmotivado, pergunte o porquê — falta de jogos, promessa quebrada, derrotas, fase ruim, salário,
  contrato acabando, problema pessoal — e escolha o que responder. Normal? Dá para motivar, desafiar
  ou prometer titularidade. Cada jogador tem personalidade (profissional, ambicioso, temperamental,
  vaidoso, tranquilo ou líder), e a mesma frase funciona com um e irrita outro.
- **Cobranças por tempo de jogo**: quem passa vários jogos sem entrar manda mensagem cobrando.
  Prometa minutos e ele fica motivado; mas promessa quebrada derruba a motivação dele e a do grupo.
- Coletivas de imprensa, protestos da torcida...

## ⚽ Carreira de Jogador (o lado BitLife)

- Escolha a **idade para começar** (de 16 a 35 anos): mais novo tem mais potencial; mais velho já começa mais pronto e recebe propostas de clubes maiores.
- Escolha o **treino** da semana (leve, normal ou intenso).
- Nas partidas aparecem **lances em que você decide**, com a **chance de cada opção** na tela
  (ex.: "Driblar o goleiro — ⚽ 33% de gol", "Passe curto — ✅ 84% de acerto · ⚠️ risco de gol contra").
  A chance já leva em conta a sua habilidade e as habilidades especiais.
- **Lances de cada posição**: centroavante (pivô, rebote na pequena área), ponta (1 contra 1, contra-ataque),
  meia (tabela, escanteio, falta), volante (bote, saída de bola pressionada), lateral (apoio, marcar o ponta),
  zagueiro (bola nas costas, marcação na área, saída de bola) e goleiro (pênalti, cruzamento, recuo
  pressionado, falta, reposição). Jogada arriscada que dá errado pode virar gol do adversário.
- **Habilidades especiais** ⚡ (12): Finalizador, Cabeça de ouro, Garçom, Batedor oficial, Driblador, Paredão, Xerife, Decisivo, Motorzinho, Corpo blindado, Líder e Estrela da mídia. Você ganha pontos quando evolui, quando é o melhor em campo e quando faz hat-trick.
- **Identidade**: escolha o número da camisa e a sua comemoração de gol (Siuuu, robozinho, dancinha... ou tirar a camisa e levar amarelo 😅).
- **Lesões com decisão**: tratamento caro para voltar antes ou recuperação normal.
- Propostas de outros clubes, renovação de contrato e pedido de aumento.
- **Seleção**: jogando bem, você é convocado e **joga** as Datas FIFA, a Copa do Mundo, a Eurocopa,
  a Copa América e os outros torneios de seleções — ao vivo, com os seus lances.
- Quando se aposentar, você pode **virar técnico** com a mesma pessoa (mesmo dinheiro, fama e família).

## ❤️ Vida

Felicidade, saúde, fama, aparência e dinheiro. Até 3 atividades por semana: academia,
médico, psicólogo, balada, viagens, redes sociais, entrevistas, caridade, cassino,
tatuagem, curso de treinador, procurar namoro. Relacionamentos com pais, irmãos, amigos,
namorada(o), casamento, filhos e até um cachorro. Compre carros, casas e itens de luxo.
Dezenas de eventos aleatórios com escolhas e consequências.

- **Investimentos** 💹: poupança (segura), ações (sobe e desce) e cripto (pode multiplicar... ou derreter).
- **Negócios próprios**: lanchonete, lava-jato, loja de roupas, escolinha de futebol, academia, restaurante, prédio e até rede de hotéis. Dão renda toda semana, mas podem falir.
- **Seguidores** 📱: crescem com a fama e aumentam o valor dos patrocínios.

## 🏅 Conquistas

Mais de 50 conquistas para desbloquear: primeiro gol, hat-trick, 100 gols, Bola de Ouro,
tríplice coroa, invencível, rei do clássico, acesso, cria da casa, rede de olheiros, glória pela
seleção, milionário, casamento, dono de uma ilha,
viver até os 100 anos... Ficam na aba **Conquistas**.

## 🎬 Animações e cutscenes

- **Cutscenes** quando você chega a um clube novo (estádio, escudo, camisa com o seu nome),
  no fim de cada temporada (seus números, campeões das ligas, prêmios, acesso/rebaixamento
  e a virada do ano), em títulos, finais e clássicos, demissão e aposentadoria.
  Clique para avançar, **Pular** (ou ESC) para encerrar.
- **Animações**: efeito ao clicar nos botões, troca de abas suave, dinheiro “pulsando”
  quando entra ou sai, tela de **GOOOL** com as cores do time durante as partidas.
- **Sons** sintetizados (apito, torcida, gol, moedas, conquista) — sem arquivos externos.

## ⚙️ Menu e opções

Aperte **ESC** (ou o botão ⚙️) a qualquer momento para:

- **Salvar** o jogo (5 slots + salvamento automático toda semana). Os saves vão para a nuvem
  (pela página do Claude) ou para o navegador (IndexedDB, com bem mais espaço que antes)
- **Carregar** um jogo salvo
- **Exportar** o save: baixar arquivo `.txt`, compartilhar (celular) ou **copiar o código**
- **Importar**: escolher o arquivo ou **colar o código** (saves `.vdc` antigos também abrem)
- **Opções**: resolução (ajustar à janela, 1024×768, 1280×720, 1366×768, 1600×900, 1920×1080, 2560×1440), tela cheia, tamanho da interface, velocidade das partidas, tema claro/escuro, salvamento automático, sons e volume, cutscenes e animações (dá para desligar)
- **Voltar ao menu principal**

## 📝 Observações sobre os dados

- Os elencos foram atualizados em **outubro de 2026** (temporada 2026/27 na Europa) com pesquisa na internet. Nos clubes grandes das ligas principais estão as contratações da janela do meio de 2026; em alguns clubes menores a pesquisa não achou dados e o elenco ficou o da temporada anterior.
- Nos times grandes estão os jogadores reais mais conhecidos. Para completar 24 jogadores por elenco, o jogo gera garotos da base.
- Nas divisões de baixo (Série D, League One/Two, Eerste Divisie, boa parte da Ligue 2 e Primera Nacional) a maioria dos jogadores tem nome gerado.
- Simplificações: a Série D tem 20 clubes em pontos corridos; a Liga Profesional Argentina e a MLS (30 clubes cada) são disputadas em turno único; a Liga MX é uma temporada só (sem Apertura/Clausura); as copas são mata-mata de jogo único.
- As categorias de base reais (`js/dados/base.js`) vieram de convocações de base, da Copinha, da
  UEFA Youth League e de listas dos clubes; em alguns clubes a pesquisa achou poucos nomes e o
  resto da base é gerado. Os olheiros reais e as estrelas deles são uma brincadeira do jogo.
- Os jogadores ficam em `js/dados/`, no formato `"Nome:POSIÇÃO:idade:overall"`. Dá para editar à vontade!

---

**D.F.B.G PRODUCTIONS**
