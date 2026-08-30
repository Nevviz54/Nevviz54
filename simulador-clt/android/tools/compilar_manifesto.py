#!/usr/bin/env python3
"""
Compila AndroidManifest.xml (texto) para o XML binario (AXML) que o Android le.

Normalmente quem faz isso e o aapt2, que so e distribuido pelo maven da Google.
Aqui usamos o pyaxml (PyPI) e, em seguida, reabrimos o resultado com o
androguard - uma implementacao independente - para conferir tag por tag que os
tipos dos valores sairam certos (INT_DEC, BOOLEAN, INT_HEX e nao string).
"""
import struct
import sys

from loguru import logger
logger.remove()

import pyaxml
from lxml import etree
from androguard.core.axml import AXMLParser, START_TAG, END_DOCUMENT

TIPOS = {0: "NULL", 1: "REFERENCE", 2: "ATTRIBUTE", 3: "STRING", 4: "FLOAT",
         5: "DIMENSION", 6: "FRACTION", 16: "INT_DEC", 17: "INT_HEX", 18: "BOOLEAN"}

# atributos que o PackageManager le como numero/booleano: se sairem como string,
# a instalacao falha ou o valor e ignorado silenciosamente.
# atributos que o PackageManager le com getResourceId(): valor precisa estar
# marcado como TYPE_REFERENCE (0x01), nao como inteiro.
PRECISA_SER_REFERENCIA = {"icon", "label", "theme", "roundIcon", "banner"}

NAO_PODE_SER_STRING = {
    "versionCode", "minSdkVersion", "targetSdkVersion", "maxSdkVersion",
    "exported", "hardwareAccelerated", "allowBackup", "supportsRtl",
    "configChanges", "required", "anyDensity", "smallScreens",
    "normalScreens", "largeScreens", "xlargeScreens",
}


def compilar(origem, destino):
    root = etree.parse(origem).getroot()
    axml = pyaxml.AXML()
    axml.from_xml(root)
    dados = axml.pack()
    with open(destino, "wb") as fh:
        fh.write(dados)
    return dados


TIPO_START_ELEMENT = 0x0102


def normalizar_tamanhos(dados):
    """
    Poe size=8 em todo Res_value dos atributos.

    O pyaxml grava size=0, que foge da especificacao (o aapt sempre escreve 8).
    Percorremos os chunks do AXML e corrigimos campo a campo.
    """
    dados = bytearray(dados)
    u16 = lambda o: struct.unpack_from("<H", dados, o)[0]
    u32 = lambda o: struct.unpack_from("<I", dados, o)[0]

    pos, corrigidos = 8, 0                      # 8 = cabecalho do arquivo
    while pos + 8 <= len(dados):
        tipo, tamanho = u16(pos), u32(pos + 4)
        if tamanho <= 0:
            break
        if tipo == TIPO_START_ELEMENT:
            inicio = pos + 16 + u16(pos + 16 + 8)   # attributeStart
            passo = u16(pos + 16 + 10)              # attributeSize
            quantos = u16(pos + 16 + 12)            # attributeCount
            for i in range(quantos):
                base = inicio + i * passo
                if u16(base + 12) != 8:
                    struct.pack_into("<H", dados, base + 12, 8)
                    corrigidos += 1
        pos += tamanho
    print(f"  campos Res_value.size corrigidos para 8: {corrigidos}")
    return bytes(dados)


def promover_referencias(dados):
    """Troca INT_HEX por REFERENCE nos atributos que apontam para recursos."""
    parser = AXMLParser(bytes(dados))
    alvos = []
    while True:
        evento = next(parser)
        if evento == END_DOCUMENT:
            break
        if evento != START_TAG:
            continue
        for i in range(parser.getAttributeCount()):
            nome = parser.getAttributeName(i)
            if nome in PRECISA_SER_REFERENCIA and parser.getAttributeValueType(i) == 17:
                alvos.append((nome, parser.getAttributeValueData(i)))

    dados = bytearray(dados)
    for nome, valor in alvos:
        antes = struct.pack("<HBBI", 8, 0, 0x11, valor)   # size, res0, INT_HEX, data
        depois = struct.pack("<HBBI", 8, 0, 0x01, valor)  # size, res0, REFERENCE, data
        ocorrencias = dados.count(antes)
        if ocorrencias != 1:
            raise SystemExit(f"FALHA: padrao de {nome}=0x{valor:08x} aparece "
                             f"{ocorrencias}x no AXML (esperado 1)")
        dados = bytearray(dados.replace(antes, depois))
        print(f"  {nome} 0x{valor:08x}: INT_HEX -> REFERENCE")
    return bytes(dados)


def conferir(dados):
    """Re-decodifica com o androguard e valida os tipos. Levanta em caso de erro."""
    parser = AXMLParser(dados)
    problemas, tags = [], 0
    print("  manifesto decodificado de volta:")
    while True:
        evento = next(parser)
        if evento == END_DOCUMENT:
            break
        if evento != START_TAG:
            continue
        tags += 1
        print(f"    <{parser.name}>")
        for i in range(parser.getAttributeCount()):
            nome = parser.getAttributeName(i)
            tipo = parser.getAttributeValueType(i)
            dado = parser.getAttributeValueData(i)
            valor = parser.getAttributeValue(i)
            legivel = valor if tipo == 3 else (hex(dado) if tipo == 17 else dado)
            print(f"        {nome:22s} {TIPOS.get(tipo, tipo):9s} = {legivel}")
            if nome in NAO_PODE_SER_STRING and tipo == 3:
                problemas.append(f"{nome} saiu como STRING (deveria ser numerico/booleano)")
            if nome in PRECISA_SER_REFERENCIA and tipo != 1:
                problemas.append(f"{nome} nao ficou como REFERENCE (tipo {tipo})")
    if tags < 5:
        problemas.append(f"so {tags} tags decodificadas - manifesto truncado?")
    if problemas:
        raise SystemExit("FALHA na validacao do manifesto:\n  - " + "\n  - ".join(problemas))


if __name__ == "__main__":
    origem, destino = sys.argv[1], sys.argv[2]
    dados = compilar(origem, destino)
    print(f"  AXML gerado: {len(dados)} bytes")
    dados = normalizar_tamanhos(dados)
    dados = promover_referencias(dados)
    with open(destino, "wb") as fh:
        fh.write(dados)
    conferir(dados)
    print("  manifesto validado com decodificador independente: OK")
