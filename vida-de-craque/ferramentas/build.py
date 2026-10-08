#!/usr/bin/env python3
# =====================================================================
#  Gera o jogo em UM arquivo .html (para mandar para os amigos).
#
#    python3 ferramentas/build.py                 -> dist/vida-de-craque.html
#    python3 ferramentas/build.py --artifact      -> dist/artifact/vida-de-craque.html
#                                                   (página publicada no Claude)
#    python3 ferramentas/build.py --saida PASTA   -> escolhe a pasta de saída
#
#  Antes de juntar tudo, confere se cada script roda em celular antigo
#  (sintaxe ES2017: iPhone com iOS 11+, Chrome 58+). O vigia de inicialização
#  do index.html tem que ser ES5. Se algo novo demais aparecer, o build para.
# =====================================================================
import json, os, re, subprocess, sys

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
artifact = '--artifact' in sys.argv
saida = sys.argv[sys.argv.index('--saida') + 1] if '--saida' in sys.argv else os.path.join(RAIZ, 'dist')

# acorn (o parser de JavaScript) vem com o eslint/node; procura nos lugares comuns
CONFERE_JS = r"""
const caminhos = ['acorn', '/opt/node-tools/node_modules/acorn', '/opt/node22/lib/node_modules/eslint/node_modules/acorn'];
let acorn = null;
for (const c of caminhos) { try { acorn = require(c); break; } catch (e) {} }
if (!acorn) { console.log(JSON.stringify({ semAcorn: true })); process.exit(0); }
const itens = JSON.parse(require('fs').readFileSync(0, 'utf8'));
const erros = [];
for (const it of itens) {
  try { acorn.parse(it.codigo, { ecmaVersion: it.versao, sourceType: 'script' }); }
  catch (e) { erros.push(it.nome + ' (ES' + it.versao + '): ' + e.message); }
}
console.log(JSON.stringify({ erros }));
"""

def conferir(itens):
    try:
        p = subprocess.run(['node', '-e', CONFERE_JS], input=json.dumps(itens), capture_output=True, text=True, encoding='utf-8')
    except FileNotFoundError:
        print('aviso: node não encontrado, sintaxe não conferida')
        return
    if p.returncode != 0 or not p.stdout.strip():
        sys.exit('ERRO: não deu para conferir a sintaxe dos scripts:\n' + (p.stderr or '(sem saída)'))
    r = json.loads(p.stdout)
    if r.get('semAcorn'):
        print('aviso: acorn não encontrado, sintaxe não conferida')
    elif r.get('erros'):
        sys.exit('ERRO: código novo demais para celulares antigos:\n  ' + '\n  '.join(r['erros']))

html = open(os.path.join(RAIZ, 'index.html'), encoding='utf-8').read()
css = open(os.path.join(RAIZ, 'style.css'), encoding='utf-8').read()

scripts = re.findall(r'<script src="([^"]+)"></script>', html)
inline = re.findall(r'<script>(.*?)</script>', html, re.S)
fontes = {s: open(os.path.join(RAIZ, s), encoding='utf-8').read() for s in scripts}
conferir([{'nome': s, 'codigo': c, 'versao': 2017} for s, c in fontes.items()] +
         [{'nome': 'index.html (vigia)', 'codigo': c, 'versao': 5} for c in inline])

def embutir(m):
    src = fontes[m.group(1)]
    assert '</script' not in src.lower(), m.group(1)
    return '<script>\n/* ' + m.group(1) + ' */\n' + src + '\n</script>'

if not artifact:
    html = html.replace('<link rel="stylesheet" href="style.css">', '<style>\n' + css + '\n</style>')
    html, n = re.subn(r'<script src="([^"]+)"></script>', embutir, html)
    destino = os.path.join(saida, 'vida-de-craque.html')
else:
    # a página publicada recebe só o conteúdo do <body> (o Claude monta o resto)
    corpo = re.search(r'<body[^>]*>(.*?)</body>', html, re.S).group(1)
    corpo, n = re.subn(r'<script src="([^"]+)"></script>', embutir, corpo)
    html = '<title>Vida de Craque</title>\n<style>\n' + css + '\n</style>\n' + corpo.strip() + '\n'
    destino = os.path.join(saida, 'artifact', 'vida-de-craque.html')

os.makedirs(os.path.dirname(destino), exist_ok=True)
open(destino, 'w', encoding='utf-8').write(html)
print(n, 'scripts', len(html.encode()) // 1024, 'KB ->', destino)
