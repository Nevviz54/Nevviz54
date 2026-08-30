#!/usr/bin/env python3
"""
Monta o zip do APK com controle total de compressao e alinhamento.

Duas regras do Android que o zipfile padrao nao garante e que, se quebradas,
fazem a instalacao falhar em Android 11+ (targetSdk 30+):

  1. resources.arsc precisa ficar STORED (sem compressao);
  2. e comecar num offset multiplo de 4, para o sistema conseguir mapear a
     tabela direto da memoria.

O alinhamento e feito como o zipalign faz: preenchendo o campo "extra" do
cabecalho local ate o offset dos dados cair no multiplo certo.
"""
import binascii
import os
import struct
import sys
import zlib

ALINHAR = {"resources.arsc": 4}          # nome -> alinhamento exigido
SEM_COMPRIMIR = {"resources.arsc", "res/ic_launcher.png"}
ID_EXTRA_ALINHAMENTO = 0xD935            # mesmo marcador usado pelo zipalign


def _extra_de_alinhamento(offset_dados, alinhamento):
    resto = offset_dados % alinhamento
    if resto == 0:
        return b""
    falta = alinhamento - resto
    if falta < 4:                        # cabe o cabecalho do campo extra?
        falta += alinhamento
    return struct.pack("<HH", ID_EXTRA_ALINHAMENTO, falta - 4) + b"\0" * (falta - 4)


def empacotar(base, entradas, destino):
    saida = open(destino, "wb")
    central = []
    try:
        for nome in entradas:
            with open(os.path.join(base, nome), "rb") as fh:
                bruto = fh.read()
            crc = binascii.crc32(bruto) & 0xFFFFFFFF
            comprimir = nome not in SEM_COMPRIMIR
            if comprimir:
                co = zlib.compressobj(9, zlib.DEFLATED, -15)
                dados = co.compress(bruto) + co.flush()
                metodo = 8
            else:
                dados, metodo = bruto, 0

            nome_b = nome.encode("utf-8")
            offset_local = saida.tell()
            extra = b""
            if nome in ALINHAR:
                extra = _extra_de_alinhamento(
                    offset_local + 30 + len(nome_b), ALINHAR[nome])

            saida.write(struct.pack("<IHHHHHIIIHH", 0x04034B50, 20, 0, metodo,
                                    0, 0x0021, crc, len(dados), len(bruto),
                                    len(nome_b), len(extra)))
            saida.write(nome_b)
            saida.write(extra)
            offset_dados = saida.tell()
            saida.write(dados)

            if nome in ALINHAR and offset_dados % ALINHAR[nome] != 0:
                raise SystemExit(f"FALHA: {nome} ficou no offset {offset_dados}, "
                                 f"nao multiplo de {ALINHAR[nome]}")

            marca = "STORED" if metodo == 0 else "deflate"
            alin = f" offset {offset_dados} (alinhado)" if nome in ALINHAR else ""
            print(f"     {nome:24s} {marca:8s} {len(bruto):>7,} -> {len(dados):>7,} bytes{alin}"
                  .replace(",", "."))

            central.append(struct.pack("<IHHHHHHIIIHHHHHII", 0x02014B50, 20, 20, 0,
                                       metodo, 0, 0x0021, crc, len(dados), len(bruto),
                                       len(nome_b), len(extra), 0, 0, 0, 0, offset_local)
                           + nome_b + extra)

        inicio_central = saida.tell()
        for reg in central:
            saida.write(reg)
        tamanho_central = saida.tell() - inicio_central
        saida.write(struct.pack("<IHHHHIIH", 0x06054B50, 0, 0, len(central),
                                len(central), tamanho_central, inicio_central, 0))
    finally:
        saida.close()
    return os.path.getsize(destino)


def realinhar(origem, destino):
    """
    Reescreve um APK ja assinado com v1 mantendo as entradas e devolvendo o
    alinhamento do resources.arsc.

    O jarsigner reconstroi o zip do zero e joga fora o alinhamento. Como a
    assinatura v1 cobre o *conteudo* de cada entrada, e nao a posicao dela no
    arquivo, reempacotar aqui nao invalida nada - e a v2, que cobre os bytes
    todos, so e aplicada depois disto.
    """
    import zipfile
    with zipfile.ZipFile(origem) as z:
        entradas = [(i.filename, z.read(i.filename), i.compress_type)
                    for i in z.infolist()]

    saida = open(destino, "wb")
    central = []
    try:
        for nome, bruto, metodo_orig in entradas:
            crc = binascii.crc32(bruto) & 0xFFFFFFFF
            comprimir = nome not in SEM_COMPRIMIR and metodo_orig != 0
            if comprimir:
                co = zlib.compressobj(9, zlib.DEFLATED, -15)
                dados = co.compress(bruto) + co.flush()
                metodo = 8
            else:
                dados, metodo = bruto, 0

            nome_b = nome.encode("utf-8")
            offset_local = saida.tell()
            extra = b""
            if nome in ALINHAR:
                extra = _extra_de_alinhamento(
                    offset_local + 30 + len(nome_b), ALINHAR[nome])

            saida.write(struct.pack("<IHHHHHIIIHH", 0x04034B50, 20, 0, metodo,
                                    0, 0x0021, crc, len(dados), len(bruto),
                                    len(nome_b), len(extra)))
            saida.write(nome_b); saida.write(extra)
            offset_dados = saida.tell()
            saida.write(dados)
            if nome in ALINHAR and offset_dados % ALINHAR[nome] != 0:
                raise SystemExit(f"FALHA: {nome} desalinhado ({offset_dados})")
            central.append(struct.pack("<IHHHHHHIIIHHHHHII", 0x02014B50, 20, 20, 0,
                                       metodo, 0, 0x0021, crc, len(dados), len(bruto),
                                       len(nome_b), len(extra), 0, 0, 0, 0, offset_local)
                           + nome_b + extra)

        inicio = saida.tell()
        for reg in central:
            saida.write(reg)
        saida.write(struct.pack("<IHHHHIIH", 0x06054B50, 0, 0, len(central),
                                len(central), saida.tell() - inicio, inicio, 0))
    finally:
        saida.close()
    print(f"     realinhado: {len(entradas)} entradas, "
          f"{os.path.getsize(destino):,} bytes".replace(",", "."))


if __name__ == "__main__":
    if sys.argv[1] == "--realinhar":
        realinhar(sys.argv[2], sys.argv[3])
    else:
        base, destino = sys.argv[1], sys.argv[2]
        minimo = len(sys.argv) > 3 and sys.argv[3] == "1"
        ordem = ["AndroidManifest.xml", "classes.dex", "assets/index.html"] if minimo else \
                ["AndroidManifest.xml", "resources.arsc", "classes.dex",
                 "res/ic_launcher.png", "assets/index.html"]
        total = empacotar(base, ordem, destino)
        print(f"     APK cru: {total:,} bytes".replace(",", "."))
