# Simulador CLT ES — O Peso da Carteira

Jogo 2D de sobrevivência trabalhista capixaba, movido a dados.

**Abra `index.html` no navegador.** Só isso. Sem build, sem npm, sem CDN, sem internet.

📱 **No Android:** instale [`SimuladorCLT-ES.apk`](SimuladorCLT-ES.apk) (~60 KB, Android 7.0+,
sem permissões, funciona offline). Detalhes e como rebuildar em [`android/`](android/).

- 🎲 **5 rolagens** definem sua vida: região (d6), cidade (d6), setor (d6), empresa (d6) e origem (2d6).
- 🗺️ **6 regiões do ES · 36 cidades reais**, cada uma com aluguel, passagem, clima, cenário 2D e vantagem/desvantagem próprios.
- 🏗️ **16 setores · 96 cargos** baseados em profissões reais da economia capixaba. Você **sempre** começa no degrau mais baixo.
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
