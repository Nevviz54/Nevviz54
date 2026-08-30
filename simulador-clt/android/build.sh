#!/usr/bin/env bash
# =============================================================================
#  Build do APK do Simulador CLT ES sem Android SDK.
#
#  O SDK oficial so e distribuido pelo dl.google.com. Este script monta o APK
#  usando apenas artefatos do Maven Central + PyPI:
#
#    dx 1.7          (com.google.android.tools:dx)      .class  -> classes.dex
#    android.jar     (com.google.android:android)       stubs para compilar
#    apksig          (com.android.tools.build:apksig)   assinatura v2
#    ARSCLib         (io.github.reandroid:ARSCLib)      resources.arsc
#    pyaxml          (PyPI)                             AndroidManifest -> AXML
#    androguard      (PyPI)                             validacao independente
#
#  Requisitos: JDK 11+ (javac, keytool), Python 3.8+.
#  Uso: ./build.sh   ->   gera build/SimuladorCLT-ES.apk
# =============================================================================
set -euo pipefail

AQUI="$(cd "$(dirname "$0")" && pwd)"
RAIZ="$(dirname "$AQUI")"
LIBS="$AQUI/libs"
OUT="$AQUI/build"
STAGE="$OUT/stage"
CENTRAL="https://repo1.maven.org/maven2"

PKG="es.clt.simulador"
MIN_SDK=24
APK_FINAL="$OUT/SimuladorCLT-ES.apk"

KEYSTORE="$AQUI/keystore/clt.p12"
SENHA="${APK_KEYSTORE_PASS:-simuladorclt}"
ALIAS="clt"

passo(){ printf "\n\033[1;33m==> %s\033[0m\n" "$1"; }

# ---------------------------------------------------------------- dependencias
passo "1/8  Baixando ferramentas do Maven Central"
mkdir -p "$LIBS"
baixar(){ [ -s "$LIBS/$2" ] || curl -fsSL -o "$LIBS/$2" "$CENTRAL/$1"; printf "     %-14s %s\n" "$2" "$(du -h "$LIBS/$2" | cut -f1)"; }
baixar "com/google/android/tools/dx/1.7/dx-1.7.jar"              dx.jar
baixar "com/google/android/android/4.1.1.4/android-4.1.1.4.jar"  android.jar
baixar "com/android/tools/build/apksig/2.3.0/apksig-2.3.0.jar"   apksig.jar
baixar "io/github/reandroid/ARSCLib/1.4.0/ARSCLib-1.4.0.jar"     arsclib.jar

if [ ! -x "$AQUI/venv/bin/python" ]; then
  python3 -m venv "$AQUI/venv"
  "$AQUI/venv/bin/pip" install -q --upgrade pip
  "$AQUI/venv/bin/pip" install -q pyaxml androguard
fi
PY="$AQUI/venv/bin/python"

rm -rf "$OUT"; mkdir -p "$STAGE/assets" "$STAGE/res" "$OUT/classes"

# --------------------------------------------------------------------- compila
passo "2/8  Compilando o codigo Java"
javac -nowarn --release 8 -classpath "$LIBS/android.jar" -d "$OUT/classes" \
      "$AQUI/src/$(echo $PKG | tr . /)"/*.java
# dx 1.7 e de 2012 e so aceita bytecode ate Java 6 (major 50). O codigo nao usa
# nenhum recurso posterior, entao rebaixar a versao do class file e seguro.
find "$OUT/classes" -name '*.class' -exec "$PY" -c '
import sys, pathlib
for a in sys.argv[1:]:
    p = pathlib.Path(a); d = bytearray(p.read_bytes())
    d[6:8] = (50).to_bytes(2, "big"); p.write_bytes(bytes(d))
' {} +
echo "     bytecode rebaixado para major 50 (compativel com o dx)"

passo "3/8  Gerando classes.dex"
java -cp "$LIBS/dx.jar" com.android.dx.command.Main \
     --dex --output="$STAGE/classes.dex" "$OUT/classes"
echo "     classes.dex: $(du -h "$STAGE/classes.dex" | cut -f1)"

# -------------------------------------------------------------------- manifesto
passo "4/8  Gerando resources.arsc (icone e nome do app)"
javac -nowarn -classpath "$LIBS/arsclib.jar" -d "$OUT/classes" "$AQUI/tools/GerarRecursos.java"
java -cp "$LIBS/arsclib.jar:$OUT/classes" GerarRecursos "$STAGE/resources.arsc" | sed 's/^/     /'
cp "$AQUI/res/ic_launcher.png" "$STAGE/res/ic_launcher.png"

passo "5/8  Compilando o AndroidManifest para XML binario"
"$PY" "$AQUI/tools/compilar_manifesto.py" \
      "$AQUI/AndroidManifest.xml" "$STAGE/AndroidManifest.xml"

# ------------------------------------------------------------------------ jogo
passo "6/8  Empacotando (com alinhamento do resources.arsc)"
cp "$RAIZ/index.html" "$STAGE/assets/index.html"
"$PY" "$AQUI/tools/empacotar.py" "$STAGE" "$OUT/nao-assinado.apk"

# ------------------------------------------------------------------- assinatura
passo "7/8  Assinando (APK Signature Scheme v2)"
if [ ! -f "$KEYSTORE" ]; then
  mkdir -p "$(dirname "$KEYSTORE")"
  keytool -genkeypair -keystore "$KEYSTORE" -storetype PKCS12 -alias "$ALIAS" \
    -keyalg RSA -keysize 2048 -sigalg SHA256withRSA -validity 10000 \
    -storepass "$SENHA" -keypass "$SENHA" \
    -dname "CN=Simulador CLT ES, OU=Jogo, O=Nevviz54, L=Vitoria, ST=ES, C=BR" 2>/dev/null
  echo "     chave nova gerada em keystore/clt.p12"
fi
javac -nowarn -classpath "$LIBS/apksig.jar" -d "$OUT/classes" "$AQUI/tools/Assinar.java"
# apksig 2.3.0 usa sun.security.* internamente; o sistema de modulos do JDK 9+
# fecha esses pacotes, entao precisam ser reabertos explicitamente.
java --add-exports java.base/sun.security.x509=ALL-UNNAMED \
     --add-exports java.base/sun.security.pkcs=ALL-UNNAMED \
     --add-exports java.base/sun.security.util=ALL-UNNAMED \
     -cp "$LIBS/apksig.jar:$OUT/classes" Assinar \
     "$OUT/nao-assinado.apk" "$APK_FINAL" "$KEYSTORE" "$SENHA" "$ALIAS" "$MIN_SDK" \
     | sed 's/^/     /'

# ------------------------------------------------------------------- conferencia
passo "8/8  Conferindo o APK final"
"$PY" "$AQUI/tools/verificar_apk.py" "$APK_FINAL"

rm -f "$OUT/nao-assinado.apk"
printf "\n\033[1;32m APK pronto: %s (%s)\033[0m\n\n" "$APK_FINAL" "$(du -h "$APK_FINAL" | cut -f1)"
