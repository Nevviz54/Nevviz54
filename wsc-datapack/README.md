# Data pack para World Soccer Champs

Pacote pronto para importar no World Soccer Champs (Monkey I-Brow Studios), montado a
partir dos CSVs do grupo Champholics.

- Arquivo final: `WSC-DataPack-Champholics-pro.zip` (~696 KB)
- Fonte dos arquivos: `pack/`
- Regerar o zip: `python3 build.py`

## Estrutura dentro do zip

Os arquivos ficam **na raiz do zip**, sem pasta-mãe, como pede a documentação oficial:

```
/
├── clubs.csv
├── players.csv
├── stadiums.csv
├── competitions.csv
├── settings.csv
├── adboards/
├── club_logos/
├── competition_logos/
└── trophy_images/
```

As quatro pastas de imagem vão vazias: este pack só renomeia clubes, competições,
jogadores e estádios. Para adicionar escudos depois, basta colocar os arquivos
`.webp` nomeados pelo ID (ex.: clube de ID `42` → `club_logos/42.webp`) e rodar
`build.py` de novo.

## Formato dos CSVs

Todos são `ID,Nome`, uma linha por registro, sem cabeçalho, UTF-8 e quebra de linha LF:

| Arquivo | Conteúdo | Linhas |
| --- | --- | --- |
| `clubs.csv` | `ClubID,Nome do clube` | 4.119 |
| `competitions.csv` | `CompetitionID,Nome da competição` | 94 |
| `players.csv` | `PlayerID,Nome do jogador` | 60.022 |
| `stadiums.csv` | `StadiumID,Nome do estádio` | 3.270 |
| `settings.csv` | metadados (`DataPackID`, `TemplateName`, `DataPackAuthor`, `DataPackNotes`) | 4 |

`settings.csv` usa `TemplateName,default`, ou seja, o template moderno do jogo.

## Ajustes feitos nos dados originais

- Três nomes de estádio tinham vírgula no próprio nome, o que quebraria o parser
  `ID,Nome`. A vírgula virou hífen:
  - `2621` BBSP Stadium - Rugby Park
  - `8186` Jawaharlal Nehru Stadium - New Delhi
  - `8301` Memorial Park - Mosgiel
- Todos os arquivos ganharam quebra de linha no final (os originais terminavam sem
  `\n`, o que pode fazer o jogo ignorar o último registro).
- Verificado: sem BOM, sem CRLF, sem IDs duplicados, sem linhas vazias, todos os IDs
  numéricos, codificação UTF-8 válida.

## Como importar no jogo

1. Comece a criação de uma nova carreira até a tela de seleção de data pack.
2. Toque em **Import**.
3. O jogo pede um **link direto** para o zip. Suba o arquivo no Google Drive (ou
   similar) e converta para link direto antes de colar.

## Referências

- Instruções oficiais: https://www.monkeyibrowstudios.com/worldsoccerchamps-dp-instructions/v83/instructions.html
- Templates: https://www.monkeyibrowstudios.com/worldsoccerchamps-dp-instructions/v78/templates_index.html
