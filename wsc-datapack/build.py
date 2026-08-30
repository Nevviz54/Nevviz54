#!/usr/bin/env python3
"""Gera o zip do data pack do World Soccer Champs a partir da pasta pack/.

Estrutura exigida pelo jogo (arquivos na raiz do zip):

    /
    |-- clubs.csv
    |-- players.csv
    |-- stadiums.csv
    |-- competitions.csv
    |-- settings.csv
    |-- adboards/
    |-- club_logos/
    |-- competition_logos/
    +-- trophy_images/
"""

import os
import zipfile

PACK_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "pack")
OUTPUT = os.path.join(os.path.dirname(PACK_DIR), "WSC-DataPack-Champholics-pro.zip")

CSV_FILES = ["settings.csv", "clubs.csv", "competitions.csv", "players.csv", "stadiums.csv"]
IMAGE_DIRS = ["adboards/", "club_logos/", "competition_logos/", "trophy_images/"]


def main():
    with zipfile.ZipFile(OUTPUT, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as z:
        for name in CSV_FILES:
            z.write(os.path.join(PACK_DIR, name), name)
        for name in IMAGE_DIRS:
            entry = zipfile.ZipInfo(name)
            entry.external_attr = (0o40755 << 16) | 0x10
            z.writestr(entry, b"")
    print("gerado:", OUTPUT)


if __name__ == "__main__":
    main()
