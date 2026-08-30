# APK do Simulador CLT ES

Casca nativa Android que roda o jogo inteiro num `WebView`. O APK pronto fica em
[`../SimuladorCLT-ES.apk`](../SimuladorCLT-ES.apk) (~55 KB).

## Instalar no celular

1. Baixe o `.apk` para o aparelho.
2. Abra o arquivo. O Android vai pedir para permitir a instalação de "apps de
   fontes desconhecidas" para o app que está abrindo o arquivo (Chrome, Arquivos,
   Drive…) — autorize e volte.
3. Instale e abra. **Não precisa de internet e o app não pede nenhuma permissão.**

Requisitos: **Android 7.0 (API 24) ou superior**.

> O APK é assinado com uma chave de desenvolvimento gerada no build, o que basta
> para instalar direto no aparelho. Não serve para publicar na Play Store — lá é
> preciso uma chave de upload própria e um `targetSdk` mantido em dia.

## Como o jogo é carregado

O jogo é um único HTML dentro de `assets/`. Em vez de abrir por `file://` — onde
o WebView trata a página como origem opaca e o `localStorage` pode não persistir,
levando o save embora — a `MainActivity` lê o arquivo e o injeta com
`loadDataWithBaseURL()` numa origem `https://` fixa. O WebView passa a tratar a
página como um site normal e o save do jogo sobrevive a fechar o app.

O `configChanges` do manifesto cobre todas as mudanças de configuração, então
girar a tela **não** recria a Activity nem reinicia a partida.

## Rebuildar

```bash
./build.sh          # gera build/SimuladorCLT-ES.apk
```

Precisa apenas de **JDK 11+** e **Python 3.8+**. A primeira execução baixa as
ferramentas (~19 MB) e cria um virtualenv; as seguintes reaproveitam tudo.

## Por que o build é assim

O Android SDK oficial (`aapt2`, `d8`, `apksigner`, `zipalign`) só é distribuído
pelo `dl.google.com`. Este build não depende dele: monta o APK peça por peça com
artefatos do Maven Central e do PyPI.

| Peça | De onde vem | Para quê |
|---|---|---|
| `dx` 1.7 | `com.google.android.tools:dx` | `.class` → `classes.dex` |
| `android.jar` | `com.google.android:android` | stubs da API para compilar |
| ARSCLib | `io.github.reandroid:ARSCLib` | gerar o `resources.arsc` |
| apksig | `com.android.tools.build:apksig` | assinatura APK Scheme v2 |
| pyaxml | PyPI | `AndroidManifest.xml` → XML binário |
| androguard | PyPI | validação independente do resultado |

Três detalhes que o SDK resolveria sozinho e aqui são feitos à mão:

- **`dx` é de 2012** e só aceita bytecode até Java 6. O código não usa nenhum
  recurso posterior, então o build rebaixa a versão do class file de 52 para 50.
- **`pyaxml` grava `Res_value.size = 0`**, fora da especificação (o `aapt` sempre
  escreve 8), e não conhece referências a recurso. O `compilar_manifesto.py`
  percorre os chunks do AXML corrigindo o `size` e promovendo `android:icon` e
  `android:label` de `INT_HEX` para `TYPE_REFERENCE`.
- **`resources.arsc` precisa ficar descomprimido e alinhado em 4 bytes** a partir
  do `targetSdk` 30, senão a instalação falha. O `empacotar.py` escreve o zip à
  mão preenchendo o campo `extra` do cabeçalho local, como o `zipalign` faria.

## O que foi verificado — e o que não foi

O `build.sh` só termina se todas estas conferências passarem:

- o `AndroidManifest.xml` binário é **reaberto pelo androguard** (implementação
  independente) e cada atributo é conferido tipo a tipo;
- o `resources.arsc` é relido e os ids resolvem para o PNG do ícone e o nome do app;
- o APK assinado é reaberto como APK: pacote, activity de lançamento, `minSdk`,
  `targetSdk`, permissões, ícone e os métodos dentro do `classes.dex`;
- o `resources.arsc` continua STORED e alinhado **depois** de assinado;
- a assinatura v2 valida;
- o `index.html` embarcado bate byte a byte com o original.

**O que não dá para verificar aqui:** não há emulador nem aparelho neste
ambiente, então o APK foi validado estruturalmente, não em execução. A parte HTML
do jogo, essa sim, foi testada num Chromium headless em viewport de celular
(412×915). Se algo der errado na instalação, é aí que eu olharia primeiro.

## Arquivos

```
AndroidManifest.xml           manifesto (texto; o build converte para binário)
src/es/clt/simulador/         a Activity com o WebView
res/ic_launcher.png           ícone do launcher
tools/icone.html              como o ícone foi desenhado (canvas, estilo do jogo)
tools/GerarRecursos.java      resources.arsc via ARSCLib
tools/compilar_manifesto.py   AndroidManifest → AXML + validação
tools/empacotar.py            zip com alinhamento do resources.arsc
tools/Assinar.java            assinatura v2 + verificação
tools/verificar_apk.py        conferência final do APK
build.sh                      orquestra tudo
```
