# Simulador CLT ES — O Peso da Carteira

Jogo 2D de sobrevivência trabalhista capixaba, movido a dados.

**Abra `index.html` no navegador.** Só isso. Sem build, sem npm, sem CDN, sem internet.

📱 **No Android:** instale [`SimuladorCLT-ES.apk`](SimuladorCLT-ES.apk) (~60 KB, Android 7.0+,
sem permissões, funciona offline). Detalhes e como rebuildar em [`android/`](android/).

- 🎲 **5 rolagens de d12**, lançadas uma de cada vez com animação: região, cidade, setor, empresa e origem. **Dado alto = lugar melhor** — e dentro de cada número ainda há sorteio.
- 🗺️ **12 regiões do ES · as 78 cidades reais do estado**, ordenadas da mais dura à melhor, cada uma com aluguel, passagem, clima, cenário 2D e vantagem/desvantagem próprios.
- 🏗️ **16 setores · 96 cargos**, e **77 empresas reais do ES** em 12 cidades (Vale, ArcelorMittal, Suzano, Banestes, Unimed, Frisa, Samarco, Perim…) mais empregadores descritivos nas outras 66. Você **sempre** começa no degrau mais baixo.
- ⭐ **Porte da empresa** em 4 faixas — pequena, média, grande, gigante — vale de −6% a +12% no salário base.
- 📈 **Progressão de carreira**: 5 promoções até o topo, cada uma exigindo Desempenho, Qualificação, Rede, tempo de casa e ficha limpa.
- 🧾 **Holerite CLT de verdade**: insalubridade, periculosidade, hora extra a 50%, adicional noturno, INSS progressivo, IRRF, vale-transporte, FGTS, rescisão.
- 🎮 **4 minigames** (ônibus, meta, cliente difícil, conferência de carga) ligados ao seu setor.
- 🎨 **Cena 2D em canvas**: céu por período do dia, skyline por tipo de cidade, chuva/calor, ônibus passando e um boneco que reage ao seu estado.
- 🔊 **Som sintetizado em WebAudio** — duas trilhas em loop e ~16 efeitos, sem um único arquivo de áudio.
- ⚙️ **Menu de opções completo**: volumes, CRT, animações, tamanho da letra, dificuldade, abertura e dados salvos.
- 🎚️ **Três dificuldades** — Estágio, CLT e Escala 12x36 — gravadas na partida.
- 🎬 Vinheta de abertura da **D.F.B.G PRODUCTIONS**.
- 💾 Save automático no `localStorage`.
- 📱 **APK Android** — o jogo inteiro numa casca `WebView` nativa.

👉 **[Leia o TUTORIAL completo](TUTORIAL.md)** — regras, tabelas de promoção, calendário do mês, finais e dicas.
