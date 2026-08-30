# Simulador CLT ES — O Peso da Carteira

Jogo 2D de sobrevivência trabalhista capixaba, movido a dados. Um arquivo só
(`index.html`), sem instalação, sem internet, sem dependência nenhuma: abra no
navegador e jogue.

---

## 1. A premissa

Você é um trabalhador CLT no Espírito Santo. **Você não escolhe nada do começo.**
Os dados decidem a região, a cidade, o setor, a empresa e a sua origem de vida.
E o cargo é **sempre o degrau mais baixo** da escada daquele setor.

O jogo é o que vem depois: bater ponto, aguentar o turno, comer, pagar aluguel,
estudar, fazer rede de contatos e arrancar a promoção antes que a Sanidade,
a Energia ou o locador acabem com você.

---

## 2. As cinco rolagens (d12 cada)

Cinco **dados de doze faces**, lançados **um de cada vez** — o dado gira, para,
revela o resultado, e só então o próximo começa (dá para pular a animação).

Toda lista está ordenada da pior para a melhor opção, então **dado alto = lugar
melhor, setor melhor, firma melhor**. E dentro de cada número ainda há sorteio:
a rolagem mira numa posição da lista e escolhe entre os dois vizinhos, para que
tirar 12 duas vezes não caia sempre no mesmo lugar.

| Dado | Define | Alcance |
|---|---|---|
| `d12` | **Região** | 12 regiões do ES, da mais dura à melhor |
| `d12` | **Cidade** | as **78 cidades reais do estado**, ordenadas dentro da região |
| `d12` | **Setor** | entre os setores daquela cidade, do pior ao melhor emprego |
| `d12` | **Empresa** | 12 empregadores por setor — a posição vale de **−6% a +12%** no salário base |
| `d12` | **Origem** | 12 bagagens de vida, da dívida herdada ao tio na firma |

A soma dos cinco dados (5 a 60) vira sua **nota de sorte** no fim da rolagem:
até 15 "Azar de doer", até 25 "Vida dura", até 35 "Na média capixaba",
até 45 "Sorte boa", acima disso "Sorte grande".

### As 12 regiões, da pior para a melhor

| # | Região | Cidades |
|---|---|---|
| 1 | **Extremo Norte** | Mucurici, Ponto Belo, Montanha, Pinheiros, Boa Esperança, Pedro Canário |
| 2 | **Noroeste do Granito** | Água Doce do Norte, Alto Rio Novo, Mantenópolis, Vila Pavão, Ecoporanga, Barra de São Francisco |
| 3 | **Interior do Rio Doce** | São Domingos do Norte, Águia Branca, Governador Lindenberg, Marilândia, Pancas, Baixo Guandu |
| 4 | **Caparaó** | Divino de São Lourenço, Dores do Rio Preto, Ibitirama, Irupi, Muniz Freire, Ibatiba, Iúna |
| 5 | **Sul Rural** | São José do Calçado, Apiacá, Bom Jesus do Norte, Muqui, Mimoso do Sul, Jerônimo Monteiro, Atílio Vivácqua |
| 6 | **Cafeeira do Norte** | Vila Valério, Rio Bananal, Sooretama, Jaguaré, São Gabriel da Palha, Nova Venécia |
| 7 | **Serrana Central** | Laranja da Terra, Itarana, São Roque do Canaã, Brejetuba, Conceição do Castelo, Itaguaçu, Afonso Cláudio |
| 8 | **Montanhas Capixabas** | Santa Leopoldina, Marechal Floriano, Santa Maria de Jetibá, Santa Teresa, Domingos Martins, Venda Nova do Imigrante |
| 9 | **Sul do Mármore** | Vargem Alta, Guaçuí, Alegre, Castelo, Cachoeiro de Itapemirim |
| 10 | **Litoral Sul** | Rio Novo do Sul, Iconha, Itapemirim, Marataízes, Alfredo Chaves, Piúma, Anchieta, Guarapari, Presidente Kennedy |
| 11 | **Doce e Litoral Norte** | Ibiraçu, Conceição da Barra, João Neiva, Fundão, São Mateus, Colatina, Linhares, Aracruz |
| 12 | **Grande Vitória** | Viana, Cariacica, Serra, Vila Velha, Vitória |

Cada cidade tem aluguel, preço de passagem, multiplicador local de salário,
calor, cenário 2D próprio e vantagem ou desvantagem específica. O **porte da
cidade** também é mecânico: cidade pequena promove mais devagar (não há vaga
acima) e cobra mais caro pelos cursos, porque quase sempre são em outra cidade.

### As 12 origens (d12), da pior para a melhor

Dívida herdada, saiu de casa brigado, ex-estagiário sem reserva, sofá do primo,
pensão do interior, o padrão "só a roupa do corpo", bike velha, moto financiada
(com parcela!), celular bom, recém-formado no técnico, um dinheirinho guardado
e o clássico **tio na firma** — o QI capixaba: Quem Indica.

---

## 3. Os 16 setores e a escada de cargos

Cada setor tem **6 cargos**, do chão de fábrica à supervisão. São 96 cargos no total,
todos baseados em profissões reais da economia capixaba.

| Setor | Degrau 1 (onde você começa) | Degrau 6 (o topo) |
|---|---|---|
| Siderurgia e Metalurgia | Ajudante de Produção | Supervisor de Produção |
| Logística e Porto | Ajudante de Carga e Descarga | Coordenador de Operações |
| Comércio e Varejo | Empacotador | Gerente de Loja |
| Teleatendimento | Atendente de Telemarketing | Coordenador de Célula |
| Construção Civil | Servente de Obra | Técnico em Edificações |
| Petróleo e Gás | Auxiliar de Manutenção | Supervisor de Turno |
| Mármore e Granito | Ajudante de Serraria | Gerente de Planta |
| Agronegócio e Café | Trabalhador Rural | Técnico Agrícola |
| Celulose e Florestal | Auxiliar Florestal | Supervisor de Turno |
| Turismo e Hotelaria | Auxiliar de Cozinha | Gerente de Hotel |
| Saúde | Maqueiro | Coordenador de Enfermagem |
| Bancário e Financeiro | Jovem Aprendiz Bancário | Gerente de Agência |
| Móveis e Madeira | Auxiliar de Marcenaria | Supervisor Industrial |
| Confecção e Têxtil | Auxiliar de Costura | Gerente de Produção |
| Pesca e Frigorífico | Auxiliar de Frigorífico | Gerente de Unidade |
| Transporte e Mobilidade | Auxiliar de Pátio | Encarregado de Tráfego |

Cada setor carrega os adicionais que a CLT prevê pra ele: **insalubridade** (20% do
salário mínimo) na siderurgia, granito, saúde, agro, celulose, frigorífico;
**periculosidade** (30% do salário base) no porto, petróleo, construção e transporte;
**adicional noturno** (20%) em quem vira turno; **comissão** no varejo e na confecção;
**gorjeta** na hotelaria.

---

## 4. O dia

- Cada dia tem **4 Pontos de Ação (PA)**. Ações custam 1 ou 2 PA.
- O mês tem **30 dias**. Dia 1 é segunda-feira; **sábado e domingo são folga**.
- **Bater o Ponto** (2 PA) é o eixo do jogo e só existe em dia útil.
  Ele abre o **minigame do seu setor** — o quanto você vai bem define o
  Desempenho que ganha no dia.
- **Não bater ponto em dia útil = falta injustificada:** +17 Advertência,
  −10 Desempenho e desconto de dia + DSR no holerite.
- **Dormir / Encerrar o Dia** fecha o dia: recupera Energia e Sanidade,
  aumenta a Fome e sorteia um evento aleatório.

O cenário 2D reage: o céu muda conforme os PA gastos (manhã → tarde → noite →
madrugada), o boneco veste a cor do seu setor, ganha capacete nos setores de
risco, fica pálido quando a Sanidade cai e sua quando a Energia despenca. O
skyline muda com a cidade: metrópole, praia, serra, campo, indústria ou porto.

### Atalhos de teclado

| Tecla | Ação |
|---|---|
| `1`–`5` | trocar de aba (Trabalho, Casa, Cidade, Carreira, Grana) |
| `Espaço` | encerrar o dia (e "PARAR!" no minigame do ônibus) |
| `Enter` / `Esc` | fechar o pop-up aberto |

---

## 5. As barras que te matam

| Barra | Como morre |
|---|---|
| **Energia** | chegou a 0 → **Exaustão total** |
| **Sanidade** | chegou a 0 → **Burnout** (afastamento pelo INSS) |
| **Fome** | acima de 90 por 4 dias seguidos → **Colapso por fome** |
| **Advertências** | chegou a 100 → **Demissão por justa causa** (sem FGTS, sem multa) |
| **Aluguel** | atrasado 2 meses seguidos → **Despejo** |

---

## 6. Como subir de cargo

A **avaliação de desempenho acontece no dia 30 de cada mês**. Para ser promovido,
você precisa cumprir **todos** os requisitos ao mesmo tempo:

| Requisito | Como sobe |
|---|---|
| **Desempenho** | bater ponto bem, pocar a meta, hora extra, ajudar colega |
| **Qualificação** | cursos: EAD, SENAI/SENAC, NR de segurança, módulo técnico |
| **Rede de contatos** | ajudar colega, happy hour, LinkedIn, sindicato, pelada, culto |
| **Dias no cargo** | tempo de casa — ninguém promove em uma semana |
| **Advertências abaixo do teto** | ficha suja trava promoção mesmo com Desempenho 100 |

Requisitos por degrau:

| Promoção | Desempenho | Qualificação | Rede | Dias | Advertências (máx) |
|---|---|---|---|---|---|
| 1 → 2 | 55 | 26 | 18 | 26 | 45 |
| 2 → 3 | 62 | 42 | 30 | 30 | 38 |
| 3 → 4 | 68 | 57 | 44 | 34 | 30 |
| 4 → 5 | 75 | 72 | 58 | 38 | 23 |
| 5 → 6 | 82 | 86 | 74 | 44 | 16 |

Use **Pedir Feedback ao Supervisor** pra ver a lista exata do que ainda falta.
(A tabela acima é da dificuldade **CLT** numa cidade de porte médio. No Estágio
os números caem 15% e na Escala 12x36 sobem 12%; e o porte da cidade mexe mais
±12%, para cima no interior e para baixo na Grande Vitória.)

**Duas coisas importantes sobre promoção:**

1. O **Desempenho cai 1 ponto por dia**. A régua da firma nunca para de correr —
   não dá pra bater a meta uma vez e viver de renda.
2. Ao ser promovido, **seu aluguel sobe 12%**. Você "melhorou de endereço".
   O salário sobe mais que isso, mas a vida encarece junto — bem-vindo à
   armadilha do padrão de vida.

---

## 7. A parte CLT de verdade

O jogo simula um holerite com tabelas de referência de 2025 (arredondadas para
fins de jogo, não é consultoria fiscal).

**Calendário do mês:**

| Dia | O que acontece |
|---|---|
| 5 | **Salário** — abre o holerite completo |
| 8 | **Aluguel** |
| 12 | **Contas** (luz, água, internet) |
| 30 | **Avaliação de desempenho** |

**Proventos:** salário base · adicional de insalubridade (20% do mínimo) ·
adicional de periculosidade (30% do base) · horas extras a 50% ·
adicional noturno a 20% · comissão · gorjeta.

**Descontos:** INSS progressivo por faixas · IRRF com desconto simplificado ·
vale-transporte (6% do base) · plano de saúde · adiantamento (vale) ·
parcela do consignado · faltas + DSR.

**FGTS:** 8% do bruto, depositado pela empresa. Não desconta de você e só
aparece no seu bolso se rolar demissão sem justa causa.

**Crédito:** o **Vale** adianta 40% do salário e desconta no dia 5.
O **Consignado** entrega R$ 2.500 na hora e cobra 12 × R$ 260 direto na folha.

---

## 8. Demissão não é game over

**Duas avaliações ruins seguidas** (Desempenho abaixo de 32 ou Advertências em 80+)
= **demissão sem justa causa**. Você recebe FGTS + multa de 40% + aviso prévio,
os dados rolam de novo pro setor e pra empresa, e você recomeça no degrau 1
**na mesma cidade**. A Qualificação continua com você; a Rede perde 25%.

A que acaba a run de vez é a **justa causa** (Advertência em 100): sai sem nada.

---

## 9. Os quatro minigames

| Minigame | Como funciona | Onde aparece |
|---|---|---|
| **Correndo atrás do ônibus** | pare o marcador na faixa verde, 3 tentativas — a faixa encolhe com o cargo e o marcador acelera quando você está sem Energia | setor de transporte |
| **Batendo a meta** | clique nas caixas que acendem antes dos 14 segundos; a meta sobe a cada promoção | siderurgia, construção, granito, agro, móveis, confecção · e a ação "Pocar a Meta" |
| **Cliente difícil** | 3 rodadas de diálogo; escolha a resposta que segura a paciência do cliente | varejo, teleatendimento, saúde, turismo |
| **Conferência de carga** | 5 contas rápidas, 6 segundos cada | porto, petróleo, celulose, pesca, bancário |

Sair mal do minigame do ponto (abaixo de 35%) rende **advertência**.

---

## 10. Como vencer

| Final | Condição |
|---|---|
| 🏆 **Topo da carreira** | chegue ao 6º cargo do setor e feche um mês com Desempenho 70+ |
| 🏆 **Liberdade financeira** | junte R$ 50.000 |
| 🏆 **Dois anos de casa** | sobreviva 24 meses |

Há também **8 conquistas** rastreadas na Ficha do Trabalhador: primeiro ponto,
primeira promoção, três promoções, 40 horas extras, R$ 10.000 guardados,
mês com ficha limpa, cinco cursos e a Fênix Capixaba (ser demitido e voltar a subir).

---

## 11. Dicas de sobrevivência

- Nunca deixe Energia **e** Sanidade abaixo de 25 ao mesmo tempo: um evento ruim fecha a conta.
- Recarregue o cartão **antes** de zerar. Sem passagem o turno cobra dobrado no corpo.
- Curso caro no começo quebra você. Comece pelo EAD e escale.
- Hora extra é armadilha doce: paga bem no dia 5 e queima o mês seguinte.
- Advertência alta trava promoção mesmo com Desempenho 100 — use **Cuidar do EPI/CIPA** e o **Sindicato**.
- Fim de semana é 4 PA livres: é onde se faz curso, rede e bico sem perder Desempenho.
- Antes da avaliação do dia 30, dê uma última puxada no requisito que está mais perto de fechar.

---

## 12. Som, opções e dificuldade

O jogo abre com a vinheta da **D.F.B.G PRODUCTIONS** (~2,4 s, dá pra pular com um
toque ou tecla). Ela pode ser desligada nas opções.

### Som

Não existe nenhum arquivo de áudio: **tudo é sintetizado na hora** com WebAudio,
então o jogo continua sendo um HTML solto que roda offline.

- **Trilha sonora**: duas faixas em loop — uma arrastada em Lá menor no menu e
  uma mais marcada em Ré menor durante o jogo, com baixo, melodia, pad e uma
  percussão que lembra linha de produção. Para nas telas de fim.
- **Efeitos**: clique, troca de aba, rolagem de dados, ação executada, dinheiro
  entrando, dinheiro saindo, ação bloqueada, advertência, dormir, acordar, acerto
  e erro de minigame, promoção, promoção negada, vitória e derrota.

O navegador só libera áudio depois de um gesto seu, então o som começa no
primeiro toque ou tecla — isso é regra do navegador, não do jogo.

### Menu de opções (⚙️ no menu inicial e dentro do jogo)

| Grupo | O que dá pra mexer |
|---|---|
| **Som** | volume da música, volume dos efeitos, silenciar tudo |
| **Imagem** | efeito CRT, animações normais/reduzidas, tamanho da letra (P/M/G) |
| **Jogo** | dificuldade, mostrar ou pular a abertura, confirmar antes de dormir |
| **Dados salvos** | apagar a partida salva, restaurar as opções padrão |
| **Teclado** | lista dos atalhos |

Tudo é salvo no `localStorage` e sobrevive a fechar o jogo — inclusive separado
do save da partida, então começar uma run nova não reseta seu volume.

### As três dificuldades

A dificuldade é **gravada na partida no momento em que você assina a carteira**.
Trocar nas opções vale só para a próxima run — não dá pra fugir de uma derrota
mudando para o fácil no último dia.

| Modo | O que muda | Vitórias de um jogador que erra 20% das escolhas |
|---|---|---|
| **Estágio** | +70% de dinheiro inicial, eventos ruins doem 30% menos, promoção cobra 15% menos, sono recupera 15% mais | 20 em 20 |
| **CLT** | o jogo como foi balanceado | 10 a 14 em 20 |
| **Escala 12x36** | metade do dinheiro inicial, eventos 20% mais frequentes e 35% mais pesados, sono recupera 15% menos, promoção cobra 12% mais | 2 a 3 em 20 |

(Medido com um bot simulando um jogador competente que erra uma escolha a cada
cinco, 20 partidas por modo. Com essa amostra a variação entre medições chega a
±20%, daí a faixa em vez de um número exato.)

---

## 13. Rodando o jogo

### No computador

Abra `index.html` em qualquer navegador moderno. Não precisa de servidor,
build, npm nem conexão. O progresso é salvo sozinho no `localStorage`
(botão **CONTINUAR** no menu).

### No celular (Android)

Instale o `SimuladorCLT-ES.apk` (~55 KB). Requer **Android 7.0 ou superior**.
O app não pede nenhuma permissão e funciona 100% offline.

Como o APK vem de fora da Play Store, o Android vai pedir para você autorizar
"instalar apps de fontes desconhecidas" para o aplicativo que estiver abrindo o
arquivo (Chrome, Arquivos, Drive…). Autorize, volte e instale.

A interface se adapta à tela do celular: HUD compacto de 6 blocos, a cena 2D
fica mais alta e proporcional, e todas as ações e minigames funcionam no toque.
Girar a tela não reinicia a partida.

O código da casca nativa e o script que monta o APK estão em `android/`.
