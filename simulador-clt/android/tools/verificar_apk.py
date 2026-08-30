#!/usr/bin/env python3
"""
Confere o APK montado a mao.

Como nao ha emulador aqui, a garantia possivel e estrutural: reabrir o APK com
o androguard (parser independente, o mesmo tipo de codigo que ferramentas de
analise usam), confirmar que ele enxerga pacote, activity de lancamento, SDKs e
o bytecode, e que o HTML embarcado bate byte a byte com o original.
"""
import hashlib
import pathlib
import struct
import sys
import zipfile

from loguru import logger
logger.remove()

from androguard.core.apk import APK
from androguard.core.dex import DEX

ERROS = []


def checar(condicao, ok, falha):
    if condicao:
        print(f"  [ok]    {ok}")
    else:
        print(f"  [FALHA] {falha}")
        ERROS.append(falha)


def main(caminho):
    apk_path = pathlib.Path(caminho)
    raiz = apk_path.parents[2]

    print(f"\n  arquivo: {apk_path.name}  ({apk_path.stat().st_size:,} bytes)".replace(",", "."))

    # ---- estrutura do zip -----------------------------------------------
    with zipfile.ZipFile(apk_path) as z:
        nomes = z.namelist()
        ruins = z.testzip()
        html_no_apk = z.read("assets/index.html")
    checar(ruins is None, "zip integro (CRC de todas as entradas confere)", f"entrada corrompida: {ruins}")
    for obrigatorio in ("AndroidManifest.xml", "classes.dex", "assets/index.html"):
        checar(obrigatorio in nomes, f"contem {obrigatorio}", f"falta {obrigatorio}")
    with open(apk_path, "rb") as fh:
        bruto = fh.read()
    checar(b"APK Sig Block 42" in bruto,
           "bloco de assinatura v2 presente no APK", "sem bloco de assinatura v2")

    # ---- exigencias do Android 11+ para o resources.arsc -----------------
    # Precisa continuar STORED e alinhado em 4 bytes DEPOIS de assinado; se a
    # assinatura tivesse deslocado a entrada, a instalacao falharia com
    # INSTALL_PARSE_FAILED_RESOURCES_ARSC_COMPRESSED / _NOT_ALIGNED.
    with zipfile.ZipFile(apk_path) as z:
        info = z.getinfo("resources.arsc")
    checar(info.compress_type == zipfile.ZIP_STORED,
           "resources.arsc sem compressao (exigido no targetSdk 30+)",
           "resources.arsc esta comprimido")
    nome_len, extra_len = struct.unpack_from("<HH", bruto, info.header_offset + 26)
    offset_dados = info.header_offset + 30 + nome_len + extra_len
    checar(offset_dados % 4 == 0,
           f"resources.arsc alinhado em 4 bytes apos assinar (offset {offset_dados})",
           f"resources.arsc desalinhado apos assinar (offset {offset_dados})")

    # ---- o jogo chegou inteiro ------------------------------------------
    original = (raiz / "index.html").read_bytes()
    checar(hashlib.sha256(html_no_apk).hexdigest() == hashlib.sha256(original).hexdigest(),
           f"index.html identico ao original ({len(original):,} bytes)".replace(",", "."),
           "index.html embarcado difere do original")

    # ---- leitura como APK de verdade ------------------------------------
    a = APK(str(apk_path))
    checar(a.is_valid_APK(), "androguard reconhece como APK valido", "androguard rejeitou o APK")
    checar(a.get_package() == "com.dfbg.simuladorcltes",
           f"package = {a.get_package()}", f"package errado: {a.get_package()}")
    checar(a.get_app_name() == "Simulador CLT ES",
           f"nome do app = {a.get_app_name()}", f"nome errado: {a.get_app_name()}")
    principal = a.get_main_activity()
    checar(principal == "com.dfbg.simuladorcltes.MainActivity",
           f"activity de lancamento = {principal}", f"activity de lancamento errada: {principal}")
    checar(str(a.get_min_sdk_version()) == "24",
           f"minSdkVersion = {a.get_min_sdk_version()} (Android 7.0+)",
           f"minSdk errado: {a.get_min_sdk_version()}")
    checar(str(a.get_target_sdk_version()) == "34",
           f"targetSdkVersion = {a.get_target_sdk_version()} (Android 14)",
           f"targetSdk errado: {a.get_target_sdk_version()}")
    checar(a.get_permissions() == [], "nenhuma permissao pedida (jogo 100% offline)",
           f"pediu permissoes: {a.get_permissions()}")

    # ---- icone do launcher ----------------------------------------------
    icones = a.get_app_icon()
    checar(icones == "res/ic_launcher.png",
           f"icone do launcher resolvido = {icones}", f"icone nao resolveu: {icones}")
    checar("res/ic_launcher.png" in nomes, "arquivo do icone presente no APK",
           "arquivo do icone ausente")

    # ---- bytecode --------------------------------------------------------
    dex = DEX(a.get_dex())
    metodos = {f"{m.get_class_name()}->{m.get_name()}" for m in dex.get_methods()}
    for esperado in ("Lcom/dfbg/simuladorcltes/MainActivity;->onCreate",
                     "Lcom/dfbg/simuladorcltes/MainActivity;->lerAsset",
                     "Lcom/dfbg/simuladorcltes/MainActivity;->onKeyDown"):
        checar(esperado in metodos, f"dex contem {esperado.split('->')[1]}()",
               f"dex nao tem {esperado}")

    strings = set(dex.get_strings())
    checar("index.html" in strings, "dex carrega o asset index.html",
           "dex nao referencia index.html")

    print()
    if ERROS:
        print(f"  {len(ERROS)} problema(s) encontrado(s).\n")
        sys.exit(1)
    print("  Todas as conferencias passaram.\n")


if __name__ == "__main__":
    main(sys.argv[1])
